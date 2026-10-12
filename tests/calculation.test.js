/**
 * EQPORT v2 Test Suite
 * Validates:
 * 1. Financial calculation correctness
 * 2. Schema field mappings and normalization
 * 3. Dynamic account discovery
 * 4. Account filtering logic
 * 5. Division by zero protection
 */

const assert = require('assert');
const portfolioService = require('../services/portfolio.service');
const { sampleHoldings, sampleMarkets } = require('../services/sample-data');
const portfolioModel = require('../models/portfolio.model');
const placeholderModel = require('../models/placeholder.model');
const scripsModel = require('../models/scrips.model');

function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting EQPORT v2 Financial Calculations & Schema Tests');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  // 1. Schema Definition Tests
  test('Portfolio Schema contains all verified field names with exact casing', () => {
    const paths = Object.keys(portfolioModel.schema.paths);
    const requiredFields = [
      'alias',
      'brokerToken',
      'exchange',
      'tradingsymbol',
      'totalQty',
      'averagePrice',
      'investedamount',
      'closePrice',
      'plpercent',
      'uniqueid',
      'pnl',
      'currentamount',
      'pchg'
    ];
    for (const field of requiredFields) {
      assert(paths.includes(field), `Missing required field: ${field}`);
    }
  });

  test('Placeholder Schema contains all verified market card fields', () => {
    const paths = Object.keys(placeholderModel.schema.paths);
    const requiredFields = ['name', 'value', 'pchg', 'down_stocks', 'up_stocks'];
    for (const field of requiredFields) {
      assert(paths.includes(field), `Missing placeholder field: ${field}`);
    }
  });

  test('Scrips Schema contains all verified scrips fields', () => {
    const paths = Object.keys(scripsModel.schema.paths);
    const requiredFields = ['brokerToken', 'totalQty', 'investedamount', 'averagePrice', 'tradingSymbol', 'weigtage'];
    for (const field of requiredFields) {
      assert(paths.includes(field), `Missing scrips field: ${field}`);
    }
  });

  // 2. Financial Calculation Tests
  test('Portfolio summary calculates totals correctly across holdings', () => {
    const testHoldings = [
      { investedamount: 100000, currentamount: 110000, pnl: 10000 },
      { investedamount: 50000, currentamount: 45000, pnl: -5000 },
      { investedamount: 200000, currentamount: 215000, pnl: 15000 }
    ];

    const summary = portfolioService.calculateSummary(testHoldings);

    assert.strictEqual(summary.totalInvested, 350000);
    assert.strictEqual(summary.currentValue, 370000);
    assert.strictEqual(summary.totalPnl, 20000);
    
    // (20000 / 350000) * 100 = 5.71428... -> 5.71%
    assert.strictEqual(summary.pnlPercent, 5.71);
    assert.strictEqual(summary.totalScrips, 3);
    assert.strictEqual(summary.positiveCount, 2);
    assert.strictEqual(summary.positivePnl, 25000);
    assert.strictEqual(summary.negativeCount, 1);
    assert.strictEqual(summary.negativePnl, -5000);
  });

  test('Division by zero safely handled when invested amount is zero', () => {
    const zeroHoldings = [
      { investedamount: 0, currentamount: 0, pnl: 0 }
    ];
    const summary = portfolioService.calculateSummary(zeroHoldings);
    assert.strictEqual(summary.totalInvested, 0);
    assert.strictEqual(summary.pnlPercent, 0);
  });

  test('Empty holdings array returns zeroed summary metrics without errors', () => {
    const summary = portfolioService.calculateSummary([]);
    assert.strictEqual(summary.totalInvested, 0);
    assert.strictEqual(summary.currentValue, 0);
    assert.strictEqual(summary.totalPnl, 0);
    assert.strictEqual(summary.pnlPercent, 0);
    assert.strictEqual(summary.totalScrips, 0);
    assert.strictEqual(summary.positiveCount, 0);
    assert.strictEqual(summary.negativeCount, 0);
  });

  test('Account filter normalizes string, comma-separated and array formats', () => {
    assert.strictEqual(portfolioService.normalizeAccountFilter(''), 'all');
    assert.strictEqual(portfolioService.normalizeAccountFilter('all'), 'all');
    assert.strictEqual(portfolioService.normalizeAccountFilter('ALL'), 'all');
    assert.deepStrictEqual(portfolioService.normalizeAccountFilter('HG'), ['HG']);
    assert.deepStrictEqual(portfolioService.normalizeAccountFilter('HG,KG'), ['HG', 'KG']);
    assert.deepStrictEqual(portfolioService.normalizeAccountFilter(['HG', 'RG']), ['HG', 'RG']);
    assert.strictEqual(portfolioService.normalizeAccountFilter(['HG', 'all']), 'all');
  });

  test('Holding normalization handles missing currentamount, pnl, and calculates them', () => {
    const rawHolding = {
      alias: 'HG',
      tradingsymbol: 'INFY',
      totalQty: 10,
      averagePrice: 1500,
      closePrice: 1600
    };

    const normalized = portfolioService.normalizeHolding(rawHolding);
    assert.strictEqual(normalized.tradingsymbol, 'INFY');
    assert.strictEqual(normalized.tradingSymbol, 'INFY');
    assert.strictEqual(normalized.investedamount, 15000);
    assert.strictEqual(normalized.currentamount, 16000);
    assert.strictEqual(normalized.pnl, 1000);
    assert.strictEqual(normalized.plpercent, 6.67);
  });

  test('Holding normalization retains human-readable trading symbol and does not overwrite with brokerToken', () => {
    const rawHolding = {
      alias: 'HG',
      brokerToken: 738561,
      exchange: 'NSE',
      tradingsymbol: 'RELIANCE',
      totalQty: 50,
      averagePrice: 2850,
      closePrice: 2980.50
    };

    const normalized = portfolioService.normalizeHolding(rawHolding);
    assert.strictEqual(normalized.tradingsymbol, 'RELIANCE', 'tradingsymbol must be RELIANCE, not brokerToken');
    assert.strictEqual(normalized.tradingSymbol, 'RELIANCE', 'tradingSymbol must match tradingsymbol');
    assert.strictEqual(normalized.brokerToken, 738561, 'brokerToken must be preserved for internal identification');
    assert.notStrictEqual(normalized.tradingsymbol, String(rawHolding.brokerToken));
  });

  test('Holding normalization handles mutual funds and long names correctly without fallback to brokerToken', () => {
    const rawHolding = {
      alias: 'HG_PROSPERA',
      brokerToken: 'INF277K01Z77',
      exchange: 'MF',
      tradingsymbol: 'Tata Digital India Fund-Direct Plan-Growth',
      totalQty: 908,
      averagePrice: 45.84,
      closePrice: 45.3519
    };

    const normalized = portfolioService.normalizeHolding(rawHolding);
    assert.strictEqual(normalized.tradingsymbol, 'Tata Digital India Fund-Direct Plan-Growth');
    assert.strictEqual(normalized.tradingSymbol, 'Tata Digital India Fund-Direct Plan-Growth');
    assert.strictEqual(normalized.brokerToken, 'INF277K01Z77');
  });

  test('Holding normalization handles tradingSymbol casing variation and gracefully reports missing symbol', () => {
    // 1. tradingSymbol casing
    const casingHolding = {
      alias: 'AG',
      brokerToken: 895745,
      tradingSymbol: 'TATAMOTORS'
    };
    const normCasing = portfolioService.normalizeHolding(casingHolding);
    assert.strictEqual(normCasing.tradingsymbol, 'TATAMOTORS');
    assert.strictEqual(normCasing.tradingSymbol, 'TATAMOTORS');

    // 2. Genuinely missing symbol reports UNKNOWN gracefully rather than brokerToken
    const missingHolding = {
      alias: 'MG',
      brokerToken: 123456
    };
    const normMissing = portfolioService.normalizeHolding(missingHolding);
    assert.strictEqual(normMissing.tradingsymbol, 'UNKNOWN');
    assert.strictEqual(normMissing.tradingSymbol, 'UNKNOWN');
    assert.strictEqual(normMissing.brokerToken, 123456);
  });

  test('Combined portfolio PnL percentage is calculated from total invested base, not simple average', () => {
    // Stock A: 10,000 invested, +100% PnL (+10,000)
    // Stock B: 990,000 invested, -1% PnL (-9,900)
    // Simple average of percentages would be (+100 - 1)/2 = +49.5% (MISLEADING!)
    // True financial calculation: Total Invested = 1,000,000; Total PnL = +100; True PnL % = +0.01%
    const holdings = [
      { investedamount: 10000, currentamount: 20000, pnl: 10000, plpercent: 100 },
      { investedamount: 990000, currentamount: 980100, pnl: -9900, plpercent: -1 }
    ];

    const summary = portfolioService.calculateSummary(holdings);
    assert.strictEqual(summary.totalInvested, 1000000);
    assert.strictEqual(summary.totalPnl, 100);
    assert.strictEqual(summary.pnlPercent, 0.01);
  });

  // 3. Dynamic Exchange Filter & Combined Filtering Tests
  test('Exchange filter normalizes empty, all, whitespace and valid values', () => {
    assert.strictEqual(portfolioService.normalizeExchangeFilter(''), 'all');
    assert.strictEqual(portfolioService.normalizeExchangeFilter(null), 'all');
    assert.strictEqual(portfolioService.normalizeExchangeFilter(undefined), 'all');
    assert.strictEqual(portfolioService.normalizeExchangeFilter('all'), 'all');
    assert.strictEqual(portfolioService.normalizeExchangeFilter('ALL'), 'all');
    assert.strictEqual(portfolioService.normalizeExchangeFilter(' NSE '), 'NSE');
    assert.strictEqual(portfolioService.normalizeExchangeFilter('MF'), 'MF');
    assert.strictEqual(portfolioService.normalizeExchangeFilter('bse'), 'bse');
  });

  test('Dynamic exchange discovery returns unique, trimmed, sorted exchanges in demo mode', async () => {
    const exchanges = await portfolioService.getDistinctExchanges();
    assert(Array.isArray(exchanges), 'Exchanges should be an array');
    assert(exchanges.includes('NSE'), 'Should discover NSE');
    assert(exchanges.includes('MF'), 'Should discover MF');
    // Ensure uniqueness
    const unique = Array.from(new Set(exchanges));
    assert.strictEqual(exchanges.length, unique.length, 'No duplicate exchanges allowed');
  });

  test('Combined Exchange and Account filtering filters holdings correctly in demo mode', async () => {
    // 1. All Exchanges + All Accounts
    const allHoldings = await portfolioService.getHoldings('all', 'all');
    assert(allHoldings.length > 0, 'Should return all holdings');
    assert(allHoldings.some(h => h.exchange === 'NSE'), 'Contains NSE');
    assert(allHoldings.some(h => h.exchange === 'MF'), 'Contains MF');

    // 2. NSE + All Accounts
    const nseHoldings = await portfolioService.getHoldings('all', 'NSE');
    assert(nseHoldings.length > 0, 'Should return NSE holdings');
    assert(nseHoldings.every(h => h.exchange.toUpperCase() === 'NSE'), 'All holdings must be NSE');

    // 3. MF + All Accounts
    const mfHoldings = await portfolioService.getHoldings('all', 'MF');
    assert(mfHoldings.length > 0, 'Should return MF holdings');
    assert(mfHoldings.every(h => h.exchange.toUpperCase() === 'MF'), 'All holdings must be MF');

    // 4. NSE + HG
    const nseHg = await portfolioService.getHoldings('HG', 'NSE');
    assert(nseHg.length > 0, 'Should return HG holdings on NSE');
    assert(nseHg.every(h => h.alias === 'HG' && h.exchange.toUpperCase() === 'NSE'), 'Must be HG on NSE');

    // 5. MF + MG
    const mfMg = await portfolioService.getHoldings('MG', 'MF');
    assert(mfMg.length > 0, 'Should return MG holdings on MF');
    assert(mfMg.every(h => h.alias === 'MG' && h.exchange.toUpperCase() === 'MF'), 'Must be MG on MF');

    // 6. Non-existent combination returns empty array gracefully without error
    const nonExistent = await portfolioService.getHoldings('NONEXISTENT_ACCOUNT', 'NSE');
    assert.deepStrictEqual(nonExistent, [], 'Should return empty array');
  });

  test('Portfolio summary recalculates correctly for filtered Exchange + Account subset', async () => {
    const mfHoldings = await portfolioService.getHoldings('all', 'MF');
    const mfSummary = portfolioService.calculateSummary(mfHoldings);
    
    assert.strictEqual(mfSummary.totalScrips, mfHoldings.length);
    const expectedInvested = mfHoldings.reduce((sum, h) => sum + h.investedamount, 0);
    assert.strictEqual(mfSummary.totalInvested, Number(expectedInvested.toFixed(2)));
  });

  console.log('\n========================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
