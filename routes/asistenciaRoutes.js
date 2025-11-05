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
    page.drawText(`${data.fecha || ""}`, { x: 175, y: 654, size: 12, font });
    page.drawText(`${data.tema || ""}`, { x: 175, y: 636, size: 12, font });
    page.drawText(`${data.responsable || ""}`, { x: 175, y: 618, size: 12, font });
    page.drawText(`${data.cargo || ""}`, { x: 175, y: 600, size: 12, font });
    page.drawText(`${data.modalidad || ""}`, { x: 175, y: 582, size: 12, font });
    page.drawText(`${data.sede || ""}`, { x: 445, y: 582, size: 12, font });
    page.drawText(`${data.horaInicio || ""}`, { x: 175, y: 564, size: 12, font });
    page.drawText(`${data.horaFin || ""}`, { x: 445, y: 564, size: 12, font });

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

      page.drawText(a.nombre || "", { x: nombreX, y: y - 2, size: 10, font });
      page.drawText(a.cargo || "", { x: cargoX, y: y - 2, size: 10, font });

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

    // -------------------- LÍNEAS EN ESPACIOS VACÍOS --------------------
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

      drawLine(nombreX + 82); // Línea nombres
      drawLine(cargoX + 70);  // Línea cargos
      drawLine(firmaX + 45);  // Línea firmas (movida 10px a la izquierda)
    }

    // 📂 Guardar PDF
    const finalPdf = await pdfDoc.save();
    const pdfBuffer = Buffer.from(finalPdf);
    const pdfDir = path.join(__dirname, "../uploads/pdfs");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const pdfFileName = `asistencia_${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // 💾 Guardar en BD
    await Asistencia.create({
      fecha: data.fecha || new Date(),
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

// 📋 Obtener asistencias del usuario autenticado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      where: { creadoPor: req.user.id },
      include: [
        {
          model: User,
          as: "usuarioCreador", // 👈 este alias debe coincidir con el del modelo
          attributes: ["username"],
        },
      ],
      order: [["fecha", "DESC"]],
    });

    res.json(asistencias);
  } catch (err) {
    console.error("❌ Error al obtener asistencias:", err);
    res.status(500).json({ error: "Error al obtener asistencias" });
  }
});

// 📄 Descargar PDF existente por ID
router.get("/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const asistencia = await Asistencia.findByPk(id);

    if (!asistencia || !asistencia.pdfPath) {
      return res.status(404).json({ error: "PDF no encontrado para esta asistencia" });
    }

    // 🗂️ Obtener la ruta física del PDF en el servidor
    const pdfFilePath = path.join(__dirname, "..", asistencia.pdfPath);

    if (!fs.existsSync(pdfFilePath)) {
      return res.status(404).json({ error: "El archivo PDF no existe en el servidor" });
    }

    // 📤 Enviar el PDF al navegador
    res.setHeader("Content-Type", "application/pdf");
    res.download(pdfFilePath, `asistencia_${id}.pdf`);
  } catch (err) {
    console.error("❌ Error al descargar PDF:", err);
    res.status(500).json({ error: "Error al descargar PDF" });
  }
});


module.exports = router;
