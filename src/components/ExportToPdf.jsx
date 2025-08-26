// src/components/ExportPdfButton.jsx
import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import SkripsiPdf from "../export/SkripsiPdf";

const sanitizeFileName = (title) => {
  if (!title || typeof title !== "string") return "skripsi";
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")          // ubah spasi jadi dash
    .replace(/[^\w\-]+/g, "")      // hapus karakter non-alfanumerik
    .slice(0, 100);                // batasi panjang maksimal 100 char
};

export default function ExportToPdf({ judul, bab1, bab2, bab3, bab4, bab5 }) {
  const fileName = `${sanitizeFileName(judul)}.pdf`;
  // if (!judul || judul.trim().length < 5) return null;
  return (
    <PDFDownloadLink
  document={
    <SkripsiPdf
      judul={judul}
      bab1={bab1}
      bab2={bab2}
      bab3={bab3}
      bab4={bab4}
      bab5={bab5}
    />
  }
   fileName={fileName}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-semibold shadow hover:brightness-110 transition"
>
  {({ loading }) => (
    <>
      <Download size={16} />
      {loading ? "Memuat..." : "Export PDF"}
    </>
  )}
</PDFDownloadLink>

  );
}
