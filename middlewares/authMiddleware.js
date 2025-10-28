const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config(); // Asegura que JWT_SECRET se cargue

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("🛡️ Token recibido:", token);

  if (!token) {
    return res.status(401).json({ msg: "No token, autorización denegada" });
  }

  try {
    // 👇 Verificamos con el mismo secreto del .env
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verificado correctamente:", verified);

    // ⚙️ Guardamos la info del usuario para las rutas protegidas
    req.user = {
      id: verified.id,
      username: verified.username,
      role: verified.role,
    };

    next();
  } catch (error) {
    console.error("❌ Token inválido:", error.message);
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

module.exports = authMiddleware;
