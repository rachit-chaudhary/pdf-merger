const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, "renderer.js"),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile("index.html");
}

// PDF merge function
async function mergePdfs(pdfDir) {
  const pattern = /(HFC\d+)/;
  const outputDir = path.join(pdfDir, "merged");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const pdfGroups = {};

  fs.readdirSync(pdfDir).forEach((file) => {
    if (file.toLowerCase().endsWith(".pdf")) {
      const match = file.match(pattern);
      if (match) {
        const patientId = match[1];
        if (!pdfGroups[patientId]) pdfGroups[patientId] = [];
        pdfGroups[patientId].push(path.join(pdfDir, file));
      }
    }
  });

  for (const patientId of Object.keys(pdfGroups)) {
    const files = pdfGroups[patientId];
    const mergedPdf = await PDFDocument.create();

    for (const file of files.sort()) {
      const pdfBytes = fs.readFileSync(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const outputFile = path.join(outputDir, `${patientId}_merged.pdf`);
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(outputFile, mergedBytes);
  }

  return outputDir;
}

ipcMain.handle("merge-pdfs", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (result.canceled) return null;

  const folderPath = result.filePaths[0];
  const outputDir = await mergePdfs(folderPath);

  // Open merged folder automatically
  shell.openPath(outputDir);
  return outputDir;
});

app.whenReady().then(() => {
  createWindow();
});
