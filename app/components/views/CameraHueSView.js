"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Modal, FormField, compressImage, exportToPrint, exportToWord, UserAvatar, getShortName, RankBadge } from '@/app/components/shared';

const inputSt = { 
  width: "100%", 
  padding: "9px 12px", 
  border: "1px solid #D1D5DB", 
  borderRadius: 8, 
  fontSize: 14, 
  outline: "none", 
  boxSizing: "border-box" 
};
const selectSt = { ...inputSt, background: "#fff" };

export default function CameraHueSView({ data, users, currentUser, addLog, onDataChange, isMobile }) {
  const isAdmin = currentUser.role === "admin";
  const isMod   = currentUser.role === "mod";
  const isOfficer = currentUser.role === "officer";
  const canAdd = currentUser.role !== "viewer";

  const canModifyItem = (item) => {
    if (!item) return false;
    if (isAdmin || isMod) return true;
    if (isOfficer && item.can_bo_cap_nhat === currentUser.name) return true;
    return false;
  };

  const items = data["camera_hues"] || [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDonVi, setFilterDonVi] = useState("all");
  const [sortBy, setSortBy] = useState("vi_tri");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selItem, setSelItem] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [hoveredCamera, setHoveredCamera] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;

  const LOAI_CAMERA = ["Camera AI biển số", "Camera bình thường"];
  const DON_VI_BASE = ["Công an", "Huế S", "Đường sắt", "Nhà dân"];
  const DONVI_LOGO = {
    "Công an": "/images/cam_cong_an.png",
    "Huế S": "/images/cam_hue_s.jpg",
    "Đường sắt": "/images/cam_duong_sat.jpg",
    "Nhà dân": "/images/cam_nha_dan.png"
  };
  const DONVI_LOGO_OLD = {
    "Huế S": "data:image/png;base64,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",
    "Công an": "data:image/png;base64,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",
    "Đường sắt": "data:image/jpeg;base64,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"
  };

  const DonViLogo = ({ ten, size }) => {
    const sz = size || 18;
    const src = DONVI_LOGO[ten];
    if (!src) return null;
    return <img src={src} style={{ width: sz, height: sz, objectFit: "contain", borderRadius: 3, flexShrink: 0 }} alt={ten} />;
  };

  const donViList = [...new Set([...DON_VI_BASE, ...items.map(i => i.don_vi_quan_ly).filter(Boolean)])];

  const openMap = (viTri) => {
    if (!viTri) return;
    const q = encodeURIComponent(viTri + ", Huế, Việt Nam");
    window.open("https://www.google.com/maps/search/?api=1&query=" + q, "_blank");
  };

  const filtered = useMemo(() => {
    let list = items.filter(i => {
      if (filterType !== "all" && i.loai_camera !== filterType) return false;
      if (filterDonVi !== "all" && i.don_vi_quan_ly !== filterDonVi) return false;
      if (search && !(i.vi_tri || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (sortBy === "vi_tri") list = [...list].sort((a, b) => (a.vi_tri || "").localeCompare(b.vi_tri || ""));
    else if (sortBy === "loai") list = [...list].sort((a, b) => (a.loai_camera || "").localeCompare(b.loai_camera || ""));
    else if (sortBy === "don_vi") list = [...list].sort((a, b) => (a.don_vi_quan_ly || "").localeCompare(b.don_vi_quan_ly || ""));
    else list = [...list].sort((a, b) => (a.id || 0) - (b.id || 0));
    return list;
  }, [items, filterType, filterDonVi, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterDonVi, sortBy]);

  const totalCam = items.reduce((s, i) => s + (i.so_luong || 1), 0);
  const totalViTri = items.length;
  const aiCam = items.filter(i => i.loai_camera === "Camera AI biển số").reduce((s, i) => s + (i.so_luong || 1), 0);
  const normalCam = items.filter(i => i.loai_camera === "Camera bình thường").reduce((s, i) => s + (i.so_luong || 1), 0);

  const handleSave = (fd) => {
    const nd = editItem 
      ? items.map(i => i.id === fd.id ? fd : i) 
      : [...items, { ...fd, id: Math.max(0, ...items.map(i => i.id || 0)) + 1, can_bo_cap_nhat: currentUser.name }];
    onDataChange("camera_hues", nd);
    addLog(`${editItem ? "Cập nhật" : "Thêm"} camera: ${fd.vi_tri}`, "camera_hues");
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm("Xóa camera tại " + item.vi_tri + "?")) return;
    onDataChange("camera_hues", items.filter(i => i.id !== item.id));
    addLog("Xóa camera: " + item.vi_tri, "camera_hues");
  };

  const handleShowOfficerInfo = (officerName) => {
    if (!officerName) return;
    const officerUser = users.find(u => u.name === officerName) || { name: officerName };
    const count = items.filter(i => i.can_bo_cap_nhat === officerName).length;
    const totalQty = items.filter(i => i.can_bo_cap_nhat === officerName).reduce((sum, i) => sum + (i.so_luong || 1), 0);
    setSelectedOfficer({ ...officerUser, count, totalQty });
  };

  const thSt = { 
    padding: "8px 7px", 
    textAlign: "left", 
    fontSize: 9, 
    fontWeight: 700, 
    color: "rgba(255,255,255,0.95)",
    textTransform: "uppercase", 
    letterSpacing: 0.2, 
    whiteSpace: "nowrap",
    borderRight: "1px solid rgba(255,255,255,0.1)" 
  };

  const PinIcon = () => (
    <svg width={16} height={20} viewBox="0 0 16 20" fill="none">
      <path d="M8 0C4.13 0 1 3.13 1 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#DC2626" />
      <circle cx="8" cy="7" r="2.5" fill="#fff" />
    </svg>
  );

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/images/hue_s_logo.jpg" style={{ width: 24, height: 24, borderRadius: 5, objectFit: "cover" }} alt="" />
            Camera Huế S
          </h2>
          <div style={{ fontSize: 11, color: "#64748B" }}>Quản lý hệ thống camera giám sát CCTV</div>
        </div>
        {canAdd && (
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            style={{ padding: "8px 16px", background: "linear-gradient(135deg,#0369A1,#0EA5E9)", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "center" : "flex-start" }}
          >
            <img src="/images/hue_s_logo.jpg" style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover" }} alt="" />
            Thêm camera mới
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Tổng số camera", value: totalCam, sub: totalViTri + " vị trí", icon: <img src="/images/cam_tong.jpg" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }} alt="" />, color: "#0284C7", bg: "#E0F2FE", border: "#BAE6FD", filter: "all" },
          { label: "Camera AI biển số", value: aiCam, sub: "Hệ thống AI", icon: <img src="/images/cam_ai.jpg" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }} alt="" />, color: "#7C3AED", bg: "#F5F3FF", border: "#C4B5FD", filter: "Camera AI biển số" },
          { label: "Camera bình thường", value: normalCam, sub: "CCTV thường", icon: <img src="/images/cam_binh_thuong.jpeg" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }} alt="" />, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", filter: "Camera bình thường" }
        ].map((s, i) => {
          const isAct = filterType === s.filter;
          return (
            <div key={i} onClick={() => { setFilterType(s.filter); setSortBy("vi_tri"); setPage(1); }}
              style={{ 
                background: isAct ? s.color : s.bg, 
                borderRadius: 11, 
                padding: "10px 14px",
                border: "2px solid " + (isAct ? s.color : s.border), 
                cursor: "pointer",
                transition: "all 0.18s ease", 
                userSelect: "none" 
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: isAct ? "#fff" : s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: isAct ? "rgba(255,255,255,0.85)" : "#6B7280", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 2, background: isAct ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)", borderRadius: 6 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 10, color: isAct ? "rgba(255,255,255,0.75)" : s.color, marginTop: 4, fontWeight: 600 }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94A3B8", pointerEvents: "none" }}>🔍</span>
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo vị trí camera..."
          style={{ 
            ...inputSt, 
            paddingLeft: 40, 
            fontSize: 13, 
            padding: "9px 14px 9px 40px", 
            width: "100%",
            boxSizing: "border-box", 
            borderRadius: 10, 
            border: "1px solid #E5E7EB", 
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)" 
          }} 
        />
      </div>

      {/* Filters + Sort */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "10px 14px", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: isMobile ? "100%" : "auto", minWidth: isMobile ? "none" : 150 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 }}>Loại camera</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...selectSt, fontSize: 12, width: "100%", minWidth: isMobile ? "none" : 170 }}>
              <option value="all">Tất cả loại camera</option>
              {LOAI_CAMERA.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: isMobile ? "100%" : "auto", minWidth: isMobile ? "none" : 140 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 }}>Đơn vị quản lý</label>
            <select value={filterDonVi} onChange={e => setFilterDonVi(e.target.value)} style={{ ...selectSt, fontSize: 12, width: "100%", minWidth: isMobile ? "none" : 140 }}>
              <option value="all">Tất cả đơn vị</option>
              {donViList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: isMobile ? "100%" : "auto", minWidth: isMobile ? "none" : 140 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 }}>Sắp xếp theo</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...selectSt, fontSize: 12, width: "100%", minWidth: isMobile ? "none" : 150 }}>
              <option value="stt">Số thứ tự</option>
              <option value="vi_tri">Vị trí (A → Z)</option>
              <option value="loai">Loại camera</option>
              <option value="don_vi">Đơn vị quản lý</option>
            </select>
          </div>
          {(filterType !== "all" || filterDonVi !== "all") && (
            <button
              onClick={() => { setFilterType("all"); setFilterDonVi("all"); }}
              style={{ padding: "6px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, width: isMobile ? "100%" : "auto" }}
            >
              × Xóa bộ lọc
            </button>
          )}
          <button
            onClick={() => {
              const title = "DANH SÁCH HỆ THỐNG CAMERA GIÁM SÁT HUẾ S";
              const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
              const cols = ["Mã số/Tên", "Vị trí lắp đặt", "Loại", "Đơn vị quản lý", "Số luồng/IP", "Cán bộ quản lý"];
              const rows = filtered.map(item => [
                item.ten_camera || "—",
                item.vi_tri || "—",
                item.loai_camera || "—",
                item.don_vi_quan_ly || "—",
                (item.ip || "—") + (item.user ? ` (${item.user})` : ""),
                item.can_bo_phu_trach || "—"
              ]);
              exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
            }}
            style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start", width: isMobile ? "100%" : "auto" }}
          >
            🖨️ In
          </button>
          <button
            onClick={() => {
              const title = "DANH SÁCH HỆ THỐNG CAMERA GIÁM SÁT HUẾ S";
              const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
              const cols = ["Mã số/Tên", "Vị trí lắp đặt", "Loại", "Đơn vị quản lý", "Số luồng/IP", "Cán bộ quản lý"];
              const rows = filtered.map(item => [
                item.ten_camera || "—",
                item.vi_tri || "—",
                item.loai_camera || "—",
                item.don_vi_quan_ly || "—",
                (item.ip || "—") + (item.user ? ` (${item.user})` : ""),
                item.can_bo_phu_trach || "—"
              ]);
              exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: "danh_sach_camera_hues" });
            }}
            style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start", width: isMobile ? "100%" : "auto" }}
          >
            <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
          </button>
          <div style={{ marginLeft: isMobile ? "0" : "auto", textAlign: isMobile ? "right" : "left", width: isMobile ? "100%" : "auto" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0284C7" }}>{filtered.length}</span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}> {" / " + totalViTri} vị trí</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 78 }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: 140 }} />
            </colgroup>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0369A1,#0284C7)" }}>
                {[{ label: "#", align: "center" }, { label: "Vị trí Camera" }, { label: "Mở bản đồ", align: "center" },
                  { label: "Số lượng", align: "center" }, { label: "Loại Camera" }, { label: "Đơn vị quản lý" },
                  { label: "Cán bộ cập nhật" }, { label: "Thao tác", align: "center" }
                ].map(h => <th key={h.label} style={{ ...thSt, textAlign: h.align || "left" }}>{h.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎥</div>
                    Chưa có dữ liệu camera
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const rowBg = idx % 2 === 0 ? "#fff" : "#F8FAFC";
                  const isAI = item.loai_camera === "Camera AI biển số";
                  const isHS = item.don_vi_quan_ly === "Huế S";
                  const gIdx = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr 
                      key={item.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg, transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      {/* # */}
                      <td style={{ padding: "9px 6px", fontSize: 10, color: "#CBD5E1", fontWeight: 700, textAlign: "center" }}>{gIdx}</td>

                      {/* Vị trí */}
                      <td style={{ padding: "9px 10px", position: "relative" }}>
                        <div onClick={() => setSelItem(item)}
                          onMouseEnter={() => item.anh_camera && setHoveredCamera(item)}
                          onMouseLeave={() => setHoveredCamera(null)}
                          style={{ 
                            fontWeight: 600, 
                            fontSize: 12, 
                            color: "#1D4ED8", 
                            cursor: "pointer", 
                            lineHeight: 1.45,
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            display: "-webkit-box",
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: "vertical" 
                          }} 
                          title={item.vi_tri}
                        >
                          {item.vi_tri || "—"}
                        </div>
                        {hoveredCamera?.id === item.id && item.anh_camera && (
                          <div style={{ position: "absolute", left: "100%", marginLeft: 10, top: -40, zIndex: 100, background: "#fff", border: "2px solid #E2E8F0", borderRadius: 8, padding: 4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", pointerEvents: "none" }}>
                            <img src={item.anh_camera} style={{ width: 220, height: 130, objectFit: "cover", borderRadius: 6 }} alt="Góc nhìn camera" />
                          </div>
                        )}
                      </td>

                      {/* Bản đồ */}
                      <td style={{ padding: "9px 6px", textAlign: "center" }}>
                        <button
                          onClick={() => openMap(item.vi_tri)}
                          title="Mở bản đồ Google Maps"
                          style={{ 
                            background: "none", 
                            border: "none", 
                            cursor: "pointer", 
                            padding: "3px", 
                            borderRadius: 6,
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            transition: "transform 0.15s", 
                            opacity: 0.85 
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.25)"; e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "0.85"; }}
                        >
                          <PinIcon />
                        </button>
                      </td>

                      {/* Số lượng */}
                      <td style={{ padding: "9px 6px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          width: 30, 
                          height: 30, 
                          borderRadius: "50%",
                          background: (item.so_luong || 1) > 1 ? "#DBEAFE" : "#F1F5F9",
                          color: (item.so_luong || 1) > 1 ? "#1D4ED8" : "#94A3B8",
                          fontWeight: 800, 
                          fontSize: 13,
                          border: (item.so_luong || 1) > 1 ? "2px solid #93C5FD" : "2px solid #E2E8F0"
                        }}>
                          {item.so_luong || 1}
                        </span>
                      </td>

                      {/* Loại */}
                      <td style={{ padding: "9px 8px" }}>
                        <span style={{
                          background: isAI ? "#EDE9FE" : "#E0F2FE", 
                          color: isAI ? "#6D28D9" : "#0369A1",
                          padding: "3px 7px", 
                          borderRadius: 6, 
                          fontSize: 10, 
                          fontWeight: 700, 
                          display: "inline-block"
                        }}>
                          {isAI ? "AI biển số" : "Bình thường"}
                        </span>
                      </td>

                      {/* Đơn vị */}
                      <td style={{ padding: "9px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <DonViLogo ten={item.don_vi_quan_ly} size={18} />
                          <span style={{
                            background: isHS ? "#EFF9FF" : item.don_vi_quan_ly === "Đường sắt" ? "#F1F5F9" : item.don_vi_quan_ly === "Nhà dân" ? "#FFF7ED" : "#F0FDF4",
                            color: isHS ? "#0369A1" : item.don_vi_quan_ly === "Đường sắt" ? "#374151" : item.don_vi_quan_ly === "Nhà dân" ? "#C2410C" : "#15803D",
                            padding: "3px 7px", 
                            borderRadius: 6, 
                            fontSize: 10, 
                            fontWeight: 700
                          }}>
                            {item.don_vi_quan_ly || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Cán bộ */}
                      <td style={{ padding: "9px 8px" }}>
                        <div 
                          onClick={() => handleShowOfficerInfo(item.can_bo_cap_nhat)}
                          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", overflow: "hidden" }}
                        >
                          <UserAvatar user={users.find(u => u.name === item.can_bo_cap_nhat) || { name: item.can_bo_cap_nhat }} size={20} />
                          <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {getShortName(item.can_bo_cap_nhat)}
                          </span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button onClick={() => setSelItem(item)}
                            style={{ border: "none", background: "#EFF6FF", color: "#2563EB", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xem</button>
                          {canModifyItem(item) && (
                            <button onClick={() => { setEditItem(item); setShowModal(true); }}
                              style={{ border: "none", background: "#FFF7ED", color: "#EA580C", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Sửa</button>
                          )}
                          {currentUser?.role === 'admin' && (
                            <button onClick={() => handleDelete(item)}
                              style={{ border: "none", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xóa</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #F1F5F9", background: "#FAFBFC", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          Hiển thị <b>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</b>–<b>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> vị trí
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Hiển thị</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "3px 6px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" }}>
              {[10, 15, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>‹</button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1, isAct = p === page;
                const show = p === 1 || p === totalPages || Math.abs(p - page) <= 2;
                if (!show) {
                  if (p === 2 && page > 4) return <span key={p} style={{ color: "#9CA3AF", fontSize: 11, padding: "0 2px" }}>...</span>;
                  if (p === totalPages - 1 && page < totalPages - 3) return <span key={p} style={{ color: "#9CA3AF", fontSize: 11, padding: "0 2px" }}>...</span>;
                  return null;
                }
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: "4px 9px", border: "1px solid " + (isAct ? "#0284C7" : "#E2E8F0"), borderRadius: 6, background: isAct ? "#0284C7" : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontSize: 11, fontWeight: isAct ? 700 : 400, minWidth: 30 }}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>»</button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selItem && (
        <>
          <div onClick={() => setSelItem(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.32)", zIndex: 999 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: isMobile ? "100vw" : 390, height: "100vh", background: "#fff", boxShadow: "-4px 0 28px rgba(0,0,0,0.14)", zIndex: 1000, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ background: "linear-gradient(135deg,#0369A1,#0EA5E9)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
              <div style={{ flex: 1, paddingRight: 8 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>📹 Chi tiết Camera</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6, flexWrap: "wrap" }}>
                  <span>{selItem.vi_tri}</span>
                  <span onClick={() => openMap(selItem.vi_tri)} title="Mở Google Maps" style={{ cursor: "pointer", flexShrink: 0, marginTop: 2, display: "inline-flex", alignItems: "center", opacity: 0.85 }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#fff" fillOpacity={0.9} />
                      <circle cx="12" cy="9" r="2.5" fill="#0369A1" />
                    </svg>
                  </span>
                </div>
              </div>
              <button onClick={() => setSelItem(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>×</button>
            </div>
            <div style={{ padding: "14px 16px", flex: 1 }}>
              {[
                { label: "Số lượng", value: (selItem.so_luong || 1) + " camera", icon: "📹" },
                { label: "Loại Camera", value: selItem.loai_camera, icon: selItem.loai_camera === "Camera AI biển số" ? "🔎" : "🎥" },
                { label: "Cán bộ cập nhật", value: selItem.can_bo_cap_nhat, icon: "👮" },
                selItem.ghi_chu ? { label: "Ghi chú", value: selItem.ghi_chu, icon: "📝" } : null
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ padding: "9px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{row.icon} {row.label}</div>
                  <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600, lineHeight: 1.5 }}>{row.value || "—"}</div>
                </div>
              ))}
              <div style={{ padding: "9px 0", borderBottom: "1px solid #F1F5F9", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>🏢 Đơn vị quản lý</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DonViLogo ten={selItem.don_vi_quan_ly} size={28} />
                  <span style={{ fontSize: 14, color: "#0F172A", fontWeight: 700 }}>{selItem.don_vi_quan_ly || "—"}</span>
                </div>
              </div>
              {canModifyItem(selItem) && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button onClick={() => { setEditItem(selItem); setShowModal(true); setSelItem(null); }}
                    style={{ flex: 1, padding: "10px", background: "#FFF7ED", color: "#EA580C", border: "1px solid #FDBA74", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✏️ Chỉnh sửa</button>
                  {currentUser?.role === 'admin' && (
                    <button onClick={() => { handleDelete(selItem); setSelItem(null); }}
                      style={{ flex: 1, padding: "10px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>🗑 Xóa</button>
                  )}
                </div>
              )}
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "7px 12px", background: "#FAFBFC", borderBottom: "1px solid #F1F5F9" }}>📷 Góc nhìn camera</div>
                {selItem.anh_camera ? (
                  <img 
                    src={selItem.anh_camera} 
                    onClick={() => setZoomedImage(selItem.anh_camera)}
                    style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover", cursor: "zoom-in" }} 
                    alt="Góc nhìn camera" 
                    title="Nhấn để phóng to ảnh"
                  />
                ) : (
                  <div style={{ background: "linear-gradient(135deg,#1E293B,#334155)", height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg width={44} height={44} viewBox="0 0 24 24" fill="none">
                      <rect x={2} y={6} width={15} height={12} rx={2} stroke="#64748B" strokeWidth={1.5} />
                      <path d="M17 9l4-2v10l-4-2V9z" stroke="#64748B" strokeWidth={1.5} />
                      <circle cx="9" cy="12" r="2.5" stroke="#94A3B8" strokeWidth={1.5} />
                    </svg>
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Đang cập nhật...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editItem ? "✏️ Chỉnh sửa Camera" : "🎥 Thêm Camera Mới"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <CameraForm 
            initial={editItem} 
            officerList={users.map(u => u.name)}
            loaiList={LOAI_CAMERA} 
            donViList={donViList} 
            currentUser={currentUser} 
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditItem(null); }} 
            isMobile={isMobile}
          />
        </Modal>
      )}
      {selectedOfficer && (
        <Modal title="👮 Thông tin cán bộ cập nhật" onClose={() => setSelectedOfficer(null)}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "10px 0" }}>
            <UserAvatar user={selectedOfficer} size={64} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{selectedOfficer.name}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {selectedOfficer.cap_bac && <RankBadge capBac={selectedOfficer.cap_bac} size={20} />}
                  Cấp bậc: <span style={{ fontWeight: 600, color: "#374151" }}>{selectedOfficer.cap_bac || "—"}</span>
                </span>
                <span style={{ color: "#E2E8F0" }}>|</span>
                <span>
                  Chức vụ: <span style={{ fontWeight: 600, color: "#374151" }}>{selectedOfficer.chuc_vu || "—"}</span>
                </span>
                <span style={{ color: "#E2E8F0" }}>|</span>
                <span>
                  Đơn vị: <span style={{ fontWeight: 600, color: "#374151" }}>{selectedOfficer.department || "—"}</span>
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 14, background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Thống kê nhập liệu</div>
            <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0284C7" }}>{selectedOfficer.count}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Số vị trí camera</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>{selectedOfficer.totalQty}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Tổng số lượng camera</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button 
              onClick={() => setSelectedOfficer(null)} 
              style={{ padding: "9px 22px", background: "linear-gradient(135deg,#0369A1,#0284C7)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
      {zoomedImage && (
        <>
          <div onClick={() => setZoomedImage(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
            <img src={zoomedImage} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", borderRadius: 8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }} alt="Phóng to" />
            <button onClick={() => setZoomedImage(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.3)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </>
      )}
    </div>
  );
}

function CameraForm({ initial, officerList, loaiList, donViList, currentUser, onSave, onClose, isMobile }) {
  const [f, setF] = useState(() => ({ 
    vi_tri: "", 
    so_luong: 1, 
    loai_camera: "Camera bình thường", 
    don_vi_quan_ly: "Công an", 
    can_bo_cap_nhat: currentUser.name, 
    ghi_chu: "", 
    anh_camera: "", 
    ...initial || {} 
  }));
  const [showCust, setShowCust] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  
  const handleDV = (val) => {
    if (val === "__custom__") { 
      setShowCust(true); 
      set("don_vi_quan_ly", ""); 
    } else { 
      setShowCust(false); 
      set("don_vi_quan_ly", val); 
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Vị trí Camera" required={true}>
          <input value={f.vi_tri || ""} onChange={e => set("vi_tri", e.target.value)} placeholder="VD: Ngã tư Hùng Vương - Lê Lợi" style={inputSt} />
        </FormField>
        <FormField label="Số lượng">
          <input type="number" min={1} max={99} value={f.so_luong || 1} onChange={e => set("so_luong", parseInt(e.target.value) || 1)} style={{ ...inputSt, width: 90 }} />
        </FormField>
        <FormField label="Loại Camera">
          <select value={f.loai_camera || ""} onChange={e => set("loai_camera", e.target.value)} style={selectSt}>
            {loaiList.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FormField>
        <FormField label="Đơn vị quản lý">
          <select value={showCust ? "__custom__" : (f.don_vi_quan_ly || "")} onChange={e => handleDV(e.target.value)} style={selectSt}>
            {donViList.map(d => <option key={d} value={d}>{d}</option>)}
            <option value="__custom__">➕ Thêm đơn vị mới...</option>
          </select>
          {showCust && <input value={f.don_vi_quan_ly || ""} onChange={e => set("don_vi_quan_ly", e.target.value)} placeholder="Nhập tên đơn vị..." style={{ ...inputSt, marginTop: 6 }} />}
        </FormField>
        <FormField label="Cán bộ cập nhật">
          <select value={f.can_bo_cap_nhat || ""} onChange={e => set("can_bo_cap_nhat", e.target.value)} style={selectSt}>
            {officerList.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={f.ghi_chu || ""} onChange={e => set("ghi_chu", e.target.value)} rows={2} style={{ ...inputSt, resize: "vertical" }} />
          </FormField>
        </div>
      </div>
      
      <div style={{ gridColumn: "1/-1", marginBottom: 12 }}>
        <FormField label="📷 Ảnh góc nhìn camera">
          <div style={{ border: "2px dashed #CBD5E1", borderRadius: 9, padding: 12, background: "#F8FAFC", textAlign: "center", minHeight: 80 }}>
            {f.anh_camera ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img src={f.anh_camera} style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, objectFit: "cover", display: "block" }} alt="Camera preview" />
                <button onClick={() => set("anh_camera", "")}
                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            ) : (
              <label style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#64748B" }}>
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <rect x={2} y={6} width={15} height={12} rx={2} stroke="#94A3B8" strokeWidth={1.5} />
                  <path d="M17 9l4-2v10l-4-2V9z" stroke="#94A3B8" strokeWidth={1.5} />
                  <circle cx="9" cy="12" r="2.5" stroke="#94A3B8" strokeWidth={1.5} />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Tải lên ảnh camera</span>
                <span style={{ fontSize: 10, color: "#94A3B8" }}>JPG, PNG (tối đa 2MB)</span>
                <input type="file" accept="image/*" style={{ display: "none" }}
                  onChange={async e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const compressed = await compressImage(file, 800, 800, 0.75);
                      set("anh_camera", compressed);
                    } catch (err) {
                      console.error("Lỗi nén ảnh:", err);
                      alert("Không thể tải và nén ảnh!");
                    }
                  }}
                />
              </label>
            )}
          </div>
        </FormField>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Hủy</button>
        <button
          onClick={() => { if (!f.vi_tri.trim()) { alert("Vui lòng nhập vị trí camera!"); return; } onSave(f); }}
          style={{ padding: "9px 22px", background: "linear-gradient(135deg,#0EA5E9,#0284C7)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
        >
          💾 Lưu
        </button>
      </div>
    </div>
  );
}
