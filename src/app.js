require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRouter");
const stockRoutes = require("./routes/stockRouter");
const swaggerDocs = require("./config/swaggerDocs");

const app = express();

//Configuração do Middleware
app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api", stockRoutes);

//Rota Inicial para evitar erro "Cannot GET /"
app.get("/", (req, res) => {
  res.send("API rodando! Acesse /api-docs para ver a documentação.");
});

swaggerDocs(app);

module.exports = app;
