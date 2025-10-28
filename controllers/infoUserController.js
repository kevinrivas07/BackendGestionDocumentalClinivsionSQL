const InfoUser = require("../models/InfoUser");

// ✅ Obtener info del usuario autenticado
const getInfoUser = async (req, res) => {
  try {
    // Sequelize → usa "where"
    const info = await InfoUser.findOne({ where: { userId: req.user.id } });

    if (!info) {
      return res.status(404).json({ msg: "Información no encontrada" });
    }

    res.json(info);
  } catch (error) {
    console.error("❌ Error al obtener información:", error);
    res.status(500).json({ msg: "Error en el servidor", error: error.message });
  }
};

// ✅ Actualizar info del usuario con validación de campos vacíos
const updateInfoUser = async (req, res) => {
  try {
    const updates = req.body;

    // 🚨 Validar campos vacíos o con solo espacios
    for (const key of Object.keys(updates)) {
      if (updates[key] === undefined || updates[key] === null) {
        return res.status(400).json({ msg: `El campo "${key}" es requerido.` });
      }

      if (typeof updates[key] === "string") {
        updates[key] = updates[key].trim();
        if (updates[key] === "") {
          return res.status(400).json({ msg: `El campo "${key}" no puede estar vacío.` });
        }
      }
    }

    // 🔹 Buscar el registro existente
    const info = await InfoUser.findOne({ where: { userId: req.user.id } });
    if (!info) {
      return res.status(404).json({ msg: "Información no encontrada" });
    }

    // 🔹 Actualizar con Sequelize
    await info.update(updates);

    res.json({ msg: "Información actualizada correctamente", info });
  } catch (error) {
    console.error("❌ Error al actualizar información:", error);
    res.status(500).json({ msg: "Error en el servidor", error: error.message });
  }
};

module.exports = { getInfoUser, updateInfoUser };
