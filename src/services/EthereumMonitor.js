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

      // Process initial block asynchronously to avoid blocking server startup
      setTimeout(async () => {
        try {
          await this.processBlock(latestBlock);
        } catch (error) {
          console.error(`Error processing initial block #${latestBlock}:`, error);
        }
      }, 100);

      this.provider.on("block", async (blockNumber) => {
        try {
          await this.processBlock(blockNumber);
          this.lastProcessedBlock = blockNumber;

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
      const block = await this.provider.getBlock(blockNumber, true);

      if (!block) {
        console.warn(`Block #${blockNumber} not found`);
        return;
      }

      const realTimeConfigs = this.activeConfigurations.filter((config) => !config.blockDelay || config.blockDelay === 0);

      await this.processBlockTransactions(block, realTimeConfigs);

      return true;
    } catch (error) {
      console.error(`Error processing block #${blockNumber}:`, error);
      return false;
    }
  }
  async processDelayedBlocks(currentBlockNumber) {
    for (const [delay, configs] of this.blockDelayMap.entries()) {
      if (currentBlockNumber >= delay) {
        const targetBlockNumber = currentBlockNumber - delay;
        try {
          console.log(`Processing delayed block #${targetBlockNumber} with delay ${delay}`);

          const block = await this.provider.getBlock(targetBlockNumber, true);

          if (!block) {
            console.warn(`Delayed block #${targetBlockNumber} not found`);
            continue;
          }

          await this.processBlockTransactions(block, configs);
        } catch (error) {
          console.error(`Error processing delayed block #${targetBlockNumber}:`, error);
        }
      }
    }
  }
  async processBlockTransactions(block, configurations) {
    const transactions = block.prefetchedTransactions;
    if (!block || !transactions || transactions.length === 0) {
      return;
    }

    // Get block timestamp
    const timestamp = new Date(block.timestamp * 1000);


    console.log(`Processing ${transactions.length} transactions from block #${block.number}`);

    for (const tx of transactions) {
      try {
        if (!tx) {
          console.warn(`Transaction in block ${block.number} not found`);
          continue;
        }

        for (const config of configurations) {
          if (this.matchesConfiguration(tx, config)) {
            await this.transactionService.saveTransaction({
              configurationId: config.id,
              transactionHash: tx.hash,
              blockNumber: block.number,
              blockHash: block.hash,
              from: tx.from,
              to: tx.to || null,
              value: tx.value ? tx.value.toString() : "0",
              gasUsed: tx.gasLimit ? tx.gasLimit.toString() : "0",
              gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "0",
              input: tx.data || "0x",
              nonce: tx.nonce,
              status: null,
              timestamp,
              rawData: JSON.stringify(tx),
            });
          }
        }
      } catch (error) {
        console.error(`Error processing transaction ${tx.hash || "unknown"}:`, error);
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
        const txValue = transaction.value || 0n;
        const minValue = ethers.getBigInt(config.minValue);

        if (txValue < minValue) {
          return false;
        }
      }
      if (config.maxValue) {
        const txValue = transaction.value || 0n;
        const maxValue = ethers.getBigInt(config.maxValue);

        if (txValue > maxValue) {
          return false;
        }
      }

      // Gas price filtering
      if (config.minGasPrice && transaction.gasPrice) {
        const txGasPrice = transaction.gasPrice;
        const minGasPrice = ethers.getBigInt(config.minGasPrice);

        if (txGasPrice < minGasPrice) {
          console.log(`Gas price below minimum: ${txGasPrice} < ${minGasPrice}`);
          return false;
        }
      }

      if (config.maxGasPrice && transaction.gasPrice) {
        const txGasPrice = transaction.gasPrice;
        const maxGasPrice = ethers.getBigInt(config.maxGasPrice);

        if (txGasPrice > maxGasPrice) {
          console.log(`Gas price above maximum: ${txGasPrice} > ${maxGasPrice}`);
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
}

module.exports = EthereumMonitor;
