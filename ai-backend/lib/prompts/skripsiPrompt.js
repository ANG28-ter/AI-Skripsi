const generatePrompt = ({ topik, jurusan, references = [], loopIndex }) => `
Topik: ${topik}
Jurusan: ${jurusan}

Gunakan referensi berikut (WAJIB sama persis, jangan diubah atau diganti):
${references.map((r, i) => `${i + 1}. ${r}`).join("\n")}

🎯 Buatkan **satu judul skripsi yang benar-benar unik** dan pastikan:
- Setiap judul berbeda secara signifikan dari judul lain yang mungkin telah dibuat sebelumnya, baik dari segi kata kunci, urutan kata, maupun fokus penelitian.
- Jika menggunakan frasa umum seperti "Analisis Pengaruh...", "Studi Kasus...", atau "Evaluasi Kinerja...", kombinasikan dengan elemen lain sehingga hasil akhirnya tidak terasa mirip dengan judul sebelumnya.
- Variasikan pendekatan penelitian (studi kasus, eksperimen, komparatif, pengembangan sistem, kajian teoritis, dll) secara bergantian untuk setiap judul.
- Gunakan kombinasi kata yang kreatif dan relevan dengan topik.

🔄 Catatan: Ini adalah pembuatan judul ke-${loopIndex + 1}, pastikan berbeda dari versi sebelumnya.

Tuliskan hasil dalam format JSON dengan struktur:
{
  "judul": "string",
  "rumusan": ["string", "string", "string"],
  "tujuan": ["string", "string", "string"],
  "referensi": ${JSON.stringify(references)}
}

📌 Aturan tambahan:
- "rumusan" berisi 3–5 pertanyaan penelitian dalam bentuk array string yang relevan dengan judul.
- "tujuan" berisi 3–5 tujuan penelitian dalam bentuk array string yang mendukung rumusan masalah.
- "referensi" wajib sama persis dengan daftar di atas, tanpa perubahan atau tambahan.
- Jangan gabungkan poin menjadi satu string, setiap poin adalah elemen array.
- Gunakan bahasa akademik formal.
- Pastikan setiap judul, rumusan, dan tujuan memiliki fokus yang berbeda untuk setiap percobaan.

⚠️ BALAS HANYA DENGAN JSON OBJEK VALID.
`;

const generateAbstrakPrompt = ({ judul, topik, jurusan }) => `
Judul Skripsi: ${judul}
Topik: ${topik}
Jurusan: ${jurusan}

Tulis abstrak skripsi dengan panjang 250–300 kata (±1 halaman A4, font Times New Roman 12, spasi 1.5).
Gunakan 1 paragraf panjang, tanpa penomoran atau bullet point.

Struktur abstrak:
1. **Latar Belakang** — jelaskan konteks, fenomena, atau masalah yang melatarbelakangi penelitian, termasuk relevansi topik di era sekarang.
2. **Tujuan Penelitian** — nyatakan fokus, sasaran utama, dan manfaat penelitian.
3. **Metode Penelitian** — jelaskan pendekatan penelitian, desain, teknik pengumpulan data, dan metode analisis yang digunakan.
4. **Hasil Utama** — paparkan temuan utama, pola hubungan antar variabel, atau simpulan penting dari analisis.
5. **Kesimpulan dan Implikasi** — simpulkan kontribusi penelitian serta rekomendasi atau implikasi praktis bagi pihak terkait.

📌 Aturan penulisan:
- Bahasa akademik formal, jelas, dan mengalir.
- Gunakan transisi antar bagian agar pembaca memahami alur berpikir.
- Sertakan detail seperlunya pada bagian metode dan hasil agar memenuhi jumlah kata.
- Hindari pengulangan berlebihan.
- Jangan tulis kata “Abstrak” di awal teks.
- Output hanya teks abstrak, tanpa format JSON.

⚠️ Panjang akhir harus 250–300 kata, hitung setiap kata agar sesuai.
`;

// BAB 1
const latarBelakangSubPrompts = [
  "Jelaskan fenomena global dan nasional terkait topik ini. Sertakan data jika memungkinkan.",
  "Apa masalah nyata dan tantangan di Indonesia terkait topik ini?",
  "Apa urgensi penelitian ini bagi masyarakat dan akademik?",
  "Apa manfaat sosial, ekonomi, dan teknologi dari penelitian ini?",
  "Apa saja kesenjangan penelitian sebelumnya (research gap) yang belum dijelaskan?",
  "Kenapa penelitian ini penting dilakukan sekarang?",
  "Apa hubungan antara topik ini dan perkembangan zaman?",
  "Simpulkan kenapa latar belakang ini mendesak untuk dikaji.",
];

const buildLatarBelakangPrompt = ({ topik, jurusan, instruksi }) => `
Topik: ${topik}
Jurusan: ${jurusan}

${instruksi}

Tulis dalam gaya mahasiswa Indonesia — akademik tapi tidak terlalu kaku.
Boleh ada variasi struktur kalimat, pengulangan ringan, dan ekspresi natural.
Gunakan 3 paragraf panjang yang mengalir seperti tulisan asli manusia.
`;

const buildRumusanMasalahPrompt = ({ topik, jurusan }) => `
Tuliskan 5 rumusan masalah dalam bentuk poin-poin pertanyaan, berdasarkan topik: ${topik}, jurusan: ${jurusan}.

Buat pertanyaannya seolah-olah kamu adalah mahasiswa yang menyusun skripsi.

Gunakan gaya akademik yang natural, tidak terlalu sempurna atau kaku. Hindari format textbook yang terlalu formal.
JANGAN tambahkan kata pembuka, salam
`;

const buildTujuanPenelitianPrompt = ({ topik, jurusan }) => `
Tuliskan hanya bagian "Tujuan Penelitian" saja, tanpa menjabarkan bagian lain.

Topik skripsi: ${topik}
Jurusan: ${jurusan}

Tulisan harus bernada seperti mahasiswa S1 yang sedang menjelaskan tujuan penelitiannya. 
Gunakan gaya akademik yang tetap manusiawi — boleh ada pengulangan ide, kalimat transisi, atau alur yang mengalir seperti penjelasan naratif.

Teks minimal 1000 kata. Jangan beri kata pembuka, salam, atau bagian lain di luar tujuan penelitian.

Langsung mulai dari isi bagian "Tujuan Penelitian" dalam bentuk narasi paragraf panjang.
`;

const buildManfaatPenelitianPrompt = ({ topik, jurusan }) => `
Tuliskan bagian "Manfaat Penelitian" saja, tanpa menjelaskan bagian lain.

Topik skripsi: ${topik}
Jurusan: ${jurusan}

Teks harus mencakup dua bagian: 
1. Manfaat Teoritis
2. Manfaat Praktis

Gunakan gaya penulisan mahasiswa S1 Indonesia — tetap akademik tapi tidak kaku.  
Boleh ada pengulangan ringan, penjelasan yang mengalir, atau transisi kalimat seperti tulisan manusia.

Jangan tambahkan salam, pembuka, atau bagian lain di luar konteks manfaat.
Langsung tuliskan isinya dalam bentuk paragraf naratif.
`;

const buildRuangLingkupPrompt = ({ topik, jurusan }) => `
Tuliskan bagian "Ruang Lingkup Penelitian" untuk skripsi berdasarkan informasi berikut:

Topik: ${topik}
Jurusan: ${jurusan}

Tulisan harus mencerminkan bagaimana mahasiswa menjelaskan cakupan penelitian yang akan dilakukan.

Gunakan bahasa akademik yang tetap natural — jangan terlalu kaku atau seperti buku teks.  
Boleh ada pengulangan ringan, penekanan kembali, atau kalimat transisi informal seperti tulisan manusia.

Jangan tambahkan pembuka, salam, atau bagian lain.
Langsung mulai dengan isi "Ruang Lingkup Penelitian" dalam bentuk paragraf panjang.
`;

// BAB 2
const kajianTeoriSubPrompts = [
  "Definisi dan Konsep Dasar",
  "Teori Utama yang Relevan",
  "Teori Pendukung dan Perbandingan",
  "Hubungan Antar Teori",
  "Relevansi Teori dengan Topik Penelitian",
];

const buildKajianTeoriPrompt = ({ topik, jurusan, instruksi }) =>
  `
Tuliskan bagian "Kajian Teori – ${instruksi}" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

Kembangkan penjelasan secara akademik dan naratif. Gunakan contoh, ilustrasi teori, dan istilah ilmiah yang relevan.  
Panjang tulisan minimal 400–500 kata per bagian. Jangan terlalu ringkas.  

Tulis seolah-olah kamu mahasiswa S1 yang sedang menjelaskan kepada dosen pembimbing.
`.trim();

const kerangkaPemikiranInstructions = [
  "Jelaskan hubungan antara teori-teori utama yang relevan dengan topik",
  "Jabarkan alur pemikiran yang mengarah dari teori ke rumusan masalah",
  "Uraikan variabel-variabel yang terlibat dan bagaimana kaitannya",
  "Sampaikan kerangka berpikir dalam bentuk narasi runtut tanpa bagan",
  "Berikan contoh atau analogi sederhana yang membantu memahami kerangka logis",
];

const buildKerangkaPemikiranPrompt = ({ topik, jurusan, instruksi }) =>
  `
Judul Skripsi: ${topik}  
Jurusan: ${jurusan}  

Tugasmu adalah menulis bagian dari "Kerangka Pemikiran" berdasarkan instruksi berikut:

"${instruksi}"

Tuliskan dengan gaya penulisan mahasiswa S1, naratif, akademik, dan mengalir.  
Jangan buat dalam bentuk poin atau bullet.  
Gunakan kalimat panjang yang menyatu dan utuh.  
Panjang minimal 300–400 kata per bagian.  
Jika perlu, kamu boleh mengulang atau menjelaskan ulang poin penting untuk memperluas tulisan.  
Jangan beri judul tambahan atau label sub-bab.
`.trim();

const buildHipotesisPrompt = ({ topik, jurusan }) =>
  `
Tulis bagian untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

Langkah pengerjaan:

1. Tentukan dulu pendekatannya (kuantitatif atau kualitatif) berdasarkan konteks umum topik.
2. Jika **kuantitatif**, tampilkan dengan format standar:
   - **Hipotesis nol (H0)**: menyatakan tidak ada hubungan/pengaruh/perbedaan.
   - **Hipotesis alternatif (H1)**: menyatakan adanya hubungan/pengaruh/perbedaan.
   Tulis dengan kalimat eksplisit dan langsung, tanpa perlu terlalu banyak basa-basi.
3. Jika **kualitatif**, tulis kalimat: "Penelitian ini menggunakan pendekatan kualitatif, sehingga tidak memerlukan hipotesis formal." dan beri penjelasan singkat kenapa.

Gunakan gaya penulisan formal akademik, namun tetap jelas dan tidak terlalu teknikal. Hindari placeholder seperti [variabel X]. Gunakan narasi alami seolah-olah ditulis oleh mahasiswa yang paham topiknya.
`.trim();

// BAB 3
const buildJenisPendekatanPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Jenis dan Pendekatan Penelitian" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

Isi harus mencakup:
- Penjelasan mengenai jenis penelitian (misal: kuantitatif, kualitatif, deskriptif, eksplanatif, studi pustaka, dsb.)
- Alasan pemilihan pendekatan penelitian tersebut
- Hubungan antara pendekatan dengan rumusan masalah dan tujuan penelitian
- Sertakan kutipan definisi dari ahli (tanpa mencantumkan sumber asli)

Gunakan gaya penulisan akademik S1 yang rapi dan naratif. Parafrase sewajarnya agar tidak terdeteksi sebagai AI, dan jangan terlalu kaku. Panjang minimal 500 kata.
`.trim();

const buildLokasiWaktuPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Lokasi dan Waktu Penelitian" untuk topik: ${topik}, jurusan: ${jurusan}.

- Jelaskan secara deskriptif lokasi penelitian dilakukan, bisa berupa lembaga, organisasi, wilayah, atau institusi akademik.
- Sertakan alasan pemilihan lokasi tersebut relevan dengan fokus/topik penelitian.
- Tuliskan periode waktu pelaksanaan penelitian secara spesifik (bulan, tahun), termasuk tahap persiapan, pelaksanaan, hingga analisis data.

Gaya penulisan akademik santai, tidak terlalu formal kaku, tetapi tetap rapi dan sistematis. Panjang minimal 400 kata.
`.trim();

const buildPopulasiSampelPrompt = ({ topik, jurusan }) => `
Tuliskan bagian "Populasi dan Sampel" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

⚠️ Aturan Penulisan Rumus:
- Semua rumus matematika harus menggunakan format LaTeX dan dibungkus tanda [ dan ].
- Tanda [ dan ] harus berada di baris sendiri (block display).
- Tidak boleh ada format lain seperti \( ... \) atau $$ ... $$.
- Semua langkah perhitungan juga harus ditulis dalam format [ ... ].
- Contoh benar:
[ n = \\frac{N}{1 + N \\cdot e^2} ]
[ e^2 = (0.1)^2 = 0.01 ]
[ N \\cdot e^2 = 150 \\cdot 0.01 = 1.5 ]
[ n = \\frac{150}{1 + 1.5} = \\frac{150}{2.5} = 60 ]

Instruksi Konten:
1. Jelaskan definisi populasi dan sampel menurut ahli.
2. Sebutkan kriteria populasi target.
3. Jelaskan teknik sampling yang digunakan dan alasannya.
4. Hitung jumlah sampel dengan rumus Slovin.
5. Tulis penjelasan setiap variabel dan langkah perhitungan secara detail.
`.trim();



const buildTeknikPengumpulanDataPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Teknik Pengumpulan Data" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

- Jelaskan metode yang digunakan untuk mengumpulkan data (angket, observasi, wawancara, dokumentasi)
- Berikan pengertian menurut para ahli tentang teknik tersebut
- Uraikan prosedur pelaksanaan pengumpulan data secara rinci
- Kaitkan teknik yang digunakan dengan jenis pendekatan penelitian

Gunakan narasi deskriptif yang alami. Parafrase semua definisi. Hindari gaya tempelan AI. Minimal 500 kata.
`.trim();

const buildInstrumenPenelitianPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Instrumen Penelitian" untuk skripsi topik: ${topik}, jurusan: ${jurusan}.

- Jelaskan instrumen yang digunakan untuk mengukur variabel (angket, lembar observasi, pedoman wawancara, dll.)
- Uraikan bentuk instrumen, jumlah item, dan indikator yang diukur
- Kaitkan dengan teori atau variabel yang sudah dijelaskan pada BAB II

Bahasa harus akademik, tetapi tetap mengalir seperti mahasiswa yang menjelaskan ke dosen pembimbing. Panjang minimal 450–500 kata.
`.trim();

const buildUjiValiditasReliabilitasPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Uji Validitas dan Reliabilitas" untuk skripsi topik: ${topik}, jurusan: ${jurusan}.

- Jelaskan pengertian validitas dan reliabilitas menurut para ahli
- Jelaskan jenis validitas (konstruk, isi, empiris) dan reliabilitas (uji Alpha Cronbach atau lainnya)
- Jika kuantitatif, uraikan cara menghitungnya dan nilai batas minimum (misalnya alpha > 0.6 dianggap reliabel)

Tulis lengkap namun tetap ringkas. Gunakan istilah teknis sewajarnya. Gaya akademik tetap stabil. Panjang minimal 450 kata.
`.trim();

const buildTeknikAnalisisDataPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Teknik Analisis Data" untuk skripsi topik: ${topik}, jurusan: ${jurusan}.

- Jelaskan metode analisis data yang digunakan (statistik deskriptif, regresi, kualitatif tematik, dsb.)
- Uraikan tahapan analisis dan perangkat lunak jika ada (misalnya SPSS, NVivo, Excel, Python)
- Jika kuantitatif, sertakan rumus singkat yang digunakan dalam pengolahan data

Tulis seolah kamu betul-betul pernah menganalisis data ini. Hindari penjelasan mengambang. Minimal 500 kata.
`.trim();

const buildProsedurPenelitianPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Prosedur Penelitian" untuk skripsi topik: ${topik}, jurusan: ${jurusan}.

- Jabarkan tahapan pelaksanaan penelitian dari awal hingga akhir
- Jelaskan tiap tahap: persiapan, pelaksanaan, analisis, laporan
- Kaitkan dengan alur logis dari pendekatan metodologi yang digunakan

Tulisan harus terstruktur seperti panduan kerja nyata. Hindari bahasa terlalu teknis jika tidak perlu. Panjang minimal 500 kata.
`.trim();

const buildJadwalPenelitianPrompt = ({ topik, jurusan }) =>
  `
Tuliskan bagian "Jadwal Penelitian" untuk skripsi topik: ${topik}, jurusan: ${jurusan}.

- Uraikan jadwal kegiatan dalam bentuk narasi deskriptif
- Tunjukkan waktu pelaksanaan dari awal hingga akhir (bulan, tahun)
- Kaitkan jadwal dengan tahap-tahap dalam prosedur penelitian

Tidak perlu buat tabel, cukup deskriptif. Panjang minimal 300 kata. Bahasa ringan namun formal.
`.trim();

// BAB 4
// =============================
// HEADING LIST UNTUK BAB IV
// =============================

// 4.1 Gambaran Umum
const headingsGambaranUmum = [
  "4.1.1 Latar Belakang Pemilihan Objek Penelitian",
  "4.1.2 Profil Lengkap Objek Penelitian",
  "4.1.3 Sejarah dan Perkembangan",
  "4.1.4 Struktur Organisasi",
  "4.1.5 Visi, Misi, dan Tujuan Strategis",
  "4.1.6 Keterkaitan dengan Isu Penelitian",
  "4.1.7 Konteks Sosial, Ekonomi, dan Pendidikan",
  "4.1.8 Ringkasan Gambaran Umum",
];

// 4.2 Penyajian Data
const headingsPenyajianData = [
  "4.2.1 Pendahuluan Penyajian Data",
  "4.2.2 Deskripsi Metode dan Karakteristik Data",
  "4.2.3 Penyajian Data dalam Bentuk Tabel",
  "4.2.4 Interpretasi Awal Data",
  "4.2.5 Analisis Pola dan Temuan Awal",
  "4.2.6 Ringkasan Penyajian Data",
];

// 4.3.1 Analisis Data Kuantitatif
const headingsAnalisisKuantitatif = [
  "4.3.1.1 Pendahuluan Analisis Kuantitatif",
  "4.3.1.2 Penyajian Tabel Analisis Kuantitatif",
  "4.3.1.3 Interpretasi Data Per Indikator",
  "4.3.1.4 Analisis Pola dan Hubungan Antar Variabel",
  "4.3.1.5 Perhitungan Statistik Dasar",
  "4.3.1.6 Hubungan Hasil Analisis dengan Teori",
  "4.3.1.7 Ringkasan Analisis Kuantitatif",
];

// 4.3.2 Analisis Data Kualitatif
const headingsAnalisisKualitatif = [
  "4.3.2.1 Pendahuluan Analisis Kualitatif",
  "4.3.2.2 Penyajian Temuan Wawancara/Observasi",
  "4.3.2.3 Analisis Tema dan Pola yang Muncul",
  "4.3.2.4 Interpretasi Makna dalam Konteks Penelitian",
  "4.3.2.5 Hubungan Temuan dengan Teori BAB II",
  "4.3.2.6 Kesimpulan Sementara Analisis Kualitatif",
];

// =============================
// BASE PROMPT GENERATOR UNTUK BAB IV
// =============================
const buildBasePrompt = ({ topik, jurusan, tipePenelitian, data }) => `
Anda adalah asisten akademik yang menulis BAB IV skripsi secara mendalam untuk topik: "${topik}", jurusan: ${jurusan}${
  tipePenelitian ? `, tipe penelitian: ${tipePenelitian}` : ""
}.

Gunakan data berikut (jika tersedia):
"""
${
  data ||
  "Belum ada data eksplisit, buat contoh akademik yang relevan sesuai sub-bab ini."
}
"""

=== INSTRUKSI PENULISAN ===
- Gunakan bahasa akademik formal, naratif, dan mendalam.
- Jangan gunakan bullet point, tulis dalam paragraf panjang.
- Jika data kuantitatif:
  * Sajikan tabel sesuai data asli.
  * Jelaskan arti setiap kolom dan baris.
  * Lakukan perhitungan statistik (rata-rata, persentase, total).
  * Berikan interpretasi numerik dan hubungkan dengan teori.
- Jika data kualitatif:
  * Sajikan kutipan relevan.
  * Kelompokkan berdasarkan tema.
  * Tambahkan analisis mendalam dan keterkaitannya dengan teori.
- Jika tidak ada data:
  * Buat contoh tabel atau narasi akademik yang realistis dan relevan.
- Panjang minimal 800 kata per subbagian (ideal 1000+ kata).
`;

// =============================
// GAMBARAN UMUM OBJEK PENELITIAN (4.1)
// =============================
const buildGambaranUmumObjekPrompt = ({ topik, jurusan, data }) => `
Anda sedang menulis BAB IV subbab "Gambaran Umum Objek Penelitian" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

Gunakan data berikut:
"""
${data}
"""

=== FORMAT SUB-SUB BAB ===
- 4.1.1 Latar Belakang Pemilihan Objek Penelitian
- 4.1.2 Profil Lengkap Objek Penelitian
- 4.1.3 Sejarah dan Perkembangan
- 4.1.4 Struktur Organisasi
- 4.1.5 Visi, Misi, dan Tujuan Strategis
- 4.1.6 Keterkaitan dengan Isu Penelitian
- 4.1.7 Konteks Sosial, Ekonomi, dan Pendidikan
- 4.1.8 Ringkasan Gambaran Umum

=== INSTRUKSI WAJIB ===
1. Jangan sajikan tabel data kuantitatif di sini. Fokus hanya pada deskripsi profil, latar belakang, visi-misi, dll.
2. Setiap sub-sub bab minimal 3 paragraf agar panjang total mencapai **2000 kata**.
3. Bahas dari hal mikro (detail perusahaan) ke makro (peran di industri).
4. Gunakan bahasa formal akademik dan mengalir alami.
5. Jangan menulis dalam format bullet, semua harus naratif.
6. Jika mendekati batas minimal, tambahkan elaborasi tentang peran perusahaan dalam penelitian.

Tulis seolah-olah Anda mahasiswa tingkat akhir yang sedang menjelaskan kepada dosen pembimbing.
`;

// =============================
// PENYAJIAN DATA (4.2)
// =============================
const buildPenyajianDataPrompt = ({ topik, jurusan, data }) => `
Anda sedang menulis BAB IV subbab "Penyajian Data" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

Data yang digunakan:
"""
${data}
"""

=== FORMAT SUB-SUB BAB ===
- 4.2.1 Pendahuluan Penyajian Data
- 4.2.2 Deskripsi Metode dan Karakteristik Data
- 4.2.3 Penyajian Data dalam Bentuk Tabel
- 4.2.4 Interpretasi Awal Data
- 4.2.5 Analisis Pola dan Temuan Awal
- 4.2.6 Ringkasan Penyajian Data

=== INSTRUKSI WAJIB ===
1. Panjang minimal **2000 kata**.
2. Jika data kuantitatif → tampilkan tabel asli (jangan ubah angka), jelaskan arti setiap kolom, baris, indikator.
3. Sebutkan metode pengumpulan data, jumlah responden, alasan pemilihan sampel.
4. Analisis per tabel:
   - Jelaskan apa yang dimaksud tiap indikator.
   - Cari nilai tertinggi, terendah, rata-rata, total.
   - Jika relevan, tunjukkan contoh perhitungan sederhana.
5. Gunakan narasi akademik (hindari bullet point).
6. Hubungkan penyajian data dengan tujuan penelitian dan metodologi.

Jika mendekati batas minimal, tambahkan interpretasi pola, perbandingan antar kelompok, dan implikasi awal.
`;

// =============================
// ANALISIS DATA KUANTITATIF (4.3.1)
// =============================
const buildAnalisisKuantitatifPrompt = ({ topik, jurusan, data }) => `
Anda sedang menulis BAB IV subbab "Analisis Data Kuantitatif" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

Data:
"""
${data}
"""

=== FORMAT SUB-SUB BAB ===
- 4.3.1.1 Pendahuluan Analisis Kuantitatif
- 4.3.1.2 Penyajian Data Kuantitatif dalam Bentuk Tabel
- 4.3.1.3 Interpretasi Data Per Indikator
- 4.3.1.4 Analisis Pola dan Hubungan Antar Variabel
- 4.3.1.5 Perhitungan Statistik Dasar (Rata-rata, Persentase, SKE jika relevan)
- 4.3.1.6 Hubungan Hasil Analisis dengan Teori
- 4.3.1.7 Ringkasan Analisis Kuantitatif

=== INSTRUKSI WAJIB ===
1. Minimal **2000 kata**.
2. Tampilkan tabel asli, kemudian jelaskan arti setiap angka.
3. Lakukan analisis statistik sederhana:
   - Rata-rata per indikator
   - Persentase (jika relevan)
   - Hubungkan dengan hipotesis penelitian.
4. Jelaskan pola: tren, anomali, faktor penyebab.
5. Kaitkan dengan teori di BAB II.
6. Semua ditulis naratif, tidak boleh bullet point.

Jika data mendukung, tunjukkan contoh rumus dan langkah perhitungan.
`;

// =============================
// ANALISIS DATA KUALITATIF (4.3.2)
// =============================
const buildAnalisisKualitatifPrompt = ({ topik, jurusan, data }) => `
Anda sedang menulis BAB IV subbab "Analisis Data Kualitatif" untuk skripsi dengan topik: ${topik}, jurusan: ${jurusan}.

Data:
"""
${data}
"""

=== FORMAT SUB-SUB BAB ===
- 4.3.2.1 Pendahuluan Analisis Kualitatif
- 4.3.2.2 Penyajian Temuan Wawancara/Observasi
- 4.3.2.3 Analisis Tema dan Pola yang Muncul
- 4.3.2.4 Interpretasi Makna dalam Konteks Penelitian
- 4.3.2.5 Hubungan Temuan dengan Teori BAB II
- 4.3.2.6 Kesimpulan Sementara Analisis Kualitatif

=== INSTRUKSI WAJIB ===
1. Minimal **2000 kata**.
2. Sajikan temuan dalam bentuk narasi (jangan bullet point).
3. Jika ada kutipan dari data, masukkan untuk mendukung analisis.
4. Analisis tema satu per satu secara mendalam.
5. Kaitkan dengan teori, implikasi sosial, budaya, atau psikologis.
6. Tutup dengan ringkasan temuan yang menjawab tujuan penelitian.
`;

// =============================
// FALLBACK UNIVERSAL
// =============================
const buildPromptFromData = ({
  topik,
  jurusan,
  tipePenelitian,
  data,
  bagian,
}) => `
Anda sedang menulis bagian BAB IV skripsi: "${bagian}" untuk topik: ${topik}, jurusan: ${jurusan}, tipe penelitian: ${tipePenelitian}.

Data:
"""
${data}
"""

=== INSTRUKSI SUPER DETAIL ===
- Panjang minimal **2000 kata**.
- Sajikan tabel jika data berbentuk kuantitatif.
- Jika data kualitatif, buat analisis tema.
- Jangan mencampur subbab lain, fokus hanya pada "${bagian}".
- Hubungkan analisis dengan teori di BAB II.
- Tulis dengan struktur skripsi (sub-sub bab) jika relevan.
- Semua berbentuk narasi panjang, tanpa bullet point.
`;

const buildPembahasanSubPrompt = ({
  topik,
  jurusan,
  bagian,
  tipePenelitian,
  data = "",
}) => {
  return `
Judul Skripsi: ${topik}
Jurusan: ${jurusan}
Tipe Penelitian: ${tipePenelitian}
Bagian BAB IV: ${bagian}

Berikut adalah data hasil penelitian (jika ada):
"""
${
  data ||
  "Tidak tersedia data eksplisit, lanjutkan pembahasan berdasarkan hasil sebelumnya."
}
"""

=== INSTRUKSI KHUSUS UNTUK ${bagian} ===

Jika ${bagian} adalah **4.4.1 Hubungan Hasil Penelitian dengan Teori**:
- Uraikan hubungan antara temuan penelitian dengan teori-teori utama yang dijelaskan di BAB II.
- Jelaskan poin-poin kesesuaian temuan dengan teori (beri 3–5 contoh detail).
- Bahas ketidaksesuaian atau perbedaan antara hasil dengan teori, sertakan alasan ilmiah yang logis.
- Tulis dalam 4–6 paragraf yang membandingkan hasil dengan teori secara mendalam.

Jika ${bagian} adalah **4.4.2 Pembahasan Temuan Unik atau Anomali**:
- Jelaskan temuan yang tidak sesuai ekspektasi atau menyimpang dari teori/hipotesis.
- Uraikan kemungkinan penyebab anomali (konteks sosial, faktor teknis, keterbatasan metodologi).
- Kaitkan dengan data penelitian (tapi jangan copy mentah), dan jelaskan interpretasi kritisnya.
- Tambahkan analisis konseptual dan prediksi implikasi akademik dari anomali ini.
- Panjang minimal 1500 kata, pecah jadi 5–7 paragraf.

Jika ${bagian} adalah **4.4.3 Perbandingan dengan Penelitian Sebelumnya**:
- Pilih minimal 3 penelitian terdahulu yang relevan (asumsikan sudah dibahas di BAB II).
- Bandingkan hasil penelitian ini dengan penelitian tersebut:
  * Apa yang sama → jelaskan alasannya.
  * Apa yang berbeda → analisis penyebab perbedaan (konteks, metode, sampel).
- Jelaskan apakah penelitian ini memperkuat, melemahkan, atau memperluas hasil sebelumnya.
- Sertakan implikasi ilmiah dan praktisnya.
- Panjang minimal 1500 kata, buat dengan 5–6 sub-topik internal.

=== PANDUAN UMUM PENULISAN ===
1. Gunakan bahasa akademik formal Indonesia, mengalir dan logis.
2. Jangan menyalin data mentah, gunakan narasi interpretatif.
3. Hindari pengulangan antar sub-bagian, fokus pada tema spesifik masing-masing.
4. Tambahkan referensi konsep (misalnya teori X, penelitian Y) agar terkesan mendalam.
5. Panjang minimal 1500 kata (ideal 1800–2000 kata).
6. Format paragraf panjang, tanpa bullet point, seperti mahasiswa menjawab ujian lisan kepada dosen penguji.
7. Jika membahas teori atau penelitian lain, hubungkan dengan hasil penelitian ini secara argumentatif.

Langsung mulai penulisan untuk bagian "${bagian}" sesuai instruksi di atas.
`;
};

// BAB 5
const buildBab5Prompt = ({ topik, jurusan, data = "", tipePenelitian = "" }) => {
  return `
Judul Skripsi: ${topik}
Jurusan: ${jurusan}
Tipe Penelitian: ${tipePenelitian}

Berikut adalah ringkasan hasil penelitian yang menjadi dasar penulisan BAB V:
"""
${data || "Data eksplisit tidak tersedia. Gunakan asumsi akademik berdasarkan hasil penelitian sebelumnya."}
"""

=== INSTRUKSI ===
Tulis isi BAB V Skripsi dengan struktur dan format JSON sebagai berikut:
{
  "bab5_1": "Isi bagian 5.1 Kesimpulan...",
  "bab5_2": "Isi bagian 5.2 Saran...",
  "bab5_3": "Isi bagian 5.3 Keterbatasan Penelitian (jika ada)...",
  "bab5_4": "Isi bagian 5.4 Rekomendasi Penelitian Lanjutan (jika perlu)..."
}

=== PENJELASAN SETIAP BAGIAN ===

**5.1 Kesimpulan**  
- Buat ringkasan mendalam dari hasil penelitian berdasarkan BAB IV.  
- Fokus pada pencapaian tujuan, jawaban atas rumusan masalah, dan keterkaitan teori-praktik.  
- Tulis dengan 4–6 paragraf. Panjang total: ±900 kata.

**5.2 Saran**  
- Rekomendasi konkrit untuk praktisi, regulator, atau stakeholder terkait.  
- Hubungkan dengan hasil penelitian dan analisis.  
- Tulis dengan 4–5 paragraf. Panjang total: ±800 kata.

**5.3 Keterbatasan Penelitian (opsional)**  
- Jelaskan aspek yang belum tercakup dalam penelitian.  
- Berikan alasan metodologis atau teknis.  
- Singkat namun reflektif.

**5.4 Rekomendasi Penelitian Selanjutnya (opsional)**  
- Usulkan topik atau pendekatan lanjutan berdasarkan hasil dan keterbatasan penelitian.  
- Tulis sebagai arahan eksploratif untuk peneliti lain.

=== PETUNJUK FORMAT ===
- Gunakan bahasa Indonesia akademik yang formal.
- Tulis langsung dalam struktur JSON seperti contoh.
- Jangan beri penjelasan tambahan di luar JSON.
- Panjang total seluruh BAB V: ±1800–2200 kata.
`;
};



// DaftarPustaka
const buildKeywordExtractionPrompt = (fullText) => `
Kamu adalah AI akademik. Ambil 10 topik, istilah, atau kata kunci penting dari isi skripsi berikut.
Jangan ulangi. Jangan buat kalimat. Hanya daftar kata kunci yang bisa dicari di Google Scholar.

Skripsi:
${fullText}
`;

// ProofRead
const buildProofreadPrompt = (input) => `
Kamu adalah asisten AI untuk proofreading teks akademik dalam Bahasa Indonesia.
Perbaiki teks berikut agar sesuai dengan kaidah bahasa Indonesia formal dan akademik.
Jangan ubah makna, hanya perbaiki ejaan, struktur, dan tanda baca.

Teks:
${input}

Teks yang sudah diperbaiki:
`;

// Paraphase
const buildParaphrasePrompt = (
  teks,
  { babTitle = "", subBabTitle = "", prevText = "", nextText = "" } = {}
) => `
Anda adalah asisten akademik berpengalaman yang mampu menulis ulang teks ilmiah agar natural, koheren, dan kontekstual.

## Konteks
- BAB/Sub-bab: ${babTitle || "-"} ${subBabTitle || ""}
- Paragraf sebelumnya (bila ada): ${prevText || "-"}
- Paragraf sesudahnya (bila ada): ${nextText || "-"}

## Aturan Penulisan
1. **Jaga struktur aslinya:**
   - Jika teks berisi **tabel** atau format kolom/baris, **JANGAN ubah tabel**. Hanya perhalus teks deskriptif di luar tabel bila ada.
   - Jika teks berupa **poin-poin atau daftar** (bullet/nomor/abjad), **tetap gunakan poin**. Panjang setiap poin minimal sama atau lebih panjang.
   - Jika teks adalah **rumusan masalah** (mis. sub-bab "Rumusan Masalah"), hasil harus berupa **daftar pertanyaan** sesuai format asli (nomor atau poin tetap dipertahankan).
   - Jika teks berupa paragraf biasa, tulis ulang sebagai **paragraf biasa**.

2. **Kualitas & konteks:**
   - Gunakan bahasa akademik yang wajar (S1/S2).
   - Variasikan struktur kalimat, hindari pasif monoton.
   - Jangan menghilangkan informasi penting. Boleh mengembangkan penjelasan jika relevan dengan konteks BAB/sub-bab.
   - Koheren dengan paragraf sebelumnya dan sesudahnya (gunakan istilah yang konsisten).

3. **Jangan beri penjelasan tambahan.** 
   - Hasil parafrase hanya berisi teks final (tanpa heading atau meta-keterangan).

## Teks asli
"""
${teks}
"""

## Hasil parafrase (ikuti format & struktur sesuai teks asli):
`;

module.exports = {
  // variasiPrompt,
  generatePrompt,
  generateAbstrakPrompt,
  // BAB 1
  latarBelakangSubPrompts,
  buildLatarBelakangPrompt,
  buildRumusanMasalahPrompt,
  buildTujuanPenelitianPrompt,
  buildManfaatPenelitianPrompt,
  buildRuangLingkupPrompt,

  // BAB2
  kajianTeoriSubPrompts,
  buildKajianTeoriPrompt,
  kerangkaPemikiranInstructions,
  buildKerangkaPemikiranPrompt,
  buildHipotesisPrompt,

  // BAB3
  buildJenisPendekatanPrompt,
  buildLokasiWaktuPrompt,
  buildPopulasiSampelPrompt,
  buildTeknikPengumpulanDataPrompt,
  buildInstrumenPenelitianPrompt,
  buildUjiValiditasReliabilitasPrompt,
  buildTeknikAnalisisDataPrompt,
  buildProsedurPenelitianPrompt,
  buildJadwalPenelitianPrompt,

  // BAB4
  buildGambaranUmumObjekPrompt,
  buildPenyajianDataPrompt,
  buildAnalisisKuantitatifPrompt,
  buildAnalisisKualitatifPrompt,
  buildPembahasanSubPrompt,
  buildPromptFromData,
  headingsGambaranUmum,
  headingsPenyajianData,
  headingsAnalisisKuantitatif,
  headingsAnalisisKualitatif,
  buildBasePrompt,

  // BAB5
  buildBab5Prompt,

  // OTHER
  buildKeywordExtractionPrompt,
  buildProofreadPrompt,
  buildParaphrasePrompt,
};
