// models/index.js
const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false,
    timezone: "-05:00",
  }
);

// ✅ Importar modelos correctamente
const User = require("./User")(sequelize);
const InfoUser = require("./InfoUser")(sequelize);
const Asistencia = require("./Asistencia")(sequelize);
const Dotacion = require("./Dotacion")(sequelize);

// ✅ Relaciones
User.hasOne(InfoUser, { foreignKey: "userId", as: "info" });
InfoUser.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Asistencia, { foreignKey: "creadoPor", as: "asistencias" });
Asistencia.belongsTo(User, { foreignKey: "creadoPor", as: "usuarioCreador" });

User.hasMany(Dotacion, { foreignKey: "userId", as: "dotaciones" });
Dotacion.belongsTo(User, { foreignKey: "userId", as: "usuario" });

module.exports = { sequelize, Sequelize, User, InfoUser, Asistencia, Dotacion };
