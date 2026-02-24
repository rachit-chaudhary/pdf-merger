const { ipcRenderer } = require("electron");

document.getElementById("mergeBtn").addEventListener("click", async () => {
  document.getElementById("status").textContent = "Merging PDFs... Please wait ⏳";

  const result = await ipcRenderer.invoke("merge-pdfs");

  if (result) {
    document.getElementById("status").textContent = `✅ Done! Merged files saved in: ${result}`;
  } else {
    document.getElementById("status").textContent = "❌ Operation canceled.";
  }
});
