"use strict";

const { Op } = require("sequelize");
const EventEmitter = require("events");

class ConfigurationService extends EventEmitter {
  constructor({ Configuration }) {
    super();
    this.Configuration = Configuration;
    this.cachedConfigurations = [];
  }

  async getConfigurations(filter = {}) {
    try {
      const configurations = await this.Configuration.findAll({
        where: filter,
        order: [["id", "ASC"]],
      });
      return configurations;
    } catch (error) {
      console.error("Error fetching configurations:", error);
      throw error;
    }
  }

  async getActiveConfigurations() {
    try {
      const configurations = await this.Configuration.findAll({
        where: { active: true },
        order: [["id", "ASC"]],
      });

      // Cache the active configurations
      this.cachedConfigurations = configurations;

      return configurations;
    } catch (error) {
      console.error("Error fetching active configurations:", error);

      // Return cached configurations if available
      if (this.cachedConfigurations.length > 0) {
        console.log("Using cached configurations due to error");
        return this.cachedConfigurations;
      }

      throw error;
    }
  }

  async getConfigurationById(id) {
    try {
      const configuration = await this.Configuration.findByPk(id);
      if (!configuration) {
        throw new Error(`Configuration with ID ${id} not found`);
      }
      return configuration;
    } catch (error) {
      console.error(`Error fetching configuration with ID ${id}:`, error);
      throw error;
    }
  }

  async createConfiguration(configData) {
    try {
      // Validate addresses if provided
      if (configData.fromAddress && !this.isValidEthereumAddress(configData.fromAddress)) {
        throw new Error("Invalid fromAddress format");
      }

      if (configData.toAddress && !this.isValidEthereumAddress(configData.toAddress)) {
        throw new Error("Invalid toAddress format");
      }

      // Create the configuration
      const configuration = await this.Configuration.create(configData);

      // Emit change event
      this.emit("configurationChanged", { type: "create", configurationId: configuration.id });

      return configuration;
    } catch (error) {
      console.error("Error creating configuration:", error);
      throw error;
    }
  }

  async updateConfiguration(id, configData) {
    try {
      // Get the configuration
      const configuration = await this.Configuration.findByPk(id);
      if (!configuration) {
        throw new Error(`Configuration with ID ${id} not found`);
      }

      // Validate addresses if provided
      if (configData.fromAddress && !this.isValidEthereumAddress(configData.fromAddress)) {
        throw new Error("Invalid fromAddress format");
      }

      if (configData.toAddress && !this.isValidEthereumAddress(configData.toAddress)) {
        throw new Error("Invalid toAddress format");
      }
      if (configData.maxValue) {
        const maxValue = parseFloat(configData.maxValue);
        if (isNaN(maxValue) || maxValue < 0) {
          throw new Error("maxValue must be a positive number");
        }
        configData.maxValue = maxValue.toString();
      }

      if (configData.minValue) {
        const minValue = parseFloat(configData.minValue);
        if (isNaN(minValue) || minValue < 0) {
          throw new Error("minValue must be a positive number");
        }
        configData.minValue = minValue.toString();
      }

      // Validate gas price values
      if (configData.minGasPrice) {
        const minGasPrice = parseFloat(configData.minGasPrice);
        if (isNaN(minGasPrice) || minGasPrice < 0) {
          throw new Error("minGasPrice must be a positive number");
        }
        configData.minGasPrice = minGasPrice.toString();
      }

      if (configData.maxGasPrice) {
        const maxGasPrice = parseFloat(configData.maxGasPrice);
        if (isNaN(maxGasPrice) || maxGasPrice < 0) {
          throw new Error("maxGasPrice must be a positive number");
        }
        configData.maxGasPrice = maxGasPrice.toString();
      }

      // Validate gas used values
      if (configData.minGasUsed) {
        const minGasUsed = parseFloat(configData.minGasUsed);
        if (isNaN(minGasUsed) || minGasUsed < 0) {
          throw new Error("minGasUsed must be a positive number");
        }
        configData.minGasUsed = minGasUsed.toString();
      }

      if (configData.maxGasUsed) {
        const maxGasUsed = parseFloat(configData.maxGasUsed);
        if (isNaN(maxGasUsed) || maxGasUsed < 0) {
          throw new Error("maxGasUsed must be a positive number");
        }
        configData.maxGasUsed = maxGasUsed.toString();
      }

      // Update the configuration
      await configuration.update(configData);

      // Emit change event
      this.emit("configurationChanged", { type: "update", configurationId: id });

      return configuration;
    } catch (error) {
      console.error(`Error updating configuration with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteConfiguration(id) {
    try {
      // Get the configuration
      const configuration = await this.Configuration.findByPk(id);
      if (!configuration) {
        throw new Error(`Configuration with ID ${id} not found`);
      }

      // Delete the configuration
      await configuration.destroy();

      // Emit change event
      this.emit("configurationChanged", { type: "delete", configurationId: id });

      return { success: true, message: `Configuration with ID ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting configuration with ID ${id}:`, error);
      throw error;
    }
  }

  // Helper method to validate Ethereum addresses
  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/i.test(address);
  }
}

module.exports = ConfigurationService;
