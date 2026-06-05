"use client";

import React, { useState, useMemo } from 'react';
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

const LOAI_VAN_BAN_LIST = [
  "Công văn",
  "Uỷ thác tư pháp",
  "Kế hoạch",
  "Quyết định",
  "Lệnh",
  "Thông báo",
  "Báo cáo",
  "Tờ trình",
  "Biên bản",
  "Hướng dẫn",
  "Chỉ thị",
  "Thông tư"
];

// Helper to calculate user statistics for display in popup
function getUserStats(user, data) {
  const stats = { total: 0, dang_lam: 0, sap_het: 0, qua_han: 0, hoan_thanh: 0 };
  
  const PHU_TRACH_MAPPING = {
    don_to_giac: "can_bo_xu_ly",
    tin_bao: "phu_trach",
    vu_an: "tham_phan",
    truy_tim: "phu_trach",
    truy_na: "phu_trach",
    vu_viec: "phu_trach",
    xe_truy_tim: "can_bo_phu_trach",
    so_dien_thoai: "can_bo_cap_nhat",
    so_tai_khoan: "can_bo_cap_nhat",
    xu_ly_van_ban: "can_bo_xu_ly",
    camera_hues: "can_bo_phu_trach"
  };

  Object.entries(PHU_TRACH_MAPPING).forEach(([modId, field]) => {
    const items = (data[modId] || []).filter((i) => i[field] && i[field].includes(user.name));
    items.forEach((i) => {
      const s = getStatus(i.deadline, i.status);
      if (s === "sap_het_han") {
        stats.sap_het++;
      } else {
        stats[s]++;
      }
      stats.total++;
    });
  });
  return stats;
}

export default function XuLyVanBanView({ data, onDataChange, currentUser, addLog, users, setActivePage, setHighlightUser, selectedRecord, clearSelectedRecord, isMobile }) {
  const rawItems = data["xu_ly_van_ban"] || [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [tab, setTab] = useState("den");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLoai, setFilterLoai] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [sortBy, setSortBy] = useState("ngay_tiep_nhan_desc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [titlePopup, setTitlePopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);


  const isAdmin = currentUser.role === "admin";
  const canEdit = ["admin", "mod"].includes(currentUser.role); // Chỉ Admin, Mod mới thêm/sửa được
  const canDelete = isAdmin; // Chỉ Admin mới xóa được
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);

  const items = useMemo(() => {
    return rawItems.map((i) => ({
      ...i,
      loai_luong: i.loai_luong || "den",
      ngay_tiep_nhan: i.ngay_tiep_nhan || i.ngay_ban_hanh || "",
      can_bo_xu_ly: i.can_bo_xu_ly || i.nguoi_ky || "",
      noi_gui: i.noi_gui || "",
      noi_nhan: i.noi_nhan || ""
    }));
  }, [rawItems]);

  const uniqueLoaiVanBan = useMemo(() => {
    const s = new Set(LOAI_VAN_BAN_LIST);
    rawItems.forEach(i => {
      if (i.loai_van_ban) s.add(i.loai_van_ban);
    });
    return Array.from(s);
  }, [rawItems]);

  const tabItems = useMemo(() => {
    return items.filter((i) => tab === "den" ? i.loai_luong !== "di" : i.loai_luong === "di");
  }, [items, tab]);

  const total = tabItems.length;
  const da_xu_ly = tabItems.filter((i) => i.status === "hoan_thanh").length;
  const dang_xu_ly = tabItems.filter((i) => getStatus(i.deadline, i.status) !== "qua_han" && i.status !== "hoan_thanh").length;
  const qua_han = tabItems.filter((i) => getStatus(i.deadline, i.status) === "qua_han").length;

  const filtered = useMemo(() => {
    let list = [...tabItems];
    const q = search.toLowerCase();
    if (q) {
      list = list.filter((i) => 
        (i.ma_so && i.ma_so.toLowerCase().includes(q)) ||
        (i.tieu_de && i.tieu_de.toLowerCase().includes(q)) ||
        (i.loai_van_ban && i.loai_van_ban.toLowerCase().includes(q)) ||
        (i.can_bo_xu_ly && i.can_bo_xu_ly.toLowerCase().includes(q)) ||
        (i.noi_gui && i.noi_gui.toLowerCase().includes(q)) ||
        (i.noi_nhan && i.noi_nhan.toLowerCase().includes(q)) ||
        (i.ghi_chu && i.ghi_chu.toLowerCase().includes(q))
      );
    }
    if (filterStatus === "hoan_thanh") {
      list = list.filter((i) => i.status === "hoan_thanh");
    } else if (filterStatus === "dang_xu_ly") {
      list = list.filter((i) => getStatus(i.deadline, i.status) !== "qua_han" && i.status !== "hoan_thanh");
    } else if (filterStatus === "qua_han") {
      list = list.filter((i) => getStatus(i.deadline, i.status) === "qua_han");
    }

    if (filterLoai !== "all") list = list.filter((i) => i.loai_van_ban === filterLoai);
    if (filterCanBo !== "all") list = list.filter((i) => i.can_bo_xu_ly && i.can_bo_xu_ly.includes(filterCanBo));

    if (sortBy === "ngay_tiep_nhan_desc") list.sort((a, b) => new Date(b.ngay_tiep_nhan || 0) - new Date(a.ngay_tiep_nhan || 0));
    if (sortBy === "ngay_tiep_nhan_asc") list.sort((a, b) => new Date(a.ngay_tiep_nhan || 0) - new Date(b.ngay_tiep_nhan || 0));
    if (sortBy === "deadline_asc") list.sort((a, b) => new Date(a.deadline || "9999") - new Date(b.deadline || "9999"));
    if (sortBy === "loai") list.sort((a, b) => (a.loai_van_ban || "").localeCompare(b.loai_van_ban || ""));
    if (sortBy === "ma_so") list.sort((a, b) => (a.ma_so || "").localeCompare(b.ma_so || ""));
    return list;
  }, [tabItems, search, filterStatus, filterLoai, filterCanBo, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page, PAGE_SIZE]);

  React.useEffect(() => { 
    setPage(1); 
  }, [tab, search, filterStatus, filterLoai, filterCanBo, sortBy]);

  React.useEffect(() => {
    if (selectedRecord && (selectedRecord._page === "xu_ly_van_ban" || selectedRecord._mod?.id === "xu_ly_van_ban")) {
      const isDi = selectedRecord.loai_luong === "di";
      if (isDi) {
        setTab("di");
      } else {
        setTab("den");
      }
      
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

  React.useEffect(() => {
    if (titlePopup && titlePopup.id) {
      addLog(`Xem chi tiết văn bản: ${titlePopup.ma_so} (${titlePopup.tieu_de || "—"})`, "xu_ly_van_ban");
    }
  }, [titlePopup]);

  const handleSave = (form) => {
    const f = { 
      ...form, 
      loai_luong: form.loai_luong || tab, 
      can_bo_xu_ly: form.can_bo_xu_ly || form.nguoi_ky || "", 
      ngay_tiep_nhan: form.ngay_tiep_nhan || form.ngay_ban_hanh || "" 
    };
    const cur = data["xu_ly_van_ban"] || [];
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật VB: ${f.ma_so}`, "xu_ly_van_ban");
    } else {
      // Find safe ID
      const id = Math.max(0, ...cur.map((i) => i.id)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm VB: ${f.ma_so}`, "xu_ly_van_ban");
    }
    onDataChange("xu_ly_van_ban", nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa văn bản "${item.tieu_de}"?`)) return;
    onDataChange("xu_ly_van_ban", (data["xu_ly_van_ban"] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa VB: ${item.ma_so}`, "xu_ly_van_ban");
  };

  const LoaiBadge = ({ loai }) => {
    const colors = { 
      "Công văn": ["#3B82F6", "#EFF6FF"], 
      "Uỷ thác tư pháp": ["#8B5CF6", "#F5F3FF"], 
      "Kế hoạch": ["#06B6D4", "#ECFEFF"], 
      "Quyết định": ["#EF4444", "#FEF2F2"], 
      "Lệnh": ["#DC2626", "#FEF2F2"], 
      "Thông báo": ["#F59E0B", "#FFFBEB"], 
      "Báo cáo": ["#10B981", "#ECFDF5"], 
      "Tờ trình": ["#6366F1", "#EEF2FF"], 
      "Biên bản": ["#84CC16", "#F7FEE7"], 
      "Hướng dẫn": ["#0891B2", "#ECFEFF"], 
      "Chỉ thị": ["#DC2626", "#FEF2F2"], 
      "Thông tư": ["#7C3AED", "#F5F3FF"] 
    };
    const [c, bg] = colors[loai] || ["#6B7280", "#F9FAFB"];
    return (
      <span style={{ background: bg, color: c, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block", letterSpacing: 0.2 }}>
        {loai || "—"}
      </span>
    );
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (u) setCanBoPopup({ ...u, stats: getUserStats(u, data) });
  };

  const tabStyle = (active, color) => ({
    padding: "10px 24px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    borderRadius: "10px 10px 0 0",
    transition: "all 0.2s",
    background: active ? color : "#F1F5F9",
    color: active ? "#fff" : "#6B7280",
    boxShadow: active ? "0 -3px 10px rgba(0,0,0,0.1)" : "none",
    position: "relative",
    zIndex: active ? 2 : 1
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>📄 Xử Lý Văn Bản</h2>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Hỗ trợ Lãnh đạo chỉ huy, Cán bộ tổng hợp quản lý theo dõi, điều phối, xử lý toàn văn bản của đơn vị</div>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#84CC16,#65A30D)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(132,204,22,0.3)", width: isMobile ? "100%" : "auto" }}
          >
            + Thêm văn bản
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 18 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã số, tiêu đề, loại văn bản, cán bộ xử lý, nơi gửi/nhận..."
          style={{ width: "100%", padding: "13px 16px 13px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "border-color 0.2s" }}
          onFocus={(e) => e.target.style.borderColor = "#84CC16"}
          onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Tổng văn bản", value: total, icon: "📄", color: "#6366F1", bg: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", border: "#C7D2FE", filter: null },
          { label: "Đã xử lý", value: da_xu_ly, icon: "✅", color: "#15803D", bg: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", border: "#86EFAC", filter: "hoan_thanh" },
          { label: "Đang xử lý", value: dang_xu_ly, icon: "🔄", color: "#2563EB", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "#93C5FD", filter: "dang_xu_ly" },
          { label: "Quá hạn", value: qua_han, icon: "🚨", color: "#DC2626", bg: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: "#FECACA", filter: "qua_han" }
        ].map((s, i) => (
          <div
            key={i}
            onClick={() => s.filter && setFilterStatus(filterStatus === s.filter ? "all" : s.filter)}
            style={{ 
              background: s.bg, 
              borderRadius: 14, 
              padding: "14px 16px", 
              border: `2px solid ${s.filter && filterStatus === s.filter ? s.color : s.border}`, 
              cursor: s.filter ? "pointer" : "default", 
              transition: "all 0.2s", 
              transform: s.filter && filterStatus === s.filter ? "scale(1.02)" : "scale(1)", 
              boxShadow: s.filter && filterStatus === s.filter ? `0 4px 16px ${s.color}33` : "0 1px 4px rgba(0,0,0,0.06)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", right: 12, bottom: 2, fontSize: 52, opacity: 0.1, pointerEvents: "none", transform: "rotate(12deg)" }}>{s.icon}</div>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 0, alignItems: "flex-end" }}>
        <button 
          style={tabStyle(tab === "den", "linear-gradient(135deg,#2563EB,#1D4ED8)")} 
          onClick={() => {
            setTab("den");
            setFilterStatus("all");
          }}
        >
          📥 Văn bản đến
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.25)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>
            {items.filter((i) => i.loai_luong !== "di").length}
          </span>
        </button>
        <button 
          style={tabStyle(tab === "di", "linear-gradient(135deg,#7C3AED,#6D28D9)")} 
          onClick={() => {
            setTab("di");
            setFilterStatus("all");
          }}
        >
          📤 Văn bản đi
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.25)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>
            {items.filter((i) => i.loai_luong === "di").length}
          </span>
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 14px 14px 14px", border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#FAFBFC", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", flexShrink: 0, width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 4 : 0 }}>Lọc:</span>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 160, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="dang_xu_ly">Đang xử lý</option>
            <option value="hoan_thanh">Đã xử lý</option>
            <option value="qua_han">Quá hạn</option>
          </select>
          <select value={filterLoai} onChange={(e) => setFilterLoai(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 170, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
            <option value="all">Tất cả loại VB</option>
            {uniqueLoaiVanBan.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterCanBo} onChange={(e) => setFilterCanBo(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 180, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
            <option value="all">Tất cả cán bộ</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
            <option value="ngay_tiep_nhan_desc">📅 Mới tiếp nhận trước</option>
            <option value="ngay_tiep_nhan_asc">📅 Cũ tiếp nhận trước</option>
            <option value="deadline_asc">⏰ Gần hết hạn trước</option>
            <option value="loai">📂 Theo loại văn bản</option>
            <option value="ma_so">🔤 Theo mã số</option>
          </select>
          {(filterStatus !== "all" || filterLoai !== "all" || filterCanBo !== "all" || search) && (
            <button 
              onClick={() => {
                setFilterStatus("all");
                setFilterLoai("all");
                setFilterCanBo("all");
                setSearch("");
              }} 
              style={{ padding: "6px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
            >
              ✕ Xóa lọc
            </button>
          )}
          <button
            onClick={() => {
              const title = tab === "den" ? "DANH SÁCH VĂN BẢN ĐẾN" : "DANH SÁCH VĂN BẢN ĐI";
              const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
              const cols = ["Mã số", "Tiêu đề văn bản", "Loại", "Ngày tiếp nhận", tab === "den" ? "Nơi gửi" : "Nơi nhận", "Hạn xử lý", "Trạng thái", "Cán bộ xử lý"];
              const rows = filtered.map(item => [
                item.ma_so || "—",
                item.tieu_de || "—",
                item.loai_van_ban || "—",
                item.ngay_tiep_nhan || "—",
                tab === "den" ? (item.noi_gui || "—") : (item.noi_nhan || "—"),
                item.deadline || "—",
                item.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý",
                item.can_bo_xu_ly || "—"
              ]);
              exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
              addLog(`In danh sách văn bản ${tab === "den" ? "đến" : "đi"} (${filtered.length} bản ghi)`, "xu_ly_van_ban");
            }}
            style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
          >
            🖨️ In
          </button>
          <button
            onClick={() => {
              const title = tab === "den" ? "DANH SÁCH VĂN BẢN ĐẾN" : "DANH SÁCH VĂN BẢN ĐI";
              const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
              const cols = ["Mã số", "Tiêu đề văn bản", "Loại", "Ngày tiếp nhận", tab === "den" ? "Nơi gửi" : "Nơi nhận", "Hạn xử lý", "Trạng thái", "Cán bộ xử lý"];
              const rows = filtered.map(item => [
                item.ma_so || "—",
                item.tieu_de || "—",
                item.loai_van_ban || "—",
                item.ngay_tiep_nhan || "—",
                tab === "den" ? (item.noi_gui || "—") : (item.noi_nhan || "—"),
                item.deadline || "—",
                item.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý",
                item.can_bo_xu_ly || "—"
              ]);
              exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: tab === "den" ? "danh_sach_van_ban_den" : "danh_sach_van_ban_di" });
              addLog(`Xuất file Word danh sách văn bản ${tab === "den" ? "đến" : "đi"} (${filtered.length} bản ghi)`, "xu_ly_van_ban");
            }}
            style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
          >
            <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
          </button>
          <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 12, color: "#94A3B8", fontWeight: 500, width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>
            {filtered.length} văn bản
          </div>
        </div>

        <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr style={{ background: tab === "den" ? "linear-gradient(135deg,#1E40AF,#2563EB)" : "linear-gradient(135deg,#5B21B6,#7C3AED)" }}>
                {[
                  { h: "#", w: 32 },
                  { h: "Mã số", w: 105 },
                  { h: "Tiêu đề văn bản", w: "auto" },
                  { h: "Loại", w: 95 },
                  { h: "Ngày tiếp nhận", w: 98 },
                  { h: tab === "den" ? "Nơi gửi" : "Nơi nhận", w: 130 },
                  { h: "Hạn xử lý", w: 90 },
                  { h: "Trạng thái", w: 110 },
                  { h: "Cán bộ xử lý", w: 115 },
                  { h: "Thao tác", w: 88 }
                ].map(({ h, w }) => (
                  <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap", width: w === "auto" ? undefined : w, minWidth: w === "auto" ? 180 : undefined }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 56, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📥</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Chưa có văn bản nào</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>
                      {tab === "den" ? "Chưa có văn bản đến" : "Chưa có văn bản đi"}
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const st = getStatus(item.deadline, item.status);
                  const isOver = st === "qua_han", isNear = st === "sap_het_han";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: isOver ? "#FFF5F5" : isNear ? "#FFFBF0" : idx % 2 === 0 ? "#fff" : "#FAFBFC", transition: "background 0.15s", fontSize: 12, verticalAlign: "middle" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isOver ? "#FEE2E2" : "#F0F9FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = isOver ? "#FFF5F5" : isNear ? "#FFFBF0" : idx % 2 === 0 ? "#fff" : "#FAFBFC"}
                    >
                      <td style={{ padding: "8px 6px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 28 }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                        <span style={{ background: tab === "den" ? "#EFF6FF" : "#F5F3FF", color: tab === "den" ? "#2563EB" : "#7C3AED", padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 800, letterSpacing: 0.2 }}>
                          {item.ma_so || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", maxWidth: 240 }}>
                        <button
                          onClick={() => setTitlePopup(item)}
                          style={{ border: "none", background: "none", color: "#1E293B", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, textAlign: "left", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4, transition: "color 0.15s", width: "100%" }}
                          onMouseEnter={(e) => e.target.style.color = tab === "den" ? "#2563EB" : "#7C3AED"}
                          onMouseLeave={(e) => e.target.style.color = "#1E293B"}
                        >
                          {item.tieu_de || "—"}
                        </button>
                      </td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                        <LoaiBadge loai={item.loai_van_ban} />
                      </td>
                      <td style={{ padding: "8px 10px", fontSize: 11, color: "#64748B", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {formatVNdate(item.ngay_tiep_nhan || item.ngay_ban_hanh)}
                      </td>
                      <td style={{ padding: "8px 8px", fontSize: 11, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }} title={(tab === "den" ? item.noi_gui : item.noi_nhan) || ""}>
                        {(tab === "den" ? item.noi_gui : item.noi_nhan) || "—"}
                      </td>
                      <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                        {item.deadline ? (
                          <span style={{ fontSize: 11, color: isOver ? "#DC2626" : isNear ? "#D97706" : "#64748B", fontWeight: isOver || isNear ? 700 : 400, background: isOver ? "#FEE2E2" : isNear ? "#FEF3C7" : "transparent", padding: isOver || isNear ? "2px 6px" : "0", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>
                            {formatVNdate(item.deadline)}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <StatusBadge deadline={item.deadline} statusOverride={item.status} />
                      </td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                        {item.can_bo_xu_ly ? (
                          <button onClick={() => handleCanBoClick(item.can_bo_xu_ly)} style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                            <UserAvatar user={users.find(u => u.name === item.can_bo_xu_ly) || { name: item.can_bo_xu_ly, role: "viewer" }} size={20} />
                            <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {getShortName(item.can_bo_xu_ly)}
                            </span>
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "nowrap" }}>
                          <button onClick={() => setTitlePopup(item)} style={{ border: "none", background: "#F1F5F9", color: "#475569", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>Xem</button>
                          {canEdit && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditItem(item);
                                  setShowModal(true);
                                }} 
                                style={{ border: "none", background: "#FFFBEB", color: "#B45309", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}
                              >
                                Sửa
                              </button>
                              {canDelete && (
                                <button 
                                  onClick={() => handleDelete(item)} 
                                  style={{ border: "none", background: "#FFF5F5", color: "#DC2626", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}
                                >
                                  Xóa
                                </button>
                              )}
                            </>
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
            Hiển thị <b style={{ color: "#374151" }}>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> văn bản
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, marginRight: "auto" }}>
            <span style={{ color: "#15803D" }}>✅ {da_xu_ly} hoàn thành</span>
            &nbsp;&nbsp;
            <span style={{ color: "#2563EB" }}>🔄 {dang_xu_ly} đang xử lý</span>
            {qua_han > 0 && <span style={{ color: "#DC2626" }}>&nbsp;&nbsp;🚨 {qua_han} quá hạn</span>}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setTitlePopup(null)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 0, maxWidth: 560, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", background: tab === "den" ? "linear-gradient(135deg,#1E40AF,#2563EB)" : "linear-gradient(135deg,#5B21B6,#7C3AED)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  {tab === "den" ? "📥 VĂN BẢN ĐẾN" : "📤 VĂN BẢN ĐI"} · {titlePopup.ma_so}
                </div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, lineHeight: 1.4, maxWidth: 440 }}>
                  {titlePopup.tieu_de}
                </div>
              </div>
              <button onClick={() => setTitlePopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#fff", flexShrink: 0 }}>×</button>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              {[
                { l: "Loại văn bản", v: titlePopup.loai_van_ban },
                { l: "Ngày ban hành", v: titlePopup.ngay_ban_hanh },
                { l: "Ngày tiếp nhận", v: titlePopup.ngay_tiep_nhan },
                { l: "Thời hạn xử lý", v: titlePopup.deadline },
                { l: tab === "den" ? "Nơi gửi" : "Nơi nhận", v: tab === "den" ? titlePopup.noi_gui : titlePopup.noi_nhan },
                { l: "Người ký/ban hành", v: titlePopup.nguoi_ky },
                { l: "Cán bộ được giao", v: titlePopup.can_bo_xu_ly },
                { l: "Trạng thái VB", v: titlePopup.trang_thai_van_ban },
                { l: "Ghi chú", v: titlePopup.ghi_chu, full: true }
              ].filter((f) => f.v).map((f, i) => (
                <div key={i} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 }}>{f.l}</div>
                  <div style={{ fontSize: 13, color: "#1E293B", padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0", wordBreak: "break-word" }}>{f.v}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 4 }}>TRẠNG THÁI TIẾN ĐỘ</div>
                <div style={{ padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <StatusBadge deadline={titlePopup.deadline} statusOverride={titlePopup.status} />
                </div>
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
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Thống kê xử lý văn bản</div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#6366F1" }}>{tabItems.filter((i) => i.can_bo_xu_ly && i.can_bo_xu_ly.includes(canBoPopup.name)).length}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Tổng văn bản</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#15803D" }}>{tabItems.filter((i) => i.can_bo_xu_ly && i.can_bo_xu_ly.includes(canBoPopup.name) && i.status === "hoan_thanh").length}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Hoàn thành</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#DC2626" }}>{tabItems.filter((i) => i.can_bo_xu_ly && i.can_bo_xu_ly.includes(canBoPopup.name) && getStatus(i.deadline, i.status) === "qua_han").length}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Quá hạn</div>
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
        <Modal 
          title={editItem ? "✏️ Chỉnh sửa Văn Bản" : "➕ Thêm Văn Bản Mới"} 
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
        >
          <XuLyVanBanForm 
            initial={editItem ? editItem : { loai_luong: tab }} 
            officerList={officerList} 
            currentTab={tab} 
            onSave={handleSave} 
            onClose={() => {
              setShowModal(false);
              setEditItem(null);
            }} 
            isMobile={isMobile}
            currentUser={currentUser}
            loaiVanBanList={uniqueLoaiVanBan}
          />
        </Modal>
      )}
    </div>
  );
}

function XuLyVanBanForm({ initial, officerList, currentTab, onSave, onClose, isMobile, currentUser, loaiVanBanList }) {
  const [form, setForm] = useState(() => {
    const base = {
      ma_so: initial?.ma_so || "",
      tieu_de: initial?.tieu_de || "",
      loai_van_ban: initial?.loai_van_ban || "Công văn",
      loai_luong: initial?.loai_luong || currentTab || "den",
      ngay_ban_hanh: initial?.ngay_ban_hanh || "",
      ngay_tiep_nhan: initial?.ngay_tiep_nhan || "",
      noi_gui: initial?.noi_gui || "",
      noi_nhan: initial?.noi_nhan || "",
      deadline: initial?.deadline || "",
      nguoi_ky: initial?.nguoi_ky || "",
      can_bo_xu_ly: initial?.can_bo_xu_ly || currentUser?.name || "",
      trang_thai_van_ban: initial?.trang_thai_van_ban || "Đang xử lý",
      priority: initial?.priority || "trung_binh",
      status: initial?.status || "dang_xu_ly",
      ghi_chu: initial?.ghi_chu || ""
    };
    if (!base.can_bo_xu_ly) base.can_bo_xu_ly = currentUser?.name || "";
    return base;
  });

  const [isCustomLoai, setIsCustomLoai] = useState(() => {
    return !!(initial?.loai_van_ban && !loaiVanBanList.includes(initial.loai_van_ban));
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isDi = form.loai_luong === "di";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Loại luồng">
          <select value={form.loai_luong || "den"} onChange={(e) => set("loai_luong", e.target.value)} style={selectSt}>
            <option value="den">📥 Văn bản đến</option>
            <option value="di">📤 Văn bản đi</option>
          </select>
        </FormField>
        <FormField label="Loại văn bản">
          <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
            <select 
              value={isCustomLoai ? "Khác" : (form.loai_van_ban || "Công văn")} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === "Khác") {
                  setIsCustomLoai(true);
                  set("loai_van_ban", "");
                } else {
                  setIsCustomLoai(false);
                  set("loai_van_ban", val);
                }
              }} 
              style={selectSt}
            >
              {loaiVanBanList.map((l) => <option key={l} value={l}>{l}</option>)}
              <option value="Khác">-- Khác (Tự điền) --</option>
            </select>
            {isCustomLoai && (
              <input 
                value={form.loai_van_ban || ""} 
                onChange={(e) => set("loai_van_ban", e.target.value)} 
                placeholder="Nhập loại văn bản mới..." 
                style={inputSt} 
              />
            )}
          </div>
        </FormField>
        <FormField label="Mã số" required={true}>
          <input value={form.ma_so || ""} onChange={(e) => set("ma_so", e.target.value)} style={inputSt} />
        </FormField>
        {isDi ? (
          <FormField label="Nơi nhận">
            <input value={form.noi_nhan || ""} onChange={(e) => set("noi_nhan", e.target.value)} style={inputSt} placeholder="Đơn vị nhận văn bản" />
          </FormField>
        ) : (
          <FormField label="Nơi gửi">
            <input value={form.noi_gui || ""} onChange={(e) => set("noi_gui", e.target.value)} style={inputSt} placeholder="Đơn vị gửi văn bản" />
          </FormField>
        )}
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Tiêu đề văn bản" required={true}>
            <input value={form.tieu_de || ""} onChange={(e) => set("tieu_de", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Ngày ban hành">
          <input type="date" value={form.ngay_ban_hanh || ""} onChange={(e) => set("ngay_ban_hanh", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Ngày tiếp nhận">
          <input type="date" value={form.ngay_tiep_nhan || ""} onChange={(e) => set("ngay_tiep_nhan", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Thời hạn xử lý">
          <input type="date" value={form.deadline || ""} onChange={(e) => set("deadline", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Người ký/ban hành">
          <input value={form.nguoi_ky || ""} onChange={(e) => set("nguoi_ky", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ được giao xử lý">
          <select value={form.can_bo_xu_ly || ""} onChange={(e) => set("can_bo_xu_ly", e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Trạng thái">
          <select value={form.status || "dang_xu_ly"} onChange={(e) => set("status", e.target.value)} style={selectSt}>
            <option value="dang_xu_ly">Đang xử lý</option>
            <option value="hoan_thanh">Đã xử lý xong</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={form.ghi_chu || ""} onChange={(e) => set("ghi_chu", e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(form)} style={{ padding: "10px 24px", background: "#84CC16", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}
