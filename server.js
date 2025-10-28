// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { sequelize } = require("./models"); // 👈 Importa la conexión MySQL desde models/index.js

dotenv.config();
const app = express();

// 🚀 Rutas
const registerUserRoutes = require("./routes/registerUserRoutes");
const loginRoutes = require("./routes/loginRoutes");
const adminRegistrationRoutes = require("./routes/adminRegistrationRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const asistenciaRoutes = require("./routes/asistenciaRoutes");
const adminRoutes = require("./routes/adminRoutes");
const infoUserRoutes = require("./routes/infoUserRoutes");
const dotacionRoutes = require("./routes/dotacionRoutes");

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Soporte para firmas en Base64 o PDFs grandes

// ✅ Conexión a MySQL con Sequelize
sequelize
  .sync({ alter: true })
  .then(() => console.log("📦 Tablas sincronizadas con MySQL (XAMPP)"))
  .catch((err) => console.error("❌ Error al sincronizar Sequelize:", err));

// ✅ Ruta raíz
app.get("/", (req, res) => {
  res.send(`
    <h1>Bienvenido al Backend Clinivision</h1>
    <p>✅ API funcionando con MySQL + Sequelize + XAMPP.</p>
  `);
});

// ✅ Rutas principales
app.use("/api/register", registerUserRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/register-admin", adminRegistrationRoutes);
app.use("/api/info-user", infoUserRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dotaciones", dotacionRoutes);

// ✅ Carpeta estática para PDFs
app.use("/uploads/pdfs", express.static(path.join(__dirname, "uploads/pdfs")));

// ✅ 404
app.use((req, res) => {
  res.status(404).send("<h2>❌ Ruta no encontrada en la API</h2>");
});

// ✅ Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("<h2>⚠️ Error interno del servidor</h2>");
});

// ✅ Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
