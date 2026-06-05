'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogoImg } from './LogoImg';

export default function LoginPage({ onLogin }) {
  const [un, setUn] = useState("admin");
  const [pw, setPw] = useState("Admin@123");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("login_remember");
      if (saved) {
        const d = JSON.parse(saved);
        setUn(d.un || "admin");
        setRemember(true);
      }
    } catch (e) {}
  }, []);

  const go = async () => {
    if (!un.trim() || !pw.trim()) {
      setErr("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    // Retrieve and check lockout status
    let lockoutData = {};
    try {
      lockoutData = JSON.parse(localStorage.getItem("login_lockouts") || "{}");
    } catch (e) {}

    const usernameKey = un.trim().toLowerCase();
    const userLock = lockoutData[usernameKey];

    if (userLock && userLock.lockUntil && Date.now() < userLock.lockUntil) {
      const minutesLeft = Math.ceil((userLock.lockUntil - Date.now()) / 60000);
      setErr(`Tài khoản này đang bị khóa tạm thời. Vui lòng thử lại sau ${minutesLeft} phút!`);
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: un.trim(), password: pw.trim() })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Tên đăng nhập hoặc mật khẩu không đúng!");
      }

      if (resData.authenticated && resData.user) {
        const user = resData.user;

        // Clear lockout data on successful login
        if (lockoutData[usernameKey]) {
          delete lockoutData[usernameKey];
          try {
            localStorage.setItem("login_lockouts", JSON.stringify(lockoutData));
          } catch (e) {}
        }

        if (remember) {
          try {
            sessionStorage.setItem("login_remember", JSON.stringify({ un }));
          } catch (e) {}
        } else {
          try {
            sessionStorage.removeItem("login_remember");
          } catch (e) {}
        }

        onLogin(user);
        setErr("");
      }
    } catch (e) {
      console.error(e);
      // Increment failed attempts on login failure
      const attempts = (userLock?.attempts || 0) + 1;
      if (attempts >= 5) {
        lockoutData[usernameKey] = { attempts, lockUntil: Date.now() + 15 * 60 * 1000 };
        setErr("Tài khoản đã bị khóa tạm thời 15 phút do nhập sai mật khẩu quá 5 lần!");
      } else {
        lockoutData[usernameKey] = { attempts, lockUntil: null };
        setErr(e.message || `Tên đăng nhập hoặc mật khẩu không đúng! (Lần thử thứ: ${attempts}/5)`);
      }
      try {
        localStorage.setItem("login_lockouts", JSON.stringify(lockoutData));
      } catch (errLocal) {}
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "13px 16px 13px 44px",
    background: focused === field ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
    border: focused === field ? "1.5px solid rgba(200,16,46,0.7)" : "1.5px solid rgba(255,255,255,0.13)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s",
    fontFamily: "inherit"
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#0A0F1E 0%,#0F1F3D 40%,#1a0a0a 80%,#0A0F1E 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "20px 16px"
    }}>
      {/* Decorative background circles */}
      <div style={{ position: "absolute", top: -120, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(200,16,46,0.18) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -60, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(30,58,120,0.25) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "15%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,215,0,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* Main card */}
      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 28,
        padding: "44px 40px 36px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo + Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ position: "relative" }}>
              <LogoImg size={80} />
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, background: "linear-gradient(135deg,#C8102E,#991B1B)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0A0F1E", fontSize: 11 }}>🔒</div>
            </div>
          </div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: "0 0 4px", letterSpacing: 1.5, textTransform: "uppercase" }}>QHCTV</h1>
          <div style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>QUẢN LÝ CỘNG TÁC VIÊN</div>
          <div style={{ color: "#94A3B8", fontSize: 10.5, letterSpacing: 0.5 }}>Bộ phận QLCTV - Công an Thành phố Huế</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px auto 0", justifyContent: "center" }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(200,16,46,0.5))" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8102E" }} />
            <div style={{ width: 28, height: 2, background: "#FFD700", borderRadius: 2 }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8102E" }} />
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(200,16,46,0.5),transparent)" }} />
          </div>
        </div>

        {/* Mobile Device warning */}
        {isMobileDevice && showWarning && (
          <div style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.35)",
            color: "#FBBF24",
            padding: "11px 14px",
            borderRadius: 12,
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
            position: "relative"
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <span style={{ flex: 1, paddingRight: 16 }}>Trang web hiển thị và hoạt động tốt nhất trên máy tính !</span>
            <button 
              type="button" 
              onClick={() => setShowWarning(false)} 
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#FBBF24",
                cursor: "pointer",
                fontSize: 14,
                opacity: 0.8,
                padding: "2px 6px"
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Form section title */}
        <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>— Đăng nhập hệ thống —</div>

        {/* Username field */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <label style={{ color: "#CBD5E1", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8, letterSpacing: 0.5 }}>TÊN ĐĂNG NHẬP</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", opacity: 0.6 }}>👤</span>
            <input
              value={un}
              onChange={e => setUn(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              onKeyDown={e => e.key === "Enter" && go()}
              onFocus={() => setFocused("un")}
              onBlur={() => setFocused("")}
              style={inputStyle("un")}
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password field */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={{ color: "#CBD5E1", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8, letterSpacing: 0.5 }}>MẬT KHẨU</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", opacity: 0.6 }}>🔑</span>
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Nhập mật khẩu"
              onKeyDown={e => e.key === "Enter" && go()}
              onFocus={() => setFocused("pw")}
              onBlur={() => setFocused("")}
              style={{ ...inputStyle("pw"), paddingRight: 44 }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.5)", padding: "4px", lineHeight: 1 }}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, cursor: "pointer" }} onClick={() => setRemember(p => !p)}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: remember ? "linear-gradient(135deg,#C8102E,#991B1B)" : "rgba(255,255,255,0.08)",
              border: remember ? "1.5px solid #C8102E" : "1.5px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              flexShrink: 0
            }}
          >
            {remember && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1, fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ color: "#94A3B8", fontSize: 13, userSelect: "none" }}>Ghi nhớ tên đăng nhập</span>
        </div>

        {/* Error message */}
        {err && (
          <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#FCA5A5", padding: "11px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            {err}
          </div>
        )}

        {/* Login button */}
        <button
          onClick={go}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? "rgba(100,116,139,0.5)" : "linear-gradient(135deg,#C8102E 0%,#9B1222 100%)",
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 2,
            textTransform: "uppercase",
            boxShadow: loading ? "none" : "0 8px 24px rgba(200,16,46,0.4)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontFamily: "inherit"
          }}
        >
          {loading ? (
            <>
              <span style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>⏳</span>
              Đang xác thực...
            </>
          ) : (
            <>
              <span style={{ fontSize: 16 }}>🔐</span>
              Đăng nhập
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 24, position: "relative", zIndex: 1 }}>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 4 }}>
          © 2026 QHCTV · Hệ thống quản lý Cộng tác viên · Phiên bản v1.0.1
        </div>
        <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 10.5, fontStyle: "italic", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span>✦</span>
          <span>Phòng Cảnh sát Hình sự - Công an Tỉnh Thừa Thiên Huế</span>
          <span>✦</span>
        </div>
      </div>
    </div>
  );
}
