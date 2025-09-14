const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

// Directory containing PDFs
const PDF_DIR = "./Patient-Reports";

// Regex pattern to match patient IDs (e.g., HFC001, HFC002)
const PATTERN = /(HFC\d+)/;

// Output directory for merged files
const OUTPUT_DIR = path.join(PDF_DIR, "merged");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Group PDFs by patient ID
const pdfGroups = {};

fs.readdirSync(PDF_DIR).forEach((file) => {
  if (file.toLowerCase().endsWith(".pdf")) {
    const match = file.match(PATTERN);
    if (match) {
      const patientId = match[1];
      if (!pdfGroups[patientId]) pdfGroups[patientId] = [];
      pdfGroups[patientId].push(path.join(PDF_DIR, file));
    }
  }
});

async function mergePdfs() {
  for (const patientId of Object.keys(pdfGroups)) {
    const files = pdfGroups[patientId];
    const mergedPdf = await PDFDocument.create();

    for (const file of files.sort()) {
      const pdfBytes = fs.readFileSync(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const outputFile = path.join(OUTPUT_DIR, `${patientId}_merged.pdf`);
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(outputFile, mergedBytes);

    console.log(`Merged ${files.length} files for ${patientId} -> ${outputFile}`);
  }

  console.log("✅ PDF merging complete.");
}

mergePdfs();
