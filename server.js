// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { sequelize } = require("./models");

dotenv.config();
const app = express();

// ✅ Configuración CORS correcta
app.use(cors({
  origin: "*", // Puedes reemplazar "*" por "http://localhost:5173"
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware
app.use(express.json({ limit: "10mb" }));

// Conexión a MySQL
sequelize
  .sync({ alter: true })
  .then(() => console.log("📦 Tablas sincronizadas con MySQL"))
  .catch((err) => console.error("❌ Error al sincronizar Sequelize:", err));

// Ruta raíz
app.get("/", (req, res) => {
  res.send(`
    <h1>Bienvenido al Backend Clinivision</h1>
    <p>API funcionando con MySQL + Sequelize.</p>
  `);
});

// Rutas API
app.use("/api/register", require("./routes/registerUserRoutes"));
app.use("/api/login", require("./routes/loginRoutes"));
app.use("/api/register-admin", require("./routes/adminRegistrationRoutes"));
app.use("/api/info-user", require("./routes/infoUserRoutes"));
app.use("/api/asistencia", require("./routes/asistenciaRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/dotaciones", require("./routes/dotacionRoutes"));

// Archivos estáticos PDF
app.use("/uploads/pdfs", express.static(path.join(__dirname, "uploads/pdfs")));

// 404
app.use((req, res) => {
  res.status(404).send("<h2>❌ Ruta no encontrada en la API</h2>");
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("<h2>⚠️ Error interno del servidor</h2>");
});

// Servidor
const PORT = process.env.PORT || 5000;
const HOST = "localhost";

app.listen(PORT, HOST, () =>
  console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`)
);
