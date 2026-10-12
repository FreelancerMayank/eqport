const express = require('express');
const router = express.Router();
const portfolioService = require('../services/portfolio.service');
const databaseService = require('../services/database.service');
const scripsModel = require('../models/scrips.model');

/**
 * 1. Consolidated Dashboard Endpoint
 * Returns markets, available accounts, available exchanges, summary, and holdings in one atomic payload
 */
router.get('/dashboard', async (req, res) => {
  try {
    const accountsParam = req.query.accounts || req.query.account || 'all';
    const exchangeParam = req.query.exchange || req.query.exchanges || 'all';
    const data = await portfolioService.getDashboardData(accountsParam, exchangeParam);
    res.json(data);
  } catch (error) {
    console.error('Error in /api/dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. Markets / Placeholders Endpoints
 * Supports both /api/market and legacy /api/places for 100% backward compatibility
 */
router.get('/market', async (req, res) => {
  try {
    const markets = await portfolioService.getMarketIndices();
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/places', async (req, res) => {
  try {
    const markets = await portfolioService.getMarketIndices();
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Dynamic Account & Exchange Discovery Endpoints
 */
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await portfolioService.getDistinctAccounts();
    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/exchanges', async (req, res) => {
  try {
    const exchanges = await portfolioService.getDistinctExchanges();
    res.json({ success: true, exchanges });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. Portfolio Holdings & Summary
 */
router.get('/portfolio', async (req, res) => {
  try {
    const accountsParam = req.query.accounts || req.query.account || 'all';
    const exchangeParam = req.query.exchange || req.query.exchanges || 'all';
    const holdings = await portfolioService.getHoldings(accountsParam, exchangeParam);
    const summary = portfolioService.calculateSummary(holdings);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeExchange: portfolioService.normalizeExchangeFilter(exchangeParam),
      activeFilter: portfolioService.normalizeAccountFilter(accountsParam),
      summary,
      holdings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. Legacy Compatibility Endpoints
 * /api/data/all, /api/data/:alias, /api/data/scrips
 */
router.get('/data/all', async (req, res) => {
  try {
    const holdings = await portfolioService.getHoldings('all');
    res.json(holdings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/data/scrips', async (req, res) => {
  try {
    if (databaseService.isConnected()) {
      const scrips = await scripsModel.find().lean();
      return res.json(scrips);
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/data/:alias', async (req, res) => {
  try {
    const alias = req.params.alias ? req.params.alias.toUpperCase() : 'all';
    const holdings = await portfolioService.getHoldings(alias);
    res.json(holdings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. Health & Diagnostics Endpoint
 */
router.get('/health', (req, res) => {
  const dbStatus = databaseService.getStatus();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    demoMode: portfolioService.isDemoModeActive()
  });
});

module.exports = router;
