const mongoose = require('mongoose');

const scripsSchema = new mongoose.Schema(
  {
    brokerToken: { type: Number },
    totalQty: { type: Number, default: 0 },
    investedamount: { type: Number, default: 0 },
    averagePrice: { type: Number, default: 0 },
    tradingSymbol: { type: String, index: true },
    weigtage: { type: Number, default: 0 }
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'scrips'
  }
);

module.exports = mongoose.model('scrips', scripsSchema);
