"use strict";

class TransactionService {
  constructor({ Transaction }) {
    this.Transaction = Transaction;
  }

  async saveTransaction(transactionData) {
    try {
      // Check if the transaction already exists
      const existingTransaction = await this.Transaction.findOne({
        where: { transactionHash: transactionData.transactionHash },
      });

      if (existingTransaction) {
        return existingTransaction;
      }

      // Create the transaction
      const transaction = await this.Transaction.create(transactionData);

      return transaction;
    } catch (error) {
      console.error(`Error saving transaction ${transactionData.transactionHash}:`, error);
      throw error;
    }
  }

  async getTransactions(filter = {}, pagination = { page: 1, limit: 20 }) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const transactions = await this.Transaction.findAndCountAll({
        where: filter,
        limit,
        offset,
        order: [["blockNumber", "DESC"]],
      });

      return {
        transactions: transactions.rows,
        totalCount: transactions.count,
        page,
        limit,
        totalPages: Math.ceil(transactions.count / limit),
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  async getTransactionsByConfigurationId(configurationId, pagination = { page: 1, limit: 20 }) {
    try {
      return this.getTransactions({ configurationId }, pagination);
    } catch (error) {
      console.error(`Error fetching transactions for configuration ${configurationId}:`, error);
      throw error;
    }
  }

  async getTransactionByHash(transactionHash) {
    try {
      const transaction = await this.Transaction.findOne({
        where: { transactionHash },
      });

      if (!transaction) {
        throw new Error(`Transaction with hash ${transactionHash} not found`);
      }

      return transaction;
    } catch (error) {
      console.error(`Error fetching transaction with hash ${transactionHash}:`, error);
      throw error;
    }
  }
}

module.exports = TransactionService;
