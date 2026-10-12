const express = require('express');
const router = express.Router();
const portfolioService = require('../services/portfolio.service');

// Main Consolidated Dashboard Route
router.get('/', async (req, res) => {
  try {
    const refreshInterval = parseInt(process.env.REFRESH_INTERVAL_MS, 10) || 1000;
    res.render('dashboard', {
      title: 'EQPORT — Dynamic Portfolio Dashboard',
      refreshInterval
    });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Legacy URL redirects to consolidated dashboard with account query parameter
const legacyAliases = ['hg', 'kg', 'mg', 'rg', 'ag', 'all'];
legacyAliases.forEach(alias => {
  router.get(`/${alias}`, (req, res) => {
    const target = alias === 'all' ? '/' : `/?account=${alias.toUpperCase()}`;
    res.redirect(301, target);
  });
});

module.exports = router;
