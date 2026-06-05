"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  StatusBadge,
  Modal,
  FormField,
  UserAvatar,
  getStatus,
  RankBadge,
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

const TRANG_THAI_TIN = {
  dang_giai_quyet: { label: "Đang giải quyết", color: "#7C3AED", bg: "#F5F3FF", dot: "#8B5CF6" },
  ket_thuc_khoi_to: { label: "Kết thúc khởi tố", color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  ket_thuc_khong_khoi_to: { label: "Kết thúc không khởi tố", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  tam_dinh_chi: { label: "Tạm đình chỉ", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" }
};

function TrangThaiTinBadge({ trang_thai_tin }) {
  let key = trang_thai_tin;
  if (!key || key === "hien_hanh") key = "dang_giai_quyet";
  if (key === "ket_thuc") key = "ket_thuc_khoi_to";
  if (key === "dinh_chi") key = "ket_thuc_khong_khoi_to";
  const cfg = TRANG_THAI_TIN[key] || TRANG_THAI_TIN.dang_giai_quyet;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

export default function TinBaoView({ data, onDataChange, currentUser, addLog, users, setActivePage, setHighlightUser, selectedRecord, clearSelectedRecord, isMobile }) {
  const items = data["tin_bao"] || [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [filterToiDanh, setFilterToiDanh] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [filterDeadline, setFilterDeadline] = useState("all");
  const [sortBy, setSortBy] = useState("ngay_phan_cong_desc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [titlePopup, setTitlePopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const canAddNew = true;
  const canEdit = (item) => isAdmin || item.nguoi_nhap === currentUser.name;
  const canDelete = (item) => currentUser.role === "admin";
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);

  const total = items.length;
  const dang_giai_quyet = items.filter((i) => !i.trang_thai_tin || i.trang_thai_tin === "hien_hanh" || i.trang_thai_tin === "dang_giai_quyet").length;
  const ket_thuc_khoi_to = items.filter((i) => i.trang_thai_tin === "ket_thuc" || i.trang_thai_tin === "ket_thuc_khoi_to").length;
  const ket_thuc_khong_khoi_to = items.filter((i) => i.trang_thai_tin === "dinh_chi" || i.trang_thai_tin === "ket_thuc_khong_khoi_to").length;
  const tam_dinh = items.filter((i) => i.trang_thai_tin === "tam_dinh_chi").length;

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) list = list.filter((i) => Object.values(i).some((v) => String(v).toLowerCase().includes(q)));
    if (filterTrangThai !== "all") {
      list = list.filter((i) => {
        let key = i.trang_thai_tin;
        if (!key || key === "hien_hanh") key = "dang_giai_quyet";
        if (key === "ket_thuc") key = "ket_thuc_khoi_to";
        if (key === "dinh_chi") key = "ket_thuc_khong_khoi_to";
        return key === filterTrangThai;
      });
    }
    if (filterToiDanh !== "all") list = list.filter((i) => i.toi_danh === filterToiDanh);
    if (filterCanBo !== "all") list = list.filter((i) => i.phu_trach && i.phu_trach.includes(filterCanBo));
    if (filterDeadline === "qua_han") list = list.filter((i) => getStatus(i.deadline, i.status, i.thoi_hieu, null, i.trang_thai_tin) === "qua_han");
    else if (filterDeadline === "sap_het") list = list.filter((i) => getStatus(i.deadline, i.status, i.thoi_hieu, null, i.trang_thai_tin) === "sap_het_han");

    if (sortBy === "ngay_phan_cong_desc") list.sort((a, b) => new Date(b.ngay_phan_cong || 0) - new Date(a.ngay_phan_cong || 0));
    if (sortBy === "ngay_phan_cong_asc") list.sort((a, b) => new Date(a.ngay_phan_cong || 0) - new Date(b.ngay_phan_cong || 0));
    if (sortBy === "deadline_asc") list.sort((a, b) => new Date(a.deadline || "9999") - new Date(b.deadline || "9999"));
    if (sortBy === "ma_so") list.sort((a, b) => (a.ma_so || "").localeCompare(b.ma_so || ""));
    if (sortBy === "trang_thai") list.sort((a, b) => (a.trang_thai_tin || "").localeCompare(b.trang_thai_tin || ""));
    return list;
  }, [items, search, filterTrangThai, filterToiDanh, filterCanBo, filterDeadline, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [items, search, filterTrangThai, filterToiDanh, filterCanBo, filterDeadline, sortBy]);

  useEffect(() => {
    if (selectedRecord && (selectedRecord._page === "tin_bao" || selectedRecord._mod?.id === "tin_bao")) {
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
    const cur = data["tin_bao"] || [];
    const f = { ...form, nguoi_nhap: form.nguoi_nhap || currentUser.name };
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật tin báo: ${f.ma_so}`, "tin_bao");
    } else {
      const id = Math.max(0, ...cur.map((i) => i.id)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm tin báo: ${f.ma_so}`, "tin_bao");
    }
    onDataChange("tin_bao", nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa tin báo "${item.tieu_de}"?`)) return;
    onDataChange("tin_bao", (data["tin_bao"] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa tin báo: ${item.ma_so}`, "tin_bao");
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return;
    const myItems = items.filter((i) => i.phu_trach && i.phu_trach.includes(name));
    const dang_giai_quyet = myItems.filter((i) => !i.trang_thai_tin || i.trang_thai_tin === "hien_hanh" || i.trang_thai_tin === "dang_giai_quyet").length;
    const qua_han = myItems.filter((i) => getStatus(i.deadline, i.status, i.thoi_hieu, null, i.trang_thai_tin) === "qua_han").length;
    const ket_thuc_khoi_to = myItems.filter((i) => i.trang_thai_tin === "ket_thuc" || i.trang_thai_tin === "ket_thuc_khoi_to").length;
    const ket_thuc_khong_khoi_to = myItems.filter((i) => i.trang_thai_tin === "dinh_chi" || i.trang_thai_tin === "ket_thuc_khong_khoi_to").length;
    const tam_dinh = myItems.filter((i) => i.trang_thai_tin === "tam_dinh_chi").length;
    setCanBoPopup({
      ...u,
      total_tin: myItems.length,
      dang_giai_quyet,
      qua_han,
      ket_thuc: ket_thuc_khoi_to + ket_thuc_khong_khoi_to,
      tam_dinh
    });
  };

  const ToiDanhTBBadge = ({ toi_danh }) => {
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

  const NguonTinBadge = ({ nguon }) => {
    const cfg = {
      "Quần chúng nhân dân": ["#16A34A", "#DCFCE7"],
      "Mật báo viên": ["#DC2626", "#FEE2E2"],
      "Người dân": ["#2563EB", "#DBEAFE"],
      "Công nhân": ["#D97706", "#FEF3C7"],
      "Chủ cơ sở kinh doanh": ["#7C3AED", "#EDE9FE"]
    };
    const [c, bg] = cfg[nguon] || ["#6B7280", "#F3F4F6"];
    return (
      <span style={{ background: bg, color: c, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
        {nguon || "—"}
      </span>
    );
  };

  const statCards = [
    { label: "Tổng số tin", value: total, icon: "📡", color: "#6366F1", bg: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", border: "#C7D2FE", filter: null },
    { label: "Đang giải quyết", value: dang_giai_quyet, icon: "🔵", color: "#8B5CF6", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", border: "#DDD6FE", filter: "dang_giai_quyet" },
    { label: "Kết thúc khởi tố", value: ket_thuc_khoi_to, icon: "⚖️", color: "#10B981", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "#A7F3D0", filter: "ket_thuc_khoi_to" },
    { label: "Kết thúc không khởi tố", value: ket_thuc_khong_khoi_to, icon: "📝", color: "#6B7280", bg: "linear-gradient(135deg,#F9FAFB,#F3F4F6)", border: "#E5E7EB", filter: "ket_thuc_khong_khoi_to" },
    { label: "Tạm đình chỉ", value: tam_dinh, icon: "⏸️", color: "#D97706", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "#FDE68A", filter: "tam_dinh_chi" }
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>📡 Tin Báo</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý tin báo tội phạm và tố giác vi phạm</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(124,58,237,0.3)", width: isMobile ? "100%" : "auto" }}
          >
            + Thêm tin báo
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 18 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã số, tiêu đề tin báo, tội danh, nguồn tin, cán bộ thụ lý..."
          style={{ width: "100%", padding: "13px 16px 13px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
          onFocus={(e) => e.target.style.borderColor = "#8B5CF6"}
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
            {/* Watermark Faded Icon */}
            <div style={{ 
              position: "absolute", 
              right: -8, 
              bottom: -12, 
              fontSize: 64, 
              opacity: 0.12, 
              pointerEvents: "none",
              userSelect: "none"
            }}>
              {s.icon}
            </div>

            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1, position: "relative", zIndex: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 4, position: "relative", zIndex: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", flexShrink: 0, width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 4 : 0 }}>Lọc:</span>
        <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 160, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="dang_giai_quyet">Đang giải quyết</option>
          <option value="ket_thuc_khoi_to">Kết thúc khởi tố</option>
          <option value="ket_thuc_khong_khoi_to">Kết thúc không khởi tố</option>
          <option value="tam_dinh_chi">Tạm đình chỉ</option>
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
          <option value="ngay_phan_cong_desc">📅 Phân công gần đây</option>
          <option value="ngay_phan_cong_asc">📅 Phân công cũ nhất</option>
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
            const title = "DANH SÁCH TIN BÁO TỘI PHẠM";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Mã số", "Nội dung", "Tội danh", "Nguồn tin", "Ngày phân công", "Ngày hết hạn", "Trạng thái", "Cán bộ thụ lý"];
            const rows = filtered.map(item => [
              item.ma_so || "—",
              item.tieu_de || "—",
              item.toi_danh || "—",
              item.nguon_tin || "—",
              item.ngay_phan_cong || "—",
              item.deadline || "—",
              item.trang_thai_tin === "ket_thuc" || item.trang_thai_tin === "ket_thuc_khoi_to" ? "Kết thúc khởi tố" : 
              item.trang_thai_tin === "dinh_chi" || item.trang_thai_tin === "ket_thuc_khong_khoi_to" ? "Kết thúc không khởi tố" : 
              item.trang_thai_tin === "tam_dinh_chi" ? "Tạm đình chỉ" : "Đang giải quyết",
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
            const title = "DANH SÁCH TIN BÁO TỘI PHẠM";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Mã số", "Nội dung", "Tội danh", "Nguồn tin", "Ngày phân công", "Ngày hết hạn", "Trạng thái", "Cán bộ thụ lý"];
            const rows = filtered.map(item => [
              item.ma_so || "—",
              item.tieu_de || "—",
              item.toi_danh || "—",
              item.nguon_tin || "—",
              item.ngay_phan_cong || "—",
              item.deadline || "—",
              item.trang_thai_tin === "ket_thuc" || item.trang_thai_tin === "ket_thuc_khoi_to" ? "Kết thúc khởi tố" : 
              item.trang_thai_tin === "dinh_chi" || item.trang_thai_tin === "ket_thuc_khong_khoi_to" ? "Kết thúc không khởi tố" : 
              item.trang_thai_tin === "tam_dinh_chi" ? "Tạm đình chỉ" : "Đang giải quyết",
              item.phu_trach || "—"
            ]);
            exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: "danh_sach_tin_bao" });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 12, color: "#94A3B8", fontWeight: 500, width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{filtered.length}/{total} tin báo</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#4C1D95,#7C3AED)" }}>
                {["#", "Mã số", "Tên tin báo", "Tội danh", "Ngày phân công", "Ngày hết hạn", "Trạng thái", "Cán bộ thụ lý", "Thao tác"].map((h) => (
                  <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 56, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.25 }}>📡</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Không có tin báo nào</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>Thử thay đổi bộ lọc hoặc tìm kiếm</div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const st = getStatus(item.deadline, item.status, item.thoi_hieu, null, item.trang_thai_tin);
                  const isOver = st === "qua_han", isNear = st === "sap_het_han";
                  const rowBg = isOver ? "#FFF5F5" : isNear ? "#FFFBF0" : idx % 2 === 0 ? "#fff" : "#FAFBFC";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isOver ? "#FEE2E2" : "#FAF5FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ padding: "8px 5px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 26 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <span style={{ background: "#F5F3FF", color: "#7C3AED", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>{item.ma_so || "—"}</span>
                      </td>
                      <td style={{ padding: "8px 8px", maxWidth: 220 }}>
                        <button
                          onClick={() => setTitlePopup(item)}
                          style={{ border: "none", background: "none", color: "#1E293B", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, textAlign: "left", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4, transition: "color 0.15s", width: "100%" }}
                          onMouseEnter={(e) => e.target.style.color = "#7C3AED"}
                          onMouseLeave={(e) => e.target.style.color = "#1E293B"}
                        >
                          {item.tieu_de || "—"}
                        </button>
                        {item.nguon_tin && (
                          <div style={{ marginTop: 2 }}>
                            <NguonTinBadge nguon={item.nguon_tin} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <ToiDanhTBBadge toi_danh={item.toi_danh} />
                      </td>
                      <td style={{ padding: "8px 6px", fontSize: 11, color: "#64748B", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatVNdate(item.ngay_phan_cong)}</td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        {item.deadline ? (
                          <span style={{ fontSize: 11, color: isOver ? "#DC2626" : isNear ? "#D97706" : "#64748B", fontWeight: isOver || isNear ? 700 : 400, background: isOver ? "#FEE2E2" : isNear ? "#FEF3C7" : "transparent", padding: isOver || isNear ? "2px 6px" : "0", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>{formatVNdate(item.deadline)}</span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <TrangThaiTinBadge trang_thai_tin={item.trang_thai_tin} />
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        {item.phu_trach ? (
                          <button
                            onClick={() => handleCanBoClick(item.phu_trach)}
                            style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 5 }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#4338CA"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "#6366F1"}
                          >
                            <UserAvatar user={users.find(u => u.name === item.phu_trach) || { name: item.phu_trach, role: "viewer" }} size={24} />
                            <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortName(item.phu_trach)}</span>
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
                          <button onClick={() => setTitlePopup(item)} style={{ border: "none", background: "#F5F3FF", color: "#7C3AED", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xem</button>
                          {canEdit(item) && (
                            <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ border: "none", background: "#FFFBEB", color: "#B45309", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Sửa</button>
                          )}
                          {canDelete(item) && (
                            <button onClick={() => handleDelete(item)} style={{ border: "none", background: "#FFF5F5", color: "#DC2626", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xóa</button>
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
            Hiển thị <b style={{ color: "#374151" }}>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> tin báo
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
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg,#4C1D95,#7C3AED)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>📡 TIN BÁO · {titlePopup.ma_so}</div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 17, lineHeight: 1.4, maxWidth: 480 }}>{titlePopup.tieu_de}</div>
                  <div style={{ marginTop: 8 }}><TrangThaiTinBadge trang_thai_tin={titlePopup.trang_thai_tin} /></div>
                </div>
                <button onClick={() => setTitlePopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#fff", flexShrink: 0 }}>×</button>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {[
                  { l: "Mã số tin báo", v: titlePopup.ma_so, bold: true },
                  { l: "Nguồn tin", v: titlePopup.nguon_tin },
                  { l: "Thời gian xảy ra", v: titlePopup.ngay_xay_ra ? formatVNdate(titlePopup.ngay_xay_ra) : "" },
                  { l: "Địa điểm xảy ra", v: titlePopup.dia_diem || "" },
                  { l: "Tội danh nghi vấn", v: titlePopup.toi_danh || "", badge: true },
                  { l: "Điều/Khoản", v: titlePopup.dieu ? `${titlePopup.dieu} ${titlePopup.khoan ? 'khoản ' + titlePopup.khoan : ''}` : "" },
                  { l: "Ngày phân công", v: titlePopup.ngay_phan_cong || "" },
                  { l: "Ngày hết hạn", v: titlePopup.deadline || "" },
                  { l: "Thời hiệu", v: titlePopup.thoi_hieu ? formatVNdate(titlePopup.thoi_hieu) : "" },
                  { l: "Cán bộ phụ trách", v: titlePopup.phu_trach || "" },
                  { l: "Độ ưu tiên", v: titlePopup.priority === "cao" ? "🔴 Cao" : titlePopup.priority === "trung_binh" ? "🟡 Trung bình" : "🟢 Thấp" },
                  { l: "Người nhập", v: titlePopup.nguoi_nhap || "" },
                  { l: "Trạng thái tin báo", v: titlePopup.trang_thai_tin || "dang_giai_quyet", badge_tt_tin: true },
                  { l: "Trạng thái tiến độ", v: (!titlePopup.trang_thai_tin || titlePopup.trang_thai_tin === "dang_giai_quyet" || titlePopup.trang_thai_tin === "hien_hanh") ? (titlePopup.status || "dang_xu_ly") : null, badge_st: true },
                  { l: "Nội dung chi tiết / Diễn biến", v: titlePopup.ghi_chu || "", full: true }
                ].map((f, i) => {
                  if (f.v === undefined || f.v === null) return null;
                  const displayValue = f.v === "" ? "—" : f.v;
                  return (
                    <div key={i} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 }}>{f.l}</div>
                      <div style={{ padding: "9px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 13, color: "#1E293B", fontWeight: f.bold ? 700 : 400, wordBreak: "break-word" }}>
                        {f.badge ? <ToiDanhTBBadge toi_danh={displayValue} /> : f.badge_tt_tin ? <TrangThaiTinBadge trang_thai_tin={displayValue} /> : f.badge_st ? <StatusBadge deadline={titlePopup.deadline} statusOverride={displayValue} /> : displayValue}
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
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Thống kê thụ lý tin báo</div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#7C3AED" }}>{canBoPopup.total_tin}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Tổng tin báo</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#2563EB" }}>{canBoPopup.dang_giai_quyet}</div>
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
        <Modal title={editItem ? "✏️ Chỉnh sửa Tin Báo" : "➕ Thêm Tin Báo Mới"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <TinBaoForm 
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
          />
        </Modal>
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
  } else if (dieu.includes("202") || dieu.includes("290")) {
    severity = "ít nghiêm trọng";
    monthsLimit = 2;
    yearsStatute = 5;
  } else if (dieu.includes("123")) {
    severity = "đặc biệt nghiêm trọng";
    monthsLimit = 4;
    yearsStatute = 20;
  } else if (dieu.includes("249") || dieu.includes("250")) {
    if (khoan === 1) {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
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
  } else if (dieu.includes("321")) {
    if (khoan === 1) {
      severity = "ít nghiêm trọng";
      monthsLimit = 2;
      yearsStatute = 5;
    } else {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    }
  } else if (dieu.includes("318")) {
    if (khoan === 1) {
      severity = "ít nghiêm trọng";
      monthsLimit = 2;
      yearsStatute = 5;
    } else {
      severity = "nghiêm trọng";
      monthsLimit = 3;
      yearsStatute = 10;
    }
  }
  return { severity, monthsLimit, yearsStatute };
};

function TinBaoForm({ initial, officerList, allItems, onSave, onClose, isMobile, currentUser }) {
  const [form, setForm] = useState(() => {
    const existingNums = (allItems || []).map(i => { const m = (i.ma_so || "").match(/TB-\d{4}-(\d+)/); return m ? parseInt(m[1]) : 0; });
    const year = new Date().getFullYear();
    const next = (Math.max(0, ...existingNums) + 1).toString().padStart(3, "0");
    const autoMaSo = initial?.ma_so || `TB-${year}-${next}`;
    const base = {
      ma_so: autoMaSo,
      tieu_de: "",
      toi_danh: "Trộm cắp tài sản",
      dieu: "Điều 173",
      khoan: "1",
      nguon_tin: "",
      ngay_phan_cong: "",
      deadline: "",
      phu_trach: currentUser?.name || "",
      trang_thai_tin: "dang_giai_quyet",
      priority: "trung_binh",
      status: "dang_xu_ly",
      ghi_chu: "",
      ngay_xay_ra: "",
      dia_diem: "",
      thoi_hieu: "",
      ...initial || {}
    };
    if (!base.phu_trach) base.phu_trach = currentUser?.name || "";
    return base;
  });

  const calculateDeadlineAndThoiHieu = (updatedForm) => {
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

    if (nextForm.ngay_phan_cong) {
      const startDate = new Date(nextForm.ngay_phan_cong);
      if (!isNaN(startDate.getTime())) {
        startDate.setMonth(startDate.getMonth() + 2);
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
    if (k === "khoan" || k === "ngay_phan_cong" || k === "dieu" || k === "ngay_xay_ra") {
      return calculateDeadlineAndThoiHieu(updated);
    }
    return updated;
  });

  const handleToiDanhChange = (val) => {
    const TOI_DANH_DIEU_MAP = {
      "Trộm cắp tài sản": "Điều 173",
      "Cướp tài sản": "Điều 168",
      "Cướp giật tài sản": "Điều 171",
      "Lừa đảo chiếm đoạt tài sản": "Điều 174",
      "Lạm dụng tín nhiệm chiếm đoạt": "Điều 175",
      "Huỷ hoại tài sản": "Điều 178",
      "Cho vay lãi nặng": "Điều 201",
      "Cố ý gây thương tích": "Điều 134",
      "Giết người": "Điều 123",
      "Ma tuý": "Điều 249",
      "Tham nhũng": "Điều 353",
      "Đánh bạc": "Điều 321",
      "Gây rối trật tự": "Điều 318"
    };
    const autoDieu = TOI_DANH_DIEU_MAP[val] || "";
    setForm((p) => {
      const updated = { ...p, toi_danh: val, dieu: autoDieu };
      return calculateDeadlineAndThoiHieu(updated);
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Mã số" required={true}>
          <input value={form.ma_so || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }} placeholder="VD: TB-2024-006" />
        </FormField>
        <FormField label="Thời gian xảy ra">
          <input type="date" value={form.ngay_xay_ra || ""} onChange={(e) => set("ngay_xay_ra", e.target.value)} style={inputSt} />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Địa điểm xảy ra">
            <input value={form.dia_diem || ""} onChange={(e) => set("dia_diem", e.target.value)} style={inputSt} placeholder="VD: Phường Phú Hội, TP Huế" />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Tên tin báo / Nội dung" required={true}>
            <input value={form.tieu_de || ""} onChange={(e) => set("tieu_de", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Tội danh">
          <select value={form.toi_danh || ""} onChange={(e) => handleToiDanhChange(e.target.value)} style={selectSt}>
            {TOI_DANH_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
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
        <FormField label="Nguồn tin">
          <input value={form.nguon_tin || ""} onChange={(e) => set("nguon_tin", e.target.value)} placeholder="VD: CAP Phú Xuân, Trực tiếp, Đường dây 7575..." style={inputSt} />
        </FormField>
        <FormField label="Trạng thái tin">
          <select value={form.trang_thai_tin || "dang_giai_quyet"} onChange={(e) => set("trang_thai_tin", e.target.value)} style={selectSt}>
            <option value="dang_giai_quyet">🔵 Đang giải quyết</option>
            <option value="ket_thuc_khoi_to">⚖️ Kết thúc khởi tố</option>
            <option value="ket_thuc_khong_khoi_to">📝 Kết thúc không khởi tố</option>
            <option value="tam_dinh_chi">⏸️ Tạm đình chỉ</option>
          </select>
        </FormField>
        <FormField label="Ngày phân công">
          <input type="date" value={form.ngay_phan_cong || ""} onChange={(e) => set("ngay_phan_cong", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Ngày hết hạn (Tự động)">
          <input type="date" value={form.deadline || ""} onChange={(e) => set("deadline", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ thụ lý">
          <select value={form.phu_trach || ""} onChange={(e) => set("phu_trach", e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Độ ưu tiên (Tự động theo khoản)">
          <select value={form.priority || "trung_binh"} onChange={(e) => set("priority", e.target.value)} style={selectSt}>
            <option value="cao">🔴 Cao</option>
            <option value="trung_binh">🟡 Trung bình</option>
            <option value="thap">🟢 Thấp</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Thời hiệu (Tự động nhảy theo ngày xảy ra, điều, khoản)">
            <input type="date" value={form.thoi_hieu || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }} />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú / Diễn biến">
            <textarea value={form.ghi_chu || ""} onChange={(e) => set("ghi_chu", e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(form)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}
