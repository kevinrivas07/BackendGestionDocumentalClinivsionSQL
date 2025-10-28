const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { User, Asistencia, sequelize } = require("../models");

// ✅ Importar directamente Sequelize y Op
const { Op } = require("sequelize");


// ✅ Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "role", "createdAt"],
    });
    res.json(users);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// ✅ Crear nuevo usuario
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Faltan datos obligatorios" });
    }

    // Verificar duplicados usando Sequelize.Op
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existing) {
      return res.status(400).json({ msg: "Usuario o correo ya registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    res.status(201).json({ msg: "Usuario creado con éxito", user: newUser });
  } catch (err) {
    console.error("❌ Error al crear usuario:", err);
    res.status(500).json({ msg: "Error al crear usuario" });
  }
};

// ✅ Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [updatedRows] = await User.update(req.body, { where: { id } });

    if (updatedRows === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const updatedUser = await User.findByPk(id);
    res.json({ msg: "Usuario actualizado correctamente", user: updatedUser });
  } catch (err) {
    console.error("❌ Error al actualizar usuario:", err);
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};

// ✅ Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({ msg: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar usuario:", err);
    res.status(500).json({ msg: "Error al eliminar usuario" });
  }
};

// ✅ Obtener todas las asistencias (solo admin)
const getAllAsistencias = async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      include: [
        { model: User, as: "usuarioCreador", attributes: ["username", "email"] },
      ],
    });

    res.json(asistencias);
  } catch (error) {
    console.error("❌ Error al obtener asistencias:", error);
    res.status(500).json({ msg: "Error al obtener asistencias" });
  }
};

// ✅ Listar todos los PDFs de asistencias
const getAllPdfs = async (req, res) => {
  try {
    const pdfDir = path.join(__dirname, "../uploads/pdfs");

    if (!fs.existsSync(pdfDir)) {
      return res.status(404).json({ msg: "No existe la carpeta de PDFs" });
    }

    const files = fs.readdirSync(pdfDir).filter((file) => file.endsWith(".pdf"));

    const pdfs = files.map((file) => ({
      name: file,
      url: `${process.env.BASE_URL || "http://localhost:5000"}/uploads/pdfs/${file}`,
    }));

    res.json(pdfs);
  } catch (error) {
    console.error("❌ Error al listar PDFs:", error);
    res.status(500).json({ msg: "Error al listar los PDFs" });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllAsistencias,
  getAllPdfs,
};
