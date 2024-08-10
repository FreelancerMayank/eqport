const mongoose = require("mongoose");

const portfolioSchema = mongoose.Schema({
    alias: String,
    brokerToken: Number,
    exchange: String,
    tradingsymbol: String,
    totalQty:Number,
    averagePrice: Number,
    closePrice: Number,
    plpercent: Number
})

module.exports = mongoose.model("portfolio",portfolioSchema);

