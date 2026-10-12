const mongoose = require('mongoose');

const placeholderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    value: { type: Number, default: 0 },
    pchg: { type: Number, default: 0 },
    down_stocks: { type: Number, default: 0 },
    up_stocks: { type: Number, default: 0 }
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'placeholders'
  }
);

module.exports = mongoose.model('placeholder', placeholderSchema);
