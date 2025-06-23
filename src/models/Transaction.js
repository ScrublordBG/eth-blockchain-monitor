"use strict";

const { Model, DataTypes } = require("sequelize");

class Transaction extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        configurationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "configurations",
            key: "id",
          },
        },
        transactionHash: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        blockNumber: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        blockHash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        from: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        to: {
          type: DataTypes.STRING,
          allowNull: true, 
        },
        value: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        gasUsed: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        gasPrice: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        input: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        nonce: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        contractAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        rawData: {
          type: DataTypes.TEXT,
          allowNull: true,
          get() {
            const rawValue = this.getDataValue("rawData");
            return rawValue ? JSON.parse(rawValue) : null;
          },
          set(value) {
            this.setDataValue("rawData", JSON.stringify(value));
          },
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "Transaction",
        tableName: "transactions",
        indexes: [
          {
            fields: ["transactionHash"],
          },
          {
            fields: ["configurationId"],
          },
          {
            fields: ["blockNumber"],
          },
        ],
      }
    );
  }
}

module.exports = Transaction;
