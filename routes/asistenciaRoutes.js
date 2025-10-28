const express = require("express");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middlewares/authMiddleware");
const { Asistencia, User } = require("../models");

const router = express.Router();

// 📌 Crear asistencia y generar PDF
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = req.body || {};

    const templatePath = path.join(__dirname, "../templates/F-GH-010.pdf");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Plantilla PDF no encontrada" });
    }

    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // -------------------- CABECERA --------------------
    page.drawText(`${data.fecha || ""}`, { x: 170, y: 651, size: 12, font });
    page.drawText(`${data.tema || ""}`, { x: 170, y: 633, size: 12, font });
    page.drawText(`${data.responsable || ""}`, { x: 170, y: 615, size: 12, font });
    page.drawText(`${data.cargo || ""}`, { x: 170, y: 597, size: 12, font });
    page.drawText(`${data.modalidad || ""}`, { x: 170, y: 579, size: 12, font });
    page.drawText(`${data.sede || ""}`, { x: 440, y: 579, size: 12, font });
    page.drawText(`${data.horaInicio || ""}`, { x: 170, y: 561, size: 12, font });
    page.drawText(`${data.horaFin || ""}`, { x: 440, y: 561, size: 12, font });

    // -------------------- ASISTENTES --------------------
    if (Array.isArray(data.asistentes)) {
      const baseY = 505;
      const step = 18;

      for (let i = 0; i < data.asistentes.length; i++) {
        const a = data.asistentes[i] || {};
        const y = baseY - i * step;

        page.drawText(a.nombre || "", { x: 120, y, size: 10, font });
        page.drawText(a.cargo || "", { x: 300, y, size: 10, font });

        // Firma
        if (a.firma && a.firma.startsWith("data:image")) {
          const match = a.firma.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            const mime = match[1];
            const base64 = match[2];
            const imgBytes = Buffer.from(base64, "base64");
            const embeddedImage =
              mime === "image/png"
                ? await pdfDoc.embedPng(imgBytes)
                : await pdfDoc.embedJpg(imgBytes);

            const sigWidth = 90;
            const sigHeight = (embeddedImage.height / embeddedImage.width) * sigWidth || 30;

            page.drawImage(embeddedImage, {
              x: 450,
              y: y - sigHeight / 2 + 5,
              width: sigWidth,
              height: sigHeight,
            });
          }
        }
      }
    }

  // 📂 Guardar PDF
const finalPdf = await pdfDoc.save();
const pdfBuffer = Buffer.from(finalPdf);
const pdfDir = path.join(__dirname, "../uploads/pdfs");
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

const pdfFileName = `asistencia_${Date.now()}.pdf`;
const pdfPath = path.join(pdfDir, pdfFileName);
fs.writeFileSync(pdfPath, pdfBuffer);

// 💾 Guardar en la base de datos
await Asistencia.create({
  fecha: data.fecha || new Date(),
  tema: data.tema,
  responsable: data.responsable,
  cargo: data.cargo,
  modalidad: data.modalidad,
  sede: data.sede,
  horaEntrada: data.horaInicio || new Date().toLocaleTimeString("es-CO", { hour12: false }),
  horaSalida: data.horaFin || null,
  asistentes: JSON.stringify(data.asistentes || []),
  pdfPath: `/uploads/pdfs/${pdfFileName}`,
  creadoPor: req.user.id,
});

res.setHeader("Content-Type", "application/pdf");
res.setHeader("Content-Disposition", `attachment; filename=${pdfFileName}`);
res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

// 📂 Obtener asistencias (según rol)
router.get("/", authMiddleware, async (req, res) => {
  try {
    let asistencias;

    if (req.user.role === "admin") {
      asistencias = await Asistencia.findAll({
        include: [
          {
            model: User,
            as: "usuarioCreador", // 👈 alias correcto según models/index.js
            attributes: ["username", "email", "role"],
          },
        ],
        order: [["fecha", "DESC"]],
      });
    } else {
      asistencias = await Asistencia.findAll({
        where: { creadoPor: req.user.id },
        include: [
          {
            model: User,
            as: "usuarioCreador",
            attributes: ["username", "email", "role"],
          },
        ],
        order: [["fecha", "DESC"]],
      });
    }

    res.json(asistencias);
  } catch (err) {
    console.error("❌ Error obteniendo asistencias:", err);
    res.status(500).json({ error: "Error al obtener asistencias" });
  }
});

// 📄 Descargar PDF
router.get("/:id/pdf", async (req, res) => {
  try {
    const asistencia = await Asistencia.findByPk(req.params.id);
    if (!asistencia || !asistencia.pdfPath) {
      return res.status(404).json({ error: "PDF no encontrado" });
    }

    const filePath = path.join(__dirname, "..", asistencia.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo PDF no existe" });
    }

    res.download(filePath);
  } catch (err) {
    console.error("❌ Error descargando PDF:", err);
    res.status(500).json({ error: "Error al descargar PDF" });
  }
});

module.exports = router;
