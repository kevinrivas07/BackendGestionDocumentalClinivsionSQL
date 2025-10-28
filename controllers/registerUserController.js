const bcrypt = require("bcryptjs");
const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 🧩 Validar campos
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // 🔍 Verificar si el usuario o email ya existen
    const existingUser = await User.findOne({ where: { username } });
    const existingEmail = await User.findOne({ where: { email } });

    if (existingUser || existingEmail) {
      return res.status(400).json({ error: "El usuario o el correo ya existen" });
    }

    // 🔒 Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧑‍💻 Crear el nuevo usuario
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { registerUser };
