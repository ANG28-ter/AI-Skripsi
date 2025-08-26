import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Pages & Components
import LandingPage from "./pages/LandingPage";
import SkripsiPage from "./pages/SkripsiPage";
import ChatDosenPembimbing from "./pages/ChatDosenPembimbing";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BackgroundGlow from "./components/BackgroundGlow";
import ScrollToTop from "./components/ScrollToTop";
import "katex/dist/katex.min.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  if (authLoading) {
    return (
      <div className="text-white h-screen flex items-center justify-center">
        <p>Memuat akun...</p>
      </div>
    );
  }

  return (
    <>
      {/* Route dengan BackgroundGlow */}
      <BackgroundGlow>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/skripsi"
            element={user ? <SkripsiPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/skripsi" replace />}
          />
          <Route
            path="/register"
            element={
              !user ? <RegisterPage /> : <Navigate to="/skripsi" replace />
            }
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/chat-dosen"
            element={
              user ? <ChatDosenPembimbing /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </BackgroundGlow>
    </>
  );
};

export default App;
