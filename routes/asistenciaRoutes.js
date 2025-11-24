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
    page.drawText(`${data.fecha || ""}`, { x: 175, y: 652, size: 12, font });
    page.drawText(`${data.tema || ""}`, { x: 175, y: 634, size: 12, font });
    page.drawText(`${data.responsable || ""}`, { x: 175, y: 616, size: 12, font });
    page.drawText(`${data.cargo || ""}`, { x: 175, y: 598, size: 12, font });
    page.drawText(`${data.modalidad || ""}`, { x: 175, y: 580, size: 12, font });
    page.drawText(`${data.sede || ""}`, { x: 445, y: 580, size: 12, font });
    page.drawText(`${data.horaInicio || ""}`, { x: 175, y: 562, size: 12, font });
    page.drawText(`${data.horaFin || ""}`, { x: 445, y: 562, size: 12, font });

    // -------------------- ASISTENTES --------------------
    const maxAsistentes = 25;

    const nombreX = 135;
    const cargoX = 320;
    const firmaX = 475;

    const baseY = 508;
    const step = 17.6;

    const totalAsistentes = Array.isArray(data.asistentes)
      ? data.asistentes.length
      : 0;

    for (let i = 0; i < totalAsistentes && i < maxAsistentes; i++) {
      const a = data.asistentes[i] || {};
      const y = baseY - i * step;

       // Nombre
      page.drawText(a.nombre || "", {
        x: nombreX - 20,   // movido a la izquierda
        y: y - 2,
        size: 10,
        font,
      });

      // Cargo
      page.drawText(a.cargo || "", {
        x: cargoX - 15,    // movido a la izquierda
        y: y - 2,
        size: 10,
        font,
      });
      
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
          const sigHeight =
            (embeddedImage.height / embeddedImage.width) * sigWidth || 30;

          page.drawImage(embeddedImage, {
            x: firmaX,
            y: y - sigHeight / 2 + 5,
            width: sigWidth,
            height: sigHeight,
          });
        }
      }
    }

    // -------------------- LÍNEAS VACÍAS --------------------
    if (totalAsistentes < maxAsistentes) {
      const fromY = baseY - totalAsistentes * step + 4;
      const toY = baseY - (maxAsistentes - 1) * step - 8;

      const drawLine = (x) => {
        page.drawLine({
          start: { x, y: fromY },
          end: { x, y: toY },
          thickness: 1,
        });
      };

      drawLine(nombreX + 62);
      drawLine(cargoX + 50);
      drawLine(firmaX + 35);
    }

    // 📂 Guardar PDF
    const finalPdf = await pdfDoc.save();
    const pdfBuffer = Buffer.from(finalPdf);
    const pdfDir = path.join(__dirname, "../uploads/pdfs");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const pdfFileName = `asistencia_${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    await Asistencia.create({
      fecha: data.fecha || new Date().toISOString().split("T")[0],
      tema: data.tema,
      responsable: data.responsable,
      cargo: data.cargo,
      modalidad: data.modalidad,
      sede: data.sede,
      horaEntrada:
        data.horaInicio ||
        new Date().toLocaleTimeString("es-CO", { hour12: false }),
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

// -------------------------------------------------------------
// 📌 Obtener lista de asistencias
// -------------------------------------------------------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      include: [
        {
          model: User,
          as: "usuarioCreador",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["id", "DESC"]],
    });

    res.json(asistencias);
  } catch (err) {
    console.error("❌ Error cargando asistencias:", err);
    res.status(500).json({ error: "Error cargando asistencias" });
  }
});

// -------------------------------------------------------------
// 📄 Descargar PDF
// -------------------------------------------------------------
router.get("/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const asistencia = await Asistencia.findByPk(req.params.id);
    if (!asistencia)
      return res.status(404).json({ error: "Asistencia no encontrada" });

    const pdfPath = path.join(__dirname, "..", asistencia.pdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Archivo PDF no encontrado" });
    }

    res.download(pdfPath, `Asistencia_${asistencia.id}.pdf`);
  } catch (err) {
    console.error("❌ Error descargando PDF:", err);
    res.status(500).json({ error: "Error descargando PDF" });
  }
});

module.exports = router;
