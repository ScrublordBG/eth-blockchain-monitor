"use strict";

const { ethers } = require("ethers");
const EventEmitter = require("events");

class EthereumMonitor extends EventEmitter {
  constructor({ configurationService, transactionService }) {
    super();
    this.configurationService = configurationService;
    this.transactionService = transactionService;
    this.provider = null;
    this.activeConfigurations = [];
    this.blockDelayMap = new Map(); // Map to track block-delayed configurations
    this.isRunning = false;
    this.lastProcessedBlock = 0;
  }
  async init() {
    try {
      // Initialize Ethereum provider
      const apiKey = process.env.INFURA_API_KEY;
      const network = process.env.ETHEREUM_NETWORK || "mainnet";

      if (!apiKey || apiKey === "YOUR_INFURA_API_KEY") {
        console.warn("INFURA_API_KEY environment variable is not set or is using the default value.");
        console.warn("Running in mock mode. Ethereum monitoring will be disabled.");

        // Load initial configurations but don't start monitoring
        await this.loadConfigurations();

        return true;
      }

      this.provider = new ethers.InfuraProvider(network, apiKey);
      console.log(`Connected to Ethereum ${network} network via Infura`);

      // Load initial configurations
      await this.loadConfigurations();

      // Set up configuration hot reload
      this.configurationService.on("configurationChanged", async () => {
        console.log("Configuration change detected, reloading...");
        await this.loadConfigurations();
      });

      // Start monitoring
      await this.startMonitoring();

      return true;
    } catch (error) {
      console.error("Failed to initialize Ethereum monitor:", error);
      throw error;
    }
  }

  async loadConfigurations() {
    try {
      this.activeConfigurations = await this.configurationService.getActiveConfigurations();
      console.log(`Loaded ${this.activeConfigurations.length} active configurations`);

      // Set up block delay mappings
      this.blockDelayMap.clear();
      this.activeConfigurations.forEach((config) => {
        if (config.blockDelay > 0) {
          const delayedBlock = this.blockDelayMap.get(config.blockDelay) || [];
          delayedBlock.push(config);
          this.blockDelayMap.set(config.blockDelay, delayedBlock);
        }
      });

      return true;
    } catch (error) {
      console.error("Failed to load configurations:", error);
      return false;
    }
  }
  async startMonitoring() {
    if (this.isRunning) {
      console.log("Ethereum monitoring is already running");
      return;
    }

    // Check if provider is available
    if (!this.provider) {
      console.warn("Ethereum provider not available. Monitoring will not start.");
      return;
    }

    this.isRunning = true;
    console.log("Starting Ethereum blockchain monitoring...");

    try {
      // Get the latest block number to start from
      const latestBlock = await this.provider.getBlockNumber();
      this.lastProcessedBlock = latestBlock;
      console.log(`Starting from block #${latestBlock}`);

      // Listen for new blocks
      this.provider.on("block", async (blockNumber) => {
        try {
          await this.processBlock(blockNumber);
          this.lastProcessedBlock = blockNumber;

          // Process delayed blocks
          await this.processDelayedBlocks(blockNumber);
        } catch (error) {
          console.error(`Error processing block #${blockNumber}:`, error);
        }
      });

      console.log("Ethereum monitoring started successfully");
    } catch (error) {
      this.isRunning = false;
      console.error("Failed to start Ethereum monitoring:", error);
      throw error;
    }
  }

  async stopMonitoring() {
    if (!this.isRunning) {
      return;
    }

    try {
      // Remove all event listeners
      this.provider.removeAllListeners("block");
      this.isRunning = false;
      console.log("Ethereum monitoring stopped");
    } catch (error) {
      console.error("Error stopping Ethereum monitoring:", error);
    }
  }
  async processBlock(blockNumber) {
    console.log(`Processing block #${blockNumber}`);

    try {
      // Get block with transaction hashes
      const block = await this.provider.getBlock(blockNumber);

      if (!block) {
        console.warn(`Block #${blockNumber} not found`);
        return;
      }

      // Get real-time configurations (no delay)
      const realTimeConfigs = this.activeConfigurations.filter((config) => !config.blockDelay || config.blockDelay === 0);

      // Process transactions
      await this.processBlockTransactions(block, realTimeConfigs);

      return true;
    } catch (error) {
      console.error(`Error processing block #${blockNumber}:`, error);
      return false;
    }
  }
  async processDelayedBlocks(currentBlockNumber) {
    // Process all delayed configurations
    for (const [delay, configs] of this.blockDelayMap.entries()) {
      if (currentBlockNumber >= delay) {
        const targetBlockNumber = currentBlockNumber - delay;
        try {
          console.log(`Processing delayed block #${targetBlockNumber} with delay ${delay}`);

          // Get block with transaction hashes
          const block = await this.provider.getBlock(targetBlockNumber);

          if (!block) {
            console.warn(`Delayed block #${targetBlockNumber} not found`);
            continue;
          }

          // Process transactions with delayed configurations
          await this.processBlockTransactions(block, configs);
        } catch (error) {
          console.error(`Error processing delayed block #${targetBlockNumber}:`, error);
        }
      }
    }
  }
  async processBlockTransactions(block, configurations) {
    if (!block || !block.transactions || block.transactions.length === 0) {
      return;
    }

    // Get block timestamp
    const timestamp = new Date(block.timestamp * 1000);

    // Process each transaction hash by fetching the full transaction details
    for (const txHash of block.transactions) {
      try {
        // Add a delay to avoid rate limiting (300ms between requests)
        await this.sleep(300);

        // Get full transaction details
        const tx = await this.provider.getTransaction(txHash);

        if (!tx) {
          console.warn(`Transaction ${txHash} not found`);
          continue;
        }

        // Check transaction against all configurations
        for (const config of configurations) {
          if (this.matchesConfiguration(tx, config)) {
            console.log(`Transaction ${tx.hash} matches configuration ${config.name}`);            // Only fetch receipt if we need additional data not in the transaction
            let txReceipt = null;
            const needsReceipt =
              tx.to === null || // Contract creation
              (config.requireSuccessfulTx === true); // If we only want successful txs

            if (needsReceipt) {
              // Add another delay before getting the receipt
              await this.sleep(200);
              txReceipt = await this.provider.getTransactionReceipt(tx.hash);
              console.log("Transaction Receipt:", txReceipt);

              // Skip failed transactions if config requires successful ones
              if (config.requireSuccessfulTx === true && (!txReceipt || txReceipt.status !== 1)) {
                console.log(`Skipping failed transaction ${tx.hash}`);
                continue;
              }
            }

            // Save the transaction
            await this.transactionService.saveTransaction({
              configurationId: config.id,
              transactionHash: tx.hash,
              blockNumber: block.number,
              blockHash: block.hash,
              from: tx.from,
              to: tx.to || null, // Handle contract creation transactions
              value: tx.value ? tx.value.toString() : "0",
              gasUsed: txReceipt && txReceipt.gasUsed ? txReceipt.gasUsed.toString() : tx.gasLimit.toString(),
              gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
              input: tx.data || "0x",
              nonce: tx.nonce,
              status: txReceipt ? txReceipt.status : null,
              timestamp,
              rawData: JSON.stringify(tx),
            });
          }
        }
      } catch (error) {
        console.error(`Error processing transaction ${typeof txHash === "string" ? txHash : "unknown"}:`, error);
      }
    }
  }
  matchesConfiguration(transaction, config) {
    try {
      if (config.fromAddress && transaction.from && transaction.from.toLowerCase() !== config.fromAddress.toLowerCase()) {
        return false;
      }

      if (config.toAddress && transaction.to && transaction.to.toLowerCase() !== config.toAddress.toLowerCase()) {
        return false;
      }

      if (config.minValue) {
        const txValue = transaction.value || 0n; // Default to 0 if undefined
        const minValue = ethers.getBigInt(config.minValue);

        if (txValue < minValue) {
          console.log(`Value below minimum: ${txValue} < ${minValue}`);
          return false;
        }
      }

      if (config.maxValue) {
        const txValue = transaction.value || 0n; // Default to 0 if undefined
        const maxValue = ethers.getBigInt(config.maxValue);

        if (txValue > maxValue) {
          console.log(`Value above maximum: ${txValue} > ${maxValue}`);
          return false;
        }
      }

      console.log(`Transaction ${transaction.hash} MATCHES configuration ${config.name}`);
      return true;
    } catch (error) {
      console.error(`Error in matchesConfiguration for transaction ${transaction.hash}:`, error);
      return false;
    }
  }

  // Helper method to slow down API requests to avoid rate limiting
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = EthereumMonitor;
