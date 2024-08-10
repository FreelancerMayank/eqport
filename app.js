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

//
app.get('/', async(req, res) => {
    const places = await placeholderModel.find();
    res.render('example',{places:places,alias:"HG"}); // Renders 'views/index.ejs'
  });

app.get('/api/data', async (req, res) => {
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

// app.get("/",async(req,res)=>{
//     const places = await placeholderModel.find();
//     const data = await portfolioModel.find({alias:"HG"});
//     res.render("data",{places:places,data:data,alias:"HG"});
// })

// app.get("/mg",async(req,res)=>{
//     const places = await placeholderModel.find();
//     const data = await portfolioModel.find({alias:"MG"});
//     res.render("data",{places:places,data:data,alias:"MG"});
// })

// app.get("/kg",async(req,res)=>{
//     const places = await placeholderModel.find();
//     const data = await portfolioModel.find({alias:"KG"});
//     res.render("data",{places:places,data:data,alias:"KG"});
// })
// app.get("/ag",async(req,res)=>{
//     const places = await placeholderModel.find();
//     const data = await portfolioModel.find({alias:"AG"});
//     res.render("data",{places:places,data:data,alias:"AG"});
// })
// app.get("/rg",async(req,res)=>{
//     const places = await placeholderModel.find();
//     const data = await portfolioModel.find({alias:"RG"});
//     res.render("data",{places:places,data:data,alias:"RG"});
// })
// app.get("/all",async(req,res)=>{
//     const places = await placeholderModel.find();
//     const data = await portfolioModel.find();
//     res.render("combined",{places:places,data:data});
// })


app.listen(process.env.PORT);