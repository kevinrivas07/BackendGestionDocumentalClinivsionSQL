// models/InfoUser.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const InfoUser = sequelize.define(
    "InfoUser",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: DataTypes.STRING,
      ciudad: DataTypes.STRING,
      cedula: DataTypes.STRING,
      fecha: DataTypes.DATEONLY,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "info_users",
      timestamps: true,
    }
  );

  return InfoUser;
};
