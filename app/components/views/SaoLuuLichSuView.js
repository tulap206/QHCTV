"use client";

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

class ErrorBoundary extends React.Component {
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
        <div style={{ padding: 24, background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 16, color: "#C53030" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800 }}>⚠️ Đã xảy ra lỗi khi tải trang Sao lưu – Lịch sử:</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, color: "#1A202C" }}>
            {this.state.error ? this.state.error.toString() : "Lỗi không xác định"}
          </pre>
          <p style={{ margin: "14px 0 6px", fontWeight: 700, fontSize: 13 }}>Chi tiết Stack Trace:</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 11, color: "#4A5568" }}>
            {this.state.error ? this.state.error.stack : ""}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 14, padding: "8px 16px", background: "#C53030", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            🔄 Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SaoLuuLichSuView(props) {
  return (
    <ErrorBoundary>
      <SaoLuuLichSuViewContent {...props} />
    </ErrorBoundary>
  );
}

function SaoLuuLichSuViewContent({ data, users, logs, setLogs, departments, addLog, currentUser, onRestore, isMobile, onRestoreTrash, onDeleteTrash }) {
  const [tab, setTab] = useState("lich_su");

  const tabStyle = (active, c1, c2) => ({
    padding: isMobile ? "8px 14px" : "10px 24px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: isMobile ? 12 : 14,
    borderRadius: "10px 10px 0 0",
    transition: "all 0.2s",
    background: active ? `linear-gradient(135deg,${c1},${c2})` : "#F1F5F9",
    color: active ? "#fff" : "#64748B",
    boxShadow: active ? "0 -4px 12px rgba(0,0,0,0.12)" : "none",
    position: "relative",
    zIndex: active ? 2 : 1,
    flex: isMobile ? 1 : "none",
    textAlign: "center"
  });

  const isAccessDenied = !["admin", "mod"].includes(currentUser?.role);

  if (isAccessDenied) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", padding: "40px 32px", background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 18 }}>🔐</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginBottom: 12 }}>Truy cập bị hạn chế</div>
          <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "1px solid #FECACA", marginBottom: 14 }}>
            ⚠️ Tài khoản của bạn không có quyền truy cập trang này!
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Vui lòng liên hệ quản trị viên để được cấp quyền</div>
        </div>
      </div>
    );
  }

  const canAccessBackup = currentUser?.role === "admin";
  const isMod = currentUser?.role === "mod";

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>💾 Lịch Sử & Sao Lưu</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý sao lưu dữ liệu và theo dõi lịch sử hoạt động</div>
          {isMod && (
            <span style={{ background: "#FFFBEB", color: "#B45309", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid #FDE68A", display: "inline-flex", alignItems: "center", gap: 4 }}>
              🔒 Kiểm duyệt – Chỉ xem Lịch sử hoạt động
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: isMobile ? "100%" : "auto" }}>
        <button 
          style={tabStyle(tab === "lich_su", "#374151", "#1F2937")} 
          onClick={() => setTab("lich_su")}
        >
          📋 Lịch Sử Hoạt Động
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>
            {logs?.length || 0}
          </span>
        </button>
        <button 
          style={tabStyle(tab === "thung_rac", "#EF4444", "#DC2626")} 
          onClick={() => setTab("thung_rac")}
        >
          🗑️ Thùng Rác
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>
            {data?.trash_bin?.length || 0}
          </span>
        </button>
        <button
          style={{
            ...tabStyle(tab === "sao_luu", "#2563EB", "#1D4ED8"),
            opacity: canAccessBackup ? 1 : 0.6,
          }}
          onClick={() => setTab("sao_luu")}
        >
          💾 Sao Lưu & Khôi Phục
          {!canAccessBackup && (
            <span style={{ marginLeft: 6, fontSize: 12 }}>🔒</span>
          )}
        </button>
      </div>
      <div style={{ background: "#fff", borderRadius: "0 14px 14px 14px", border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: 20 }}>
        {tab === "lich_su" ? (
          <LogInner logs={logs} setLogs={setLogs} currentUser={currentUser} addLog={addLog} />
        ) : tab === "thung_rac" ? (
          <TrashInner trashList={data?.trash_bin || []} onRestore={onRestoreTrash} onDelete={onDeleteTrash} isMobile={isMobile} isAdmin={currentUser?.role === 'admin'} />
        ) : !canAccessBackup ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
            <div style={{ textAlign: "center", padding: "40px 32px", background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", maxWidth: 440 }}>
              <div style={{ fontSize: 64, marginBottom: 18 }}>🔐</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginBottom: 12 }}>Truy cập bị hạn chế</div>
              <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "1px solid #FECACA", marginBottom: 14 }}>
                ⚠️ Chỉ tài khoản Admin mới có quyền thực hiện Sao Lưu & Khôi Phục dữ liệu !
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>Vui lòng liên hệ quản trị viên nếu cần hỗ trợ</div>
            </div>
          </div>
        ) : (
          <BackupPage data={data} users={users} logs={logs} departments={departments} onRestore={onRestore} addLog={addLog} />
        )}
      </div>
    </div>
  );
}

function LogInner({ logs, setLogs, currentUser, addLog }) {
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const isAdmin = currentUser?.role === "admin";

  const staticModules = [
    { label: "Xử lý văn bản", value: "xu_ly_van_ban", keywords: ["xu_ly_van_ban", "văn bản", "vb:"] },
    { label: "Vụ án", value: "vu_an", keywords: ["vu_an", "vụ án"] },
    { label: "Tin báo", value: "tin_bao", keywords: ["tin_bao", "tin báo"] },
    { label: "Đơn tố giác", value: "don_to_giac", keywords: ["don_to_giac", "đơn tố giác", "đơn:", "cập nhật: dtg", "thêm đơn:"] },
    { label: "Đơn công nghệ cao", value: "don_cnc", keywords: ["don_cnc", "don_to_giac:cong_nghe_cao", "công nghệ cao", "đơn cnc"] },
    { label: "Tin 7575", value: "tin_7575", keywords: ["tin_7575", "don_to_giac:tin7575", "tin 7575"] },
    { label: "Truy nã", value: "truy_na", keywords: ["truy_na", "truy nã"] },
    { label: "Truy tìm", value: "truy_tim", keywords: ["truy_tim", "truy tìm"] },
    { label: "Quản lý đối tượng", value: "quan_ly_doi_tuong", keywords: ["quan_ly_doi_tuong", "đối tượng qlnv"] },
    { label: "Xe truy tìm", value: "xe_truy_tim", keywords: ["xe_truy_tim", "xe truy tìm", "xe:"] },
    { label: "Số điện thoại", value: "so_dien_thoai", keywords: ["so_dien_thoai", "sđt:"] },
    { label: "Tài khoản ngân hàng", value: "so_tai_khoan", keywords: ["so_tai_khoan", "tk:"] },
    { label: "Vị trí camera", value: "camera_hues", keywords: ["camera_hues", "camera", "hệ thống camera huếs"] }
  ];

  // Extract unique users for filter options
  const uniqueUsers = React.useMemo(() => {
    if (!Array.isArray(logs)) return [];
    const users = logs.map(l => l.user_name || l.user || "—").filter(Boolean);
    return Array.from(new Set(users)).sort();
  }, [logs]);

  const actionTypes = [
    { label: "Tất cả thao tác", value: "all" },
    { label: "Thêm mới/Thêm", value: "add" },
    { label: "Cập nhật/Sửa", value: "edit" },
    { label: "Xóa", value: "delete" },
    { label: "Đăng nhập", value: "login" },
    { label: "Đăng xuất", value: "logout" },
  ];

  // Filter logs by search query and sort them
  const filteredLogs = React.useMemo(() => {
    let list = Array.isArray(logs)
      ? logs
          .filter(log => log && typeof log === 'object')
          .sort((a, b) => {
            const timeB = b.time ? new Date(b.time).getTime() : 0;
            const timeA = a.time ? new Date(a.time).getTime() : 0;
            return timeB - timeA || (b.id || 0) - (a.id || 0);
          })
      : [];

    // Filter by Time Range
    if (timeRange !== "all") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      list = list.filter(log => {
        if (!log.time) return false;
        const logTime = new Date(log.time).getTime();
        if (timeRange === "today") {
          return logTime >= todayStart;
        } else if (timeRange === "7days") {
          return logTime >= todayStart - 7 * 24 * 60 * 60 * 1000;
        } else if (timeRange === "30days") {
          return logTime >= todayStart - 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    // Filter by User
    if (filterUser !== "all") {
      list = list.filter(log => {
        const u = log.user_name || log.user || "—";
        return u === filterUser;
      });
    }

    // Filter by Action Type
    if (filterAction !== "all") {
      list = list.filter(log => {
        const act = (log.action || "").toLowerCase();
        if (filterAction === "add") return act.includes("thêm");
        if (filterAction === "edit") return act.includes("cập nhật") || act.includes("sửa");
        if (filterAction === "delete") return act.includes("xóa");
        if (filterAction === "login") return act.includes("đăng nhập");
        if (filterAction === "logout") return act.includes("đăng xuất");
        return true;
      });
    }

    // Filter by Module
    if (filterModule !== "all") {
      const selectedModule = staticModules.find(m => m.value === filterModule);
      if (selectedModule) {
        list = list.filter(log => {
          const logMod = (log.module || "").toLowerCase();
          const actionText = (log.action || "").toLowerCase();
          
          if (logMod === selectedModule.value) return true;
          
          if (selectedModule.value === "don_to_giac" && logMod === "don_to_giac") return true;
          if (selectedModule.value === "don_cnc" && logMod === "don_cnc") return true;
          if (selectedModule.value === "tin_7575" && logMod === "tin_7575") return true;
          if (selectedModule.value === "camera_hues" && logMod === "hệ thống camera huếs") return true;
          
          if (logMod === "hệ thống" || !logMod) {
            return selectedModule.keywords.some(kw => actionText.includes(kw));
          }
          
          return selectedModule.keywords.some(kw => logMod.includes(kw) || actionText.includes(kw));
        });
      }
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((log) => {
        const user = (log.user_name || log.user || "").toLowerCase();
        const username = (log.username || "").toLowerCase();
        const action = (log.action || "").toLowerCase();
        const module = (log.module || "").toLowerCase();
        const ip = (log.ip_address || "").toLowerCase();
        const dev = (log.device || "").toLowerCase();
        const bro = (log.browser || "").toLowerCase();
        const localTime = log.time ? new Date(log.time).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }).toLowerCase() : "";
        return user.includes(q) || username.includes(q) || action.includes(q) || module.includes(q) || ip.includes(q) || dev.includes(q) || bro.includes(q) || localTime.includes(q);
      });
    }
    return list;
  }, [logs, search, timeRange, filterUser, filterAction, filterModule]);

  // Reset page when any filter term changes
  React.useEffect(() => {
    setPage(1);
  }, [search, timeRange, filterUser, filterAction, filterModule]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const pagedLogs = React.useMemo(() => {
    return filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredLogs, page]);

  const hasActiveFilters = timeRange !== "all" || filterUser !== "all" || filterAction !== "all" || filterModule !== "all";

  const resetAllFilters = () => {
    setTimeRange("all");
    setFilterUser("all");
    setFilterAction("all");
    setFilterModule("all");
    setSearch("");
  };

  return (
    <div>
      {/* Search Bar & Admin Delete Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo người dùng, hành động, module, IP, thiết bị..."
            style={{ width: "100%", padding: "12px 16px 12px 50px", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Filter Controls Row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end", background: "#F8FAFC", padding: 12, borderRadius: 12, border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 130 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>🕒 Thời gian</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#334155" }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 130 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>👤 Người dùng</label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#334155" }}
          >
            <option value="all">Tất cả người dùng</option>
            {uniqueUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 130 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>🛠️ Thao tác</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#334155" }}
          >
            {actionTypes.map(act => (
              <option key={act.value} value={act.value}>{act.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 130 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>📦 Module</label>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#334155" }}
          >
            <option value="all">Tất cả Module</option>
            {staticModules.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {(hasActiveFilters || search.trim()) && (
          <button
            onClick={resetAllFilters}
            style={{
              padding: "9px 16px",
              background: "#F1F5F9",
              color: "#475569",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              height: "fit-content",
              alignSelf: "flex-end"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
            onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Thời gian", "Người dùng", "Tài khoản", "IP truy cập", "Thiết bị", "Trình duyệt", "Hành động", "Module"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
                    Không tìm thấy nhật ký hoạt động nào
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log, idx) => {
                  const absoluteIndex = (page - 1) * PAGE_SIZE + idx;
                  const localTime = log.time ? new Date(log.time).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  }) : "—";

                  let username = log.username || "—";
                  let ip = log.ip_address || "—";
                  let device = log.device || "—";
                  let browser = log.browser || "—";
                  let actionText = log.action || "";

                  // Parse fallback metadata from action text if columns are not present
                  if (!log.username && actionText.includes(" (TK: ") && actionText.endsWith(")")) {
                    const match = actionText.match(/\(TK: ([^,]+), IP: ([^,]+), Thiết bị: ([^,]+), Trình duyệt: ([^\)]+)\)/);
                    if (match) {
                      username = match[1];
                      ip = match[2];
                      device = match[3];
                      browser = match[4];
                      actionText = actionText.replace(/\s*\(TK: [^)]+\)$/, "");
                    }
                  }

                  return (
                    <tr key={log.id || absoluteIndex} className="row-hover" style={{ borderTop: "1px solid #F3F4F6", background: absoluteIndex % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {localTime}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                        {log.user_name || log.user || "—"}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#4B5563", whiteSpace: "nowrap" }}>
                        <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>{username}</code>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#4B5563", whiteSpace: "nowrap" }}>
                        {ip}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#4B5563", whiteSpace: "nowrap" }}>
                        {device}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#4B5563", whiteSpace: "nowrap" }}>
                        {browser}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#374151" }}>
                        {actionText}
                      </td>
                      <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ background: "#EFF6FF", color: "#3B82F6", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {log.module}
                        </span>
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
          <div>
            Hiển thị <b style={{ color: "#374151" }}>{filteredLogs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filteredLogs.length)}</b> / <b>{filteredLogs.length}</b> dòng nhật ký
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
  );
}

function BackupPage({ data, users, logs, departments, onRestore, addLog }) {
  const [backups, setBackups] = useState([]);
  const [search, setSearch] = useState("");
  const [autoInterval, setAutoInterval] = useState("weekly");
  const [autoDay, setAutoDay] = useState("5");
  const [autoHour, setAutoHour] = useState("17");
  const [lastAuto, setLastAuto] = useState("");
  const [restoreConfirm, setRestoreConfirm] = useState(null);
  const [msg, setMsg] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [hasLocalData, setHasLocalData] = useState(false);
  const [localStats, setLocalStats] = useState({ users: 0, cases: 0 });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const fetchBackups = async () => {
        try {
          const { data: dbBackups, error } = await supabase.from('police_backups').select('*').order('id', { ascending: false });
          if (dbBackups && !error) {
            setBackups(dbBackups);
            return;
          }
        } catch (err) {
          console.warn("Supabase fetch backups failed, falling back to local storage:", err);
        }
        
        const saved = localStorage.getItem("police_backups");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setBackups(parsed);
            }
          } catch (e) {}
        }
      };
      fetchBackups();

      setAutoInterval(localStorage.getItem("backup_interval") || "weekly");
      setAutoDay(localStorage.getItem("backup_day") || "5");
      setAutoHour(localStorage.getItem("backup_hour") || "17");
      setLastAuto(localStorage.getItem("backup_last_auto") || "");

      let found = false;
      let userCount = 0;
      let caseCount = 0;

      const rawUsers = localStorage.getItem("pc02_users");
      if (rawUsers) {
        try {
          const parsed = JSON.parse(rawUsers);
          if (parsed && parsed.length > 0) {
            userCount = parsed.length;
            found = true;
          }
        } catch (e) {}
      }

      const tables = [
        'don_to_giac', 'tin_bao', 'vu_an', 'truy_tim', 'truy_na',
        'quan_ly_doi_tuong', 'xe_truy_tim', 'vu_viec',
        'so_dien_thoai', 'so_tai_khoan', 'xu_ly_van_ban', 'camera_hues'
      ];
      tables.forEach(t => {
        const raw = localStorage.getItem(`pc02_${t}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.length > 0) {
              caseCount += parsed.length;
              found = true;
            }
          } catch (e) {}
        }
      });

      setHasLocalData(found);
      setLocalStats({ users: userCount, cases: caseCount });
    }
  }, []);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(""), 4000);
  };

  const saveBackups = (list) => {
    setBackups(list);
    if (typeof window !== "undefined") {
      localStorage.setItem("police_backups", JSON.stringify(list));
    }
  };

  const doBackup = async (label) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const name = label || `Sao_luu_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const payload = { version: 1, created: dateStr, data, users, logs, departments };
    const json = JSON.stringify(payload);
    const newBackup = { name, date: dateStr, size: (json.length / 1024).toFixed(1) + "KB", json };

    try {
      const { data: insertedData, error } = await supabase.from('police_backups').insert([newBackup]);
      if (!error) {
        const { data: dbBackups } = await supabase.from('police_backups').select('*').order('id', { ascending: false });
        if (dbBackups) {
          saveBackups(dbBackups);
          showMsg(`✅ Đã sao lưu thành công lên Cloud: ${name}`);
          if (addLog) addLog(`Tạo bản sao lưu Cloud: ${name}`, "sao_luu");
          return;
        }
      }
    } catch (err) {
      console.warn("Supabase backup failed, falling back to local storage:", err);
    }

    const localBackup = { ...newBackup, id: Date.now() };
    const newList = [localBackup, ...(Array.isArray(backups) ? backups : [])].slice(0, 50);
    saveBackups(newList);
    showMsg(`✅ Đã sao lưu thành công (cục bộ): ${name}`);
    if (addLog) addLog(`Tạo bản sao lưu (cục bộ): ${name}`, "sao_luu");
  };

  const doDownload = (backup) => {
    const blob = new Blob([backup.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backup.name + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showMsg("📥 Đã tải file sao lưu về máy");
  };

  const doDelete = async (id) => {
    if (!window.confirm("Xóa file sao lưu này?")) return;

    if (id && String(id).length < 12) {
      try {
        const { error } = await supabase.from('police_backups').delete().eq('id', id);
        if (!error) {
          const newList = (Array.isArray(backups) ? backups : []).filter((b) => b && b.id !== id);
          saveBackups(newList);
          showMsg("🗑️ Đã xóa file sao lưu", "warn");
          return;
        }
      } catch (err) {
        console.warn("Supabase delete backup failed:", err);
      }
    }

    saveBackups((Array.isArray(backups) ? backups : []).filter((b) => b && b.id !== id));
    showMsg("🗑️ Đã xóa file sao lưu cục bộ", "warn");
  };

  const handleRestore = (backup) => setRestoreConfirm(backup);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const payload = JSON.parse(ev.target.result);
        if (!payload.version || !payload.data) {
          showMsg("❌ File không hợp lệ!", "error");
          return;
        }
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const name = `Import_${file.name.replace(".json", "")}_${dateStr.replace(/[: ]/g, "-")}`;
        const newBackup = { name, date: dateStr, size: (ev.target.result.length / 1024).toFixed(1) + "KB", json: ev.target.result };

        try {
          const { error } = await supabase.from('police_backups').insert([newBackup]);
          if (!error) {
            const { data: dbBackups } = await supabase.from('police_backups').select('*').order('id', { ascending: false });
            if (dbBackups) {
              saveBackups(dbBackups);
              showMsg('📤 Đã import file thành công lên Cloud! Nhấn "Khôi phục" để áp dụng.', "success");
              return;
            }
          }
        } catch (err) {
          console.warn("Supabase import failed, using local storage:", err);
        }

        const localBackup = { ...newBackup, id: Date.now() };
        const newList = [localBackup, ...(Array.isArray(backups) ? backups : [])].slice(0, 50);
        saveBackups(newList);
        showMsg('📤 Đã import file thành công cục bộ! Nhấn "Khôi phục" để áp dụng.', "success");
      } catch (err) {
        showMsg("❌ Lỗi đọc file: " + err.message, "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const saveAutoSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("backup_interval", autoInterval);
      localStorage.setItem("backup_day", autoDay);
      localStorage.setItem("backup_hour", autoHour);
    }
    showMsg("⚙️ Đã lưu cấu hình tự động sao lưu");
  };

  const performRestore = async (backup) => {
    setRestoring(true);
    try {
      const payload = JSON.parse(backup.json);
      if (onRestore) {
        await onRestore(payload);
        showMsg("✅ Khôi phục cơ sở dữ liệu thành công!", "success");
        if (addLog) addLog(`Khôi phục dữ liệu từ bản: ${backup.name}`, "sao_luu");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showMsg("❌ Lỗi cấu hình hệ thống: Không tìm thấy hàm khôi phục", "error");
      }
    } catch (e) {
      showMsg("❌ Lỗi khôi phục: " + e.message, "error");
    } finally {
      setRestoring(false);
      setRestoreConfirm(null);
    }
  };

  const filtered = Array.isArray(backups)
    ? backups.filter((b) => {
        if (!b || typeof b !== "object") return false;
        const name = b.name || "";
        const date = b.date || "";
        return !search.trim() || name.toLowerCase().includes(search.toLowerCase()) || date.includes(search);
      })
    : [];
  const intervalLabel = { daily: "Mỗi ngày", weekly: "Mỗi tuần", biweekly: "2 tuần/lần", monthly: "Mỗi tháng" };
  const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const fileRef = useRef();

  if (!isMounted) {
    return <div style={{ padding: "20px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>⏳ Đang tải trang sao lưu...</div>;
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>💾 Sao Lưu & Khôi Phục Dữ Liệu</h3>
      
      {msg && (
        <div style={{ 
          background: msg.type === "error" ? "#FEF2F2" : msg.type === "warn" ? "#FFFBEB" : "#F0FDF4", 
          border: `1px solid ${msg.type === "error" ? "#FECACA" : msg.type === "warn" ? "#FDE68A" : "#BBF7D0"}`, 
          color: msg.type === "error" ? "#DC2626" : msg.type === "warn" ? "#D97706" : "#15803D", 
          padding: "12px 18px", 
          borderRadius: 10, 
          marginBottom: 16, 
          fontWeight: 600, 
          fontSize: 13 
        }}>
          {msg.text}
        </div>
      )}

      {hasLocalData && (
        <div style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", borderRadius: 16, padding: 20, border: "1px solid #FED7AA", marginBottom: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ fontSize: 32 }}>💻</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#C2410C", margin: "0 0 6px" }}>Phát hiện dữ liệu cục bộ cũ trên trình duyệt này</h4>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 14px", lineHeight: 1.4 }}>
                Hệ thống phát hiện thấy bạn đang có bản ghi cũ lưu trên trình duyệt (gồm <b>{localStats.users} cán bộ</b> và <b>{localStats.cases} công việc</b>) từ thời gian chạy ngoại tuyến.
                Bạn có muốn đồng bộ (ghi đè) dữ liệu này lên database Supabase chạy thật không? Việc này sẽ khôi phục lại toàn bộ ảnh cán bộ bạn đã tải lên trước đó.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={async () => {
                    if (!window.confirm("⚠️ CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ dữ liệu trên Supabase bằng dữ liệu lưu trên trình duyệt này. Bạn có chắc chắn muốn thực hiện?")) return;
                    setRestoring(true);
                    try {
                      const getLocalTable = (tableName) => {
                        let raw = localStorage.getItem(`pc02_${tableName}`);
                        return raw ? JSON.parse(raw) : null;
                      };
                      const localUsers = getLocalTable('users');
                      const localDepts = getLocalTable('departments');
                      const localLogs = getLocalTable('system_logs');
                      const tables = [
                        'don_to_giac', 'tin_bao', 'vu_an', 'truy_tim', 'truy_na',
                        'quan_ly_doi_tuong', 'xe_truy_tim', 'vu_viec',
                        'so_dien_thoai', 'so_tai_khoan', 'xu_ly_van_ban', 'camera_hues'
                      ];
                      const localData = {};
                      tables.forEach(t => {
                        localData[t] = getLocalTable(t);
                      });

                      const payload = {
                        departments: localDepts,
                        users: localUsers,
                        logs: localLogs,
                        data: localData
                      };

                      await onRestore(payload);
                      showMsg("✅ Đồng bộ dữ liệu cục bộ lên Supabase thành công!", "success");
                      if (addLog) await addLog("Đồng bộ dữ liệu LocalStorage lên Supabase", "sao_luu");
                      setTimeout(() => {
                        window.location.reload();
                      }, 1500);
                    } catch (err) {
                      showMsg("❌ Lỗi đồng bộ: " + err.message, "error");
                    } finally {
                      setRestoring(false);
                    }
                  }}
                  disabled={restoring}
                  style={{ padding: "9px 18px", background: "#EA580C", color: "#fff", border: "none", borderRadius: 10, cursor: restoring ? "default" : "pointer", fontWeight: 700, fontSize: 13 }}
                >
                  {restoring ? "🔄 Đang đồng bộ..." : "📤 Đồng bộ lên Supabase ngay"}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn xóa bản lưu trữ cục bộ này trên trình duyệt? Việc này không ảnh hưởng đến dữ liệu trên Supabase.")) {
                      localStorage.removeItem("pc02_users");
                      localStorage.removeItem("pc02_departments");
                      localStorage.removeItem("pc02_system_logs");
                      const tables = [
                        'don_to_giac', 'tin_bao', 'vu_an', 'truy_tim', 'truy_na',
                        'quan_ly_doi_tuong', 'xe_truy_tim', 'vu_viec',
                        'so_dien_thoai', 'so_tai_khoan', 'xu_ly_van_ban', 'camera_hues'
                      ];
                      tables.forEach(t => localStorage.removeItem(`pc02_${t}`));
                      setHasLocalData(false);
                      showMsg("🗑️ Đã xóa dữ liệu cũ trên trình duyệt", "warn");
                    }
                  }}
                  style={{ padding: "9px 18px", background: "#fff", color: "#C2410C", border: "1px solid #FDBA74", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                >
                  🗑️ Xóa bản ghi cục bộ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20, position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm file sao lưu theo tên hoặc ngày..."
          style={{ width: "100%", padding: "10px 14px 10px 42px", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: typeof window !== "undefined" && window.innerWidth < 640 ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius: 16, padding: 20, border: "1px solid #BFDBFE" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>💾</div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#1D4ED8", margin: "0 0 6px" }}>Sao Lưu Dữ Liệu</h4>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 14px" }}>Tạo bản sao lưu cục bộ chứa toàn bộ dữ liệu hiện tại của hệ thống</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => doBackup()} style={{ padding: "9px 18px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              💾 Sao lưu ngay
            </button>
            <button 
              onClick={() => {
                if (backups.length === 0) {
                  showMsg("Chưa có file sao lưu nào!", "warn");
                  return;
                }
                doDownload(backups[0]);
              }} 
              style={{ padding: "9px 18px", background: "#fff", color: "#3B82F6", border: "1px solid #BFDBFE", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              📥 Tải xuống bản mới nhất
            </button>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius: 16, padding: 20, border: "1px solid #BBF7D0" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔄</div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#15803D", margin: "0 0 6px" }}>Khôi Phục Dữ Liệu</h4>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 14px" }}>Ghi đè cơ sở dữ liệu Supabase từ danh sách sao lưu hoặc tải lên file JSON</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button 
              onClick={() => {
                if (backups.length === 0) {
                  showMsg("Chưa có file sao lưu nào!", "warn");
                  return;
                }
                setRestoreConfirm(backups[0]);
              }} 
              style={{ padding: "9px 18px", background: "#22C55E", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              🔄 Khôi phục mới nhất
            </button>
            <button onClick={() => fileRef.current.click()} style={{ padding: "9px 18px", background: "#fff", color: "#22C55E", border: "1px solid #BBF7D0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              📤 Import file JSON
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileImport} />
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid #E5E7EB", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          ⚙️ Cấu Hình Tự Động Sao Lưu
          <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF", background: "#F3F4F6", padding: "2px 10px", borderRadius: 20 }}>Mặc định: Thứ 6 lúc 17:00 hàng tuần</span>
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tần suất</label>
            <select value={autoInterval} onChange={(e) => setAutoInterval(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}>
              <option value="daily">Mỗi ngày</option>
              <option value="weekly">Mỗi tuần</option>
              <option value="biweekly">2 tuần 1 lần</option>
              <option value="monthly">Mỗi tháng</option>
            </select>
          </div>
          {(autoInterval === "weekly" || autoInterval === "biweekly") && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Ngày trong tuần</label>
              <select value={autoDay} onChange={(e) => setAutoDay(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}>
                {days.map((d, i) => <option key={i} value={String(i)}>{d}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Giờ sao lưu</label>
            <select value={autoHour} onChange={(e) => setAutoHour(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button onClick={saveAutoSettings} style={{ padding: "8px 20px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            ⚙️ Lưu cấu hình
          </button>
          <div style={{ fontSize: 12, color: "#6B7280" }}>
            Lịch hiện tại: <b>{(intervalLabel[autoInterval] || "Chưa rõ")} – {(days[parseInt(autoDay)] || "Chưa rõ")} lúc {String(autoHour || 0).padStart(2, "0")}:00</b>
          </div>
          {lastAuto && <div style={{ fontSize: 11, color: "#9CA3AF" }}>Lần cuối: {lastAuto}</div>}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#374151" }}>
            📂 Danh Sách Bản Sao Lưu <span style={{ color: "#9CA3AF", fontWeight: 500 }}>( {filtered.length} bản )</span>
          </h4>
          {backups.length > 0 && (
            <button 
              onClick={() => {
                if (!window.confirm("Xóa TẤT CẢ file sao lưu lịch sử khỏi trình duyệt?")) return;
                saveBackups([]);
                showMsg("🗑️ Đã xóa toàn bộ lịch sử bản sao lưu", "warn");
              }} 
              style={{ padding: "5px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              Xóa tất cả bản ghi
            </button>
          )}
        </div>
        
        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {search ? "Không tìm thấy file phù hợp" : "Chưa có file sao lưu nào"}
            </div>
            <div style={{ fontSize: 12 }}>
              {!search && 'Nhấn "Sao lưu ngay" ở trên để tạo bản sao lưu dữ liệu đầu tiên'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Tên file", "Ngày giờ sao lưu", "Kích thước", "Thao tác"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id || i} className="row-hover" style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>💾</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>JSON Format</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>{b.date}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#EFF6FF", color: "#3B82F6", padding: "2px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{b.size}</span>
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <button onClick={() => handleRestore(b)} style={{ border: "none", background: "#F0FDF4", color: "#15803D", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 6 }}>
                      🔄 Khôi phục
                    </button>
                    <button onClick={() => doDownload(b)} style={{ border: "none", background: "#EFF6FF", color: "#3B82F6", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 6 }}>
                      📥 Tải
                    </button>
                    <button onClick={() => doDelete(b.id)} style={{ border: "none", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {restoreConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", textAlign: "center", margin: "0 0 10px" }}>Xác nhận khôi phục</h3>
            <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", margin: "0 0 8px" }}>
              File: <b style={{ color: "#374151" }}>{restoreConfirm.name}</b>
            </p>
            <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", margin: "0 0 20px" }}>
              Ngày sao lưu: <b>{restoreConfirm.date}</b>
            </p>
            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400E", lineHeight: 1.4 }}>
              ⚠️ Thao tác này sẽ <b>thay thế toàn bộ dữ liệu hiện tại trong cơ sở dữ liệu Supabase</b> bằng bản sao lưu. Vui lòng không tắt trình duyệt trong quá trình đồng bộ.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => setRestoreConfirm(null)} 
                disabled={restoring}
                style={{ flex: 1, padding: "11px", border: "1px solid #D1D5DB", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
              >
                Hủy
              </button>
              <button 
                onClick={() => performRestore(restoreConfirm)} 
                disabled={restoring}
                style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#22C55E,#15803D)", color: "#fff", border: "none", borderRadius: 10, cursor: restoring ? "default" : "pointer", fontWeight: 700, fontSize: 14 }}
              >
                {restoring ? "🔄 Đang đồng bộ..." : "✅ Xác nhận khôi phục"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrashInner({ trashList, onRestore, onDelete, isMobile, isAdmin }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const MODULE_LABELS = {
    don_to_giac: "Đơn tố giác",
    tin_bao: "Tin báo",
    vu_an: "Vụ án",
    truy_tim: "Truy tìm",
    truy_na: "Truy nã",
    quan_ly_doi_tuong: "Quản lý đối tượng",
    xe_truy_tim: "Xe truy tìm",
    vu_viec: "Vụ việc",
    so_dien_thoai: "Số điện thoại",
    so_tai_khoan: "Tài khoản ngân hàng",
    xu_ly_van_ban: "Xử lý văn bản",
    camera_hues: "Camera HuếS"
  };

  const getItemIdentifier = (item) => {
    let itemData = {};
    try {
      itemData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    } catch (e) {
      return "—";
    }
    return itemData.ma_so || itemData.so_tk || itemData.so_dt || itemData.name || itemData.tieu_de || "—";
  };

  const getItemName = (item) => {
    let itemData = {};
    try {
      itemData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    } catch (e) {
      return "—";
    }
    return itemData.tieu_de || itemData.ten_chu_so || itemData.ten_chu_tk || itemData.ho_ten || "—";
  };

  const filtered = React.useMemo(() => {
    let list = [...trashList];
    list.sort((a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0));

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(item => {
        const type = (MODULE_LABELS[item.module_key] || item.module_key || "").toLowerCase();
        const deletedBy = (item.deleted_by || "").toLowerCase();
        const ident = getItemIdentifier(item).toLowerCase();
        const name = getItemName(item).toLowerCase();
        return type.includes(q) || deletedBy.includes(q) || ident.includes(q) || name.includes(q);
      });
    }
    return list;
  }, [trashList, search]);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm trong thùng rác..."
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}
        />
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["#", "Mục dữ liệu", "Định danh / Mã số", "Tên / Tiêu đề", "Người xóa", "Thời gian xóa", "Thao tác"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
                    Thùng rác trống
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const localTime = item.deleted_at ? new Date(item.deleted_at).toLocaleString("vi-VN") : "—";
                  return (
                    <tr key={item.id} style={{ borderTop: "1px solid #F3F4F6", background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#94A3B8", fontWeight: 700 }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>
                        {MODULE_LABELS[item.module_key] || item.module_key}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#4B5563" }}>
                        <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>
                          {getItemIdentifier(item)}
                        </code>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#1F2937", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {getItemName(item)}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#4B5563", whiteSpace: "nowrap" }}>
                        {item.deleted_by || "—"}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {localTime}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                          <button
                            onClick={() => onRestore(item)}
                            style={{ border: "none", background: "#EFF6FF", color: "#2563EB", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                          >
                            Khôi phục
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => onDelete(item)}
                              style={{ border: "none", background: "#FEF2F2", color: "#DC2626", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                            >
                              Xóa vĩnh viễn
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

        {/* Trash pagination */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #E5E7EB", fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: "#FAFBFC" }}>
          <div>
            Hiển thị <b style={{ color: "#374151" }}>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> mục đã xóa
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>‹</button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                const isAct = p === page;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{ padding: "4px 9px", border: "1px solid " + (isAct ? "#EF4444" : "#E2E8F0"), borderRadius: 6, background: isAct ? "#EF4444" : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontSize: 11, fontWeight: isAct ? 700 : 400, minWidth: 30 }}>
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
  );
}
