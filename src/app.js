require("dotenv").config();
const express = require("express");
const userRoutes = require("../src/routes/userRoutes");
const productRoutes = require("../src/routes/productRouter");
const stockRoutes = require("../src/routes/stockRouter"); // 🔹 Adicionando as rotas de estoque
const swaggerDocs = require("./config/swaggerDocs");

const app = express();
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api", stockRoutes); // 🔹 Ativar rotas de estoque

swaggerDocs(app);

module.exports = app;
