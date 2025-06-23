"use strict";

require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const { createContainer, asClass, asValue, asFunction } = require("awilix");

const configureRoutes = require("./routes");
const configureDatabase = require("./config/database");
const EthereumMonitor = require("./services/EthereumMonitor");
const ConfigurationService = require("./services/ConfigurationService");
const TransactionService = require("./services/TransactionService");

const Configuration = require("./models/Configuration");
const Transaction = require("./models/Transaction");

const app = express();
const PORT = process.env.PORT || 3000;
const container = createContainer();

app.use(express.json());
app.use(morgan("dev"));

container.register({
  ethereumMonitor: asClass(EthereumMonitor).singleton(),
  configurationService: asClass(ConfigurationService).singleton(),
  transactionService: asClass(TransactionService).singleton(),

  Configuration: asValue(Configuration),
  Transaction: asValue(Transaction),

  app: asValue(app),
});

app.use((req, res, next) => {
  req.container = container;
  next();
});

(async () => {
  try {
    await configureDatabase();
    console.log("Database initialized successfully"); 
    configureRoutes(app, container);

    try {
      const ethereumMonitor = container.resolve("ethereumMonitor");
      await ethereumMonitor.init();
    } catch (error) {
      console.warn("Failed to initialize Ethereum monitoring:", error.message);
      console.warn("The application will run without Ethereum monitoring.");
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
