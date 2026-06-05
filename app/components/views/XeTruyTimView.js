"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Modal, FormField, exportToPrint, exportToWord, compressImage, UserAvatar, formatVNdate, getShortName, RankBadge } from '@/app/components/shared';

const HUE_PHUONG_XA = [
  "Phường Phong Điền", "Phường Phong Thái", "Phường Phong Dinh", "Phường Phong Phú", "Phường Phong Quảng",
  "Phường Hương Trà", "Phường Kim Trà", "Phường Kim Long", "Phường Hương An", "Phường Tây Lộc",
  "Phường Thuận An", "Phường Hóa Châu", "Phường Mỹ Thượng", "Phường Vỹ Dạ", "Phường Thuận Hóa",
  "Phường Phú Xuân", "Phường An Đông", "Phường Thủy Xuân", "Phường Hương Thủy", "Phường Dương Nỗ",
  "Phường Chân Mây – Lăng Cô", "Xã Đan Điền", "Xã Quảng Điền", "Xã Phú Vinh", "Xã Phú Lộc",
  "Xã Vinh Hiền", "Xã Nam Đông", "Xã Khe Tre", "Xã A Lưới 1", "Xã A Lưới 2", "Xã A Lưới 3",
  "Xã A Lưới 4", "Xã A Lưới 5", "Xã Hương Phú", "Xã Bình Điền", "Xã Hương Giang", "Xã Lộc Bổn",
  "Xã Xuân Lộc", "Xã Vinh Mỹ", "Xã Lộc Thủy"
];

const HANG_XE_LIST = [
  "Honda", "Yamaha", "Suzuki", "SYM", "Piaggio", "Kawasaki", "Kymco",
  "Ford", "Toyota", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Vinfast",
  "Mercedes", "BMW", "Audi", "Khác"
];

const MAU_XE_LIST = [
  "Trắng", "Đen", "Đỏ", "Xanh dương", "Xanh lá", "Vàng", "Bạc",
  "Xám", "Nâu", "Cam", "Tím", "Hai màu khác"
];

const BACKGROUND_COLORS = {
  "trắng": "#FFFFFF",
  "đen": "#1E293B",
  "đỏ": "#EF4444",
  "xanh": "#2563EB",
  "xanh dương": "#2563EB",
  "xanh lá": "#22C55E",
  "vàng": "#EAB308",
  "bạc": "#CBD5E1",
  "xám": "#64748B",
  "nâu": "#78350F",
  "cam": "#F97316",
  "tím": "#A855F7",
  "hồng": "#EC4899"
};

const TEXT_COLORS = {
  "trắng": "#0F172A",
  "đen": "#FFFFFF",
  "đỏ": "#FFFFFF",
  "xanh": "#FFFFFF",
  "xanh dương": "#FFFFFF",
  "xanh lá": "#FFFFFF",
  "vàng": "#0F172A",
  "bạc": "#0F172A",
  "xám": "#FFFFFF",
  "nâu": "#FFFFFF",
  "cam": "#FFFFFF",
  "tím": "#FFFFFF",
  "hồng": "#FFFFFF"
};

const inputSt = { width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectSt = { ...inputSt, background: "#fff" };
const textareaSt = { ...inputSt, resize: "vertical", minHeight: 80 };

function MauBadge({ mau }) {
  if (!mau || !mau.trim()) return <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>;
  const m = mau.toLowerCase().trim().replace(/^(màu|mày|dk)\s+/, "");
  
  let bg = "#F3F4F6";
  let txt = "#1E293B";
  let border = "#E5E7EB";
  
  const matchedKey = Object.keys(BACKGROUND_COLORS).find(k => m.includes(k));
  if (matchedKey) {
    bg = BACKGROUND_COLORS[matchedKey];
    txt = TEXT_COLORS[matchedKey];
    if (matchedKey === "trắng") border = "#CBD5E1";
    else border = "transparent";
  } else {
    const parts = Object.keys(BACKGROUND_COLORS).filter(k => m.includes(k));
    if (parts.length >= 2) {
      const c1 = BACKGROUND_COLORS[parts[0]];
      const c2 = BACKGROUND_COLORS[parts[1]];
      bg = `linear-gradient(135deg, ${c1} 0%, ${c1} 50%, ${c2} 50%, ${c2} 100%)`;
      txt = "#FFFFFF";
      border = "transparent";
    }
  }

  return (
    <span style={{ 
      display: "inline-flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: bg, 
      color: txt, 
      border: `1px solid ${border}`,
      padding: "4px 10px", 
      borderRadius: 7, 
      fontSize: 11, 
      fontWeight: 700, 
      minWidth: 60, 
      textAlign: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      textShadow: txt === "#FFFFFF" ? "0 1px 2px rgba(0,0,0,0.6)" : "none"
    }}>
      {mau}
    </span>
  );
}

function TrangThaiBadgeXe({ tt, status }) {
  const isDone = tt === "dinh_tim" || status === "hoan_thanh";
  return isDone ? (
    <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A", display: "inline-block", flexShrink: 0 }} />
      Đình tìm
    </span>
  ) : (
    <span style={{ background: "#FEF3C7", color: "#B45309", padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D97706", display: "inline-block", flexShrink: 0 }} />
      Đang truy tìm
    </span>
  );
}

export default function XeTruyTimView({ data, onDataChange, currentUser, addLog, users, isMobile }) {
  const items = data["xe_truy_tim"] || [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [filterHang, setFilterHang] = useState("all");
  const [filterMau, setFilterMau] = useState("all");
  const [filterNoiMat, setFilterNoiMat] = useState("all");
  const [sortBy, setSortBy] = useState("ngay_phat_lenh_desc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [bienSoPopup, setBienSoPopup] = useState(null);
  const [chuXePopup, setChuXePopup] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const isOfficer = currentUser.role === "officer";
  const canAddNew = isAdmin || isOfficer;
  const canEdit = item => isAdmin || (isOfficer && item.nguoi_them === currentUser.name);
  const canDelete = item => currentUser.role === "admin";
  const officerList = users.filter(u => u.role !== "viewer").map(u => u.name);

  const total = items.length;
  const da_tim = items.filter(i => i.trang_thai === "dinh_tim" || i.status === "hoan_thanh").length;
  const dang_tim = items.filter(i => i.trang_thai === "dang_truy_tim" || !i.trang_thai).length;

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) {
      list = list.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(q)));
    }
    if (filterTrangThai === "truy_tim") {
      list = list.filter(i => i.trang_thai === "dang_truy_tim" || !i.trang_thai);
    } else if (filterTrangThai === "dinh_tim") {
      list = list.filter(i => i.trang_thai === "dinh_tim" || i.status === "hoan_thanh");
    }
    if (filterHang !== "all") list = list.filter(i => i.hang_xe === filterHang);
    if (filterMau !== "all") list = list.filter(i => i.mau_xe === filterMau);
    if (filterNoiMat !== "all") list = list.filter(i => i.noi_mat === filterNoiMat);

    if (sortBy === "ngay_phat_lenh_desc") list.sort((a, b) => new Date(b.ngay_phat_lenh || 0) - new Date(a.ngay_phat_lenh || 0));
    if (sortBy === "ngay_phat_lenh_asc") list.sort((a, b) => new Date(a.ngay_phat_lenh || 0) - new Date(b.ngay_phat_lenh || 0));
    if (sortBy === "bien_so") list.sort((a, b) => (a.bien_so || "").localeCompare(b.bien_so || ""));
    if (sortBy === "hang_xe") list.sort((a, b) => (a.hang_xe || "").localeCompare(b.hang_xe || ""));
    if (sortBy === "noi_mat") list.sort((a, b) => (a.noi_mat || "").localeCompare(b.noi_mat || ""));
    return list;
  }, [items, search, filterTrangThai, filterHang, filterMau, filterNoiMat, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [items, search, filterTrangThai, filterHang, filterMau, filterNoiMat, sortBy, pageSize]);

  const handleSave = form => {
    const cur = data["xe_truy_tim"] || [];
    const priorityVal = form.trang_thai === "dinh_tim" ? "" : "cao";
    const f = { 
      ...form, 
      priority: priorityVal,
      nguoi_them: form.nguoi_them || currentUser.name 
    };
    let nd;
    if (editItem) {
      nd = cur.map(i => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật xe: ${f.bien_so}`, "xe_truy_tim");
    } else {
      const id = Math.max(0, ...cur.map(i => i.id || 0)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm xe truy tìm: ${f.bien_so}`, "xe_truy_tim");
    }
    onDataChange("xe_truy_tim", nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = item => {
    if (!window.confirm(`Xóa xe "${item.bien_so}"?`)) return;
    onDataChange("xe_truy_tim", (data["xe_truy_tim"] || []).filter(i => i.id !== item.id));
    addLog(`Xóa xe: ${item.bien_so}`, "xe_truy_tim");
  };

  const handleShowOfficerInfo = (officerName) => {
    if (!officerName) return;
    const officerUser = users.find(u => u.name === officerName) || { name: officerName };
    const count = items.filter(i => i.can_bo_phu_trach === officerName).length;
    const totalQty = items.filter(i => i.nguoi_them === officerName).length;
    setSelectedOfficer({ ...officerUser, count, totalQty });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 18, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>🚗 Xe Truy Tìm</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý phương tiện liên quan vụ án cần truy tìm</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            style={{ padding: "9px 18px", background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 12px rgba(234,88,12,0.3)", width: isMobile ? "100%" : "auto" }}
          >
            + Thêm xe mới
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm biển số xe, loại xe, màu sắc, chủ xe, nơi mất, vụ án liên quan..."
          style={{ ...inputSt, paddingLeft: 44, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 11, marginBottom: 18 }}>
        {[
          { label: "Tổng số xe", value: total, icon: "🚗", color: "#EA580C", bg: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", border: "#FED7AA", filter: "all" },
          { label: "Đã tìm được", value: da_tim, icon: "✅", color: "#15803D", bg: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", border: "#86EFAC", filter: "dinh_tim" },
          { label: "Đang truy tìm", value: dang_tim, icon: "🔍", color: "#B45309", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "#FDE68A", filter: "truy_tim" }
        ].map((s, i) => (
          <div
            key={i}
            onClick={() => {
              if (s.filter === "all") {
                setFilterTrangThai("all");
              } else if (s.filter) {
                setFilterTrangThai(filterTrangThai === s.filter ? "all" : s.filter);
              }
            }}
            style={{ 
              background: s.bg, 
              borderRadius: 13, 
              padding: "14px 16px", 
              border: `2px solid ${s.filter && filterTrangThai === s.filter ? s.color : s.border}`, 
              cursor: "pointer", 
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 20, marginBottom: 5 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
            </div>
            <div style={{ 
              position: "absolute", 
              right: -6, 
              bottom: -10, 
              fontSize: 64, 
              opacity: 0.08, 
              pointerEvents: "none",
              userSelect: "none"
            }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "11px 14px", border: "1px solid #E5E7EB", marginBottom: 16, display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", flexDirection: isMobile ? "row" : "row" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", flexShrink: 0, width: isMobile ? "100%" : "auto" }}>Lọc:</span>
        <select value={filterTrangThai} onChange={e => setFilterTrangThai(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 170, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="truy_tim">Đang truy tìm</option>
          <option value="dinh_tim">Đình tìm</option>
        </select>
        <select value={filterHang} onChange={e => setFilterHang(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 155, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả hãng xe</option>
          {HANG_XE_LIST.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <select value={filterMau} onChange={e => setFilterMau(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 145, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả màu sắc</option>
          {MAU_XE_LIST.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterNoiMat} onChange={e => setFilterNoiMat(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả nơi mất</option>
          {HUE_PHUONG_XA.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="ngay_phat_lenh_desc">📅 Mới phát lệnh trước</option>
          <option value="ngay_phat_lenh_asc">📅 Cũ phát lệnh trước</option>
          <option value="bien_so">🔢 Theo biển số</option>
          <option value="hang_xe">🚗 Theo hãng xe</option>
          <option value="noi_mat">📍 Theo nơi mất</option>
        </select>
        {(filterTrangThai !== "all" || filterHang !== "all" || filterMau !== "all" || filterNoiMat !== "all" || search) && (
          <button
            onClick={() => { setFilterTrangThai("all"); setFilterHang("all"); setFilterMau("all"); setFilterNoiMat("all"); setSearch(""); }}
            style={{ padding: "6px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
          >
            ✕ Xóa lọc
          </button>
        )}
        <button
          onClick={() => {
            const title = "DANH SÁCH PHƯƠNG TIỆN GIAO THÔNG CẦN TRUY TÌM";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Mã số", "Biển kiểm soát", "Hãng xe", "Loại xe", "Màu sắc", "Chủ xe", "Ngày phát lệnh", "Nơi mất", "Cán bộ phụ trách", "Trạng thái"];
            const rows = filtered.map(item => [
              item.ma_so || "—",
              item.bien_so || "—",
              item.hang_xe || "—",
              item.loai_xe || "—",
              item.mau_xe || "—",
              item.ten_chu_xe || "—",
              item.ngay_phat_lenh || "—",
              item.noi_mat || "—",
              item.can_bo_phu_trach || "—",
              item.trang_thai === "dinh_tim" || item.status === "hoan_thanh" ? "Đình tìm" : "Đang truy tìm"
            ]);
            exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          🖨️ In
        </button>
        <button
          onClick={() => {
            const title = "DANH SÁCH PHƯƠNG TIỆN GIAO THÔNG CẦN TRUY TÌM";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Mã số", "Biển kiểm soát", "Hãng xe", "Loại xe", "Màu sắc", "Chủ xe", "Ngày phát lệnh", "Nơi mất", "Cán bộ phụ trách", "Trạng thái"];
            const rows = filtered.map(item => [
              item.ma_so || "—",
              item.bien_so || "—",
              item.hang_xe || "—",
              item.loai_xe || "—",
              item.mau_xe || "—",
              item.ten_chu_xe || "—",
              item.ngay_phat_lenh || "—",
              item.noi_mat || "—",
              item.can_bo_phu_trach || "—",
              item.trang_thai === "dinh_tim" || item.status === "hoan_thanh" ? "Đình tìm" : "Đang truy tìm"
            ]);
            exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: "danh_sach_xe_truy_tim" });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 11, color: "#94A3B8", width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{filtered.length}/{total} xe</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#7C2D12,#9A3412)" }}>
                {["#", "Biển số xe", "Loại xe", "Màu sắc", "Chủ xe", "Liên quan vụ", "Nơi mất", "Ngày phát lệnh", "Trạng thái", "Cán bộ phụ trách", "Thao tác"].map(h => (
                  <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#FED7AA", textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🚗</div>
                    <div style={{ fontWeight: 600 }}>Không có xe nào phù hợp</div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const rowBg = idx % 2 === 0 ? "#fff" : "#FFFAF7";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid #F3F4F6", background: rowBg }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FFF3EC"}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ padding: "9px 6px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 26 }}>{idx + 1 + (page - 1) * PAGE_SIZE}</td>
                      <td style={{ padding: "9px 7px", whiteSpace: "nowrap" }}>
                        <button onClick={() => setBienSoPopup(item)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                          <span style={{ background: "#FFF7ED", color: "#EA580C", fontWeight: 900, fontSize: 13, padding: "3px 8px", borderRadius: 7, border: "2px solid #FED7AA", letterSpacing: 1, fontFamily: "monospace" }}>{item.bien_so || "—"}</span>
                        </button>
                      </td>
                      <td style={{ padding: "9px 7px", maxWidth: 130 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.hang_xe || ""}</div>
                        {item.loai_xe && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{item.loai_xe}</div>}
                      </td>
                      <td style={{ padding: "9px 7px", whiteSpace: "nowrap" }}>
                        <MauBadge mau={item.mau_xe} />
                      </td>
                      <td style={{ padding: "9px 7px" }}>
                        {item.ten_chu_xe ? (
                          <button onClick={() => setChuXePopup(item)} style={{ border: "none", background: "none", color: "#3B82F6", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, textDecoration: "underline dotted", textUnderlineOffset: 2, display: "block", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.ten_chu_xe}</button>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "9px 7px" }}>
                        {item.lien_quan_vu_an ? (
                          <span style={{ background: "#FEF3C7", color: "#B45309", padding: "2px 6px", borderRadius: 7, fontSize: 10, fontWeight: 600, display: "block", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.lien_quan_vu_an}>{item.lien_quan_vu_an}</span>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "9px 7px", maxWidth: 120 }}>
                        {item.noi_mat ? (
                          <span style={{ fontSize: 11, color: "#374151", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.noi_mat}>
                            <span style={{ marginRight: 3, fontSize: 10 }}>📍</span>{item.noi_mat}
                          </span>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "9px 7px", fontSize: 11, color: "#64748B", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatVNdate(item.ngay_phat_lenh)}</td>
                      <td style={{ padding: "9px 7px", whiteSpace: "nowrap" }}>
                        <TrangThaiBadgeXe tt={item.trang_thai} status={item.status} />
                      </td>
                      <td style={{ padding: "9px 7px", whiteSpace: "nowrap" }}>
                        {item.can_bo_phu_trach ? (
                          <div 
                            onClick={() => handleShowOfficerInfo(item.can_bo_phu_trach)}
                            style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                          >
                            <UserAvatar user={users.find(u => u.name === item.can_bo_phu_trach) || { name: item.can_bo_phu_trach, role: "viewer" }} size={20} />
                            <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortName(item.can_bo_phu_trach)}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "9px 6px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
                          <button onClick={() => setBienSoPopup(item)} style={{ border: "none", background: "#FFF7ED", color: "#EA580C", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xem</button>
                          {canEdit(item) && (
                            <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ border: "none", background: "#FFFBEB", color: "#D97706", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Sửa</button>
                          )}
                          {canDelete(item) && (
                            <button onClick={() => handleDelete(item)} style={{ border: "none", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xóa</button>
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
        <div style={{ padding: "9px 14px", borderTop: "1px solid #F3F4F6", fontSize: 11, color: "#94A3B8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, background: "#FAFBFC" }}>
          <span>
            Hiển thị <b style={{ color: "#374151" }}>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> xe
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "3px 6px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" }}
              >
                {[10, 15, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>«</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>‹</button>
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  const isAct = p === page;
                  const show = p === 1 || p === totalPages || Math.abs(p - page) <= 2;
                  if (!show) {
                    if (p === 2 && page > 4) return <span key={p} style={{ color: "#9CA3AF", fontSize: 11, padding: "0 2px" }}>...</span>;
                    if (p === totalPages - 1 && page < totalPages - 3) return <span key={p} style={{ color: "#9CA3AF", fontSize: 11, padding: "0 2px" }}>...</span>;
                    return null;
                  }
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: "4px 9px", border: "1px solid " + (isAct ? "#0284C7" : "#E2E8F0"), borderRadius: 6, background: isAct ? "#0284C7" : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontSize: 11, fontWeight: isAct ? 700 : 400, minWidth: 30 }}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>»</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {bienSoPopup && (
        <Modal 
          title={`🚗 Chi tiết xe truy tìm: ${bienSoPopup.bien_so}`} 
          onClose={() => setBienSoPopup(null)}
          wide
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2.2fr", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 140, height: 140, background: "#F1F5F9", borderRadius: 12, border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", overflow: "hidden" }}>
                {bienSoPopup.anh_url ? (
                  <img src={bienSoPopup.anh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Xe truy tìm" />
                ) : (
                  <span style={{ fontSize: 54, color: "#94A3B8" }}>🏍️</span>
                )}
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>{bienSoPopup.bien_so}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", marginTop: 8 }}>
                <span style={{ background: "#FFE8E8", color: "#EA580C", padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                  {bienSoPopup.ma_so}
                </span>
                <span style={{ background: bienSoPopup.trang_thai === "dinh_tim" ? "#F3F4F6" : "#FFF7ED", color: bienSoPopup.trang_thai === "dinh_tim" ? "#6B7280" : "#EA580C", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                  {bienSoPopup.trang_thai === "dinh_tim" ? "✓ Đình tìm" : "🔍 Đang truy tìm"}
                </span>
              </div>
            </div>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
                <div><strong>Hãng xe:</strong> {bienSoPopup.hang_xe || "—"}</div>
                <div><strong>Loại xe (model):</strong> {bienSoPopup.loai_xe || "—"}</div>
                <div><strong>Màu sắc:</strong> {bienSoPopup.mau_xe || "—"}</div>
                <div><strong>Nơi mất:</strong> {bienSoPopup.noi_mat || "—"}</div>
                <div><strong>Chủ xe:</strong> {bienSoPopup.ten_chu_xe || "—"}</div>
                <div><strong>SĐT chủ xe:</strong> {bienSoPopup.chu_dien_thoai || "—"}</div>
                <div><strong>CCCD chủ xe:</strong> {bienSoPopup.chu_cccd || "—"}</div>
                <div style={{ gridColumn: "1/-1" }}><strong>Địa chỉ chủ xe:</strong> {bienSoPopup.chu_dia_chi || "—"}</div>
                <div><strong>Ngày phát lệnh:</strong> {formatVNdate(bienSoPopup.ngay_phat_lenh)}</div>
                <div><strong>Hạn tìm kiếm:</strong> {formatVNdate(bienSoPopup.deadline)}</div>
                <div><strong>Cán bộ phụ trách:</strong> {bienSoPopup.can_bo_phu_trach || "—"}</div>
                <div style={{ gridColumn: "1/-1" }}><strong>Vụ án liên quan / Lý do:</strong> {bienSoPopup.lien_quan_vu_an || "—"}</div>
              </div>

              {bienSoPopup.ghi_chu && (
                <div style={{ marginTop: 12, borderTop: "1px solid #F1F5F9", paddingTop: 10, fontSize: 13 }}>
                  <strong>Ghi chú:</strong>
                  <div style={{ color: "#64748B", marginTop: 4 }}>{bienSoPopup.ghi_chu}</div>
                </div>
              )}

              {/* Lệnh đính kèm */}
              {bienSoPopup.anh_lenh_url && (
                <div style={{ marginTop: 14, borderTop: "1px solid #E2E8F0", paddingTop: 10, fontSize: 13 }}>
                  <strong>Quyết định đính kèm:</strong>
                  <div style={{ marginTop: 8 }}>
                    <div 
                      onClick={() => window.open(bienSoPopup.anh_lenh_url, '_blank')}
                      style={{ width: 120, height: 160, borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "relative", background: "#F8FAFC" }}
                    >
                      <img src={bienSoPopup.anh_lenh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Tờ quyết định" />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: "bold" }}>🔍 Xem lệnh</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {chuXePopup && (
        <Modal title={`👤 Thông tin chủ xe: ${chuXePopup.ten_chu_xe}`} onClose={() => setChuXePopup(null)}>
          <div style={{ padding: 6 }}>
            {[
              { l: "Họ và tên chủ xe", v: chuXePopup.ten_chu_xe, bold: true },
              { l: "Ngày sinh", v: formatVNdate(chuXePopup.chu_ngay_sinh) },
              { l: "CCCD/CMND", v: chuXePopup.chu_cccd },
              { l: "Số điện thoại", v: chuXePopup.chu_dien_thoai },
              { l: "Địa chỉ thường trú", v: chuXePopup.chu_dia_chi }
            ].filter(f => f.v).map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, minWidth: 120, flexShrink: 0 }}>{f.l}</span>
                <span style={{ fontSize: 13, color: "#111827", fontWeight: f.bold ? 700 : 500, flex: 1 }}>{f.v}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 10, background: "#FFF7ED", borderRadius: 10, fontSize: 12, color: "#C2410C", fontWeight: 600 }}>
              🚗 Xe đăng ký: <b>{chuXePopup.bien_so}</b> · {chuXePopup.hang_xe} {chuXePopup.loai_xe} ({chuXePopup.mau_xe})
            </div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal title={editItem ? "✏️ Chỉnh sửa Xe Truy Tìm" : "➕ Thêm Xe Truy Tìm Mới"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <XeTruyTimForm initial={editItem} officerList={officerList} allItems={items} huePhuongXa={HUE_PHUONG_XA} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} isMobile={isMobile} currentUser={currentUser} />
        </Modal>
      )}
      {selectedOfficer && (
        <Modal title="👮 Thông tin cán bộ phụ trách" onClose={() => setSelectedOfficer(null)}>
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
                <div style={{ fontSize: 20, fontWeight: 900, color: "#EA580C" }}>{selectedOfficer.count}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Số xe phụ trách</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#C2410C" }}>{selectedOfficer.totalQty}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Số xe đã nhập</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button 
              onClick={() => setSelectedOfficer(null)} 
              style={{ padding: "9px 22px", background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AutocompleteInput({ value, onChange, suggestions, placeholder, inputStyle }) {
  const [searchVal, setSearchVal] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSearchVal(value || "");
  }, [value]);

  const filteredSuggestions = useMemo(() => {
    if (!searchVal) return suggestions;
    const q = searchVal.toLowerCase();
    return suggestions.filter(n => n.toLowerCase().includes(q) && n.toLowerCase() !== value?.toLowerCase());
  }, [searchVal, suggestions, value]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={searchVal}
        onChange={(e) => {
          setSearchVal(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
        }}
        style={inputStyle || inputSt}
        placeholder={placeholder}
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          zIndex: 50,
          maxHeight: 180,
          overflowY: "auto",
          marginTop: 4
        }}>
          {filteredSuggestions.map((s, idx) => (
            <div
              key={idx}
              onMouseDown={() => {
                setSearchVal(s);
                onChange(s);
                setIsOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                borderBottom: "1px solid #F1F5F9",
                color: "#1E293B",
                textAlign: "left"
              }}
              onMouseEnter={(e) => e.target.style.background = "#F1F5F9"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function XeTruyTimForm({ initial, officerList, allItems, huePhuongXa, onSave, onClose, isMobile, currentUser }) {
  const HUE_PX = huePhuongXa || [];

  const nextMaSo = useMemo(() => {
    if (initial?.ma_so) return initial.ma_so;
    const nums = (allItems || []).map(i => {
      const m = (i.ma_so || "").match(/XTT-(\d{4})-(\d+)/);
      return m ? parseInt(m[2]) : 0;
    });
    const year = new Date().getFullYear();
    const next = (Math.max(0, ...nums) + 1).toString().padStart(3, "0");
    return `XTT-${year}-${next}`;
  }, [allItems, initial]);

  const [form, setForm] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    return {
      ma_so: nextMaSo,
      bien_so: "",
      hang_xe: "Honda",
      loai_xe: "",
      mau_xe: "Đen",
      noi_mat: "",
      ten_chu_xe: "",
      chu_ngay_sinh: "",
      chu_dia_chi: "",
      chu_dien_thoai: "",
      chu_cccd: "",
      lien_quan_vu_an: "Xe bị mất trộm",
      ngay_phat_lenh: todayStr,
      deadline: "",
      can_bo_phu_trach: currentUser?.name || "",
      trang_thai: "dang_truy_tim",
      priority: "cao",
      status: "dang_xu_ly",
      anh_url: "",
      ghi_chu: "",
      ...initial || {}
    };
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputRef = useRef();

  const loaiXeSuggestions = useMemo(() => {
    return Array.from(new Set((allItems || []).map(i => i.loai_xe).filter(Boolean)));
  }, [allItems]);

  const handleAnhXe = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.75);
      set('anh_url', compressed);
    } catch (err) {
      console.error(err);
      alert("Không thể nén ảnh!");
    }
  };

  const secLabel = (icon, txt, color, bg, border) => (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "9px 14px", margin: "6px 0 12px", fontSize: 12, color, fontWeight: 700 }}>
      {icon} {txt}
    </div>
  );

  return (
    <div>
      {secLabel("🚗", "Thông tin xe", "#C2410C", "#FFF7ED", "#FED7AA")}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Mã số">
          <input value={form.ma_so || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed", fontWeight: 700 }} />
        </FormField>
        <FormField label="Biển số xe" required>
          <input value={form.bien_so || ""} onChange={e => set("bien_so", e.target.value)} style={{ ...inputSt, fontWeight: 700, letterSpacing: 1, fontFamily: "monospace" }} placeholder="VD: 75A-12345" />
        </FormField>
        <FormField label="Hãng xe">
          <AutocompleteInput value={form.hang_xe} onChange={v => set("hang_xe", v)} suggestions={HANG_XE_LIST} placeholder="Nhập hoặc chọn hãng xe..." />
        </FormField>
        <FormField label="Loại xe (model)">
          <AutocompleteInput value={form.loai_xe} onChange={v => set("loai_xe", v)} suggestions={loaiXeSuggestions} placeholder="Nhập hoặc chọn loại xe..." />
        </FormField>
        <FormField label="Màu sắc">
          <select value={form.mau_xe || ""} onChange={e => set("mau_xe", e.target.value)} style={selectSt}>
            {MAU_XE_LIST.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Trạng thái">
          <select 
            value={form.trang_thai || "dang_truy_tim"} 
            onChange={e => {
              const val = e.target.value;
              setForm(prev => ({
                ...prev,
                trang_thai: val,
                priority: val === "dinh_tim" ? "" : "cao"
              }));
            }} 
            style={selectSt}
          >
            <option value="dang_truy_tim">🔍 Đang truy tìm</option>
            <option value="dinh_tim">✅ Đình tìm</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="📍 Nơi mất / Nơi phát hiện mất xe">
            <AutocompleteInput value={form.noi_mat} onChange={v => set("noi_mat", v)} suggestions={HUE_PX} placeholder="Nhập hoặc chọn phường/xã..." />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1", marginBottom: 12 }}>
          <FormField label="Ảnh phương tiện (Ảnh xe)">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{ width: 100, height: 75, background: "#F1F5F9", borderRadius: 10, border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}
                onClick={() => inputRef.current?.click()}
              >
                {form.anh_url ? (
                  <img src={form.anh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Ảnh xe" />
                ) : (
                  <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 11 }}>
                    <div style={{ fontSize: 24 }}>🏍️</div>
                    <div>Thêm ảnh xe</div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAnhXe} />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  style={{ padding: "8px 16px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}
                >
                  📁 Chọn ảnh xe
                </button>
                {form.anh_url && (
                  <button type="button" onClick={() => set('anh_url', '')} style={{ padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕ Xóa ảnh xe</button>
                )}
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Định dạng: JPG, PNG. Ảnh rõ biển kiểm soát và kiểu dáng xe.</div>
              </div>
            </div>
          </FormField>
        </div>
      </div>

      {secLabel("👤", "Thông tin chủ xe", "#374151", "#F8FAFC", "#E5E7EB")}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Họ tên chủ xe">
          <input value={form.ten_chu_xe || ""} onChange={e => set("ten_chu_xe", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Số điện thoại">
          <input value={form.chu_dien_thoai || ""} onChange={e => set("chu_dien_thoai", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="CCCD/CMND">
          <input value={form.chu_cccd || ""} onChange={e => set("chu_cccd", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Ngày sinh chủ xe">
          <input type="date" value={form.chu_ngay_sinh || ""} onChange={e => set("chu_ngay_sinh", e.target.value)} style={inputSt} />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Địa chỉ chủ xe">
            <input value={form.chu_dia_chi || ""} onChange={e => set("chu_dia_chi", e.target.value)} style={inputSt} />
          </FormField>
        </div>
      </div>

      {secLabel("⚠️", "Thông tin nghiệp vụ", "#92400E", "#FEF3C7", "#FDE68A")}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Lý do truy tìm / Vụ án liên quan">
            <input value={form.lien_quan_vu_an || ""} onChange={e => set("lien_quan_vu_an", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Ngày phát lệnh">
          <input type="date" value={form.ngay_phat_lenh || ""} onChange={e => set("ngay_phat_lenh", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Hạn tìm kiếm">
          <input type="date" value={form.deadline || ""} onChange={e => set("deadline", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ phụ trách">
          <select value={form.can_bo_phu_trach || ""} onChange={e => set("can_bo_phu_trach", e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Ưu tiên">
          <select 
            value={form.trang_thai === "dinh_tim" ? "" : (form.priority || "cao")} 
            disabled={true} 
            style={{ ...selectSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }}
          >
            <option value="">Không đặt (Đã đình tìm)</option>
            <option value="cao">Cao (Đang truy tìm)</option>
            <option value="trung_binh">Trung bình</option>
            <option value="thap">Thấp</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={form.ghi_chu || ""} onChange={e => set("ghi_chu", e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(form)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#EA580C,#C2410C)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}
