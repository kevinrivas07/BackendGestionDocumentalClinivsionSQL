// models/Dotacion.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Dotacion = sequelize.define(
    "Dotacion",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tipo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      talla: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fechaEntrega: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      estado: {
        type: DataTypes.STRING,
        defaultValue: "Entregado",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "dotaciones",
      timestamps: true,
    }
  );

  return Dotacion;
};
