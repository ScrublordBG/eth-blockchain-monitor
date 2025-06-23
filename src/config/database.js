"use strict";

const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DB_PATH || "./data/ethereum_monitoring.sqlite";

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
});

async function configureDatabase() {
  try {
    const Configuration = require("../models/Configuration");
    const Transaction = require("../models/Transaction");

    Configuration.init(sequelize);
    Transaction.init(sequelize);

    Configuration.hasMany(Transaction, {
      foreignKey: "configurationId",
      as: "transactions",
    });

    Transaction.belongsTo(Configuration, {
      foreignKey: "configurationId",
      as: "configuration",
    });

    await sequelize.sync();

    return sequelize;
  } catch (error) {
    console.error("Database configuration error:", error);
    throw error;
  }
}

module.exports = configureDatabase;
module.exports.sequelize = sequelize;
