import React from "react";
import Select from "react-select";

const babList = [
  // BAB I
  { label: "BAB I - Latar Belakang", value: "1.1 Latar Belakang" },
  { label: "BAB I - Rumusan Masalah", value: "1.2 Rumusan Masalah" },
  { label: "BAB I - Tujuan Penelitian", value: "1.3 Tujuan Penelitian" },
  { label: "BAB I - Manfaat Penelitian", value: "1.4 Manfaat Penelitian" },
  { label: "BAB I - Ruang Lingkup", value: "1.5 Ruang Lingkup" },

  // BAB II
  { label: "BAB II - Kajian Teori", value: "2.1 Kajian Teori" },
  { label: "BAB II - Penelitian Terdahulu", value: "2.2 Penelitian Terdahulu" },
  { label: "BAB II - Kerangka Pemikiran", value: "2.3 Kerangka Pemikiran" },
  { label: "BAB II - Hipotesis", value: "2.4 Hipotesis" },

  // BAB III
  { label: "BAB III - Jenis dan Pendekatan Penelitian", value: "3.1 Jenis dan Pendekatan" },
  { label: "BAB III - Lokasi dan Waktu Penelitian", value: "3.2 Lokasi dan Waktu" },
  { label: "BAB III - Populasi dan Sampel", value: "3.3 Populasi dan Sampel" },
  { label: "BAB III - Teknik Pengumpulan Data", value: "3.4 Teknik Pengumpulan Data" },
  { label: "BAB III - Instrumen Penelitian", value: "3.5 Instrumen Penelitian" },
  { label: "BAB III - Uji Validitas dan Reliabilitas", value: "3.6 Uji Validitas dan Realibilitas" },
  { label: "BAB III - Teknik Analisis Data", value: "3.7 Teknik Analisis Data" },
  { label: "BAB III - Prosedur Penelitian", value: "3.8 Prosedur Penelitian" },
  { label: "BAB III - Jadwal Penelitian", value: "3.9 Jadwal Penelitian" },

  // BAB IV
 { label: "BAB IV - Gambaran Umum Objek Penelitian", value: "4.1 Gambaran Umum Objek Penelitian" },
{ label: "BAB IV - Penyajian Data", value: "4.2 Penyajian Data" },
{ label: "BAB IV - Analisis Data Kuantitatif", value: "4.3.1.1 Analisis Data Kuantitatif" },
{ label: "BAB IV - Analisis Data Kualitatif", value: "4.3.1.2 Analisis Data Kualitatif" },
{ label: "BAB IV - Hubungan Hasil Penelitian dengan Teori", value: "4.4.1 Hubungan Hasil Penelitian dengan Teori" },
{ label: "BAB IV - Pembahasan Temuan Unik atau Anomali", value: "4.4.2 Pembahasan Temuan Unik atau Anomali" },
{ label: "BAB IV - Perbandingan dengan Penelitian Sebelumnya", value: "4.4.3 Perbandingan dengan Penelitian Sebelumnya" },

  // BAB V
  { label: "BAB V - Kesimpulan", value: "5.1 Kesimpulan" },
  { label: "BAB V - Saran", value: "5.2 Saran" },
];

export default function BabSelector({ selectedBab, onChange }) {
  const selectedOption = babList.find((b) => b.value === selectedBab);

  return (
    <div className=" mx-auto bg-surfaceDark/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-lg">
      <label className="block text-base font-semibold text-slate-200">
        Pilih BAB
      </label>

      <Select
        options={babList}
        value={selectedOption}
        onChange={(opt) => onChange(opt.value)}
        menuPlacement="bottom"
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            backgroundColor: "#1f2937",
            borderColor: state.isFocused ? "#00ffb3" : "#475569",
            borderRadius: "0.75rem",
            padding: "6px 10px",
            boxShadow: "none",
            color: "white",
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "#1f2937",
            borderRadius: "0.75rem",
            padding: "4px",
            color: "white",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#99a3b9" : "#1f2937",
            color: "white",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }),
          singleValue: (base) => ({
            ...base,
            color: "white",
          }),
          input: (base) => ({
            ...base,
            color: "white",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#94a3b8",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "white",
          }),
          indicatorSeparator: () => ({
            display: "none",
          }),
        }}
      />
    </div>
  );
}
