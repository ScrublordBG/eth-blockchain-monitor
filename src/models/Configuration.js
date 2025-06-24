"use strict";

const { Model, DataTypes } = require("sequelize");

class Configuration extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        fromAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        toAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        minValue: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        maxValue: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        blockDelay: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        requireSuccessfulTx: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
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
        modelName: "Configuration",
        tableName: "configurations",
      }
    );
  }
}

module.exports = Configuration;
