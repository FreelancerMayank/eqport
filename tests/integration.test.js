const assert = require('assert');
const http = require('http');

// Set port for test runner
process.env.PORT = '3899';
process.env.DEMO_MODE = 'true'; // ensure predictable sample data when MongoDB is offline
const app = require('../server');

async function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3899,
        path,
        method
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runIntegrationTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting EQPORT v2 End-to-End API Integration Tests     ');
  console.log('🧪 ========================================================\n');

  // Allow server to complete startup and connect
  for (let i = 0; i < 30; i++) {
    try {
      const ping = await makeRequest('/api/health');
      if (ping && ping.statusCode === 200) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  // 1. Dashboard HTML page
  await test('GET / returns HTML dashboard with dark theme, exchange & account filters, and exactly 6 table columns', async () => {
    const res = await makeRequest('/');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('EQPORT'), 'Response should include EQPORT branding');
    assert(res.body.includes('data-theme="dark"'), 'Response should include default dark theme');
    assert(res.body.includes('holdings-table'), 'Response should include holdings table container');
    assert(res.body.includes('portfolio-summary-bar'), 'Response should include summary bar');
    assert(res.body.includes('id="exchange-filters"'), 'Response should include exchange-filters element');
    assert(res.body.includes('id="account-filters"'), 'Response should include account-filters element');

    // Verify exactly 6 table headers in specified order
    const tableHeaderMatch = res.body.match(/<thead[\s\S]*?<\/thead>/i);
    assert(tableHeaderMatch, 'Table should have thead');
    const theadHtml = tableHeaderMatch[0];
    const thMatches = theadHtml.match(/<th[\s\S]*?<\/th>/gi) || [];
    assert.strictEqual(thMatches.length, 6, `Expected exactly 6 table headers, found ${thMatches.length}`);

    // Verify 3 removed columns are absent from table header
    assert(!theadHtml.includes('Invested Amount'), 'Invested Amount column must be absent from table header');
    assert(!theadHtml.includes('Current Value'), 'Current Value column must be absent from table header');
    assert(!theadHtml.includes('PnL (₹)'), 'PnL (₹) column must be absent from table header');

    // Verify entries-per-page selector defaults to 10 records
    assert(res.body.includes('<option value="10" selected>10</option>'), 'Entries per page must default to 10 selected');

    // Verify remaining 6 columns in exact order
    assert(thMatches[0].includes('Account'), 'Column 1 must be Account');
    assert(thMatches[1].includes('Trading Symbol'), 'Column 2 must be Trading Symbol');
    assert(thMatches[2].includes('Total Qty'), 'Column 3 must be Total Qty');
    assert(thMatches[3].includes('Bought Price'), 'Column 4 must be Bought Price');
    assert(thMatches[4].includes('CMP'), 'Column 5 must be CMP');
    assert(thMatches[5].includes('PnL (%)'), 'Column 6 must be PnL (%)');
  });

  // 2. Health Endpoint
  await test('GET /api/health returns database state and status ok', async () => {
    const res = await makeRequest('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.status, 'ok');
    assert(res.json.database != null, 'Response should contain database status');
  });

  // 3. Consolidated Dashboard API
  await test('GET /api/dashboard returns complete snapshot with markets, summary, availableExchanges, availableAccounts, and holdings', async () => {
    const res = await makeRequest('/api/dashboard');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert(Array.isArray(res.json.markets), 'markets should be an array');
    assert(res.json.markets.length > 0, 'markets should not be empty');
    assert(Array.isArray(res.json.availableExchanges), 'availableExchanges should be an array');
    assert(Array.isArray(res.json.availableAccounts), 'availableAccounts should be an array');
    assert(res.json.summary != null, 'summary should be present');
    assert(res.json.summary.totalInvested > 0, 'totalInvested should be greater than 0');
    assert(Array.isArray(res.json.holdings), 'holdings should be an array');
    assert(res.json.holdings.length > 0, 'holdings should not be empty');

    // Verify holdings contain actual trading symbol and do not display brokerToken as symbol
    res.json.holdings.forEach((h) => {
      assert(h.tradingsymbol, 'Holding must have tradingsymbol');
      assert.strictEqual(h.tradingsymbol, h.tradingSymbol, 'tradingsymbol and tradingSymbol properties must match');
      if (h.brokerToken) {
        assert.notStrictEqual(h.tradingsymbol, String(h.brokerToken), `tradingsymbol must not be brokerToken (${h.brokerToken})`);
      }
    });

    // Validate financial summary calculation against holdings
    const sumInv = res.json.holdings.reduce((acc, h) => acc + h.investedamount, 0);
    const sumPnl = res.json.holdings.reduce((acc, h) => acc + h.pnl, 0);
    assert(Math.abs(res.json.summary.totalInvested - sumInv) < 1.0, 'totalInvested should match holdings sum');
    assert(Math.abs(res.json.summary.totalPnl - sumPnl) < 1.0, 'totalPnl should match holdings sum');
  });

  // 4. Dynamic Exchanges Endpoint
  await test('GET /api/exchanges returns discovered exchanges list', async () => {
    const res = await makeRequest('/api/exchanges');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert(Array.isArray(res.json.exchanges), 'exchanges should be an array');
    assert(res.json.exchanges.length > 0, 'exchanges should not be empty');
  });

  // 5. Account Filter in Dashboard API
  await test('GET /api/dashboard?accounts=HG returns holdings only for HG account', async () => {
    const res = await makeRequest('/api/dashboard?accounts=HG');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert(res.json.holdings.every(h => h.alias === 'HG'), 'All holdings should have alias HG');
  });

  // 6. Exchange Filter in Dashboard API
  await test('GET /api/dashboard?exchange=NSE returns holdings only for NSE exchange', async () => {
    const res = await makeRequest('/api/dashboard?exchange=NSE');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert(res.json.holdings.every(h => h.exchange.toUpperCase() === 'NSE'), 'All holdings should be NSE');
  });

  await test('GET /api/dashboard?exchange=MF returns holdings only for MF exchange', async () => {
    const res = await makeRequest('/api/dashboard?exchange=MF');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert(res.json.holdings.every(h => h.exchange.toUpperCase() === 'MF'), 'All holdings should be MF');
  });

  // 7. Combined Exchange and Account Filter in Dashboard API
  await test('GET /api/dashboard?exchange=NSE&accounts=HG returns only HG holdings on NSE', async () => {
    const res = await makeRequest('/api/dashboard?exchange=NSE&accounts=HG');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert(res.json.holdings.every(h => h.alias === 'HG' && h.exchange.toUpperCase() === 'NSE'), 'Must be HG on NSE');
  });

  // 8. Markets Endpoints
  await test('GET /api/market returns market indices list', async () => {
    const res = await makeRequest('/api/market');
    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.json), 'market should return array');
    assert(res.json.some(m => m.name === 'NIFTY'), 'should include NIFTY');
  });

  // 9. Legacy /api/places Endpoint
  await test('GET /api/places returns market indices for 100% backward compatibility', async () => {
    const res = await makeRequest('/api/places');
    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.json), 'places should return array');
  });

  // 10. Legacy /api/data/all Endpoint
  await test('GET /api/data/all returns all holdings', async () => {
    const res = await makeRequest('/api/data/all');
    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.json), 'data/all should return array');
    assert(res.json.length > 0, 'data/all should not be empty');
  });

  // 11. Legacy /api/data/:alias Endpoint
  await test('GET /api/data/kg returns only KG holdings', async () => {
    const res = await makeRequest('/api/data/kg');
    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.json));
    assert(res.json.every(h => h.alias === 'KG'), 'Every item should have alias KG');
  });

  // 12. Legacy Redirects
  await test('GET /hg redirects with 301 to /?account=HG', async () => {
    const res = await makeRequest('/hg');
    assert.strictEqual(res.statusCode, 301);
    assert.strictEqual(res.headers.location, '/?account=HG');
  });

  console.log('\n========================================================');
  console.log(`Integration Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runIntegrationTests();
