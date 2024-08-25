const mongoose = require("mongoose");

const portfolioSchema = mongoose.Schema({
    alias: String,
    brokerToken: Number,
    exchange: String,
    tradingsymbol: String,
    totalQty:Number,
    averagePrice: Number,
    investedamount: Number,
    closePrice: Number,
    plpercent: Number,
    uniqueid:String,
    pnl:Number,
    currentamount: Number,
    pchg: Number
})

module.exports = mongoose.model("portfolio",portfolioSchema);

