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

      if (!configurationData.name) {
        return res.status(400).json({
          success: false,
          message: "Configuration name is required",
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
}

module.exports = ConfigurationController;
