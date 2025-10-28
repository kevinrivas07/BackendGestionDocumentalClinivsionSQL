const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, InfoUser } = require("../models");
const sendResetPasswordEmail = require("../utils/sendResetPasswordEmail");
const sendRecoverUsernameEmail = require("../utils/sendRecoverUsernameEmail");

// 📌 Recuperar contraseña (forgot password)
exports.forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;

    // 1️⃣ Buscar usuario
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    // 2️⃣ Buscar correo en InfoUser
    const infoUser = await InfoUser.findOne({ where: { userId: user.id } });
    if (!infoUser || !infoUser.email) {
      return res
        .status(400)
        .json({ msg: "No hay correo registrado para este usuario" });
    }

    // 3️⃣ Generar token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hora

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    // 4️⃣ Construir link (ajusta la URL a tu frontend)
    const resetUrl = `https://citamedfront.vercel.app/reset-password/${resetToken}`;

    // 5️⃣ Enviar correo
    await sendResetPasswordEmail(infoUser.email, resetUrl);

    res.json({ msg: "📩 Correo de recuperación enviado correctamente" });
  } catch (err) {
    console.error("❌ Error en forgotPassword:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// 📌 Resetear contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // 1️⃣ Validar token y expiración
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }, // Sequelize equivalente a $gt
      },
    });

    if (!user) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    // 2️⃣ Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3️⃣ Actualizar usuario
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    res.json({ msg: "✅ Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error en resetPassword:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// 📌 Recuperar nombre de usuario por correo
exports.recoverUsername = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Buscar correo en InfoUser (join con User)
    const infoUser = await InfoUser.findOne({
      where: { email },
      include: [{ model: User, as: "user" }],
    });

    if (!infoUser || !infoUser.user) {
      return res.status(400).json({ msg: "No se encontró usuario con este correo" });
    }

    // 2️⃣ Obtener username y enviar correo
    const username = infoUser.user.username;
    await sendRecoverUsernameEmail(email, username);

    res.json({ msg: "📩 Tu nombre de usuario fue enviado a tu correo electrónico" });
  } catch (err) {
    console.error("❌ Error en recoverUsername:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};
