const express = require("express");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const { Dotacion, User } = require("../models");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Crear dotación y generar PDF
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = req.body || {};

    // 📄 Plantilla PDF base
    const templatePath = path.join(__dirname, "../templates/F-GH-018 ENTREGA DE DOTACION v3.pdf");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Plantilla PDF no encontrada" });
    }

    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 🗓️ Fecha y datos del colaborador
    if (data.fecha) {
      const [año, mes, dia] = data.fecha.split("-");
      page.drawText(dia, { x: 170, y: 725, size: 12, font });
      page.drawText(mes, { x: 225, y: 725, size: 12, font });
      page.drawText(año, { x: 290, y: 725, size: 12, font });
    }

    page.drawText(`${data.nombre || ""}`, { x: 170, y: 710, size: 12, font });
    page.drawText(`${data.cedula || ""}`, { x: 450, y: 710, size: 12, font });
    page.drawText(`${data.cargo || ""}`, { x: 170, y: 695, size: 12, font });

    // 🧍‍♀️ Elementos entregados
    if (Array.isArray(data.elementos)) {
      const baseY = 624;
      const step = 11;

      for (let i = 0; i < data.elementos.length; i++) {
        const e = data.elementos[i];
        const y = baseY - i * step;
        page.drawText(e.nombre || "", { x: 200, y, size: 9, font });
        page.drawText(e.cantidad ? String(e.cantidad) : "", { x: 320, y, size: 9, font });
      }
    }

    // ✍️ Firma
    if (data.firma && data.firma.startsWith("data:image")) {
      const match = data.firma.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const base64 = match[2];
        const imgBytes = Buffer.from(base64, "base64");
        const embeddedImage =
          mime === "image/png"
            ? await pdfDoc.embedPng(imgBytes)
            : await pdfDoc.embedJpg(imgBytes);
        page.drawImage(embeddedImage, { x: 400, y: 535, width: 150, height: 60 });
      }
    }

    // 🗂️ Guardar PDF
    const finalPdf = await pdfDoc.save();
    const pdfBuffer = Buffer.from(finalPdf);
    const pdfDir = path.join(__dirname, "../uploads/pdfs");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const pdfFileName = `dotacion_${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // 💾 Guardar en la base de datos
    await Dotacion.create({
      fecha: data.fecha,
      nombre: data.nombre,
      cedula: data.cedula,
      cargo: data.cargo,
      elementos: JSON.stringify(data.elementos || []),
      firma: data.firma,
      pdfPath: `/uploads/pdfs/${pdfFileName}`,
      userId: req.user.id,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Entrega_Dotacion.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Error generando PDF de dotación:", err);
    res.status(500).json({ error: "Error generando PDF de dotación" });
  }
});

// 📂 Obtener dotaciones (según rol)
router.get("/", authMiddleware, async (req, res) => {
  try {
    let dotaciones;

    if (req.user.role === "admin") {
      dotaciones = await Dotacion.findAll({
        include: [{ model: User, as: "usuario", attributes: ["username", "email", "role"] }],
      });
    } else {
      dotaciones = await Dotacion.findAll({
        where: { userId: req.user.id },
        include: [{ model: User, as: "usuario", attributes: ["username", "email", "role"] }],
      });
    }

    res.json(dotaciones);
  } catch (err) {
    console.error("❌ Error al obtener dotaciones:", err);
    res.status(500).json({ error: "Error al obtener dotaciones" });
  }
});

// 📄 Descargar PDF
router.get("/:id/pdf", async (req, res) => {
  try {
    const dotacion = await Dotacion.findByPk(req.params.id);
    if (!dotacion || !dotacion.pdfPath) {
      return res.status(404).json({ error: "PDF no encontrado" });
    }

    const filePath = path.join(__dirname, "..", dotacion.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo PDF no existe" });
    }

    res.download(filePath);
  } catch (err) {
    console.error("❌ Error al descargar PDF:", err);
    res.status(500).json({ error: "Error al descargar PDF" });
  }
});

module.exports = router;
