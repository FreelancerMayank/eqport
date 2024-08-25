const mongoose = require("mongoose");
const uri = process.env.MONGO_URL;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
  });


const placeholderSchema = mongoose.Schema({
    name:String,
    value:Number,
    pchg:Number,
    down_stocks:Number,
    up_stocks:Number
  })

module.exports = mongoose.model("placeholder",placeholderSchema);