"use client";

import React, { useState, useMemo, useEffect, Component } from 'react';
import dynamic from 'next/dynamic';
import { Modal, FormField, exportToPrint, exportToWord, getShortName } from '@/app/components/shared';
import { RankBadge } from '@/app/components/shared';

// Dynamically import LeafletMap with ssr disabled to prevent document/window undefined errors
const LeafletMap = dynamic(
  () => import('@/app/components/LeafletMap'),
  { ssr: false, loading: () => <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", borderRadius: "16px", color: "#64748B" }}>Đang tải bản đồ...</div> }
);

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 12, color: "#C53030" }}>
          <h3>⚠️ Lỗi hiển thị mục Quản lý Cộng tác viên</h3>
          <p>Đã xảy ra lỗi khi tải giao diện. Chi tiết lỗi:</p>
          <pre style={{ background: "#FFF", padding: 12, borderRadius: 8, overflowX: "auto", fontSize: 12 }}>
            {this.state.error?.message}
            {"\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const CLASSIFICATIONS = ["CS", "ĐT1", "ĐT2", "ĐT3", "DD", "HT"];

const STATUS_LIST = [
  { value: "hoat_dong", label: "Hoạt động", color: "#22C55E" },
  { value: "tam_ngung", label: "Tạm ngưng", color: "#F59E0B" },
  { value: "dung_hoat_dong", label: "Dừng hoạt động", color: "#EF4444" }
];

const HUE_WARRENTS = [
  "Phường Thuận Hoà",
  "Phường Phú Xuân",
  "Phường An Cựu",
  "Phường Vỹ Dạ",
  "Phường Phú Hội",
  "Phường Phú Nhuận",
  "Phường Kim Long",
  "Phường Hương Sơ",
  "Phường Tây Lộc",
  "Phường Thuận Lộc",
  "Phường Đúc",
  "Phường Vĩnh Ninh",
  "Phường Xuân Phú",
  "Phường Trường An",
  "Phường Phú Bình",
  "Phường Phú Hiệp",
  "Phường Phú Cát",
  "Phường Phú Hậu",
  "Khác"
];

const inputSt = { width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectSt = { ...inputSt, background: "#fff" };
const textareaSt = { ...inputSt, resize: "vertical", minHeight: 80 };

export default function CollaboratorView(props) {
  return (
    <ErrorBoundary>
      <CollaboratorViewInner {...props} />
    </ErrorBoundary>
  );
}

function CollaboratorViewInner({ data, onDataChange, currentUser, addLog, users, isMobile }) {
  const items = useMemo(() => {
    return (data["collaborators"] || []).filter(i => i && typeof i === 'object').map(item => ({
      ...item,
      // Map status fallback
      status: item.status === "tam_khoa" ? "tam_ngung" : (item.status === "ngung_hoat_dong" ? "dung_hoat_dong" : (item.status || "hoat_dong")),
      classification: item.classification || "CS"
    }));
  }, [data["collaborators"]]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterNoiO, setFilterNoiO] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [sortBy, setSortBy] = useState("moi_nhat");
  
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [ctvDetailPopup, setCtvDetailPopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);
  const [mapModalCtv, setMapModalCtv] = useState(null);

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const isOfficer = currentUser.role === "officer";
  const canAddNew = isAdmin || isOfficer;
  const canEdit = (item) => isAdmin || (isOfficer && item.managing_officer === currentUser.name);
  const canDelete = (item) => currentUser.role === "admin";
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);

  // Statistics counters
  const total = items.length;
  const countCS = items.filter(i => i.classification === "CS").length;
  const countĐT1 = items.filter(i => i.classification === "ĐT1").length;
  const countĐT2 = items.filter(i => i.classification === "ĐT2").length;
  const countĐT3 = items.filter(i => i.classification === "ĐT3").length;
  const countDD = items.filter(i => i.classification === "DD").length;
  const countHT = items.filter(i => i.classification === "HT").length;

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) {
      list = list.filter((i) =>
        Object.values(i).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    
    if (filterStatus !== "all") {
      list = list.filter((i) => i.status === filterStatus);
    }
    if (filterNoiO !== "all") list = list.filter((i) => i.address && i.address.includes(filterNoiO));
    if (filterCanBo !== "all") list = list.filter((i) => i.managing_officer && i.managing_officer.includes(filterCanBo));
    if (filterClass !== "all") list = list.filter((i) => i.classification === filterClass);

    if (sortBy === "moi_nhat") {
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    if (sortBy === "nickname") {
      list.sort((a, b) => (a.nickname || "").localeCompare(b.nickname || "", 'vi', { sensitivity: 'base' }));
    }
    if (sortBy === "ma_so") {
      list.sort((a, b) => (a.ma_so || "").localeCompare(b.ma_so || "", 'vi', { sensitivity: 'base' }));
    }
    if (sortBy === "classification") {
      list.sort((a, b) => (a.classification || "").localeCompare(b.classification || "", 'vi', { sensitivity: 'base' }));
    }
    return list;
  }, [items, search, filterStatus, filterNoiO, filterCanBo, filterClass, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [items, search, filterStatus, filterNoiO, filterCanBo, filterClass, sortBy, pageSize]);

  const handleSave = (form) => {
    const cur = data["collaborators"] || [];
    const f = { 
      ...form, 
      lat: parseFloat(form.lat) || 16.4637,
      lng: parseFloat(form.lng) || 107.5909,
      coverage_radius: parseInt(form.coverage_radius) || 500,
      status: form.status || "hoat_dong",
      classification: form.classification || "CS"
    };
    
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật cộng tác viên: ${f.nickname}`, "collaborators");
    } else {
      const id = Math.max(0, ...cur.map((i) => i.id || 0)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm cộng tác viên: ${f.nickname}`, "collaborators");
    }
    onDataChange("collaborators", nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa cộng tác viên "${item.nickname}" khỏi hệ thống?`)) return;
    onDataChange("collaborators", (data["collaborators"] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa cộng tác viên: ${item.nickname}`, "collaborators");
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return;
    const myItems = items.filter((i) => i.managing_officer && i.managing_officer.includes(name));
    setCanBoPopup({
      ...u,
      total_ctv: myItems.length,
      active_ctv: myItems.filter((i) => i.status === "hoat_dong" || !i.status).length
    });
  };

  return (
    <div>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>👥 Quản Lý Cộng Tác Viên</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Hệ thống quản lý thông tin, phân loại địa bàn và cán bộ phụ trách của CTV</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(15,23,42,0.3)", width: isMobile ? "100%" : "auto" }}
          >
            + Thêm cộng tác viên
          </button>
        )}
      </div>

      {/* Global Search Bar */}
      <div style={{ position: "relative", marginBottom: 18 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm nhanh: biệt danh, mã số, số điện thoại, địa chỉ, cán bộ quản lý..."
          style={{ width: "100%", padding: "13px 16px 13px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
        />
      </div>

      {/* KPI Stats Cards containing requested metrics: Tổng, CS, ĐT1, ĐT2, ĐT3, DD, HT */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(7,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Tổng số CTV", value: total, color: "#1E293B", bg: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", border: "#CBD5E1" },
          { label: "Cơ sở (CS)", value: countCS, color: "#2563EB", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "#BFDBFE" },
          { label: "Đối tượng 1 (ĐT1)", value: countĐT1, color: "#DC2626", bg: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: "#FECACA" },
          { label: "Đối tượng 2 (ĐT2)", value: countĐT2, color: "#D97706", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "#FDE68A" },
          { label: "Đối tượng 3 (ĐT3)", value: countĐT3, color: "#4F46E5", bg: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", border: "#C7D2FE" },
          { label: "Dẫn dắt (DD)", value: countDD, color: "#0D9488", bg: "linear-gradient(135deg,#F0FDF4,#CCFBF1)", border: "#99F6E4" },
          { label: "Hỗ trợ (HT)", value: countHT, color: "#0891B2", bg: "linear-gradient(135deg,#ECFEFF,#CFFAFE)", border: "#A5F3FC" }
        ].map((k, idx) => (
          <div key={idx} style={{ padding: 12, background: k.bg, borderRadius: 12, border: `1px solid ${k.border}`, boxShadow: "0 2px 4px rgba(0,0,0,0.01)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", lineHeight: 1.2 }}>{k.label}</span>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.color, marginTop: 6 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div style={{ background: "#FAFBFC", border: "1px solid #E5E7EB", borderRadius: 14, padding: 14, marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Lọc & Sắp xếp:</div>
        
        {/* District Address Filter */}
        <select value={filterNoiO} onChange={(e) => setFilterNoiO(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 12, background: "#fff" }}>
          <option value="all">Tất cả địa bàn</option>
          {HUE_WARRENTS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        {/* Managing Officer Filter */}
        <select value={filterCanBo} onChange={(e) => setFilterCanBo(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 12, background: "#fff" }}>
          <option value="all">Tất cả Cán bộ quản lý</option>
          {officerList.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        {/* Classification Filter */}
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 12, background: "#fff" }}>
          <option value="all">Tất cả phân loại</option>
          {CLASSIFICATIONS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 12, background: "#fff" }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="hoat_dong">Hoạt động</option>
          <option value="tam_ngung">Tạm ngưng</option>
          <option value="dung_hoat_dong">Dừng hoạt động</option>
        </select>

        {/* Sort select */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 12, background: "#fff", marginLeft: "auto" }}>
          <option value="moi_nhat">Mới nhất</option>
          <option value="nickname">Sắp xếp theo Biệt danh</option>
          <option value="ma_so">Sắp xếp theo Mã số</option>
          <option value="classification">Sắp xếp theo Phân loại</option>
        </select>

        {/* Export options */}
        <div style={{ display: "flex", gap: 6 }}>
          <button 
            onClick={() => {
              const columns = ["Mã số", "Biệt danh", "Phân loại", "Địa chỉ", "Số điện thoại", "Cán bộ phụ trách", "Trạng thái"];
              const rows = filtered.map(i => [
                i.ma_so, i.nickname, i.classification, i.address, i.phone || "—", i.managing_officer || "—", 
                i.status === "hoat_dong" ? "Hoạt động" : (i.status === "tam_ngung" ? "Tạm ngưng" : "Dừng HĐ")
              ]);
              exportToPrint({ title: "DANH SÁCH CỘNG TÁC VIÊN", columns, rows, currentUser });
            }}
            style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 700 }}
          >
            🖨️ In
          </button>
          <button 
            onClick={() => {
              const columns = ["Mã số", "Biệt danh", "Phân loại", "Địa chỉ", "Số điện thoại", "Cán bộ phụ trách", "Trạng thái"];
              const rows = filtered.map(i => [
                i.ma_so, i.nickname, i.classification, i.address, i.phone || "—", i.managing_officer || "—", 
                i.status === "hoat_dong" ? "Hoạt động" : (i.status === "tam_ngung" ? "Tạm ngưng" : "Dừng HĐ")
              ]);
              exportToWord({ title: "DANH SÁCH CỘNG TÁC VIÊN", columns, rows, currentUser, filename: "danh_sach_ctv" });
            }}
            style={{ padding: "6px 12px", background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 700 }}
          >
            📄 Word
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", width: 50 }}>STT</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569" }}>Mã CTV / Biệt danh</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", width: 100 }}>Phân loại</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569" }}>Địa chỉ hoạt động</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569" }}>Cán bộ quản lý</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", width: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                    Không tìm thấy cộng tác viên nào
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const absoluteIndex = (page - 1) * PAGE_SIZE + idx + 1;
                  
                  let badgeColor = "#22C55E", badgeText = "Hoạt động";
                  if (item.status === "tam_ngung") {
                    badgeColor = "#F59E0B"; badgeText = "Tạm ngưng";
                  } else if (item.status === "dung_hoat_dong") {
                    badgeColor = "#EF4444"; badgeText = "Dừng hoạt động";
                  }

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F3F4F6", background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 16px", textAlign: "center", fontSize: 13, color: "#475569" }}>{absoluteIndex}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <div 
                          onClick={() => setCtvDetailPopup(item)}
                          style={{ fontWeight: 700, color: "#1E293B", fontSize: 13, cursor: "pointer", display: "inline-block" }}
                          className="hover-underline"
                        >
                          {item.nickname}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{item.ma_so}</div>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <span style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          {item.classification}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#334155" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span>{item.address}</span>
                          <button
                            onClick={() => setMapModalCtv(item)}
                            title="Định vị tọa độ trên bản đồ"
                            style={{
                              border: "none",
                              background: "#EFF6FF",
                              color: "#2563EB",
                              padding: "4px 8px",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"}
                            onMouseLeave={e => e.currentTarget.style.background = "#EFF6FF"}
                          >
                            📍 Bản đồ
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {item.managing_officer ? (
                          <span 
                            onClick={() => handleCanBoClick(item.managing_officer)}
                            style={{ cursor: "pointer", fontWeight: 600, color: "#3B82F6", fontSize: 12 }}
                          >
                            {getShortName(item.managing_officer)}
                          </span>
                        ) : (
                          <span style={{ color: "#94A3B8", fontSize: 12 }}>Chưa phân công</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        {/* Text-based colored statuses: hoạt động -> green, tạm ngưng -> orange, dừng hoạt động -> red */}
                        <span style={{ color: badgeColor, fontSize: 12, fontWeight: 700 }}>
                          ● {badgeText}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button 
                            onClick={() => setCtvDetailPopup(item)}
                            style={{ border: "none", background: "none", color: "#3B82F6", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                          >
                            Chi tiết
                          </button>
                          {canEdit(item) && (
                            <button 
                              onClick={() => {
                                setEditItem(item);
                                setShowModal(true);
                              }}
                              style={{ border: "none", background: "none", color: "#D97706", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                            >
                              Sửa
                            </button>
                          )}
                          {canDelete(item) && (
                            <button 
                              onClick={() => handleDelete(item)}
                              style={{ border: "none", background: "none", color: "#DC2626", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                            >
                              Xóa
                            </button>
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
        <div style={{ padding: "10px 16px", borderTop: "1px solid #E5E7EB", fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: "#FAFBFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Hiển thị</span>
            <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} style={{ padding: "2px 6px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 11 }}>
              {[10, 15, 20, 50].map(n => (
                <option key={n} value={n}>{n} bản ghi</option>
              ))}
            </select>
            <span>/ <b>{filtered.length}</b> CTV</span>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer" }}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer" }}>‹</button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                const isAct = p === page;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{ padding: "4px 9px", border: "1px solid " + (isAct ? "#3B82F6" : "#E2E8F0"), borderRadius: 6, background: isAct ? "#3B82F6" : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontWeight: isAct ? 700 : 400 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer" }}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer" }}>»</button>
            </div>
          )}
        </div>
      </div>

      {/* 1. Add / Edit Modal Form */}
      {showModal && (
        <Modal 
          title={editItem ? "SỬA HỒ SƠ CỘNG TÁC VIÊN" : "THÊM CỘNG TÁC VIÊN MỚI"} 
          onClose={() => setShowModal(false)}
        >
          <CollaboratorForm 
            item={editItem} 
            officers={officerList} 
            onSave={handleSave} 
            onCancel={() => setShowModal(false)} 
            lastCode={Math.max(0, ...items.map(i => parseInt(i.ma_so?.split('-')[2]) || 0)) + 1}
          />
        </Modal>
      )}

      {/* 2. Map coordinates focus popup modal */}
      {mapModalCtv && (
        <Modal
          title={`VỊ TRÍ ĐỊA BÀN CỦA CTV: ${mapModalCtv.nickname}`}
          onClose={() => setMapModalCtv(null)}
          wide
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, color: "#475569" }}>
              📍 <b>Địa chỉ:</b> {mapModalCtv.address} · <b>Mã CTV:</b> {mapModalCtv.ma_so} · <b>Phân loại:</b> {mapModalCtv.classification}
            </div>
            <div style={{ height: "400px", width: "100%", borderRadius: "16px", overflow: "hidden" }}>
              <LeafletMap collaborators={[mapModalCtv]} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => setMapModalCtv(null)}
                style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. CTV Details Popup Modal */}
      {ctvDetailPopup && (
        <Modal 
          title="CHI TIẾT HỒ SƠ CỘNG TÁC VIÊN" 
          onClose={() => setCtvDetailPopup(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, borderBottom: "1px solid #E5E7EB", paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Mã CTV:</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{ctvDetailPopup.ma_so}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Biệt danh (Nickname):</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{ctvDetailPopup.nickname}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Phân loại CTV:</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8" }}>{ctvDetailPopup.classification}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Địa chỉ hoạt động:</span>
                <div style={{ fontSize: 14, color: "#334155" }}>{ctvDetailPopup.address}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Số điện thoại:</span>
                <div style={{ fontSize: 14, color: "#334155" }}>{ctvDetailPopup.phone || "—"}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Vị trí địa lý (Tọa độ):</span>
                <div style={{ fontSize: 13, color: "#334155" }}>Lat: {ctvDetailPopup.lat} · Lng: {ctvDetailPopup.lng}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Bán kính radar quét:</span>
                <div style={{ fontSize: 13, color: "#334155" }}>{ctvDetailPopup.coverage_radius} m</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Trạng thái hoạt động:</span>
                <div>
                  <span style={{ 
                    background: ctvDetailPopup.status === "hoat_dong" ? "#DCFCE7" : (ctvDetailPopup.status === "tam_ngung" ? "#FEF3C7" : "#FEF2F2"), 
                    color: ctvDetailPopup.status === "hoat_dong" ? "#15803D" : (ctvDetailPopup.status === "tam_ngung" ? "#B45309" : "#991B1B"), 
                    padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 
                  }}>
                    {ctvDetailPopup.status === "hoat_dong" ? "Hoạt động" : (ctvDetailPopup.status === "tam_ngung" ? "Tạm ngưng" : "Dừng hoạt động")}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Cán bộ quản lý:</span>
                <div style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>{ctvDetailPopup.managing_officer || "—"}</div>
              </div>
            </div>
            
            {ctvDetailPopup.ghi_chu && (
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Ghi chú nghiệp vụ:</span>
                <div style={{ fontSize: 13, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "10px 14px", borderRadius: 8, whiteSpace: "pre-wrap", marginTop: 4 }}>
                  {ctvDetailPopup.ghi_chu}
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              {canEdit(ctvDetailPopup) && (
                <button 
                  onClick={() => {
                    setEditItem(ctvDetailPopup);
                    setCtvDetailPopup(null);
                    setShowModal(true);
                  }}
                  style={{ padding: "8px 16px", background: "#D97706", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
                >
                  Chỉnh sửa
                </button>
              )}
              <button 
                onClick={() => setCtvDetailPopup(null)}
                style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Officer Details Popup Modal */}
      {canBoPopup && (
        <Modal 
          title="THÔNG TIN CÁN BỘ PHỤ TRÁCH" 
          onClose={() => setCanBoPopup(null)}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: isMobile ? "100%" : 120 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", color: "#2563EB", border: "2px solid #DBEAFE" }}>
                {canBoPopup.name?.split(" ").slice(-1)[0][0]}
              </div>
              <div style={{ fontWeight: 800, color: "#1E293B", fontSize: 15, marginTop: 8, textAlign: "center" }}>{canBoPopup.name}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{canBoPopup.chuc_vu}</div>
            </div>
            
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Cấp bậc:</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 4 }}>
                    <RankBadge capBac={canBoPopup.cap_bac} size={20} />
                    {canBoPopup.cap_bac}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Đơn vị:</span>
                  <div style={{ fontSize: 13, color: "#334155" }}>{canBoPopup.department}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Số điện thoại:</span>
                  <div style={{ fontSize: 13, color: "#334155" }}>{canBoPopup.phone || "—"}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Email thư điện tử:</span>
                  <div style={{ fontSize: 13, color: "#334155", wordBreak: "break-all" }}>{canBoPopup.email || "—"}</div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>CTV quản lý:</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2563EB" }}>{canBoPopup.total_ctv} CTV</div>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>CTV đang HĐ:</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#16A34A" }}>{canBoPopup.active_ctv} CTV</div>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button 
                  onClick={() => setCanBoPopup(null)}
                  style={{ padding: "6px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Collaborator Form component
function CollaboratorForm({ item, officers, onSave, onCancel, lastCode }) {
  const [form, setForm] = useState({
    ma_so: "",
    nickname: "",
    classification: "CS",
    address: "",
    phone: "",
    managing_officer: "",
    lat: "16.4637",
    lng: "107.5909",
    coverage_radius: "500",
    status: "hoat_dong",
    ghi_chu: ""
  });

  useEffect(() => {
    if (item) {
      setForm({
        ma_so: item.ma_so || "",
        nickname: item.nickname || "",
        classification: item.classification || "CS",
        address: item.address || "",
        phone: item.phone || "",
        managing_officer: item.managing_officer || "",
        lat: String(item.lat || "16.4637"),
        lng: String(item.lng || "107.5909"),
        coverage_radius: String(item.coverage_radius || "500"),
        status: item.status || "hoat_dong",
        ghi_chu: item.ghi_chu || ""
      });
    } else {
      const year = new Date().getFullYear();
      const nextCode = String(lastCode).padStart(3, "0");
      setForm(prev => ({
        ...prev,
        ma_so: `CTV-${year}-${nextCode}`
      }));
    }
  }, [item, lastCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nickname.trim()) {
      alert("Vui lòng điền Biệt danh của CTV");
      return;
    }
    if (!form.address.trim()) {
      alert("Vui lòng điền Địa chỉ hoạt động");
      return;
    }
    if (isNaN(parseFloat(form.lat)) || isNaN(parseFloat(form.lng))) {
      alert("Tọa độ Latitude và Longitude phải là một số hợp lệ");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Mã CTV (Quy hoạch)" required>
          <input 
            name="ma_so" 
            value={form.ma_so} 
            onChange={handleChange} 
            required 
            style={inputSt} 
            placeholder="Ví dụ: CTV-2026-001" 
          />
        </FormField>
        
        <FormField label="Biệt danh (Nickname)" required>
          <input 
            name="nickname" 
            value={form.nickname} 
            onChange={handleChange} 
            required 
            style={inputSt} 
            placeholder="Ví dụ: Anh Bảy Chợ Đông Ba" 
          />
        </FormField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Phân loại CTV" required>
          <select 
            name="classification" 
            value={form.classification} 
            onChange={handleChange} 
            style={selectSt}
          >
            {CLASSIFICATIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Số điện thoại liên lạc">
          <input 
            name="phone" 
            value={form.phone} 
            onChange={handleChange} 
            style={inputSt} 
            placeholder="Ví dụ: 0905XXXXXX" 
          />
        </FormField>
      </div>

      <FormField label="Địa chỉ địa bàn hoạt động" required>
        <input 
          name="address" 
          value={form.address} 
          onChange={handleChange} 
          required 
          style={inputSt} 
          placeholder="Ví dụ: Cổng chính Chợ Đông Ba, Huế" 
        />
      </FormField>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 10 }}>
        <FormField label="Kinh độ (Longitude)" required>
          <input 
            name="lng" 
            value={form.lng} 
            onChange={handleChange} 
            required 
            style={inputSt} 
            placeholder="Ví dụ: 107.5909" 
          />
        </FormField>
        
        <FormField label="Vĩ độ (Latitude)" required>
          <input 
            name="lat" 
            value={form.lat} 
            onChange={handleChange} 
            required 
            style={inputSt} 
            placeholder="Ví dụ: 16.4637" 
          />
        </FormField>

        <FormField label="Bán kính quy hoạch (m)" required>
          <input 
            name="coverage_radius" 
            value={form.coverage_radius} 
            onChange={handleChange} 
            required 
            type="number"
            style={inputSt} 
            placeholder="Ví dụ: 500" 
          />
        </FormField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Cán bộ quản lý phụ trách">
          <select 
            name="managing_officer" 
            value={form.managing_officer} 
            onChange={handleChange} 
            style={selectSt}
          >
            <option value="">-- Chọn cán bộ --</option>
            {officers.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Trạng thái quy hoạch">
          <select 
            name="status" 
            value={form.status} 
            onChange={handleChange} 
            style={selectSt}
          >
            {STATUS_LIST.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Ghi chú nghiệp vụ / Mô tả địa bàn">
        <textarea 
          name="ghi_chu" 
          value={form.ghi_chu} 
          onChange={handleChange} 
          style={textareaSt} 
          placeholder="Ghi chú thêm các mối quan hệ, các đối tượng cần lưu ý trong khu vực..."
        />
      </FormField>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
        <button 
          type="button" 
          onClick={onCancel}
          style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
        >
          Hủy bỏ
        </button>
        <button 
          type="submit" 
          style={{ padding: "8px 16px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
        >
          Lưu hồ sơ
        </button>
      </div>
    </form>
  );
}
