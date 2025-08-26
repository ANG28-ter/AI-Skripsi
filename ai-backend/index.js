// server.js
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
require("dotenv").config();

// Import modular controller/route
const evaluatorController = require("./controllers/evaluatorController");
const strukturEvaluasiRouter = require("./server/struktur-evaluasi");
const contohPenulisanRouter = require("./server/contoh-penulisan");
const chatDosenRouter = require("./server/chat-dosen");
const tanyaAIRoutes = require("./routes/tanyaAI");
// Tambahan controller skripsi
const generateController = require("./controllers/generateController");
const daftarPustakaController = require("./controllers/daftarPustakaController");
const proofreadController = require("./controllers/proofReadController");
const paraphraseController = require("./controllers/paraphraseController");

// Middleware global
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json());

// Endpoint non-skripsi
app.post("/evaluate", evaluatorController);
app.use(strukturEvaluasiRouter);
app.use(contohPenulisanRouter);
app.use(chatDosenRouter);
app.use("/tanya-ai", tanyaAIRoutes);

// Endpoint skripsi modular
app.post("/generate", generateController);
app.post("/bab1", generateController);
app.post("/bab2", generateController);
app.post("/bab3", generateController);
app.post("/bab4", generateController);
app.post("/bab5", generateController);
app.post("/skripsi-full", generateController);
app.post("/latar-belakang", generateController);
app.post("/rumusan-masalah", generateController);
app.post("/tujuan-penelitian", generateController);
app.post("/manfaat-penelitian", generateController);
app.post("/ruang-lingkup", generateController);
app.post("/generate-daftar-pustaka", daftarPustakaController);
app.post("/proofread", proofreadController);
app.post("/paraphrase", paraphraseController);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
