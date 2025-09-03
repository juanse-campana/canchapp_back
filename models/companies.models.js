const { DataTypes } = require("sequelize");
const sequelize = require("../database/connect");

const Companies = sequelize.define(
  "Companies",
  {
    company_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company_city_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    company_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company_email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    company_register_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    company_location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    company_services: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_state: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    company_logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
    tableName: "companies",
  }
);

module.exports = Companies;
