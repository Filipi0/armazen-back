require("dotenv").config();
const express = require("express");
const cors = require("cors"); // 🔹 Para permitir requisições de outras origens
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRouter");
const stockRoutes = require("./routes/stockRouter"); // 🔹 Adicionando as rotas de estoque
const swaggerDocs = require("./config/swaggerDocs");

const app = express();

// 🔹 Configuração do Middleware
app.use(cors()); // 🔹 Habilita CORS (importante para o front-end acessar)
app.use(express.json());

// 🔹 Definição das Rotas
app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api", stockRoutes);

// 🔹 Rota Inicial para evitar erro "Cannot GET /"
app.get("/", (req, res) => {
  res.send("API rodando! Acesse /api-docs para ver a documentação.");
});

// 🔹 Ativar Swagger
swaggerDocs(app);

// 🔹 Exportar o app
module.exports = app;
