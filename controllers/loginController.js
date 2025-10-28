// controllers/loginController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { User } = require("../models");

dotenv.config();

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🧩 Verificar campos obligatorios
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son obligatorios" });
    }

    // 🔍 Buscar usuario
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // 🔑 Verificar contraseña (si las contraseñas están cifradas)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 🎟️ Generar token con el mismo secreto que en .env
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET, // 👈 Debe coincidir exactamente
      { expiresIn: "8h" }
    );

    console.log("✅ Token generado correctamente:", token);

    // 🔄 Enviar respuesta
    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = login;
