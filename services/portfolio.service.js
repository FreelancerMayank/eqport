const portfolioModel = require('../models/portfolio.model');
const placeholderModel = require('../models/placeholder.model');
const scripsModel = require('../models/scrips.model');
const databaseService = require('./database.service');
const { sampleMarkets, sampleHoldings } = require('./sample-data');

class PortfolioService {
  constructor() {
    this.demoMarkets = [...sampleMarkets];
    this.demoHoldings = [...sampleHoldings];
  }

  isDemoModeActive() {
    const forceDemo = process.env.DEMO_MODE === 'true';
    const notConnected = !databaseService.isConnected();
    return forceDemo || notConnected;
  }

  /**
   * Retrieves market indices (NIFTY, BANKNIFTY, etc.) from placeholder collection
   */
  async getMarketIndices() {
    if (databaseService.isConnected()) {
      try {
        const places = await placeholderModel.find().lean();
        if (places && places.length > 0) {
          return places.map(p => ({
            name: p.name || 'UNKNOWN',
            value: Number(p.value || 0),
            pchg: Number(p.pchg || 0),
            up_stocks: Number(p.up_stocks || 0),
            down_stocks: Number(p.down_stocks || 0)
          }));
        }
      } catch (err) {
        console.error('Error querying placeholder collection:', err.message);
      }
    }

    if (this.isDemoModeActive()) {
      // Simulate slight micro-ticks in demo mode so real-time refresh is visibly testable
      return this.demoMarkets.map(m => ({
        ...m,
        value: Number((m.value + (Math.random() - 0.49) * 0.8).toFixed(2))
      }));
    }

    return [];
  }

  /**
   * Discovers distinct exchange values dynamically from the portfolio collection
   */
  async getDistinctExchanges() {
    if (databaseService.isConnected()) {
      try {
        const rawExchanges = await portfolioModel.distinct('exchange');
        if (rawExchanges && rawExchanges.length > 0) {
          const seen = new Set();
          const unique = [];
          for (const ex of rawExchanges) {
            if (ex && typeof ex === 'string') {
              const trimmed = ex.trim();
              if (trimmed.length > 0) {
                const upper = trimmed.toUpperCase();
                if (!seen.has(upper)) {
                  seen.add(upper);
                  unique.push(trimmed);
                }
              }
            }
          }
          return unique.sort();
        }
      } catch (err) {
        console.error('Error fetching distinct exchanges:', err.message);
      }
    }

    if (this.isDemoModeActive()) {
      const seen = new Set();
      const unique = [];
      for (const h of this.demoHoldings) {
        if (h.exchange && typeof h.exchange === 'string') {
          const trimmed = h.exchange.trim();
          if (trimmed.length > 0) {
            const upper = trimmed.toUpperCase();
            if (!seen.has(upper)) {
              seen.add(upper);
              unique.push(trimmed);
            }
          }
        }
      }
      return unique.sort();
    }

    return [];
  }

  /**
   * Discovers distinct account aliases dynamically from the portfolio collection
   */
  async getDistinctAccounts() {
    if (databaseService.isConnected()) {
      try {
        const aliases = await portfolioModel.distinct('alias');
        if (aliases && aliases.length > 0) {
          return aliases
            .filter(a => a && typeof a === 'string')
            .map(a => a.trim())
            .filter((val, idx, arr) => arr.indexOf(val) === idx)
            .sort();
        }
      } catch (err) {
        console.error('Error fetching distinct aliases:', err.message);
      }
    }

    if (this.isDemoModeActive()) {
      const demoAliases = Array.from(new Set(this.demoHoldings.map(h => h.alias))).sort();
      return demoAliases;
    }

    return [];
  }

  /**
   * Parse exchange parameter into an exchange string or 'all'
   */
  normalizeExchangeFilter(exchangeParam) {
    if (!exchangeParam || exchangeParam === 'all' || exchangeParam === 'ALL') {
      return 'all';
    }

    if (typeof exchangeParam === 'string') {
      const trimmed = exchangeParam.trim();
      return (trimmed.length === 0 || trimmed.toLowerCase() === 'all') ? 'all' : trimmed;
    }

    return 'all';
  }

  /**
   * Parse account parameter into an array of aliases or 'all'
   */
  normalizeAccountFilter(accountParam) {
    if (!accountParam || accountParam === 'all' || accountParam === 'ALL') {
      return 'all';
    }

    if (Array.isArray(accountParam)) {
      const cleaned = accountParam.map(a => String(a).trim()).filter(Boolean);
      return cleaned.length === 0 || cleaned.includes('all') ? 'all' : cleaned;
    }

    if (typeof accountParam === 'string') {
      const parts = accountParam.split(',').map(a => a.trim()).filter(Boolean);
      return parts.length === 0 || parts.includes('all') ? 'all' : parts;
    }

    return 'all';
  }

  /**
   * Retrieves holdings filtered by specified accounts and exchange
   */
  async getHoldings(accountParam = 'all', exchangeParam = 'all') {
    const accountFilter = this.normalizeAccountFilter(accountParam);
    const exchangeFilter = this.normalizeExchangeFilter(exchangeParam);

    if (databaseService.isConnected()) {
      try {
        const query = {};
        if (accountFilter !== 'all') {
          query.alias = { $in: accountFilter };
        }
        if (exchangeFilter !== 'all') {
          const escaped = exchangeFilter.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          query.exchange = new RegExp(`^${escaped}$`, 'i');
        }
        const records = await portfolioModel.find(query).lean();
        return records.map(item => this.normalizeHolding(item));
      } catch (err) {
        console.error('Error fetching holdings from database:', err.message);
      }
    }

    if (this.isDemoModeActive()) {
      let source = [...this.demoHoldings];
      if (accountFilter !== 'all') {
        source = source.filter(h => accountFilter.includes(h.alias));
      }
      if (exchangeFilter !== 'all') {
        source = source.filter(h => (h.exchange || '').trim().toLowerCase() === exchangeFilter.toLowerCase());
      }

      return source.map(item => {
        const normalized = this.normalizeHolding(item);
        // In demo mode, apply realistic micro-ticks (+/- 0.05%) to closePrice and PnL to test flicker-free updates
        const delta = (Math.random() - 0.49) * 0.5;
        const closePrice = Math.max(1, Number((normalized.closePrice + delta).toFixed(2)));
        const totalQty = normalized.totalQty;
        const averagePrice = normalized.averagePrice;
        const investedamount = Number((normalized.investedamount != null ? normalized.investedamount : averagePrice * totalQty).toFixed(2));
        const currentamount = Number((closePrice * totalQty).toFixed(2));
        const pnl = Number((currentamount - investedamount).toFixed(2));
        const plpercent = investedamount > 0 ? Number(((pnl / investedamount) * 100).toFixed(2)) : 0;
        const pchg = averagePrice > 0 ? Number((((closePrice - averagePrice) / averagePrice) * 100).toFixed(2)) : 0;

        return {
          ...normalized,
          closePrice,
          currentamount,
          pnl,
          plpercent,
          pchg
        };
      });
    }

    return [];
  }

  /**
   * Normalizes an individual portfolio holding to guaranteed numeric formats and fields
   */
  normalizeHolding(item) {
    const totalQty = (!isNaN(Number(item.totalQty))) ? Number(item.totalQty) : 0;
    const averagePrice = (!isNaN(Number(item.averagePrice))) ? Number(item.averagePrice) : 0;
    const investedamount = (!isNaN(Number(item.investedamount)) && item.investedamount != null)
      ? Number(item.investedamount)
      : (averagePrice * totalQty);

    const rawClose = Number(item.closePrice);
    const closePrice = (!isNaN(rawClose) && rawClose > 0) ? rawClose : averagePrice;

    const rawCurrent = Number(item.currentamount);
    const currentamount = (!isNaN(rawCurrent) && rawCurrent > 0)
      ? rawCurrent
      : (closePrice * totalQty);

    const rawPnl = Number(item.pnl);
    const pnl = (!isNaN(rawPnl) && (rawPnl !== 0 || (Number(item.plpercent) === 0 && Math.abs(currentamount - investedamount) < 0.01)))
      ? rawPnl
      : (currentamount - investedamount);

    const rawPl = Number(item.plpercent);
    const plpercent = investedamount > 0 
      ? Number(((pnl / investedamount) * 100).toFixed(2))
      : (!isNaN(rawPl) ? Number(rawPl.toFixed(2)) : 0);

    const rawPchg = Number(item.pchg);
    const pchg = !isNaN(rawPchg) ? Number(rawPchg.toFixed(2)) : plpercent;

    const rawSymbol = (item.tradingsymbol != null && String(item.tradingsymbol).trim().length > 0)
      ? item.tradingsymbol
      : ((item.tradingSymbol != null && String(item.tradingSymbol).trim().length > 0)
        ? item.tradingSymbol
        : null);

    const tradingsymbol = (rawSymbol != null && String(rawSymbol).trim().length > 0)
      ? String(rawSymbol).trim()
      : 'UNKNOWN';

    const tokenIdentifier = item.brokerToken != null ? String(item.brokerToken).trim() : '';
    const uniqueid = item.uniqueid || `${item.alias}_${item.exchange || 'NSE'}_${tokenIdentifier || tradingsymbol}`;

    return {
      _id: item._id ? String(item._id) : undefined,
      uniqueid,
      alias: String(item.alias || '').trim(),
      brokerToken: item.brokerToken != null ? (isNaN(item.brokerToken) ? String(item.brokerToken) : Number(item.brokerToken)) : 0,
      exchange: String(item.exchange || 'NSE').trim(),
      tradingsymbol,
      tradingSymbol: tradingsymbol,
      totalQty,
      averagePrice: Number(averagePrice.toFixed(2)),
      investedamount: Number(investedamount.toFixed(2)),
      closePrice: Number(closePrice.toFixed(2)),
      currentamount: Number(currentamount.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      plpercent: Number(plpercent.toFixed(2)),
      pchg: Number(pchg.toFixed(2))
    };
  }

  /**
   * Computes validated portfolio summary metrics across selected holdings
   */
  calculateSummary(holdings = []) {
    if (!Array.isArray(holdings) || holdings.length === 0) {
      return {
        totalInvested: 0,
        currentValue: 0,
        totalPnl: 0,
        pnlPercent: 0,
        totalScrips: 0,
        positiveCount: 0,
        positivePnl: 0,
        negativeCount: 0,
        negativePnl: 0
      };
    }

    let totalInvested = 0;
    let currentValue = 0;
    let totalPnl = 0;
    let positiveCount = 0;
    let positivePnl = 0;
    let negativeCount = 0;
    let negativePnl = 0;

    for (const h of holdings) {
      const inv = Number(h.investedamount || 0);
      const cur = Number(h.currentamount != null ? h.currentamount : (inv + (h.pnl || 0)));
      const pnl = Number(h.pnl != null ? h.pnl : (cur - inv));

      totalInvested += inv;
      currentValue += cur;
      totalPnl += pnl;

      if (pnl > 0) {
        positiveCount++;
        positivePnl += pnl;
      } else if (pnl < 0) {
        negativeCount++;
        negativePnl += pnl;
      }
    }

    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalInvested: Number(totalInvested.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      totalPnl: Number(totalPnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      totalScrips: holdings.length,
      positiveCount,
      positivePnl: Number(positivePnl.toFixed(2)),
      negativeCount,
      negativePnl: Number(negativePnl.toFixed(2))
    };
  }

  /**
   * Consolidated snapshot returned to the dashboard in a single round-trip
   */
  async getDashboardData(accountParam = 'all', exchangeParam = 'all') {
    const [markets, allExchanges, allAccounts, holdings] = await Promise.all([
      this.getMarketIndices(),
      this.getDistinctExchanges(),
      this.getDistinctAccounts(),
      this.getHoldings(accountParam, exchangeParam)
    ]);

    const summary = this.calculateSummary(holdings);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      dbStatus: databaseService.getStatus(),
      activeExchange: this.normalizeExchangeFilter(exchangeParam),
      activeFilter: this.normalizeAccountFilter(accountParam),
      availableExchanges: allExchanges,
      availableAccounts: allAccounts,
      markets,
      summary,
      holdings
    };
  }
}

module.exports = new PortfolioService();
