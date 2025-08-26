import React, { useState } from "react";
import { strukturPenjelasan } from "/src/utils/strukturPenjelasan";
import { ChevronDown, ChevronRight, BookOpenText, FileText } from "lucide-react";

export default function StrukturPanduan() {
  const [openBab, setOpenBab] = useState(null);
  const [showContohMap, setShowContohMap] = useState({});

  const struktur = {
    "BAB I: Pendahuluan": [
      "1.1 Latar Belakang",
      "1.2 Rumusan Masalah",
      "1.3 Tujuan Penelitian",
      "1.4 Manfaat Penelitian",
      "1.5 Ruang Lingkup",
      "1.6 Sistematika Penulisan",
    ],
    "BAB II: Tinjauan Pustaka": [
      "2.1 Kajian Teori",
      "2.2 Penelitian Terdahulu",
      "2.3 Kerangka Pemikiran",
      "2.4 Hipotesis",
    ],
    "BAB III: Metodologi Penelitian": [
      "3.1 Jenis dan Pendekatan Penelitian",
      "3.2 Lokasi dan Waktu",
      "3.3 Populasi dan Sampel",
      "3.4 Teknik Pengumpulan Data",
      "3.5 Instrumen Penelitian",
      "3.6 Teknik Analisis Data",
    ],
    "BAB IV: Hasil dan Pembahasan": [
      "4.1 Gambaran Umum Objek Penelitian",
      "4.2 Penyajian Data",
      "4.3 Analisis Data",
      "4.4 Pembahasan",
    ],
    "BAB V: Penutup": ["5.1 Kesimpulan", "5.2 Saran"],
  };

  return (
    <div className="bg-[#111827] border border-slate-700 rounded-xl p-6 text-slate-100 shadow-xl">
      <h2 className="text-xl font-bold text-slaate-400 mb-4 flex items-center gap-2">
        <BookOpenText className="w-6 h-6" /> Panduan Struktur Skripsi
      </h2>

      {Object.entries(struktur).map(([bab, subbab], idx) => (
        <div key={idx} className="mb-4">
          <button
            onClick={() => setOpenBab(openBab === bab ? null : bab)}
            className="flex items-center w-full text-left font-semibold text-slate-200 hover:text-slate-400 transition-all"
          >
            {openBab === bab ? (
              <ChevronDown className="w-5 h-5 mr-2" />
            ) : (
              <ChevronRight className="w-5 h-5 mr-2" />
            )}
            {bab}
          </button>

          {openBab === bab && (
            <ul className="mt-2 space-y-4 pl-6 border-l border-slate-800 ml-1">
              {subbab.map((judul, i) => {
                const info = strukturPenjelasan[judul];
                const isContohShown = showContohMap[judul];

                return (
                  <li key={i} className="text-sm">
                    <p className="text-slate-300 font-semibold mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {judul}
                    </p>

                    <p className="text-slate-300 mb-2 leading-relaxed">
                      {info?.penjelasan || (
                        <span className="italic text-slate-500">
                          Belum ada penjelasan.
                        </span>
                      )}
                    </p>

                    {info?.contoh && (
                      <>
                        <button
                          onClick={() =>
                            setShowContohMap((prev) => ({
                              ...prev,
                              [judul]: !prev[judul],
                            }))
                          }
                          className="text-xs text-slate-400 underline hover:text-cyan-300 transition"
                        >
                          {isContohShown ? "Sembunyikan Contoh Penulisan" : "Lihat Contoh Penulisan"}
                        </button>

                        {isContohShown && (
                          <div className="mt-2 bg-[#0b0f19] border border-slate-800 rounded-lg p-3 text-sm whitespace-pre-wrap text-slate-100 transition-all duration-300">
                            {info.contoh}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
