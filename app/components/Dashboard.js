"use client";

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Modal, getDisplayTitle, UserAvatar } from './shared';

// Dynamically load the LeafletMap component without SSR to prevent window ReferenceErrors
const LeafletMap = dynamic(
  () => import('./LeafletMap'),
  { ssr: false, loading: () => <div style={{ height: "450px", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", borderRadius: "16px", color: "#64748B" }}>Đang tải bản đồ quy hoạch...</div> }
);

/* ─────────────────────────────────────────────
   MINI SVG CHARTS (Offline compatible, pure CSS styling)
   ───────────────────────────────────────────── */
function DonutChart({ segments, size = 120, thickness = 22 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circum = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circum;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${circum}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

function StackedBarChart({ data, height = 180, width = 300 }) {
  const max = Math.max(...data.map(d => d.totalActive), 1);
  const paddingLeft = 35;
  const paddingRight = 10;
  const paddingTop = 25;
  const paddingBottom = 25;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12, fontSize: 10, fontWeight: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#10B981' }} />
          <span style={{ color: '#64748B' }}>Hoạt động</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B' }} />
          <span style={{ color: '#64748B' }}>Tạm khóa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }} />
          <span style={{ color: '#64748B' }}>Ngừng HĐ</span>
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
          
          const greenHeight = (d.active / max) * plotHeight;
          const yellowHeight = (d.locked / max) * plotHeight;
          const redHeight = (d.inactive / max) * plotHeight;
          const totalHeight = greenHeight + yellowHeight + redHeight;

          const startY = paddingTop + plotHeight;
          const greenY = startY - greenHeight;
          const yellowY = greenY - yellowHeight;
          const redY = yellowY - redHeight;

          const lastName = d.name.trim().split(' ').slice(-1)[0] || '';

          return (
            <g key={i}>
              <title>{`${d.name}: Hoạt động ${d.active}, Tạm khóa ${d.locked}, Ngừng HĐ ${d.inactive}`}</title>
              
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

/* ─────────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
   ───────────────────────────────────────────── */
export default function Dashboard({ data, users, setActivePage, setSelectedRecord, isMobile }) {
  const [selectedMapCtv, setSelectedMapCtv] = useState(null);

  const ctvList = useMemo(() => data["collaborators"] || [], [data]);

  const totalCtv = ctvList.length;

  const classStats = useMemo(() => {
    const counts = { CSBM: 0, ĐT1: 0, ĐT2: 0, ĐT3: 0, CTVDD: 0, HTBM: 0 };
    ctvList.forEach(c => {
      let cls = c.classification || "CSBM";
      if (cls === "CS") cls = "CSBM";
      if (cls === "DD") cls = "CTVDD";
      if (cls === "HT") cls = "HTBM";
      if (counts[cls] !== undefined) {
        counts[cls]++;
      } else {
        counts["CSBM"]++;
      }
    });
    return [
      { label: 'Cơ sở (CSBM)', value: counts.CSBM, color: '#2563EB' },
      { label: 'Đặc tình 1 (ĐT1)', value: counts.ĐT1, color: '#DC2626' },
      { label: 'Đặc tình 2 (ĐT2)', value: counts.ĐT2, color: '#D97706' },
      { label: 'Đặc tình 3 (ĐT3)', value: counts.ĐT3, color: '#4F46E5' },
      { label: 'Danh dự (CTVDD)', value: counts.CTVDD, color: '#0D9488' },
      { label: 'Hộp thư (HTBM)', value: counts.HTBM, color: '#0891B2' }
    ];
  }, [ctvList]);

  const competenceStats = useMemo(() => {
    const counts = { 'Xuất sắc': 0, 'Tốt': 0, 'Khá': 0, 'Kém': 0 };
    ctvList.forEach(c => {
      const comp = c.competence || "Khá";
      if (counts[comp] !== undefined) {
        counts[comp]++;
      } else {
        counts['Khá']++;
      }
    });
    return [
      { label: 'Xuất sắc', value: counts['Xuất sắc'], color: '#7C3AED' },
      { label: 'Tốt', value: counts['Tốt'], color: '#2563EB' },
      { label: 'Khá', value: counts['Khá'], color: '#D97706' },
      { label: 'Kém', value: counts['Kém'], color: '#DC2626' }
    ];
  }, [ctvList]);

  const statusStats = useMemo(() => {
    const counts = { hoat_dong: 0, tam_ngung: 0, dung_hoat_dong: 0 };
    ctvList.forEach(c => {
      let st = c.status || "hoat_dong";
      if (st === "tam_khoa") st = "tam_ngung";
      if (st === "ngung_hoat_dong") st = "dung_hoat_dong";
      if (counts[st] !== undefined) {
        counts[st]++;
      } else {
        counts.hoat_dong++;
      }
    });
    return [
      { label: 'Hoạt động', value: counts.hoat_dong, color: '#22C55E' },
      { label: 'Tạm ngưng', value: counts.tam_ngung, color: '#F59E0B' },
      { label: 'Dừng hoạt động', value: counts.dung_hoat_dong, color: '#EF4444' }
    ];
  }, [ctvList]);

  // Workload data (number of CTVs managed by each officer)
  const stackedData = useMemo(() => {
    return (users || []).filter(u => u.role !== 'viewer').map(u => {
      const uCtvs = ctvList.filter(c => c.managing_officer === u.name);
      return {
        name: u.name,
        active: uCtvs.filter(c => c.status === "hoat_dong" || !c.status).length,
        locked: uCtvs.filter(c => c.status === "tam_khoa").length,
        inactive: uCtvs.filter(c => c.status === "ngung_hoat_dong").length,
        totalActive: uCtvs.length
      };
    }).sort((a, b) => b.totalActive - a.totalActive).slice(0, 6);
  }, [users, ctvList]);

  const card = (extra = {}) => ({
    background: '#fff', 
    borderRadius: 18, 
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
    overflow: 'hidden', 
    ...extra,
  });

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#C8102E,#9B1222)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(200,16,46,0.3)' }}>🛡️</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Tổng Quan Hệ Thống</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>QHCTV · Hệ thống quy hoạch, quản lý thông tin và địa bàn Cộng tác viên</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Interactive map container block */}
      <div style={{ ...card({ padding: "16px" }), marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 900, color: "#1E293B", margin: 0 }}>🗺️ Bản đồ quy hoạch Cộng tác viên</h3>
            <span style={{ fontSize: "11px", color: "#64748B" }}>Hiển thị các vị trí và bán kính quét radar của CTV (Zoom vào gần để quét khu vực)</span>
          </div>
        </div>
        <LeafletMap collaborators={ctvList} onSelectCollaborator={setSelectedMapCtv} height="580px" />
      </div>

      {/* Three Horizontal Distribution Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        
        {/* 1. Classification Donut */}
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>📊 Phân loại CTV</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <DonutChart segments={classStats} size={120} thickness={20} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1E293B' }}>{totalCtv}</div>
                <div style={{ fontSize: 8, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Tổng CTV</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {classStats.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748B', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: d.color }}>{d.value}</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', width: 32, textAlign: 'right' }}>{totalCtv > 0 ? Math.round(d.value / totalCtv * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Competence Donut */}
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>🏆 Năng lực CTV</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <DonutChart segments={competenceStats} size={120} thickness={20} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1E293B' }}>{totalCtv}</div>
                <div style={{ fontSize: 8, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Tổng CTV</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {competenceStats.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748B', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: d.color }}>{d.value}</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', width: 32, textAlign: 'right' }}>{totalCtv > 0 ? Math.round(d.value / totalCtv * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Status Donut */}
        <div style={card({ padding: 20 })}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>📈 Trạng thái CTV</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <DonutChart segments={statusStats} size={120} thickness={20} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1E293B' }}>{totalCtv}</div>
                <div style={{ fontSize: 8, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Tổng CTV</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {statusStats.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748B', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: d.color }}>{d.value}</span>
                  <span style={{ fontSize: 10, color: '#94A3B8', width: 32, textAlign: 'right' }}>{totalCtv > 0 ? Math.round(d.value / totalCtv * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Officer workload stack bar chart */}
      <div style={{ ...card({ padding: 20 }), marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>👥 Tải quản lý CTV của Cán bộ</div>
          <button onClick={() => setActivePage('users')} style={{ fontSize: 11, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Xem chi tiết →</button>
        </div>
        <StackedBarChart data={stackedData} height={180} />
      </div>

      {/* Map Click Details popup card modal */}
      {selectedMapCtv && (
        <Modal 
          title="CHI TIẾT HỒ SƠ QUY HOẠCH CTV" 
          onClose={() => setSelectedMapCtv(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, borderBottom: "1px solid #E5E7EB", paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Mã CTV:</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{selectedMapCtv.ma_so}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Biệt danh (Nickname):</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{selectedMapCtv.nickname}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Địa bàn hoạt động:</span>
                <div style={{ fontSize: 14, color: "#334155" }}>{selectedMapCtv.address}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Số điện thoại:</span>
                <div style={{ fontSize: 14, color: "#334155" }}>{selectedMapCtv.phone || "—"}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Tọa độ GPS:</span>
                <div style={{ fontSize: 13, color: "#334155" }}>Lat: {selectedMapCtv.lat} · Lng: {selectedMapCtv.lng}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Bán kính bảo vệ:</span>
                <div style={{ fontSize: 13, color: "#334155" }}>{selectedMapCtv.coverage_radius} m</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Trạng thái:</span>
                <div>
                  <span style={{ 
                    background: selectedMapCtv.status === "hoat_dong" || !selectedMapCtv.status ? "#DCFCE7" : (selectedMapCtv.status === "tam_khoa" ? "#FEF3C7" : "#FEF2F2"), 
                    color: selectedMapCtv.status === "hoat_dong" || !selectedMapCtv.status ? "#15803D" : (selectedMapCtv.status === "tam_khoa" ? "#B45309" : "#991B1B"), 
                    padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 
                  }}>
                    {selectedMapCtv.status === "hoat_dong" || !selectedMapCtv.status ? "Hoạt động" : (selectedMapCtv.status === "tam_khoa" ? "Tạm khóa" : "Ngừng hoạt động")}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Cán bộ phụ trách:</span>
                <div style={{ fontSize: 14, color: "#334155", fontWeight: 600 }}>{selectedMapCtv.managing_officer || "—"}</div>
              </div>
            </div>
            
            {selectedMapCtv.ghi_chu && (
              <div>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Mô tả chi tiết / Ghi chú:</span>
                <div style={{ fontSize: 13, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "10px 14px", borderRadius: 8, whiteSpace: "pre-wrap", marginTop: 4 }}>
                  {selectedMapCtv.ghi_chu}
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button 
                onClick={() => {
                  setSelectedRecord(selectedMapCtv);
                  setActivePage('collaborators');
                  setSelectedMapCtv(null);
                }}
                style={{ padding: "8px 16px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
              >
                Đến quản lý
              </button>
              <button 
                onClick={() => setSelectedMapCtv(null)}
                style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
