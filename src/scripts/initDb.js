"use strict";

require("dotenv").config();

const configureDatabase = require("../config/database");
const Configuration = require("../models/Configuration");

const sampleConfigurations = [
  {
    name: "High Value Transfers",
    description: "Monitor transactions with value greater than 100 ETH",
    active: true,
    minValue: "100000000000000000000", // 100 ETH in wei
  },
  {
    name: "Specific Address Monitor",
    description: "Monitor transactions involving a specific address",
    active: true,
    fromAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Example address
  },
  {
    name: "Delayed Block Processing",
    description: "Process transactions with a 10 block delay",
    active: true,
    minValue: "10000000000000000000", // 10 ETH in wei
    blockDelay: 10,
  },
];

async function initDatabase() {
  try {
    console.log("Initializing database...");

    await configureDatabase();
    console.log("Database configured successfully");

    const count = await Configuration.count();

    if (count === 0) {
      console.log("No configurations found, creating sample configurations...");

      for (const config of sampleConfigurations) {
        await Configuration.create(config);
        console.log(`Created configuration: ${config.name}`);
      }

      console.log("Sample configurations created successfully");
    } else {
      console.log(`Found ${count} existing configurations, skipping sample data creation`);
    }

    console.log("Database initialization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

initDatabase();
