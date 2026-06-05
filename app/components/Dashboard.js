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

function LineChart({ data, classifications, colors }) {
  const width = 800;
  const height = 260;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 30;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Find max value
  let maxVal = 1;
  data.forEach(d => {
    classifications.forEach(cls => {
      if (d[cls] > maxVal) maxVal = d[cls];
    });
  });
  // Round up maxVal to even number if > 1
  if (maxVal > 1) {
    maxVal = Math.ceil(maxVal / 2) * 2;
  }

  const yTicks = Array.from({ length: 5 }, (_, i) => (maxVal / 4) * i);
  const xLabels = ["Th.1", "Th.2", "Th.3", "Th.4", "Th.5", "Th.6", "Th.7", "Th.8", "Th.9", "Th.10", "Th.11", "Th.12"];

  return (
    <div style={{ width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 16, fontSize: 11, fontWeight: 700 }}>
        {classifications.map(cls => (
          <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 3, background: colors[cls], borderRadius: 1.5 }} />
            <span style={{ color: '#475569' }}>{cls}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        {/* Y-axis Ticks and Gridlines */}
        {yTicks.map((tick, idx) => {
          const y = paddingTop + plotHeight * (1 - tick / maxVal);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill="#94A3B8">{Math.round(tick)}</text>
            </g>
          );
        })}

        {/* X-axis Labels */}
        {xLabels.map((label, idx) => {
          const x = paddingLeft + (idx / 11) * plotWidth;
          return (
            <g key={idx}>
              <text x={x} y={height - 8} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94A3B8">{label}</text>
              <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke="#F8FAFC" strokeWidth="1" />
            </g>
          );
        })}

        {/* Render lines and points */}
        {classifications.map(cls => {
          const color = colors[cls];
          const points = data.map((d, idx) => {
            const x = paddingLeft + (idx / 11) * plotWidth;
            const y = paddingTop + plotHeight * (1 - d[cls] / maxVal);
            return { x, y, val: d[cls] };
          });

          const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

          return (
            <g key={cls}>
              {/* Stroke path */}
              <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.5s ease-in-out' }} />
              
              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <title>{`${cls} - Tháng ${idx + 1}: ${p.val} CTV`}</title>
                  <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke={color} strokeWidth="3" style={{ transition: 'all 0.3s' }} />
                  {p.val > 0 && (
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="800" fill={color}>{p.val}</text>
                  )}
                </g>
              ))}
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

  // Time progression data (CTVs created over 12 months for each classification)
  const lineChartData = useMemo(() => {
    const classifications = ["CSBM", "ĐT1", "ĐT2", "ĐT3", "CTVDD", "HTBM"];
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const obj = { month: i + 1 };
      classifications.forEach(cls => {
        obj[cls] = 0;
      });
      return obj;
    });

    ctvList.forEach(c => {
      if (!c.created_date) return;
      const d = new Date(c.created_date);
      if (isNaN(d.getTime())) return;
      const monthIndex = d.getMonth(); // 0 to 11
      let cls = c.classification || "CSBM";
      if (cls === "CS") cls = "CSBM";
      if (cls === "DD") cls = "CTVDD";
      if (cls === "HT") cls = "HTBM";
      if (classifications.includes(cls)) {
        monthlyData[monthIndex][cls]++;
      }
    });

    return monthlyData;
  }, [ctvList]);

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

      {/* Line Chart showing CTV creation history over 12 months */}
      <div style={{ ...card({ padding: 20 }), marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>📈 Tiến độ xây dựng CTV theo thời gian (12 Tháng)</div>
        <LineChart 
          data={lineChartData} 
          classifications={["CSBM", "ĐT1", "ĐT2", "ĐT3", "CTVDD", "HTBM"]} 
          colors={{
            "CSBM": '#2563EB',
            "ĐT1": '#DC2626',
            "ĐT2": '#D97706',
            "ĐT3": '#4F46E5',
            "CTVDD": '#0D9488',
            "HTBM": '#0891B2'
          }} 
        />
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
