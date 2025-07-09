const express = require('express');
const multer = require('multer');
const cors = require('cors');
const PDFParser = require("pdf2json");
const mammoth = require("mammoth");
const path = require("path");
const fs = require('fs');
const axios = require('axios');
const vision = require('@google-cloud/vision');
require('dotenv').config();

const visionClient = new vision.ImageAnnotatorClient();

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
      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileBuffer = fs.readFileSync(req.file.path);
      if (ext === ".pdf") {
        // Use Google Cloud Vision OCR for PDFs
        const [result] = await visionClient.batchAnnotateFiles({
          requests: [{
            inputConfig: {
              content: fileBuffer.toString('base64'),
              mimeType: 'application/pdf',
            },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          }],
        });
        text = result.responses[0].responses
          .map(r => r.fullTextAnnotation?.text || '')
          .join('\n');
      } else if (ext === ".docx") {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload a PDF or DOCX file." });
      }
    } catch (parseErr) {
      console.error("❌ File parsing error:", parseErr);
      return res.status(400).json({ error: "Failed to parse file. Please upload a valid, non-encrypted PDF or DOCX file." });
    }

    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: "Resume text is empty or too short. Please upload a different file." });
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
