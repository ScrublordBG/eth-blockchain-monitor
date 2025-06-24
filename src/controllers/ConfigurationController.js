"use strict";

class ConfigurationController {
  constructor({ configurationService }) {
    this.configurationService = configurationService;
  }

  async getConfigurations(req, res) {
    try {
      const filter = req.query.active ? { active: req.query.active === "true" } : {};
      const configurations = await this.configurationService.getConfigurations(filter);

      return res.status(200).json({
        success: true,
        data: configurations,
      });
    } catch (error) {
      console.error("Error fetching configurations:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch configurations",
        error: error.message,
      });
    }
  }

  async getConfigurationById(req, res) {
    try {
      const { id } = req.params;
      const configuration = await this.configurationService.getConfigurationById(id);

      return res.status(200).json({
        success: true,
        data: configuration,
      });
    } catch (error) {
      console.error(`Error fetching configuration with ID ${req.params.id}:`, error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch configuration",
        error: error.message,
      });
    }
  }

  async createConfiguration(req, res) {
    try {
      const configurationData = req.body;

      // Basic field validation
      if (!configurationData.name) {
        return res.status(400).json({
          success: false,
          message: "Configuration name is required",
        });
      }

      // Validate the configuration data
      const validationError = this.validateConfigurationData(configurationData);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: validationError,
        });
      }

      const configuration = await this.configurationService.createConfiguration(configurationData);

      return res.status(201).json({
        success: true,
        data: configuration,
        message: "Configuration created successfully",
      });
    } catch (error) {
      console.error("Error creating configuration:", error);

      if (error.name === "SequelizeValidationError" || error.message.includes("Invalid")) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create configuration",
        error: error.message,
      });
    }
  }

  async updateConfiguration(req, res) {
    try {
      const { id } = req.params;
      const configurationData = req.body;

      // Validate the configuration data
      const validationError = this.validateConfigurationData(configurationData);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: validationError,
        });
      }

      const configuration = await this.configurationService.updateConfiguration(id, configurationData);

      return res.status(200).json({
        success: true,
        data: configuration,
        message: "Configuration updated successfully",
      });
    } catch (error) {
      console.error(`Error updating configuration with ID ${req.params.id}:`, error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === "SequelizeValidationError" || error.message.includes("Invalid")) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update configuration",
        error: error.message,
      });
    }
  }

  async deleteConfiguration(req, res) {
    try {
      const { id } = req.params;

      await this.configurationService.deleteConfiguration(id);

      return res.status(200).json({
        success: true,
        message: `Configuration with ID ${id} deleted successfully`,
      });
    } catch (error) {
      console.error(`Error deleting configuration with ID ${req.params.id}:`, error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to delete configuration",
        error: error.message,
      });
    }
  }

  // Validate configuration data
  validateConfigurationData(data) {
    // Validate Ethereum addresses
    if (data.fromAddress && !/^0x[a-fA-F0-9]{40}$/i.test(data.fromAddress)) {
      return "Invalid fromAddress format. Must be a valid Ethereum address (0x followed by 40 hex characters)";
    }

    if (data.toAddress && !/^0x[a-fA-F0-9]{40}$/i.test(data.toAddress)) {
      return "Invalid toAddress format. Must be a valid Ethereum address (0x followed by 40 hex characters)";
    }

    // Validate numeric values
    if (data.minValue !== undefined) {
      if (data.minValue === "") {
        data.minValue = null;
      } else {
        try {
          const value = BigInt(data.minValue);
          if (value < 0) {
            return "minValue must be a non-negative number";
          }
        } catch (error) {
          return "minValue must be a valid number or string representation of a number";
        }
      }
    }

    if (data.maxValue !== undefined) {
      if (data.maxValue === "") {
        data.maxValue = null;
      } else {
        try {
          const value = BigInt(data.maxValue);
          if (value < 0) {
            return "maxValue must be a non-negative number";
          }
        } catch (error) {
          return "maxValue must be a valid number or string representation of a number";
        }
      }
    }

    // Check if minValue > maxValue
    if (data.minValue && data.maxValue) {
      const min = BigInt(data.minValue);
      const max = BigInt(data.maxValue);
      if (min > max) {
        return "minValue cannot be greater than maxValue";
      }
    }

    // Validate gas price values
    if (data.minGasPrice !== undefined) {
      if (data.minGasPrice === "") {
        data.minGasPrice = null;
      } else {
        try {
          const value = BigInt(data.minGasPrice);
          if (value < 0) {
            return "minGasPrice must be a non-negative number";
          }
        } catch (error) {
          return "minGasPrice must be a valid number or string representation of a number";
        }
      }
    }

    if (data.maxGasPrice !== undefined) {
      if (data.maxGasPrice === "") {
        data.maxGasPrice = null;
      } else {
        try {
          const value = BigInt(data.maxGasPrice);
          if (value < 0) {
            return "maxGasPrice must be a non-negative number";
          }
        } catch (error) {
          return "maxGasPrice must be a valid number or string representation of a number";
        }
      }
    }

    // Check if minGasPrice > maxGasPrice
    if (data.minGasPrice && data.maxGasPrice) {
      const min = BigInt(data.minGasPrice);
      const max = BigInt(data.maxGasPrice);
      if (min > max) {
        return "minGasPrice cannot be greater than maxGasPrice";
      }
    }

    // Validate gas used values
    if (data.minGasUsed !== undefined) {
      if (data.minGasUsed === "") {
        data.minGasUsed = null;
      } else {
        try {
          const value = BigInt(data.minGasUsed);
          if (value < 0) {
            return "minGasUsed must be a non-negative number";
          }
        } catch (error) {
          return "minGasUsed must be a valid number or string representation of a number";
        }
      }
    }

    if (data.maxGasUsed !== undefined) {
      if (data.maxGasUsed === "") {
        data.maxGasUsed = null;
      } else {
        try {
          const value = BigInt(data.maxGasUsed);
          if (value < 0) {
            return "maxGasUsed must be a non-negative number";
          }
        } catch (error) {
          return "maxGasUsed must be a valid number or string representation of a number";
        }
      }
    }

    // Check if minGasUsed > maxGasUsed
    if (data.minGasUsed && data.maxGasUsed) {
      const min = BigInt(data.minGasUsed);
      const max = BigInt(data.maxGasUsed);
      if (min > max) {
        return "minGasUsed cannot be greater than maxGasUsed";
      }
    }

    // Validate blockDelay
    if (data.blockDelay !== undefined) {
      if (data.blockDelay === "") {
        data.blockDelay = 0;
      } else {
        const blockDelay = parseInt(data.blockDelay);
        if (isNaN(blockDelay) || blockDelay < 0) {
          return "blockDelay must be a non-negative integer";
        }
        data.blockDelay = blockDelay;
      }
    }

    // Validate name and description
    if (data.name !== undefined && data.name.trim() === "") {
      return "Configuration name cannot be empty";
    }

    if (data.name && data.name.length > 100) {
      return "Configuration name must be 100 characters or less";
    }

    if (data.description && data.description.length > 500) {
      return "Configuration description must be 500 characters or less";
    }

    // If no validation errors, return null
    return null;
  }
}

module.exports = ConfigurationController;
