# EQPORT — Dynamic Portfolio Dashboard v2.0

> **Real-Time, Flicker-Free Portfolio Monitoring Dashboard connected to MongoDB**

---

## 1. Project Overview

**EQPORT Dashboard v2** is a high-performance, real-time financial portfolio monitoring web application. It is designed to read and display continuous equity and mutual fund portfolio data pushed into MongoDB by an external data-pusher program.

This implementation resides in its own isolated directory (`eqport-dashboard-v2/`) without modifying, restructuring, or altering the external data-pusher or MongoDB collections.

### Core Objectives Delivered:
- **Live Market Summary Cards**: Real-time cards for `NIFTY`, `BANKNIFTY`, `FINNIFTY`, `MIDCPNIFTY`, `SENSEX`, and `BANKEX` with index price, percentage change, and UP/DOWN stock counts.
- **Single-Line Portfolio Summary**: Desktop-optimized compact metrics bar:
  `Total Investment: ₹X | Current Value: ₹Y | Total PnL: ₹Z (+/-P%)`
- **Dynamic Exchange Filter**: Discovered dynamically from the MongoDB `portfolios` collection `exchange` field (e.g. `NSE`, `MF`, `BSE`).
- **Dynamic Account Filter**: Discovered dynamically from the MongoDB `portfolios` collection `alias` field without hardcoding.
- **Strict Control Order**: **Exchange Filter → Account Filter → Search → Entries per Page**.
- **Six-Column Holdings Table**: Streamlined 6-column structure (`Account`, `Trading Symbol`, `Total Qty`, `Bought Price`, `CMP`, `PnL (%)`). Three financial columns (`Invested Amount`, `Current Value`, and absolute `PnL (₹)`) have been removed from the table while remaining fully available for summary calculations.
- **Enhanced Typography & Readability**: Systematic typography scale with increased font sizes across titles, cards, summary metrics, filters, table headers, table cells, symbol badges, and pagination.
- **1-Second Real-Time Refresh**: Background refresh cadence running at exactly 1000 ms by default.
- **Zero-Flicker In-Place Reconciliation**: Updates DOM values in-place without page reloads, without blanking the table, and without destroying table components.
- **100% UI State Preservation**: Preserves selected Exchange, selected Account, search queries, keyboard cursor focus, sort column and direction, page size (10, 25, 50, 100), pagination page number, scroll position, and active theme across every 1-second refresh cycle.
- **Dark & Light Themes**: Dark theme by default, with an instant toggle in the top-right header and persistent user preference.

---

## 2. Features

- **Real-Time Market Indices**: Displays live market indices with green/red performance indicators and UP/DOWN breadth metrics.
- **Streamlined Holdings Table (Exact 6 Columns)**:
  1. `Account` (left-aligned)
  2. `Trading Symbol` (left-aligned, displays the actual `tradingsymbol` field from the portfolio document, not `brokerToken`, with generous width for lengthy instrument names)
  3. `Total Qty` (right-aligned, tabular numeric)
  4. `Bought Price` (right-aligned, currency formatted)
  5. `CMP` (Current Market Price, right-aligned, currency formatted)
  6. `PnL (%)` (right-aligned, percentage formatted with `+`/`-` sign and positive/negative color coding)
  *(Removed columns: Invested Amount, Current Value, and Absolute PnL (₹) have been removed from the table display).*
- **Precise Financial Aggregation**: Aggregate PnL percentage calculated correctly against total invested base ($\frac{\sum \text{PnL}}{\sum \text{Invested}} \times 100$) rather than misleading averages of percentages.
- **Dynamic Exchange & Account Filters**:
  - Dynamically discovers unique exchange values (e.g. `NSE`, `MF`, `BSE`) and account aliases (e.g. `HG`, `KG`, `MG`, `RG`, `AG`).
  - Combined filtering: Filters holdings simultaneously across both exchange and account dimensions.
  - Automatically recalculates the single-line summary bar to match the exact filtered subset.
- **Interactive Controls (Control Order: Exchange Filter → Account Filter → Search → Entries per Page)**:
  - Live search filtering by symbol or account name (preserves typing and cursor focus).
  - Multi-column sorting (ascending / descending) on all 6 columns, including PnL (%).
  - Configurable page sizes: 10, 25, 50, 100 entries (default on fresh opening: 10; available options remain 10, 25, 50, and 100).
  - Full pagination controls with previous/next and numeric page buttons.
- **Single-Flight Polling**: Prevents request pile-up and handles transient network lag gracefully by retaining the last valid state.
- **Backward Compatibility**: Fully supports existing REST routes (`/api/places`, `/api/data/all`, `/api/data/:alias`, `/api/data/scrips`) and redirects legacy URLs (`/hg`, `/kg`, `/mg`, `/rg`, `/ag`, `/all`) to the consolidated dashboard.

---

## 3. Technology Stack

- **Backend**: Node.js (v18+ / v20+ / v22+)
- **Web Framework**: Express.js 4.19+
- **Database Layer**: MongoDB via Mongoose 8.5+
- **View Engine**: EJS 3.1+
- **Styling**: Modern CSS3 with CSS Custom Properties (Variables) for Dark/Light themes
- **Frontend Architecture**: Pure Vanilla JavaScript with DOM reconciliation engine (No heavy client frameworks, lightweight, zero bloat)

---

## 4. Directory Structure

```
eqport-dashboard-v2/
├── server.js                      # Application entry point and Express server setup
├── package.json                   # Dependencies and npm scripts
├── .env.example                   # Template for environment configuration
├── .gitignore                     # Git ignore rules (excludes .env and node_modules)
├── README.md                      # Complete system documentation
├── models/                        # Mongoose data schemas (exact parity with upstream)
│   ├── placeholder.model.js       # Market indices schema (placeholders collection)
│   ├── portfolio.model.js         # Holdings schema (portfolios collection)
│   └── scrips.model.js            # Scrips schema (scrips collection)
├── routes/                        # Application routing layer
│   ├── dashboard.routes.js        # Main dashboard and legacy redirects
│   └── api.routes.js              # Consolidated API and legacy compatibility endpoints
├── services/                      # Business logic layer
│   ├── database.service.js        # Safe MongoDB connection manager with URI masking
│   ├── portfolio.service.js       # Aggregation, summary calculation, and account discovery
│   └── sample-data.js             # Verified representative sample dataset
├── views/                         # EJS templates
│   └── dashboard.ejs              # Consolidated dashboard view template
├── public/                        # Static client assets
│   ├── css/
│   │   └── dashboard.css          # Dark and Light theme stylesheets
│   ├── js/
│   │   └── dashboard.js           # Client engine (polling, state preservation, DOM diffing)
│   └── assets/                    # Static image assets / icons
└── tests/                         # Automated test suite
    ├── calculation.test.js        # Unit tests for calculations, schemas, and filters
    └── integration.test.js        # End-to-end API and route integration tests
```

---

## 5. Prerequisites

- **Node.js**: Version 18.0.0 or higher (Tested on Node v22.19.0)
- **npm**: Version 9.0.0 or higher
- **MongoDB**: MongoDB Atlas cluster or local MongoDB instance (v5.0+)

---

## 6. Installation

Clone or navigate to the project directory:

```bash
cd eqport-dashboard-v2
```

Install production and development dependencies:

```bash
npm install
```

---

## 7. Environment Configuration

1. Create your local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

2. Edit `.env` with your actual MongoDB connection string:

```env
# MongoDB Connection String
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/eqport?retryWrites=true&w=majority

# Web Server Port (Default: 3000)
PORT=3000

# Client Refresh Polling Cadence (Default: 1000 ms)
REFRESH_INTERVAL_MS=1000

# Offline / Demo Mode (Set to false for production MongoDB connection)
DEMO_MODE=false
```

### Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `MONGO_URL` | MongoDB connection URI (Atlas or local) | *None* |
| `PORT` | HTTP port on which the Express server listens | `3000` |
| `REFRESH_INTERVAL_MS` | Auto-refresh client polling interval in milliseconds | `1000` |
| `DEMO_MODE` | When `true`, loads representative test data if MongoDB is unreachable | `false` |

> **Security Note:** Never commit `.env` to version control. The `.gitignore` file is preconfigured to exclude `.env`.

---

## 8. Database Collections and Schema Alignment

The application connects to the existing MongoDB database without modifying or creating competing structures.

### Collection: `placeholders` (Model: `placeholder`)
Used by the external data-pusher to store live index values:
- `name` (String): Index symbol, e.g. `"NIFTY"`, `"BANKNIFTY"`, `"SENSEX"`
- `value` (Number): Current index level (e.g. `24367.90`)
- `pchg` (Number): Percentage change (e.g. `0.42`)
- `up_stocks` (Number): Breadth count of advancing stocks
- `down_stocks` (Number): Breadth count of declining stocks

### Collection: `portfolios` (Model: `portfolio`)
Used by the external data-pusher to store holdings per account:
- `alias` (String): Account identifier, e.g. `"HG"`, `"KG"`, `"MG"`, `"RG"`, `"AG"`
- `brokerToken` (Number): Broker security token
- `exchange` (String): Exchange code, e.g. `"NSE"`, `"BSE"`
- `tradingsymbol` (String): Security symbol, e.g. `"RELIANCE"`, `"TCS"`, `"INFY"`
- `totalQty` (Number): Holding quantity
- `averagePrice` (Number): Average purchase price
- `investedamount` (Number): Total invested cost ($\text{averagePrice} \times \text{totalQty}$)
- `closePrice` (Number): Current market price (CMP)
- `currentamount` (Number): Current market value ($\text{closePrice} \times \text{totalQty}$)
- `pnl` (Number): Absolute profit or loss ($\text{currentamount} - \text{investedamount}$)
- `plpercent` (Number): PnL percentage
- `uniqueid` (String): Unique holding key, e.g. `"HG_NSE_RELIANCE"`
- `pchg` (Number): Daily percentage change

### Collection: `scrips` (Model: `scrips`)
- `brokerToken`, `totalQty`, `investedamount`, `averagePrice`, `tradingSymbol`, `weigtage`

---

## 9. How the Application Works

### 9.1 Dynamic Exchange Discovery
Exchange values are discovered directly and dynamically from the MongoDB `portfolios` collection using:
```javascript
const rawExchanges = await portfolioModel.distinct('exchange');
```
Discovery features:
- **Server-Side Discovery**: Directly queries unique `exchange` values from MongoDB (e.g. `NSE`, `MF`, and future exchanges like `BSE`).
- **Data Normalization**: Strips surrounding whitespace and handles missing or null values safely.
- **Deduplication**: Case-insensitive deduplication prevents redundant buttons (e.g. `nse` vs `NSE`) while preserving the actual stored value required for precise database filtering.
- **Zero Hardcoding**: Frontend does not hardcode any list of exchanges.
- **Dynamic Refresh**: Newly appearing exchanges from the data-pusher automatically appear as clickable filter buttons on subsequent 1-second refresh cycles without page reloads.

### 9.2 Dynamic Account Discovery
Account aliases are discovered dynamically at runtime directly from MongoDB without hardcoded lists:
```javascript
const aliases = await portfolioModel.distinct('alias');
```
When new account aliases (such as `HG`, `KG`, `MG`, `RG`, `AG`, etc.) are written by the data-pusher, they automatically populate in the Account filter on the next refresh tick.

### 9.3 Combined Exchange and Account Filter Behavior
The control bar follows the strict visual and functional order:
$$\textbf{Exchange Filter} \longrightarrow \textbf{Account Filter} \longrightarrow \textbf{Search} \longrightarrow \textbf{Entries per Page}$$

The filters combine seamlessly across the consolidated dataset:
- **All Exchanges + All Accounts**: Displays all holdings across every exchange and account.
- **NSE + All Accounts**: Displays only NSE holdings across all accounts.
- **MF + All Accounts**: Displays only Mutual Fund (`MF`) holdings across all accounts.
- **NSE + HG**: Displays only `HG` holdings on `NSE`.
- **MF + MG**: Displays only `MG` mutual fund holdings on `MF`.
- **Empty States**: If a selected account has no holdings on the chosen exchange (or vice versa), the table displays a clean empty state (`No matching portfolio holdings found.`) without silently resetting either filter.

### 9.4 Six-Column Holdings Table
The holdings table has been streamlined to retain only six essential columns in exact order:
1. **Account** (left-aligned)
2. **Trading Symbol** (left-aligned with generous width for long mutual fund and equity names; displays the actual `tradingsymbol` field from MongoDB, never `brokerToken`)
3. **Total Qty** (right-aligned, tabular numeric)
4. **Bought Price** (right-aligned, currency formatted)
5. **CMP** (Current Market Price, right-aligned, currency formatted)
6. **PnL (%)** (right-aligned, percentage formatted with sign and green/red performance color coding)

**Removed Columns**:
- `Invested Amount`
- `Current Value`
- `Absolute PnL (₹)`

These three columns are removed entirely from the table headers, rows, DOM generation, and reconciliation logic. However, their underlying financial metrics remain available to the backend to power the single-line portfolio summary bar.

### 9.5 Portfolio Summary Bar & Financial Calculations
The desktop-optimized portfolio summary displays on a single horizontal line:
$$\text{Total Investment: ₹X} \;\;|\;\; \text{Current Value: ₹Y} \;\;|\;\; \text{Total PnL: ₹Z (+/-P\%) }$$

- **Dynamic Recalculation**: Recalculates dynamically whenever the selected Exchange or Account changes.
- **Precise Aggregation**: Total PnL percentage is calculated from the true invested base:
  $$\text{Total PnL \%} = \frac{\sum \text{PnL}}{\sum \text{Invested Amount}} \times 100$$
- Never calculates portfolio return by averaging individual holding percentages.
- Protected against division-by-zero when invested amount is zero.

### 9.6 One-Second Real-Time Refresh Cycle
1. Every 1000 milliseconds, `fetchDashboardData()` requests:
   ```
   /api/dashboard?exchange=<selectedExchange>&accounts=<selectedAccount>
   ```
2. **Single-Flight Guard**: An `isFetching` lock prevents overlapping HTTP requests if a network request takes longer than 1000 ms.
3. If a request temporarily encounters network latency, existing data is retained on screen, and an unobtrusive "Reconnecting..." indicator is displayed without disrupting the user.
4. The `lastRefreshed` timestamp updates only upon a verified successful response.

### 9.7 Flicker-Free In-Place DOM Reconciliation
- Each row possesses a stable key (`data-row-key="${alias}_${exchange}_${token || tradingsymbol}"`).
- On each tick, the client compares existing rows with incoming data.
- **In-place updates**: Only text values and color classes of cells whose values changed are updated.
- Unchanged rows and cells are left untouched.
- DOM nodes are neither destroyed nor recreated unnecessarily.

### 9.8 100% UI State Preservation
The client engine preserves all UI state across every 1-second background refresh:
- **Selected Exchange**: Retains selected exchange (e.g. `MF`, `NSE`, or `all`).
- **Selected Account**: Retains selected account (e.g. `HG`, `MG`, or `all`).
- **Search Query**: Retains the filter term and keyboard focus.
- **Sort Column & Direction**: Retains sort settings (e.g., PnL % descending) across all 6 columns.
- **Page Size**: Defaults to 10 entries on a fresh dashboard opening (available options: 10, 25, 50, or 100) and preserves user selection across refreshes.
- **Page Number**: Retains current page (e.g. Page 2) when valid.
- **Theme**: Retains Dark or Light theme.
- **Scroll Position**: Scroll positions remain fixed.

---

## 10. API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | `GET` | Main consolidated dashboard web interface |
| `/api/dashboard` | `GET` | Consolidated atomic payload: markets, available exchanges, available accounts, summary, and holdings. Accepts query parameters `?exchange=NSE&accounts=HG`. |
| `/api/exchanges` | `GET` | Dynamic list of unique exchange values discovered from MongoDB (`portfolios.exchange`) |
| `/api/accounts` | `GET` | Dynamic list of distinct account aliases discovered from MongoDB (`portfolios.alias`) |
| `/api/portfolio` | `GET` | Holdings and calculated summary filtered by `?exchange=...` and `?accounts=...` |
| `/api/market` | `GET` | Live market index records from `placeholders` |
| `/api/places` | `GET` | Backward-compatible market indices endpoint |
| `/api/data/all` | `GET` | Backward-compatible endpoint returning all portfolio holdings |
| `/api/data/:alias` | `GET` | Backward-compatible endpoint returning holdings for `:alias` (e.g. `/api/data/hg`) |
| `/api/data/scrips` | `GET` | Backward-compatible endpoint returning scrips records |
| `/api/health` | `GET` | Server diagnostics, uptime, and database connection state |
| `/:alias` | `GET` | 301 Redirect from legacy account routes (`/hg`, `/kg`, etc.) to `/?account=:alias` |

---

## 11. Running the Application

### Start Production Server:
```bash
npm start
```

### Start Development Server (with auto-reload):
```bash
npm run dev
```

### Accessing the Dashboard:
Open your web browser and navigate to:
```
http://localhost:3000
```

---

## 12. Running Tests

The application includes unit tests and end-to-end integration tests:

### Run Schema & Financial Calculation Unit Tests:
```bash
npm test
```
*Validates schema fields, calculations, PnL percentages, division-by-zero handling, and filter normalizations.*

### Run Full Test Suite (Unit + Integration):
```bash
npm run test:all
```
*Validates running HTTP endpoints, JSON response formats, account filtering, and legacy route redirects.*

---

## 13. Troubleshooting

### 1. `MONGO_URL is not defined in environment variables`
- Ensure you created the `.env` file in `eqport-dashboard-v2/`.
- Verify the variable name is exactly `MONGO_URL`.
- If testing locally without MongoDB, set `DEMO_MODE=true` in `.env` to inspect the UI with representative mock data.

### 2. MongoDB Connection Timeout or Network Failure
- Confirm your IP address is whitelisted in MongoDB Atlas Network Access (`0.0.0.0/0` or current IP).
- Check that your username and password in the connection string are correct and URL-encoded if they contain special characters.
- Check the server log on startup for masked connection diagnostics.

### 3. Empty Collections
- If MongoDB is connected but collections are empty, the dashboard will display zeroed metrics and an empty state message: `No matching portfolio holdings found.`
- The dashboard will remain live and automatically populate once your external data-pusher starts writing records.

---

## 14. Architecture and Scope Notice

- **Monitoring Scope**: This application is strictly a **read-only portfolio monitoring dashboard**. It does not place orders, initiate trades, or execute financial transactions.
- **External Data Pusher**: The separate external data-pusher program remains completely independent and untouched. This dashboard does not interfere with or replace its database write operations.
