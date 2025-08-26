import React from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faBriefcase,
  faGlobe,
  faFlask,
  faCog,
  faHeart,
  faPalette,
  faCertificate,
} from "@fortawesome/free-solid-svg-icons";

export const jurusanOptions = [
  {
    label: (
      <span className="flex z-10 items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faGraduationCap} /> Pendidikan
      </span>
    ),
    options: [
      { value: "PGSD", label: "PGSD" },
      { value: "PAUD", label: "PAUD" },
      { value: "Pendidikan Bahasa Inggris", label: "Pendidikan Bahasa Inggris" },
      { value: "Pendidikan Matematika", label: "Pendidikan Matematika" },
      { value: "Bimbingan dan Konseling", label: "Bimbingan dan Konseling" },
    ],
  },
  {
    label: (
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faBriefcase} /> Ekonomi & Bisnis
      </span>
    ),
    options: [
      { value: "Manajemen", label: "Manajemen" },
      { value: "Akuntansi", label: "Akuntansi" },
      { value: "Ekonomi Pembangunan", label: "Ekonomi Pembangunan" },
      { value: "Ekonomi Syariah", label: "Ekonomi Syariah" },
      { value: "Administrasi Bisnis", label: "Administrasi Bisnis" },
    ],
  },
  {
    label: (
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faGlobe} /> Sosial & Humaniora
      </span>
    ),
    options: [
      { value: "Ilmu Komunikasi", label: "Ilmu Komunikasi" },
      { value: "Psikologi", label: "Psikologi" },
      { value: "Ilmu Hukum", label: "Ilmu Hukum" },
      { value: "Sosiologi", label: "Sosiologi" },
      { value: "Antropologi", label: "Antropologi" },
      { value: "Hubungan Internasional", label: "Hubungan Internasional" },
    ],
  },
  {
    label: (
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faFlask} /> Sains & Matematika
      </span>
    ),
    options: [
      { value: "Matematika", label: "Matematika" },
      { value: "Statistika", label: "Statistika" },
      { value: "Biologi", label: "Biologi" },
      { value: "Kimia", label: "Kimia" },
      { value: "Fisika", label: "Fisika" },
    ],
  },
  {
    label: (
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faCog} /> Teknik & Komputer
      </span>
    ),
    options: [
      { value: "Teknik Informatika", label: "Teknik Informatika" },
      { value: "Sistem Informasi", label: "Sistem Informasi" },
      { value: "Ilmu Komputer", label: "Ilmu Komputer" },
      { value: "Teknik Industri", label: "Teknik Industri" },
      { value: "Teknik Mesin", label: "Teknik Mesin" },
      { value: "Teknik Sipil", label: "Teknik Sipil" },
      { value: "Teknik Elektro", label: "Teknik Elektro" },
      { value: "Teknik Lingkungan", label: "Teknik Lingkungan" },
      { value: "Arsitektur", label: "Arsitektur" },
    ],
  },
  {
    label: (
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faHeart} /> Kesehatan
      </span>
    ),
    options: [
      { value: "Kedokteran", label: "Kedokteran" },
      { value: "Farmasi", label: "Farmasi" },
      { value: "Keperawatan", label: "Keperawatan" },
      { value: "Gizi", label: "Ilmu Gizi" },
      { value: "Kesehatan Masyarakat", label: "Kesehatan Masyarakat" },
      { value: "Kebidanan", label: "Kebidanan" },
    ],
  },
  {
    label: (
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faPalette} /> Seni & Desain
      </span>
    ),
    options: [
      { value: "DKV", label: "Desain Komunikasi Visual" },
      { value: "Desain Produk", label: "Desain Produk" },
      { value: "Seni Rupa", label: "Seni Rupa" },
      { value: "Film & Televisi", label: "Film & Televisi" },
    ],
  },
  {
    label: (
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <FontAwesomeIcon icon={faCertificate} /> Vokasi & D3
      </span>
    ),
    options: [
      { value: "D3 Akuntansi", label: "D3 Akuntansi" },
      { value: "D3 Perhotelan", label: "D3 Perhotelan" },
      { value: "D3 Teknik Komputer", label: "D3 Teknik Komputer" },
      { value: "D3 Penyiaran", label: "D3 Penyiaran" },
      { value: "D3 Administrasi Perkantoran", label: "D3 Administrasi Perkantoran" },
    ],
  },
];

export default function JurusanSelector({ value, onChange }) {
  const selectedOption = jurusanOptions.flatMap((g) => g.options).find((o) => o.value === value);

  return (
    <div className="mt-2">
      <Select
       menuPortalTarget={document.body}
        options={jurusanOptions}
        value={selectedOption}
        onChange={(opt) => onChange({ target: { value: opt ? opt.value : "" } })}
        isClearable
        isSearchable
        placeholder="Cari atau pilih jurusan..."
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            backgroundColor: "#1e1e24",
            borderColor: state.isFocused ? "#00ffb3" : "#3f3f46",
            borderRadius: "0.75rem",
            padding: "6px 10px",
            minHeight: "2.75rem",
            boxShadow: "none",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "#3f3f46"
              : state.isFocused
              ? "#475569"
              : "#1e293b",
            color: "white",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "#1e293b",
            borderRadius: "0.75rem",
            marginTop: "0.5rem",
          }),
          dropdownIndicator: (base) => ({ ...base, color: "white" }),
          input: (base) => ({ ...base, color: "white" }),
          singleValue: (base) => ({ ...base, color: "white" }),
          placeholder: (base) => ({ ...base, color: "#94a3b8" }),
          indicatorSeparator: () => ({ display: "none" }),
        }}
      />
    </div>
  );
}