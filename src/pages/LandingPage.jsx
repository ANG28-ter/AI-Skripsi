// LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { User, AlertCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen font-sans text-white relative overflow-hidden flex justify-center items-center p-4 sm:p-8"
      style={{
        backgroundColor: "#0f1f28",
        backgroundImage: 'url("/src/assets/circuit.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="relative z-10 max-w-6xl w-full rounded-3xl bg-white/5 p-6 sm:p-8 backdrop-blur-md border border-white/10">
        {/* Header Navigation */}
        <header className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="text-white font-bold text-xl sm:text-2xl tracking-wider select-none">
            EduAI<span className="text-cyan-400">.</span>
          </div>
          <nav>
            <Link
              to="/login"
              className="bg-white/5 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-white font-semibold hover:brightness-110 transition shadow-lg"
            >
              <User size={18} />
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Left Text Section */}
          <section className="flex-1 max-w-xl text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-snug sm:leading-tight mb-6">
              Bantu kamu menyelesaikan
              <span className="bg-gradient-to-r from-white via-primary to-cyan-400 bg-clip-text text-transparent">
                {" "}
                Jurnal, Artikel,
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-primary to-cyan-400 bg-clip-text text-transparent">
                Presentasi
              </span>{" "}
              hingga{" "}
              <span className="bg-gradient-to-r from-white via-primary to-cyan-400 bg-clip-text text-transparent">
                Skripsi
              </span>
              .
            </h1>
            <p className="text-gray-400 mb-8 text-base sm:text-lg">
              EduAI adalah platform berbasis AI untuk membimbing mahasiswa
              Indonesia menyusun karya ilmiah secara efektif dan etis.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Link
                to="/skripsi"
                className="bg-white/5 text-white font-medium tracking-wide py-2.5 px-5 rounded-2xl shadow-black/10 shadow-md hover:border-white/20 hover:bg-white/10 transition duration-200 backdrop-blur-md"
              >
                Skripsi
              </Link>
              <Link
                to="/jurnal"
                className="bg-white/5 text-white font-medium tracking-wide py-2.5 px-5 rounded-2xl shadow-black/10 shadow-md hover:border-white/20 hover:bg-white/10 transition duration-200 backdrop-blur-md"
              >
                Jurnal
              </Link>
              <Link
                to="/artikel"
                className="bg-white/5 text-white font-medium tracking-wide py-2.5 px-5 rounded-2xl shadow-black/10 shadow-md hover:border-white/20 hover:bg-white/10 transition duration-200 backdrop-blur-md"
              >
                Artikel
              </Link>
              <Link
                to="/ppt"
                className="bg-white/5 text-white font-medium tracking-wide py-2.5 px-5 rounded-2xl shadow-black/10 shadow-md hover:border-white/20 hover:bg-white/10 transition duration-200 backdrop-blur-md"
              >
                PPT
              </Link>
            </div>
            {/* Warning kecil */}
                <p className="mt-3 mx-auto flex items-start gap-2 text-[10.5px] text-red-400 bg-none">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    AI dapat memberikan saran yang tidak selalu akurat. Mohon
                    verifikasi ulang sebelum digunakan.
                  </span>
                </p>
          </section>

          {/* Right Illustration Section */}
          <section className="flex-1 flex justify-center items-center">
            <div className="bg-none/5 p-4 sm:p-6">
              <img
                src="/src/assets/hero.svg"
                alt="AI Illustration"
                className="w-48 sm:w-72 md:w-[400px] h-auto object-contain"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
