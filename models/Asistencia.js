// models/Asistencia.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Asistencia = sequelize.define(
    "Asistencia",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      horaEntrada: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      horaSalida: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      observacion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Presente",
      },
      creadoPor: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "asistencias",
      timestamps: true,
    }
  );

  return Asistencia;
};
