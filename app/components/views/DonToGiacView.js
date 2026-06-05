"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  StatusBadge,
  PriorityBadge2,
  HanhViBadge,
  RankBadge,
  Modal,
  FormField,
  UserAvatar,
  getStatus,
  HANH_VI_LIST,
  exportToPrint,
  exportToWord,
  formatVNdate,
  getShortName
} from '@/app/components/shared';

const inputSt = { width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectSt = { ...inputSt, background: "#fff" };
const textareaSt = { ...inputSt, resize: "vertical", minHeight: 80 };

export default function DonToGiacView({ data, onDataChange, currentUser, addLog, users, selectedRecord, clearSelectedRecord, isMobile }) {
  const allItems = data["don_to_giac"] || [];
  const donItems = allItems.filter((i) => !i.loai || i.loai === "don");
  const tinItems = allItems.filter((i) => i.loai === "tin7575");
  const cngItems = allItems.filter((i) => i.loai === "cong_nghe_cao");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [tab, setTab] = useState("don");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHanhVi, setFilterHanhVi] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("ngay_tiep_nhan_desc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [titlePopup, setTitlePopup] = useState(null);
  const [nguoiGuiPopup, setNguoiGuiPopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const canAddNew = true;
  const canEdit = (item) => isAdmin || item.nguoi_nhap === currentUser.name;
  const canDelete = (item) => currentUser.role === "admin";
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);
  const items = tab === "cong_nghe_cao" ? cngItems : tab === "don" ? donItems : tinItems;
  const isDon = tab === "don";
  const isTin = tab === "tin7575";
  const isCng = tab === "cong_nghe_cao";
  const total = items.length;
  const da_ht = items.filter((i) => i.status === "hoan_thanh").length;
  const dang_xm = items.filter((i) => getStatus(i.deadline, i.status) === "dang_lam" || getStatus(i.deadline, i.status) === "sap_het_han").length;
  const sap_het = items.filter((i) => getStatus(i.deadline, i.status) === "sap_het_han").length;
  const qua_han = items.filter((i) => getStatus(i.deadline, i.status) === "qua_han").length;

  useEffect(() => {
    if (selectedRecord && (selectedRecord._page === "don_to_giac" || selectedRecord._mod?.id === "don_to_giac")) {
      const recLoai = selectedRecord.loai || "don";
      if (recLoai === "tin7575") {
        setTab("tin7575");
      } else if (recLoai === "cong_nghe_cao") {
        setTab("cong_nghe_cao");
      } else {
        setTab("don");
      }
      
      const found = allItems.find(i => i.id === selectedRecord.id || i.ma_so === selectedRecord.ma_so);
      if (found) {
        setTitlePopup(found);
      } else {
        setTitlePopup(selectedRecord);
      }
      if (clearSelectedRecord) {
        clearSelectedRecord();
      }
    }
  }, [selectedRecord, allItems, clearSelectedRecord]);

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) list = list.filter((i) => Object.values(i).some((v) => String(v).toLowerCase().includes(q)));
    if (filterStatus === "hoan_thanh") list = list.filter((i) => i.status === "hoan_thanh");
    else if (filterStatus === "dang_xu_ly") list = list.filter((i) => i.status !== "hoan_thanh" && getStatus(i.deadline, i.status) !== "qua_han");
    else if (filterStatus === "qua_han") list = list.filter((i) => getStatus(i.deadline, i.status) === "qua_han");
    else if (filterStatus === "sap_het") list = list.filter((i) => getStatus(i.deadline, i.status) === "sap_het_han");
    if (filterHanhVi !== "all") list = list.filter((i) => i.hanh_vi === filterHanhVi);
    if (filterCanBo !== "all") list = list.filter((i) => i.phu_trach && i.phu_trach.includes(filterCanBo));
    if (filterPriority !== "all") list = list.filter((i) => i.priority === filterPriority);
    if (sortBy === "ngay_tiep_nhan_desc") list.sort((a, b) => new Date(b.ngay_tiep_nhan || 0) - new Date(a.ngay_tiep_nhan || 0));
    if (sortBy === "ngay_tiep_nhan_asc") list.sort((a, b) => new Date(a.ngay_tiep_nhan || 0) - new Date(b.ngay_tiep_nhan || 0));
    if (sortBy === "deadline_asc") list.sort((a, b) => new Date(a.deadline || "9999") - new Date(b.deadline || "9999"));
    if (sortBy === "priority") list.sort((a, b) => ["cao", "trung_binh", "thap"].indexOf(a.priority || "thap") - ["cao", "trung_binh", "thap"].indexOf(b.priority || "thap"));
    if (sortBy === "ma_so") list.sort((a, b) => (a.ma_so || "").localeCompare(b.ma_so || ""));
    return list;
  }, [items, search, filterStatus, filterHanhVi, filterCanBo, filterPriority, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [items, search, filterStatus, filterHanhVi, filterCanBo, filterPriority, sortBy, tab, pageSize]);

  const handleSave = (form) => {
    const cur = data["don_to_giac"] || [];
    const f = { ...form, loai: form.loai || tab, nguoi_nhap: form.nguoi_nhap || currentUser.name };
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật: ${f.ma_so}`, isCng ? "don_cnc" : isDon ? "don_to_giac" : "tin_7575");
    } else {
      const id = Math.max(0, ...cur.map((i) => i.id)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm ${isCng ? "đơn CNC" : isDon ? "đơn" : "tin 7575"}: ${f.ma_so}`, isCng ? "don_cnc" : isDon ? "don_to_giac" : "tin_7575");
    }
    onDataChange("don_to_giac", nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa "${item.tieu_de}"?`)) return;
    onDataChange("don_to_giac", (data["don_to_giac"] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa: ${item.ma_so}`, isCng ? "don_cnc" : isDon ? "don_to_giac" : "tin_7575");
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return;
    const myAll = allItems.filter((i) => i.phu_trach && i.phu_trach.includes(name));
    const cur = myAll.filter((i) => (i.loai || "don") === tab);
    setCanBoPopup({
      ...u,
      tabLabel: tab === "don" ? "Tổng đơn" : tab === "cong_nghe_cao" ? "Tổng đơn CNC" : "Tổng tin",
      total_cur: cur.length,
      dang_xm_cur: cur.filter((i) => i.status !== "hoan_thanh" && getStatus(i.deadline, i.status) !== "qua_han").length,
      hoan_thanh_cur: cur.filter((i) => i.status === "hoan_thanh").length,
      qua_han_cur: cur.filter((i) => getStatus(i.deadline, i.status) === "qua_han").length
    });
  };

  const tabStyle = (active, c1, c2) => ({
    padding: "10px 24px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    borderRadius: "10px 10px 0 0",
    transition: "all 0.2s",
    background: active ? `linear-gradient(135deg,${c1},${c2})` : "#F1F5F9",
    color: active ? "#fff" : "#64748B",
    boxShadow: active ? "0 -4px 12px rgba(0,0,0,0.12)" : "none",
    position: "relative",
    zIndex: active ? 2 : 1
  });

  const headerColor = isCng ? "linear-gradient(135deg,#4C1D95,#7C3AED)" : isDon ? "linear-gradient(135deg,#1E3A8A,#2563EB)" : "linear-gradient(135deg,#065F46,#059669)";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>📋 Đơn Tố Giác – Đơn Công Nghệ Cao – Tin 7575</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý đơn tố giác, đơn công nghệ cao và tin báo đường dây nóng 7575</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{
              padding: "10px 20px",
              background: isCng ? "linear-gradient(135deg,#4C1D95,#7C3AED)" : isDon ? "linear-gradient(135deg,#1E3A8A,#2563EB)" : "linear-gradient(135deg,#065F46,#059669)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: `0 4px 12px ${isDon ? "rgba(37,99,235,0.3)" : "rgba(5,150,105,0.3)"}`,
              width: isMobile ? "100%" : "auto"
            }}
          >
            + Thêm {isDon ? "đơn tố giác" : isCng ? "đơn công nghệ cao" : "tin 7575"}
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isDon ? "Tìm kiếm mã số, tiêu đề, người gửi, hành vi, cán bộ thụ lý..." : "Tìm kiếm mã số, tiêu đề, hành vi, cán bộ..."}
          style={{ width: "100%", padding: "12px 16px 12px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
          onFocus={(e) => e.target.style.borderColor = isDon ? "#2563EB" : "#059669"}
          onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius: 14, padding: "14px 16px", border: "1px solid #BFDBFE", boxShadow: "0 2px 8px rgba(37,99,235,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#1E3A8A" }}>Đơn Tố Giác</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 8 }}>
            {[
              { l: "Tổng đơn", v: donItems.length, c: "#1E3A8A" },
              { l: "Đang xác minh", v: donItems.filter((i) => i.status !== "hoan_thanh").length, c: "#2563EB" },
              { l: "Hoàn thành", v: donItems.filter((i) => i.status === "hoan_thanh").length, c: "#15803D" },
              { l: "Quá hạn", v: donItems.filter((i) => i.status !== "hoan_thanh" && getStatus(i.deadline, i.status) === "qua_han").length, c: "#DC2626" }
            ].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: "center", padding: "9px 4px", background: "rgba(255,255,255,0.7)", borderRadius: 10, cursor: "pointer" }}
                onClick={() => {
                  setTab("don"); setPage(1);
                  if (i === 3) setFilterStatus("qua_han");
                  else if (i === 2) setFilterStatus("hoan_thanh");
                  else if (i === 1) setFilterStatus("dang_xu_ly");
                  else setFilterStatus("all");
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, marginTop: 2, whiteSpace: "nowrap" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg,#FAF5FF,#EDE9FE)", borderRadius: 14, padding: "14px 16px", border: "1px solid #C4B5FD", boxShadow: "0 2px 8px rgba(124,58,237,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>💻</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#4C1D95" }}>Đơn Công Nghệ Cao</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 8 }}>
            {[
              { l: "Tổng đơn", v: cngItems.length, c: "#4C1D95" },
              { l: "Đang xác minh", v: cngItems.filter((i) => i.status !== "hoan_thanh").length, c: "#7C3AED" },
              { l: "Hoàn thành", v: cngItems.filter((i) => i.status === "hoan_thanh").length, c: "#15803D" },
              { l: "Quá hạn", v: cngItems.filter((i) => i.status !== "hoan_thanh" && getStatus(i.deadline, i.status) === "qua_han").length, c: "#DC2626" }
            ].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: "center", padding: "9px 4px", background: "rgba(255,255,255,0.7)", borderRadius: 10, cursor: "pointer" }}
                onClick={() => {
                  setTab("cong_nghe_cao"); setPage(1);
                  if (i === 3) setFilterStatus("qua_han");
                  else if (i === 2) setFilterStatus("hoan_thanh");
                  else if (i === 1) setFilterStatus("dang_xu_ly");
                  else setFilterStatus("all");
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, marginTop: 2, whiteSpace: "nowrap" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", borderRadius: 14, padding: "14px 16px", border: "1px solid #A7F3D0", boxShadow: "0 2px 8px rgba(5,150,105,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>📞</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#065F46" }}>Tin 7575</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 8 }}>
            {[
              { l: "Tổng tin", v: tinItems.length, c: "#065F46" },
              { l: "Đang xác minh", v: tinItems.filter((i) => i.status !== "hoan_thanh").length, c: "#059669" },
              { l: "Hoàn thành", v: tinItems.filter((i) => i.status === "hoan_thanh").length, c: "#15803D" },
              { l: "Quá hạn", v: tinItems.filter((i) => i.status !== "hoan_thanh" && getStatus(i.deadline, i.status) === "qua_han").length, c: "#DC2626" }
            ].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: "center", padding: "9px 4px", background: "rgba(255,255,255,0.7)", borderRadius: 10, cursor: "pointer" }}
                onClick={() => {
                  setTab("tin7575"); setPage(1);
                  if (i === 3) setFilterStatus("qua_han");
                  else if (i === 2) setFilterStatus("hoan_thanh");
                  else if (i === 1) setFilterStatus("dang_xu_ly");
                  else setFilterStatus("all");
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, marginTop: 2, whiteSpace: "nowrap" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "11px 14px", border: "1px solid #E2E8F0", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", flexShrink: 0, width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 4 : 0 }}>Lọc:</span>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 160, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="dang_xu_ly">Đang xác minh</option>
          <option value="hoan_thanh">Đã hoàn thành</option>
          <option value="sap_het">Sắp hết hạn</option>
          <option value="qua_han">Quá hạn</option>
        </select>
        <select value={filterHanhVi} onChange={(e) => setFilterHanhVi(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả hành vi</option>
          {HANH_VI_LIST.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select value={filterCanBo} onChange={(e) => setFilterCanBo(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 180, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả cán bộ</option>
          {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 150, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả ưu tiên</option>
          <option value="cao">🔴 Cao</option>
          <option value="trung_binh">🟡 Trung bình</option>
          <option value="thap">🟢 Thấp</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 210, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="ngay_tiep_nhan_desc">📅 Mới tiếp nhận trước</option>
          <option value="ngay_tiep_nhan_asc">📅 Cũ tiếp nhận trước</option>
          <option value="deadline_asc">⌛ Gần hết hạn trước</option>
          <option value="priority">🔺 Ưu tiên cao trước</option>
          <option value="ma_so">🔤 Theo mã số</option>
        </select>
        {(filterStatus !== "all" || filterHanhVi !== "all" || filterCanBo !== "all" || filterPriority !== "all" || search) && (
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterHanhVi("all");
              setFilterCanBo("all");
              setFilterPriority("all");
              setSearch("");
            }}
            style={{ padding: "6px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
          >
            ✕ Xóa lọc
          </button>
        )}
        <button
          onClick={() => {
            const isDon = tab === "don";
            const isCng = tab === "cong_nghe_cao";
            const title = isDon 
              ? "DANH SÁCH ĐƠN TỐ GIÁC TIN BÁO" 
              : isCng 
                ? "DANH SÁCH ĐƠN CÔNG NGHỆ CAO" 
                : "DANH SÁCH TIN 7575";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = (isDon || isCng)
              ? ["Mã số", "Tiêu đề", "Người gửi", "Hành vi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ thụ lý", "Trạng thái", "Ưu tiên"]
              : ["Mã số", "Tiêu đề", "Hành vi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ thụ lý", "Trạng thái", "Ưu tiên"];
            const rows = filtered.map(item => (isDon || isCng) ? [
              item.ma_so || "—",
              item.tieu_de || "—",
              item.nguoi_to_giac || "—",
              item.hanh_vi || "—",
              item.ngay_tiep_nhan || "—",
              item.deadline || "—",
              item.phu_trach || "—",
              item.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý",
              item.priority === "cao" ? "Cao" : item.priority === "thap" ? "Thấp" : "TB"
            ] : [
              item.ma_so || "—",
              item.tieu_de || "—",
              item.hanh_vi || "—",
              item.ngay_tiep_nhan || "—",
              item.deadline || "—",
              item.phu_trach || "—",
              item.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý",
              item.priority === "cao" ? "Cao" : item.priority === "thap" ? "Thấp" : "TB"
            ]);
            exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          🖨️ In
        </button>
        <button
          onClick={() => {
            const isDon = tab === "don";
            const isCng = tab === "cong_nghe_cao";
            const title = isDon 
              ? "DANH SÁCH ĐƠN TỐ GIÁC TIN BÁO" 
              : isCng 
                ? "DANH SÁCH ĐƠN CÔNG NGHỆ CAO" 
                : "DANH SÁCH TIN 7575";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = (isDon || isCng)
              ? ["Mã số", "Tiêu đề", "Người gửi", "Hành vi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ thụ lý", "Trạng thái", "Ưu tiên"]
              : ["Mã số", "Tiêu đề", "Hành vi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ thụ lý", "Trạng thái", "Ưu tiên"];
            const rows = filtered.map(item => (isDon || isCng) ? [
              item.ma_so || "—",
              item.tieu_de || "—",
              item.nguoi_to_giac || "—",
              item.hanh_vi || "—",
              item.ngay_tiep_nhan || "—",
              item.deadline || "—",
              item.phu_trach || "—",
              item.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý",
              item.priority === "cao" ? "Cao" : item.priority === "thap" ? "Thấp" : "TB"
            ] : [
              item.ma_so || "—",
              item.tieu_de || "—",
              item.hanh_vi || "—",
              item.ngay_tiep_nhan || "—",
              item.deadline || "—",
              item.phu_trach || "—",
              item.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý",
              item.priority === "cao" ? "Cao" : item.priority === "thap" ? "Thấp" : "TB"
            ]);
            let filename = "danh_sach_don_to_giac";
            if (isCng) filename = "danh_sach_don_cong_nghe_cao";
            if (tab === "tin7575") filename = "danh_sach_tin_7575";
            exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 12, color: "#94A3B8", width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{filtered.length}/{total}</div>
      </div>

      <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
        <button style={tabStyle(isDon, "#1E3A8A", "#2563EB")} onClick={() => { setTab("don"); setFilterStatus("all"); }}>
          📋 Đơn Tố Giác <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>{donItems.length}</span>
        </button>
        <button style={tabStyle(isCng, "#4C1D95", "#7C3AED")} onClick={() => { setTab("cong_nghe_cao"); setFilterStatus("all"); }}>
          💻 Đơn Công Nghệ Cao <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>{cngItems.length}</span>
        </button>
        <button style={tabStyle(isTin, "#065F46", "#059669")} onClick={() => { setTab("tin7575"); setFilterStatus("all"); }}>
          📞 Tin 7575 <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>{tinItems.length}</span>
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 14px 14px 14px", border: isCng ? "1px solid #C4B5FD" : isDon ? "1px solid #BFDBFE" : "1px solid #A7F3D0", overflow: "hidden", boxShadow: isCng ? "0 4px 16px rgba(124,58,237,0.12)" : isDon ? "0 4px 16px rgba(37,99,235,0.08)" : "0 4px 16px rgba(5,150,105,0.08)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isDon || isCng ? 920 : 860 }}>
            <thead>
              <tr style={{ background: headerColor }}>
                {((isCng || isDon) ? ["#", "Tiêu đề", "Người gửi", "Hành vi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ thụ lý", "Trạng thái", "Ưu tiên", "Thao tác"] : ["#", "Tiêu đề", "Hành vi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ thụ lý", "Trạng thái", "Ưu tiên", "Thao tác"]).map((h) => (
                  <th key={h} style={{ padding: "9px 7px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={(isDon || isCng) ? 10 : 9} style={{ padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.25 }}>{isDon ? "📋" : "📞"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 4 }}>Không có {isCng ? "đơn CNC" : isDon ? "đơn" : "tin 7575"} nào</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>Thử thay đổi bộ lọc</div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const st = getStatus(item.deadline, item.status);
                  const isOver = st === "qua_han", isNear = st === "sap_het_han";
                  const rowBg = isOver ? "#FFF5F5" : isNear ? "#FFFBF0" : idx % 2 === 0 ? "#fff" : "#FAFBFC";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isOver ? "#FEE2E2" : isDon ? "#EFF6FF" : "#ECFDF5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ padding: "8px 5px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 26 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td style={{ padding: "8px 8px", maxWidth: 220 }}>
                        <button
                          onClick={() => setTitlePopup(item)}
                          style={{ border: "none", background: "none", color: "#1E293B", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, textAlign: "left", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4, width: "100%", transition: "color 0.15s" }}
                          onMouseEnter={(e) => e.target.style.color = isDon ? "#1E3A8A" : "#065F46"}
                          onMouseLeave={(e) => e.target.style.color = "#1E293B"}
                        >
                          {item.tieu_de || "—"}
                        </button>
                      </td>
                      {(isDon || isCng) && (
                        <td style={{ padding: "8px 6px", whiteSpace: "nowrap", maxWidth: 110 }}>
                          {item.nguoi_to_giac ? (
                            <button
                              onClick={() => setNguoiGuiPopup(item)}
                              style={{ border: "none", background: "none", color: "#3B82F6", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, textDecoration: "underline dotted", textUnderlineOffset: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 105 }}
                            >
                              {item.nguoi_to_giac}
                            </button>
                          ) : (
                            <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <HanhViBadge hanh_vi={item.hanh_vi} />
                      </td>
                      <td style={{ padding: "8px 6px", fontSize: 11, color: "#64748B", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatVNdate(item.ngay_tiep_nhan)}</td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        {item.deadline ? (
                          <span style={{ fontSize: 11, color: isOver ? "#DC2626" : isNear ? "#D97706" : "#64748B", fontWeight: isOver || isNear ? 700 : 400, background: isOver ? "#FEE2E2" : isNear ? "#FEF3C7" : "transparent", padding: isOver || isNear ? "2px 6px" : "0", borderRadius: 6, fontVariantNumeric: "tabular-nums" }}>{formatVNdate(item.deadline)}</span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        {item.phu_trach ? (
                          <button
                            onClick={() => handleCanBoClick(item.phu_trach)}
                            style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 3 }}
                          >
                            <UserAvatar user={users.find(u => u.name === item.phu_trach) || { name: item.phu_trach, role: "viewer" }} size={20} />
                            <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortName(item.phu_trach)}</span>
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <StatusBadge deadline={item.deadline} statusOverride={item.status} />
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <PriorityBadge2 priority={item.priority} />
                      </td>
                      <td style={{ padding: "8px 5px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
                          <button onClick={() => setTitlePopup(item)} style={{ border: "none", background: "#F1F5F9", color: "#64748B", borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xem</button>
                          {canEdit(item) && (
                            <button
                              onClick={() => {
                                setEditItem(item);
                                setShowModal(true);
                              }}
                              style={{ border: "none", background: "#FFFBEB", color: "#B45309", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}
                            >
                              Sửa
                            </button>
                          )}
                          {canDelete(item) && (
                            <button
                              onClick={() => handleDelete(item)}
                              style={{ border: "none", background: "#FFF5F5", color: "#DC2626", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}
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

        <div style={{ padding: "9px 14px", borderTop: "1px solid #F1F5F9", background: "#FAFBFC", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            Hiển thị <b>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</b>–<b>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> {isCng ? "đơn CNC" : isDon ? "đơn" : "tin 7575"}
          </span>
          <div style={{ display: "flex", gap: 10, fontWeight: 600, fontSize: 11, marginRight: "auto" }}>
            <span style={{ color: "#15803D" }}>✅ {da_ht} hoàn thành</span>
            {qua_han > 0 && <span style={{ color: "#DC2626" }}>🚨 {qua_han} quá hạn</span>}
          </div>
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
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{ padding: "4px 9px", border: "1px solid " + (isAct ? "#0284C7" : "#E2E8F0"), borderRadius: 6, background: isAct ? "#0284C7" : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontSize: 11, fontWeight: isAct ? 700 : 400, minWidth: 30 }}
                    >
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

      {titlePopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setTitlePopup(null)}>
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 560, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "18px 22px", background: (titlePopup.loai || "don") === "cong_nghe_cao" ? "linear-gradient(135deg,#4C1D95,#7C3AED)" : (titlePopup.loai || "don") === "don" ? "linear-gradient(135deg,#1E3A8A,#2563EB)" : "linear-gradient(135deg,#065F46,#059669)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{(titlePopup.loai || "don") === "don" ? "📋 ĐƠN TỐ GIÁC" : (titlePopup.loai || "don") === "cong_nghe_cao" ? "💻 ĐƠN CÔNG NGHỆ CAO" : "📞 TIN 7575"} · {titlePopup.ma_so}</div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, lineHeight: 1.4, maxWidth: 450 }}>{titlePopup.tieu_de}</div>
                </div>
                <button onClick={() => setTitlePopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#fff", flexShrink: 0 }}>×</button>
              </div>
            </div>
            <div style={{ padding: 18, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              {[
                { label: "Mã số", val: titlePopup.ma_so, b: true },
                { label: "Hành vi", val: titlePopup.hanh_vi, badge: true },
                ((titlePopup.loai || "don") === "don" || (titlePopup.loai || "don") === "cong_nghe_cao") && { label: "Người tố giác", val: titlePopup.nguoi_to_giac },
                ((titlePopup.loai || "don") === "don" || (titlePopup.loai || "don") === "cong_nghe_cao") && { label: "SĐT người gửi", val: titlePopup.ngs_sdt },
                ((titlePopup.loai || "don") === "don" || (titlePopup.loai || "don") === "cong_nghe_cao") && { label: "Năm sinh", val: titlePopup.ngs_ns },
                ((titlePopup.loai || "don") === "don" || (titlePopup.loai || "don") === "cong_nghe_cao") && { label: "Nơi ở người gửi", val: titlePopup.ngs_noi_o, full: true },
                { label: "Ngày tiếp nhận", val: titlePopup.ngay_tiep_nhan },
                { label: "Hạn xử lý", val: titlePopup.deadline },
                { label: "Cán bộ thụ lý", val: titlePopup.phu_trach },
                { label: "Ưu tiên", val: titlePopup.priority === "cao" ? "🔴 Cao" : titlePopup.priority === "trung_binh" ? "🟡 Trung bình" : "🟢 Thấp" },
                { label: "Trạng thái", val: null, status: true },
                { label: "Kết quả giải quyết", val: titlePopup.ket_qua_giai_quyet, full: true },
                { label: "Ghi chú", val: titlePopup.ghi_chu, full: true }
              ].filter(Boolean).map((f, i) => (
                <div key={i} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 3 }}>{f.label}</div>
                  <div style={{ padding: "8px 11px", background: "#F8FAFC", borderRadius: 9, border: "1px solid #E2E8F0", fontSize: 13, color: "#1E293B", fontWeight: f.b ? 700 : 400, wordBreak: "break-word" }}>
                    {f.badge ? <HanhViBadge hanh_vi={f.val} /> : f.status ? <StatusBadge deadline={titlePopup.deadline} statusOverride={titlePopup.status} /> : f.val || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {nguoiGuiPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setNguoiGuiPopup(null)}>
          <div style={{ background: "#fff", borderRadius: 18, maxWidth: 360, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", background: nguoiGuiPopup.loai === "cong_nghe_cao" ? "linear-gradient(135deg,#4C1D95,#7C3AED)" : "linear-gradient(135deg,#1E3A8A,#2563EB)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{nguoiGuiPopup.loai === "cong_nghe_cao" ? "💻 Thông tin người gửi đơn CNC" : "👤 Thông tin người gửi đơn"}</div>
                <button onClick={() => setNguoiGuiPopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 15, color: "#fff" }}>×</button>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              {[
                { l: "Họ và tên", v: nguoiGuiPopup.nguoi_to_giac, bold: true },
                { l: "Năm sinh", v: nguoiGuiPopup.ngs_ns },
                { l: "Nơi ở", v: nguoiGuiPopup.ngs_noi_o },
                { l: "Số điện thoại", v: nguoiGuiPopup.ngs_sdt }
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, minWidth: 90, flexShrink: 0 }}>{f.l}</span>
                  <span style={{ fontSize: 13, color: "#111827", fontWeight: f.bold ? 700 : 500 }}>{f.v || "—"}</span>
                </div>
              ))}
            </div>
            <div style={{ margin: 12, padding: "10px", background: nguoiGuiPopup.loai === "cong_nghe_cao" ? "#F5F3FF" : "#EFF6FF", borderRadius: 10, fontSize: 12, color: nguoiGuiPopup.loai === "cong_nghe_cao" ? "#4C1D95" : "#1E3A8A" }}>
              {nguoiGuiPopup.loai === "cong_nghe_cao" ? "💻 Đơn CNC" : "📋 Đơn"}: <b>{nguoiGuiPopup.ma_so}</b> · <HanhViBadge hanh_vi={nguoiGuiPopup.hanh_vi} />
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
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Thống kê thụ lý</div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#6366F1" }}>{canBoPopup.total_cur}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{canBoPopup.tabLabel || "Tổng số"}</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#2563EB" }}>{canBoPopup.dang_xm_cur}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Đang xác minh</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#15803D" }}>{canBoPopup.hoan_thanh_cur}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Hoàn thành</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#DC2626" }}>{canBoPopup.qua_han_cur}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Quá hạn</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button
              onClick={() => setCanBoPopup(null)}
              style={{ padding: "9px 22px", background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}


      {showModal && (
        <Modal
          title={editItem ? `📝 Chỉnh sửa` : `➕ Thêm ${isDon ? "đơn tố giác" : isCng ? "đơn công nghệ cao" : "tin 7575"} mới`}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
        >
          <DonToGiacForm
            initial={editItem}
            officerList={officerList}
            currentTab={tab}
            allItems={allItems}
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

function DonToGiacForm({ initial, officerList, currentTab, allItems, onSave, onClose, isMobile, currentUser }) {
  const [form, setForm] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    const activeLoai = initial?.loai || currentTab;
    const prefix = (activeLoai === "tin7575") ? "TB7575" : (activeLoai === "cong_nghe_cao") ? "CNC" : "DTG";
    const existingNums = (allItems || []).filter(i => (i.loai || "don") === activeLoai).map(i => {
      const m = (i.ma_so || "").match(/[A-Z0-9]+-\d{4}-(\d+)/);
      return m ? parseInt(m[1]) : 0;
    });
    const year = new Date().getFullYear();
    const next = (Math.max(0, ...existingNums) + 1).toString().padStart(3, "0");
    const autoMaSo = initial?.ma_so || `${prefix}-${year}-${next}`;

    const base = {
      ma_so: autoMaSo,
      tieu_de: "",
      loai: activeLoai,
      hanh_vi: "Trộm cắp tài sản",
      nguoi_to_giac: "",
      ngs_ns: "",
      ngs_noi_o: "",
      ngs_sdt: "",
      ngay_tiep_nhan: todayStr,
      deadline: (() => {
        const d2 = new Date();
        const days2 = (activeLoai === "tin7575") ? 3 : 20;
        d2.setDate(d2.getDate() + days2);
        return d2.toISOString().split("T")[0];
      })(),
      phu_trach: currentUser?.name || "",
      priority: (activeLoai === "tin7575") ? "cao" : "trung_binh",
      status: "dang_xu_ly",
      ghi_chu: "",
      ket_qua_giai_quyet: "",
      ...initial || {}
    };

    if (!base.ngay_tiep_nhan) base.ngay_tiep_nhan = todayStr;
    if (!base.phu_trach) base.phu_trach = currentUser?.name || "";
    return base;
  });

  const set = (k, v) => {
    setForm((p) => {
      const upd = { ...p, [k]: v };
      if ((k === "ngay_tiep_nhan" || k === "loai") && upd.ngay_tiep_nhan) {
        const d = new Date(upd.ngay_tiep_nhan);
        const days = upd.loai === "tin7575" ? 3 : 20;
        d.setDate(d.getDate() + days);
        if (!upd.deadline || k === "ngay_tiep_nhan" || k === "loai") {
          upd.deadline = d.toISOString().split("T")[0];
        }
      }
      if (k === "loai" && v === "tin7575" && !p.priority) upd.priority = "cao";
      if (k === "loai" && upd.loai === "tin7575") upd.priority = "cao";
      return upd;
    });
  };

  const tabColor = form.loai === "don" ? "#1E3A8A" : form.loai === "cong_nghe_cao" ? "#4C1D95" : "#065F46";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Mã số" required={true}>
          <input value={form.ma_so || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }} placeholder={form.loai === "don" ? "VD: DTG-2024-010" : form.loai === "cong_nghe_cao" ? "VD: CNC-2024-010" : "VD: TB7575-2024-010"} />
        </FormField>
        <FormField label="Hành vi">
          <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
            <select 
              value={HANH_VI_LIST.includes(form.hanh_vi) ? form.hanh_vi : "khac"} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === "khac") {
                  set("hanh_vi", "");
                } else {
                  set("hanh_vi", val);
                }
              }} 
              style={selectSt}
            >
              {HANH_VI_LIST.map((h) => <option key={h} value={h}>{h}</option>)}
              <option value="khac">Khác (Tự nhập)...</option>
            </select>
            {(!HANH_VI_LIST.includes(form.hanh_vi)) && (
              <input 
                value={form.hanh_vi || ""} 
                onChange={(e) => set("hanh_vi", e.target.value)} 
                placeholder="Nhập hành vi mới..." 
                style={inputSt} 
              />
            )}
          </div>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Tiêu đề / Nội dung" required={true}>
            <input value={form.tieu_de || ""} onChange={(e) => set("tieu_de", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        {(form.loai === "don" || form.loai === "cong_nghe_cao") && (
          <>
            <FormField label="Họ tên người gửi đơn">
              <input value={form.nguoi_to_giac || ""} onChange={(e) => set("nguoi_to_giac", e.target.value)} style={inputSt} />
            </FormField>
            <FormField label="Số điện thoại người gửi">
              <input value={form.ngs_sdt || ""} onChange={(e) => set("ngs_sdt", e.target.value)} style={inputSt} />
            </FormField>
            <FormField label="Năm sinh">
              <input value={form.ngs_ns || ""} onChange={(e) => set("ngs_ns", e.target.value)} style={inputSt} placeholder="VD: 1985" />
            </FormField>
            <FormField label="Nơi ở">
              <input value={form.ngs_noi_o || ""} onChange={(e) => set("ngs_noi_o", e.target.value)} style={inputSt} />
            </FormField>
          </>
        )}
        <FormField label="Ngày tiếp nhận">
          <input type="date" value={form.ngay_tiep_nhan || ""} onChange={(e) => set("ngay_tiep_nhan", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Hạn xử lý">
          <input type="date" value={form.deadline || ""} onChange={(e) => set("deadline", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ thụ lý">
          <select value={form.phu_trach || ""} onChange={(e) => set("phu_trach", e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Ưu tiên">
          <select
            value={form.priority || "trung_binh"}
            onChange={(e) => { if (form.loai !== "tin7575") set("priority", e.target.value); }}
            disabled={form.loai === "tin7575"}
            style={{ ...selectSt, opacity: form.loai === "tin7575" ? 0.7 : 1, cursor: form.loai === "tin7575" ? "not-allowed" : "pointer" }}
          >
            <option value="cao">🔴 Cao</option>
            <option value="trung_binh">🟡 Trung bình</option>
            <option value="thap">🟢 Thấp</option>
          </select>
        </FormField>
        <FormField label="Trạng thái">
          <select value={form.status || "dang_xu_ly"} onChange={(e) => set("status", e.target.value)} style={selectSt}>
            <option value="dang_xu_ly">Đang xác minh</option>
            <option value="hoan_thanh">Đã hoàn thành</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Kết quả giải quyết">
            <input value={form.ket_qua_giai_quyet || ""} onChange={(e) => set("ket_qua_giai_quyet", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={form.ghi_chu || ""} onChange={(e) => set("ghi_chu", e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(form)} style={{ padding: "10px 24px", background: `linear-gradient(135deg,${tabColor},${tabColor === "#1E3A8A" ? "#2563EB" : tabColor === "#4C1D95" ? "#7C3AED" : "#059669"})`, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}
