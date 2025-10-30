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
const maxAsistentes = 25;

// Coordenadas ajustadas para los cuadros del formato
const baseY = 510;   // Altura inicial (primera línea)
const step = 22.4;   // Espaciado exacto entre filas

// Columnas ajustadas para centrar texto en cada cuadro
const nombreX = 130; // Columna NOMBRE
const cargoX = 315;  // Columna CARGO
const firmaX = 475;  // Columna FIRMA

const totalAsistentes = Array.isArray(data.asistentes)
  ? data.asistentes.length
  : 0;

for (let i = 0; i < totalAsistentes; i++) {
  const a = data.asistentes[i] || {};
  const y = baseY - i * step;

  // Nombre y cargo centrados dentro del cuadro
  page.drawText(a.nombre || "", {
    x: nombreX,
    y: y,
    size: 10,
    font,
  });

  page.drawText(a.cargo || "", {
    x: cargoX,
    y: y,
    size: 10,
    font,
  });

  // Firma (si hay imagen)
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
        y: y - sigHeight / 2 + 6,
        width: sigWidth,
        height: sigHeight,
      });
    }
  }
}

// -------------------- LÍNEAS EN ESPACIOS VACÍOS --------------------
if (totalAsistentes < maxAsistentes) {
  const fromY = baseY - totalAsistentes * step + 4;
  const toY = baseY - (maxAsistentes - 1) * step - 10;

  const drawLine = (x) => {
    page.drawLine({
      start: { x, y: fromY },
      end: { x, y: toY },
      thickness: 1,
    });
  };

  // Líneas ajustadas al borde derecho de cada columna
  drawLine(nombreX + 75); // Línea nombres
  drawLine(cargoX + 75);  // Línea cargos
  drawLine(firmaX + 75);  // Línea firmas
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

module.exports = router;
