"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StatusBadge,
  RankBadge,
  Modal,
  FormField,
  UserAvatar,
  getStatus,
  compressImage,
  exportToPrint,
  exportToWord,
  formatVNdate,
  getShortName
} from '@/app/components/shared';

const inputSt = { width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectSt = { ...inputSt, background: "#fff" };
const textareaSt = { ...inputSt, resize: "vertical", minHeight: 80 };

const TOI_DANH_LIST = [
  "Trộm cắp tài sản",
  "Cướp tài sản",
  "Cướp giật tài sản",
  "Lừa đảo chiếm đoạt tài sản",
  "Lừa đảo chiếm đoạt",
  "Lừa đảo qua mạng",
  "Lạm dụng tín nhiệm chiếm đoạt",
  "Huỷ hoại tài sản",
  "Cho vay lãi nặng",
  "Cố ý gây thương tích",
  "Giết người",
  "Ma tuý",
  "Tàng trỳ ma túý",
  "Mua bán ma túý",
  "Tham nhũng",
  "Đánh bạc",
  "Tổ chức đánh bạc",
  "Gây rối trật tự",
  "Cướp có vũ khí",
  "Môi giới mại dâm",
  "Hành hung cảnh sát",
  "Chiếm đoạt tài sản",
  "Nhân chứng vụ án cướp",
  "Liên quan vụ lừa đảo",
  "Người biến mất khả nghi",
  "Khác"
];

const TRANG_THAI_DT = {
  dang_truy_na: { label: "Đang truy nã", color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
  dang_na: { label: "Đang truy nã", color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
  dinh_na: { label: "Đình nã", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  dang_truy_tim: { label: "Đang truy tìm", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  dang_tim: { label: "Đang truy tìm", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  dinh_tim: { label: "Đình tìm", color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" }
};

function TrangThaiDTBadge({ tt }) {
  const cfg = TRANG_THAI_DT[tt] || TRANG_THAI_DT.dang_truy_tim;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function SubjectAvatar({ name, size = 80, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        style={{ width: size, height: size, borderRadius: 12, objectFit: "cover", border: "2px solid #E5E7EB", flexShrink: 0 }} 
        alt={name} 
      />
    );
  }
  const initials = (name || "?").trim().split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, background: "linear-gradient(135deg,#374151,#111827)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: size * 0.3, border: "2px solid #E5E7EB", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function TruyNaTimView({ data, onDataChange, currentUser, addLog, users, setActivePage, setHighlightUser, selectedRecord, clearSelectedRecord, isMobile }) {
  const truy_na_items = data["truy_na"] || [];
  const truy_tim_items = data["truy_tim"] || [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [tab, setTab] = useState("truy_na");
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [filterToiDanh, setFilterToiDanh] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [sortBy, setSortBy] = useState("ngay_desc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [doiTuongPopup, setDoiTuongPopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);
  const [lenhPopup, setLenhPopup] = useState(null);

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const isOfficer = currentUser.role === "officer";
  const canAddNew = isAdmin || isOfficer;
  const canEdit = (item) => isAdmin || (isOfficer && item.nguoi_nhap === currentUser.name);
  const canDelete = (item) => currentUser.role === "admin";
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);

  const items = tab === "truy_na" ? truy_na_items : truy_tim_items;
  const moduleKey = tab === "truy_na" ? "truy_na" : "truy_tim";

  const total_na = truy_na_items.length;
  const dang_na = truy_na_items.filter((i) => !i.trang_thai_dt || i.trang_thai_dt === "dang_truy_na" || i.trang_thai_dt === "dang_na").length;
  const dinh_na = truy_na_items.filter((i) => i.trang_thai_dt === "dinh_na").length;

  const total_tim = truy_tim_items.length;
  const dang_tim = truy_tim_items.filter((i) => !i.trang_thai_dt || i.trang_thai_dt === "dang_truy_tim" || i.trang_thai_dt === "dang_tim").length;
  const dinh_tim = truy_tim_items.filter((i) => i.trang_thai_dt === "dinh_tim").length;

  const toiDanhList = useMemo(() => {
    return [...new Set([...truy_na_items, ...truy_tim_items].map((i) => i.toi_danh || i.ly_do).filter(Boolean))];
  }, [truy_na_items, truy_tim_items]);

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) {
      list = list.filter((i) => Object.values(i).some((v) => String(v).toLowerCase().includes(q)));
    }
    if (filterTrangThai !== "all") {
      list = list.filter((i) => {
        const status = i.trang_thai_dt || (tab === "truy_na" ? "dang_truy_na" : "dang_truy_tim");
        // normalize status for query
        if (filterTrangThai === "dang_truy_na" || filterTrangThai === "dang_na") {
          return status === "dang_truy_na" || status === "dang_na";
        }
        if (filterTrangThai === "dang_truy_tim" || filterTrangThai === "dang_tim") {
          return status === "dang_truy_tim" || status === "dang_tim";
        }
        return status === filterTrangThai;
      });
    }
    if (filterToiDanh !== "all") {
      list = list.filter((i) => (i.toi_danh || i.ly_do) === filterToiDanh);
    }
    if (filterCanBo !== "all") {
      list = list.filter((i) => i.phu_trach && i.phu_trach.includes(filterCanBo));
    }

    if (sortBy === "ngay_desc") {
      list.sort((a, b) => new Date(b.ngay_phat_lenh || b.ngay_quyet_dinh || 0) - new Date(a.ngay_phat_lenh || a.ngay_quyet_dinh || 0));
    }
    if (sortBy === "ngay_asc") {
      list.sort((a, b) => new Date(a.ngay_phat_lenh || a.ngay_quyet_dinh || 0) - new Date(b.ngay_phat_lenh || b.ngay_quyet_dinh || 0));
    }
    if (sortBy === "ten") {
      list.sort((a, b) => (a.ho_ten || "").localeCompare(b.ho_ten || ""));
    }
    if (sortBy === "ma_so") {
      list.sort((a, b) => (a.ma_so || "").localeCompare(b.ma_so || ""));
    }
    return list;
  }, [items, search, filterTrangThai, filterToiDanh, filterCanBo, sortBy, tab]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [items, search, filterTrangThai, filterToiDanh, filterCanBo, sortBy, tab]);

  useEffect(() => {
    if (selectedRecord && (selectedRecord._page === "truy_na_tim" || selectedRecord._mod?.id === "truy_na_tim" || selectedRecord._mod?.id === "truy_na" || selectedRecord._mod?.id === "truy_tim")) {
      const isNa = selectedRecord.so_lenh_truy_na !== undefined || selectedRecord.toi_danh !== undefined || selectedRecord._mod?.id === "truy_na";
      if (isNa) {
        setTab("truy_na");
      } else {
        setTab("truy_tim");
      }
      
      const list = isNa ? truy_na_items : truy_tim_items;
      const found = list.find(i => i.id === selectedRecord.id || i.ma_so === selectedRecord.ma_so);
      if (found) {
        setDoiTuongPopup(found);
      } else {
        setDoiTuongPopup(selectedRecord);
      }
      if (clearSelectedRecord) {
        clearSelectedRecord();
      }
    }
  }, [selectedRecord, truy_na_items, truy_tim_items, clearSelectedRecord]);

  const handleSave = (form) => {
    const cur = data[moduleKey] || [];
    const f = { ...form, nguoi_nhap: form.nguoi_nhap || currentUser.name };
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật đối tượng: ${f.ho_ten}`, moduleKey);
    } else {
      const id = Math.max(0, ...cur.map((i) => i.id)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm đối tượng ${tab === "truy_na" ? "truy nã" : "truy tìm"}: ${f.ho_ten}`, moduleKey);
    }
    onDataChange(moduleKey, nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa đối tượng "${item.ho_ten}"?`)) return;
    onDataChange(moduleKey, (data[moduleKey] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa đối tượng: ${item.ho_ten}`, moduleKey);
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return;
    const myNA = truy_na_items.filter((i) => i.phu_trach && i.phu_trach.includes(name));
    const myTIM = truy_tim_items.filter((i) => i.phu_trach && i.phu_trach.includes(name));
    setCanBoPopup({
      ...u,
      na_total: myNA.length,
      na_dang: myNA.filter((i) => !i.trang_thai_dt || i.trang_thai_dt === "dang_truy_na" || i.trang_thai_dt === "dang_na").length,
      na_dinh: myNA.filter((i) => i.trang_thai_dt === "dinh_na").length,
      tim_total: myTIM.length,
      tim_dang: myTIM.filter((i) => !i.trang_thai_dt || i.trang_thai_dt === "dang_truy_tim" || i.trang_thai_dt === "dang_tim").length,
      tim_dinh: myTIM.filter((i) => i.trang_thai_dt === "dinh_tim").length
    });
  };

  const tabStyle = (active, c1, c2) => ({
    padding: "10px 28px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    borderRadius: "10px 10px 0 0",
    transition: "all 0.2s",
    background: active ? `linear-gradient(135deg,${c1},${c2})` : "#F1F5F9",
    color: active ? "#fff" : "#64748B",
    boxShadow: active ? "0 -4px 12px rgba(0,0,0,0.15)" : "none",
    position: "relative",
    zIndex: active ? 2 : 1
  });

  const isNA = tab === "truy_na";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>🎯 Truy Nã – Truy Tìm</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý đối tượng truy nã và truy tìm</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{ padding: "10px 20px", background: isNA ? "linear-gradient(135deg,#DC2626,#B91C1C)" : "linear-gradient(135deg,#D97706,#B45309)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: isNA ? "0 4px 12px rgba(220,38,38,0.3)" : "0 4px 12px rgba(217,119,6,0.3)", width: isMobile ? "100%" : "auto" }}
          >
            + Thêm {isNA ? "đối tượng truy nã" : "đối tượng truy tìm"}
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 18 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm tên đối tượng, mã số, tội danh, năm sinh, quê quán, cán bộ..."
          style={{ width: "100%", padding: "13px 16px 13px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
          onFocus={(e) => e.target.style.borderColor = isNA ? "#DC2626" : "#D97706"}
          onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {/* Truy Na Box */}
        <div style={{ background: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", borderRadius: 14, padding: isMobile ? 8 : 16, border: "1px solid #FECACA", boxShadow: "0 2px 8px rgba(220,38,38,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🚨</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#DC2626" }}>Truy Nã</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 6 }}>
            {[
              { l: "Tổng", v: total_na, c: "#DC2626", bg: "#fff" },
              { l: "Đang truy nã", v: dang_na, c: "#B91C1C", bg: "#FEF2F2" },
              { l: "Đình nã", v: dinh_na, c: "#6B7280", bg: "#F9FAFB" }
            ].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: "center", padding: isMobile ? "6px 2px" : "10px 6px", background: s.bg, borderRadius: 10, border: "1px solid #FEE2E2", cursor: "pointer" }}
                onClick={() => {
                  setTab("truy_na");
                  if (i > 0) setFilterTrangThai(i === 1 ? "dang_truy_na" : "dinh_na");
                  else setFilterTrangThai("all");
                }}
              >
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: isMobile ? 8 : 9, color: "#94A3B8", fontWeight: 700, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Truy Tim Box */}
        <div style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", borderRadius: 14, padding: isMobile ? 8 : 16, border: "1px solid #FDE68A", boxShadow: "0 2px 8px rgba(217,119,6,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#D97706" }}>Truy Tìm</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 6 }}>
            {[
              { l: "Tổng", v: total_tim, c: "#D97706", bg: "#fff" },
              { l: "Đang truy tìm", v: dang_tim, c: "#B45309", bg: "#FFFBEB" },
              { l: "Đình tìm", v: dinh_tim, c: "#6B7280", bg: "#F9FAFB" }
            ].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: "center", padding: isMobile ? "6px 2px" : "10px 6px", background: s.bg, borderRadius: 10, border: "1px solid #FDE68A", cursor: "pointer" }}
                onClick={() => {
                  setTab("truy_tim");
                  if (i > 0) setFilterTrangThai(i === 1 ? "dang_truy_tim" : "dinh_tim");
                  else setFilterTrangThai("all");
                }}
              >
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: isMobile ? 8 : 9, color: "#94A3B8", fontWeight: 700, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", flexShrink: 0, width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 4 : 0 }}>Lọc:</span>
        <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 180, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả trạng thái</option>
          {isNA ? (
            <>
              <option value="dang_truy_na">🚨 Đang truy nã</option>
              <option value="dinh_na">✅ Đình nã</option>
            </>
          ) : (
            <>
              <option value="dang_truy_tim">🔍 Đang truy tìm</option>
              <option value="dinh_tim">✅ Đình tìm</option>
            </>
          )}
        </select>
        <select value={filterToiDanh} onChange={(e) => setFilterToiDanh(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 210, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả tội danh / lý do</option>
          {toiDanhList.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={filterCanBo} onChange={(e) => setFilterCanBo(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 190, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả cán bộ</option>
          {officerList.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="ngay_desc">📅 Phát lệnh gần đây</option>
          <option value="ngay_asc">📅 Phát lệnh cũ nhất</option>
          <option value="ten">🔤 Theo tên</option>
          <option value="ma_so">🔢 Theo mã số</option>
        </select>
        {(filterTrangThai !== "all" || filterToiDanh !== "all" || filterCanBo !== "all" || search) && (
          <button
            onClick={() => {
              setFilterTrangThai("all");
              setFilterToiDanh("all");
              setFilterCanBo("all");
              setSearch("");
            }}
            style={{ padding: "7px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
          >
            ✕ Xóa lọc
          </button>
        )}
        <button
          onClick={() => {
            const isNa = tab === "truy_na";
            const title = isNa ? "DANH SÁCH ĐỐI TƯỢNG TRUY NÃ" : "DANH SÁCH ĐỐI TƯỢNG/PHƯƠNG TIỆN TRUY TÌM";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = isNa 
              ? ["Mã số", "Họ tên", "Tội danh", "Lệnh truy nã số", "Ngày phát lệnh", "Trạng thái", "Cán bộ thụ lý"]
              : ["Mã số", "Họ tên", "Thông tin cần tìm", "Quyết định truy tìm số", "Ngày quyết định", "Trạng thái", "Cán bộ thụ lý"];
            const rows = filtered.map(item => isNa ? [
              item.ma_so || "—",
              item.ho_ten || "—",
              item.toi_danh || "—",
              item.so_lenh_truy_na || item.so_quyet_dinh || "—",
              item.ngay_phat_lenh || item.ngay_quyet_dinh || "—",
              item.trang_thai_dt === "da_bat" ? "Đã bắt" : "Đang truy nã",
              item.phu_trach || "—"
            ] : [
              item.ma_so || "—",
              item.ho_ten || "—",
              item.ly_do || item.dac_diem || "—",
              item.so_quyet_dinh || "—",
              item.ngay_quyet_dinh || "—",
              item.trang_thai_dt === "da_tim_thay" ? "Đã tìm thấy" : "Đang truy tìm",
              item.phu_trach || "—"
            ]);
            exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          🖨️ In
        </button>
        <button
          onClick={() => {
            const isNa = tab === "truy_na";
            const title = isNa ? "DANH SÁCH ĐỐI TƯỢNG TRUY NÃ" : "DANH SÁCH ĐỐI TƯỢNG/PHƯƠNG TIỆN TRUY TÌM";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = isNa 
              ? ["Mã số", "Họ tên", "Tội danh", "Lệnh truy nã số", "Ngày phát lệnh", "Trạng thái", "Cán bộ thụ lý"]
              : ["Mã số", "Họ tên", "Thông tin cần tìm", "Quyết định truy tìm số", "Ngày quyết định", "Trạng thái", "Cán bộ thụ lý"];
            const rows = filtered.map(item => isNa ? [
              item.ma_so || "—",
              item.ho_ten || "—",
              item.toi_danh || "—",
              item.so_lenh_truy_na || item.so_quyet_dinh || "—",
              item.ngay_phat_lenh || item.ngay_quyet_dinh || "—",
              item.trang_thai_dt === "da_bat" ? "Đã bắt" : "Đang truy nã",
              item.phu_trach || "—"
            ] : [
              item.ma_so || "—",
              item.ho_ten || "—",
              item.ly_do || item.dac_diem || "—",
              item.so_quyet_dinh || "—",
              item.ngay_quyet_dinh || "—",
              item.trang_thai_dt === "da_tim_thay" ? "Đã tìm thấy" : "Đang truy tìm",
              item.phu_trach || "—"
            ]);
            exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: isNa ? "danh_sach_truy_na" : "danh_sach_truy_tim" });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 12, color: "#94A3B8", width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{filtered.length}/{items.length} đối tượng</div>
      </div>

      {/* Tabs list */}
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
        <button style={tabStyle(isNA, "#DC2626", "#B91C1C")} onClick={() => { setTab("truy_na"); setFilterTrangThai("all"); }}>
          🚨 Truy Nã
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.2)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>{truy_na_items.length}</span>
        </button>
        <button style={tabStyle(!isNA, "#D97706", "#B45309")} onClick={() => { setTab("truy_tim"); setFilterTrangThai("all"); }}>
          🔍 Truy Tìm
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.2)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>{truy_tim_items.length}</span>
        </button>
      </div>

      {/* Main Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: isNA ? "linear-gradient(135deg,#7F1D1D,#DC2626)" : "linear-gradient(135deg,#78350F,#D97706)" }}>
                {(isNA ? ["#", "Tên đối tượng", "Tội danh", "Số QĐ Truy nã", "Cán bộ thụ lý", "Trạng thái", "Thao tác"] : ["#", "Tên đối tượng", "Lý do truy tìm", "Số QĐ Truy tìm", "Cán bộ thụ lý", "Trạng thái", "Thao tác"]).map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 56, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.25 }}>🎯</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Không có đối tượng nào</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>Thử thay đổi bộ lọc hoặc tìm kiếm</div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const isDone = item.trang_thai_dt === "dinh_na" || item.trang_thai_dt === "dinh_tim";
                  const rowBg = !isDone && idx % 2 === 0 ? "#fff" : !isDone ? "#FAFBFC" : "#F9FAFB";
                  const currentStatus = item.trang_thai_dt || (isNA ? "dang_truy_na" : "dang_truy_tim");
                  return (
                    <tr
                      key={item.id || idx}
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg, transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isNA ? "#FFF5F5" : "#FFFBF0"}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 36 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td style={{ padding: "12px 14px", minWidth: 200 }}>
                        <button
                          onClick={() => setDoiTuongPopup(item)}
                          style={{ border: "none", background: "none", color: "#1E293B", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, textAlign: "left", display: "block" }}
                          onMouseEnter={(e) => e.target.style.color = isNA ? "#DC2626" : "#D97706"}
                          onMouseLeave={(e) => e.target.style.color = "#1E293B"}
                        >
                          {item.ho_ten || "—"}
                        </button>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3, lineHeight: 1.6 }}>
                          {item.nam_sinh && <span style={{ marginRight: 8 }}>NS: {item.nam_sinh}</span>}
                          {item.que_quan && <span style={{ marginRight: 8 }}>QQ: {item.que_quan}</span>}
                          {item.thuong_tru && <span>TT: {item.thuong_tru}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                        <span style={{ background: isNA ? "#FEF2F2" : "#FFFBEB", color: isNA ? "#B91C1C" : "#B45309", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-block", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {(isNA ? item.toi_danh : item.ly_do) || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        {(isNA ? item.so_lenh_truy_na : item.so_quyet_dinh) ? (
                          <button
                            onClick={() => setLenhPopup(item)}
                            style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 11, fontWeight: 700, padding: 0, fontFamily: "monospace", textDecoration: "underline dotted", textUnderlineOffset: 3, display: "flex", alignItems: "center", gap: 4 }}
                          >
                            {isNA ? item.so_lenh_truy_na : item.so_quyet_dinh}
                            {(isNA ? item.anh_lenh_url : item.anh_quyet_dinh_url) ? (
                              <span style={{ fontSize: 10, background: "#EEF2FF", color: "#6366F1", padding: "1px 5px", borderRadius: 4, marginLeft: 3 }}>📷</span>
                            ) : null}
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        {item.phu_trach ? (
                          <button
                            onClick={() => handleCanBoClick(item.phu_trach)}
                            style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <UserAvatar user={users.find(u => u.name === item.phu_trach) || { name: item.phu_trach, role: "viewer" }} size={24} />
                            <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortName(item.phu_trach)}</span>
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <TrangThaiDTBadge tt={currentStatus} />
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => setDoiTuongPopup(item)} style={{ border: "none", background: isNA ? "#FEF2F2" : "#FFFBEB", color: isNA ? "#DC2626" : "#D97706", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Xem</button>
                          {canEdit(item) && (
                            <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ border: "none", background: "#FFFBEB", color: "#B45309", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Sửa</button>
                          )}
                          {canDelete(item) && (
                            <button onClick={() => handleDelete(item)} style={{ border: "none", background: "#FFF5F5", color: "#DC2626", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Xóa</button>
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

        {/* Footer Pagination */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: "#FAFBFC" }}>
          <div>
            Hiển thị <b style={{ color: "#374151" }}>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> đối tượng {isNA ? "truy nã" : "truy tìm"}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Hiển thị:</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "3px 6px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" }}>
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
                    <button key={p} onClick={() => setPage(p)} style={{ padding: "4px 9px", border: "1px solid " + (isAct ? "#0284C7" : "#E2E8F0"), borderRadius: 6, background: isAct ? "#0284C7" : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontSize: 11, fontWeight: isAct ? 700 : 400, minWidth: 30 }}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>»</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popups */}
      {doiTuongPopup && (
        <Modal 
          title={tab === "truy_na" ? "🚨 Chi tiết đối tượng truy nã" : "🔍 Chi tiết đối tượng truy tìm"} 
          onClose={() => setDoiTuongPopup(null)}
          wide
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2.2fr", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 140, height: 180, background: "#F1F5F9", borderRadius: 12, border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", overflow: "hidden" }}>
                {doiTuongPopup.anh_url ? (
                  <img src={doiTuongPopup.anh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                ) : (
                  <span style={{ fontSize: 48, color: "#94A3B8" }}>👤</span>
                )}
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>{doiTuongPopup.ho_ten}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", marginTop: 8 }}>
                <span style={{ background: isNA ? "#FEF2F2" : "#FFFBEB", color: isNA ? "#DC2626" : "#D97706", padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                  {doiTuongPopup.ma_so}
                </span>
                <TrangThaiDTBadge tt={doiTuongPopup.trang_thai_dt || (isNA ? "dang_truy_na" : "dang_truy_tim")} />
              </div>
            </div>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
                <div><strong>Năm sinh:</strong> {doiTuongPopup.nam_sinh || "—"}</div>
                <div><strong>Giới tính:</strong> {doiTuongPopup.gioi_tinh || "—"}</div>
                <div><strong>CCCD/CMND:</strong> {doiTuongPopup.cccd || "—"}</div>
                <div><strong>Quê quán:</strong> {doiTuongPopup.que_quan || "—"}</div>
                <div style={{ gridColumn: "1/-1" }}><strong>Thường trú:</strong> {doiTuongPopup.thuong_tru || "—"}</div>
                <div style={{ gridColumn: "1/-1" }}><strong>{isNA ? "Tội danh" : "Lý do truy tìm"}:</strong> {isNA ? doiTuongPopup.toi_danh : doiTuongPopup.ly_do || "—"}</div>
                <div><strong>{isNA ? "Số lệnh truy nã" : "Số QĐ truy tìm"}:</strong> {isNA ? doiTuongPopup.so_lenh_truy_na : doiTuongPopup.so_quyet_dinh || "—"}</div>
                <div><strong>Ngày phát lệnh:</strong> {formatVNdate(doiTuongPopup.ngay_phat_lenh || doiTuongPopup.ngay_quyet_dinh)}</div>
                <div><strong>Ngày bắt đầu:</strong> {formatVNdate(doiTuongPopup.ngay_bat_dau)}</div>
                <div><strong>Cán bộ thụ lý:</strong> {doiTuongPopup.phu_trach || "—"}</div>
                <div style={{ gridColumn: "1/-1" }}><strong>Đặc điểm nhận dạng:</strong> {doiTuongPopup.dac_diem_nhan_dang || "—"}</div>
              </div>

              {doiTuongPopup.ghi_chu && (
                <div style={{ marginTop: 12, borderTop: "1px solid #F1F5F9", paddingTop: 10, fontSize: 13 }}>
                  <strong>Ghi chú:</strong>
                  <div style={{ color: "#64748B", marginTop: 4 }}>{doiTuongPopup.ghi_chu}</div>
                </div>
              )}

              {/* Lệnh / Quyết định đính kèm */}
              {(doiTuongPopup.anh_lenh_url || doiTuongPopup.anh_quyet_dinh_url) && (
                <div style={{ marginTop: 14, borderTop: "1px solid #E2E8F0", paddingTop: 10, fontSize: 13 }}>
                  <strong>Quyết định đính kèm:</strong>
                  <div style={{ marginTop: 8 }}>
                     <div 
                      onClick={() => setLenhPopup(doiTuongPopup)}
                      style={{ width: 120, height: 160, borderRadius: 10, border: "1px solid #E2E8F0", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "relative", background: "#F8FAFC" }}
                    >
                      <img src={doiTuongPopup.anh_lenh_url || doiTuongPopup.anh_quyet_dinh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Tờ quyết định" />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: "bold" }}>🔍 Xem quyết định</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {canBoPopup && (
        <Modal title="👮 Thông tin hồ sơ cán bộ" onClose={() => setCanBoPopup(null)}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "10px 0" }}>
            <UserAvatar user={canBoPopup} size={64} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{canBoPopup.name}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {canBoPopup.cap_bac && <RankBadge capBac={canBoPopup.cap_bac} size={20} />}
                  Cấp bậc: <span style={{ fontWeight: 600, color: "#374151" }}>{canBoPopup.cap_bac || "—"}</span>
                </span>
                <span style={{ color: "#E2E8F0" }}>|</span>
                <span>
                  Chức vụ: <span style={{ fontWeight: 600, color: "#374151" }}>{canBoPopup.chuc_vu || "—"}</span>
                </span>
                <span style={{ color: "#E2E8F0" }}>|</span>
                <span>
                  Đơn vị: <span style={{ fontWeight: 600, color: "#374151" }}>{canBoPopup.department || "—"}</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div style={{ padding: 14, background: "#FEF2F2", borderRadius: 12, border: "1px solid #FEE2E2" }}>
              <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>🚨 Hồ sơ Truy Nã</div>
              <div style={{ display: "flex", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#DC2626" }}>{canBoPopup.na_total}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Tổng số</div>
                </div>
                <div style={{ borderLeft: "1px solid #FEE2E2" }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#B91C1C" }}>{canBoPopup.na_dang}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Đang nã</div>
                </div>
                <div style={{ borderLeft: "1px solid #FEE2E2" }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#6B7280" }}>{canBoPopup.na_dinh}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Đình nã</div>
                </div>
              </div>
            </div>

            <div style={{ padding: 14, background: "#FFFBEB", borderRadius: 12, border: "1px solid #FEF3C7" }}>
              <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>🔍 Hồ sơ Truy Tìm</div>
              <div style={{ display: "flex", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#D97706" }}>{canBoPopup.tim_total}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Tổng số</div>
                </div>
                <div style={{ borderLeft: "1px solid #FEF3C7" }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#B45309" }}>{canBoPopup.tim_dang}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Đang tìm</div>
                </div>
                <div style={{ borderLeft: "1px solid #FEF3C7" }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#6B7280" }}>{canBoPopup.tim_dinh}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Đình tìm</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
            <button
              onClick={() => setCanBoPopup(null)}
              style={{ padding: "9px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Đóng
            </button>
            <button
              onClick={() => {
                setCanBoPopup(null);
                if (setHighlightUser) setHighlightUser(canBoPopup.name);
                if (setActivePage) setActivePage("users");
              }}
              style={{ padding: "9px 16px", background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Xem chi tiết hồ sơ
            </button>
          </div>
        </Modal>
      )}

      {lenhPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setLenhPopup(null)}>
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 560, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", background: tab === "truy_na" ? "linear-gradient(135deg,#7F1D1D,#DC2626)" : "linear-gradient(135deg,#1E40AF,#2563EB)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>{tab === "truy_na" ? "📄 LỆNH TRUY NÃ" : "📄 QUYẾT ĐỊNH TRUY TÌM"}</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 4 }}>{tab === "truy_na" ? lenhPopup.so_lenh_truy_na : lenhPopup.so_quyet_dinh}</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>Đối tượng: {lenhPopup.ho_ten} · Ngày phát: {formatVNdate(lenhPopup.ngay_phat_lenh || lenhPopup.ngay_quyet_dinh)}</div>
              </div>
              <button onClick={() => setLenhPopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#fff" }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              {(tab === "truy_na" ? lenhPopup.anh_lenh_url : lenhPopup.anh_quyet_dinh_url) ? (
                <div style={{ textAlign: "center" }}>
                  <img src={tab === "truy_na" ? lenhPopup.anh_lenh_url : lenhPopup.anh_quyet_dinh_url} style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain", borderRadius: 10, border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} alt="Tờ lệnh" />
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>Ảnh {tab === "truy_na" ? "lệnh truy nã" : "quyết định truy tìm"} · {tab === "truy_na" ? lenhPopup.so_lenh_truy_na : lenhPopup.so_quyet_dinh}</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📄</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Chưa có ảnh tài liệu</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>Vào Sửa để đính kèm ảnh {tab === "truy_na" ? "lệnh truy nã" : "quyết định truy tìm"}</div>
                </div>
              )}
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { l: "Số hiệu", v: tab === "truy_na" ? lenhPopup.so_lenh_truy_na : lenhPopup.so_quyet_dinh },
                  { l: "Ngày phát lệnh", v: formatVNdate(lenhPopup.ngay_phat_lenh || lenhPopup.ngay_quyet_dinh) },
                  { l: "Ngày bắt đầu", v: formatVNdate(lenhPopup.ngay_bat_dau) },
                  { l: "Cán bộ thụ lý", v: lenhPopup.phu_trach },
                  { l: "Họ tên đối tượng", v: lenhPopup.ho_ten },
                  { l: "Tội danh/Lý do", v: lenhPopup.toi_danh || lenhPopup.ly_do },
                ].filter(f => f.v).map((f, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 3, letterSpacing: 0.5 }}>{f.l}</div>
                    <div style={{ padding: "7px 10px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12, color: "#1E293B", fontWeight: 500 }}>{f.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms Modal */}
      {showModal && (
        <Modal title={editItem ? `✏️ Chỉnh sửa đối tượng` : `➕ Thêm đối tượng ${isNA ? "truy nã" : "truy tìm"}`} onClose={() => { setShowModal(false); setEditItem(null); }}>
          {isNA ? (
            <TruyNaForm initial={editItem} officerList={officerList} allItems={truy_na_items} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} currentUser={currentUser} />
          ) : (
            <TruyTimForm initial={editItem} officerList={officerList} allItems={truy_tim_items} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} currentUser={currentUser} />
          )}
        </Modal>
      )}
    </div>
  );
}

function TruyNaForm({ initial, officerList, onSave, onClose, allItems, isMobile, currentUser }) {
  const nextId = React.useMemo(() => {
    if (initial?.ma_so) return initial.ma_so;
    const nums = (allItems || []).map(i => {
      const m = (i.ma_so || '').match(/TN-(\d{4})-(\d+)/);
      return m ? parseInt(m[2]) : 0;
    });
    const year = new Date().getFullYear();
    const next = (Math.max(0, ...nums) + 1).toString().padStart(3, '0');
    return `TN-${year}-${next}`;
  }, [allItems, initial]);

  const [form, setForm] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    return {
      ma_so: nextId,
      ho_ten: "", nam_sinh: "", que_quan: "", thuong_tru: "", cccd: "", gioi_tinh: "Nam",
      toi_danh: "Giết người",
      so_lenh_truy_na: "", ngay_phat_lenh: todayStr, ngay_bat_dau: "",
      phu_trach: currentUser?.name || "", trang_thai_dt: "dang_truy_na",
      dac_diem_nhan_dang: "", priority: "cao", status: "dang_xu_ly",
      anh_url: "", anh_lenh_url: "", ghi_chu: "",
      ...initial || {}
    };
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAnhDT = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.75);
      set('anh_url', compressed);
    } catch (err) {
      console.error(err);
      alert("Không thể nén ảnh đối tượng!");
    }
  };
  const handleAnhLenh = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1000, 1000, 0.8);
      set('anh_lenh_url', compressed);
    } catch (err) {
      console.error(err);
      alert("Không thể nén ảnh lệnh!");
    }
  };

  const inputRef = useRef();
  const lenhRef = useRef();

  const secLabel = txt => (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", margin: "6px 0 10px", fontSize: 12, color: "#DC2626", fontWeight: 700 }}>
      {txt}
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Mã số">
          <input value={form.ma_so || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed", fontWeight: 700 }} />
        </FormField>

        <FormField label="Tội danh">
          <select value={form.toi_danh || ""} onChange={e => set('toi_danh', e.target.value)} style={selectSt}>
            {TOI_DANH_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>

        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Họ và tên đối tượng" required>
            <input value={form.ho_ten || ""} onChange={e => set('ho_ten', e.target.value)} style={inputSt} />
          </FormField>
        </div>

        <FormField label="Năm sinh">
          <input value={form.nam_sinh || ""} onChange={e => set('nam_sinh', e.target.value)} style={inputSt} placeholder="VD: 1985" />
        </FormField>
        <FormField label="Giới tính">
          <select value={form.gioi_tinh || "Nam"} onChange={e => set('gioi_tinh', e.target.value)} style={selectSt}>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </FormField>
        <FormField label="CCCD/CMND">
          <input value={form.cccd || ""} onChange={e => set('cccd', e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Quê quán">
          <input value={form.que_quan || ""} onChange={e => set('que_quan', e.target.value)} style={inputSt} />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Thường trú">
            <input value={form.thuong_tru || ""} onChange={e => set('thuong_tru', e.target.value)} style={inputSt} />
          </FormField>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          {secLabel("📷 Ảnh đối tượng")}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{ width: 80, height: 100, background: "#F1F5F9", borderRadius: 10, border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}
              onClick={() => inputRef.current?.click()}
            >
              {form.anh_url ? (
                <img src={form.anh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Chân dung" />
              ) : (
                <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 11 }}>
                  <div style={{ fontSize: 24 }}>👤</div>
                  <div>Thêm ảnh</div>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAnhDT} />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={{ padding: "8px 16px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}
              >
                📁 Chọn ảnh chân dung
              </button>
              {form.anh_url && (
                <button type="button" onClick={() => set('anh_url', '')} style={{ padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕ Xóa ảnh</button>
              )}
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Định dạng: JPG, PNG. Ảnh chân dung rõ mặt</div>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          {secLabel("📄 Thông tin lệnh truy nã")}
        </div>
        <FormField label="Số lệnh truy nã">
          <input value={form.so_lenh_truy_na || ""} onChange={e => set('so_lenh_truy_na', e.target.value)} style={inputSt} placeholder="VD: LTN-003/2024" />
        </FormField>
        <FormField label="Trạng thái">
          <select value={form.trang_thai_dt || "dang_truy_na"} onChange={e => set('trang_thai_dt', e.target.value)} style={selectSt}>
            <option value="dang_truy_na">🚨 Đang truy nã</option>
            <option value="dinh_na">✅ Đình nã</option>
          </select>
        </FormField>
        <FormField label="Ngày phát lệnh">
          <input type="date" value={form.ngay_phat_lenh || ""} onChange={e => set('ngay_phat_lenh', e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Ngày bắt đầu">
          <input type="date" value={form.ngay_bat_dau || ""} onChange={e => set('ngay_bat_dau', e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ thụ lý">
          <select value={form.phu_trach || ""} onChange={e => set('phu_trach', e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Ưu tiên">
          <select value={form.priority || "cao"} onChange={e => set('priority', e.target.value)} style={selectSt}>
            <option value="cao">🔴 Cao</option>
            <option value="trung_binh">🟡 Trung bình</option>
            <option value="thap">🟢 Thấp</option>
          </select>
        </FormField>

        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="📎 Ảnh/Tài liệu lệnh truy nã">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <input ref={lenhRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleAnhLenh} />
              <button
                type="button"
                onClick={() => lenhRef.current?.click()}
                style={{ padding: "10px 16px", background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                📷 Chụp/tải ảnh tờ lệnh
              </button>
              {form.anh_lenh_url ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <img src={form.anh_lenh_url} style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 6, border: "1px solid #E2E8F0" }} alt="Tờ lệnh" />
                  <button type="button" onClick={() => set('anh_lenh_url', '')} style={{ padding: "3px 8px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "#94A3B8", alignSelf: "center" }}>Chưa có ảnh tờ lệnh</span>
              )}
            </div>
          </FormField>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Đặc điểm nhận dạng">
            <textarea value={form.dac_diem_nhan_dang || ""} onChange={e => set('dac_diem_nhan_dang', e.target.value)} style={textareaSt} placeholder="Chiều cao, màu da, đặc điểm nổi bật..." />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={form.ghi_chu || ""} onChange={e => set('ghi_chu', e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(form)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#DC2626,#B91C1C)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}

function TruyTimForm({ initial, officerList, onSave, onClose, allItems, isMobile, currentUser }) {
  const nextId = React.useMemo(() => {
    if (initial?.ma_so) return initial.ma_so;
    const nums = (allItems || []).map(i => {
      const m = (i.ma_so || '').match(/TT-(\d{4})-(\d+)/);
      return m ? parseInt(m[2]) : 0;
    });
    const year = new Date().getFullYear();
    const next = (Math.max(0, ...nums) + 1).toString().padStart(3, '0');
    return `TT-${year}-${next}`;
  }, [allItems, initial]);

  const [form, setForm] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    return {
      ma_so: nextId,
      ho_ten: "", nam_sinh: "", que_quan: "", thuong_tru: "", cccd: "", gioi_tinh: "Nam",
      ly_do: "Trộm cắp tài sản", so_quyet_dinh: "",
      ngay_quyet_dinh: todayStr, ngay_bat_dau: "", phu_trach: currentUser?.name || "",
      trang_thai_dt: "dang_truy_tim", dac_diem_nhan_dang: "",
      priority: "trung_binh", status: "dang_xu_ly",
      anh_url: "", anh_quyet_dinh_url: "", ghi_chu: "",
      ...initial || {}
    };
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAnhDT = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.75);
      set('anh_url', compressed);
    } catch (err) {
      console.error(err);
      alert("Không thể nén ảnh đối tượng!");
    }
  };
  const handleAnhQD = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const compressed = await compressImage(file, 1000, 1000, 0.8);
      set('anh_quyet_dinh_url', compressed);
    } catch (err) {
      console.error(err);
      alert("Không thể nén ảnh quyết định!");
    }
  };
  const inputRef = useRef();
  const qdRef = useRef();

  const secLabel = txt => (
    <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", margin: "6px 0 10px", fontSize: 12, color: "#B45309", fontWeight: 700 }}>
      {txt}
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Mã số">
          <input value={form.ma_so || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed", fontWeight: 700 }} />
        </FormField>
        <FormField label="Lý do truy tìm">
          <select value={form.ly_do || ""} onChange={e => set('ly_do', e.target.value)} style={selectSt}>
            {TOI_DANH_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Họ và tên đối tượng" required>
            <input value={form.ho_ten || ""} onChange={e => set('ho_ten', e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Năm sinh">
          <input value={form.nam_sinh || ""} onChange={e => set('nam_sinh', e.target.value)} style={inputSt} placeholder="VD: 1990" />
        </FormField>
        <FormField label="Giới tính">
          <select value={form.gioi_tinh || "Nam"} onChange={e => set('gioi_tinh', e.target.value)} style={selectSt}>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </FormField>
        <FormField label="CCCD/CMND">
          <input value={form.cccd || ""} onChange={e => set('cccd', e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Quê quán">
          <input value={form.que_quan || ""} onChange={e => set('que_quan', e.target.value)} style={inputSt} />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Thường trú">
            <input value={form.thuong_tru || ""} onChange={e => set('thuong_tru', e.target.value)} style={inputSt} />
          </FormField>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          {secLabel("📷 Ảnh đối tượng")}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{ width: 80, height: 100, background: "#F1F5F9", borderRadius: 10, border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}
              onClick={() => inputRef.current?.click()}
            >
              {form.anh_url ? (
                <img src={form.anh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Chân dung" />
              ) : (
                <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 11 }}>
                  <div style={{ fontSize: 24 }}>👤</div>
                  <div>Thêm ảnh</div>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAnhDT} />
              <button type="button" onClick={() => inputRef.current?.click()} style={{ padding: "8px 16px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>📁 Chọn ảnh chân dung</button>
              {form.anh_url && (
                <button type="button" onClick={() => set('anh_url', '')} style={{ padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕ Xóa ảnh</button>
              )}
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Ảnh chân dung rõ mặt, JPG/PNG</div>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "1/-1" }}>{secLabel("📄 Thông tin quyết định truy tìm")}</div>
        <FormField label="Số QĐ truy tìm">
          <input value={form.so_quyet_dinh || ""} onChange={e => set('so_quyet_dinh', e.target.value)} style={inputSt} placeholder="VD: QĐ-TT-004/2024" />
        </FormField>
        <FormField label="Trạng thái">
          <select value={form.trang_thai_dt || "dang_truy_tim"} onChange={e => set('trang_thai_dt', e.target.value)} style={selectSt}>
            <option value="dang_truy_tim">🔍 Đang truy tìm</option>
            <option value="dinh_tim">✅ Đình tìm</option>
          </select>
        </FormField>
        <FormField label="Ngày phát lệnh">
          <input type="date" value={form.ngay_quyet_dinh || ""} onChange={e => set('ngay_quyet_dinh', e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Ngày bắt đầu">
          <input type="date" value={form.ngay_bat_dau || ""} onChange={e => set('ngay_bat_dau', e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ thụ lý">
          <select value={form.phu_trach || ""} onChange={e => set('phu_trach', e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Ưu tiên">
          <select value={form.priority || "trung_binh"} onChange={e => set('priority', e.target.value)} style={selectSt}>
            <option value="cao">🔴 Cao</option>
            <option value="trung_binh">🟡 Trung bình</option>
            <option value="thap">🟢 Thấp</option>
          </select>
        </FormField>

        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="📎 Ảnh/Tài liệu quyết định truy tìm">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <input ref={qdRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleAnhQD} />
              <button type="button" onClick={() => qdRef.current?.click()} style={{ padding: "10px 16px", background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>📷 Chụp/tải ảnh tờ quyết định</button>
              {form.anh_quyet_dinh_url ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <img src={form.anh_quyet_dinh_url} style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 6, border: "1px solid #E2E8F0" }} alt="Tờ quyết định" />
                  <button type="button" onClick={() => set('anh_quyet_dinh_url', '')} style={{ padding: "3px 8px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: "#94A3B8", alignSelf: "center" }}>Chưa có ảnh tờ quyết định</span>
              )}
            </div>
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Đặc điểm nhận dạng">
            <textarea value={form.dac_diem_nhan_dang || ""} onChange={e => set('dac_diem_nhan_dang', e.target.value)} style={textareaSt} />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={form.ghi_chu || ""} onChange={e => set('ghi_chu', e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(form)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#D97706,#B45309)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}
