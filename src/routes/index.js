"use strict";

const ConfigurationController = require("../controllers/ConfigurationController");
const TransactionController = require("../controllers/TransactionController");
const { asClass } = require("awilix");

function configureRoutes(app, container) {
  container.register({
    configurationController: asClass(ConfigurationController).singleton(),
    transactionController: asClass(TransactionController).singleton(),
  });

  const configurationController = container.resolve("configurationController");
  const transactionController = container.resolve("transactionController");

  app.get("/api", (req, res) => {
    res.status(200).json({
      status: "OK",
      message: "Server is running",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/configurations", (req, res) => configurationController.getConfigurations(req, res));
  app.get("/api/configurations/:id", (req, res) => configurationController.getConfigurationById(req, res));
  app.post("/api/configurations", (req, res) => configurationController.createConfiguration(req, res));
  app.put("/api/configurations/:id", (req, res) => configurationController.updateConfiguration(req, res));
  app.delete("/api/configurations/:id", (req, res) => configurationController.deleteConfiguration(req, res));

  app.get("/api/transactions", (req, res) => transactionController.getTransactions(req, res));
  app.get("/api/transactions/hash/:hash", (req, res) => transactionController.getTransactionByHash(req, res));
  app.get("/api/configurations/:configurationId/transactions", (req, res) =>
    transactionController.getTransactionsByConfigurationId(req, res)
  );
  
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });
}

module.exports = configureRoutes;
