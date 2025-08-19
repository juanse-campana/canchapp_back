const { DataTypes } = require("sequelize");
const sequelize = require("../database/connect");

const CashClosings = sequelize.define(
  "Cash_closings",
  {
    cash_closing_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cash_closing_calendar_list: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cash_closing_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    cash_closing_total: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    cash_closing_state: {
      type: DataTypes.ENUM('Sin Procesar', 'Pendiente', 'Cerrado', 'Pagado'),
      defaultValue: 'Sin Procesar',
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "Cash_closings",
  }
);

module.exports = CashClosings;