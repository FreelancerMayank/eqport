const express = require("express");
const app = express();
const portfolioModel = require("./models/portfolio.model");
const path = require("path");
const placeholderModel = require("./models/placeholder.model");

app.set("view engine","ejs");

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
require('dotenv').config();

//for hg-
app.get('/', async(req, res) => {
    res.render('hg',{alias:"HG"}); // Renders 'views/index.ejs'
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
    res.render("kg",{alias:"KG"}); // Renders 'views/index.ejs'
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
    res.render('mg',{alias:"MG"}); // Renders 'views/index.ejs'
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
app.get('/ag', async(req, res) => {
    res.render('ag',{alias:"AG"}); // Renders 'views/index.ejs'
  });

app.get('/api/data/ag', async (req, res) => {
    try {
      const data = await portfolioModel.find({alias:"AG"});
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    }
  });

//for rg-
app.get('/rg', async(req, res) => {
    res.render('rg',{alias:"RG"}); // Renders 'views/index.ejs'
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
    res.render("combined");
})

app.get('/api/data/all', async (req, res) => {
    try {
      const data = await portfolioModel.find();
      res.json(data);
    } catch (error) {
      res.status(500).send(error);
    }
  });


// app.get("/place",async (req,res)=>{
    
//     res.render("placetry",{places:places});
// })


app.listen(process.env.PORT);