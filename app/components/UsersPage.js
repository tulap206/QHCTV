'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  UserAvatar, 
  RankBadge, 
  Modal, 
  FormField,
  compressImage,
  exportToPrint,
  exportToWord,
  getStatus
} from './shared';
import { QUAN_HAM_BADGES } from '@/lib/constants';

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

// Helper to calculate user statistics for display
function getUserStats(user, data) {
  const stats = { total: 0, dang_lam: 0, sap_het: 0, qua_han: 0, hoan_thanh: 0 };
  
  // Không tính Camera Huế S và Xe Truy Tìm vào cột "đang làm" của cán bộ
  const PHU_TRACH_MAPPING = {
    don_to_giac: "phu_trach",
    tin_bao: "phu_trach",
    vu_an: "tham_phan",
    truy_tim: "phu_trach",
    truy_na: "phu_trach",
    vu_viec: "phu_trach",
    so_dien_thoai: "can_bo_cap_nhat",
    so_tai_khoan: "can_bo_cap_nhat",
    xu_ly_van_ban: "can_bo_xu_ly"
    // Đã loại: xe_truy_tim, camera_hues
  };

  Object.entries(PHU_TRACH_MAPPING).forEach(([modId, field]) => {
    let items = [];
    if (modId === "truy_tim") {
      items = data["truy_tim"] || [];
    } else if (modId === "truy_na") {
      items = data["truy_na"] || [];
    } else if (modId === "so_dien_thoai") {
      items = data["so_dien_thoai"] || [];
    } else if (modId === "so_tai_khoan") {
      items = data["so_tai_khoan"] || [];
    } else {
      items = data[modId] || [];
    }

    items.forEach((i) => {
      const officerVal = i[field] || i.phu_trach || i.can_bo_xu_ly || i.tham_phan || i.can_bo_phu_trach || i.can_bo_cap_nhat || "";
      if (officerVal && officerVal.includes(user.name)) {
        let s = getStatus(i.deadline, i.status || i.trang_thai_dt || i.trang_thai, i.thoi_hieu, i.trang_thai_an, i.trang_thai_tin);
        
        // Vụ án loại trừ các hồ sơ không phải hiện hành hoặc tạm đình chỉ khỏi diện đang làm/quá hạn
        if (modId === "vu_an") {
          const isExcluded = i.trang_thai_an && i.trang_thai_an !== "hien_hanh" && i.trang_thai_an !== "tam_dinh_chi";
          if (isExcluded) {
            s = "hoan_thanh";
          }
        }
        
        // Tin báo loại trừ các hồ sơ không phải đang giải quyết
        if (modId === "tin_bao") {
          const isExcluded = i.trang_thai_tin && i.trang_thai_tin !== "dang_giai_quyet";
          if (isExcluded) {
            s = "hoan_thanh";
          }
        }

        if (s === "sap_het_han") {
          stats.sap_het++;
        } else {
          stats[s] = (stats[s] || 0) + 1;
        }
        stats.total++;
      }
    });
  });
  return stats;
}


function StackedBarChart({ data, height = 180, width = 300 }) {
  const max = Math.max(...data.map(d => d.totalActive), 1);
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 25;
  const paddingBottom = 25;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 6, fontSize: 10, fontWeight: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }} />
          <span style={{ color: '#64748B' }}>Quá hạn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B' }} />
          <span style={{ color: '#64748B' }}>Sắp hết hạn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#10B981' }} />
          <span style={{ color: '#64748B' }}>Đang làm</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        {/* Horizontal grid lines */}
        {ticks.map((t, idx) => {
          const y = paddingTop + plotHeight * (1 - t);
          const gridVal = Math.round(max * t);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize="9" fontWeight="600" fill="#94A3B8">{gridVal}</text>
            </g>
          );
        })}

        {/* Stacked Bars */}
        {data.map((d, i) => {
          const barWidth = Math.min(18, plotWidth / data.length - 8);
          const colX = paddingLeft + (i / data.length) * plotWidth + (plotWidth / data.length - barWidth) / 2;
          
          const greenHeight = (d.progress / max) * plotHeight;
          const yellowHeight = (d.urgent / max) * plotHeight;
          const redHeight = (d.overdue / max) * plotHeight;
          const totalHeight = greenHeight + yellowHeight + redHeight;

          const startY = paddingTop + plotHeight;
          const greenY = startY - greenHeight;
          const yellowY = greenY - yellowHeight;
          const redY = yellowY - redHeight;

          const lastName = d.name.trim().split(' ').slice(-1)[0] || '';

          return (
            <g key={i}>
              <title>{`${d.name}: Đang làm ${d.progress}, Sắp hết ${d.urgent}, Quá hạn ${d.overdue}`}</title>
              
              <rect x={colX} y={paddingTop} width={barWidth} height={plotHeight} fill="#F8FAFC" rx="3" opacity="0.5" />

              {greenHeight > 0 && (
                <rect x={colX} y={greenY} width={barWidth} height={greenHeight} fill="#10B981" rx="2" />
              )}
              {yellowHeight > 0 && (
                <rect x={colX} y={yellowY} width={barWidth} height={yellowHeight} fill="#F59E0B" rx="2" />
              )}
              {redHeight > 0 && (
                <rect x={colX} y={redY} width={barWidth} height={redHeight} fill="#EF4444" rx="2" />
              )}

              {d.totalActive > 0 && (
                <text x={colX + barWidth / 2} y={startY - totalHeight - 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1E293B">{d.totalActive}</text>
              )}

              <text x={colX + barWidth / 2} y={startY + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748B">{lastName}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function UsersPage({ 
  currentUser, 
  setCurrentUser, 
  data, 
  users, 
  setUsers, 
  departments, 
  addLog, 
  highlightUser, 
  setHighlightUser,
  isMobile
}) {
  const isAdmin = currentUser.role === "admin";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [selUser, setSelUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUserModal, setEditUserModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [statFilter, setStatFilter] = useState("all"); // "all" | "lanh_dao" | "can_bo_cs"
  const [filterChucVu, setFilterChucVu] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [sortBy, setSortBy] = useState("chuc_vu");

  useEffect(() => {
    if (highlightUser) {
      const u = users.find(x => x.name === highlightUser);
      if (u) setSelUser({ ...u, stats: getUserStats(u, data) });
      if (setHighlightUser) setHighlightUser(null);
    }
  }, [highlightUser, users, data, setHighlightUser]);

  const CV_ORD = { "Trưởng Phòng": 0, "Phó Trưởng Phòng": 1, "Đội Trưởng": 2, "Phó Đội Trưởng": 3, "Cán Bộ": 4 };
  const CB_ORD = { "Đại tướng": 0, "Thượng tướng": 1, "Trung tướng": 2, "Thiếu tướng": 3, "Đại tá": 4, "Thượng tá": 5, "Trung tá": 6, "Thiếu tá": 7, "Đại úy": 8, "Thượng úy": 9, "Trung úy": 10, "Thiếu úy": 11 };

  const uws = useMemo(() => (users || []).map(u => {
    const s = getUserStats(u, data);
    const dtgAll = data["don_to_giac"] || [];
    const vuAn = (data["vu_an"] || []).filter(i => i.tham_phan === u.name).length;
    const tinBao = (data["tin_bao"] || []).filter(i => i.phu_trach === u.name).length;
    const dtgDon = dtgAll.filter(i => i.can_bo_xu_ly === u.name && (!i.loai || i.loai === "don")).length;
    const dtgCnc = dtgAll.filter(i => i.can_bo_xu_ly === u.name && i.loai === "cong_nghe_cao").length;
    const tin7575 = dtgAll.filter(i => i.can_bo_xu_ly === u.name && i.loai === "tin7575").length;
    const don = dtgDon + dtgCnc + tin7575;
    const vanBan = (data["xu_ly_van_ban"] || []).filter(i => i.can_bo_xu_ly === u.name).length;
    const truyNa = (data["truy_na"] || []).filter(i => i.phu_trach && i.phu_trach.includes(u.name)).length;
    const truyTim = (data["truy_tim"] || []).filter(i => i.phu_trach && i.phu_trach.includes(u.name)).length;
    const tntt = truyNa + truyTim;
    const doiTuong = (data["quan_ly_doi_tuong"] || []).filter(i => i.can_bo_phu_trach === u.name).length;
    return { ...u, stats: { ...s, vuAn, tinBao, dtgDon, dtgCnc, tin7575, don, vanBan, tntt, doiTuong } };
  }), [users, data]);

  const stackedData = useMemo(() => {
    return uws.map(u => ({
      name: u.name,
      overdue: u.stats.qua_han || 0,
      urgent: u.stats.sap_het || 0,
      progress: u.stats.dang_lam || 0,
      totalActive: (u.stats.qua_han || 0) + (u.stats.sap_het || 0) + (u.stats.dang_lam || 0)
    })).sort((a, b) => b.totalActive - a.totalActive).slice(0, 6);
  }, [uws]);

  const topPerformance = useMemo(() => {
    return [...uws].sort((a, b) => b.stats.hoan_thanh - a.stats.hoan_thanh).slice(0, 6);
  }, [uws]);

  const lowPerformance = useMemo(() => {
    return [...uws].sort((a, b) => {
      // 1. Quá hạn nhiều nhất lên đầu
      if ((b.stats.qua_han || 0) !== (a.stats.qua_han || 0)) {
        return (b.stats.qua_han || 0) - (a.stats.qua_han || 0);
      }
      // 2. Ít hoàn thành nhất lên đầu
      if ((a.stats.hoan_thanh || 0) !== (b.stats.hoan_thanh || 0)) {
        return (a.stats.hoan_thanh || 0) - (b.stats.hoan_thanh || 0);
      }
      // 3. Ít việc nhất (total) lên đầu
      return (a.stats.total || 0) - (b.stats.total || 0);
    }).slice(0, 6);
  }, [uws]);


  const sorted = useMemo(() => {
    let list = uws.filter(u => {
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (statFilter === "lanh_dao" && !["Trưởng Phòng","Phó Trưởng Phòng","Đội Trưởng","Phó Đội Trưởng"].includes(u.chuc_vu)) return false;
      if (statFilter === "can_bo_cs" && u.chuc_vu !== "Cán Bộ") return false;
      if (filterChucVu !== "all" && u.chuc_vu !== filterChucVu) return false;
      if (filterDept !== "all" && u.department !== filterDept) return false;
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !(u.username || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (sortBy === "chuc_vu" || !sortBy) {
      list = [...list].sort((a, b) => { 
        const cv = (CV_ORD[a.chuc_vu] ?? 99) - (CV_ORD[b.chuc_vu] ?? 99); 
        if (cv !== 0) return cv; 
        return (CB_ORD[a.cap_bac] ?? 99) - (CB_ORD[b.cap_bac] ?? 99); 
      });
    }
    else if (sortBy === "total_desc") list = [...list].sort((a, b) => b.stats.total - a.stats.total);
    else if (sortBy === "total_asc") list = [...list].sort((a, b) => a.stats.total - b.stats.total);
    else if (sortBy === "qua_han_desc") list = [...list].sort((a, b) => b.stats.qua_han - a.stats.qua_han);
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [uws, sortBy, filterRole, filterChucVu, filterDept, search, statFilter]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1;
  const paged = sorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  useEffect(() => { 
    setPage(1); 
  }, [search, filterRole, statFilter, filterChucVu, filterDept, sortBy]);

  const totalCB = uws.length;
  const lanhDao = uws.filter(u => ["Trưởng Phòng", "Phó Trưởng Phòng", "Đội Trưởng", "Phó Đội Trưởng"].includes(u.chuc_vu)).length;
  const canBoCS = uws.filter(u => u.chuc_vu === "Cán Bộ").length;

  const rC = { admin: "#7C3AED", mod: "#EA580C", officer: "#3B82F6", viewer: "#6B7280" };
  const rL = { admin: "Admin", mod: "Mod", officer: "Cán Bộ", viewer: "Chỉ Xem" };

  const thStyle = { padding: "12px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" };

  const handleDeleteUser = async (u) => {
    if (u.role === "admin") {
      alert("Không xóa tài khoản Admin!");
      return;
    }
    if (!window.confirm("Xóa cán bộ " + u.name + "?")) return;

    try {
      const { error } = await supabase.from('qhctv_users').delete().eq('id', u.id);
      if (error) throw error;

      setUsers(p => p.filter(x => x.id !== u.id));
      await addLog("Xóa cán bộ: " + u.name, "Cán bộ");
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi xóa cán bộ!");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 14, flexWrap: "wrap", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>👮 Quản lý cán bộ</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý thông tin và phân quyền cán bộ</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            onClick={() => { 
              if (!isAdmin) { 
                alert("⛔ Chỉ Admin mới có quyền thêm cán bộ!"); 
                return; 
              } 
              setShowAddUser(true); 
            }}
            style={{ padding: "8px 14px", background: isAdmin ? "#22C55E" : "#9CA3AF", color: "#fff", border: "none", borderRadius: 10, cursor: isAdmin ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 12, width: isMobile ? "100%" : "auto", justifyContent: "center" }}
          >
            ➕ Thêm cán bộ
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Tổng số cán bộ", value: totalCB, icon: "👮", color: "#3B82F6", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "#BFDBFE", active: statFilter==="all", onClick: ()=>{ setStatFilter("all"); setSortBy("chuc_vu"); } },
          { label: "Lãnh đạo chỉ huy", value: lanhDao, icon: "⭐", color: "#7C3AED", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", border: "#C4B5FD", active: statFilter==="lanh_dao", onClick: ()=>{ setStatFilter("lanh_dao"); setSortBy("chuc_vu"); } },
          { label: "Cán bộ chiến sĩ", value: canBoCS, icon: "🛡️", color: "#059669", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "#A7F3D0", active: statFilter==="can_bo_cs", onClick: ()=>{ setStatFilter("can_bo_cs"); setSortBy("chuc_vu"); } }
        ].map((s, i) => (
          <div 
            key={i} 
            onClick={s.onClick} 
            style={{ 
              background: s.active ? s.color : s.bg, 
              borderRadius: 12, 
              padding: "12px 14px", 
              border: "2px solid " + (s.active ? s.color : s.border), 
              cursor: "pointer", 
              transition: "all 0.18s ease", 
              userSelect: "none",
              position: "relative",
              overflow: "hidden",
              boxShadow: s.active ? `0 4px 14px ${s.color}40` : "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ position: "absolute", right: -8, bottom: -12, fontSize: 56, opacity: s.active ? 0.15 : 0.12, pointerEvents: "none", userSelect: "none" }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 18, marginBottom: 4, position: "relative", zIndex: 1 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.active ? "#fff" : s.color, lineHeight: 1, position: "relative", zIndex: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.active ? "rgba(255,255,255,0.85)" : "#6B7280", fontWeight: 600, marginTop: 3, position: "relative", zIndex: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER BAR */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", flexShrink: 0, width: isMobile ? "100%" : "auto" }}>Lọc & Sắp xếp:</span>
        <div style={{ position: "relative", flexShrink: 0, width: isMobile ? "100%" : "auto" }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8", pointerEvents: "none" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, tài khoản..." style={{ ...inputSt, paddingLeft: 28, maxWidth: isMobile ? "none" : 180, width: "100%", fontSize: 12, padding: "5px 10px 5px 28px" }} />
        </div>
        <select value={filterChucVu} onChange={e => setFilterChucVu(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 165, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", fontSize: 12 }}>
          <option value="all">Tất cả chức vụ</option>
          {["Trưởng Phòng", "Phó Trưởng Phòng", "Đội Trưởng", "Phó Đội Trưởng", "Cán Bộ"].map(cv => <option key={cv} value={cv}>{cv}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 150, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", fontSize: 12 }}>
          <option value="all">Tất cả phân quyền</option>
          <option value="admin">Admin</option>
          <option value="mod">Mod</option>
          <option value="officer">Cán Bộ</option>
          <option value="viewer">Chỉ Xem</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 140, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", fontSize: 12 }}>
          <option value="all">Tất cả đơn vị</option>
          {departments.map(d => {
            const deptName = typeof d === 'string' ? d : d.name;
            const deptKey = typeof d === 'string' ? d : (d.id || d.name);
            return <option key={deptKey} value={deptName}>{deptName}</option>;
          })}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...selectSt, maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", fontSize: 12 }}>
          <option value="chuc_vu">📋 Chức vụ / Cấp bậc</option>
          <option value="total_desc">📂 Nhiều công việc nhất</option>
          <option value="total_asc">📉 Ít công việc nhất</option>
          <option value="qua_han_desc">🚨 Quá hạn nhiều nhất</option>
          <option value="name">🔤 Theo tên</option>
        </select>
        {(search || filterRole !== "all" || filterChucVu !== "all" || filterDept !== "all") && (
          <button
            onClick={() => { setSearch(""); setFilterRole("all"); setFilterChucVu("all"); setFilterDept("all"); }}
            style={{ padding: "5px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
          >
            × Xóa lọc
          </button>
        )}
        <button
          onClick={() => {
            const title = "DANH SÁCH CÁN BỘ CHIẾN SĨ ĐƠN VỊ";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Họ tên", "Số hiệu/Tài khoản", "Cấp bậc", "Chức vụ", "Đơn vị/Đội", "Phân quyền", "Công việc đang làm", "Quá hạn"];
            const rows = sorted.map(item => [
              item.name || "—",
              item.username || "—",
              item.cap_bac || "—",
              item.chuc_vu || "—",
              item.department || "—",
              item.role === "admin" ? "Chỉ huy (Admin)" : item.role === "mod" ? "Điều tra viên (Mod)" : item.role === "officer" ? "Cán bộ (Officer)" : "Khách (Viewer)",
              item.stats?.dang_lam || 0,
              item.stats?.qua_han || 0
            ]);
            exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          🖨️ In
        </button>
        <button
          onClick={() => {
            const title = "DANH SÁCH CÁN BỘ CHIẾN SĨ ĐƠN VỊ";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = ["Họ tên", "Số hiệu/Tài khoản", "Cấp bậc", "Chức vụ", "Đơn vị/Đội", "Phân quyền", "Công việc đang làm", "Quá hạn"];
            const rows = sorted.map(item => [
              item.name || "—",
              item.username || "—",
              item.cap_bac || "—",
              item.chuc_vu || "—",
              item.department || "—",
              item.role === "admin" ? "Chỉ huy (Admin)" : item.role === "mod" ? "Điều tra viên (Mod)" : item.role === "officer" ? "Cán bộ (Officer)" : "Khách (Viewer)",
              item.stats?.dang_lam || 0,
              item.stats?.qua_han || 0
            ]);
            exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: "danh_sach_can_bo_chien_si" });
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 11, color: "#94A3B8", width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{sorted.length}/{totalCB} cán bộ</div>
      </div>

      {/* 3-COLUMN DASHBOARD ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* CARD 1: Tải công việc cán bộ */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 Tải công việc cán bộ
          </div>
          <StackedBarChart data={stackedData} />
        </div>

        {/* CARD 2: Hiệu suất cán bộ */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            🏆 Hiệu suất cán bộ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topPerformance.map((u, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              const pct = u.stats.total > 0 ? Math.round(u.stats.hoan_thanh / u.stats.total * 100) : 0;
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, width: 20, textAlign: 'center', flexShrink: 0, fontWeight: 700, color: '#64748B' }}>{medals[i] || `${i + 1}`}</span>
                  <UserAvatar user={u} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct > 70 ? '#22C55E' : pct > 40 ? '#F59E0B' : '#EF4444', borderRadius: 2, transition: 'width 0.8s' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#2563EB' }}>
                    {u.stats.hoan_thanh}
                    <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500, marginLeft: 2 }}>xong</span>
                  </div>
                </div>
              );
            })}
            {topPerformance.length === 0 && <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 11, padding: 12 }}>Chưa có dữ liệu</div>}
          </div>
        </div>

        {/* CARD 3: Hiệu suất kém */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠️ Hiệu suất kém / Đôn đốc
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lowPerformance.map((u, i) => {
              const medals = ['⚠️', '🔸', '🔸'];
              const hasOverdue = u.stats.qua_han > 0;
              const hasSapHet = u.stats.sap_het > 0;
              const isIdle = u.stats.total === 0;

              let badgeText = '';
              let badgeBg = '#F1F5F9';
              let badgeColor = '#64748B';

              if (hasOverdue) {
                badgeText = `${u.stats.qua_han} quá hạn`;
                badgeBg = '#FEE2E2';
                badgeColor = '#EF4444';
              } else if (hasSapHet) {
                badgeText = `${u.stats.sap_het} sắp hết`;
                badgeBg = '#FEF3C7';
                badgeColor = '#D97706';
              } else if (isIdle) {
                badgeText = 'Ít việc / Rỗi';
                badgeBg = '#F1F5F9';
                badgeColor = '#64748B';
              } else {
                const pct = u.stats.total > 0 ? Math.round(u.stats.hoan_thanh / u.stats.total * 100) : 0;
                badgeText = `${pct}% xong`;
                badgeBg = pct < 30 ? '#FEE2E2' : '#F1F5F9';
                badgeColor = pct < 30 ? '#EF4444' : '#64748B';
              }

              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, width: 20, textAlign: 'center', flexShrink: 0, fontWeight: 700, color: '#64748B' }}>{medals[i] || `${i + 1}`}</span>
                  <UserAvatar user={u} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>{u.chuc_vu} · {u.stats.total} việc</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, background: badgeBg, color: badgeColor, padding: '2px 6px', borderRadius: 6, display: 'inline-block' }}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
            {lowPerformance.length === 0 && <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 11, padding: 12 }}>Chưa có dữ liệu</div>}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#1E3A8A,#2563EB)" }}>
                {["#", "Cán bộ", "Tên tài khoản", "Đơn vị", "Phân quyền", "Công việc", "Thao tác"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Không tìm thấy cán bộ</td>
                </tr>
              ) : (
                paged.map((u, i) => {
                  const s = u.stats;
                  const rowBg = i % 2 === 0 ? "#fff" : "#F8FAFC";
                  const pqColor = rC[u.role] || "#6B7280";
                  const pqLabel = rL[u.role] || u.role;
                  return (
                    <tr 
                      key={u.id} 
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#EEF2FF"} 
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      {/* # */}
                      <td style={{ padding: "9px 6px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 26 }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      {/* Cán bộ */}
                      <td style={{ padding: "9px 10px", minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <UserAvatar user={u} size={40} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              {u.cap_bac && <RankBadge capBac={u.cap_bac} size={20} />}
                              <span>{u.cap_bac || ""}</span>
                              {u.cap_bac && <span style={{ color: "#E2E8F0" }}> · </span>}
                              <span style={{ color: pqColor, fontWeight: 600, fontSize: 10 }}>{u.chuc_vu || ""}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Tên tài khoản */}
                      <td style={{ padding: "9px 8px" }}>
                        <div style={{ fontWeight: 700, fontSize: 11, color: "#1E40AF", fontFamily: "monospace", background: "#EFF6FF", padding: "3px 7px", borderRadius: 6, display: "inline-block", border: "1px solid #BFDBFE" }}>{u.username || ""}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{u.email || ""}</div>
                      </td>
                      {/* Đơn vị */}
                      <td style={{ padding: "9px 8px", whiteSpace: "nowrap" }}>
                        <span style={{ background: "#F0FDF4", color: "#15803D", padding: "3px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{u.department || ""}</span>
                      </td>
                      {/* Phân quyền */}
                      <td style={{ padding: "9px 8px", whiteSpace: "nowrap" }}>
                        <span style={{ background: pqColor + "18", color: pqColor, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{pqLabel}</span>
                      </td>
                      {/* Công việc */}
                      <td style={{ padding: "8px 8px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {/* Row 1: Án, Tin, Đơn, VB, TNTT, QLĐT */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {[
                              { l: "Án", v: s.vuAn || 0, c: "#1D4ED8", bg: "#DBEAFE" },
                              { l: "Tin", v: s.tinBao || 0, c: "#6D28D9", bg: "#EDE9FE" },
                              { l: "Đơn", v: s.don || 0, c: "#0369A1", bg: "#E0F2FE" },
                              { l: "VB", v: s.vanBan || 0, c: "#B45309", bg: "#FEF3C7" },
                              { l: "TNTT", v: s.tntt || 0, c: "#DC2626", bg: "#FEE2E2" },
                              { l: "QLĐT", v: s.doiTuong || 0, c: "#EC4899", bg: "#FCE7F3" }
                            ].map((item, ii) => (
                              <span key={ii} style={{ background: item.v > 0 ? item.bg : "#F8FAFC", color: item.v > 0 ? item.c : "#CBD5E1", padding: "2px 5px", borderRadius: 6, fontSize: 10, fontWeight: item.v > 0 ? 700 : 400, border: "1px solid " + (item.v > 0 ? item.c + "40" : "#E5E7EB"), whiteSpace: "nowrap" }}>
                                {item.l}:<b>{item.v}</b>
                              </span>
                            ))}
                          </div>
                          {/* Row 2: Đang làm, Hoàn thành, Quá hạn */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            <span style={{ fontSize: 9, color: s.dang_lam > 0 ? "#1E40AF" : "#94A3B8", background: s.dang_lam > 0 ? "#EFF6FF" : "#F8FAFC", padding: "2px 6px", borderRadius: 6, fontWeight: s.dang_lam > 0 ? 700 : 400, border: "1px solid " + (s.dang_lam > 0 ? "#BFDBFE" : "#E5E7EB"), whiteSpace: "nowrap" }}>
                              Đang làm: <b>{s.dang_lam || 0}</b>
                            </span>
                            <span style={{ fontSize: 9, color: s.hoan_thanh > 0 ? "#15803D" : "#94A3B8", background: s.hoan_thanh > 0 ? "#F0FDF4" : "#F8FAFC", padding: "2px 6px", borderRadius: 6, fontWeight: s.hoan_thanh > 0 ? 700 : 400, border: "1px solid " + (s.hoan_thanh > 0 ? "#BBF7D0" : "#E5E7EB"), whiteSpace: "nowrap" }}>
                              Hoàn thành: <b>{s.hoan_thanh || 0}</b>
                            </span>
                            <span style={{ fontSize: 9, color: s.qua_han > 0 ? "#B91C1C" : "#94A3B8", background: s.qua_han > 0 ? "#FEF2F2" : "#F8FAFC", padding: "2px 6px", borderRadius: 6, fontWeight: s.qua_han > 0 ? 700 : 400, border: "1px solid " + (s.qua_han > 0 ? "#FCA5A5" : "#E5E7EB"), whiteSpace: "nowrap" }}>
                              Quá hạn: <b>{s.qua_han || 0}</b>
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Thao tác */}
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 3 }}>
                          <button onClick={() => setSelUser(u)} style={{ border: "none", background: "#EFF6FF", color: "#3B82F6", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Chi tiết</button>
                          {isAdmin && (
                            <>
                              <button onClick={() => setEditUserModal(u)} style={{ border: "none", background: "#FFF7ED", color: "#EA580C", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Sửa</button>
                              <button onClick={() => handleDeleteUser(u)} style={{ border: "none", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xóa</button>
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

        {/* PAGINATION PANEL */}
        <div style={{ padding: "8px 14px", borderTop: "1px solid #F1F5F9", background: "#FAFBFC", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#6B7280", marginRight: 12 }}>
            Hiển thị <b style={{ color: "#374151" }}>{sorted.length}</b>/{totalCB} cán bộ
          </span>
          <span style={{ display: "flex", gap: 12, alignItems: "center", marginRight: "auto" }}>
            <span style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600 }}>Admin: {uws.filter(u => u.role === "admin").length}</span>
            <span style={{ fontSize: 11, color: "#EA580C", fontWeight: 600 }}>Mod: {uws.filter(u => u.role === "mod").length}</span>
            <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600 }}>User: {uws.filter(u => u.role === "officer").length}</span>
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Hiển thị</span>
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
                <button onClick={() => setPage(1)} disabled={page===1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page===1?"#F8FAFC":"#fff", color: page===1?"#CBD5E1":"#374151", cursor: page===1?"default":"pointer", fontSize: 11 }}>«</button>
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page===1?"#F8FAFC":"#fff", color: page===1?"#CBD5E1":"#374151", cursor: page===1?"default":"pointer", fontSize: 11 }}>‹</button>
                {[...Array(totalPages)].map((_,i)=>{ 
                  const p=i+1,isAct=p===page; 
                  const show=p===1||p===totalPages||Math.abs(p-page)<=2; 
                  if(!show){ 
                    if(p===2&&page>4) return <span key={p} style={{color:"#9CA3AF",fontSize:11,padding:"0 2px"}}>...</span>; 
                    if(p===totalPages-1&&page<totalPages-3) return <span key={p} style={{color:"#9CA3AF",fontSize:11,padding:"0 2px"}}>...</span>; 
                    return null; 
                  } 
                  return <button key={p} onClick={()=>setPage(p)} style={{padding:"4px 9px",border:"1px solid "+(isAct?"#0284C7":"#E2E8F0"),borderRadius:6,background:isAct?"#0284C7":"#fff",color:isAct?"#fff":"#374151",cursor:"pointer",fontSize:11,fontWeight:isAct?700:400,minWidth:30}}>{p}</button>; 
                })}
                <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page===totalPages?"#F8FAFC":"#fff", color: page===totalPages?"#CBD5E1":"#374151", cursor: page===totalPages?"default":"pointer", fontSize: 11 }}>›</button>
                <button onClick={() => setPage(totalPages)} disabled={page===totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page===totalPages?"#F8FAFC":"#fff", color: page===totalPages?"#CBD5E1":"#374151", cursor: page===totalPages?"default":"pointer", fontSize: 11 }}>»</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <EditUserModal
          user={{ id: 0, name: "", username: "", password: "admin123", cap_bac: "Đại úy", chuc_vu: "Cán Bộ", department: (typeof departments[0] === 'string' ? departments[0] : departments[0]?.name) || "Đội 3", role: "officer", phone: "", email: "", avatar_img: "" }}
          departments={departments}
          onSave={async (updated) => {
            try {
              const { stats, ...cleanUser } = updated;
              if (cleanUser.id === 0) {
                const maxId = (users || []).reduce((max, u) => (u.id > max ? u.id : max), 0);
                cleanUser.id = maxId + 1;
              }
              const { data: insertedData, error } = await supabase
                 .from('qhctv_users')
                 .insert([cleanUser])
                 .select();
              if (error) throw error;
 
              setUsers(prev => [...prev, insertedData[0]]);
              await addLog("Thêm cán bộ: " + updated.name, "Cán bộ");
              setShowAddUser(false);
            } catch (err) {
              console.error(err);
              alert("Lỗi khi thêm cán bộ: " + err.message);
            }
          }}
          onClose={() => setShowAddUser(false)}
          isMobile={isMobile}
        />
      )}
 
      {/* Edit User Modal */}
      {editUserModal && (
        <EditUserModal
          user={editUserModal}
          departments={departments}
          onSave={async (updated) => {
            try {
              const { stats, ...cleanUser } = updated;
              // Lưu toàn bộ thông tin bao gồm role lên Supabase
              const { data: updatedData, error } = await supabase
                 .from('qhctv_users')
                 .update(cleanUser)
                 .eq('id', cleanUser.id)
                 .select();
              if (error) throw error;

              const savedUser = updatedData?.[0] || cleanUser;
              setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
              // Nếu đang chỉnh sửa chính tài khoản đang đăng nhập thì cập nhật session
              if (currentUser.id === savedUser.id) setCurrentUser(savedUser);
              await addLog(`Cập nhật cán bộ: ${savedUser.name} (role: ${savedUser.role})`, "Cán bộ");
              setEditUserModal(null);
            } catch (err) {
              console.error(err);
              alert("Lỗi khi cập nhật thông tin: " + err.message);
            }
          }}
          onClose={() => setEditUserModal(null)}
          isMobile={isMobile}
        />
      )}
 
      {/* User Detail Modal */}
      {selUser && (
        <UserDetailModal
          user={selUser}
          data={data}
          onClose={() => setSelUser(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function EditUserModal({ user, departments, onSave, onClose, isMobile }) {
  const [f, setF] = useState({ ...user, _newpw: "" });
  const set = (k, v) => setF(p => ({...p, [k]: v}));
  const fileRef = useRef();

  const CAP_BAC_LIST = ["Đại tướng","Thượng tướng","Trung tướng","Thiếu tướng","Đại tá","Thượng tá","Trung tá","Thiếu tá","Đại úy","Thượng úy","Trung úy","Thiếu úy"];
  const CHUC_VU_LIST = ["Trưởng Phòng","Phó Trưởng Phòng","Đội Trưởng","Phó Đội Trưởng","Cán Bộ"];
  const CB_MAP = {"Đại tướng":"dai_tuong","Thượng tướng":"thuong_tuong","Trung tướng":"trung_tuong","Thiếu tướng":"thieu_tuong","Đại tá":"dai_ta","Thượng tá":"thuong_ta","Trung tá":"trung_ta","Thiếu tá":"thieu_ta","Đại úy":"dai_uy","Thượng úy":"thuong_uy","Trung úy":"trung_uy","Thiếu úy":"thieu_uy"};
  
  const badgeKey = CB_MAP[f.cap_bac];
  const badgeSrc = badgeKey && QUAN_HAM_BADGES[badgeKey];

  const handleAvatar = async e => {
    const file = e.target.files[0]; 
    if (!file) return;
    try {
      const compressed = await compressImage(file, 150, 150, 0.7);
      set("avatar_img", compressed);
    } catch (err) {
      console.error("Lỗi nén ảnh:", err);
      alert("Không thể nén ảnh: " + err.message);
    }
  };

  return (
    <Modal title={user.id === 0 ? "➕ Thêm Cán Bộ Mới" : `✏️ Chỉnh sửa cán bộ: ${user.name}`} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 18, marginBottom: 16, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 90 }}>
          <div
            style={{ width: 80, height: 80, borderRadius: "50%", background: "#F1F5F9", border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
          >
            {f.avatar_img ? (
              <img src={f.avatar_img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar Preview" />
            ) : (
              <UserAvatar user={f} size={80} />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: "4px 10px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 600 }}>📷 Chọn ảnh</button>
          {f.avatar_img && <button type="button" onClick={() => set("avatar_img", "")} style={{ padding: "3px 8px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 10 }}>✕ Xóa ảnh</button>}
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 14px", minWidth: 240, width: "100%" }}>
          <FormField label="Họ và tên" required>
            <input value={f.name} onChange={e => set("name", e.target.value)} style={inputSt} />
          </FormField>
          <FormField label="Tên đăng nhập" required>
            <input value={f.username} onChange={e => set("username", e.target.value)} style={inputSt} disabled={user.id !== 0} />
          </FormField>
          <FormField label="Số điện thoại">
            <input value={f.phone||""} onChange={e => set("phone", e.target.value)} style={inputSt} />
          </FormField>
          <FormField label="Email">
            <input value={f.email||""} onChange={e => set("email", e.target.value)} style={inputSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 14px" }}>
        <FormField label="Cấp bậc">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {badgeSrc && <img src={badgeSrc} style={{ width: 24, height: 36, objectFit: "contain", flexShrink: 0 }} alt={f.cap_bac} />}
            <select value={f.cap_bac||""} onChange={e => set("cap_bac", e.target.value)} style={{ ...selectSt, flex: 1 }}>
              {CAP_BAC_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </FormField>
        <FormField label="Chức vụ">
          <select value={f.chuc_vu||""} onChange={e => set("chuc_vu", e.target.value)} style={selectSt}>
            {CHUC_VU_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Đơn vị">
          <select value={f.department||""} onChange={e => set("department", e.target.value)} style={selectSt}>
            {departments.map(d => {
              const deptName = typeof d === 'string' ? d : d.name;
              const deptKey = typeof d === 'string' ? d : (d.id || d.name);
              return <option key={deptKey} value={deptName}>{deptName}</option>;
            })}
          </select>
        </FormField>
        <FormField label="Phân quyền">
          <select value={f.role||"officer"} onChange={e => set("role", e.target.value)} style={selectSt}>
            <option value="admin">Admin</option>
            <option value="mod">Mod</option>
            <option value="officer">Cán Bộ</option>
            <option value="viewer">Chỉ Xem</option>
          </select>
        </FormField>
        <FormField label={user.id === 0 ? "Mật khẩu đăng nhập" : "Mật khẩu mới (để trống = giữ nguyên)"}>
          <input type="password" value={f._newpw||""} onChange={e => set("_newpw", e.target.value)} style={inputSt} placeholder={user.id === 0 ? "Mật khẩu..." : "Mật khẩu mới..."} />
        </FormField>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button
          onClick={() => {
            if (!f.name.trim() || !f.username.trim()) {
              alert("Vui lòng điền đầy đủ Họ tên và Tên đăng nhập!");
              return;
            }
            if (user.id === 0 && !f._newpw.trim()) {
              alert("Vui lòng điền mật khẩu đăng nhập!");
              return;
            }
            const saved = { ...f };
            if (f._newpw) {
              saved.password = f._newpw;
            }
            // Generate standard short initials
            const nameParts = (f.name || "").trim().split(" ");
            saved.avatar = nameParts.length >= 2 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : (f.name || "").slice(0, 2).toUpperCase();
            delete saved._newpw;
            onSave(saved);
          }}
          style={{ padding: "10px 24px", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
        >
          💾 Lưu
        </button>
      </div>
    </Modal>
  );
}

function UserDetailModal({ user, data, onClose, isMobile }) {
  const s = getUserStats(user, data);
  const dtgAll = data["don_to_giac"] || [];
  const dtgDon = dtgAll.filter(i => i.can_bo_xu_ly === user.name && (!i.loai || i.loai === "don"));
  const dtgCnc = dtgAll.filter(i => i.can_bo_xu_ly === user.name && i.loai === "cong_nghe_cao");
  const tin7575 = dtgAll.filter(i => i.can_bo_xu_ly === user.name && i.loai === "tin7575");
  const vanBan = (data["xu_ly_van_ban"] || []).filter(i => i.can_bo_xu_ly === user.name);
  const doiTuong = (data["quan_ly_doi_tuong"] || []).filter(i => i.can_bo_phu_trach === user.name);
  const vuAn = (data["vu_an"] || []).filter(i => i.tham_phan === user.name);
  const tinBao = (data["tin_bao"] || []).filter(i => i.phu_trach === user.name);

  return (
    <Modal title="👮 Hồ sơ cán bộ" onClose={onClose}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
        <UserAvatar user={user} size={72} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{user.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            {user.cap_bac && <RankBadge capBac={user.cap_bac} size={28} />}
            <span style={{ fontWeight: 700, color: "#374151" }}>{user.cap_bac||""}</span>
            {user.cap_bac && <span style={{ color: "#CBD5E1" }}> · </span>}
            <span style={{ color: "#7C3AED", fontWeight: 700 }}>{user.chuc_vu||""}</span>
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: "#F0FDF4", color: "#15803D", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{user.department||""}</span>
            <span style={{ background: user.role==="admin"?"#F5F3FF":"#EFF6FF", color: user.role==="admin"?"#7C3AED":"#3B82F6", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{user.role==="admin"?"Admin":user.role==="mod"?"Mod":"Cán Bộ"}</span>
            <span style={{ background: "#F8FAFC", color: "#64748B", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontFamily: "monospace" }}>@{user.username}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4,1fr)" : "repeat(7,1fr)", gap: 6, padding: "12px", background: "#F8FAFC", borderRadius: 12, marginBottom: 12 }}>
        {[
          { l: "⚖️ Án", v: vuAn.length, c: "#1D4ED8" },
          { l: "📡 Tin", v: tinBao.length, c: "#7C3AED" },
          { l: "📋 ĐTG", v: dtgDon.length, c: "#2563EB" },
          { l: "💻 CNC", v: dtgCnc.length, c: "#7C3AED" },
          { l: "📞 7575", v: tin7575.length, c: "#059669" },
          { l: "📄 VB", v: vanBan.length, c: "#D97706" },
          { l: "👀 ĐT", v: doiTuong.length, c: "#DC2626" },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: "center", padding: "8px 4px", background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: item.v>0?item.c:"#CBD5E1" }}>{item.v}</div>
            <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, marginTop: 2 }}>{item.l}</div>
          </div>
        ))}
      </div>
      {s.qua_han > 0 && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "#DC2626", fontWeight: 700, marginBottom: 12 }}>
          🔴 Có {s.qua_han} công việc quá hạn
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Đóng</button>
      </div>
    </Modal>
  );
}
