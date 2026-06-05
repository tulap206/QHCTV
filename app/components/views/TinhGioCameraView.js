"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TinhGioCameraView({ isMobile, currentUser }) {
  const [camName, setCamName] = useState("");
  const [realDate, setRealDate] = useState("");
  const [realTime, setRealTime] = useState("");
  const [camDate, setCamDate] = useState("");
  const [camTime, setCamTime] = useState("");

  const [convCamDate, setConvCamDate] = useState("");
  const [convCamTime, setConvCamTime] = useState("");
  const [convCamResult, setConvCamResult] = useState("");

  const [convRealDate, setConvRealDate] = useState("");
  const [convRealTime, setConvRealTime] = useState("");
  const [convRealResult, setConvRealResult] = useState("");

  const [logs, setLogs] = useState([]);
  const [copyStatus, setCopyStatus] = useState({ cam: false, real: false });
  const [dbStatus, setDbStatus] = useState("checking"); // "checking", "supabase", "local"
  const [dbError, setDbError] = useState("");

  const isAdmin = currentUser?.role === 'admin';

  // Load logs on mount
  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('camera_time_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn("Failed to fetch logs from Supabase, falling back to localStorage:", error);
        setDbStatus("local");
        setDbError(error.message || JSON.stringify(error));
        const saved = localStorage.getItem('cam_time_logs');
        if (saved) {
          setLogs(JSON.parse(saved));
        }
      } else if (data) {
        setDbStatus("supabase");
        setDbError("");
        const mapped = data.map(row => ({
          id: row.id,
          name: row.name,
          realTime: row.real_time,
          camTime: row.cam_time,
          offset: row.offset_seconds,
          convRealInput: row.conv_real_input || '',
          convRealOutput: row.conv_real_output || '',
          convCamInput: row.conv_cam_input || '',
          convCamOutput: row.conv_cam_output || ''
        }));
        setLogs(mapped);
      }
    } catch (err) {
      console.error("Error fetching logs from Supabase:", err);
      setDbStatus("local");
      setDbError(err.message || String(err));
      const saved = localStorage.getItem('cam_time_logs');
      if (saved) {
        setLogs(JSON.parse(saved));
      }
    }
  };



  useEffect(() => {
    fetchLogs();

    // Set default initial dates (today)
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;
    
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hh}:${min}:${ss}`;

    setRealDate(dateStr);
    setRealTime(timeStr);
    setCamDate(dateStr);
    setCamTime(timeStr);
  }, []);

  // Helper date parsing (DD/MM/YYYY hh:mm:ss -> Date object)
  const parseDateTime = (dStr, tStr) => {
    if (!dStr || !tStr) return null;
    const dp = dStr.split('/');
    if (dp.length !== 3) return null;
    const day = parseInt(dp[0], 10);
    const month = parseInt(dp[1], 10) - 1;
    const year = parseInt(dp[2], 10);

    const tp = tStr.split(':');
    const hr = parseInt(tp[0], 10) || 0;
    const min = parseInt(tp[1], 10) || 0;
    const sec = parseInt(tp[2], 10) || 0;

    if (!day || month < 0 || month > 11 || !year) return null;
    const date = new Date(year, month, day, hr, min, sec);
    if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== month) return null;
    return date;
  };

  const formatDate = (date) => {
    if (!date) return '--/--/---- --:--:--';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  };

  const formatDurationFriendly = (totalSeconds) => {
    const absSec = Math.abs(totalSeconds);
    const d = Math.floor(absSec / 86400);
    const h = Math.floor((absSec % 86400) / 3600);
    const m = Math.floor((absSec % 3600) / 60);
    const s = absSec % 60;
    
    let parts = [];
    if (d > 0) parts.push(`${d} ngày`);
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    if (s > 0 || parts.length === 0) parts.push(`${s} giây`);
    return parts.join(' ');
  };

  const formatDurationHHMMSS = (totalSeconds) => {
    const absSec = Math.abs(totalSeconds);
    const h = Math.floor(absSec / 3600);
    const m = Math.floor((absSec % 3600) / 60);
    const s = absSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Live calculations
  const offsetSeconds = useMemo(() => {
    const rDate = parseDateTime(realDate, realTime);
    const cDate = parseDateTime(camDate, camTime);
    if (!rDate || !cDate) return 0;
    return Math.round((cDate.getTime() - rDate.getTime()) / 1000);
  }, [realDate, realTime, camDate, camTime]);

  const isValidOffset = useMemo(() => {
    const rDate = parseDateTime(realDate, realTime);
    const cDate = parseDateTime(camDate, camTime);
    return !!(rDate && cDate);
  }, [realDate, realTime, camDate, camTime]);

  // Convert operations
  useEffect(() => {
    const cDate = parseDateTime(convCamDate, convCamTime);
    if (!cDate || !isValidOffset) {
      setConvRealResult("");
      return;
    }
    const realTimeMs = cDate.getTime() - (offsetSeconds * 1000);
    setConvRealResult(formatDate(new Date(realTimeMs)));
  }, [convCamDate, convCamTime, offsetSeconds, isValidOffset]);

  useEffect(() => {
    const rDate = parseDateTime(convRealDate, convRealTime);
    if (!rDate || !isValidOffset) {
      setConvCamResult("");
      return;
    }
    const camTimeMs = rDate.getTime() + (offsetSeconds * 1000);
    setConvCamResult(formatDate(new Date(camTimeMs)));
  }, [convRealDate, convRealTime, offsetSeconds, isValidOffset]);

  // Handlers
  const handleGetNow = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dStr = `${dd}/${mm}/${yyyy}`;
    
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const tStr = `${hh}:${min}:${ss}`;

    setRealDate(dStr);
    setRealTime(tStr);
    setCamDate(dStr);
    setCamTime(tStr);
  };

  const handleReset = () => {
    setCamName("");
    setRealDate("");
    setRealTime("");
    setCamDate("");
    setCamTime("");
    setConvCamDate("");
    setConvCamTime("");
    setConvRealDate("");
    setConvRealTime("");
  };

  const handleSaveLog = async () => {
    const rDate = parseDateTime(realDate, realTime);
    const cDate = parseDateTime(camDate, camTime);
    if (!rDate || !cDate) {
      alert("Vui lòng nhập đầy đủ và chính xác thông tin thời gian trước khi lưu!");
      return;
    }

    const convRealInputDate = parseDateTime(convRealDate, convRealTime);
    const convCamInputDate = parseDateTime(convCamDate, convCamTime);

    const logData = {
      name: camName.trim() || 'Camera không tên',
      real_time: formatDate(rDate),
      cam_time: formatDate(cDate),
      offset_seconds: offsetSeconds,
      conv_real_input: convRealInputDate ? formatDate(convRealInputDate) : null,
      conv_real_output: convRealInputDate ? convCamResult : null,
      conv_cam_input: convCamInputDate ? formatDate(convCamInputDate) : null,
      conv_cam_output: convCamInputDate ? convRealResult : null
    };

    try {
      const { error } = await supabase.from('camera_time_logs').insert([logData]);
      if (error) {
        console.warn("Failed to save log to Supabase, saving to localStorage:", error);
        const fallbackLog = {
          id: Date.now(),
          name: logData.name,
          realTime: logData.real_time,
          camTime: logData.cam_time,
          offset: logData.offset_seconds,
          convRealInput: logData.conv_real_input || '',
          convRealOutput: logData.conv_real_output || '',
          convCamInput: logData.conv_cam_input || '',
          convCamOutput: logData.conv_cam_output || ''
        };
        const newLogs = [fallbackLog, ...logs];
        setLogs(newLogs);
        localStorage.setItem('cam_time_logs', JSON.stringify(newLogs));
      } else {
        fetchLogs();
      }
    } catch (err) {
      console.error("Error saving log to Supabase:", err);
      const fallbackLog = {
        id: Date.now(),
        name: logData.name,
        realTime: logData.real_time,
        camTime: logData.cam_time,
        offset: logData.offset_seconds,
        convRealInput: logData.conv_real_input || '',
        convRealOutput: logData.conv_real_output || '',
        convCamInput: logData.conv_cam_input || '',
        convCamOutput: logData.conv_cam_output || ''
      };
      const newLogs = [fallbackLog, ...logs];
      setLogs(newLogs);
      localStorage.setItem('cam_time_logs', JSON.stringify(newLogs));
    }
  };

  const handleDeleteLog = async (id) => {
    if (!isAdmin) {
      alert("Chỉ tài khoản Quản trị viên (Admin) mới có quyền xóa nhật ký đối chiếu!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa dòng nhật ký này?")) return;

    try {
      const { error } = await supabase.from('camera_time_logs').delete().eq('id', id);
      if (error) {
        console.warn("Failed to delete log from Supabase, removing from localStorage:", error);
        const newLogs = logs.filter(l => l.id !== id);
        setLogs(newLogs);
        localStorage.setItem('cam_time_logs', JSON.stringify(newLogs));
      } else {
        fetchLogs();
      }
    } catch (err) {
      console.error("Error deleting log from Supabase:", err);
      const newLogs = logs.filter(l => l.id !== id);
      setLogs(newLogs);
      localStorage.setItem('cam_time_logs', JSON.stringify(newLogs));
    }
  };

  const handleClearLogs = async () => {
    if (!isAdmin) {
      alert("Chỉ tài khoản Quản trị viên (Admin) mới có quyền xóa nhật ký đối chiếu!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử nhật ký không?")) return;

    try {
      const { error } = await supabase.from('camera_time_logs').delete().neq('id', 0);
      if (error) {
        console.warn("Failed to clear logs from Supabase, clearing localStorage:", error);
        setLogs([]);
        localStorage.removeItem('cam_time_logs');
      } else {
        fetchLogs();
      }
    } catch (err) {
      console.error("Error clearing logs from Supabase:", err);
      setLogs([]);
      localStorage.removeItem('cam_time_logs');
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('Không có dữ liệu nhật ký để xuất!');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Tên Camera,Thời gian thực,Thời gian Camera,Độ lệch (giây),Trạng thái\n";

    logs.forEach(log => {
      let statusText = 'Đúng giờ';
      if (log.offset > 0) statusText = `Nhanh ${log.offset}s`;
      else if (log.offset < 0) statusText = `Chậm ${Math.abs(log.offset)}s`;
      
      const row = `"${log.name.replace(/"/g, '""')}","${log.realTime}","${log.camTime}",${log.offset},"${statusText}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Nhat_ky_lech_camera_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text, type) => {
    if (!text || text.includes('--')) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [type]: false }));
      }, 1000);
    });
  };

  // Date and Time inputs formatting support
  const handleDateInput = (value, setter) => {
    let val = value.replace(/[^0-9]/g, '');
    if (val.length > 4) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
    } else if (val.length > 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setter(val);
  };

  const handleTimeInput = (value, setter) => {
    let val = value.replace(/[^0-9]/g, '');
    if (val.length > 4) {
      val = val.slice(0, 2) + ':' + val.slice(2, 4) + ':' + val.slice(4, 6);
    } else if (val.length > 2) {
      val = val.slice(0, 2) + ':' + val.slice(2);
    }
    setter(val);
  };

  // Style objects
  const cardSt = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #E2E8F0",
    padding: 24,
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    marginBottom: 20
  };

  const labelSt = {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const inputSt = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    background: "#F8FAFC",
    transition: "border-color 0.2s"
  };

  const dtInputSt = {
    width: "50%",
    padding: "10px 0",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    textAlign: "center",
    fontFamily: "monospace",
    background: "#F8FAFC"
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(135deg,#DC2626,#991B1B)", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", boxShadow: "0 4px 12px rgba(220,38,38,0.3)" }}>⏱️</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", margin: 0 }}>Đối Chiếu Và Tính Giờ Lệch Camera</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Quy đổi thời gian thực tế phát sinh vụ việc và thời gian ghi nhận trên hệ thống đầu ghi</p>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 12,
              background: dbStatus === "supabase" ? "#D1FAE5" : dbStatus === "local" ? "#FEF3C7" : "#F1F5F9",
              color: dbStatus === "supabase" ? "#065F46" : dbStatus === "local" ? "#92400E" : "#64748B"
            }}>
              {dbStatus === "supabase" ? "● Supabase (Dữ liệu thật)" : dbStatus === "local" ? `● LocalStorage (Cục bộ) ${dbError ? `- Lỗi: ${dbError}` : ''}` : "● Đang kết nối..."}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 20 }}>
        {/* Left Column: Calculation configuration */}
        <div>
          <div style={cardSt}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A", marginBottom: 18, borderBottom: "1px solid #F1F5F9", paddingBottom: 10 }}>⚙️ Cấu Hình Độ Lệch</div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={labelSt}>Tên camera / vị trí lắp đặt</div>
              <input 
                type="text" 
                style={inputSt} 
                placeholder="VD: Cam 1 - Cổng chính, Cam hành trình xe,..." 
                value={camName}
                onChange={e => setCamName(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={labelSt}>
                  <span>Thời gian thực tế (Chuẩn)</span>
                  <span style={{ color: "#2563EB", cursor: "pointer", fontSize: 11, fontWeight: 700 }} onClick={handleGetNow}>Lấy hiện tại</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="DD/MM/YYYY" 
                    style={dtInputSt}
                    value={realDate}
                    onChange={e => handleDateInput(e.target.value, setRealDate)}
                  />
                  <input 
                    type="text" 
                    placeholder="hh:mm:ss" 
                    style={dtInputSt}
                    value={realTime}
                    onChange={e => handleTimeInput(e.target.value, setRealTime)}
                  />
                </div>
              </div>

              <div>
                <div style={labelSt}>Thời gian hiển thị trên Camera</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="DD/MM/YYYY" 
                    style={dtInputSt}
                    value={camDate}
                    onChange={e => handleDateInput(e.target.value, setCamDate)}
                  />
                  <input 
                    type="text" 
                    placeholder="hh:mm:ss" 
                    style={dtInputSt}
                    value={camTime}
                    onChange={e => handleTimeInput(e.target.value, setCamTime)}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Độ lệch thời gian</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: offsetSeconds === 0 ? "#10B981" : offsetSeconds > 0 ? "#EF4444" : "#F59E0B", marginTop: 4 }}>
                  {isValidOffset ? `${offsetSeconds > 0 ? '+' : ''}${formatDurationHHMMSS(offsetSeconds)}` : '--:--:--'}
                </div>
              </div>
              <div style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                background: !isValidOffset ? "#E2E8F0" : offsetSeconds === 0 ? "#D1FAE5" : offsetSeconds > 0 ? "#FEE2E2" : "#FEF3C7",
                color: !isValidOffset ? "#64748B" : offsetSeconds === 0 ? "#065F46" : offsetSeconds > 0 ? "#991B1B" : "#92400E"
              }}>
                {!isValidOffset ? "Nhập đủ thông tin" : offsetSeconds === 0 ? "Đúng giờ" : offsetSeconds > 0 ? `Nhanh ${formatDurationFriendly(offsetSeconds)}` : `Chậm ${formatDurationFriendly(offsetSeconds)}`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            <button onClick={handleSaveLog} disabled={!isValidOffset} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 8, cursor: isValidOffset ? "pointer" : "not-allowed", fontWeight: 700, opacity: isValidOffset ? 1 : 0.6 }}>Lưu vào nhật ký</button>
            <button onClick={handleReset} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #CBD5E1", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "#475569" }}>Đặt lại</button>
          </div>
        </div>

        {/* Right Column: Converter calculations */}
        <div>
          <div style={cardSt}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A", marginBottom: 18, borderBottom: "1px solid #F1F5F9", paddingBottom: 10 }}>🔄 Quy Đổi Thời Gian Nhanh</div>
            
            {/* Real to Cam */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 10 }}>Nhập giờ Thực tế xảy ra ➔ Camera chỉ mấy giờ?</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input 
                  type="text" 
                  placeholder="DD/MM/YYYY" 
                  style={{ ...dtInputSt, background: "#fff" }}
                  value={convRealDate}
                  onChange={e => handleDateInput(e.target.value, setConvRealDate)}
                />
                <input 
                  type="text" 
                  placeholder="hh:mm:ss" 
                  style={{ ...dtInputSt, background: "#fff" }}
                  value={convRealTime}
                  onChange={e => handleTimeInput(e.target.value, setConvRealTime)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #E2E8F0", paddingTop: 10 }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>Thời gian CAMERA chỉ:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#EF4444" }}>{convCamResult || '--/--/---- --:--:--'}</span>
                  {convCamResult && (
                    <button onClick={() => copyToClipboard(convCamResult, 'cam')} style={{ border: "1px solid #CBD5E1", background: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                      {copyStatus.cam ? "Đã copy!" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cam to Real */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 10 }}>Nhập giờ Camera chỉ ➔ Thực tế lúc mấy giờ?</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input 
                  type="text" 
                  placeholder="DD/MM/YYYY" 
                  style={{ ...dtInputSt, background: "#fff" }}
                  value={convCamDate}
                  onChange={e => handleDateInput(e.target.value, setConvCamDate)}
                />
                <input 
                  type="text" 
                  placeholder="hh:mm:ss" 
                  style={{ ...dtInputSt, background: "#fff" }}
                  value={convCamTime}
                  onChange={e => handleTimeInput(e.target.value, setConvCamTime)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #E2E8F0", paddingTop: 10 }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>Thời gian THỰC TẾ là:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#2563EB" }}>{convRealResult || '--/--/---- --:--:--'}</span>
                  {convRealResult && (
                    <button onClick={() => copyToClipboard(convRealResult, 'real')} style={{ border: "1px solid #CBD5E1", background: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                      {copyStatus.real ? "Đã copy!" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log section */}
      <div style={{ ...cardSt, marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #F1F5F9", paddingBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>📋 Nhật Ký Đối Chiếu Gần Đây</div>
          {logs.length > 0 && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleExportCSV} style={{ padding: "6px 12px", background: "#fff", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Xuất file CSV</button>
              {isAdmin && (
                <button onClick={handleClearLogs} style={{ padding: "6px 12px", background: "#FFF5F5", border: "1px solid #FEE2E2", color: "#DC2626", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Xóa tất cả</button>
              )}
            </div>
          )}
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 0", color: "#94A3B8", fontSize: 13 }}>Chưa có nhật ký nào được lưu</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
            {logs.map((log) => {
              const abs = Math.abs(log.offset);
              const label = log.offset === 0 ? "Đúng giờ" : log.offset > 0 ? `Nhanh ${formatDurationFriendly(abs)}` : `Chậm ${formatDurationFriendly(abs)}`;
              const labelColor = log.offset === 0 ? "#065F46" : log.offset > 0 ? "#991B1B" : "#92400E";
              const labelBg = log.offset === 0 ? "#D1FAE5" : log.offset > 0 ? "#FEE2E2" : "#FEF3C7";

              return (
                <div key={log.id} style={{ padding: 14, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", position: "relative" }}>
                  {isAdmin && (
                    <button onClick={() => handleDeleteLog(log.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button>
                  )}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1E293B" }}>{log.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, background: labelBg, color: labelColor, padding: "2px 8px", borderRadius: 20 }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.6 }}>
                    <div>• Đối chiếu: Thực tế <b>{log.realTime}</b> ➔ Camera <b>{log.camTime}</b> (lệch {log.offset > 0 ? '+' : ''}{formatDurationHHMMSS(log.offset)})</div>
                    {log.convRealInput && <div>• Quy đổi: Thực tế <b>{log.convRealInput}</b> ➔ Camera <b style={{ color: "#EF4444" }}>{log.convRealOutput}</b></div>}
                    {log.convCamInput && <div>• Quy đổi: Camera <b>{log.convCamInput}</b> ➔ Thực tế <b style={{ color: "#2563EB" }}>{log.convCamOutput}</b></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
