import React, { useState, useEffect, useMemo, forwardRef } from "react";
import { Expand, X, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fixSpacing } from "/src/utils/fixSpacing";
import SectionContainer from "/src/components/SectionContainer";
import ActionButton from "/src/components/ActionButton";
import ExportToPdf from "./ExportToPdf";
import { motion, AnimatePresence } from "framer-motion";
import LoadingParagraphs from "./LoadingParagraphs";
import ParagrafItem from "./ParagrafItem";
import { getAllParaphrases } from "../services/paraphraseStore";

const MarkdownParagraphFadeIn = ({
  content,
  isLoading = false,
  babId, // ✅ terima babId
}) => {
  const elements = useMemo(() => {
    const parts = fixSpacing(content)
      .split(/\n{2,}/g)
      .reduce((acc, part) => {
        const trimmed = part.trim();
        const last = acc[acc.length - 1] || "";

        // Gabungkan jika dua blok berturut-turut mengandung tanda tabel Markdown
        if (trimmed.includes("|") && last.includes("|")) {
          acc[acc.length - 1] = `${last}\n\n${trimmed}`;
        } else {
          acc.push(trimmed);
        }

        return acc;
      }, []);
    let paragraphIndex = 0;

    return parts.map((text) => {
      const trimmed = text.trim();
      const isHeading = /^#{1,6}\s/.test(trimmed);
      const item = {
        text: trimmed,
        isHeading,
        index: isHeading ? null : paragraphIndex,
      };
      if (!isHeading) paragraphIndex++; // hanya increment kalau bukan heading
      return item;
    });
  }, [content]);

  if (isLoading) return <LoadingParagraphs />;

  return (
    <div className="prose prose-invert max-w-none text-neutral-200 prose-headings:text-white prose-p:leading-relaxed prose-p:indent-8 space-y-3">
      {elements.map(({ text, isHeading, index }, i) => (
        <ParagrafItem
          key={`${babId}-${index ?? "heading"}-${i}`}
          text={text}
          isHeading={isHeading}
          index={index}
          babId={babId} // ✅ kirim babId ke ParagrafItem
        />
      ))}
    </div>
  );
};

const BabAccordion = ({ title, children, highlight = false, id }) => {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      id={id}
      className={`border rounded-xl mb-4 overflow-hidden ${
        highlight
          ? "border-teal-500 shadow-lg shadow-teal-500/20"
          : "border-zinc-700"
      }`}
      initial={{ backgroundColor: highlight ? "#0f766e" : undefined }}
      animate={{ backgroundColor: "transparent" }}
      transition={{ duration: 1.2 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-left"
      >
        <span className="font-semibold text-white">{title}</span>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="p-4 bg-zinc-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FullSkripsiOutput = forwardRef(function FullSkripsiOutput(
  {
    bab1 = {},
    bab2 = {},
    bab3 = {},
    bab4 = {},
    bab5 = {},
    lastGeneratedBab = null,
    isLoading = false,
    babKey,
  },
  ref
) {
  const [highlighted, setHighlighted] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paraphraseMap, setParaphraseMap] = useState({});

  useEffect(() => {
    const fetchParaphrases = async () => {
      const all = await getAllParaphrases();
      setParaphraseMap(all);
    };
    fetchParaphrases();
  }, []);

  useEffect(() => {
    setHighlighted(lastGeneratedBab);
  }, [lastGeneratedBab]);

  useEffect(() => {
    if (babKey && isBabReady(babKey)) {
      setHighlighted(babKey);
      setIsFullscreen(true);
    }
  }, [babKey]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const get = (val) => val || "*Belum ada data.*";

  const getBabContent = (babKey) => {
    switch (babKey) {
      case "bab1":
        return `## 1.1 Latar Belakang\n${get(
          bab1.latarBelakang
        )}\n\n## 1.2 Rumusan Masalah\n${get(
          bab1.rumusanMasalah
        )}\n\n## 1.3 Tujuan Penelitian\n${get(
          bab1.tujuanPenelitian
        )}\n\n## 1.4 Manfaat Penelitian\n${get(
          bab1.manfaatPenelitian
        )}\n\n## 1.5 Ruang Lingkup\n${get(bab1.ruangLingkup)}`;
      case "bab2":
        return `## 2.1 Kajian Teori\n${get(
          bab2.kajianTeori
        )}\n\n## 2.2 Penelitian Terdahulu\n${get(
          bab2.penelitianTerdahulu
        )}\n\n## 2.3 Kerangka Pemikiran\n${get(
          bab2.kerangkaPemikiran
        )}\n\n## 2.4 Hipotesis\n${get(bab2.hipotesis)}`;
      case "bab3":
        return `## 3.1 Jenis dan Pendekatan Penelitian\n${get(
          bab3.jenisPendekatan
        )}\n\n## 3.2 Lokasi dan Waktu Penelitian\n${get(
          bab3.lokasiWaktu
        )}\n\n## 3.3 Populasi dan Sampel\n${get(
          bab3.populasiSampel
        )}\n\n## 3.4 Teknik Pengumpulan Data\n${get(
          bab3.teknikPengumpulan
        )}\n\n## 3.5 Instrumen Penelitian\n${get(
          bab3.instrumen
        )}\n\n## 3.6 Uji Validitas dan Reliabilitas\n${get(
          bab3.validitasReliabilitas
        )}\n\n## 3.7 Teknik Analisis Data\n${get(
          bab3.teknikAnalisis
        )}\n\n## 3.8 Prosedur Penelitian\n${get(
          bab3.prosedurPenelitian
        )}\n\n## 3.9 Jadwal Penelitian\n${get(bab3.jadwalPenelitian)}`;
      case "bab4":
        return `## 4.1 Gambaran Umum Objek Penelitian\n${get(
          bab4.gambaranUmum
        )}\n\n## 4.2 Penyajian Data\n${get(
          bab4.penyajianData
        )}\n\n## 4.3.1.1 Analisis Data Kuantitatif\n${get(
          bab4.analisisDataKuantitatif
        )}
        )}\n\n## 4.3.1.2 Analisis Data Kualitatif\n${get(
          bab4.analisisDataKualitatif
        )}
        )}\n\n## 4.4.1 Hubungan Hasil Penelitian dengan Kajian Teori\n${get(
          bab4.pembahasan1
        )}\n\n## 4.4.2 Diskusi Temuan Unik\n${get(
          bab4.pembahasan2
        )}\n\n## 4.4.3 Relevansi Temuan dengan Penelitian Sebelumnya\n${get(
          bab4.pembahasan3
        )}`;
      case "bab5":
        return `## 5.1 Kesimpulan\n${get(bab5.bab5_1)}\n\n## 5.2 Saran\n${get(
          bab5.bab5_2
        )}`;
      default:
        return "*Tidak ada data.*";
    }
  };

  const renderBab = () => (
    <div>
      {Object.keys(bab1).length > 0 && (
        <BabAccordion
          id="section-bab1"
          title="BAB I - Pendahuluan"
          highlight={highlighted === "bab1"}
        >
          {[
            ["1.1 Latar Belakang", bab1.latarBelakang],
            ["1.2 Rumusan Masalah", bab1.rumusanMasalah],
            ["1.3 Tujuan Penelitian", bab1.tujuanPenelitian],
            ["1.4 Manfaat Penelitian", bab1.manfaatPenelitian],
            ["1.5 Ruang Lingkup", bab1.ruangLingkup],
          ].map(([judul, isi], i) => {
            const subBabId = `bab1_${judul}`.replace(/\s+/g, "_").toLowerCase();
            return (
              <div key={subBabId} className="mb-6">
                <p className="font-semibold text-white mb-2">{judul}</p>
                <MarkdownParagraphFadeIn
                  content={isi}
                  babId={subBabId}
                  paraphraseMap={paraphraseMap}
                />
              </div>
            );
          })}
        </BabAccordion>
      )}
      {Object.keys(bab2).length > 0 && (
        <BabAccordion
          id="section-bab2"
          title="BAB II - Tinjauan Pustaka"
          highlight={highlighted === "bab2"}
        >
          {[
            ["2.1 Kajian Teori", bab2.kajianTeori],
            ["2.2 Penelitian Terdahulu", bab2.penelitianTerdahulu],
            ["2.3 Kerangka Pemikiran", bab2.kerangkaPemikiran],
            ["2.4 Hipotesis", bab2.hipotesis],
          ].map(([judul, isi]) => {
            const subBabId = `bab2_${judul}`.replace(/\s+/g, "_").toLowerCase();
            return (
              <div key={subBabId} className="mb-6">
                <p className="font-semibold text-white mb-2">{judul}</p>
                <MarkdownParagraphFadeIn
                  content={isi}
                  babId={subBabId}
                  paraphraseMap={paraphraseMap}
                />
              </div>
            );
          })}
        </BabAccordion>
      )}

      {Object.keys(bab3).length > 0 && (
        <BabAccordion
          id="section-bab3"
          title="BAB III - Metodologi Penelitian"
          highlight={highlighted === "bab3"}
        >
          {[
            ["3.1 Jenis dan Pendekatan Penelitian", bab3.jenisPendekatan],
            ["3.2 Lokasi dan Waktu Penelitian", bab3.lokasiWaktu],
            ["3.3 Populasi dan Sampel", bab3.populasiSampel],
            ["3.4 Teknik Pengumpulan Data", bab3.teknikPengumpulan],
            ["3.5 Instrumen Penelitian", bab3.instrumen],
            ["3.6 Uji Validitas dan Reliabilitas", bab3.validitasReliabilitas],
            ["3.7 Teknik Analisis Data", bab3.teknikAnalisis],
            ["3.8 Prosedur Penelitian", bab3.prosedurPenelitian],
            ["3.9 Jadwal Penelitian", bab3.jadwalPenelitian],
          ].map(([judul, isi]) => {
            const subBabId = `bab3_${judul}`.replace(/\s+/g, "_").toLowerCase();
            return (
              <div key={subBabId} className="mb-6">
                <p className="font-semibold text-white mb-2">{judul}</p>
                <MarkdownParagraphFadeIn
                  content={isi}
                  babId={subBabId}
                  paraphraseMap={paraphraseMap}
                />
              </div>
            );
          })}
        </BabAccordion>
      )}

      {Object.keys(bab4).length > 0 && (
        <BabAccordion
          id="section-bab4"
          title="BAB IV - Hasil dan Pembahasan"
          highlight={highlighted === "bab4"}
        >
          {[
            ["4.1 Gambaran Umum Objek Penelitian", bab4.gambaranUmum],
            ["4.2 Penyajian Data", bab4.penyajianData],
            ["4.3.1.1 Analisis Data Kuantitatif", bab4.analisisDataKuantitatif],
            ["4.3.1.2 Analisis Data Kualitatif", bab4.analisisDataKualitatif],
            // 🔹 Sudah disamakan dengan generateBab4Full dan aiOutputMap
            ["4.4.1 Hubungan Hasil Penelitian dengan Teori", bab4.pembahasan1],
            ["4.4.2 Pembahasan Temuan Unik atau Anomali", bab4.pembahasan2],
            [
              "4.4.3 Perbandingan dengan Penelitian Sebelumnya",
              bab4.pembahasan3,
            ],
          ].map(([judul, isi]) => {
            const subBabId = `bab4_${judul}`.replace(/\s+/g, "_").toLowerCase();
            return (
              <div key={subBabId} className="mb-6">
                <p className="font-semibold text-white mb-2">{judul}</p>
                <MarkdownParagraphFadeIn
                  content={isi}
                  babId={subBabId}
                  paraphraseMap={paraphraseMap}
                />
              </div>
            );
          })}
        </BabAccordion>
      )}

      {Object.keys(bab5).length > 0 && (
        <BabAccordion
          id="section-bab5"
          title="BAB V - Penutup"
          highlight={highlighted === "bab5"}
        >
          {[
            ["5.1 Kesimpulan", bab5.bab5_1],
            ["5.2 Saran", bab5.bab5_2],
          ].map(([judul, isi]) => {
            const subBabId = `bab5_${judul}`.replace(/\s+/g, "_").toLowerCase();
            return (
              <div key={subBabId} className="mb-6">
                <p className="font-semibold text-white mb-2">{judul}</p>
                <MarkdownParagraphFadeIn
                  content={isi}
                  babId={subBabId}
                  paraphraseMap={paraphraseMap}
                />
              </div>
            );
          })}
        </BabAccordion>
      )}
    </div>
  );

  const isBabReady = (babKey) => {
    const content = getBabContent(babKey);
    return (
      content && !content.includes("*Belum ada data.*") && content.length > 50
    );
  };

  return (
    <>
      <SectionContainer ref={ref}>
        <div className="flex justify-end mb-4 gap-5">
          <ExportToPdf
            bab1={bab1}
            bab2={bab2}
            bab3={bab3}
            bab4={bab4}
            bab5={bab5}
          />
          <ActionButton
            onClick={() => setIsFullscreen(true)}
            label="Fullscreen"
            icon={Expand}
            color="primary"
          />
        </div>
        <div
          className={`${
            isFullscreen
              ? "fixed inset-0 z-50 bg-black p-10 overflow-y-auto"
              : "max-h-[800px] overflow-y-auto"
          } scrollbar-thin scrollbar-thumb scrollbar-track-transparent bg-surfaceDark/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6`}
        >
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 text-white hover:text-red-400"
            >
              <X />
            </button>
          )}
          {renderBab()}
        </div>
      </SectionContainer>
    </>
  );
});

export default FullSkripsiOutput;
