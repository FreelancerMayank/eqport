/**
 * EQPORT — Dynamic Portfolio Dashboard Client Engine
 * Features:
 * - 1000ms Real-Time Background Polling (Single-Flight)
 * - Flicker-Free In-Place DOM Reconciliation
 * - Complete UI State Preservation (Filter, Search, Sort, Page, PageSize, Selection, Theme)
 * - Dynamic Account Discovery from MongoDB
 * - Dark & Light Theme Management
 */

(function () {
  'use strict';

  function getInitialPageSize() {
    try {
      const saved = parseInt(localStorage.getItem('eqport_page_size'), 10);
      if ([10, 25, 50, 100].includes(saved)) {
        return saved;
      }
    } catch {}
    return 10;
  }

  // Application State
  const state = {
    selectedExchange: 'all', // 'all' or specific exchange like 'NSE', 'MF'
    selectedAccount: 'all',  // 'all' or specific alias like 'HG'
    searchQuery: '',
    sortColumn: 'tradingsymbol',
    sortDirection: 'asc',
    pageSize: getInitialPageSize(),
    currentPage: 1,
    theme: localStorage.getItem('eqport_theme') || 'dark',
    isFetching: false,
    lastSuccessfulTimestamp: null,
    knownExchanges: [],
    knownAccounts: [],
    cachedHoldings: [],
    cachedMarkets: []
  };

  // DOM Elements Cache
  const elements = {};

  // Initialize Elements & Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    parseUrlParams();
    cacheDomElements();
    initTheme();
    initEventListeners();
    
    // Initial Load
    fetchDashboardData(true);

    // Start 1-Second Interval Polling
    const intervalMs = window.EQPORT_CONFIG?.refreshInterval || 1000;
    setInterval(() => {
      fetchDashboardData(false);
    }, intervalMs);
  });

  function parseUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const ex = params.get('exchange') || params.get('exchanges');
      if (ex && ex.trim()) {
        state.selectedExchange = ex.trim();
      }
      const acc = params.get('account') || params.get('accounts');
      if (acc && acc.trim()) {
        state.selectedAccount = acc.trim();
      }
    } catch {}
  }

  function cacheDomElements() {
    elements.themeToggleBtn = document.getElementById('theme-toggle-btn');
    elements.themeIcon = document.getElementById('theme-icon');
    elements.statusDot = document.getElementById('status-dot');
    elements.statusText = document.getElementById('status-text');
    elements.lastRefreshed = document.getElementById('last-refreshed');
    elements.marketCardsContainer = document.getElementById('market-cards-container');
    
    // Summary
    elements.summaryInvested = document.getElementById('summary-invested');
    elements.summaryCurrent = document.getElementById('summary-current');
    elements.summaryPnl = document.getElementById('summary-pnl');
    elements.statScrips = document.getElementById('stat-scrips');
    elements.statGreen = document.getElementById('stat-green');
    elements.statRed = document.getElementById('stat-red');

    // Controls
    elements.exchangeFilters = document.getElementById('exchange-filters');
    elements.accountFilters = document.getElementById('account-filters');
    elements.searchInput = document.getElementById('search-input');
    elements.searchClearBtn = document.getElementById('search-clear-btn');
    elements.pageSizeSelect = document.getElementById('page-size-select');

    // Table
    elements.tableBody = document.getElementById('holdings-table-body');
    elements.tableHeaders = document.querySelectorAll('.holdings-table th.sortable');
    elements.entriesInfo = document.getElementById('entries-info');
    elements.paginationControls = document.getElementById('pagination-controls');
  }

  /* --------------------------------------------------------------------------
     1. Theme Management
     -------------------------------------------------------------------------- */
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeToggleUI();
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('eqport_theme', state.theme);
    updateThemeToggleUI();
  }

  function updateThemeToggleUI() {
    if (elements.themeToggleBtn) {
      if (state.theme === 'dark') {
        elements.themeToggleBtn.innerHTML = '<span>🌙</span> <span>Dark</span>';
      } else {
        elements.themeToggleBtn.innerHTML = '<span>☀️</span> <span>Light</span>';
      }
    }
  }

  /* --------------------------------------------------------------------------
     2. Event Listeners
     -------------------------------------------------------------------------- */
  function initEventListeners() {
    // Theme
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Search input (Preserves typing and keyboard focus)
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        state.currentPage = 1; // reset to page 1 on new search
        if (elements.searchClearBtn) {
          elements.searchClearBtn.classList.toggle('visible', Boolean(state.searchQuery));
        }
        renderTableFlickerFree();
      });
    }

    // Search Clear
    if (elements.searchClearBtn) {
      elements.searchClearBtn.addEventListener('click', () => {
        if (elements.searchInput) {
          elements.searchInput.value = '';
          state.searchQuery = '';
          elements.searchClearBtn.classList.remove('visible');
          state.currentPage = 1;
          renderTableFlickerFree();
        }
      });
    }

    // Page Size Selector
    if (elements.pageSizeSelect) {
      elements.pageSizeSelect.value = String(state.pageSize);
      elements.pageSizeSelect.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        state.pageSize = [10, 25, 50, 100].includes(val) ? val : 10;
        try {
          localStorage.setItem('eqport_page_size', String(state.pageSize));
        } catch {}
        state.currentPage = 1;
        renderTableFlickerFree();
      });
    }

    // Sorting Headers
    if (elements.tableHeaders) {
      elements.tableHeaders.forEach(th => {
        th.addEventListener('click', () => {
          const column = th.getAttribute('data-sort');
          if (!column) return;

          if (state.sortColumn === column) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            state.sortColumn = column;
            state.sortDirection = (column === 'tradingsymbol' || column === 'alias') ? 'asc' : 'desc';
          }

          updateSortHeadersUI();
          renderTableFlickerFree();
        });
      });
    }
  }

  function updateSortHeadersUI() {
    if (!elements.tableHeaders) return;
    elements.tableHeaders.forEach(th => {
      const col = th.getAttribute('data-sort');
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (col === state.sortColumn) {
        th.classList.add(state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });
  }

  /* --------------------------------------------------------------------------
     3. Real-Time Data Refresh (Single-Flight)
     -------------------------------------------------------------------------- */
  async function fetchDashboardData(isInitial = false) {
    // Avoid overlapping refresh requests
    if (state.isFetching) return;
    state.isFetching = true;

    try {
      // Query parameters pass active exchange and account filters
      const url = `/api/dashboard?exchange=${encodeURIComponent(state.selectedExchange)}&accounts=${encodeURIComponent(state.selectedAccount)}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data && data.success) {
        state.lastSuccessfulTimestamp = new Date();
        updateConnectionStatus('live', 'Live');

        // 1. In-place Market Cards update
        if (Array.isArray(data.markets)) {
          updateMarketCards(data.markets);
        }

        // 2. In-place Portfolio Summary update
        if (data.summary) {
          updateSummaryBar(data.summary);
        }

        // 3. Dynamic Exchange Filter discovery
        if (Array.isArray(data.availableExchanges)) {
          updateDynamicExchangeFilters(data.availableExchanges);
        }

        // 4. Dynamic Account Filter discovery
        if (Array.isArray(data.availableAccounts)) {
          updateDynamicAccountFilters(data.availableAccounts);
        }

        // 5. In-place Holdings Table reconciliation
        if (Array.isArray(data.holdings)) {
          state.cachedHoldings = data.holdings;
          renderTableFlickerFree();
        }

        // 6. Update Timestamp
        updateTimestampUI(data.serverTime || state.lastSuccessfulTimestamp.toLocaleTimeString('en-IN'));
      }
    } catch (err) {
      console.warn('Refresh notice (retaining current view):', err.message);
      updateConnectionStatus('stale', 'Reconnecting...');
    } finally {
      state.isFetching = false;
    }
  }

  function updateConnectionStatus(statusClass, label) {
    if (elements.statusDot) {
      elements.statusDot.className = `status-dot ${statusClass}`;
    }
    if (elements.statusText) {
      elements.statusText.textContent = label;
    }
  }

  function updateTimestampUI(timeStr) {
    if (elements.lastRefreshed) {
      elements.lastRefreshed.textContent = `Refreshed: ${timeStr}`;
    }
  }

  /* --------------------------------------------------------------------------
     4. Market Summary Cards — In-Place Updates
     -------------------------------------------------------------------------- */
  function updateMarketCards(markets) {
    if (!elements.marketCardsContainer) return;

    markets.forEach(m => {
      const cardId = `market-card-${m.name}`;
      let card = document.getElementById(cardId);

      const isPos = m.pchg >= 0;
      const pchgFormatted = `${isPos ? '+' : ''}${formatNumber(m.pchg, 2)}%`;
      const colorClass = isPos ? 'text-positive' : 'text-negative';

      if (!card) {
        // Create card element once
        card = document.createElement('div');
        card.id = cardId;
        card.className = 'market-card';
        card.innerHTML = `
          <div class="card-header-row">
            <span class="card-index-name">${escapeHtml(m.name)}</span>
          </div>
          <div class="card-price-row">
            <span class="card-value" data-prop="value">${formatNumber(m.value, 2)}</span>
            <span class="card-pchg ${colorClass}" data-prop="pchg">${pchgFormatted}</span>
          </div>
          <div class="card-stock-counts">
            <span class="count-up" data-prop="up">UP: ${m.up_stocks || 0}</span>
            <span class="count-down" data-prop="down">DOWN: ${m.down_stocks || 0}</span>
          </div>
        `;
        elements.marketCardsContainer.appendChild(card);
      } else {
        // Update in-place without rebuilding DOM
        const valueEl = card.querySelector('[data-prop="value"]');
        const pchgEl = card.querySelector('[data-prop="pchg"]');
        const upEl = card.querySelector('[data-prop="up"]');
        const downEl = card.querySelector('[data-prop="down"]');

        const newFormattedVal = formatNumber(m.value, 2);
        if (valueEl && valueEl.textContent !== newFormattedVal) {
          valueEl.textContent = newFormattedVal;
        }

        if (pchgEl && pchgEl.textContent !== pchgFormatted) {
          pchgEl.textContent = pchgFormatted;
          pchgEl.className = `card-pchg ${colorClass}`;
        }

        if (upEl) upEl.textContent = `UP: ${m.up_stocks || 0}`;
        if (downEl) downEl.textContent = `DOWN: ${m.down_stocks || 0}`;
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Portfolio Summary — One Horizontal Line
     -------------------------------------------------------------------------- */
  function updateSummaryBar(summary) {
    if (!elements.summaryInvested || !elements.summaryCurrent || !elements.summaryPnl) return;

    const investedFormatted = formatCurrency(summary.totalInvested);
    const currentFormatted = formatCurrency(summary.currentValue);

    const isPos = summary.totalPnl >= 0;
    const sign = isPos ? '+' : '-';
    const absPnl = Math.abs(summary.totalPnl);
    const absPct = Math.abs(summary.pnlPercent);

    const pnlFormatted = `${sign}${formatCurrency(absPnl)} (${sign}${formatNumber(absPct, 2)}%)`;
    const colorClass = isPos ? 'text-positive' : 'text-negative';

    elements.summaryInvested.textContent = investedFormatted;
    elements.summaryCurrent.textContent = currentFormatted;
    elements.summaryPnl.textContent = pnlFormatted;
    elements.summaryPnl.className = `summary-value summary-pnl-val ${colorClass}`;

    // Auxiliary Chips
    if (elements.statScrips) {
      elements.statScrips.textContent = `Holdings: ${summary.totalScrips || 0}`;
    }
    if (elements.statGreen) {
      elements.statGreen.textContent = `Gainers: ${summary.positiveCount || 0} (${formatCurrency(summary.positivePnl || 0)})`;
    }
    if (elements.statRed) {
      elements.statRed.textContent = `Losers: ${summary.negativeCount || 0} (${formatCurrency(summary.negativePnl || 0)})`;
    }
  }

  /* --------------------------------------------------------------------------
     6. Dynamic Exchange & Account Discovery & Selection
     -------------------------------------------------------------------------- */
  function updateDynamicExchangeFilters(exchanges) {
    if (!elements.exchangeFilters) return;

    // Check if exchange list changed
    const listChanged = exchanges.length !== state.knownExchanges.length ||
      exchanges.some((ex, idx) => ex !== state.knownExchanges[idx]);

    if (!listChanged && elements.exchangeFilters.children.length > 0) {
      // Re-synchronize active state without DOM reconstruction
      elements.exchangeFilters.querySelectorAll('.filter-btn').forEach(btn => {
        const isAct = (btn.dataset.exchange || '').toLowerCase() === (state.selectedExchange || '').toLowerCase();
        btn.classList.toggle('active', isAct);
      });
      return;
    }

    state.knownExchanges = [...exchanges];

    // Rebuild filter buttons while preserving active state
    elements.exchangeFilters.innerHTML = '';

    // "All Exchanges" Button
    const allBtn = createExchangeFilterButton('All Exchanges', 'all', state.selectedExchange === 'all');
    elements.exchangeFilters.appendChild(allBtn);

    // Individual Exchange Buttons
    exchanges.forEach(ex => {
      const isActive = state.selectedExchange.toLowerCase() === ex.toLowerCase();
      const btn = createExchangeFilterButton(ex, ex, isActive);
      elements.exchangeFilters.appendChild(btn);
    });
  }

  function createExchangeFilterButton(label, value, isActive) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-btn ${isActive ? 'active' : ''}`;
    btn.textContent = label;
    btn.dataset.exchange = value;

    btn.addEventListener('click', () => {
      if (state.selectedExchange === value) return; // already active

      state.selectedExchange = value;
      state.currentPage = 1; // reset page on filter change

      // Update button active styles
      const allBtns = elements.exchangeFilters.querySelectorAll('.filter-btn');
      allBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Fetch immediately for the newly selected exchange & account
      fetchDashboardData(false);
    });

    return btn;
  }

  function updateDynamicAccountFilters(accounts) {
    if (!elements.accountFilters) return;

    // Check if account list changed
    const listChanged = accounts.length !== state.knownAccounts.length ||
      accounts.some((acc, idx) => acc !== state.knownAccounts[idx]);

    if (!listChanged && elements.accountFilters.children.length > 0) {
      // Re-synchronize active state without DOM reconstruction
      elements.accountFilters.querySelectorAll('.filter-btn').forEach(btn => {
        const isAct = (btn.dataset.account || '').toLowerCase() === (state.selectedAccount || '').toLowerCase();
        btn.classList.toggle('active', isAct);
      });
      return;
    }

    state.knownAccounts = [...accounts];

    // Rebuild filter buttons while preserving active state
    elements.accountFilters.innerHTML = '';

    // "All Accounts" Button
    const allBtn = createAccountFilterButton('All Accounts', 'all', state.selectedAccount === 'all');
    elements.accountFilters.appendChild(allBtn);

    // Individual Account Buttons
    accounts.forEach(alias => {
      const isActive = state.selectedAccount.toLowerCase() === alias.toLowerCase();
      const btn = createAccountFilterButton(alias, alias, isActive);
      elements.accountFilters.appendChild(btn);
    });
  }

  function createAccountFilterButton(label, value, isActive) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter-btn ${isActive ? 'active' : ''}`;
    btn.textContent = label;
    btn.dataset.account = value;

    btn.addEventListener('click', () => {
      if (state.selectedAccount === value) return; // already active

      state.selectedAccount = value;
      state.currentPage = 1; // reset page on filter change

      // Update button active styles
      const allBtns = elements.accountFilters.querySelectorAll('.filter-btn');
      allBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Fetch immediately for the newly selected account
      fetchDashboardData(false);
    });

    return btn;
  }

  /* --------------------------------------------------------------------------
     7. Consolidated Holdings Table — Stable Flicker-Free Reconciliation
     -------------------------------------------------------------------------- */
  function getFilteredAndSortedHoldings() {
    let rows = [...state.cachedHoldings];

    // 1. Search Query Filter (Searches tradingsymbol or alias)
    if (state.searchQuery) {
      const q = state.searchQuery;
      rows = rows.filter(item => {
        const symbol = (item.tradingsymbol || item.tradingSymbol || '').toLowerCase();
        const alias = (item.alias || '').toLowerCase();
        return symbol.includes(q) || alias.includes(q);
      });
    }

    // 2. Sorting
    rows.sort((a, b) => {
      let valA = a[state.sortColumn];
      let valB = b[state.sortColumn];

      if (valA == null && state.sortColumn === 'tradingsymbol') valA = a.tradingSymbol;
      if (valB == null && state.sortColumn === 'tradingsymbol') valB = b.tradingSymbol;
      if (valA == null && state.sortColumn === 'tradingSymbol') valA = a.tradingsymbol;
      if (valB == null && state.sortColumn === 'tradingSymbol') valB = b.tradingsymbol;

      if (valA == null) valA = '';
      if (valB == null) valB = '';

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB);
        return state.sortDirection === 'asc' ? comp : -comp;
      }

      const diff = Number(valA) - Number(valB);
      return state.sortDirection === 'asc' ? diff : -diff;
    });

    return rows;
  }

  function getHoldingKey(item) {
    const symbol = item.tradingsymbol || item.tradingSymbol || '';
    const token = item.brokerToken != null ? String(item.brokerToken) : '';
    return item.uniqueid || `${item.alias}_${item.exchange || 'NSE'}_${token || symbol}`;
  }

  function renderTableFlickerFree() {
    if (!elements.tableBody) return;

    const filteredRows = getFilteredAndSortedHoldings();
    const totalEntries = filteredRows.length;

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(totalEntries / state.pageSize));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, totalEntries);
    const pageRows = filteredRows.slice(startIndex, endIndex);

    // Empty state handling
    if (totalEntries === 0) {
      elements.tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-table-state">
            <div class="empty-icon">📂</div>
            <div>No matching portfolio holdings found.</div>
          </td>
        </tr>
      `;
      updatePaginationUI(0, 0, 0, 1);
      return;
    }

    // Stable DOM Reconciliation using Key Map
    const existingRowsMap = new Map();
    Array.from(elements.tableBody.children).forEach(tr => {
      const key = tr.getAttribute('data-row-key');
      if (key) {
        existingRowsMap.set(key, tr);
      }
    });

    const fragment = document.createDocumentFragment();

    pageRows.forEach((item, index) => {
      const key = getHoldingKey(item);
      let tr = existingRowsMap.get(key);

      const symbolText = item.tradingsymbol || item.tradingSymbol || 'UNKNOWN';
      const isPos = item.pnl >= 0;
      const pnlColorClass = isPos ? 'text-positive' : 'text-negative';
      const pnlSign = isPos ? '+' : '-';
      const absPct = Math.abs(item.plpercent);
      const pnlPctFormatted = `${pnlSign}${formatNumber(absPct, 2)}%`;

      if (!tr) {
        // Create new row with exactly 6 columns: Account, Symbol, Qty, Bought Price, CMP, PnL %
        tr = document.createElement('tr');
        tr.setAttribute('data-row-key', key);
        tr.innerHTML = `
          <td><span class="alias-badge" data-cell="alias">${escapeHtml(item.alias)}</span></td>
          <td><span class="symbol-badge" data-cell="tradingsymbol">${escapeHtml(symbolText)}</span></td>
          <td class="align-right numeric-cell" data-cell="totalQty">${formatNumber(item.totalQty, 2)}</td>
          <td class="align-right numeric-cell" data-cell="averagePrice">${formatCurrency(item.averagePrice)}</td>
          <td class="align-right numeric-cell" data-cell="closePrice">${formatCurrency(item.closePrice)}</td>
          <td class="align-right numeric-cell ${pnlColorClass}" data-cell="plpercent">${pnlPctFormatted}</td>
        `;
      } else {
        // In-place update of changing cells
        updateCellText(tr, 'alias', item.alias);
        updateCellText(tr, 'tradingsymbol', symbolText);
        updateCellText(tr, 'totalQty', formatNumber(item.totalQty, 2));
        updateCellText(tr, 'averagePrice', formatCurrency(item.averagePrice));
        updateCellText(tr, 'closePrice', formatCurrency(item.closePrice));

        // PnL (%)
        const pctCell = tr.querySelector('[data-cell="plpercent"]');
        if (pctCell && pctCell.textContent !== pnlPctFormatted) {
          pctCell.textContent = pnlPctFormatted;
          pctCell.className = `align-right numeric-cell ${pnlColorClass}`;
        }

        existingRowsMap.delete(key);
      }

      fragment.appendChild(tr);
    });

    // Remove obsolete rows no longer on this page
    existingRowsMap.forEach(tr => {
      tr.remove();
    });

    // Reattach reconciled rows without full table replacement
    elements.tableBody.innerHTML = '';
    elements.tableBody.appendChild(fragment);

    // Update Pagination & Entries summary
    updatePaginationUI(startIndex + 1, endIndex, totalEntries, totalPages);
  }

  function updateCellText(tr, cellName, newText) {
    const el = tr.querySelector(`[data-cell="${cellName}"]`);
    if (el && el.textContent !== newText) {
      el.textContent = newText;
    }
  }

  /* --------------------------------------------------------------------------
     8. Pagination UI
     -------------------------------------------------------------------------- */
  function updatePaginationUI(from, to, total, totalPages) {
    if (elements.entriesInfo) {
      if (total === 0) {
        elements.entriesInfo.textContent = 'Showing 0 to 0 of 0 entries';
      } else {
        elements.entriesInfo.textContent = `Showing ${from} to ${to} of ${total} entries`;
      }
    }

    if (!elements.paginationControls) return;
    elements.paginationControls.innerHTML = '';

    if (total <= state.pageSize) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderTableFlickerFree();
      }
    });
    elements.paginationControls.appendChild(prevBtn);

    // Page Number Buttons
    const maxButtons = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${p === state.currentPage ? 'active' : ''}`;
      pageBtn.textContent = p;
      const pageNum = p;
      pageBtn.addEventListener('click', () => {
        state.currentPage = pageNum;
        renderTableFlickerFree();
      });
      elements.paginationControls.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '&raquo;';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderTableFlickerFree();
      }
    });
    elements.paginationControls.appendChild(nextBtn);
  }

  /* --------------------------------------------------------------------------
     9. Formatting Utilities (Indian Rupee Currency & Numbers)
     -------------------------------------------------------------------------- */
  function formatCurrency(val) {
    if (val == null || isNaN(val)) return '₹0.00';
    const num = Number(val);
    const absNum = Math.abs(num);
    const formatted = absNum.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `₹${formatted}`;
  }

  function formatNumber(val, decimals = 2) {
    if (val == null || isNaN(val)) return '0.00';
    return Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
