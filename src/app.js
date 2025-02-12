require("dotenv").config();
const express = require("express");
const userRoutes = require("../src/routes/userRoutes");
const productRoutes = require("../src/routes/productRouter");
const swaggerDocs = require("./config/swaggerDocs");

const app = express();
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api", productRoutes); // 🔹 Ativar rotas de produtos

swaggerDocs(app);

module.exports = app;
