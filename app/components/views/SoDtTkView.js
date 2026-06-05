"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  FormField,
  UserAvatar,
  RankBadge,
  exportToPrint,
  exportToWord,
  formatVNdate,
  getShortName,
  StatusBadge,
  HanhViBadge
} from '@/app/components/shared';

function TrangThaiAnBadge({ trang_thai_an }) {
  const TRANG_THAI_AN = {
    hien_hanh: { label: "Đang điều tra", color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
    ket_thuc: { label: "Kết thúc điều tra", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
    tam_dinh_chi: { label: "Tạm đình chỉ", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
    dinh_chi: { label: "Đình chỉ", color: "#7C3AED", bg: "#F5F3FF", dot: "#8B5CF6" }
  };
  const cfg = TRANG_THAI_AN[trang_thai_an] || TRANG_THAI_AN.hien_hanh;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function TrangThaiTinBadge({ trang_thai_tin }) {
  const TRANG_THAI_TIN = {
    dang_giai_quyet: { label: "Đang giải quyết", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
    da_giai_quyet: { label: "Đã giải quyết", color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
    tam_dinh_chi: { label: "Tạm đình chỉ", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" }
  };
  const cfg = TRANG_THAI_TIN[trang_thai_tin] || TRANG_THAI_TIN.dang_giai_quyet;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

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
const textareaSt = { ...inputSt, resize: "vertical", minHeight: 80 };

const NHA_MANG_LIST = ["Viettel", "VinaPhone", "MobiFone", "GMobile", "VietnamMobile", "Itel", "Wintel", "VNSky", "FPTRetail", "Local"];
const NGAN_HANG_LIST = [
  "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam - Agribank",
  "Ngân hàng TMCP Ngoại thương Việt Nam - Vietcombank (VCB)",
  "Ngân hàng TMCP Công thương Việt Nam - VietinBank",
  "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - BIDV",
  "Ngân hàng TMCP Quân đội - MB",
  "Ngân hàng TMCP Kỹ thương Việt Nam - Techcombank (TCB)",
  "Ngân hàng TMCP Việt Nam Thịnh Vượng - VPBank",
  "Ngân hàng TMCP Á Châu - ACB",
  "Ngân hàng TMCP Sài Gòn Thương Tín - Sacombank",
  "Ngân hàng TMCP Phát triển TP. HCM - HDBank",
  "Ngân hàng TMCP Sài Gòn - Hà Nội - SHB",
  "Ngân hàng TMCP Quốc tế Việt Nam - VIB",
  "Ngân hàng TMCP Tiên Phong - TPBank",
  "Ngân hàng TMCP Lộc Phát Việt Nam - LPBank",
  "Ngân hàng TMCP Hàng Hải Việt Nam - MSB",
  "Ngân hàng TMCP Đông Nam Á - SeABank",
  "Ngân hàng TMCP Phương Đông - OCB",
  "Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam - Eximbank",
  "Ngân hàng TMCP An Bình - ABBANK",
  "Ngân hàng TMCP Bắc Á - Bac A Bank",
  "Ngân hàng TMCP Nam Á - Nam A Bank",
  "Ngân hàng TMCP Sài Gòn Công Thương - Saigonbank",
  "Ngân hàng TMCP Việt Nam Thương Tín - Vietbank",
  "Ngân hàng TMCP Việt Á - Viet A Bank",
  "Ngân hàng TMCP Bảo Việt - BaoViet Bank",
  "Ngân hàng TMCP Kiên Long - Kienlongbank",
  "Ngân hàng TMCP Đại Chúng Việt Nam - PVcomBank",
  "Ngân hàng TMCP Bản Việt - BVBank",
  "Ngân hàng TMCP Thịnh vượng và Phát triển - PGBank",
  "Ngân hàng TMCP Quốc Dân - NCB",
  "Ngân hàng TMCP Đông Á - DongA Bank",
  "Ngân hàng TMCP Sài Gòn - SCB",
  "Ngân hàng TMCP Xây dựng Việt Nam - CBBank",
  "Ngân hàng TMCP Đại Dương - OceanBank",
  "Ngân hàng TMCP Dầu khí Toàn cầu - GPBank",
  "Ngân hàng TNHH MTV Shinhan Việt Nam - Shinhan Bank",
  "Ngân hàng TNHH MTV HSBC Việt Nam - HSBC",
  "Ngân hàng TNHH MTV Standard Chartered Việt Nam - Standard Chartered",
  "Ngân hàng TNHH MTV Woori Việt Nam - Woori Bank",
  "Ngân hàng TNHH MTV UOB Việt Nam - UOB",
  "Ngân hàng TNHH MTV Public Việt Nam - Public Bank",
  "Ngân hàng TNHH MTV CIMB Việt Nam - CIMB",
  "Ngân hàng TNHH MTV Hong Leong Việt Nam - Hong Leong Bank",
  "Ngân hàng TNHH MTV Kasikornbank - KBank",
  "Ngân hàng Liên doanh Indovina - IVB",
  "Ngân hàng Liên doanh Việt - Nga - VRB",
  "Ngân hàng Chính sách Xã hội Việt Nam - VBSP",
  "Ngân hàng Phát triển Việt Nam - VDB",
  "Ngân hàng số Timo",
  "Ngân hàng số Cake by VPBank",
  "Ngân hàng số TNEX",
  "Ngân hàng số Lavyon",
  "Ngân hàng số Digimi",
  "Ngân hàng số Ubank",
  "Ngân hàng số Vani",
  "Ví điện tử MoMo",
  "Ví điện tử ZaloPay",
  "Ví điện tử Viettel Money",
  "Ví điện tử VNPT Money",
  "Ví điện tử VNPAY",
  "Ví điện tử ShopeePay",
  "Ví điện tử Payoo",
  "Ví điện tử Moca",
  "Ví điện tử 9Pay",
  "Ví điện tử AppotaPay",
  "Ví điện tử G-Pay",
  "Ví điện tử SmartPay",
  "Ví điện tử Vimo",
  "Ví điện tử VinID Pay",
  "Ví điện tử Ngân Lượng",
  "Ví điện tử Bảo Kim"
];

function XMBadge({ tt }) {
  return tt === "da_xac_minh" ? (
    <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", flexShrink: 0 }} />
      Đã xác minh
    </span>
  ) : (
    <span style={{ background: "#FEF3C7", color: "#B45309", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block", flexShrink: 0 }} />
      Đang xác minh
    </span>
  );
}

function NghiVanBadge({ v }) {
  if (!v) return <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>;
  return (
    <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, display: "inline-block", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {v}
    </span>
  );
}

function NhaMangBadge2({ nm, onClick }) {
  const cfg = {
    "Viettel": ["#DC2626", "#FEF2F2"],
    "VinaPhone": ["#1D4ED8", "#EFF6FF"],
    "MobiFone": ["#0EA5E9", "#F0F9FF"],
    "GMobile": ["#EAB308", "#FEFCE8"],
    "VietnamMobile": ["#F97316", "#FFF7ED"],
    "Itel": ["#BE123C", "#FFF1F2"],
    "Wintel": ["#6B21A8", "#FAF5FF"],
    "VNSky": ["#0369A1", "#F0F9FF"],
    "FPTRetail": ["#B91C1C", "#FEF2F2"],
    "Local": ["#0F766E", "#F0FDFA"]
  };
  const [c, bg] = cfg[nm] || ["#6B7280", "#F9FAFB"];
  return (
    <span 
      onClick={onClick}
      style={{ 
        background: bg, 
        color: c, 
        padding: "2px 8px", 
        borderRadius: 20, 
        fontSize: 10, 
        fontWeight: 700, 
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        userSelect: onClick ? "none" : "auto"
      }}
    >
      {nm || "—"}
    </span>
  );
}

function NganHangBadge2({ nh, onClick }) {
  const cfg = {
    "Vietcombank": ["#16A34A", "VCB"],
    "Techcombank": ["#C2410C", "TCB"],
    "VietinBank": ["#1D4ED8", "CTG"],
    "BIDV": ["#1E40AF", "BID"],
    "Agribank": ["#15803D", "AGB"],
    "MB": ["#7C3AED", "MB"],
    "ACB": ["#B45309", "ACB"],
    "VPBank": ["#DC2626", "VPB"],
    "Sacombank": ["#0891B2", "STB"],
    "TPBank": ["#9333EA", "TPB"],
    "SHB": ["#B91C1C", "SHB"],
    "HDBank": ["#1E40AF", "HDB"],
    "VIB": ["#0369A1", "VIB"],
    "MSB": ["#065F46", "MSB"],
    "OCB": ["#92400E", "OCB"],
    "LPBank": ["#EA580C", "LPB"],
    "SeABank": ["#0F766E", "SEA"],
    "Eximbank": ["#1D4ED8", "EIB"],
    "MoMo": ["#D946EF", "MM"],
    "ZaloPay": ["#2563EB", "ZP"],
    "Viettel Money": ["#DC2626", "VTM"],
    "VNPT Money": ["#0284C7", "VNP"],
    "VNPAY": ["#2563EB", "VNP"]
  };

  const getVietnameseBankAbbr = (fullName) => {
    if (!fullName) return "—";
    const name = fullName.toLowerCase();
    if (name.includes("vietcombank") || name.includes("vcb")) return "Vietcombank";
    if (name.includes("techcombank") || name.includes("tcb")) return "Techcombank";
    if (name.includes("vietinbank")) return "VietinBank";
    if (name.includes("bidv")) return "BIDV";
    if (name.includes("agribank")) return "Agribank";
    if (name.includes("mbbank") || name.includes("milit") || name.includes("quân đội") || name.trim() === "mb") return "MBBank";
    if (name.includes("vpbank")) return "VPBank";
    if (name.includes("acb")) return "ACB";
    if (name.includes("sacombank")) return "Sacombank";
    if (name.includes("hdbank")) return "HDBank";
    if (name.includes("shb")) return "SHB";
    if (name.includes("vib")) return "VIB";
    if (name.includes("msb")) return "MSB";
    if (name.includes("ocb")) return "OCB";
    if (name.includes("lpbank")) return "LPBank";
    if (name.includes("seabank")) return "SeABank";
    if (name.includes("eximbank")) return "Eximbank";
    if (name.includes("momo")) return "MoMo";
    if (name.includes("zalopay")) return "ZaloPay";
    if (name.includes("viettel money")) return "Viettel Money";
    if (name.includes("vnpt money")) return "VNPT Money";
    if (name.includes("vnpay")) return "VNPAY";

    const parenMatch = fullName.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) return parenMatch[1].trim();
    if (fullName.includes(" - ")) {
      const parts = fullName.split(" - ");
      return parts[parts.length - 1].trim();
    }
    return fullName;
  };

  const matchedKey = Object.keys(cfg).find(k => nh?.toLowerCase().includes(k.toLowerCase())) || nh;
  const [color, short] = cfg[matchedKey] || ["#6B7280", nh?.slice(0, 3) || "?"];
  const abbr = getVietnameseBankAbbr(nh);

  return (
    <span 
      onClick={onClick}
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        gap: 6,
        cursor: onClick ? "pointer" : "default",
        userSelect: onClick ? "none" : "auto"
      }}
      title={nh}
    >
      <span style={{ width: 26, height: 26, background: color, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 8, flexShrink: 0 }}>
        {short}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: onClick ? "underline dotted" : "none" }}>
        {abbr}
      </span>
    </span>
  );
}

export default function SoDtTkView({ data, onDataChange, currentUser, addLog, users, setActivePage, setHighlightUser, selectedRecord, clearSelectedRecord, isMobile }) {
  const sdtItems = useMemo(() => {
    const rawList = data["so_dien_thoai"] || [];
    return rawList.map(item => {
      if (item.ghi_chu && item.ghi_chu.includes('===KET_QUA_XM===')) {
        const parts = item.ghi_chu.split('===KET_QUA_XM===');
        return {
          ...item,
          ghi_chu: parts[0].trim(),
          ket_qua_xm: parts[1].trim()
        };
      }
      return { ...item, ket_qua_xm: item.ket_qua_xm || "" };
    });
  }, [data]);
  const stkItems = useMemo(() => {
    const rawList = data["so_tai_khoan"] || [];
    return rawList.map(item => {
      if (item.ghi_chu && item.ghi_chu.includes('===KET_QUA_XM===')) {
        const parts = item.ghi_chu.split('===KET_QUA_XM===');
        return {
          ...item,
          ghi_chu: parts[0].trim(),
          ket_qua_xm: parts[1].trim()
        };
      }
      return { ...item, ket_qua_xm: item.ket_qua_xm || "" };
    });
  }, [data]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [tab, setTab] = useState("sdt");
  const [search, setSearch] = useState("");
  const [filterNhaMang, setFilterNhaMang] = useState("all");
  const [filterNganHang, setFilterNganHang] = useState("all");
  const [filterCanBo, setFilterCanBo] = useState("all");
  const [filterTrangThai, setFilterTrangThai] = useState("all");
  const [sortBy, setSortBy] = useState("ngay_desc");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [chuPopup, setChuPopup] = useState(null);
  const [canBoPopup, setCanBoPopup] = useState(null);
  const [relatedRecordPopup, setRelatedRecordPopup] = useState(null);

  const findRelatedRecord = (text) => {
    if (!text) return null;
    const cleanText = text.trim();
    const lists = [
      { type: 'vu_an', list: data["vu_an"] || [] },
      { type: 'tin_bao', list: data["tin_bao"] || [] },
      { type: 'don_to_giac', list: data["don_to_giac"] || [] }
    ];

    for (const item of lists) {
      const found = item.list.find(r => r.ma_so && r.ma_so.trim().toLowerCase() === cleanText.toLowerCase());
      if (found) return { type: item.type, data: found };
    }

    const regex = /(VA|TB|DTG|CNC|TB7575)-\d{4}-\d+/gi;
    const matches = cleanText.match(regex);
    if (matches && matches.length > 0) {
      const matchedCode = matches[0].toLowerCase();
      for (const item of lists) {
        const found = item.list.find(r => r.ma_so && r.ma_so.trim().toLowerCase() === matchedCode);
        if (found) return { type: item.type, data: found };
      }
    }

    for (const item of lists) {
      const found = item.list.find(r => r.ma_so && cleanText.toLowerCase().includes(r.ma_so.trim().toLowerCase()));
      if (found) return { type: item.type, data: found };
    }

    return null;
  };

  const isAdmin = currentUser.role === "admin" || currentUser.role === "mod";
  const isOfficer = currentUser.role === "officer";
  const canAddNew = isAdmin || isOfficer;
  const canEdit = (item) => isAdmin || (isOfficer && item.can_bo_cap_nhat === currentUser.name);
  const canDelete = (item) => currentUser.role === "admin";
  const officerList = users.filter((u) => u.role !== "viewer").map((u) => u.name);
  const isSdt = tab === "sdt";

  const sdt_da = sdtItems.filter((i) => i.trang_thai_xm === "da_xac_minh").length;
  const sdt_dang = sdtItems.filter((i) => !i.trang_thai_xm || i.trang_thai_xm === "dang_xac_minh").length;
  const stk_da = stkItems.filter((i) => i.trang_thai_xm === "da_xac_minh").length;
  const stk_dang = stkItems.filter((i) => !i.trang_thai_xm || i.trang_thai_xm === "dang_xac_minh").length;

  const items = isSdt ? sdtItems : stkItems;
  const moduleKey = isSdt ? "so_dien_thoai" : "so_tai_khoan";

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.toLowerCase();
    if (q) list = list.filter((i) => Object.values(i).some((v) => String(v).toLowerCase().includes(q)));
    if (isSdt && filterNhaMang !== "all") list = list.filter((i) => i.nha_mang === filterNhaMang);
    if (!isSdt && filterNganHang !== "all") list = list.filter((i) => i.ngan_hang === filterNganHang);
    if (filterCanBo !== "all") list = list.filter((i) => i.can_bo_cap_nhat === filterCanBo);
    if (filterTrangThai !== "all") list = list.filter((i) => (i.trang_thai_xm || "dang_xac_minh") === filterTrangThai);

    if (sortBy === "ngay_desc") list.sort((a, b) => new Date(b.ngay_cap_nhat || 0) - new Date(a.ngay_cap_nhat || 0));
    if (sortBy === "ngay_asc") list.sort((a, b) => new Date(a.ngay_cap_nhat || 0) - new Date(b.ngay_cap_nhat || 0));
    if (sortBy === "trang_thai") list.sort((a, b) => (a.trang_thai_xm || "z").localeCompare(b.trang_thai_xm || "z"));
    return list;
  }, [items, search, filterNhaMang, filterNganHang, filterCanBo, filterTrangThai, sortBy, tab]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [items, search, filterNhaMang, filterNganHang, filterCanBo, filterTrangThai, sortBy, tab]);

  useEffect(() => {
    if (selectedRecord && (selectedRecord._page === "so_dt_tk" || selectedRecord._mod?.id === "so_dt_tk" || selectedRecord._mod?.id === "so_dien_thoai" || selectedRecord._mod?.id === "so_tai_khoan")) {
      const isSdtRecord = selectedRecord.so_dt !== undefined || selectedRecord._mod?.id === "so_dien_thoai";
      if (isSdtRecord) {
        setTab("sdt");
      } else {
        setTab("stk");
      }
      
      const list = isSdtRecord ? sdtItems : stkItems;
      const found = list.find(i => i.id === selectedRecord.id || (isSdtRecord ? i.so_dt === selectedRecord.so_dt : i.so_tk === selectedRecord.so_tk));
      if (found) {
        setChuPopup(found);
      } else {
        setChuPopup(selectedRecord);
      }
      if (clearSelectedRecord) {
        clearSelectedRecord();
      }
    }
  }, [selectedRecord, sdtItems, stkItems, clearSelectedRecord]);

  useEffect(() => {
    if (chuPopup && chuPopup.id) {
      const isSdtRecord = chuPopup.so_dt !== undefined;
      if (isSdtRecord) {
        addLog(`Xem chi tiết SĐT: ${chuPopup.so_dt} (Chủ thuê bao: ${chuPopup.ten_chu_so || "—"}, Nhà mạng: ${chuPopup.nha_mang || "—"})`, "so_dien_thoai");
      } else {
        addLog(`Xem chi tiết tài khoản ngân hàng: ${chuPopup.so_tk} (Chủ TK: ${chuPopup.ten_chu_tk || "—"}, Ngân hàng: ${chuPopup.ngan_hang || "—"})`, "so_tai_khoan");
      }
    }
  }, [chuPopup]);

  const handleSave = (form) => {
    const cur = data[moduleKey] || [];
    let f = { ...form, can_bo_cap_nhat: form.can_bo_cap_nhat || currentUser.name };
    const cleanGhiChu = f.ghi_chu || "";
    const cleanKq = f.ket_qua_xm || "";
    if (cleanKq) {
      f.ghi_chu = `${cleanGhiChu}\n===KET_QUA_XM===\n${cleanKq}`.trim();
    } else {
      f.ghi_chu = cleanGhiChu;
    }
    delete f.ket_qua_xm;
    let nd;
    if (editItem) {
      nd = cur.map((i) => i.id === editItem.id ? { ...f, id: editItem.id } : i);
      addLog(`Cập nhật ${isSdt ? "SĐT" : "TK"}: ${f.so_dt || f.so_tk}`, isSdt ? "so_dien_thoai" : "so_tai_khoan");
    } else {
      const id = Math.max(0, ...cur.map((i) => i.id)) + 1;
      nd = [...cur, { ...f, id }];
      addLog(`Thêm ${isSdt ? "SĐT" : "TK"}: ${f.so_dt || f.so_tk}`, isSdt ? "so_dien_thoai" : "so_tai_khoan");
    }
    onDataChange(moduleKey, nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    const key = isSdt ? item.so_dt : item.so_tk;
    if (!window.confirm(`Xóa "${key}"?`)) return;
    onDataChange(moduleKey, (data[moduleKey] || []).filter((i) => i.id !== item.id));
    addLog(`Xóa ${isSdt ? "SĐT" : "TK"}: ${key}`, isSdt ? "so_dien_thoai" : "so_tai_khoan");
  };

  const handleCanBoClick = (name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return;
    const sdtCount = sdtItems.filter((i) => i.can_bo_cap_nhat === name).length;
    const stkCount = stkItems.filter((i) => i.can_bo_cap_nhat === name).length;
    setCanBoPopup({
      ...u,
      sdtCount,
      stkCount
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>📞🏦 Điện Thoại – Ngân Hàng</h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>Số điện thoại và tài khoản ngân hàng liên quan vụ án</div>
        </div>
        {canAddNew && (
          <button
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }}
            style={{
              padding: "10px 20px",
              background: isSdt ? "linear-gradient(135deg,#059669,#047857)" : "linear-gradient(135deg,#4F46E5,#4338CA)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: `0 4px 12px ${isSdt ? "rgba(5,150,105,0.3)" : "rgba(79,70,229,0.3)"}`,
              width: isMobile ? "100%" : "auto"
            }}
          >
            + Thêm {isSdt ? "số điện thoại" : "tài khoản NH"}
          </button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", color: "#94A3B8" }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isSdt ? "Tìm số điện thoại, chủ thuê bao, nhà mạng, nghi vấn, vụ án..." : "Tìm số tài khoản, chủ tài khoản, ngân hàng, nghi vấn..."}
          style={{ width: "100%", padding: "12px 16px 12px 50px", border: "2px solid #E2E8F0", borderRadius: 14, fontSize: 14, outline: "none", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", boxSizing: "border-box" }}
          onFocus={(e) => e.target.style.borderColor = isSdt ? "#059669" : "#4F46E5"}
          onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>
        {/* SDT Summary Card */}
        <div
          style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", borderRadius: 14, padding: "14px 16px", border: "1px solid #A7F3D0", boxShadow: "0 2px 8px rgba(5,150,105,0.08)", cursor: "pointer" }}
          onClick={() => setTab("sdt")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>📞</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#065F46" }}>Số Điện Thoại</span>
            {tab === "sdt" && <span style={{ marginLeft: "auto", background: "#059669", color: "#fff", padding: "1px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Đang xem</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[{ l: "Tổng số", v: sdtItems.length, c: "#065F46" }, { l: "Đang XM", v: sdt_dang, c: "#B45309" }, { l: "Đã XM", v: sdt_da, c: "#15803D" }].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: "center", padding: "9px 6px", background: "rgba(255,255,255,0.75)", borderRadius: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setTab("sdt");
                  setFilterTrangThai(i === 0 ? "all" : i === 1 ? "dang_xac_minh" : "da_xac_minh");
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STK Summary Card */}
        <div
          style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", borderRadius: 14, padding: "14px 16px", border: "1px solid #C7D2FE", boxShadow: "0 2px 8px rgba(79,70,229,0.08)", cursor: "pointer" }}
          onClick={() => setTab("stk")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>🏦</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#3730A3" }}>Tài Khoản Ngân Hàng</span>
            {tab === "stk" && <span style={{ marginLeft: "auto", background: "#4F46E5", color: "#fff", padding: "1px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Đang xem</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[{ l: "Tổng TK", v: stkItems.length, c: "#3730A3" }, { l: "Đang XM", v: stk_dang, c: "#B45309" }, { l: "Đã XM", v: stk_da, c: "#15803D" }].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: "center", padding: "9px 6px", background: "rgba(255,255,255,0.75)", borderRadius: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setTab("stk");
                  setFilterTrangThai(i === 0 ? "all" : i === 1 ? "dang_xac_minh" : "da_xac_minh");
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "11px 14px", border: "1px solid #E2E8F0", marginBottom: 14, display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", flexShrink: 0, width: isMobile ? "100%" : "auto" }}>Lọc:</span>
        {isSdt && (
          <select value={filterNhaMang} onChange={(e) => setFilterNhaMang(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 160, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
            <option value="all">Tất cả nhà mạng</option>
            {NHA_MANG_LIST.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
        {!isSdt && (
          <select value={filterNganHang} onChange={(e) => setFilterNganHang(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 200, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
            <option value="all">Tất cả ngân hàng</option>
            {NGAN_HANG_LIST.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
        <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 170, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="dang_xac_minh">🔎 Đang xác minh</option>
          <option value="da_xac_minh">✅ Đã xác minh</option>
        </select>
        <select value={filterCanBo} onChange={(e) => setFilterCanBo(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 180, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="all">Tất cả cán bộ</option>
          {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff", maxWidth: isMobile ? "none" : 190, flex: isMobile ? "1 1 calc(50% - 8px)" : "none" }}>
          <option value="ngay_desc">📅 Mới cập nhật trước</option>
          <option value="ngay_asc">📅 Cũ cập nhật trước</option>
          <option value="trang_thai">✅ Theo trạng thái</option>
        </select>
        {(filterNhaMang !== "all" || filterNganHang !== "all" || filterTrangThai !== "all" || filterCanBo !== "all" || search) && (
          <button
            onClick={() => {
              setFilterNhaMang("all");
              setFilterNganHang("all");
              setFilterTrangThai("all");
              setFilterCanBo("all");
              setSearch("");
            }}
            style={{ padding: "6px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, flex: isMobile ? "1 1 100%" : "none" }}
          >
            ✕ Xóa lọc
          </button>
        )}
        <button
          onClick={() => {
            const title = isSdt ? "DANH SÁCH SỐ ĐIỆN THOẠI NGHI VẤN/VỤ ÁN" : "DANH SÁCH TÀI KHOẢN NGÂN HÀNG LIÊN QUAN VỤ ÁN";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = isSdt 
              ? ["Số điện thoại", "Nhà mạng", "Đăng ký chính chủ", "Địa chỉ đăng ký", "Đối tượng sử dụng", "Trạng thái xác minh", "Cán bộ cập nhật"]
              : ["Số tài khoản", "Ngân hàng", "Chủ tài khoản", "Chi nhánh", "Đối tượng sử dụng", "Trạng thái xác minh", "Cán bộ cập nhật"];
            const rows = filtered.map(item => isSdt ? [
              item.so_dt || "—",
              item.nha_mang || "—",
              item.chu_thue_bao || "—",
              item.dia_chi_dang_ky || "—",
              item.doi_tuong_su_dung || "—",
              item.trang_thai === "da_xac_minh" ? "Đã xác minh" : "Đang xác minh",
              item.can_bo_cap_nhat || "—"
            ] : [
              item.so_tk || "—",
              item.ngan_hang || "—",
              item.chu_tai_khoan || "—",
              item.chi_nhanh || "—",
              item.doi_tuong_su_dung || "—",
              item.trang_thai === "da_xac_minh" ? "Đã xác minh" : "Đang xác minh",
              item.can_bo_cap_nhat || "—"
            ]);
            exportToPrint({ title, subTitle, columns: cols, rows, currentUser });
            addLog(`In danh sách ${isSdt ? "SĐT" : "tài khoản ngân hàng"} (${filtered.length} bản ghi)`, isSdt ? "so_dien_thoai" : "so_tai_khoan");
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          🖨️ In
        </button>
        <button
          onClick={() => {
            const title = isSdt ? "DANH SÁCH SỐ ĐIỆN THOẠI NGHI VẤN/VỤ ÁN" : "DANH SÁCH TÀI KHOẢN NGÂN HÀNG LIÊN QUAN VỤ ÁN";
            const subTitle = `Thời điểm lập: ${new Date().toLocaleDateString("vi-VN")}`;
            const cols = isSdt 
              ? ["Số điện thoại", "Nhà mạng", "Đăng ký chính chủ", "Địa chỉ đăng ký", "Đối tượng sử dụng", "Trạng thái xác minh", "Cán bộ cập nhật"]
              : ["Số tài khoản", "Ngân hàng", "Chủ tài khoản", "Chi nhánh", "Đối tượng sử dụng", "Trạng thái xác minh", "Cán bộ cập nhật"];
            const rows = filtered.map(item => isSdt ? [
              item.so_dt || "—",
              item.nha_mang || "—",
              item.chu_thue_bao || "—",
              item.dia_chi_dang_ky || "—",
              item.doi_tuong_su_dung || "—",
              item.trang_thai === "da_xac_minh" ? "Đã xác minh" : "Đang xác minh",
              item.can_bo_cap_nhat || "—"
            ] : [
              item.so_tk || "—",
              item.ngan_hang || "—",
              item.chu_tai_khoan || "—",
              item.chi_nhanh || "—",
              item.doi_tuong_su_dung || "—",
              item.trang_thai === "da_xac_minh" ? "Đã xác minh" : "Đang xác minh",
              item.can_bo_cap_nhat || "—"
            ]);
            exportToWord({ title, subTitle, columns: cols, rows, currentUser, filename: isSdt ? "danh_sach_so_dien_thoai" : "danh_sach_tai_khoan_ngan_hang" });
            addLog(`Xuất file Word danh sách ${isSdt ? "SĐT" : "tài khoản ngân hàng"} (${filtered.length} bản ghi)`, isSdt ? "so_dien_thoai" : "so_tai_khoan");
          }}
          style={{ padding: "7px 12px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flex: isMobile ? "1 1 calc(50% - 8px)" : "none", justifyContent: isMobile ? "center" : "flex-start" }}
        >
          <img src="/images/word_icon.png" style={{ width: 14, height: 14, objectFit: "contain" }} alt="Word" /> Word
        </button>
        <div style={{ marginLeft: isMobile ? "0" : "auto", fontSize: 11, color: "#94A3B8", width: isMobile ? "100%" : "auto", textAlign: isMobile ? "right" : "left", marginTop: isMobile ? 4 : 0 }}>{filtered.length}/{items.length}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
        <button
          style={tabStyle(isSdt, "#059669", "#047857")}
          onClick={() => {
            setTab("sdt");
            setFilterNhaMang("all");
            setFilterNganHang("all");
            setFilterTrangThai("all");
          }}
        >
          📞 Số Điện Thoại
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>{sdtItems.length}</span>
        </button>
        <button
          style={tabStyle(!isSdt, "#4F46E5", "#4338CA")}
          onClick={() => {
            setTab("stk");
            setFilterNhaMang("all");
            setFilterNganHang("all");
            setFilterTrangThai("all");
          }}
        >
          🏦 Tài Khoản Ngân Hàng
          <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.22)", padding: "1px 8px", borderRadius: 20, fontSize: 12 }}>{stkItems.length}</span>
        </button>
      </div>

      {/* Table Content */}
      <div style={{ background: "#fff", borderRadius: "0 14px 14px 14px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
            <thead>
              <tr style={{ background: isSdt ? "linear-gradient(135deg,#064E3B,#059669)" : "linear-gradient(135deg,#312E81,#4F46E5)" }}>
                {/* Custom table headers */}
                {(isSdt
                  ? ["#", "Số điện thoại", "Nhà mạng", "Chủ thuê bao", "Nghi vấn", "Ngày cập nhật", "Cán bộ cập nhật", "Trạng thái", "Thao tác"]
                  : ["#", "Số tài khoản", "Ngân hàng", "Chủ tài khoản", "Nghi vấn", "Ngày cập nhật", "Cán bộ cập nhật", "Trạng thái", "Thao tác"]
                ).map((h) => (
                  <th key={h} style={{ padding: "9px 7px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.2 }}>{isSdt ? "📞" : "🏦"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 4 }}>Không có dữ liệu</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>Thử thay đổi bộ lọc</div>
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => {
                  const xm = item.trang_thai_xm;
                  const rowBg = idx % 2 === 0 ? "#fff" : "#FAFBFC";
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid #F1F5F9", background: rowBg }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isSdt ? "#F0FDF9" : "#F0F0FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                    >
                      <td style={{ padding: "8px 5px", fontSize: 11, color: "#CBD5E1", fontWeight: 700, textAlign: "center", width: 26 }}>{idx + 1}</td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {isSdt ? (
                          <button
                            onClick={() => setChuPopup(item)}
                            style={{
                              border: "none",
                              background: "none",
                              padding: 0,
                              margin: 0,
                              fontWeight: 900,
                              fontSize: 13,
                              color: "#059669",
                              letterSpacing: 0.5,
                              fontFamily: "monospace",
                              cursor: "pointer",
                              textDecoration: "underline dotted",
                              textUnderlineOffset: 3
                            }}
                            title="Xem chi tiết"
                          >
                            {item.so_dt}
                          </button>
                        ) : (
                          <button
                            onClick={() => setChuPopup(item)}
                            style={{
                              border: "none",
                              background: "none",
                              padding: 0,
                              margin: 0,
                              fontWeight: 900,
                              fontSize: 13,
                              color: "#4F46E5",
                              letterSpacing: 0.5,
                              fontFamily: "monospace",
                              cursor: "pointer",
                              textDecoration: "underline dotted",
                              textUnderlineOffset: 3
                            }}
                            title="Xem chi tiết"
                          >
                            {item.so_tk}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {isSdt ? (
                          <NhaMangBadge2 nm={item.nha_mang} onClick={() => setFilterNhaMang(item.nha_mang)} />
                        ) : (
                          <NganHangBadge2 nh={item.ngan_hang} onClick={() => setFilterNganHang(item.ngan_hang)} />
                        )}
                      </td>
                      {/* Name of Owner */}
                      <td style={{ padding: "10px 12px" }}>
                        {(isSdt ? item.ten_chu_so : item.ten_chu_tk) ? (
                          <button
                            onClick={() => setChuPopup(item)}
                            style={{ 
                              border: "none", 
                              background: "none", 
                              color: "#3B82F6", 
                              cursor: "pointer", 
                              fontSize: 12, 
                              fontWeight: 700, 
                              padding: 0, 
                              textDecoration: "underline dotted", 
                              textUnderlineOffset: 3, 
                              display: "-webkit-box", 
                              WebkitLineClamp: 2, 
                              WebkitBoxOrient: "vertical", 
                              overflow: "hidden", 
                              textAlign: "left",
                              maxWidth: 150
                            }}
                          >
                            {isSdt ? item.ten_chu_so : item.ten_chu_tk}
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}><NghiVanBadge v={item.nghi_van} /></td>
                      <td style={{ padding: "10px 12px", fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>{formatVNdate(item.ngay_cap_nhat)}</td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {item.can_bo_cap_nhat ? (
                          <button
                            onClick={() => handleCanBoClick(item.can_bo_cap_nhat)}
                            style={{ border: "none", background: "none", color: "#6366F1", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <UserAvatar user={users.find(u => u.name === item.can_bo_cap_nhat) || { name: item.can_bo_cap_nhat, role: "viewer" }} size={22} />
                            <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortName(item.can_bo_cap_nhat)}</span>
                          </button>
                        ) : (
                          <span style={{ color: "#CBD5E1" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}><XMBadge tt={xm} /></td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setChuPopup(item)} style={{ border: "none", background: "#F0FDF4", color: "#15803D", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xem</button>
                          {canEdit(item) && <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ border: "none", background: "#FFFBEB", color: "#B45309", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Sửa</button>}
                          {canDelete(item) && <button onClick={() => handleDelete(item)} style={{ border: "none", background: "#FFF5F5", color: "#DC2626", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Xóa</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "9px 14px", borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#94A3B8", display: "flex", justifyContent: "space-between", background: "#FAFBFC" }}>
          <span>Hiển thị <b style={{ color: "#1E293B" }}>{filtered.length}</b>/{items.length} {isSdt ? "số điện thoại" : "tài khoản"}</span>
          <span style={{ fontWeight: 600, color: isSdt ? "#059669" : "#4F46E5" }}>
            ✅ {isSdt ? sdt_da : stk_da} đã XM · 🔎 {isSdt ? sdt_dang : stk_dang} đang XM
          </span>
        </div>
      </div>

      {/* Pagination controls if needed (using totalPages & page state) */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>«</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === 1 ? "#F8FAFC" : "#fff", color: page === 1 ? "#CBD5E1" : "#374151", cursor: page === 1 ? "default" : "pointer", fontSize: 11 }}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => {
            const p = i + 1;
            const isAct = p === page;
            return (
              <button key={p} onClick={() => setPage(p)} style={{ padding: "4px 9px", border: "1px solid " + (isAct ? (isSdt ? "#059669" : "#4F46E5") : "#E2E8F0"), borderRadius: 6, background: isAct ? (isSdt ? "#059669" : "#4F46E5") : "#fff", color: isAct ? "#fff" : "#374151", cursor: "pointer", fontSize: 11, fontWeight: isAct ? 700 : 400, minWidth: 30 }}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>›</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6, background: page === totalPages ? "#F8FAFC" : "#fff", color: page === totalPages ? "#CBD5E1" : "#374151", cursor: page === totalPages ? "default" : "pointer", fontSize: 11 }}>»</button>
        </div>
      )}

      {/* Owner Detail Popup */}
      {chuPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setChuPopup(null)}>
          <div style={{ background: "#fff", borderRadius: 18, maxWidth: 400, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", overflowX: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", background: isSdt ? "linear-gradient(135deg,#064E3B,#059669)" : "linear-gradient(135deg,#312E81,#4F46E5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>{isSdt ? "📞 THÔNG TIN CHỦ THUÊ BAO" : "🏦 THÔNG TIN CHỦ TÀI KHOẢN"}</div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, marginTop: 2 }}>{isSdt ? chuPopup.ten_chu_so : chuPopup.ten_chu_tk}</div>
                </div>
                <button onClick={() => setChuPopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 15, color: "#fff" }}>×</button>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14, padding: "10px 14px", background: isSdt ? "#F0FDF4" : "#EEF2FF", borderRadius: 10, fontFamily: "monospace", fontSize: 14, fontWeight: 900, color: isSdt ? "#059669" : "#4F46E5", letterSpacing: 1 }}>
                {isSdt ? chuPopup.so_dt : chuPopup.so_tk}
                {isSdt && chuPopup.nha_mang && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600, color: "#64748B" }}> · {chuPopup.nha_mang}</span>}
                {!isSdt && chuPopup.ngan_hang && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600, color: "#64748B" }}> · {chuPopup.ngan_hang}</span>}
              </div>
              {[
                { l: "Số điện thoại / Số TK", v: isSdt ? chuPopup.so_dt : chuPopup.so_tk, bold: true },
                { l: "Nhà mạng / Ngân hàng", v: isSdt ? chuPopup.nha_mang : chuPopup.ngan_hang },
                { l: "Họ và tên chủ sở hữu", v: isSdt ? chuPopup.ten_chu_so : chuPopup.ten_chu_tk, bold: true },
                { l: "Ngày sinh", v: chuPopup.chu_ngay_sinh ? formatVNdate(chuPopup.chu_ngay_sinh) : null },
                { l: "CCCD/CMND", v: chuPopup.chu_cccd },
                ...isSdt ? [] : [{ l: "Số điện thoại liên hệ", v: chuPopup.chu_sdt }],
                { l: "Địa chỉ", v: chuPopup.chu_dia_chi },
                { l: "Nghi vấn", v: chuPopup.nghi_van },
                ...isSdt ? [] : [{ l: "Số dư khả nghi", v: chuPopup.so_du_kha_nghi ? chuPopup.so_du_kha_nghi + " đ" : null }],
                { l: "Liên quan vụ", v: chuPopup.lien_quan_vu_an, isRelatedCase: true },
                { l: "Kết quả xác minh", v: chuPopup.ket_qua_xm },
                { l: "Ghi chú", v: chuPopup.ghi_chu }
              ].map((f, i) => {
                const displayValue = f.v ? f.v : "—";
                const related = f.isRelatedCase && f.v ? findRelatedRecord(f.v) : null;
                return (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, minWidth: 140, flexShrink: 0 }}>{f.l}</span>
                    {related ? (
                      <button
                        onClick={() => setRelatedRecordPopup(related)}
                        style={{
                          background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
                          color: "#1E40AF",
                          border: "1px solid #BFDBFE",
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(30,64,175,0.15)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)"; }}
                      >
                        {related.type === 'vu_an' ? '⚖️' : related.type === 'tin_bao' ? '📰' : '📋'} {f.v}
                      </button>
                    ) : (
                      <span style={{ fontSize: 13, color: f.v ? "#111827" : "#94A3B8", fontWeight: f.bold && f.v ? 700 : 500, wordBreak: "break-word" }}>{displayValue}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                <XMBadge tt={chuPopup.trang_thai_xm} />
                <span style={{ fontSize: 11, color: "#94A3B8" }}>Cập nhật: {formatVNdate(chuPopup.ngay_cap_nhat)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Record Detail Popup */}
      {relatedRecordPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setRelatedRecordPopup(null)}>
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.35)", overflowX: "hidden" }} onClick={(e) => e.stopPropagation()}>
            {relatedRecordPopup.type === 'vu_an' && (
              <>
                <div style={{ padding: "20px 24px", background: "linear-gradient(135deg,#7F1D1D,#DC2626)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>⚖️ VỤ ÁN · {relatedRecordPopup.data.ma_so}</div>
                      <div style={{ color: "#fff", fontWeight: 900, fontSize: 17, lineHeight: 1.4 }}>{relatedRecordPopup.data.ten_vu_an}</div>
                      <div style={{ marginTop: 8 }}><TrangThaiAnBadge trang_thai_an={relatedRecordPopup.data.trang_thai_an} /></div>
                    </div>
                    <button onClick={() => setRelatedRecordPopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#fff", flexShrink: 0 }}>×</button>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                    {[
                      { l: "Mã số vụ án", v: relatedRecordPopup.data.ma_so, bold: true },
                      { l: "Loại vụ án", v: relatedRecordPopup.data.loai_vu_an },
                      { l: "Tội danh", v: relatedRecordPopup.data.toi_danh, badge: true },
                      { l: "Điều / Khoản", v: (relatedRecordPopup.data.dieu || relatedRecordPopup.data.khoan) ? `${relatedRecordPopup.data.dieu || "—"}${relatedRecordPopup.data.khoan ? `, Khoản ${relatedRecordPopup.data.khoan}` : ""}` : null },
                      { l: "Thời gian xảy ra", v: relatedRecordPopup.data.ngay_xay_ra ? formatVNdate(relatedRecordPopup.data.ngay_xay_ra) : null },
                      { l: "Nơi xảy ra", v: relatedRecordPopup.data.dia_diem },
                      { l: "Ngày khởi tố", v: relatedRecordPopup.data.ngay_khoi_to ? formatVNdate(relatedRecordPopup.data.ngay_khoi_to) : null },
                      { l: "Hạn điều tra", v: relatedRecordPopup.data.deadline ? formatVNdate(relatedRecordPopup.data.deadline) : null },
                      { l: "Thời hiệu", v: relatedRecordPopup.data.thoi_hieu ? formatVNdate(relatedRecordPopup.data.thoi_hieu) : null },
                      { l: "Cán bộ thụ lý", v: relatedRecordPopup.data.tham_phan },
                      { l: "Bị can / Nghi can", v: relatedRecordPopup.data.bi_can, full: true },
                      { l: "Ưu tiên", v: relatedRecordPopup.data.priority === "cao" ? "🔴 Cao" : relatedRecordPopup.data.priority === "trung_binh" ? "🟡 Trung bình" : "🟢 Thấp" },
                      { l: "Trạng thái tiến độ", v: (!relatedRecordPopup.data.trang_thai_an || relatedRecordPopup.data.trang_thai_an === "hien_hanh") ? relatedRecordPopup.data.status : null, badge_st: true },
                      { l: "Ghi chú / Diễn biến", v: relatedRecordPopup.data.ghi_chu, full: true }
                    ].map((f, i) => {
                      if (f.v === undefined || f.v === null) return null;
                      return (
                        <div key={i} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 }}>{f.l}</div>
                          <div style={{ padding: "9px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 13, color: "#1E293B", fontWeight: f.bold ? 700 : 400, wordBreak: "break-word" }}>
                            {f.badge_st ? <StatusBadge deadline={relatedRecordPopup.data.deadline} statusOverride={relatedRecordPopup.data.status} /> : f.v}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            {relatedRecordPopup.type === 'tin_bao' && (
              <>
                <div style={{ padding: "20px 24px", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>📡 TIN BÁO · {relatedRecordPopup.data.ma_so}</div>
                      <div style={{ color: "#fff", fontWeight: 900, fontSize: 17, lineHeight: 1.4 }}>{relatedRecordPopup.data.tieu_de}</div>
                      <div style={{ marginTop: 8 }}><TrangThaiTinBadge trang_thai_tin={relatedRecordPopup.data.trang_thai_tin} /></div>
                    </div>
                    <button onClick={() => setRelatedRecordPopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#fff", flexShrink: 0 }}>×</button>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                    {[
                      { l: "Mã số tin báo", v: relatedRecordPopup.data.ma_so, bold: true },
                      { l: "Nguồn tin", v: relatedRecordPopup.data.nguon_tin },
                      { l: "Tội danh nghi vấn", v: relatedRecordPopup.data.toi_danh },
                      { l: "Điều/Khoản", v: relatedRecordPopup.data.dieu ? `${relatedRecordPopup.data.dieu} ${relatedRecordPopup.data.khoan ? 'khoản ' + relatedRecordPopup.data.khoan : ''}` : "" },
                      { l: "Thời gian xảy ra", v: relatedRecordPopup.data.ngay_xay_ra ? formatVNdate(relatedRecordPopup.data.ngay_xay_ra) : "" },
                      { l: "Địa điểm xảy ra", v: relatedRecordPopup.data.dia_diem },
                      { l: "Ngày phân công", v: relatedRecordPopup.data.ngay_phan_cong },
                      { l: "Ngày hết hạn", v: relatedRecordPopup.data.deadline },
                      { l: "Thời hiệu", v: relatedRecordPopup.data.thoi_hieu ? formatVNdate(relatedRecordPopup.data.thoi_hieu) : "" },
                      { l: "Cán bộ phụ trách", v: relatedRecordPopup.data.phu_trach },
                      { l: "Độ ưu tiên", v: relatedRecordPopup.data.priority === "cao" ? "🔴 Cao" : relatedRecordPopup.data.priority === "trung_binh" ? "🟡 Trung bình" : "🟢 Thấp" },
                      { l: "Trạng thái tiến độ", v: (!relatedRecordPopup.data.trang_thai_tin || relatedRecordPopup.data.trang_thai_tin === "dang_giai_quyet" || relatedRecordPopup.data.trang_thai_tin === "hien_hanh") ? (relatedRecordPopup.data.status || "dang_xu_ly") : null, badge_st: true },
                      { l: "Nội dung chi tiết", v: relatedRecordPopup.data.ghi_chu, full: true }
                    ].map((f, i) => {
                      if (f.v === undefined || f.v === null || f.v === "") return null;
                      return (
                        <div key={i} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 }}>{f.l}</div>
                          <div style={{ padding: "9px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 13, color: "#1E293B", fontWeight: f.bold ? 700 : 400, wordBreak: "break-word" }}>
                            {f.badge_st ? <StatusBadge deadline={relatedRecordPopup.data.deadline} statusOverride={relatedRecordPopup.data.status} /> : f.v}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            {relatedRecordPopup.type === 'don_to_giac' && (
              <>
                <div style={{ padding: "18px 22px", background: (relatedRecordPopup.data.loai || "don") === "cong_nghe_cao" ? "linear-gradient(135deg,#4C1D95,#7C3AED)" : (relatedRecordPopup.data.loai || "don") === "don" ? "linear-gradient(135deg,#1E3A8A,#2563EB)" : "linear-gradient(135deg,#065F46,#059669)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{(relatedRecordPopup.data.loai || "don") === "don" ? "📋 ĐƠN TỐ GIÁC" : (relatedRecordPopup.data.loai || "don") === "cong_nghe_cao" ? "💻 ĐƠN CÔNG NGHỆ CAO" : "📞 TIN 7575"} · {relatedRecordPopup.data.ma_so}</div>
                      <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, lineHeight: 1.4 }}>{relatedRecordPopup.data.tieu_de}</div>
                    </div>
                    <button onClick={() => setRelatedRecordPopup(null)} style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#fff", flexShrink: 0 }}>×</button>
                  </div>
                </div>
                <div style={{ padding: 18, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Mã số", val: relatedRecordPopup.data.ma_so, b: true },
                    { label: "Hành vi", val: relatedRecordPopup.data.hanh_vi, badge: true },
                    ((relatedRecordPopup.data.loai || "don") === "don" || (relatedRecordPopup.data.loai || "don") === "cong_nghe_cao") && { label: "Người tố giác", val: relatedRecordPopup.data.nguoi_to_giac },
                    ((relatedRecordPopup.data.loai || "don") === "don" || (relatedRecordPopup.data.loai || "don") === "cong_nghe_cao") && { label: "SĐT người gửi", val: relatedRecordPopup.data.ngs_sdt },
                    ((relatedRecordPopup.data.loai || "don") === "don" || (relatedRecordPopup.data.loai || "don") === "cong_nghe_cao") && { label: "Năm sinh", val: relatedRecordPopup.data.ngs_ns },
                    ((relatedRecordPopup.data.loai || "don") === "don" || (relatedRecordPopup.data.loai || "don") === "cong_nghe_cao") && { label: "Nơi ở người gửi", val: relatedRecordPopup.data.ngs_noi_o, full: true },
                    { label: "Ngày tiếp nhận", val: relatedRecordPopup.data.ngay_tiep_nhan },
                    { label: "Hạn xử lý", val: relatedRecordPopup.data.deadline },
                    { label: "Cán bộ thụ lý", val: relatedRecordPopup.data.phu_trach },
                    { label: "Ưu tiên", val: relatedRecordPopup.data.priority === "cao" ? "🔴 Cao" : relatedRecordPopup.data.priority === "trung_binh" ? "🟡 Trung bình" : "🟢 Thấp" },
                    { label: "Trạng thái", val: null, status: true },
                    { label: "Kết quả giải quyết", val: relatedRecordPopup.data.ket_qua_giai_quyet, full: true },
                    { label: "Ghi chú", val: relatedRecordPopup.data.ghi_chu, full: true }
                  ].filter(Boolean).map((f, i) => (
                    <div key={i} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 3 }}>{f.label}</div>
                      <div style={{ padding: "8px 11px", background: "#F8FAFC", borderRadius: 9, border: "1px solid #E2E8F0", fontSize: 13, color: "#1E293B", fontWeight: f.b ? 700 : 400, wordBreak: "break-word" }}>
                        {f.badge ? <HanhViBadge hanh_vi={f.val} /> : f.status ? <StatusBadge deadline={relatedRecordPopup.data.deadline} statusOverride={relatedRecordPopup.data.status} /> : f.val || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{ padding: "12px 18px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", background: "#FAFBFC" }}>
              <button
                onClick={() => setRelatedRecordPopup(null)}
                style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Detail Popup */}
      {canBoPopup && (
        <Modal title="👮 Thông tin cán bộ cập nhật" onClose={() => setCanBoPopup(null)}>
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
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Thống kê nhập liệu</div>
            <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>{canBoPopup.sdtCount}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Số điện thoại</div>
              </div>
              <div style={{ borderLeft: "1px solid #E2E8F0" }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4F46E5" }}>{canBoPopup.stkCount}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Tài khoản ngân hàng</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button 
              onClick={() => setCanBoPopup(null)} 
              style={{ padding: "9px 22px", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <Modal
          title={editItem ? "✏️ Chỉnh sửa" : `➕ Thêm ${isSdt ? "Số Điện Thoại" : "Tài Khoản NH"}`}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
        >
          {isSdt ? (
            <SdtForm
              initial={editItem}
              officerList={officerList}
              nhaMangList={NHA_MANG_LIST}
              onSave={handleSave}
              onClose={() => {
                setShowModal(false);
                setEditItem(null);
              }}
              isMobile={isMobile}
              currentUser={currentUser}
            />
          ) : (
            <StkForm
              initial={editItem}
              officerList={officerList}
              nganHangList={NGAN_HANG_LIST}
              onSave={handleSave}
              onClose={() => {
                setShowModal(false);
                setEditItem(null);
              }}
              isMobile={isMobile}
              currentUser={currentUser}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function SdtForm({ initial, officerList, nhaMangList, onSave, onClose, isMobile, currentUser }) {
  const [f, setF] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    return {
      so_dt: "",
      nha_mang: "Viettel",
      ten_chu_so: "",
      chu_ngay_sinh: "",
      chu_cccd: "",
      chu_dia_chi: "",
      nghi_van: "",
      lien_quan_vu_an: "",
      ngay_cap_nhat: todayStr,
      can_bo_cap_nhat: currentUser?.name || "",
      trang_thai_xm: "dang_xac_minh",
      ket_qua_xm: "",
      ghi_chu: "",
      ...initial || {}
    };
  });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <FormField label="Số điện thoại" required={true}>
          <input value={f.so_dt || ""} onChange={(e) => s("so_dt", e.target.value)} style={{ ...inputSt, fontFamily: "monospace", fontWeight: 700 }} placeholder="0912345678" />
        </FormField>
        <FormField label="Nhà mạng">
          <select value={f.nha_mang || ""} onChange={(e) => s("nha_mang", e.target.value)} style={selectSt}>
            <option value="">-- Chọn --</option>
            {nhaMangList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Tên chủ thuê bao">
          <input value={f.ten_chu_so || ""} onChange={(e) => s("ten_chu_so", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Ngày sinh chủ">
          <input type="date" value={f.chu_ngay_sinh || ""} onChange={(e) => s("chu_ngay_sinh", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="CCCD/CMND chủ">
          <input value={f.chu_cccd || ""} onChange={(e) => s("chu_cccd", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Nghi vấn">
          <input value={f.nghi_van || ""} onChange={(e) => s("nghi_van", e.target.value)} style={inputSt} placeholder="VD: Lừa đảo, spam..." />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Địa chỉ chủ thuê bao">
            <input value={f.chu_dia_chi || ""} onChange={(e) => s("chu_dia_chi", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Liên quan vụ">
          <input value={f.lien_quan_vu_an || ""} onChange={(e) => s("lien_quan_vu_an", e.target.value)} style={inputSt} placeholder="VD: VA-2024-001" />
        </FormField>
        <FormField label="Ngày cập nhật">
          <input type="date" value={f.ngay_cap_nhat || ""} onChange={(e) => s("ngay_cap_nhat", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ cập nhật">
          <select value={f.can_bo_cap_nhat || ""} onChange={(e) => s("can_bo_cap_nhat", e.target.value)} style={selectSt}>
            <option value="">-- Chọn --</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Trạng thái">
          <select value={f.trang_thai_xm || "dang_xac_minh"} onChange={(e) => s("trang_thai_xm", e.target.value)} style={selectSt}>
            <option value="dang_xac_minh">🔎 Đang xác minh</option>
            <option value="da_xac_minh">✅ Đã xác minh</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Kết quả xác minh">
            <input value={f.ket_qua_xm || ""} onChange={(e) => s("ket_qua_xm", e.target.value)} style={inputSt} placeholder="Nhập kết quả xác minh..." />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={f.ghi_chu || ""} onChange={(e) => s("ghi_chu", e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(f)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}

function BankAutocomplete({ value, onChange, nganHangList }) {
  const [searchVal, setSearchVal] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setSearchVal(value || "");
  }, [value]);

  const suggestions = useMemo(() => {
    if (!searchVal) return [];
    const q = searchVal.toLowerCase();
    return nganHangList.filter(n => n.toLowerCase().includes(q) && n.toLowerCase() !== value?.toLowerCase());
  }, [searchVal, nganHangList, value]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={searchVal}
        onChange={(e) => {
          setSearchVal(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
        }}
        style={inputSt}
        placeholder="Nhập tên ngân hàng hoặc ví..."
      />
      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          zIndex: 10,
          maxHeight: 200,
          overflowY: "auto",
          marginTop: 4
        }}>
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              onMouseDown={() => {
                setSearchVal(s);
                onChange(s);
                setIsOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                borderBottom: "1px solid #F1F5F9",
                color: "#1E293B",
                textAlign: "left"
              }}
              onMouseEnter={(e) => e.target.style.background = "#F1F5F9"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StkForm({ initial, officerList, nganHangList, onSave, onClose, isMobile, currentUser }) {
  const [f, setF] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    return {
      so_tk: "",
      ngan_hang: "Vietcombank",
      ten_chu_tk: "",
      chu_ngay_sinh: "",
      chu_cccd: "",
      chu_dia_chi: "",
      chu_sdt: "",
      nghi_van: "",
      so_du_kha_nghi: "",
      lien_quan_vu_an: "",
      ngay_cap_nhat: todayStr,
      can_bo_cap_nhat: currentUser?.name || "",
      trang_thai_xm: "dang_xac_minh",
      ket_qua_xm: "",
      ghi_chu: "",
      ...initial || {}
    };
  });
  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Số tài khoản" required={true}>
            <input value={f.so_tk || ""} onChange={(e) => s("so_tk", e.target.value)} style={{ ...inputSt, fontFamily: "monospace", fontWeight: 700, fontSize: 15 }} />
          </FormField>
        </div>
        <FormField label="Ngân hàng">
          <BankAutocomplete value={f.ngan_hang} onChange={(v) => s("ngan_hang", v)} nganHangList={nganHangList} />
        </FormField>
        <FormField label="Tên chủ tài khoản">
          <input value={f.ten_chu_tk || ""} onChange={(e) => s("ten_chu_tk", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Ngày sinh chủ TK">
          <input type="date" value={f.chu_ngay_sinh || ""} onChange={(e) => s("chu_ngay_sinh", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="CCCD/CMND">
          <input value={f.chu_cccd || ""} onChange={(e) => s("chu_cccd", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Số điện thoại chủ TK">
          <input value={f.chu_sdt || ""} onChange={(e) => s("chu_sdt", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Nghi vấn">
          <input value={f.nghi_van || ""} onChange={(e) => s("nghi_van", e.target.value)} style={inputSt} placeholder="VD: Lừa đảo, rửa tiền..." />
        </FormField>
        <FormField label="Số dư khả nghi">
          <input value={f.so_du_kha_nghi || ""} onChange={(e) => s("so_du_kha_nghi", e.target.value)} style={inputSt} placeholder="VD: 500,000,000" />
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Địa chỉ chủ tài khoản">
            <input value={f.chu_dia_chi || ""} onChange={(e) => s("chu_dia_chi", e.target.value)} style={inputSt} />
          </FormField>
        </div>
        <FormField label="Liên quan vụ">
          <input value={f.lien_quan_vu_an || ""} onChange={(e) => s("lien_quan_vu_an", e.target.value)} style={inputSt} placeholder="VD: VA-2024-001" />
        </FormField>
        <FormField label="Ngày cập nhật">
          <input type="date" value={f.ngay_cap_nhat || ""} onChange={(e) => s("ngay_cap_nhat", e.target.value)} style={inputSt} />
        </FormField>
        <FormField label="Cán bộ cập nhật">
          <select value={f.can_bo_cap_nhat || ""} onChange={(e) => s("can_bo_cap_nhat", e.target.value)} style={selectSt}>
            <option value="">-- Chọn --</option>
            {officerList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="Trạng thái">
          <select value={f.trang_thai_xm || "dang_xac_minh"} onChange={(e) => s("trang_thai_xm", e.target.value)} style={selectSt}>
            <option value="dang_xac_minh">🔎 Đang xác minh</option>
            <option value="da_xac_minh">✅ Đã xác minh</option>
          </select>
        </FormField>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Kết quả xác minh">
            <input value={f.ket_qua_xm || ""} onChange={(e) => s("ket_qua_xm", e.target.value)} style={inputSt} placeholder="Nhập kết quả xác minh..." />
          </FormField>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <FormField label="Ghi chú">
            <textarea value={f.ghi_chu || ""} onChange={(e) => s("ghi_chu", e.target.value)} style={textareaSt} />
          </FormField>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
        <button onClick={() => onSave(f)} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#4F46E5,#4338CA)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Lưu</button>
      </div>
    </div>
  );
}
