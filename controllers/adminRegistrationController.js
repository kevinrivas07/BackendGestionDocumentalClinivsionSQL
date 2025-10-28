const bcrypt = require("bcryptjs");
const { User, InfoUser } = require("../models"); // Importamos desde models/index.js

const adminRegistration = async (req, res) => {
  try {
    const { username, email, password, phone, nombre, ciudad, cedula, fecha } = req.body;

    // Validar campos
    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Faltan datos obligatorios" });
    }

    // Verificar si el correo ya existe
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ msg: "Correo ya registrado" });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ msg: "Nombre de usuario ya registrado" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario admin
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });

    // Crear información adicional
    await InfoUser.create({
      nombre,
      ciudad,
      cedula,
      fecha,
      email,
      phone,
      userId: user.id, // Clave foránea
    });

    res.status(201).json({
      msg: "Administrador registrado exitosamente",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error al registrar el administrador:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

module.exports = { adminRegistration };
