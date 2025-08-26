import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import SectionSmartPDF from "./SectionSmartPdf";

// Optional custom font
Font.register({
  family: "Times-Roman",
  src: "https://fonts.gstatic.com/s/tinos/v20/buExpoi5ecWQmWQyVnU.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Times-Roman",
    lineHeight: 1.5,
  },
  heading1: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },
  heading2: {
    fontSize: 14,
    fontWeight: "semibold",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
});

export default function SkripsiPdf({ bab1, bab2, bab3, bab4, bab5 }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* BAB I */}
        <Text style={styles.heading1}>BAB I – Pendahuluan</Text>
        <SectionSmartPDF
          title="1.1 Latar Belakang"
          content={bab1?.latarBelakang}
        />
        <SectionSmartPDF
          title="1.2 Rumusan Masalah"
          content={bab1?.rumusanMasalah}
        />
        <SectionSmartPDF
          title="1.3 Tujuan Penelitian"
          content={bab1?.tujuanPenelitian}
        />
        <SectionSmartPDF
          title="1.4 Manfaat Penelitian"
          content={bab1?.manfaatPenelitian}
        />
        <SectionSmartPDF
          title="1.5 Ruang Lingkup"
          content={bab1?.ruangLingkup}
        />
        <SectionSmartPDF
          title="1.6 Sistematika Penulisan"
          content={bab1?.sistematikaPenulisan}
        />

        {/* BAB II */}
        <Text style={styles.heading1} break>
          BAB II – Tinjauan Pustaka
        </Text>
        <SectionSmartPDF title="2.1 Kajian Teori" content={bab2?.kajianTeori} />
        <SectionSmartPDF
          title="2.2 Penelitian Terdahulu"
          content={bab2?.penelitianTerdahulu}
        />
        <SectionSmartPDF
          title="2.3 Kerangka Pemikiran"
          content={bab2?.kerangkaPemikiran}
        />
        <SectionSmartPDF title="2.4 Hipotesis" content={bab2?.hipotesis} />

        {/* BAB III */}
        <Text style={styles.heading1} break>
          BAB III – Metodologi Penelitian
        </Text>
        <SectionSmartPDF
          title="3.1 Jenis dan Pendekatan"
          content={bab3?.jenisPendekatan}
        />
        <SectionSmartPDF
          title="3.2 Lokasi dan Waktu"
          content={bab3?.lokasiWaktu}
        />
        <SectionSmartPDF
          title="3.3 Populasi dan Sampel"
          content={bab3?.populasiSampel}
        />
        <SectionSmartPDF
          title="3.4 Teknik Pengumpulan"
          content={bab3?.teknikPengumpulan}
        />
        <SectionSmartPDF
          title="3.5 Instrumen Penelitian"
          content={bab3?.instrumen}
        />
        <SectionSmartPDF
          title="3.6 Uji Validitas dan Reliabilitas"
          content={bab3?.validitasReliabilitas}
        />
        <SectionSmartPDF
          title="3.7 Teknik Analisis Data"
          content={bab3?.teknikAnalisis}
        />
        <SectionSmartPDF
          title="3.8 Prosedur Penelitian"
          content={bab3?.prosedurPenelitian}
        />
        <SectionSmartPDF
          title="3.9 Jadwal Penelitian"
          content={bab3?.jadwalPenelitian}
        />

        {/* BAB IV */}
        <Text style={styles.heading1} break>
          BAB IV – Hasil dan Pembahasan
        </Text>
        <SectionSmartPDF
          title="4.1 Gambaran Umum Objek Penelitian"
          content={bab4?.gambaranUmum}
        />
        <SectionSmartPDF
          title="4.2 Penyajian Data"
          content={bab4?.penyajianData}
        />
        <SectionSmartPDF
          title="4.3.1.1 Analisis Data Kuantitatif"
          content={bab4?.analisisDataKuantitatif}
        />
        <SectionSmartPDF
          title="4.3.1.2 Analisis Data Kualitatif"
          content={bab4?.analisisDataKualitatif}
        />
        <SectionSmartPDF
          title="4.4.1 Pembahasan Variabel A"
          content={bab4?.pembahasan1}
        />
        <SectionSmartPDF
          title="4.4.2 Pembahasan Variabel B"
          content={bab4?.pembahasan2}
        />
        <SectionSmartPDF
          title="4.4.3 Pembahasan Korelasi"
          content={bab4?.pembahasan3}
        />

        {/* BAB V */}
        <Text style={styles.heading1} break>
          BAB V – Penutup
        </Text>
        <SectionSmartPDF title="5.1 Kesimpulan" content={bab5?.bab5_1} />
        <SectionSmartPDF title="5.2 Saran" content={bab5?.bab5_2} />
        <SectionSmartPDF title="5.3 ..." content={bab5?.bab5_3} />
        <SectionSmartPDF title="5.4 ..." content={bab5?.bab5_4} />
      </Page>
    </Document>
  );
}
