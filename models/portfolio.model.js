const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    alias: { type: String, required: true, index: true },
    brokerToken: { type: Number },
    exchange: { type: String },
    tradingsymbol: { type: String, required: true, index: true },
    totalQty: { type: Number, default: 0 },
    averagePrice: { type: Number, default: 0 },
    investedamount: { type: Number, default: 0 },
    closePrice: { type: Number, default: 0 },
    plpercent: { type: Number, default: 0 },
    uniqueid: { type: String, index: true },
    pnl: { type: Number, default: 0 },
    currentamount: { type: Number, default: 0 },
    pchg: { type: Number, default: 0 }
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'portfolios'
  }
);

module.exports = mongoose.model('portfolio', portfolioSchema);
