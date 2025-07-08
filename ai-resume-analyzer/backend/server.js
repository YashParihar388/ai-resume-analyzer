const express = require('express');
const multer = require('multer');
const cors = require('cors');
const PDFParser = require("pdf2json");
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    let text;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const pdfParser = new PDFParser();
      text = await Promise.race([
        new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", pdfData => {
            const rawText = pdfParser.getRawTextContent();
            resolve(rawText);
          });
          pdfParser.parseBuffer(fileBuffer);
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("PDF parsing timed out")), 10000)) // 10s timeout
      ]);
    } catch (pdfErr) {
      console.error("❌ PDF parsing error (pdf2json):", pdfErr);
      return res.status(400).json({ error: "Failed to parse PDF with pdf2json. Please upload a valid, non-encrypted PDF file." });
    }

    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: "Resume text is empty or too short. Please upload a different PDF." });
    }

    const prompt = `Extract the following from this resume:\n\n${text}\n\nReturn JSON with: name, education, experience, skills (array), summary.`;

    let geminiRes;
    try {
      geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }], role: "user" }]
        }
      );
    } catch (apiErr) {
      console.error("❌ Gemini API error:", apiErr.message);
      return res.status(400).json({ error: "Failed to analyze resume with Gemini AI. Check your API key, quota, or try again later." });
    }

    const rawText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Attempt to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (jsonErr) {
      console.error("⚠️ Gemini did not return valid JSON:", rawText);
      return res.status(400).json({
        error: "Gemini AI did not return valid JSON. Check your API key or prompt.",
        raw: rawText
      });
    }

    res.json(parsed);

  } catch (err) {
    console.error("❌ Error processing file:", err.message);
    res.status(500).json({ error: "Server error. Please try again." });
  } finally {
    // Cleanup uploaded file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

app.listen(5000, () => console.log("✅ Backend on http://localhost:5000"));
