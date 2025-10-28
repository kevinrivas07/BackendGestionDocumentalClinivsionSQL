// routes/infoUserRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getInfoUser, updateInfoUser } = require("../controllers/infoUserController");

// 📄 Obtener la información del usuario autenticado
router.get("/", authMiddleware, getInfoUser);

// ✏️ Actualizar o crear información del usuario autenticado
router.put("/", authMiddleware, updateInfoUser);

module.exports = router;
