const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Usuários, Produtos e Estoque",
      version: "1.2.0",
      description: "Documentação da API incluindo usuários, produtos e controle de estoque",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Servidor Local",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [
    "./src/routes/*.js", 
    path.join(__dirname, "../docs/swagger.yaml"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📄 Swagger Docs disponível em: http://localhost:4000/api-docs");
}

module.exports = swaggerDocs;
