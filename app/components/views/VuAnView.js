"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  StatusBadge,
  RankBadge,
  Modal,
  FormField,
  UserAvatar,
  getStatus,
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
  "Lạm dụng tín nhiệm chiếm đoạt",
  "Huỷ hoại tài sản",
  "Cho vay lãi nặng",
  "Cố ý gây thương tích",
  "Giết người",
  "Ma tuý",
  "Tham nhũng",
  "Đánh bạc",
  "Gây rối trật tự",
  "Khác"
];

const TRANG_THAI_AN = {
  hien_hanh: { label: "Đang điều tra", color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  ket_thuc: { label: "Kết thúc điều tra", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  tam_dinh_chi: { label: "Tạm đình chỉ", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  dinh_chi: { label: "Đình chỉ", color: "#7C3AED", bg: "#F5F3FF", dot: "#8B5CF6" }
};

function TrangThaiAnBadge({ trang_thai_an }) {
  const cfg = TRANG_THAI_AN[trang_thai_an] || TRANG_THAI_AN.hien_hanh;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

export default function VuAnView({ data, onDataChange, currentUser, addLog, users, setActivePage, setHighlightUser, selectedRecord, clearSelectedRecord, isMobile }) {
  const items = data["vu_an"] || [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [filterToiDanh, setFilterToiDanh] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [filterDeadline, setFilterDeadline] = useState("all");
  const [sortBy, setSortBy] = useState("ngay_khoi_to_desc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [titlePopup, setTitlePopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const isOfficer = currentUser.role === "officer";
  const canAddNew = isAdmin || isOfficer;
  const canEdit = (item) => isAdmin || (isOfficer && item.nguoi_nhap === currentUser.name);
  const canDelete = (item) => currentUser.role === "admin";
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);

  const total = items.length;
  const hien_hanh = items.filter((i) => !i.trang_thai_an || i.trang_thai_an === "hien_hanh").length;
  const ket_thuc = items.filter((i) => i.trang_thai_an === "ket_thuc").length;
  const tam_dinh = items.filter((i) => i.trang_thai_an === "tam_dinh_chi").length;
  const dinh_chi = items.filter((i) => i.trang_thai_an === "dinh_chi").length;

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) list = list.filter((i) => Object.values(i).some((v) => String(v).toLowerCase().includes(q)));
    if (filterTrangThai !== "all") list = list.filter((i) => (i.trang_thai_an || "hien_hanh") === filterTrangThai);
    if (filterToiDanh !== "all") list = list.filter((i) => i.toi_danh === filterToiDanh);
    if (filterCanBo !== "all") list = list.filter((i) => i.tham_phan && i.tham_phan.includes(filterCanBo));
    if (filterDeadline === "qua_han") {
      list = list.filter((i) => (!i.trang_thai_an || i.trang_thai_an === "hien_hanh" || i.trang_thai_an === "tam_dinh_chi") && getStatus(i.deadline, i.status, i.thoi_hieu, i.trang_thai_an) === "qua_han");
    } else if (filterDeadline === "sap_het") {
      list = list.filter((i) => (!i.trang_thai_an || i.trang_thai_an === "hien_hanh" || i.trang_thai_an === "tam_dinh_chi") && getStatus(i.deadline, i.status, i.thoi_hieu, i.trang_thai_an) === "sap_het_han");
    }

    if (sortBy === "ngay_khoi_to_desc") list.sort((a, b) => new Date(b.ngay_khoi_to || 0) - new Date(a.ngay_khoi_to || 0));
    if (sortBy === "ngay_khoi_to_asc") list.sort((a, b) => new Date(a.ngay_khoi_to || 0) - new Date(b.ngay_khoi_to || 0));
    if (sortBy === "deadline_asc") list.sort((a, b) => new Date(a.deadline || "9999") - new Date(b.deadline || "9999"));
    if (sortBy === "ma_so") list.sort((a, b) => (a.ma_so || "").localeCompare(b.ma_so || ""));
    if (sortBy === "trang_thai") list.sort((a, b) => (a.trang_thai_an || "").localeCompare(b.trang_thai_an || ""));
    return list;
  }, [items, search, filterTrangThai, filterToiDanh, filterCanBo, filterDeadline, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [items, search, filterTrangThai, filterToiDanh, filterCanBo, filterDeadline, sortBy]);

  useEffect(() => {
    if (selectedRecord && (selectedRecord._page === "vu_an" || selectedRecord._mod?.id === "vu_an")) {
      const found = items.find(i => i.id === selectedRecord.id || i.ma_so === selectedRecord.ma_so);
      if (found) {
        setTitlePopup(found);
      } else {
        setTitlePopup(selectedRecord);
      }
      if (clearSelectedRecord) {
        clearSelectedRecord();
      }
    }
  }, [selectedRecord, items, clearSelectedRecord]);

  const handleSave = (form) => {
    const cur = data["vu_an"] || [];
    const f = { ...form, nguoi_nhap: form.nguoi_nhap || currentUser.name };
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật vụ án: ${f.ma_so}`, "vu_an");
    } else {
      const id = Math.max(0, ...cur.map((i) => i.id)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm vụ án: ${f.ma_so}`, "vu_an");
    }
    onDataChange("vu_an", nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa vụ án "${item.ten_vu_an}"?`)) return;
    onDataChange("vu_an", (data["vu_an"] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa vụ án: ${item.ma_so}`, "vu_an");
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return;
    const myItems = items.filter((i) => i.tham_phan && i.tham_phan.includes(name));
    setCanBoPopup({
      ...u,
      total_an: myItems.length,
      hien_hanh: myItems.filter((i) => !i.trang_thai_an || i.trang_thai_an === "hien_hanh").length,
      qua_han: myItems.filter((i) => (!i.trang_thai_an || i.trang_thai_an === "hien_hanh" || i.trang_thai_an === "tam_dinh_chi") && getStatus(i.deadline, i.status, i.thoi_hieu, i.trang_thai_an) === "qua_han").length,
      ket_thuc: myItems.filter((i) => i.trang_thai_an === "ket_thuc").length,
      tam_dinh: myItems.filter((i) => i.trang_thai_an === "tam_dinh_chi").length,
      dinh_chi: myItems.filter((i) => i.trang_thai_an === "dinh_chi").length
    });
  };

  const statCards = [
    { label: "Tổng số vụ án", value: total, icon: "⚖️", color: "#DC2626", bg: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: "#FECACA", filter: null },
    { label: "Đang điều tra", value: hien_hanh, icon: "🔵", color: "#2563EB", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "#BFDBFE", filter: "hien_hanh" },
    { label: "Kết thúc điều tra", value: ket_thuc, icon: "✅", color: "#6B7280", bg: "linear-gradient(135deg,#F9FAFB,#F3F4F6)", border: "#E5E7EB", filter: "ket_thuc" },
    { label: "Tạm đình chỉ", value: tam_dinh, icon: "⏸️", color: "#D97706", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "#FDE68A", filter: "tam_dinh_chi" },
    { label: "Đình chỉ", value: dinh_chi, icon: "🚫", color: "#7C3AED", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", border: "#DDD6FE", filter: "dinh_chi" }
  ];

  const ToiDanhBadge = ({ toi_danh }) => {
    const colors = {
      "Trộm cắp tài sản": ["#2563EB", "#EFF6FF"],
      "Cướp tài sản": ["#DC2626", "#FEF2F2"],
      "Cướp giật tài sản": ["#B91C1C", "#FEF2F2"],
      "Lừa đảo chiếm đoạt tài sản": ["#D97706", "#FFFBEB"],
      "Lạm dụng tín nhiệm chiếm đoạt": ["#92400E", "#FFFBEB"],
      "Huỷ hoại tài sản": ["#7C3AED", "#F5F3FF"],
      "Cho vay lãi nặng": ["#0891B2", "#ECFEFF"],
      "Cố ý gây thương tích": ["#EF4444", "#FEF2F2"],
      "Giết người": ["#7F1D1D", "#FEF2F2"],
      "Ma tuý": ["#1D4ED8", "#EFF6FF"],
      "Tham nhũng": ["#065F46", "#ECFDF5"],
      "Đánh bạc": ["#6D28D9", "#F5F3FF"],
      "Gây rối trật tự": ["#92400E", "#FFFBEB"]
    };
    const [c, bg] = colors[toi_danh] || ["#6B7280", "#F9FAFB"];
    return (
      <span style={{ background: bg, color: c, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
        {toi_danh || "—"}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>⚖️ Vụ Án</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý toàn bộ hồ sơ vụ án đang thụ lý</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#DC2626,#B91C1C)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(220,38,38,0.3)", width: isMobile ? "100%" : "auto" }}
          >
            + Thêm vụ án
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 18 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã số, tên vụ án, tội danh, bị can, cán bộ thụ lý..."
          style={{ width: "100%", padding: "13px 16px 13px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
          onFocus={(e) => e.target.style.borderColor = "#DC2626"}
          onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {statCards.map((s, i) => (
          <div
            key={i}
            onClick={() => s.filter && setFilterTrangThai(filterTrangThai === s.filter ? "all" : s.filter)}
            style={{ 
              background: s.bg, 
              borderRadius: 14, 
              padding: "14px 16px", 
              border: `2px solid ${s.filter && filterTrangThai === s.filter ? s.color : s.border}`, 
              cursor: s.filter ? "pointer" : "default", 
              transition: "all 0.2s", 
              transform: s.filter && filterTrangThai === s.filter ? "scale(1.03)" : "scale(1)", 
              boxShadow: s.filter && filterTrangThai === s.filter ? `0 4px 16px ${s.color}33` : "0 1px 4px rgba(0,0,0,0.05)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", right: 12, bottom: 2, fontSize: 52, opacity: 0.1, pointerEvents: "none", transform: "rotate(12deg)" }}>{s.icon}</div>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", flexShrink: 0, width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 4 : 0 }}>Lọc:</span>
        <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 160, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="hien_hanh">Đang điều tra</option>
          <option value="ket_thuc">Kết thúc điều tra</option>
          <option value="tam_dinh_chi">Tạm đình chỉ</option>
          <option value="dinh_chi">Đình chỉ</option>
        </select>
        <select value={filterToiDanh} onChange={(e) => setFilterToiDanh(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả tội danh</option>
          {TOI_DANH_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterCanBo} onChange={(e) => setFilterCanBo(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 190, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả cán bộ</option>
          {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterDeadline} onChange={(e) => setFilterDeadline(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 170, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả thời hạn</option>
          <option value="qua_han">🚨 Quá hạn</option>
          <option value="sap_het">⏰ Sắp hết hạn</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 210, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="ngay_khoi_to_desc">📅 Khởi tố gần đây</option>
          <option value="ngay_khoi_to_asc">📅 Khởi tố cũ nhất</option>
          <option value="deadline_asc">⏰ Gần hết hạn</option>
          <option value="ma_so">🔤 Theo mã số</option>
          <option value="trang_thai">📋 Theo trạng thái</option>
        </select>
        {(filterTrangThai !== "all" || filterToiDanh !== "all" || filterCanBo !== "all" || filterDeadline !== "all" || search) && (
          <button
            onClick={() => {
              setFilterTrangThai("all");
              setFilterToiDanh("all");
              setFilterCanBo("all");
              setFilterDeadline("all");
              setSearch("");
            }}
            style={{ padding: "7px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
          >
            ✕ Xóa lọc
          </button>
        )}
        <button
          onClick={() => {
            const title = "DANH SÁCH VỤ ÁN HÌNH SỰ - DÂN SỰ";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Mã số", "Tên vụ án", "Bị can", "Tội danh", "Ngày khởi tố", "Hạn điều tra", "Trạng thái", "Cán bộ thụ lý"];
            const rows = filtered.map(item => [
              item.ma_so || "—",
              item.ten_vu_an || "—",
              item.bi_can || "—",
              item.toi_danh || "—",
              item.ngay_khoi_to || "—",
              item.deadline || "—",
              item.trang_thai_an === "ket_thuc" ? "Kết thúc điều tra" : item.trang_thai_an === "tam_dinh_chi" ? "Tạm đình chỉ" : item.trang_thai_an === "dinh_chi" ? "Đình chỉ" : "Đang điều tra",
              item.tham_phan || "—"
            ]);
            exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          🖨️ In
        </button>
        <button
          onClick={() => {
            const title = "DANH SÁCH VỤ ÁN HÌNH SỰ - DÂN SỰ";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Mã số", "Tên vụ án", "Bị can", "Tội danh", "Ngày khởi tố", "Hạn điều tra", "Trạng thái", "Cán bộ thụ lý"];
            const rows = filtered.map(item => [
              item.ma_so || "—",
              item.ten_vu_an || "—",
              item.bi_can || "—",
              item.toi_danh || "—",
              item.ngay_khoi_to || "—",
              item.deadline || "—",
              item.trang_thai_an === "ket_thuc" ? "Kết thúc điều tra" : item.trang_thai_an === "tam_dinh_chi" ? "Tạm đình chỉ" : item.trang_thai_an === "dinh_chi" ? "Đình chỉ" : "Đang điều tra",
              item.tham_phan || "—"
            ]);
            exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: "danh_sach_vu_an" });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 12, color: "#94A3B8", fontWeight: 500, width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{filtered.length}/{total} vụ án</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#7F1D1D,#DC2626)" }}>
                {["#", "Mã số", "Tên vụ án", "Tội danh", "Ngày khởi tố", "Hạn điều tra", "Trạng thái", "Cán bộ thụ lý", "Thao tác"].map((h) => (
                  <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 56, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.25 }}>⚖️</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Không có vụ án nào</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>Thử thay đổi bộ lọc hoặc tìm kiếm</div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const isApplicable = !item.trang_thai_an || item.trang_thai_an === "hien_hanh" || item.trang_thai_an === "tam_dinh_chi";
                  const st = getStatus(item.deadline, item.status, item.thoi_hieu, item.trang_thai_an);
                  const isOver = isApplicable && st === "qua_han";
                  const isNear = isApplicable && st === "sap_het_han";
                  const rowBg = isOver ? "#FFF5F5" : isNear ? "#FFFBF0" : idx % 2 === 0 ? "#fff" : "#FAFBFC";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isOver ? "#FEE2E2" : "#F0F7FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ padding: "8px 5px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 26 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>{item.ma_so || "—"}</span>
                      </td>
                      <td style={{ padding: "8px 8px", maxWidth: 210 }}>
                        <button
                          onClick={() => setTitlePopup(item)}
                          style={{ border: "none", background: "none", color: "#1E293B", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, textAlign: "left", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4, transition: "color 0.15s", width: "100%" }}
                          onMouseEnter={(e) => e.target.style.color = "#DC2626"}
                          onMouseLeave={(e) => e.target.style.color = "#1E293B"}
                        >
                          {item.ten_vu_an || "—"}
                        </button>
                        {item.bi_can && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>BC: {item.bi_can}</div>}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <ToiDanhBadge toi_danh={item.toi_danh} />
                      </td>
                      <td style={{ padding: "8px 6px", fontSize: 11, color: "#64748B", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatVNdate(item.ngay_khoi_to)}</td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        {item.trang_thai_an === "tam_dinh_chi" ? (
                          item.thoi_hieu ? (
                            <span style={{ fontSize: 11, color: isOver ? "#DC2626" : isNear ? "#D97706" : "#64748B", fontWeight: isOver || isNear ? 700 : 400, background: isOver ? "#FEE2E2" : isNear ? "#FEF3C7" : "transparent", padding: isOver || isNear ? "2px 6px" : "0", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>
                              TH: {formatVNdate(item.thoi_hieu)}
                            </span>
                          ) : "—"
                        ) : (
                          item.deadline ? (
                            <span style={{ fontSize: 11, color: isOver ? "#DC2626" : isNear ? "#D97706" : "#64748B", fontWeight: isOver || isNear ? 700 : 400, background: isOver ? "#FEE2E2" : isNear ? "#FEF3C7" : "transparent", padding: isOver || isNear ? "2px 6px" : "0", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>{formatVNdate(item.deadline)}</span>
                          ) : "—"
                        )}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <TrangThaiAnBadge trang_thai_an={item.trang_thai_an} />
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        {item.tham_phan ? (
                          <button
                            onClick={() => handleCanBoClick(item.tham_phan)}
                            style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <UserAvatar user={users.find(u => u.name === item.tham_phan) || { name: item.tham_phan, role: "viewer" }} size={22} />
                            <span style={{ maxWidth: 95, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortName(item.tham_phan)}</span>
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
                          <button onClick={() => setTitlePopup(item)} style={{ border: "none", background: "#F1F5F9", color: "#475569", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>Xem</button>
                          {canEdit(item) && (
                            <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ border: "none", background: "#FFFBEB", color: "#B45309", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>Sửa</button>
                          )}
                          {canDelete(item) && (
                            <button onClick={() => handleDelete(item)} style={{ border: "none", background: "#FFF5F5", color: "#DC2626", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>Xóa</button>
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

        <div style={{ padding: "9px 14px", borderTop: "1px solid #F1F5F9", background: "#FAFBFC", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            Hiển thị <b style={{ color: "#374151" }}>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> vụ án
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
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
                  const p = i + 1, isAct = p === page;
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

      {titlePopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setTitlePopup(null)}>
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 600, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg,#7F1D1D,#DC2626)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>⚖️ VỤ ÁN · {titlePopup.ma_so}</div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 17, lineHeight: 1.4, maxWidth: 480 }}>{titlePopup.ten_vu_an}</div>
                  <div style={{ marginTop: 8 }}><TrangThaiAnBadge trang_thai_an={titlePopup.trang_thai_an} /></div>
                </div>
                <button onClick={() => setTitlePopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#fff", flexShrink: 0 }}>×</button>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {[
                  { l: "Mã số vụ án", v: titlePopup.ma_so, bold: true },
                  { l: "Loại vụ án", v: titlePopup.loai_vu_an },
                  { l: "Tội danh", v: titlePopup.toi_danh, badge: true },
                  { l: "Điều / Khoản", v: (titlePopup.dieu || titlePopup.khoan) ? `${titlePopup.dieu || "—"}${titlePopup.khoan ? `, Khoản ${titlePopup.khoan}` : ""}` : null },
                  { l: "Thời gian xảy ra", v: titlePopup.ngay_xay_ra ? formatVNdate(titlePopup.ngay_xay_ra) : null },
                  { l: "Địa điểm xảy ra", v: titlePopup.dia_diem || null },
                  { l: "Ngày khởi tố", v: titlePopup.ngay_khoi_to ? formatVNdate(titlePopup.ngay_khoi_to) : null },
                  { l: "Hạn điều tra", v: titlePopup.deadline ? formatVNdate(titlePopup.deadline) : null },
                  { l: "Thời hiệu", v: titlePopup.thoi_hieu ? formatVNdate(titlePopup.thoi_hieu) : null },
                  { l: "Cán bộ thụ lý", v: titlePopup.tham_phan },
                  { l: "Bị can / Nghi can", v: titlePopup.bi_can, full: true },
                  { l: "Ưu tiên", v: titlePopup.priority === "cao" ? "🔴 Cao" : titlePopup.priority === "trung_binh" ? "🟡 Trung bình" : "🟢 Thấp" },
                  { l: "Người nhập", v: titlePopup.nguoi_nhap },
                  { l: "Trạng thái tiến độ", v: (!titlePopup.trang_thai_an || titlePopup.trang_thai_an === "hien_hanh") ? titlePopup.status : null, badge_st: true },
                  { l: "Ghi chú / Diễn biến", v: titlePopup.ghi_chu, full: true }
                ].map((f, i) => {
                  if (f.v === undefined || f.v === null) return null;
                  return (
                    <div key={i} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 }}>{f.l}</div>
                      <div style={{ padding: "9px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 13, color: "#1E293B", fontWeight: f.bold ? 700 : 400, wordBreak: "break-word" }}>
                        {f.badge ? <ToiDanhBadge toi_danh={f.v} /> : f.badge_st ? <StatusBadge deadline={titlePopup.deadline} statusOverride={titlePopup.status} /> : f.v}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
          <div style={{ marginTop: 16, padding: 14, background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Thống kê thụ lý vụ án</div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#7C3AED" }}>{canBoPopup.total_an}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Tổng vụ án</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#2563EB" }}>{canBoPopup.hien_hanh}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Đang thụ lý</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#DC2626" }}>{canBoPopup.qua_han}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Quá hạn</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#6B7280" }}>{canBoPopup.ket_thuc}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Kết thúc</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#D97706" }}>{canBoPopup.tam_dinh}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Tạm đình</div>
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

      {showModal && (
        <Modal title={editItem ? "✏️ Chỉnh sửa Vụ Án" : "➕ Thêm Vụ Án Mới"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <VuAnForm 
            initial={editItem} 
            officerList={officerList} 
            allItems={items} 
            onSave={handleSave} 
            onClose={() => {
              setShowModal(false);
              setEditItem(null);
            }} 
            isMobile={isMobile}
            currentUser={currentUser}
          /></Modal>
      )}
    </div>
  );
}

const classifyCrimeAndLimits = (dieuStr, khoanStr) => {
  const dieu = (dieuStr || "").trim();
  const khoan = parseInt(khoanStr, 10) || 1;
  
  let severity = "ít nghiêm trọng";
  let monthsLimit = 2;
  let yearsStatute = 5;

  if (dieu.includes("173") || dieu.includes("174") || dieu.includes("175") || dieu.includes("178") || dieu.includes("134")) {
    if (khoan === 1) {
      severity = "ít nghiêm trọng";
      monthsLimit = 2;
      yearsStatute = 5;
    } else if (khoan === 2) {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    } else if (khoan === 3) {
      severity = "rất nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 15;
    } else if (khoan >= 4) {
      severity = "đặc biệt nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 20;
    }
  } else if (dieu.includes("168")) {
    if (khoan <= 2) {
      severity = "rất nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 15;
    } else {
      severity = "đặc biệt nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 20;
    }
  } else if (dieu.includes("171")) {
    if (khoan === 1) {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    } else if (khoan === 2 || khoan === 3) {
      severity = "rất nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 15;
    } else {
      severity = "đặc biệt nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 20;
    }
  } else if (dieu.includes("201")) {
    severity = "ít nghiêm trọng";
    monthsLimit = 2;
    yearsStatute = 5;
  } else if (dieu.includes("123")) {
    if (khoan === 2) {
      severity = "rất nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 15;
    } else {
      severity = "đặc biệt nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 20;
    }
  } else if (dieu.includes("249")) {
    if (khoan === 1) {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    } else if (khoan === 2 || khoan === 3) {
      severity = "rất nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 15;
    } else {
      severity = "đặc biệt nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 20;
    }
  } else if (dieu.includes("353")) {
    if (khoan === 1) {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    } else if (khoan === 2) {
      severity = "rất nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 15;
    } else {
      severity = "đặc biệt nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 20;
    }
  } else if (dieu.includes("321") || dieu.includes("318")) {
    if (khoan === 1) {
      severity = "ít nghiêm trọng";
      monthsLimit = 2;
      yearsStatute = 5;
    } else {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    }
  } else {
    if (khoan === 1) {
      severity = "ít nghiêm trọng";
      monthsLimit = 2;
      yearsStatute = 5;
    } else if (khoan === 2) {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    } else if (khoan === 3) {
      severity = "rất nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 15;
    } else {
      severity = "đặc biệt nghiêm trọng";
      monthsLimit = 4;
      yearsStatute = 20;
    }
  }

  return { severity, monthsLimit, yearsStatute };
};

function VuAnForm({ initial, officerList, allItems, onSave, onClose, isMobile, currentUser }) {
  const [form, setForm] = useState(() => {
    const existingNums = (allItems || []).map(i => { const m = (i.ma_so || "").match(/VA-\d{4}-(\d+)/); return m ? parseInt(m[1]) : 0; });
    const year = new Date().getFullYear();
    const next = (Math.max(0, ...existingNums) + 1).toString().padStart(3, "0");
    const autoMaSo = initial?.ma_so || `VA-${year}-${next}`;
    const base = {
      ma_so: autoMaSo,
      ten_vu_an: "",
      loai_vu_an: "Hình sự",
      toi_danh: "Trộm cắp tài sản",
      dieu: "Điều 173",
      khoan: "1",
      ngay_khoi_to: "",
      deadline: "",
      tham_phan: currentUser?.name || "",
      bi_can: "",
      trang_thai_an: "hien_hanh",
      priority: "cao",
      status: "dang_xu_ly",
      ghi_chu: "",
      ngay_xay_ra: "",
      dia_diem: "",
      thoi_hieu: "",
      ...initial || {}
    };
    if (!base.tham_phan) base.tham_phan = currentUser?.name || "";
    return base;
  });
  
  const calculateDeadlineAndPriority = (updatedForm) => {
    let nextForm = { ...updatedForm };
    const currentKhoan = nextForm.khoan || "1";
    
    if (currentKhoan === "1") {
      nextForm.priority = "thap";
    } else if (currentKhoan === "2") {
      nextForm.priority = "trung_binh";
    } else {
      nextForm.priority = "cao";
    }

    const { severity, monthsLimit, yearsStatute } = classifyCrimeAndLimits(nextForm.dieu, nextForm.khoan);

    if (nextForm.ngay_khoi_to) {
      const startDate = new Date(nextForm.ngay_khoi_to);
      if (!isNaN(startDate.getTime())) {
        startDate.setMonth(startDate.getMonth() + monthsLimit);
        const yyyy = startDate.getFullYear();
        const mm = String(startDate.getMonth() + 1).padStart(2, '0');
        const dd = String(startDate.getDate()).padStart(2, '0');
        nextForm.deadline = `${yyyy}-${mm}-${dd}`;
      }
    }

    if (nextForm.ngay_xay_ra) {
      const occurrenceDate = new Date(nextForm.ngay_xay_ra);
      if (!isNaN(occurrenceDate.getTime())) {
        occurrenceDate.setFullYear(occurrenceDate.getFullYear() + yearsStatute);
        const yyyy = occurrenceDate.getFullYear();
        const mm = String(occurrenceDate.getMonth() + 1).padStart(2, '0');
        const dd = String(occurrenceDate.getDate()).padStart(2, '0');
        nextForm.thoi_hieu = `${yyyy}-${mm}-${dd}`;
      }
    }
    
    return nextForm;
  };

  const set = (k, v) => setForm((p) => {
    const updated = { ...p, [k]: v };
    if (k === "khoan" || k === "ngay_khoi_to" || k === "dieu" || k === "ngay_xay_ra") {
      return calculateDeadlineAndPriority(updated);
    }
    return updated;
  });

  const handleToiDanhChange = (val) => {
    const TOI_DANH_DIEU_MAP = {
      "trộm cắp tài sản": "Điều 173",
      "trộm cắp": "Điều 173",
      "cướp tài sản": "Điều 168",
      "cướp giật tài sản": "Điều 171",
      "cướp giật": "Điều 171",
      "bắt cóc nhằm chiếm đoạt tài sản": "Điều 169",
      "bắt cóc": "Điều 169",
      "cưỡng đoạt tài sản": "Điều 170",
      "cưỡng đoạt": "Điều 170",
      "công nhiên chiếm đoạt tài sản": "Điều 172",
      "công nhiên chiếm đoạt": "Điều 172",
      "lừa đảo chiếm đoạt tài sản": "Điều 174",
      "lừa đảo": "Điều 174",
      "lạm dụng tín nhiệm chiếm đoạt tài sản": "Điều 175",
      "lạm dụng tín nhiệm": "Điều 175",
      "lạm dụng tín nhiệm chiếm đoạt": "Điều 175",
      "hủy hoại tài sản": "Điều 178",
      "huỷ hoại tài sản": "Điều 178",
      "cho vay lãi nặng": "Điều 201",
      "cho vay lãi nặng trong giao dịch dân sự": "Điều 201",
      "cố ý gây thương tích": "Điều 134",
      "gây thương tích": "Điều 134",
      "giết người": "Điều 123",
      "đe dọa giết người": "Điều 133",
      "đe doạ giết người": "Điều 133",
      "vô ý làm chết người": "Điều 128",
      "hiếp dâm": "Điều 141",
      "cưỡng dâm": "Điều 143",
      "dâm ô đối với người dưới 16 tuổi": "Điều 146",
      "dâm ô": "Điều 146",
      "mua bán người": "Điều 150",
      "tàng trữ trái phép chất ma túy": "Điều 249",
      "tàng trữ trái phép chất ma tuý": "Điều 249",
      "tàng trữ ma túy": "Điều 249",
      "vận chuyển trái phép chất ma túy": "Điều 250",
      "vận chuyển trái phép chất ma tuý": "Điều 250",
      "vận chuyển ma túy": "Điều 250",
      "mua bán trái phép chất ma túy": "Điều 251",
      "mua bán trái phép chất ma tuý": "Điều 251",
      "mua bán ma túy": "Điều 251",
      "tổ chức sử dụng trái phép chất ma túy": "Điều 255",
      "tổ chức sử dụng trái phép chất ma tuý": "Điều 255",
      "tổ chức sử dụng ma túy": "Điều 255",
      "chứa chấp việc sử dụng trái phép chất ma túy": "Điều 256",
      "chứa chấp sử dụng ma túy": "Điều 256",
      "ma tuý": "Điều 249",
      "ma túy": "Điều 249",
      "nhận hối lộ": "Điều 354",
      "đưa hối lộ": "Điều 364",
      "môi giới hối lộ": "Điều 365",
      "tham ô tài sản": "Điều 353",
      "tham ô": "Điều 353",
      "tham nhũng": "Điều 353",
      "đánh bạc": "Điều 321",
      "tổ chức đánh bạc": "Điều 322",
      "gá bạc": "Điều 322",
      "gây rối trật tự công cộng": "Điều 318",
      "gây rối trật tự": "Điều 318",
      "vi phạm giao thông": "Điều 260",
      "vi phạm quy định về tham gia giao thông đường bộ": "Điều 260",
      "trốn thuế": "Điều 200",
      "làm giả tài liệu": "Điều 341",
      "sử dụng tài liệu giả": "Điều 341",
      "làm giả con dấu": "Điều 341",
      "rửa tiền": "Điều 324",
      "che giấu tội phạm": "Điều 389",
      "không tố giác tội phạm": "Điều 390"
    };

    const normalizedVal = val ? val.toLowerCase().trim() : "";
    let autoDieu = "";
    if (normalizedVal) {
      if (TOI_DANH_DIEU_MAP[normalizedVal]) {
        autoDieu = TOI_DANH_DIEU_MAP[normalizedVal];
      } else {
        let bestKey = "";
        let bestMatch = "";
        for (const key in TOI_DANH_DIEU_MAP) {
          if (normalizedVal.includes(key) || key.includes(normalizedVal)) {
            if (key.length > bestKey.length) {
              bestKey = key;
              bestMatch = TOI_DANH_DIEU_MAP[key];
            }
          }
        }
        autoDieu = bestMatch;
      }
    }

    setForm((p) => {
      const updated = { ...p, toi_danh: val, dieu: autoDieu || p.dieu };
      return calculateDeadlineAndPriority(updated);
    });
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Mã số" required={true}>
          <input value={form.ma_so || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }} placeholder="VD: VA-2024-005" />
        </FormField>
        <FormField label="Loại vụ án">
          <select value={form.loai_vu_an || ""} onChange={(e) => set("loai_vu_an", e.target.value)} style={selectSt}>
            {["Hình sự", "Kinh tế", "Ma tuý", "Trật tự xã hội", "Khác"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Tên vụ án" required={true}>
            <input value={form.ten_vu_an || ""} onChange={(e) => set("ten_vu_an", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Thời gian xảy ra">
          <input type="date" value={form.ngay_xay_ra || ""} onChange={(e) => set("ngay_xay_ra", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Địa điểm xảy ra">
          <input value={form.dia_diem || ""} onChange={(e) => set("dia_diem", e.target.value)} style={inputSt} placeholder="VD: Phường Phú Hội, TP Huế" />
        </FormField>
        <FormField label="Tội danh">
          <input 
            list="toi-danh-options"
            value={form.toi_danh || ""} 
            onChange={(e) => handleToiDanhChange(e.target.value)} 
            style={inputSt} 
            placeholder="Nhập hoặc chọn tội danh..."
          />
          <datalist id="toi-danh-options">
            {TOI_DANH_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
          </datalist>
        </FormField>
        <FormField label="Điều (Tự động cập nhật theo tội danh)">
          <input value={form.dieu || ""} onChange={(e) => set("dieu", e.target.value)} style={inputSt} placeholder="VD: Điều 173" />
        </FormField>
        <FormField label="Khoản">
          <select value={form.khoan || "1"} onChange={(e) => set("khoan", e.target.value)} style={selectSt}>
            {["1", "2", "3", "4"].map((k) => (
              <option key={k} value={k}>Khoản {k}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Trạng thái vụ án">
          <select value={form.trang_thai_an || "hien_hanh"} onChange={(e) => set("trang_thai_an", e.target.value)} style={selectSt}>
            <option value="hien_hanh">🔵 Đang điều tra</option>
            <option value="ket_thuc">✅ Kết thúc điều tra</option>
            <option value="tam_dinh_chi">⏸️ Tạm đình chỉ</option>
            <option value="dinh_chi">🚫 Đình chỉ</option>
          </select>
        </FormField>
        <FormField label="Ngày khởi tố">
          <input type="date" value={form.ngay_khoi_to || ""} onChange={(e) => set("ngay_khoi_to", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Hạn điều tra (Tự động)">
          <input type="date" value={form.deadline || ""} onChange={(e) => set("deadline", e.target.value)} style={inputSt} />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Thời hiệu (Tự động nhảy theo ngày xảy ra, điều, khoản)">
            <input type="date" value={form.thoi_hieu || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }} />
          </FormField>
        </div>
        <FormField label="Cán bộ thụ lý">
          <select value={form.tham_phan || ""} onChange={(e) => set("tham_phan", e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Ưu tiên">
          <select value={form.priority || "cao"} onChange={(e) => set("priority", e.target.value)} style={selectSt}>
            <option value="cao">🔴 Cao</option>
            <option value="trung_binh">🟡 Trung bình</option>
            <option value="thap">🟢 Thấp</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Bị can / Nghi can">
            <input value={form.bi_can || ""} onChange={(e) => set("bi_can", e.target.value)} style={inputSt} placeholder="Họ tên các bị can, cách nhau bằng dấu phẩy" />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú / Diễn biến vụ án">
            <textarea value={form.ghi_chu || ""} onChange={(e) => set("ghi_chu", e.target.value)} style={textareaSt} />
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
