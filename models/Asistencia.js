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
      tema: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      responsable: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cargo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      modalidad: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sede: {
        type: DataTypes.STRING,
        allowNull: true,
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
      asistentes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      pdfPath: {
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

  // Relación con el usuario creador
  Asistencia.associate = (models) => {
    Asistencia.belongsTo(models.User, {
      foreignKey: "creadoPor",
      as: "usuarioCreador",
    });
  };

  return Asistencia;
};
