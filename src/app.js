require("dotenv").config();
const express = require("express");
const userRoutes = require("../src/routes/userRoutes");
const swaggerDocs = require("./config/swaggerDocs");

const app = express();
app.use(express.json());

// Rotas da API
app.use("/api", userRoutes);

// Ativar a documentação Swagger
swaggerDocs(app);

module.exports = app;
