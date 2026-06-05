"use client";

import React, { useState, useRef } from 'react';
import { getStatus } from '@/app/components/shared';

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

export default function BaoCaoView({ data, users, currentUser, isMobile }) {
  const [module, setModule] = useState("vu_an");
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOfficer, setFilterOfficer] = useState("all");

  const now = new Date();
  const todayStr = now.toLocaleDateString("vi-VN");
  const officerList = users.map(u => u.name);
  const years = ["2023", "2024", "2025", "2026", "all"];

  const MODULE_CFG = {
    vu_an: {
      label: "Vụ Án", icon: "⚖️",
      items: data["vu_an"] || [],
      statusOpts: [["all", "Tất cả"], ["dang_xu_ly", "Đang xử lý"], ["hoan_thanh", "Hoàn thành"], ["qua_han", "Quá hạn"]],
      typeOpts: [["all", "Tất cả loại"], ["Hình sự", "Hình sự"], ["Dân sự", "Dân sự"], ["Kinh tế", "Kinh tế"]],
      typeKey: "loai_vu_an", dateKey: "ngay_khoi_to", officerKey: "phu_trach",
      cols: ["Mã số", "Tên vụ án", "Tội danh", "Loại", "Ngày khởi tố", "Hạn xử lý", "Cán bộ", "Trạng thái"],
      row: (i) => [i.ma_so, i.ten_vu_an, i.toi_danh, i.loai_vu_an, i.ngay_khoi_to, i.deadline, i.phu_trach, i.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý"]
    },
    tin_bao: {
      label: "Tin Báo", icon: "📡",
      items: data["tin_bao"] || [],
      statusOpts: [["all", "Tất cả"], ["hien_hanh", "Hiện hành"], ["hoan_thanh", "Hoàn thành"]],
      typeOpts: [["all", "Tất cả"]],
      typeKey: null, dateKey: "ngay_tiep_nhan", officerKey: "phu_trach",
      cols: ["Mã số", "Tiêu đề", "Tội danh", "Nguồn tin", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ", "Trạng thái"],
      row: (i) => [i.ma_so, i.tieu_de, i.toi_danh, i.nguon_tin || "", i.ngay_tiep_nhan, i.deadline, i.phu_trach, i.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý"]
    },
    don_to_giac: {
      label: "Đơn Tố Giác", icon: "📋",
      items: (data["don_to_giac"] || []).filter(i => !i.loai || i.loai === "don"),
      statusOpts: [["all", "Tất cả"], ["dang_xu_ly", "Đang xử lý"], ["hoan_thanh", "Hoàn thành"], ["qua_han", "Quá hạn"]],
      typeOpts: [["all", "Tất cả"]],
      typeKey: null, dateKey: "ngay_tiep_nhan", officerKey: "phu_trach",
      cols: ["Mã số", "Tiêu đề", "Hành vi", "Người gửi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ", "Trạng thái"],
      row: (i) => [i.ma_so, i.tieu_de, i.hanh_vi, i.nguoi_to_giac || "", i.ngay_tiep_nhan, i.deadline, i.phu_trach, i.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý"]
    },
    cnc: {
      label: "Đơn Công Nghệ Cao", icon: "💻",
      items: (data["don_to_giac"] || []).filter(i => i.loai === "cong_nghe_cao"),
      statusOpts: [["all", "Tất cả"], ["dang_xu_ly", "Đang xử lý"], ["hoan_thanh", "Hoàn thành"]],
      typeOpts: [["all", "Tất cả"]],
      typeKey: null, dateKey: "ngay_tiep_nhan", officerKey: "phu_trach",
      cols: ["Mã số", "Tiêu đề", "Hành vi", "Người gửi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ", "Trạng thái"],
      row: (i) => [i.ma_so, i.tieu_de, i.hanh_vi, i.nguoi_to_giac || "", i.ngay_tiep_nhan, i.deadline, i.phu_trach, i.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý"]
    },
    tin7575: {
      label: "Tin 7575", icon: "📞",
      items: (data["don_to_giac"] || []).filter(i => i.loai === "tin7575"),
      statusOpts: [["all", "Tất cả"], ["dang_xu_ly", "Đang xử lý"], ["hoan_thanh", "Hoàn thành"], ["qua_han", "Quá hạn"]],
      typeOpts: [["all", "Tất cả"]],
      typeKey: null, dateKey: "ngay_tiep_nhan", officerKey: "phu_trach",
      cols: ["Mã số", "Tiêu đề", "Hành vi", "Ngày tiếp nhận", "Hạn xử lý", "Cán bộ", "Trạng thái", "Ưu tiên"],
      row: (i) => [i.ma_so, i.tieu_de, i.hanh_vi, i.ngay_tiep_nhan, i.deadline, i.phu_trach, i.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý", i.priority === "cao" ? "Cao" : i.priority === "thap" ? "Thấp" : "TB"]
    },
    xe_truy_tim: {
      label: "Xe Truy Tìm", icon: "🚗",
      items: data["xe_truy_tim"] || [],
      statusOpts: [["all", "Tất cả"], ["dang_truy_tim", "Đang truy tìm"], ["da_tim_thay", "Đã tìm thấy"]],
      typeOpts: [["all", "Tất cả loại"], ["Môtô", "Môtô"], ["Ô tô", "Ô tô"], ["Xe tải", "Xe tải"]],
      typeKey: "loai_xe", dateKey: "ngay_mat", officerKey: "can_bo_phu_trach",
      cols: ["Mã số", "Biển số", "Loại xe", "Màu", "Ngày mất", "Nơi mất", "Cán bộ", "Trạng thái"],
      row: (i) => [i.ma_so, i.bien_so, i.loai_xe, i.mau_xe, i.ngay_mat, i.noi_mat, i.can_bo_phu_trach, i.trang_thai === "da_tim_thay" ? "Đã tìm thấy" : "Đang truy tìm"]
    },
    truy_na: {
      label: "Truy Nã", icon: "🎯",
      items: data["truy_na"] || [],
      statusOpts: [["all", "Tất cả"], ["dang_truy_na", "Đang truy nã"], ["da_bat", "Đã bắt"]],
      typeOpts: [["all", "Tất cả"]],
      typeKey: null, dateKey: "ngay_phat_lenh", officerKey: "can_bo_phu_trach",
      cols: ["Mã số", "Họ tên", "Ngày sinh", "Tội danh", "Số lệnh", "Ngày phát", "Cán bộ", "Trạng thái"],
      row: (i) => [i.ma_so, i.ho_ten, i.ngay_sinh, i.toi_danh, i.so_lenh, i.ngay_phat_lenh, i.can_bo_phu_trach, i.trang_thai === "da_bat" ? "Đã bắt" : "Đang truy nã"]
    },
    doi_tuong: {
      label: "Đối Tượng Quản Lý", icon: "👁️",
      items: data["quan_ly_doi_tuong"] || [],
      statusOpts: [["all", "Tất cả"]],
      typeOpts: [["all", "Tất cả"]],
      typeKey: null, dateKey: null, officerKey: "can_bo_phu_trach",
      cols: ["Mã số", "Họ tên", "Ngày sinh", "Nơi ở", "Nhóm", "Tiền án", "Tiền sự", "Cán bộ"],
      row: (i) => [i.ma_so, i.ho_ten, i.ngay_sinh, i.noi_o, i.nhom, i.tien_an || "0 TA", i.tien_su || "0 TS", i.can_bo_phu_trach]
    },
    van_ban: {
      label: "Xử Lý Văn Bản", icon: "📄",
      items: data["xu_ly_van_ban"] || [],
      statusOpts: [["all", "Tất cả"], ["dang_xu_ly", "Đang xử lý"], ["hoan_thanh", "Hoàn thành"]],
      typeOpts: [["all", "Tất cả"]],
      typeKey: null, dateKey: "ngay_ban_hanh", officerKey: "can_bo_xu_ly",
      cols: ["Mã số", "Tiêu đề", "Loại", "Ngày ban hành", "Hạn xử lý", "Cán bộ", "Trạng thái"],
      row: (i) => [i.ma_so, i.tieu_de, i.loai_van_ban, i.ngay_ban_hanh, i.deadline, i.can_bo_xu_ly, i.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý"]
    }
  };

  const cfg = MODULE_CFG[module] || MODULE_CFG.vu_an;

  const getFiltered = () => {
    let items = cfg.items || [];
    if (filterYear !== "all") {
      items = items.filter(i => {
        const dateVal = i[cfg.dateKey] || "";
        return dateVal.startsWith(filterYear);
      });
    }
    if (filterStatus !== "all") {
      items = items.filter(i => {
        const st = getStatus(i.deadline, i.status, i.thoi_hieu, i.trang_thai_an);
        if (filterStatus === "qua_han") return st === "qua_han";
        if (filterStatus === "hoan_thanh") return i.status === "hoan_thanh";
        if (filterStatus === "dang_xu_ly") return i.status !== "hoan_thanh" && st !== "qua_han";
        return (i.status || "") === filterStatus || (i.trang_thai || "") === filterStatus;
      });
    }
    if (filterType !== "all" && cfg.typeKey) {
      items = items.filter(i => (i[cfg.typeKey] || "") === filterType);
    }
    if (filterOfficer !== "all") {
      items = items.filter(i => (i[cfg.officerKey] || "") === filterOfficer);
    }
    return items;
  };

  const filteredItems = getFiltered();

  const getStatusLabel = (item) => {
    const st = getStatus(item.deadline, item.status, item.thoi_hieu, item.trang_thai_an);
    if (st === "qua_han") return { label: "Quá hạn", color: "#DC2626" };
    if (st === "sap_het_han") return { label: "Sắp hết hạn", color: "#D97706" };
    if (item.status === "hoan_thanh" || item.trang_thai === "da_tim_thay" || item.trang_thai === "da_bat") return { label: "Hoàn thành", color: "#059669" };
    return { label: "Đang xử lý", color: "#3B82F6" };
  };

  const filterLabel = () => {
    const parts = [];
    if (filterYear !== "all") parts.push("Năm " + filterYear);
    if (filterStatus !== "all") {
      const s = cfg.statusOpts.find(o => o[0] === filterStatus);
      if (s) parts.push(s[1]);
    }
    if (filterType !== "all") parts.push(filterType);
    if (filterOfficer !== "all") parts.push("Cán bộ: " + filterOfficer);
    return parts.length ? parts.join(" • ") : "Tất cả dữ liệu";
  };

  const printRef = useRef();

  const printReport = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write("<html><head><title>Báo cáo</title><style>body{font-family:Arial,sans-serif;margin:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#1E3A8A;color:#fff;font-size:11px}tr:nth-child(even){background:#F8FAFC}.header{text-align:center;margin-bottom:20px}.title{font-size:18px;font-weight:bold;color:#1E3A8A}.sub{font-size:12px;color:#666;margin-top:4px}.footer{margin-top:16px;font-size:11px;color:#888;text-align:right}@media print{button{display:none}}</style></head><body>");
    win.document.write(printContent.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const exportWord = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const html2 = "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" xmlns=\"http://www.w3.org/TR/REC-html40\"><head><meta charset=\"utf-8\"><title>Báo cáo</title></head><body>" + printContent.innerHTML + "</body></html>";
    const blob = new Blob([html2], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "BaoCao_" + cfg.label.replace(/\s/g, "_") + "_" + (filterYear !== "all" ? filterYear : "TatCa") + ".doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearReport = () => {
    setFilterYear(String(new Date().getFullYear()));
    setFilterStatus("all");
    setFilterType("all");
    setFilterOfficer("all");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexDirection: isMobile ? "column" : "row", gap: 8 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: isMobile ? 18 : 20, fontWeight: 900, color: "#0F172A" }}>📊 Báo Cáo Thống Kê</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Xuất báo cáo theo tiêu chí tùy chọn</div>
        </div>
      </div>

      {/* Options panel */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>⚙️ Cấu hình báo cáo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {/* Module */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 5 }}>📂 Loại báo cáo</label>
            <select value={module} onChange={e => { setModule(e.target.value); setFilterType("all"); setFilterStatus("all"); }} style={selectSt}>
              {Object.entries(MODULE_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon + " " + v.label}</option>
              ))}
            </select>
          </div>
          {/* Year */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 5 }}>📅 Năm</label>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={selectSt}>
              {years.map(y => <option key={y} value={y}>{y === "all" ? "Tất cả năm" : "Năm " + y}</option>)}
            </select>
          </div>
          {/* Status */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 5 }}>📌 Trạng thái</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectSt}>
              {cfg.statusOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {/* Type */}
          {cfg.typeKey && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 5 }}>🏷️ Loại</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectSt}>
                {cfg.typeOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          )}
          {/* Officer */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 5 }}>👮 Cán bộ</label>
            <select value={filterOfficer} onChange={e => setFilterOfficer(e.target.value)} style={selectSt}>
              <option value="all">Tất cả cán bộ</option>
              {officerList.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginTop: 14, padding: "10px 14px", background: filteredItems.length === 0 ? "#FEF2F2" : "#F0FDF4", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: filteredItems.length === 0 ? "#DC2626" : "#059669" }}>
            📋 Kết quả: <b>{filteredItems.length}</b> mục
          </span>
          <span style={{ fontSize: 11, color: "#64748B" }}>• {filterLabel()}</span>
          {filteredItems.length > 0 && (
            <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>
              🔴 Quá hạn: {filteredItems.filter(i => getStatus(i.deadline, i.status, i.thoi_hieu, i.trang_thai_an) === "qua_han").length}
            </span>
          )}
        </div>
      </div>

      {/* Print preview */}
      {filteredItems.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, border: "2px solid #E5E7EB", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          {/* Preview header */}
          <div style={{ background: "linear-gradient(135deg,#1E3A8A,#2563EB)", borderRadius: "12px 12px 0 0", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>📄 Xem trước trang in</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />)}
            </div>
          </div>

          {/* A4 preview */}
          <div style={{ padding: "20px", background: "#F1F5F9", overflowX: "auto" }}>
            <div ref={printRef} style={{ background: "#fff", minWidth: 700, margin: "0 auto", padding: "32px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", fontFamily: "Arial, sans-serif", fontSize: 12 }}>
              {/* Report header */}
              <div style={{ textAlign: "center", marginBottom: 24, borderBottom: "2px solid #1E3A8A", paddingBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>CẢNH SÁT NHÂN DÂN VIỆT NAM</div>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>CÔNG AN TỈNH THỪA THIÊN HUẾ – PHÒNG PC02</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1E3A8A", letterSpacing: 0.5 }}>BÁO CÁO THỐNG KÊ</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginTop: 6 }}>{cfg.icon + " " + cfg.label.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>{filterLabel()}</div>
              </div>

              {/* Stats summary */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Tổng số", value: filteredItems.length, color: "#1E3A8A" },
                  { label: "Hoàn thành", value: filteredItems.filter(i => i.status === "hoan_thanh" || i.trang_thai === "da_tim_thay" || i.trang_thai === "da_bat").length, color: "#059669" },
                  { label: "Đang xử lý", value: filteredItems.filter(i => i.status !== "hoan_thanh" && getStatus(i.deadline, i.status, i.thoi_hieu, i.trang_thai_an) !== "qua_han").length, color: "#3B82F6" },
                  { label: "Quá hạn", value: filteredItems.filter(i => getStatus(i.deadline, i.status, i.thoi_hieu, i.trang_thai_an) === "qua_han").length, color: "#DC2626" }
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 100, border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Data table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#1E3A8A" }}>
                    <th style={{ padding: "8px 6px", color: "#fff", border: "1px solid #1E40AF", textAlign: "center", width: 28, fontSize: 10 }}>#</th>
                    {cfg.cols.map(col => (
                      <th key={col} style={{ padding: "8px 6px", color: "#fff", border: "1px solid #1E40AF", textAlign: "left", fontSize: 10, fontWeight: 700 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const st = getStatusLabel(item);
                    return (
                      <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? "#fff" : "#F8FAFC" }}>
                        <td style={{ padding: "7px 6px", border: "1px solid #E5E7EB", textAlign: "center", color: "#9CA3AF", fontSize: 10 }}>{idx + 1}</td>
                        {cfg.row(item).map((cell, ci) => {
                          const isLast = ci === cfg.row(item).length - 1;
                          const isStatus = isLast && ["dang_xu_ly", "hoan_thanh", "qua_han", "da_bat", "da_tim_thay"].some(s => String(cell).toLowerCase().includes(s.replace("_", " ").toLowerCase()) || String(cell) === st.label);
                          return (
                            <td key={ci, cell} style={{ padding: "7px 6px", border: "1px solid #E5E7EB", color: isStatus ? st.color : "#374151", fontWeight: isStatus ? 700 : 400, fontSize: 11 }}>
                              {cell || "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280" }}>
                <div>
                  <div>Người xuất báo cáo: {currentUser.name}</div>
                  <div style={{ marginTop: 2 }}>Ngày xuất: {todayStr}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontStyle: "italic" }}>Phòng PC02 – Công An Tỉnh Thừa Thiên Huế</div>
                  <div style={{ marginTop: 40, borderTop: "1px solid #374151", paddingTop: 4 }}>Ký và đóng dấu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={printReport} style={{ padding: "11px 22px", background: "linear-gradient(135deg,#DC2626,#B91C1C)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7, flex: isMobile ? "1 1 auto" : "none", justifyContent: "center" }}>
          📌 Xuất PDF / In
        </button>
        <button onClick={exportWord} style={{ padding: "11px 22px", background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7, flex: isMobile ? "1 1 auto" : "none", justifyContent: "center" }}>
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <button onClick={clearReport} style={{ padding: "11px 22px", background: "#F1F5F9", color: "#64748B", border: "1px solid #E5E7EB", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, flex: isMobile ? "1 1 100%" : "none" }}>
          × Xóa bộ lọc
        </button>
      </div>
    </div>
  );
}
