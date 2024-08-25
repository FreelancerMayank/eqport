const mongoose = require("mongoose");

const scripsSchema = mongoose.Schema({
     brokerToken: Number,
     totalQty:Number,
     investedamount:Number,
     averagePrice:Number,
     tradingSymbol:String,
     weigtage:Number

})

const scripsModel = mongoose.model("scrips",scripsSchema);

module.exports = scripsModel;