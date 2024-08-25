const express = require("express");
const app = express();
const portfolioModel = require("./models/portfolio.model");
const path = require("path");
const placeholderModel = require("./models/placeholder.model");
const scripsModel = require("./models/scrips.model");

app.set("view engine","ejs");

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
require('dotenv').config();

//for hg-
app.get('/', async(req, res) => {
  try {
    const data = await portfolioModel.find({alias:"HG"});

    //percentage values: totalScripsCount/invested_amt*100

    const amt = data.reduce((acc,item)=>{
      return acc + (item.investedamount);
    },0);
    const invested_amt = amt.toFixed(2);
    

    //total pnl values:
    const totalScrips = data.length;
    const sum = data.reduce((acc, item) => {
      return acc + (item.pnl);
  }, 0);
    const totalScripsCount = sum.toFixed(2);
    

    //pnlpercent:
    const pnlPercent = ((totalScripsCount/invested_amt)*100).toFixed(0);
      
      //negative pnl values: 
     const negativeValuesArray = data.filter(obj => obj.pnl < 0);
     const negativeScripsCount = negativeValuesArray.length;

     const sumOfNegativeValues = negativeValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const negativeScripsPnL = sumOfNegativeValues.toFixed(2);

      //positive pnl values:
      const positiveValuesArray = data.filter(obj => obj.pnl > 0);
     const positiveScripsCount = positiveValuesArray.length;

     const sumOfPositiveValues = positiveValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const positiveScripsPnL = sumOfPositiveValues.toFixed(2);

     res.render('hg',{alias:"HG",totalScrips,totalScripsCount,nsc: negativeScripsCount,nscpnl: negativeScripsPnL,psc: positiveScripsCount, pscpnl:positiveScripsPnL,pnlPercent,invested_amt});
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/data/hg', async (req, res) => {
    try {
      const data = await portfolioModel.find({alias:"HG"});
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    }
  });

app.get('/api/places', async (req, res) => {
    try {
      const places = await placeholderModel.find();
      res.json(places);
    } catch (error) {
      res.status(500).send(error);
    }
  });

//for kg-
app.get('/kg', async(req, res) => {
  try {
    const data = await portfolioModel.find({alias:"KG"});

    //percentage values: totalScripsCount/invested_amt*100

    const amt = data.reduce((acc,item)=>{
      return acc + (item.investedamount);
    },0);
    const invested_amt = amt.toFixed(2);
    

    //total pnl values:
    const totalScrips = data.length;
    const sum = data.reduce((acc, item) => {
      return acc + (item.pnl);
  }, 0);
    const totalScripsCount = sum.toFixed(2);
    

    //pnlpercent:
    const pnlPercent = ((totalScripsCount/invested_amt)*100).toFixed(0);
      
      //negative pnl values: 
     const negativeValuesArray = data.filter(obj => obj.pnl < 0);
     const negativeScripsCount = negativeValuesArray.length;

     const sumOfNegativeValues = negativeValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const negativeScripsPnL = sumOfNegativeValues.toFixed(2);

      //positive pnl values:
      const positiveValuesArray = data.filter(obj => obj.pnl > 0);
     const positiveScripsCount = positiveValuesArray.length;

     const sumOfPositiveValues = positiveValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const positiveScripsPnL = sumOfPositiveValues.toFixed(2);

     res.render('kg',{alias:"KG",totalScrips,totalScripsCount,nsc: negativeScripsCount,nscpnl: negativeScripsPnL,psc: positiveScripsCount, pscpnl:positiveScripsPnL,pnlPercent,invested_amt}); 
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/data/kg', async (req, res) => {
    try {
      const data = await portfolioModel.find({alias:"KG"});
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    }
  });

//for mg-
app.get('/mg', async(req, res) => {
  try {
    const data = await portfolioModel.find({alias:"MG"});

    //percentage values: totalScripsCount/invested_amt*100

    const amt = data.reduce((acc,item)=>{
      return acc + (item.investedamount);
    },0);
    const invested_amt = amt.toFixed(2);
    

    //total pnl values:
    const totalScrips = data.length;
    const sum = data.reduce((acc, item) => {
      return acc + (item.pnl);
  }, 0);
    const totalScripsCount = sum.toFixed(2);
    

    //pnlpercent:
    const pnlPercent = ((totalScripsCount/invested_amt)*100).toFixed(0);
      
      //negative pnl values: 
     const negativeValuesArray = data.filter(obj => obj.pnl < 0);
     const negativeScripsCount = negativeValuesArray.length;

     const sumOfNegativeValues = negativeValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const negativeScripsPnL = sumOfNegativeValues.toFixed(2);

      //positive pnl values:
      const positiveValuesArray = data.filter(obj => obj.pnl > 0);
     const positiveScripsCount = positiveValuesArray.length;

     const sumOfPositiveValues = positiveValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const positiveScripsPnL = sumOfPositiveValues.toFixed(2);

     res.render('mg',{alias:"MG",totalScrips,totalScripsCount,nsc: negativeScripsCount,nscpnl: negativeScripsPnL,psc: positiveScripsCount, pscpnl:positiveScripsPnL,pnlPercent,invested_amt}); 
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/data/mg', async (req, res) => {
    try {
      const data = await portfolioModel.find({alias:"MG"});
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    }
  });

//for ag-
app.get('/api/data/ag', async(req, res) => {
    try{
      const data = await portfolioModel.find({alias:"AG"})
      res.json(data);
    }catch(error) {
      res.status(500).send(error);
    }
  });

app.get('/ag', async (req, res) => {
    try {
      const data = await portfolioModel.find({alias:"AG"});

      //percentage values: totalScripsCount/invested_amt*100

      const amt = data.reduce((acc,item)=>{
        return acc + (item.investedamount);
      },0);
      const invested_amt = amt.toFixed(2);
      

      //total pnl values:
      const totalScrips = data.length;
      const sum = data.reduce((acc, item) => {
        return acc + (item.pnl);
    }, 0);
      const totalScripsCount = sum.toFixed(2);
      

      //pnlpercent:
      const pnlPercent = ((totalScripsCount/invested_amt)*100).toFixed(0);
        
        //negative pnl values: 
       const negativeValuesArray = data.filter(obj => obj.pnl < 0);
       const negativeScripsCount = negativeValuesArray.length;

       const sumOfNegativeValues = negativeValuesArray.reduce((accumulator, obj) => {
        return accumulator + obj.pnl;
    }, 0);
       const negativeScripsPnL = sumOfNegativeValues.toFixed(2);

        //positive pnl values:
        const positiveValuesArray = data.filter(obj => obj.pnl > 0);
       const positiveScripsCount = positiveValuesArray.length;

       const sumOfPositiveValues = positiveValuesArray.reduce((accumulator, obj) => {
        return accumulator + obj.pnl;
    }, 0);
       const positiveScripsPnL = sumOfPositiveValues.toFixed(2);

       res.render('ag',{alias:"AG",totalScrips,totalScripsCount,nsc: negativeScripsCount,nscpnl: negativeScripsPnL,psc: positiveScripsCount, pscpnl:positiveScripsPnL,pnlPercent,invested_amt});
    } catch (error) {
      res.status(500).send(error);
    }
  });

//for rg-
app.get('/rg', async(req, res) => {
  try {
    const data = await portfolioModel.find({alias:"RG"});

    //percentage values: totalScripsCount/invested_amt*100

    const amt = data.reduce((acc,item)=>{
      return acc + (item.investedamount);
    },0);
    const invested_amt = amt.toFixed(2);
    

    //total pnl values:
    const totalScrips = data.length;
    const sum = data.reduce((acc, item) => {
      return acc + (item.pnl);
  }, 0);
    const totalScripsCount = sum.toFixed(2);
    

    //pnlpercent:
    const pnlPercent = ((totalScripsCount/invested_amt)*100).toFixed(0);
      
      //negative pnl values: 
     const negativeValuesArray = data.filter(obj => obj.pnl < 0);
     const negativeScripsCount = negativeValuesArray.length;

     const sumOfNegativeValues = negativeValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const negativeScripsPnL = sumOfNegativeValues.toFixed(2);

      //positive pnl values:
      const positiveValuesArray = data.filter(obj => obj.pnl > 0);
     const positiveScripsCount = positiveValuesArray.length;

     const sumOfPositiveValues = positiveValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const positiveScripsPnL = sumOfPositiveValues.toFixed(2);

     res.render('rg',{alias:"RG",totalScrips,totalScripsCount,nsc: negativeScripsCount,nscpnl: negativeScripsPnL,psc: positiveScripsCount, pscpnl:positiveScripsPnL,pnlPercent,invested_amt});
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/data/rg', async (req, res) => {
    try {
      const data = await portfolioModel.find({alias:"RG"});
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    }
  });

  // for all-
app.get("/all",async(req,res)=>{
  try {
    const data = await portfolioModel.find();

    //percentage values: totalScripsCount/invested_amt*100

    const amt = data.reduce((acc,item)=>{
      return acc + (item.investedamount);
    },0);
    const invested_amt = amt.toFixed(2);
    

    //total pnl values:
    const totalScrips = data.length;
    const sum = data.reduce((acc, item) => {
      return acc + (item.pnl);
  }, 0);
    const totalScripsCount = sum.toFixed(2);
    

    //pnlpercent:
    const pnlPercent = ((totalScripsCount/invested_amt)*100).toFixed(0);
      
      //negative pnl values: 
     const negativeValuesArray = data.filter(obj => obj.pnl < 0);
     const negativeScripsCount = negativeValuesArray.length;

     const sumOfNegativeValues = negativeValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const negativeScripsPnL = sumOfNegativeValues.toFixed(2);

      //positive pnl values:
      const positiveValuesArray = data.filter(obj => obj.pnl > 0);
     const positiveScripsCount = positiveValuesArray.length;

     const sumOfPositiveValues = positiveValuesArray.reduce((accumulator, obj) => {
      return accumulator + obj.pnl;
  }, 0);
     const positiveScripsPnL = sumOfPositiveValues.toFixed(2);

     res.render('combined',{totalScrips,totalScripsCount,nsc: negativeScripsCount,nscpnl: negativeScripsPnL,psc: positiveScripsCount, pscpnl:positiveScripsPnL,pnlPercent,invested_amt});
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/data/all', async (req, res) => {
    try {
      const data = await portfolioModel.find();
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    }
  });

app.get("/scrips",(req,res)=>{
  res.render("scrips");
})

app.get("/api/data/scrips",async (req,res)=>{
  const data = await scripsModel.find();
  res.json(data);
})

app.listen(process.env.PORT);