'use client';

import React, { useState, useMemo, useEffect } from 'react';

export default function LogPage({ logs }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    let list = [...(logs || [])].sort((a, b) => {
      return new Date(b.time) - new Date(a.time) || b.id - a.id;
    });

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((log) => {
        const user = (log.user_name || log.user || "").toLowerCase();
        const action = (log.action || "").toLowerCase();
        const module = (log.module || "").toLowerCase();
        const localTime = log.time ? new Date(log.time).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }).toLowerCase() : "";
        return user.includes(q) || action.includes(q) || module.includes(q) || localTime.includes(q);
      });
    }
    return list;
  }, [logs, search]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const pagedLogs = useMemo(() => {
    return filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredLogs, page]);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>
        📋 Lịch Sử Hoạt Động
      </h2>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Xem nhật ký các hành động của cán bộ trên hệ thống</div>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo người dùng, hành động, module, thời gian..."
          style={{ width: "100%", padding: "12px 16px 12px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
          onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
          onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>

      {/* Table Container */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Thời gian", "Người dùng", "Hành động", "Module"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
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
                  
                  return (
                    <tr key={log.id || absoluteIndex} className="row-hover" style={{ borderTop: "1px solid #F3F4F6", background: absoluteIndex % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {localTime}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                        {log.user_name || log.user || "—"}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#374151" }}>
                        {log.action}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
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
