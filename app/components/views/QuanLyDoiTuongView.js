"use client";

import React, { useState, useMemo, useEffect, useRef, Component } from 'react';
import { Modal, FormField, exportToPrint, exportToWord, compressImage, UserAvatar, formatVNdate, getShortName, RankBadge } from '@/app/components/shared';

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
          <h3>⚠️ Lỗi hiển thị mục Quản lý đối tượng</h3>
          <p>Đã xảy ra lỗi khi tải giao diện này. Chi tiết lỗi:</p>
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

const DIEN_QLNV_LIST = ["Có", "Không"];
const NHOM_LIST_DEFAULT = [
  "Nhóm gây rối Hải Triều",
  "Nhóm gây rối Phú Xuân",
  "Nhóm gây rối Vỹ Dạ",
  "Nhóm gây rối An Cựu",
  "Nhóm cho vay lãi nặng",
  "Nhóm buôn bán ma tuý",
  "Khác"
];
const NOI_O_LIST = [
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
  "Xã Hương Long",
  "Xã Hương Hồ",
  "Phường Phú Bình",
  "Phường Phú Hiệp",
  "Phường Phú Cát",
  "Phường Phú Hậu",
  "Khác"
];

const inputSt = { width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };
const selectSt = { ...inputSt, background: "#fff" };
const textareaSt = { ...inputSt, resize: "vertical", minHeight: 80 };

function TienATSBadge({ tien_an, tien_su }) {
  const ta = parseInt(String(tien_an || "0").replace(/[^0-9]/g, "")) || 0;
  const ts = parseInt(String(tien_su || "0").replace(/[^0-9]/g, "")) || 0;
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "nowrap" }}>
      {ta > 0 && <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "2px 7px", borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{ta} TA</span>}
      {ts > 0 && <span style={{ background: "#FEF3C7", color: "#B45309", padding: "2px 7px", borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{ts} TS</span>}
      {ta === 0 && ts === 0 && <span style={{ background: "#F0FDF4", color: "#15803D", padding: "2px 7px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Chưa có</span>}
    </div>
  );
}

function getNhomColors(nhom) {
  if (!nhom) return ["#6B7280", "#F3F4F6"];
  
  const name = nhom.trim().toLowerCase();
  if (name.includes("hải triều")) return ["#DC2626", "#FEF2F2"]; // Red
  if (name.includes("phú xuân")) return ["#D97706", "#FFFBEB"]; // Orange
  if (name.includes("vỹ dạ")) return ["#7C3AED", "#F5F3FF"]; // Purple
  if (name.includes("an cựu")) return ["#0891B2", "#ECFEFF"]; // Cyan
  if (name.includes("cho vay") || name.includes("lãi nặng")) return ["#065F46", "#ECFDF5"]; // Green
  if (name.includes("ma tuý") || name.includes("ma túy")) return ["#1D4ED8", "#EFF6FF"]; // Blue
  if (name.includes("trộm") || name.includes("cướp")) return ["#E11D48", "#FFF1F2"]; // Rose
  if (name.includes("đánh bạc") || name.includes("bạc")) return ["#4F46E5", "#EEF2FF"]; // Indigo
  if (name.includes("khác")) return ["#475569", "#F1F5F9"]; // Slate/Gray

  // Remove common phrases so they don't dominate the hash calculation
  const cleanName = name.replace(/^(nhóm\s+gây\s+rối\s+|nhóm\s+)/g, "");

  // Use djb2 hash function for better string value distribution
  let hash = 5381;
  for (let i = 0; i < cleanName.length; i++) {
    hash = ((hash << 5) + hash) + cleanName.charCodeAt(i);
  }
  
  // Calculate distinct HSL hue
  const hue = Math.abs(hash) % 360;
  return [`hsl(${hue}, 80%, 28%)`, `hsl(${hue}, 90%, 96%)`];
}

function printSingleSubject(item, currentUser) {
  const now = new Date();
  const userName = currentUser?.name || "Cán bộ";

  let html = `
    <html>
      <head>
        <title>Lý lịch đối tượng - ${item.ho_ten}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 2cm 2cm 2cm 3cm;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            margin: 0;
            font-size: 13px;
            color: #000;
            line-height: 1.45;
          }
          .header-table {
            width: 100%;
            border: none;
            margin-bottom: 12px;
          }
          .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
          }
          .title {
            text-align: center;
            font-size: 17px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 10px;
            margin-bottom: 14px;
            letter-spacing: 0.5px;
          }
          .profile-container {
            display: table;
            width: 100%;
            margin-top: 8px;
          }
          .profile-left {
            display: table-cell;
            width: 130px;
            vertical-align: top;
            padding-right: 15px;
            text-align: center;
          }
          .profile-right {
            display: table-cell;
            vertical-align: top;
          }
          .avatar-box {
            width: 120px;
            height: 160px;
            border: 1px solid #000;
            margin: 0 auto 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #fcfcfc;
          }
          .avatar-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table td {
            border: none;
            padding: 3px 0;
            font-size: 13px;
            vertical-align: top;
          }
          .info-label {
            font-weight: bold;
            width: 135px;
          }
          .section-title {
            font-weight: bold;
            font-size: 13.5px;
            border-bottom: 1.5px solid #000;
            padding-bottom: 2px;
            margin-top: 12px;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .tats-box {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 12px;
            white-space: pre-wrap;
            background: #fff;
            margin-top: 4px;
          }
          .footer-table {
            width: 100%;
            border: none;
            margin-top: 25px;
          }
          .footer-table td {
            border: none;
            padding: 0;
            text-align: center;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 40%; text-align: center; font-weight: bold; font-size: 11px;">
              CÔNG AN THÀNH PHỐ HUẾ<br>
              PHÒNG PC02
            </td>
            <td style="width: 60%; text-align: center; font-weight: bold; font-size: 11px;">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
              Độc lập - Tự do - Hạnh phúc<br>
              <span style="font-weight: normal; font-style: italic;">TP Huế, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}</span>
            </td>
          </tr>
        </table>

        <div class="title">BẢN LÝ LỊCH ĐỐI TƯỢNG NGHIỆP VỤ (QLNV)</div>

        <div class="profile-container">
          <div class="profile-left">
            <div class="avatar-box">
              ${item.anh_url ? `<img src="${item.anh_url}" alt="Chân dung" />` : '<span style="font-size: 40px; color: #aaa;">👤</span>'}
            </div>
            <div style="font-weight: bold; font-size: 13.5px; margin-top: 5px;">${item.ho_ten}</div>
            <div style="font-size: 11px; margin-top: 2px;">Mã số: ${item.ma_so}</div>
          </div>
          
          <div class="profile-right">
            <table class="info-table">
              <tr>
                <td class="info-label">Họ và tên:</td>
                <td><b>${item.ho_ten}</b></td>
              </tr>
              <tr>
                <td class="info-label">Ngày sinh:</td>
                <td>${item.ngay_sinh ? new Date(item.ngay_sinh).toLocaleDateString("vi-VN") : "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Giới tính:</td>
                <td>${item.gioi_tinh || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Số CCCD/CMND:</td>
                <td>${item.cccd || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Số điện thoại:</td>
                <td>${item.dien_thoai || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Nơi ở thường trú:</td>
                <td>${item.noi_o || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Họ tên cha/mẹ:</td>
                <td>${item.ho_ten_cha ? item.ho_ten_cha + ' (Cha)' : '—'} / ${item.ho_ten_me ? item.ho_ten_me + ' (Mẹ)' : '—'}</td>
              </tr>
              <tr>
                <td class="info-label">Nghề nghiệp:</td>
                <td>${item.nghe_nghiep || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">FB/Zalo/MXH:</td>
                <td>${item.facebook || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Diện QLNV / Hệ:</td>
                <td>${item.dien_qlnv || "Không"} / ${item.he || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Nhóm quản lý:</td>
                <td>${item.nhom || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Cán bộ quản lý:</td>
                <td>${item.can_bo_phu_trach || "—"}</td>
              </tr>
              <tr>
                <td class="info-label">Người nhập hồ sơ:</td>
                <td>${item.nguoi_nhap || "—"}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section-title">Phương tiện sử dụng</div>
        <table class="info-table">
          <tr>
            <td class="info-label" style="width: 130px;">Mô tả phương tiện:</td>
            <td>${item.phuong_tien || "—"}</td>
          </tr>
          ${item.anh_xe_url ? `
          <tr>
            <td class="info-label">Ảnh phương tiện:</td>
            <td>
              <img src="${item.anh_xe_url}" style="max-height: 90px; border: 1px solid #000; margin-top: 3px;" alt="Ảnh xe" />
            </td>
          </tr>` : ""}
        </table>

        <div class="section-title">Hồ sơ Tiền án / Tiền sự</div>
        <table class="info-table" style="margin-bottom: 2px;">
          <tr>
            <td class="info-label" style="width: 130px;">Tiền án / Tiền sự:</td>
            <td><b>${item.tien_an || "0 TA"}</b> TA | <b>${item.tien_su || "0 TS"}</b> TS</td>
          </tr>
        </table>
        ${item.chi_tiet_tats ? `
        <div class="tats-box">
          <b>Chi tiết TATS:</b> ${item.chi_tiet_tats}
        </div>
        ` : ""}

        ${item.ghi_chu ? `
        <div style="font-size: 11px; margin-top: 6px; font-style: italic;"><b>Ghi chú nghiệp vụ:</b> ${item.ghi_chu}</div>
        ` : ""}

        <table class="footer-table">
          <tr>
            <td style="width: 50%; font-family: 'Times New Roman'; font-size: 12px;">
              Cán bộ quản lý hồ sơ<br/><br/><br/><br/>
              <b>${item.can_bo_phu_trach || userName}</b>
            </td>
            <td style="width: 50%; font-weight: bold; font-family: 'Times New Roman'; font-size: 12px;">
              CHỈ HUY ĐƠN VỊ<br/><br/><br/><br/>
              <span style="font-weight: normal; font-style: italic; font-size: 11px;">(Ký, đóng dấu)</span>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=850,height=750");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

function wordSingleSubject(item, currentUser) {
  const now = new Date();
  const userName = currentUser?.name || "Cán bộ";

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Ly lich doi tuong - ${item.ho_ten}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 2cm 2cm 2cm 3cm;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.45;
          }
          .title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 10px;
            margin-bottom: 12px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table td {
            border: none;
            padding: 3px 0;
            font-size: 11.5pt;
            vertical-align: top;
          }
          .info-label {
            font-weight: bold;
            width: 135px;
          }
          .section-title {
            font-weight: bold;
            font-size: 12pt;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 1px;
            margin-top: 12px;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .tats-box {
            border: 1px solid #000000;
            padding: 6px;
            font-size: 11pt;
            background: #ffffff;
            margin-top: 3px;
          }
        </style>
      </head>
      <body>
        <table border="0" style="width:100%; border:none; margin-bottom: 12px;">
          <tr style="border:none;">
            <td style="width:40%; border:none; text-align:center; font-weight:bold; font-family:'Times New Roman'; font-size:10pt;">
              CÔNG AN THÀNH PHỐ HUẾ<br>
              PHÒNG PC02
            </td>
            <td style="width:60%; border:none; text-align:center; font-weight:bold; font-family:'Times New Roman'; font-size:10pt;">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
              Độc lập - Tự do - Hạnh phúc<br>
              <span style="font-weight:normal; font-style:italic; font-size:10pt;">TP Huế, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}</span>
            </td>
          </tr>
        </table>

        <div class="title">BẢN LÝ LỊCH ĐỐI TƯỢNG NGHIỆP VỤ (QLNV)</div>

        <table border="0" style="width:100%; border:none;">
          <tr style="border:none;">
            <td style="width:140px; border:none; text-align:center; vertical-align:top; padding-right:12px;">
              <table border="1" style="width:120px; height:160px; border-collapse:collapse; margin-bottom:4px;">
                <tr>
                  <td style="text-align:center; vertical-align:middle; padding:2px;">
                    ${item.anh_url ? `<img src="${item.anh_url}" width="115" height="150" style="object-fit:cover;" alt="Chân dung" />` : '<span style="font-size:24pt; color:#aaa;">👤</span>'}
                  </td>
                </tr>
              </table>
              <div style="font-weight:bold; font-size:11pt; margin-top:3px;">${item.ho_ten}</div>
              <div style="font-size:9.5pt; color:#555;">Mã số: ${item.ma_so}</div>
            </td>
            <td style="border:none; vertical-align:top;">
              <table class="info-table">
                <tr>
                  <td class="info-label" style="width:125px;">Họ và tên:</td>
                  <td><b>${item.ho_ten}</b></td>
                </tr>
                <tr>
                  <td class="info-label">Ngày sinh:</td>
                  <td>${item.ngay_sinh ? new Date(item.ngay_sinh).toLocaleDateString("vi-VN") : "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Giới tính:</td>
                  <td>${item.gioi_tinh || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Số CCCD/CMND:</td>
                  <td>${item.cccd || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Số điện thoại:</td>
                  <td>${item.dien_thoai || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Nơi ở thường trú:</td>
                  <td>${item.noi_o || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Họ tên cha/mẹ:</td>
                  <td>${item.ho_ten_cha ? item.ho_ten_cha + ' (Cha)' : '—'} / ${item.ho_ten_me ? item.ho_ten_me + ' (Mẹ)' : '—'}</td>
                </tr>
                <tr>
                  <td class="info-label">Nghề nghiệp:</td>
                  <td>${item.nghe_nghiep || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Diện QLNV / Hệ:</td>
                  <td>${item.dien_qlnv || "Không"} / ${item.he || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Nhóm quản lý:</td>
                  <td>${item.nhom || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Cán bộ quản lý:</td>
                  <td>${item.can_bo_phu_trach || "—"}</td>
                </tr>
                <tr>
                  <td class="info-label">Người nhập hồ sơ:</td>
                  <td>${item.nguoi_nhap || "—"}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="section-title">Phương tiện sử dụng</div>
        <table class="info-table">
          <tr>
            <td class="info-label" style="width:125px;">Mô tả phương tiện:</td>
            <td>${item.phuong_tien || "—"}</td>
          </tr>
          ${item.anh_xe_url ? `
          <tr>
            <td class="info-label">Ảnh phương tiện:</td>
            <td>
              <img src="${item.anh_xe_url}" width="120" height="85" style="object-fit:cover;" alt="Ảnh xe" />
            </td>
          </tr>` : ""}
        </table>

        <div class="section-title">Hồ sơ Tiền án / Tiền sự</div>
        <table class="info-table">
          <tr>
            <td class="info-label" style="width:125px;">Tiền án / Tiền sự:</td>
            <td><b>${item.tien_an || "0 TA"}</b> TA | <b>${item.tien_su || "0 TS"}</b> TS</td>
          </tr>
        </table>
        ${item.chi_tiet_tats ? `
        <div class="tats-box">
          <b>Chi tiết TATS:</b> ${item.chi_tiet_tats}
        </div>
        ` : ""}

        ${item.ghi_chu ? `
        <div style="font-size: 10pt; font-family:'Times New Roman'; font-style: italic; margin-top: 4px;"><b>Ghi chú nghiệp vụ:</b> ${item.ghi_chu}</div>
        ` : ""}

        <table border="0" style="width:100%; border:none; margin-top: 20px;">
          <tr style="border:none;">
            <td style="width:50%; border:none; text-align:center; font-family:'Times New Roman'; font-size:10.5pt;">
              Cán bộ quản lý hồ sơ<br/><br/><br/><br/>
              <b>${item.can_bo_phu_trach || userName}</b>
            </td>
            <td style="width:50%; border:none; text-align:center; font-weight:bold; font-family:'Times New Roman'; font-size:10.5pt;">
              CHỈ HUY ĐƠN VỊ<br/><br/><br/><br/>
              <span style="font-weight:normal; font-style:italic; font-size:9.5pt;">(Ký, đóng dấu)</span>
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
  a.download = "ly_lich_" + (item.ho_ten || "doi_tuong").replace(/\s+/g, "_") + ".doc";
  a.click();
  URL.revokeObjectURL(url);
}

function NhomBadge({ nhom, onClick }) {
  const [c, bg] = getNhomColors(nhom);
  return (
    <span 
      onClick={onClick}
      style={{ 
        background: bg, 
        color: c, 
        padding: "4px 8px", 
        borderRadius: 12, 
        fontSize: 10, 
        fontWeight: 700, 
        whiteSpace: "normal", 
        display: "-webkit-box", 
        WebkitLineClamp: 2, 
        WebkitBoxOrient: "vertical", 
        maxWidth: 160, 
        overflow: "hidden", 
        textOverflow: "ellipsis",
        cursor: onClick ? "pointer" : "default",
        lineHeight: 1.3,
        wordBreak: "break-word"
      }}
    >
      {nhom || "—"}
    </span>
  );
}

export default function QuanLyDoiTuongView(props) {
  return (
    <ErrorBoundary>
      <QuanLyDoiTuongViewInner {...props} />
    </ErrorBoundary>
  );
}

function QuanLyDoiTuongViewInner({ data, onDataChange, currentUser, addLog, users, isMobile }) {
  const items = useMemo(() => (data["quan_ly_doi_tuong"] || []).filter(i => i && typeof i === 'object'), [data["quan_ly_doi_tuong"]]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE = pageSize;
  const [search, setSearch] = useState("");
  const [filterDien, setFilterDien] = useState("all");
  const [filterNhom, setFilterNhom] = useState("all");
  const [filterNoiO, setFilterNoiO] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [filterTATS, setFilterTATS] = useState("all");
  const [sortBy, setSortBy] = useState("moi_nhat");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dtPopup, setDtPopup] = useState(null);
  const [tatsPopup, setTatsPopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showVehicleOnly, setShowVehicleOnly] = useState(false);
  const [vehiclePopup, setVehiclePopup] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [zoomImg, setZoomImg] = useState(null);

  const groupsStatsList = useMemo(() => {
    const distinctGroups = Array.from(new Set(items.map(i => i.nhom).filter(Boolean)));
    return distinctGroups.map((nhomName) => {
      const members = items.filter(i => i.nhom === nhomName);
      let totalTA = 0;
      let totalTS = 0;
      members.forEach(m => {
        totalTA += parseInt(String(m.tien_an || "0").replace(/[^0-9]/g, "")) || 0;
        totalTS += parseInt(String(m.tien_su || "0").replace(/[^0-9]/g, "")) || 0;
      });
      return {
        name: nhomName,
        memberCount: members.length,
        violations: `${totalTA} Tiền án, ${totalTS} Tiền sự`
      };
    });
  }, [items]);

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const isOfficer = currentUser.role === "officer";
  const canAddNew = isAdmin || isOfficer;
  const canEdit = (item) => isAdmin || (isOfficer && item.nguoi_nhap === currentUser.name);
  const canDelete = (item) => currentUser.role === "admin";
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);

  const total = items.length;
  const co_qlnv = items.filter((i) => i.dien_qlnv === "Có").length;
  const khong_qlnv = items.filter((i) => i.dien_qlnv === "Không").length;
  const co_xe = items.filter((i) => i.phuong_tien && i.phuong_tien.trim() !== "").length;
  const nhomSet = new Set(items.map((i) => i.nhom).filter(Boolean));
  const total_nhom = nhomSet.size;
  const nhomList = [...nhomSet];

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) {
      list = list.filter((i) =>
        Object.values(i).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (showVehicleOnly) list = list.filter((i) => i.phuong_tien && i.phuong_tien.trim() !== "");
    if (filterDien !== "all") list = list.filter((i) => i.dien_qlnv === filterDien);
    if (filterNhom !== "all") list = list.filter((i) => i.nhom === filterNhom);
    if (filterNoiO !== "all") list = list.filter((i) => i.noi_o && i.noi_o.includes(filterNoiO));
    if (filterCanBo !== "all") list = list.filter((i) => i.can_bo_phu_trach && i.can_bo_phu_trach.includes(filterCanBo));
    if (filterTATS === "co_ta") list = list.filter((i) => parseInt(String(i.tien_an || "0").replace(/\D/g, "")) > 0);
    if (filterTATS === "co_ts") list = list.filter((i) => parseInt(String(i.tien_su || "0").replace(/\D/g, "")) > 0);
    if (filterTATS === "khong") list = list.filter((i) => parseInt(String(i.tien_an || "0").replace(/\D/g, "")) === 0 && parseInt(String(i.tien_su || "0").replace(/\D/g, "")) === 0);

    if (sortBy === "moi_nhat") {
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    if (sortBy === "ten") {
      const getFirstName = (name) => {
        if (!name) return "";
        const parts = name.trim().split(/\s+/);
        return parts[parts.length - 1] || "";
      };
      list.sort((a, b) => getFirstName(a.ho_ten || "").localeCompare(getFirstName(b.ho_ten || ""), 'vi', { sensitivity: 'base' }));
    }
    if (sortBy === "ngay_sinh") list.sort((a, b) => new Date(a.ngay_sinh || 0) - new Date(b.ngay_sinh || 0));
    if (sortBy === "nhom") list.sort((a, b) => (a.nhom || "").localeCompare(b.nhom || "", 'vi', { sensitivity: 'base' }));
    if (sortBy === "noi_o") list.sort((a, b) => (a.noi_o || "").localeCompare(b.noi_o || "", 'vi', { sensitivity: 'base' }));
    if (sortBy === "ma_so") list.sort((a, b) => (a.ma_so || "").localeCompare(b.ma_so || "", 'vi', { sensitivity: 'base' }));
    return list;
  }, [items, search, filterDien, filterNhom, filterNoiO, filterCanBo, filterTATS, sortBy, showVehicleOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [items, search, filterDien, filterNhom, filterNoiO, filterCanBo, filterTATS, sortBy, pageSize, showVehicleOnly]);

  const handleSave = (form) => {
    const cur = data["quan_ly_doi_tuong"] || [];
    const f = { ...form, nguoi_nhap: form.nguoi_nhap || currentUser.name };
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật đối tượng QLNV: ${f.ho_ten}`, "quan_ly_doi_tuong");
    } else {
      const id = Math.max(0, ...cur.map((i) => i.id || 0)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm đối tượng QLNV: ${f.ho_ten}`, "quan_ly_doi_tuong");
    }
    onDataChange("quan_ly_doi_tuong", nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa đối tượng "${item.ho_ten}"?`)) return;
    onDataChange("quan_ly_doi_tuong", (data["quan_ly_doi_tuong"] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa đối tượng QLNV: ${item.ho_ten}`, "quan_ly_doi_tuong");
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return;
    const myItems = items.filter((i) => i.can_bo_phu_trach && i.can_bo_phu_trach.includes(name));
    setCanBoPopup({
      ...u,
      total_dt: myItems.length,
      co_qlnv_cb: myItems.filter((i) => i.dien_qlnv === "Có").length,
      nhom_set: new Set(myItems.map((i) => i.nhom).filter(Boolean)).size
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>👁️ Quản Lý Đối Tượng</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Quản lý đối tượng nghiệp vụ (QLNV) trên địa bàn</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(15,23,42,0.3)", width: isMobile ? "100%" : "auto" }}
          >
            + Thêm đối tượng
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 18 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm họ tên, mã số, CCCD, số điện thoại, Facebook, địa chỉ, nhóm..."
          style={{ width: "100%", padding: "13px 16px 13px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { 
            label: "Tổng số đối tượng", 
            value: total, 
            icon: "👥", 
            color: "#1E293B", 
            bg: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", 
            border: "#E2E8F0",
            onClick: () => {
              setShowVehicleOnly(false);
              setFilterDien("all");
              setFilterNhom("all");
              setFilterNoiO("all");
              setFilterCanBo("all");
              setFilterTATS("all");
              setSearch("");
            }
          },
          { 
            label: "Số đối tượng QLNV", 
            value: co_qlnv, 
            icon: "🛡️", 
            color: "#2563EB", 
            bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", 
            border: "#BFDBFE",
            onClick: () => {
              setShowVehicleOnly(false);
              setFilterDien("Có");
              setFilterNhom("all");
              setFilterNoiO("all");
              setFilterCanBo("all");
              setFilterTATS("all");
              setSearch("");
            }
          },
          { 
            label: "Số đối tượng không QLNV", 
            value: khong_qlnv, 
            icon: "👤", 
            color: "#16A34A", 
            bg: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", 
            border: "#BBF7D0",
            onClick: () => {
              setShowVehicleOnly(false);
              setFilterDien("Không");
              setFilterNhom("all");
              setFilterNoiO("all");
              setFilterCanBo("all");
              setFilterTATS("all");
              setSearch("");
            }
          },
          { 
            label: "Xe đối tượng", 
            value: co_xe, 
            icon: "🏍️", 
            color: "#D97706", 
            bg: "linear-gradient(135deg,#FEF3C7,#FDE68A)", 
            border: "#FCD34D",
            onClick: () => {
              setShowVehicleOnly(true);
              setFilterDien("all");
              setFilterNhom("all");
              setFilterNoiO("all");
              setFilterCanBo("all");
              setFilterTATS("all");
              setSearch("");
            }
          },
          { 
            label: "Tổng số nhóm", 
            value: total_nhom, 
            icon: "🏘️", 
            color: "#7C3AED", 
            bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", 
            border: "#DDD6FE",
            onClick: () => {
              setShowGroupsModal(true);
            }
          }
        ].map((s, i) => (
          <div 
            key={i} 
            onClick={s.onClick}
            style={{ 
              background: s.bg, 
              borderRadius: 14, 
              padding: "16px 18px", 
              border: `1px solid ${s.border}`, 
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
            <div style={{ 
              position: "absolute", 
              right: -8, 
              bottom: -12, 
              fontSize: 72, 
              opacity: 0.08, 
              pointerEvents: "none",
              userSelect: "none"
            }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #E2E8F0", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", flexShrink: 0, width: isMobile ? "100%" : "auto", marginBottom: isMobile ? 4 : 0 }}>Lọc:</span>
        <select value={filterDien} onChange={(e) => setFilterDien(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 150, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả diện QLNV</option>
          <option value="Có">Có QLNV</option>
          <option value="Không">Không QLNV</option>
        </select>
        <select value={filterTATS} onChange={(e) => setFilterTATS(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 160, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả T.Án, T.Sự</option>
          <option value="co_ta">Có tiền án</option>
          <option value="co_ts">Có tiền sự</option>
          <option value="khong">Chưa có T.Á/T.S</option>
        </select>
        <select value={filterNhom} onChange={(e) => setFilterNhom(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả nhóm</option>
          {nhomList.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <select value={filterCanBo} onChange={(e) => setFilterCanBo(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 180, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả cán bộ</option>
          {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 180, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="moi_nhat">⏱️ Thời gian thêm mới</option>
          <option value="ten">🔤 Theo tên</option>
          <option value="ngay_sinh">🎂 Theo năm sinh</option>
          <option value="nhom">🏘️ Theo nhóm</option>
          <option value="noi_o">📍 Theo nơi ở</option>
          <option value="ma_so">🔢 Theo mã số</option>
        </select>
        {(filterDien !== "all" || filterTATS !== "all" || filterNhom !== "all" || filterNoiO !== "all" || filterCanBo !== "all" || search) && (
          <button
            onClick={() => {
              setFilterDien("all");
              setFilterTATS("all");
              setFilterNhom("all");
              setFilterNoiO("all");
              setFilterCanBo("all");
              setSearch("");
            }}
            style={{ padding: "7px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
          >
            ✕ Xóa lọc
          </button>
        )}
        <div style={{ display: "flex", gap: 8, flex: isMobile ? "1 1 100%" : "none", width: isMobile ? "100%" : "auto" }}>
          <button
            onClick={() => {
              const title = "DANH SÁCH ĐỐI TƯỢNG QUẢN LÝ NGHIỆP VỤ (QLNV)";
              const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
              const cols = ["Mã số", "Họ tên", "Ngày sinh", "CCCD", "Điện thoại", "Nơi ở thường trú", "Nhóm", "Tiền án", "Tiền sự", "Hệ", "Cán bộ quản lý"];
              const rows = filtered.map(item => [
                item.ma_so || "—",
                item.ho_ten || "—",
                item.ngay_sinh || "—",
                item.cccd || "—",
                item.dien_thoai || "—",
                item.noi_o || "—",
                item.nhom || "—",
                item.tien_an || "0 TA",
                item.tien_su || "0 TS",
                item.he || "—",
                item.can_bo_phu_trach || "—"
              ]);
              exportToPrint({ title, subTitle, columns: cols, rows, currentUser, landscape: true });
            }}
            style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}
          >
            🖨️ In
          </button>
          <button
            onClick={() => {
              const title = "DANH SÁCH ĐỐI TƯỢNG QUẢN LÝ NGHIỆP VỤ (QLNV)";
              const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
              const cols = ["Mã số", "Họ tên", "Ngày sinh", "CCCD", "Điện thoại", "Nơi ở thường trú", "Nhóm", "Tiền án", "Tiền sự", "Hệ", "Cán bộ quản lý"];
              const rows = filtered.map(item => [
                item.ma_so || "—",
                item.ho_ten || "—",
                item.ngay_sinh || "—",
                item.cccd || "—",
                item.dien_thoai || "—",
                item.noi_o || "—",
                item.nhom || "—",
                item.tien_an || "0 TA",
                item.tien_su || "0 TS",
                item.he || "—",
                item.can_bo_phu_trach || "—"
              ]);
              exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: "danh_sach_doi_tuong_qlnv", landscape: true });
            }}
            style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}
          >
            <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
          </button>
        </div>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 12, color: "#94A3B8", width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{filtered.length}/{total} đối tượng</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr style={{ background: "linear-gradient(135deg,#0F172A,#1E3A5F)" }}>
                {(showVehicleOnly 
                  ? ["#", "Họ tên / Thông tin", "Ngày sinh", "Nơi ở", "Nhóm", "Thông tin xe", "Tiền Án / Tiền Sự", "Hệ", "Thao tác"]
                  : ["#", "Họ tên / Thông tin", "Ngày sinh", "Nơi ở", "Nhóm", "Tiền Án / Tiền Sự", "Hệ", "Phụ trách", "Thao tác"]
                ).map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 56, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>👥</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Không có đối tượng nào</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>Thử thay đổi bộ lọc</div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const rowBg = idx % 2 === 0 ? "#fff" : "#FAFBFC";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F0F4FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ padding: "8px 5px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 26 }}>{idx + 1 + (page - 1) * PAGE_SIZE}</td>
                      <td style={{ padding: "8px 8px", maxWidth: 210, position: "relative" }}>
                        <button
                          onClick={() => setDtPopup(item)}
                          onMouseEnter={() => item.anh_url && setHoveredSubject(item)}
                          onMouseLeave={() => setHoveredSubject(null)}
                          style={{ border: "none", background: "none", color: "#1E293B", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, textAlign: "left", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4, width: "100%" }}
                        >
                          {item.ho_ten || "—"}
                        </button>
                        {hoveredSubject?.id === item.id && item.anh_url && (
                          <div style={{ position: "absolute", left: "100%", marginLeft: 10, top: -20, zIndex: 50, background: "#fff", border: "2px solid #E2E8F0", borderRadius: 8, padding: 4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", pointerEvents: "none" }}>
                            <img src={item.anh_url} style={{ width: 80, height: 100, objectFit: "cover", borderRadius: 6 }} alt="Preview" />
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3, lineHeight: 1.7 }}>
                          {item.dien_thoai && <span style={{ marginRight: 8 }}>📞 {item.dien_thoai}</span>}
                          {item.dien_qlnv === "Có" && <span style={{ background: "#EFF6FF", color: "#2563EB", padding: "1px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>QLNV</span>}
                        </div>
                      </td>
                      <td style={{ padding: "8px 6px", fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
                        {item.ngay_sinh ? (
                          <>
                            <span>{formatVNdate(item.ngay_sinh)}</span>
                            <br />
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>
                              {new Date().getFullYear() - parseInt(item.ngay_sinh.split("-")[0])} tuổi
                            </span>
                          </>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "normal" }}>
                        <div 
                          style={{ 
                            fontSize: 11, 
                            color: "#374151", 
                            maxWidth: 160, 
                            display: "-webkit-box", 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: "vertical", 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.4
                          }} 
                          title={item.noi_o}
                        >
                          {item.noi_o || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "normal" }}>
                        <NhomBadge 
                          nhom={item.nhom} 
                          onClick={item.nhom ? () => {
                            setFilterNhom(item.nhom);
                            setFilterDien("all");
                            setFilterNoiO("all");
                            setFilterCanBo("all");
                            setFilterTATS("all");
                            setSearch("");
                          } : undefined} 
                        />
                      </td>
                      {showVehicleOnly ? (
                        <td style={{ padding: "8px 6px", fontSize: 11, position: "relative" }}>
                          <button
                            onClick={() => setVehiclePopup(item)}
                            onMouseEnter={() => item.anh_xe_url && setHoveredVehicle(item)}
                            onMouseLeave={() => setHoveredVehicle(null)}
                            style={{ border: "none", background: "none", color: "#1E293B", cursor: "pointer", fontSize: 11, fontWeight: 500, padding: 0, display: "flex", alignItems: "center", gap: 6, textAlign: "left" }}
                          >
                            <span>🏍️ {item.phuong_tien || "—"}</span>
                            {item.anh_xe_url && (
                              <span style={{ fontSize: 12 }} title="Xem ảnh xe">📷</span>
                            )}
                          </button>
                          {hoveredVehicle?.id === item.id && item.anh_xe_url && (
                            <div style={{ position: "absolute", left: "100%", marginLeft: 10, top: -20, zIndex: 50, background: "#fff", border: "2px solid #E2E8F0", borderRadius: 8, padding: 4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                              <img src={item.anh_xe_url} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6 }} alt="Vehicle Preview" />
                            </div>
                          )}
                        </td>
                      ) : null}
                      <td style={{ padding: "11px 14px" }}>
                        {(item.tien_an || item.tien_su) ? (
                          <button onClick={() => setTatsPopup(item)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
                            <TienATSBadge tien_an={item.tien_an} tien_su={item.tien_su} />
                          </button>
                        ) : (
                          <TienATSBadge tien_an={item.tien_an} tien_su={item.tien_su} />
                        )}
                      </td>
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        {item.he ? (
                          <span style={{ background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                            {item.he}
                          </span>
                        ) : (
                          <span style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </td>
                      {!showVehicleOnly ? (
                        <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                          {item.can_bo_phu_trach ? (
                            <button
                              onClick={() => handleCanBoClick(item.can_bo_phu_trach)}
                              style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 5 }}
                            >
                              <UserAvatar user={users.find(u => u.name === item.can_bo_phu_trach) || { name: item.can_bo_phu_trach, role: "viewer" }} size={24} />
                              <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortName(item.can_bo_phu_trach)}</span>
                            </button>
                          ) : (
                            <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>
                          )}
                        </td>
                      ) : null}
                      <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
                          <button onClick={() => setDtPopup(item)} style={{ border: "none", background: "#F0F4FF", color: "#1E3A5F", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Xem</button>
                          {canEdit(item) && (
                            <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ border: "none", background: "#FFFBEB", color: "#B45309", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Sửa</button>
                          )}
                          {canDelete(item) && (
                            <button onClick={() => handleDelete(item)} style={{ border: "none", background: "#FFF5F5", color: "#DC2626", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Xóa</button>
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
            Hiển thị <b style={{ color: "#374151" }}>{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</b>–<b style={{ color: "#374151" }}>{Math.min(page * PAGE_SIZE, filtered.length)}</b> / <b>{filtered.length}</b> đối tượng
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "3px 6px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none" }}
              >
                {[10, 15, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>‹</button>
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
                    <button key={p} onClick={() => setPage(p)} style={{ padding: "4px 9px", border: "1px solid " + (isAct ? "#0284C7" : "#E2E8F0"), borderRadius: 6, background: isAct ? "#0284C7" : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontSize: 11, fontWeight: isAct ? 700 : 400, minWidth: 30 }}>{p}</button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>»</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title={editItem ? "✏️ Chỉnh sửa đối tượng" : "➕ Thêm đối tượng QLNV"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <QuanLyDTForm initial={editItem} officerList={officerList} allItems={items} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} currentUser={currentUser} isMobile={isMobile} />
        </Modal>
      )}

      {/* ─── popups details modals ─── */}
      {dtPopup && (
        <Modal title="👤 Chi tiết đối tượng nghiệp vụ" onClose={() => setDtPopup(null)}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 140, height: 180, background: "#F1F5F9", borderRadius: 12, border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", overflow: "hidden", cursor: dtPopup.anh_url ? "zoom-in" : "default" }} onClick={() => dtPopup.anh_url && setZoomImg(dtPopup.anh_url)}>
                {dtPopup.anh_url ? (
                  <img src={dtPopup.anh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                ) : (
                  <span style={{ fontSize: 48, color: "#94A3B8" }}>👤</span>
                )}
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>{dtPopup.ho_ten}</h3>
              <span style={{ background: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, display: "inline-block", marginBottom: 12 }}>
                {dtPopup.ma_so}
              </span>
              <div style={{ marginTop: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "left", fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>🏍️ Phương tiện sử dụng:</div>
                <div style={{ color: "#475569" }}>{dtPopup.phuong_tien || "—"}</div>
                {dtPopup.anh_xe_url && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Ảnh phương tiện:</span>
                    <img src={dtPopup.anh_xe_url} style={{ width: "100%", maxHeight: 110, borderRadius: 8, border: "1px solid #E2E8F0", objectFit: "cover", cursor: "zoom-in" }} onClick={() => setZoomImg(dtPopup.anh_xe_url)} alt="Ảnh xe" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
                <div><strong>Ngày sinh:</strong> {formatVNdate(dtPopup.ngay_sinh)}</div>
                <div><strong>Giới tính:</strong> {dtPopup.gioi_tinh || "—"}</div>
                <div style={{ gridColumn: "1/-1" }}><strong>Thường trú:</strong> {dtPopup.noi_o || "—"}</div>
                <div><strong>CCCD/CMND:</strong> {dtPopup.cccd || "—"}</div>
                <div><strong>Điện thoại:</strong> {dtPopup.dien_thoai || "—"}</div>
                <div><strong>Cha:</strong> {dtPopup.ho_ten_cha || "—"}</div>
                <div><strong>Mẹ:</strong> {dtPopup.ho_ten_me || "—"}</div>
                <div><strong>Nghề nghiệp:</strong> {dtPopup.nghe_nghiep || "—"}</div>
                <div><strong>FB/Zalo:</strong> {(() => {
                   const val = dtPopup.facebook;
                   if (!val) return "—";
                   const trimmed = val.trim();
                   const isLink = trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("facebook.com") || trimmed.includes("zalo.me") || trimmed.includes("fb.com");
                   if (isLink) {
                     let href = trimmed;
                     if (!href.startsWith("http://") && !href.startsWith("https://")) {
                       href = "https://" + href;
                     }
                     return (
                       <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "underline", fontWeight: 600 }}>
                         {trimmed} ↗
                       </a>
                     );
                   }
                   return trimmed;
                 })()}</div>
                <div><strong>Diện QLNV:</strong> {dtPopup.dien_qlnv}</div>
                <div><strong>Hệ:</strong> {dtPopup.he ? <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 6px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{dtPopup.he}</span> : "—"}</div>
                <div><strong>Nhóm quản lý:</strong> <NhomBadge nhom={dtPopup.nhom} /></div>
                <div><strong>Cán bộ quản lý:</strong> {dtPopup.can_bo_phu_trach || "—"}</div>
                {!isMobile && <div></div>}
                <div><strong>Người nhập hồ sơ:</strong> {dtPopup.nguoi_nhap || "—"}</div>
              </div>
              <div style={{ marginTop: 14, borderTop: "1px solid #E2E8F0", paddingTop: 10, fontSize: 13 }}>
                <strong>Tiền án:</strong> {dtPopup.tien_an} | <strong>Tiền sự:</strong> {dtPopup.tien_su}
                {dtPopup.chi_tiet_tats && (
                  <div style={{ background: "#F8FAFC", padding: 10, borderRadius: 8, marginTop: 6, fontSize: 12, color: "#475569", maxHeight: 100, overflowY: "auto" }}>
                    {dtPopup.chi_tiet_tats}
                  </div>
                )}
              </div>
              {dtPopup.ghi_chu && (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  <strong>Ghi chú:</strong>
                  <div style={{ color: "#64748B", marginTop: 4 }}>{dtPopup.ghi_chu}</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid #E2E8F0", flexWrap: "wrap" }}>
            <button 
              onClick={() => printSingleSubject(dtPopup, currentUser)} 
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              🖨️ In lý lịch
            </button>
            <button 
              onClick={() => wordSingleSubject(dtPopup, currentUser)} 
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#10B981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              📝 Xuất file Word
            </button>
            <button 
              onClick={() => setDtPopup(null)} 
              style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}

      {tatsPopup && (
        <Modal title={`⚖️ Hồ sơ TATS: ${tatsPopup.ho_ten}`} onClose={() => setTatsPopup(null)}>
          <div style={{ padding: 6 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                Tiền án: {tatsPopup.tien_an || "0 TA"}
              </span>
              <span style={{ background: "#FEF3C7", color: "#B45309", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                Tiền sự: {tatsPopup.tien_su || "0 TS"}
              </span>
            </div>
            <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>Chi tiết hồ sơ nghiệp vụ tiền án tiền sự:</h4>
            <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.6, color: "#1E293B", minHeight: 120 }}>
              {tatsPopup.chi_tiet_tats || "Chưa có thông tin chi tiết về tiền án/tiền sự của đối tượng này."}
            </div>
          </div>
        </Modal>
      )}
 
      {vehiclePopup && (
        <Modal title={`🏍️ Thông tin phương tiện: ${vehiclePopup.ho_ten}`} onClose={() => setVehiclePopup(null)}>
          <div style={{ padding: "6px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 16 }}>
              {vehiclePopup.phuong_tien || "Chưa có thông tin phương tiện"}
            </div>
            {vehiclePopup.anh_xe_url ? (
              <div style={{ width: "100%", maxHeight: 380, borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
                <img src={vehiclePopup.anh_xe_url} style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain" }} alt="Ảnh xe của đối tượng" />
              </div>
            ) : (
              <div style={{ padding: "48px 24px", background: "#F8FAFC", borderRadius: 12, color: "#94A3B8" }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🏍️</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Đối tượng này chưa có ảnh phương tiện đi kèm</div>
              </div>
            )}
          </div>
        </Modal>
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
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Thống kê quản lý đối tượng</div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1E293B" }}>{canBoPopup.total_dt}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Đối tượng quản lý</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#2563EB" }}>{canBoPopup.co_qlnv_cb}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Diện QLNV</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div style={{ flex: 1, minWidth: 60 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#7C3AED" }}>{canBoPopup.nhom_set}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Nhóm liên quan</div>
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
      {showGroupsModal && (
        <Modal title="🏘️ Danh Sách Thống Kê Các Nhóm Đối Tượng" onClose={() => setShowGroupsModal(false)} wide={true}>
          <div style={{ overflowX: "auto", margin: "-8px -12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748B", fontWeight: 700 }}>STT</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748B", fontWeight: 700 }}>Tên nhóm đối tượng</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: "#64748B", fontWeight: 700 }}>Số thành viên</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748B", fontWeight: 700 }}>Thông tin vi phạm (TA/TS)</th>
                </tr>
              </thead>
              <tbody>
                {groupsStatsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px 12px", textAlign: "center", color: "#94A3B8" }}>
                      Chưa có nhóm đối tượng nào trong cơ sở dữ liệu.
                    </td>
                  </tr>
                ) : (
                  groupsStatsList.map((g, idx) => (
                    <tr 
                      key={idx} 
                      style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px", fontWeight: 600, color: "#94A3B8" }}>{idx + 1}</td>
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => {
                            setFilterNhom(g.name);
                            setFilterDien("all");
                            setFilterNoiO("all");
                            setFilterCanBo("all");
                            setFilterTATS("all");
                            setSearch("");
                            setShowGroupsModal(false);
                          }}
                          style={{
                            border: "none",
                            background: "none",
                            padding: 0,
                            color: getNhomColors(g.name)[0],
                            fontWeight: 700,
                            cursor: "pointer",
                            textAlign: "left",
                            textDecoration: "underline",
                            outline: "none"
                          }}
                        >
                          {g.name}
                        </button>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#1E293B" }}>
                        {g.memberCount} thành viên
                      </td>
                      <td style={{ padding: "12px", color: "#DC2626", fontWeight: 600 }}>
                        {g.violations}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
      {zoomImg && (
        <Modal title="🔍 Xem ảnh phóng to" onClose={() => setZoomImg(null)}>
          <div style={{ textAlign: "center", padding: 10 }}>
            <img src={zoomImg} style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 8, objectFit: "contain" }} alt="Phóng to" />
          </div>
        </Modal>
      )}
    </div>
  );
}

function QuanLyDTForm({ initial, officerList, allItems, onSave, onClose, isMobile, currentUser }) {
  const [form, setForm] = useState(() => {
    const existingNums = (allItems || []).map(i => {
      const m = (i.ma_so || "").match(/DT-\d{4}-(\d+)/);
      return m ? parseInt(m[1]) : 0;
    });
    const year = new Date().getFullYear();
    const next = (Math.max(0, ...existingNums) + 1).toString().padStart(3, "0");
    const autoMaSo = initial?.ma_so || `DT-${year}-${next}`;
    return {
      ma_so: autoMaSo,
      ho_ten: "",
      ngay_sinh: "",
      gioi_tinh: "Nam",
      cccd: "",
      noi_o: "",
      ho_ten_cha: "",
      ho_ten_me: "",
      dien_thoai: "",
      facebook: "",
      nghe_nghiep: "",
      phuong_tien: "",
      dien_qlnv: "Không",
      nhom: "",
      he: "",
      tien_an: "0 TA",
      tien_su: "0 TS",
      chi_tiet_tats: "",
      can_bo_phu_trach: currentUser?.name || "",
      anh_url: "",
      anh_xe_url: "",
      ghi_chu: "",
      ...initial || {}
    };
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const inputRef = useRef();
  const inputXeRef = useRef();

  const uniqueGroups = useMemo(() => {
    const list = (allItems || []).map(i => i.nhom).filter(Boolean);
    return Array.from(new Set([...list, ...NHOM_LIST_DEFAULT]));
  }, [allItems]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const currentInput = (form.nhom || "").trim().toLowerCase();
    if (!currentInput) return uniqueGroups;
    return uniqueGroups.filter(g => g.toLowerCase().includes(currentInput));
  }, [form.nhom, uniqueGroups]);

  const handleAnhDT = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.75);
      set('anh_url', compressed);
    } catch (err) {
      console.error(err);
      alert("Không thể nén ảnh!");
    }
  };

  const handleAnhXe = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.75);
      set('anh_xe_url', compressed);
    } catch (err) {
      console.error(err);
      alert("Không thể nén ảnh xe!");
    }
  };

  return (
    <div>
      <div style={{ background: "#F0F4FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#1E40AF", fontWeight: 600 }}>
        👤 Thông tin cá nhân
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Mã số" required>
          <input value={form.ma_so || ""} readOnly={true} style={{ ...inputSt, background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }} placeholder="VD: DT-2024-005" />
        </FormField>
        <FormField label="Diện QLNV">
          <select value={form.dien_qlnv || "Không"} onChange={(e) => set("dien_qlnv", e.target.value)} style={selectSt}>
            <option value="Có">🔵 Có QLNV</option>
            <option value="Không">Không QLNV</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Họ và tên" required>
            <input value={form.ho_ten || ""} onChange={(e) => set("ho_ten", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Ngày sinh">
          <input type="date" value={form.ngay_sinh || ""} onChange={(e) => set("ngay_sinh", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Giới tính">
          <select value={form.gioi_tinh || "Nam"} onChange={(e) => set("gioi_tinh", e.target.value)} style={selectSt}>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </FormField>
        <FormField label="CCCD/CMND">
          <input value={form.cccd || ""} onChange={(e) => set("cccd", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Số điện thoại">
          <input value={form.dien_thoai || ""} onChange={(e) => set("dien_thoai", e.target.value)} style={inputSt} />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Nơi ở thường trú">
            <input value={form.noi_o || ""} onChange={(e) => set("noi_o", e.target.value)} style={inputSt} placeholder="VD: Phường Thuận Hoà, TP Huế" />
          </FormField>
        </div>
        <FormField label="Họ tên cha">
          <input value={form.ho_ten_cha || ""} onChange={(e) => set("ho_ten_cha", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Họ tên mẹ">
          <input value={form.ho_ten_me || ""} onChange={(e) => set("ho_ten_me", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Facebook / Mạng xã hội">
          <input value={form.facebook || ""} onChange={(e) => set("facebook", e.target.value)} style={inputSt} placeholder="Tên FB hoặc link" />
        </FormField>
        <FormField label="Nghề nghiệp">
          <input value={form.nghe_nghiep || ""} onChange={(e) => set("nghe_nghiep", e.target.value)} style={inputSt} />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Phương tiện sử dụng">
            <input value={form.phuong_tien || ""} onChange={(e) => set("phuong_tien", e.target.value)} style={inputSt} placeholder="VD: Honda Wave 75A-11111, ..." />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ảnh phương tiện sử dụng (Ảnh xe)">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{ width: 100, height: 75, background: "#F1F5F9", borderRadius: 10, border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}
                onClick={() => inputXeRef.current?.click()}
              >
                {form.anh_xe_url ? (
                  <img src={form.anh_xe_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Ảnh xe" />
                ) : (
                  <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 11 }}>
                    <div style={{ fontSize: 24 }}>🏍️</div>
                    <div>Thêm ảnh xe</div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={inputXeRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAnhXe} />
                <button
                  type="button"
                  onClick={() => inputXeRef.current?.click()}
                  style={{ padding: "8px 16px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}
                >
                  📁 Chọn ảnh xe
                </button>
                {form.anh_xe_url && (
                  <button type="button" onClick={() => set('anh_xe_url', '')} style={{ padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕ Xóa ảnh xe</button>
                )}
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Định dạng: JPG, PNG. Ảnh xe rõ biển số, kiểu dáng xe</div>
              </div>
            </div>
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ảnh đối tượng">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{ width: 80, height: 100, background: "#F1F5F9", borderRadius: 10, border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}
                onClick={() => inputRef.current?.click()}
              >
                {form.anh_url ? (
                  <img src={form.anh_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Chân dung" />
                ) : (
                  <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 11 }}>
                    <div style={{ fontSize: 24 }}>👤</div>
                    <div>Thêm ảnh</div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAnhDT} />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  style={{ padding: "8px 16px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}
                >
                  📁 Chọn ảnh chân dung
                </button>
                {form.anh_url && (
                  <button type="button" onClick={() => set('anh_url', '')} style={{ padding: "4px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕ Xóa ảnh</button>
                )}
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Định dạng: JPG, PNG. Ảnh chân dung rõ mặt</div>
              </div>
            </div>
          </FormField>
        </div>
      </div>

      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 14px", margin: "6px 0 12px", fontSize: 12, color: "#C2410C", fontWeight: 600 }}>
        ⚠️ Thông tin nghiệp vụ
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Hệ">
          <input value={form.he || ""} onChange={(e) => set("he", e.target.value)} style={inputSt} placeholder="VD: trộm, cướp, gây rối, đánh bạc..." />
        </FormField>
        <FormField label="Nhóm">
          <div style={{ position: "relative" }}>
            <input 
              value={form.nhom || ""} 
              onChange={(e) => set("nhom", e.target.value)} 
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              style={inputSt} 
              placeholder="Nhập hoặc chọn nhóm" 
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1000,
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                marginTop: 4,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                maxHeight: 200,
                overflowY: "auto"
              }}>
                {filteredSuggestions.map((g, idx) => (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      set("nhom", g);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: 13,
                      borderBottom: "1px solid #F1F5F9",
                      background: "#fff",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#F1F5F9"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}
                  >
                    {g}
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormField>
        <FormField label="Cán bộ phụ trách">
          <select value={form.can_bo_phu_trach || ""} onChange={(e) => set("can_bo_phu_trach", e.target.value)} style={selectSt}>
            <option value="">-- Chọn cán bộ --</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Tiền án (VD: 2 TA)">
          <input value={form.tien_an || ""} onChange={(e) => set("tien_an", e.target.value)} style={inputSt} placeholder="VD: 1 TA" />
        </FormField>
        <FormField label="Tiền sự (VD: 1 TS)">
          <input value={form.tien_su || ""} onChange={(e) => set("tien_su", e.target.value)} style={inputSt} placeholder="VD: 2 TS" />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Chi tiết tiền án tiền sự">
            <textarea value={form.chi_tiet_tats || ""} onChange={(e) => set("chi_tiet_tats", e.target.value)} style={textareaSt} placeholder="Mô tả chi tiết từng tiền án/tiền sự, năm xử lý, hình phạt..." />
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
        <button onClick={() => onSave(form)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#0F172A,#1E3A5F)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}
