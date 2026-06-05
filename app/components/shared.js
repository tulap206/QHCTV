import React from 'react';
import { QUAN_HAM_BADGES } from '@/lib/constants';

export const MODULES = [
  { id: "collaborators", label: "Cộng Tác Viên", icon: "👥", color: "#EC4899" }
];

export const STATUS_CONFIG = {
  dang_lam: { label: "Hoạt Động", color: "#22C55E", bg: "#DCFCE7", dot: "#16A34A" },
  sap_het_han: { label: "Tạm Khóa", color: "#F59E0B", bg: "#FEF3C7", dot: "#D97706" },
  qua_han: { label: "Ngừng HĐ", color: "#EF4444", bg: "#FEE2E2", dot: "#DC2626" },
  hoan_thanh: { label: "Hoàn Thành", color: "#6B7280", bg: "#F3F4F6", dot: "#4B5563" }
};

export const PRIORITY = {
  cao: { label: "Cao", color: "#EF4444" },
  trung_binh: { label: "Trung Bình", color: "#F59E0B" },
  thap: { label: "Thấp", color: "#22C55E" }
};

export const PHU_TRACH_FIELDS = {
  collaborators: "managing_officer"
};

export function getStatus(deadline, status, thoiHieu, trangThaiAn, trangThaiTin) {
  if (status === "ngung_hoat_dong") return "qua_han";
  if (status === "tam_khoa") return "sap_het_han";
  return "dang_lam"; // Default active
}

export function getDisplayTitle(item, moduleId) {
  const m = { 
    collaborators: "nickname"
  };
  return item[m[moduleId]] || item.ma_so || "—";
}

export function formatVNdate(dateStr) {
  if (!dateStr) return "—";
  // Nếu dateStr có dạng YYYY-MM-DD
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  // Thử chuyển đổi bằng new Date nếu là định dạng hợp lệ khác
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export function getShortName(fullName) {
  if (!fullName) return "—";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  return parts.slice(-2).join(" ");
}

export function StatusBadge({ deadline, statusOverride, thoiHieu, trangThaiAn }) {
  const key = getStatus(deadline, statusOverride, thoiHieu, trangThaiAn);
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.dang_lam;
  return (
    <span style={{ 
      background: cfg.bg, 
      color: cfg.color, 
      padding: "2px 10px", 
      borderRadius: 20, 
      fontSize: 12, 
      fontWeight: 600, 
      display: "inline-flex", 
      alignItems: "center", 
      gap: 5,
      whiteSpace: "nowrap"
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.trung_binh;
  return (
    <span style={{ color: p.color, fontWeight: 700, fontSize: 12 }}>
      {p.label}
    </span>
  );
}

export function RankBadge({ capBac, size = 32 }) {
  const CB_MAP = {
    "Đại tướng": "dai_tuong",
    "Thượng tướng": "thuong_tuong",
    "Trung tướng": "trung_tuong",
    "Thiếu tướng": "thieu_tuong",
    "Đại tá": "dai_ta",
    "Thượng tá": "thuong_ta",
    "Trung tá": "trung_ta",
    "Thiếu tá": "thieu_ta",
    "Đại úy": "dai_uy",
    "Thượng úy": "thuong_uy",
    "Trung úy": "trung_uy",
    "Thiếu úy": "thieu_uy"
  };
  const key = CB_MAP[capBac];
  const src = key && QUAN_HAM_BADGES[key];
  if (!src) return <span style={{ fontSize: size * 0.4, color: "#94A3B8" }}>★</span>;
  const imgH = Math.round(size * 1.4);
  return (
    <img
      src={src}
      title={capBac}
      style={{ width: size, height: imgH, objectFit: "contain", display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
      alt={capBac}
    />
  );
}

export function CapBacSelect({ value, onChange, style }) {
  const capBacList = [
    "Đại tướng", "Thượng tướng", "Trung tướng", "Thiếu tướng",
    "Đại tá", "Thượng tá", "Trung tá", "Thiếu tá",
    "Đại úy", "Thượng úy", "Trung úy", "Thiếu úy"
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <select value={value} onChange={onChange} style={{ ...style, flex: 1 }}>
        <option value="">-- Chọn cấp bậc --</option>
        {capBacList.map(cb => (
          <option key={cb} value={cb}>{cb}</option>
        ))}
      </select>
      {value && <RankBadge capBac={value} size={36} />}
    </div>
  );
}

export function Modal({ title, onClose, wide, children }) {
  const isMob = typeof window !== 'undefined' && window.innerWidth < 640;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: isMob ? 8 : 16, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: isMob ? 12 : 16, width: "100%", maxWidth: wide ? 860 : 700, maxHeight: "92vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: isMob ? "14px 16px" : "18px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          {title ? <h3 style={{ margin: 0, fontSize: isMob ? 15 : 17, fontWeight: 700, color: "#1E293B", flex: 1, paddingRight: 8 }}>{title}</h3> : <span />}
          <button onClick={onClose} style={{ border: "none", background: "#F3F4F6", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0 }}>
            ×
          </button>
        </div>
        <div style={{ padding: isMob ? 14 : 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export function UserAvatar({ user, size = 40 }) {
  if (!user) return null;
  if (user.avatar_img) {
    return (
      <img 
        src={user.avatar_img} 
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} 
        alt={user.name} 
      />
    );
  }
  const rC = { 
    admin: "linear-gradient(135deg,#3B82F6,#1D4ED8)", 
    mod: "linear-gradient(135deg,#F59E0B,#D97706)", 
    officer: "linear-gradient(135deg,#22C55E,#15803D)", 
    viewer: "linear-gradient(135deg,#6B7280,#374151)" 
  };
  return (
    <div style={{ 
      width: size, 
      height: size, 
      background: rC[user.role] || rC.viewer, 
      borderRadius: "50%", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      color: "#fff", 
      fontWeight: 900, 
      fontSize: size * 0.32, 
      flexShrink: 0 
    }}>
      {getInitials(user.name)}
    </div>
  );
}

export function DonutChart({ data, size = 180 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2, cy = size / 2, R = size * 0.44, r = size * 0.28;
  let cum = 0;
  
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#E5E7EB" strokeWidth={R - r} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#9CA3AF">0 hồ sơ</text>
      </svg>
    );
  }

  const slices = data.filter((d) => d.value > 0).map((d) => {
    const a1 = cum / total * 2 * Math.PI - Math.PI / 2;
    const cum2 = cum + d.value;
    const a2 = cum2 / total * 2 * Math.PI - Math.PI / 2;
    cum = cum2;
    const lg = d.value / total > 0.5 ? 1 : 0;
    return { 
      ...d, 
      path: `M${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} A${R},${R} 0 ${lg},1 ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)} L${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} A${r},${r} 0 ${lg},0 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z` 
    };
  });

  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2" />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1E293B">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748B" letterSpacing="0.5">TỔNG HỒ SƠ</text>
    </svg>
  );
}

export function BarChart({ data, height = 140 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = data.length * 52;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const bh = Math.max(d.value / max * (height - 36), d.value > 0 ? 6 : 0);
        const x = i * 52 + 8;
        const y = height - bh - 20;
        const w = 36;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={bh} fill={d.color} rx="5" opacity="0.85" />
            <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="700">{d.value}</text>
            <text x={x + w / 2} y={height - 4} textAnchor="middle" fontSize="8" fill="#6B7280" fontWeight="600">{d.short}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const HANH_VI_LIST = [
  "Trộm cắp tài sản",
  "Cướp tài sản",
  "Cướp giật tài sản",
  "Lừa đảo chiếm đoạt",
  "Lạm dụng tín nhiệm chiếm đoạt",
  "Cho vay lãi nặng",
  "Cố ý gây thương tích",
  "Gây rối trật tự",
  "Ma tuý",
  "Đánh bạc",
  "Tham nhũng",
  "Huỷ hoại tài sản",
  "Khác"
];

export function HanhViBadge({ hanh_vi }) {
  const map = {
    "Trộm cắp tài sản": ["#2563EB", "#EFF6FF"],
    "Cướp tài sản": ["#DC2626", "#FEF2F2"],
    "Cướp giật tài sản": ["#B91C1C", "#FEF2F2"],
    "Lừa đảo chiếm đoạt": ["#D97706", "#FFFBEB"],
    "Lạm dụng tín nhiệm chiếm đoạt": ["#92400E", "#FEF3C7"],
    "Cho vay lãi nặng": ["#0891B2", "#ECFEFF"],
    "Cố ý gây thương tích": ["#EF4444", "#FEF2F2"],
    "Gây rối trật tự": ["#F59E0B", "#FFFBEB"],
    "Ma tuý": ["#1D4ED8", "#EFF6FF"],
    "Đánh bạc": ["#7C3AED", "#F5F3FF"],
    "Tham nhũng": ["#065F46", "#ECFDF5"],
    "Huỷ hoại tài sản": ["#6B21A8", "#F5F3FF"]
  };
  const [c, bg] = map[hanh_vi] || ["#6B7280", "#F9FAFB"];
  return (
    <span style={{ background: bg, color: c, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
      {hanh_vi || "—"}
    </span>
  );
}

export function PriorityBadge2({ priority }) {
  if (priority === "cao") return <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>🔴 Cao</span>;
  if (priority === "trung_binh") return <span style={{ background: "#FFFBEB", color: "#D97706", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>🟡 TB</span>;
  return <span style={{ background: "#F0FDF4", color: "#15803D", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>🟢 Thấp</span>;
}

export function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

export function exportToPrint({ title, subTitle, columns, rows, currentUser, landscape }) {
  const now = new Date();
  const todayStr = now.toLocaleDateString("vi-VN");
  const userName = currentUser?.name || "Cán bộ";

  let html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: ${landscape ? "A4 landscape" : "A4 portrait"};
            margin: 2cm 2cm 2cm 3cm;
          }
          body {
            font-family: "Times New Roman", Times, serif, Arial, sans-serif;
            margin: 0;
            font-size: 13px;
            color: #000;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
            font-size: 12px;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
          .text-center {
            text-align: center;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .header-top-left {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
          }
          .header-top-right {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            margin-top: 10px;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 13px;
            font-style: italic;
            text-align: center;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
          }
          .footer-sign {
            text-align: center;
            width: 250px;
          }
          .footer-sign-title {
            font-weight: bold;
            margin-bottom: 60px;
          }
        </style>
      </head>
      <body>
        <div class="header-top">
          <div class="header-top-left">
            CÔNG AN THÀNH PHỐ HUẾ<br>
            PHÒNG PC02
          </div>
          <div class="header-top-right">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
            Độc lập - Tự do - Hạnh phúc<br>
            <span style="font-weight: normal; font-style: italic;">TP Huế, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}</span>
          </div>
        </div>

        <div class="title">${title}</div>
        ${subTitle ? `<div class="subtitle">${subTitle}</div>` : ""}

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">STT</th>
              ${columns.map(col => `<th style="text-align: center;">${col}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ""}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <div>Người lập biểu: <b>${userName}</b></div>
            <div style="margin-top: 2px;">Ngày lập: ${todayStr}</div>
          </div>
          <div class="footer-sign">
            <div class="footer-sign-title">CHỈ HUY ĐƠN VỊ</div>
            <div style="font-weight: normal; font-style: italic; font-size: 11px;">(Ký, ghi rõ họ tên và đóng dấu)</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=950,height=750");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

export function exportToWord({ title, subTitle, columns, rows, currentUser, filename, landscape }) {
  const now = new Date();
  const todayStr = now.toLocaleDateString("vi-VN");
  const userName = currentUser?.name || "Cán bộ";

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: ${landscape ? "A4 landscape" : "A4 portrait"};
            margin: 2cm 2cm 2cm 3cm;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000000;
            padding: 6px;
            text-align: left;
            vertical-align: top;
            font-size: 10.5pt;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
          .text-center {
            text-align: center;
          }
          .title {
            font-size: 15pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 11pt;
            font-style: italic;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <table border="0" style="width:100%; border:none; margin-bottom: 20px;">
          <tr style="border:none;">
            <td style="width:40%; border:none; text-align:center; font-weight:bold; font-family:'Times New Roman'; font-size:11pt;">
              CÔNG AN THÀNH PHỐ HUẾ<br>
              PHÒNG PC02
            </td>
            <td style="width:60%; border:none; text-align:center; font-weight:bold; font-family:'Times New Roman'; font-size:11pt;">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
              Độc lập - Tự do - Hạnh phúc<br>
              <span style="font-weight:normal; font-style:italic; font-size:11pt;">TP Huế, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}</span>
            </td>
          </tr>
        </table>

        <div class="title">${title}</div>
        ${subTitle ? `<div class="subtitle">${subTitle}</div>` : ""}
        <br/>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">STT</th>
              ${columns.map(col => `<th style="text-align: center;">${col}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ""}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        <br/>

        <table border="0" style="width:100%; border:none; margin-top: 20px;">
          <tr style="border:none;">
            <td style="width:50%; border:none; font-family:'Times New Roman'; font-size:11pt;">
              Người lập biểu: <b>${userName}</b><br/>
              Ngày lập: ${todayStr}
            </td>
            <td style="width:50%; border:none; text-align:center; font-weight:bold; font-family:'Times New Roman'; font-size:11pt;">
              CHỈ HUY ĐƠN VỊ<br/><br/><br/><br/>
              <span style="font-weight:normal; font-style:italic; font-size:10pt;">(Ký, đóng dấu)</span>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (filename || "danh_sach") + ".doc";
  a.click();
  URL.revokeObjectURL(url);
}

