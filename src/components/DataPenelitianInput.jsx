import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  FileUp,
  FileText,
  FileSpreadsheet,
  Keyboard,
  FileCheck2,
  Loader2,
} from "lucide-react";

export default function DataPenelitianInput({
  tipePenelitian,
  setTipePenelitian,
  dataPenelitian,
  setDataPenelitian,
}) {
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    setFileName(file.name);
    setLoading(true);

    const onFinish = () => setTimeout(() => setLoading(false), 500);

    if (name.endsWith(".xlsx")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const combinedText = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const sheetData = rows
            .map((row) => row.join(" | "))
            .join("\n")
            .trim();
          return `=== ${sheetName} ===\n${sheetData}`;
        }).join("\n\n");

        setDataPenelitian(combinedText);
        onFinish();
      };
      reader.readAsArrayBuffer(file);
    } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDataPenelitian(event.target.result);
        onFinish();
      };
      reader.readAsText(file);
    } else {
      alert("Format file tidak didukung. Hanya .txt, .csv, atau .xlsx.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 p-6 mb-6 rounded-2xl text-white space-y-6 shadow-md">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5 text-teal-400" />
        Input Data Penelitian
      </h2>

      {/* Pilih Tipe Penelitian */}
      <div className="space-y-1">
        <label className="text-sm font-medium flex items-center gap-1 text-zinc-300">
          <FileSpreadsheet className="w-4 h-4 text-teal-300" />
          Tipe Penelitian:
        </label>
        <select
          disabled={loading}
          className="w-full bg-zinc-800 border border-zinc-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          value={tipePenelitian}
          onChange={(e) => setTipePenelitian(e.target.value)}
        >
          <option value="kuantitatif">Kuantitatif</option>
          <option value="kualitatif">Kualitatif</option>
          <option value="campuran">Campuran</option>
        </select>
      </div>

      {/* Upload File */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1 text-zinc-300">
          <FileUp className="w-4 h-4 text-teal-300" />
          Upload File Data:
        </label>
        <input
          type="file"
          accept=".csv,.txt,.xlsx"
          disabled={loading}
          onChange={handleFileChange}
          className="file:bg-zinc-700 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-full file:mr-4 hover:file:bg-zinc-600 text-sm disabled:cursor-not-allowed"
        />
        {fileName && !loading && (
          <p className="text-sm text-teal-400 flex items-center gap-1">
            <FileCheck2 className="w-4 h-4" />
            {fileName} berhasil dimuat
          </p>
        )}
        {loading && (
          <p className="text-sm text-yellow-400 flex items-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memproses file...
          </p>
        )}
      </div>

      {/* Textarea Manual */}
      <div className="space-y-1">
        <label className="text-sm font-medium flex items-center gap-1 text-zinc-300">
          <Keyboard className="w-4 h-4 text-teal-300" />
          Atau Ketik Manual:
        </label>
        <textarea
          disabled={loading}
          className="w-full bg-zinc-800 border border-zinc-600 p-4 rounded-lg min-h-[150px] resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          value={dataPenelitian}
          onChange={(e) => setDataPenelitian(e.target.value)}
          placeholder="Masukkan data hasil wawancara, angket, atau observasi..."
        />
      </div>
    </div>
  );
}
