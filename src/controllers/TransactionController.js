"use strict";

class TransactionController {
  constructor({ transactionService }) {
    this.transactionService = transactionService;
  }

  async getTransactions(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const filter = {};
      if (req.query.configurationId) {
        filter.configurationId = req.query.configurationId;
      }

      if (req.query.fromBlock && req.query.toBlock) {
        filter.blockNumber = {
          $gte: parseInt(req.query.fromBlock, 10),
          $lte: parseInt(req.query.toBlock, 10),
        };
      }

      const result = await this.transactionService.getTransactions(filter, { page, limit });

      return res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: {
          totalCount: result.totalCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch transactions",
        error: error.message,
      });
    }
  }

  async getTransactionsByConfigurationId(req, res) {
    try {
      const { configurationId } = req.params;

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await this.transactionService.getTransactionsByConfigurationId(configurationId, { page, limit });

      return res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: {
          totalCount: result.totalCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error(`Error fetching transactions for configuration ${req.params.configurationId}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch transactions",
        error: error.message,
      });
    }
  }

  async getTransactionByHash(req, res) {
    try {
      const { hash } = req.params;

      const transaction = await this.transactionService.getTransactionByHash(hash);

      return res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error(`Error fetching transaction with hash ${req.params.hash}:`, error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch transaction",
        error: error.message,
      });
    }
  }
}

module.exports = TransactionController;
