'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MODULES, getStatus, getDisplayTitle, UserAvatar, Modal, FormField, compressImage } from '@/app/components/shared';
import { LogoImg } from '@/app/components/LogoImg';
import LoginPage from '@/app/components/LoginPage';
import Dashboard from '@/app/components/Dashboard';
import dynamic from 'next/dynamic';

const LoadingSpinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
    <div style={{ width: '32px', height: '32px', border: '3px solid rgba(200,16,46,0.1)', borderTop: '3px solid #C8102E', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }} />
    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Đang tải giao diện...</span>
    <style>{`
      @keyframes spin-fast { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

const LogPage = dynamic(() => import('@/app/components/LogPage'), { ssr: false, loading: LoadingSpinner });
const UsersPage = dynamic(() => import('@/app/components/UsersPage'), { ssr: false, loading: LoadingSpinner });
const SaoLuuLichSuView = dynamic(() => import('@/app/components/views/SaoLuuLichSuView'), { ssr: false, loading: LoadingSpinner });
const CollaboratorView = dynamic(() => import('@/app/components/views/CollaboratorView'), { ssr: false, loading: LoadingSpinner });

// All DATE columns in each table (empty string "" must be null for Postgres DATE type)
const DATE_COLS = {
  collaborators: []
};

// Helper to package frontend mismatch fields
function sanitizeItem(table, item) {
  const dbItem = { ...item };
  if (table === "collaborators") {
    if (dbItem.lat !== undefined && dbItem.lat !== null) dbItem.lat = parseFloat(dbItem.lat) || 16.4637;
    if (dbItem.lng !== undefined && dbItem.lng !== null) dbItem.lng = parseFloat(dbItem.lng) || 107.5909;
    if (dbItem.coverage_radius !== undefined && dbItem.coverage_radius !== null) dbItem.coverage_radius = parseInt(dbItem.coverage_radius) || 500;
  }
  return dbItem;
}

// Helper to unpack fields
function deserializeItem(table, item) {
  return item;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Core collections
  const [users, setUsers] = useState([]);
  const loadUsers = async () => {
    try {
      const { data: dbUsers, error: usersErr } = await supabase.from('users').select('*');
      const { data: qhctvUsers } = await supabase.from('qhctv_users').select('*');
      if (!usersErr && dbUsers) {
        const merged = dbUsers.map(u => {
          const override = qhctvUsers?.find(qo => qo.username === u.username);
          if (override) {
            const { id, username, ...overrideFields } = override;
            return { ...u, ...overrideFields };
          }
          return u;
        });
        setUsers(merged);
      }
    } catch (e) {
      console.error("Error loading users:", e);
    }
  };
  const [departments, setDepartments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [data, setData] = useState({
    collaborators: [],
    trash_bin: []
  });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highlightUser, setHighlightUser] = useState(null);
  const [showQHDropdown, setShowQHDropdown] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resizing for responsive drawer
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recover session and load all application data in parallel on mount
  useEffect(() => {
    setIsMounted(true);

    let sessionPromiseDone = false;
    let dataPromiseDone = false;
    let loggedInUser = null;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth', { cache: 'no-store' });
        const resData = await response.json();
        if (response.ok && resData.authenticated && resData.user) {
          loggedInUser = resData.user;
          setCurrentUser(resData.user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Error verifying cookie session:", err);
        setCurrentUser(null);
      } finally {
        sessionPromiseDone = true;
        setSessionChecked(true);
        // If not logged in, end loading screen immediately to show LoginPage
        if (!loggedInUser) {
          setLoading(false);
        } else if (dataPromiseDone) {
          setLoading(false);
        }
      }
    };

    const loadAllData = async () => {
      try {
        // Fetch users
        await loadUsers();
        
        // Fetch departments
        const { data: dbDepts, error: deptsErr } = await supabase.from('departments').select('*');
        if (!deptsErr && dbDepts) setDepartments(dbDepts);
        
        // Fetch logs
        const { data: dbLogs, error: logsErr } = await supabase.from('qhctv_system_logs').select('*');
        if (!logsErr && dbLogs) setLogs(dbLogs);
        
        // Fetch the modules + trash_bin
        const tables = [
          'collaborators',
          'qhctv_trash_bin'
        ];
        
        const freshData = {};
        await Promise.all(tables.map(async (table) => {
          const { data: rows, error } = await supabase.from(table).select('*');
          if (!error && rows) {
            freshData[table] = rows.map(item => deserializeItem(table, item));
          } else {
            freshData[table] = [];
          }
        }));
        
        setData(freshData);
      } catch (err) {
        console.error("Error loading application data:", err);
      } finally {
        dataPromiseDone = true;
        if (sessionPromiseDone && loggedInUser) {
          setLoading(false);
        }
      }
    };

    // Execute session check and data fetch concurrently to eliminate waterfall lag
    checkSession();
    loadAllData();

    // Recover active page from URL or localStorage
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPage = params.get('page');
      const savedPage = localStorage.getItem('pc02_active_page');
      if (urlPage) {
        setActivePage(urlPage);
      } else if (savedPage) {
        setActivePage(savedPage);
      }
    } catch (err) {
      console.error("Error restoring active page:", err);
    }

    // Handle back/forward browser navigation
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlPage = params.get('page') || 'dashboard';
      setActivePage(urlPage);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Real-time synchronization for collaborators + trash_bin + system_logs + users + departments
  useEffect(() => {
    if (!currentUser) return;

    const tables = [
      'collaborators',
      'qhctv_trash_bin'
    ];

    const channels = tables.map((table) => {
      return supabase
        .channel(`realtime:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          
          setData((prev) => {
            const currentList = prev[table] || [];
            let updatedList = [...currentList];

            if (eventType === 'INSERT') {
              const unpacked = deserializeItem(table, newRow);
              if (!updatedList.some(item => item.id === unpacked.id)) {
                updatedList = [unpacked, ...updatedList];
              }
            } else if (eventType === 'UPDATE') {
              const unpacked = deserializeItem(table, newRow);
              updatedList = updatedList.map(item => item.id === unpacked.id ? unpacked : item);
            } else if (eventType === 'DELETE') {
              updatedList = updatedList.filter(item => item.id !== oldRow.id);
            }

            return { ...prev, [table]: updatedList };
          });
        })
        .subscribe();
    });

    // Listen for changes to users table (both users and qhctv_users local overrides)
    const usersChannel = supabase
      .channel('realtime:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadUsers();
      })
      .subscribe();

    const qhctvUsersChannel = supabase
      .channel('realtime:qhctv_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qhctv_users' }, () => {
        loadUsers();
      })
      .subscribe();

    // Listen for changes to departments
    const deptsChannel = supabase
      .channel('realtime:departments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'INSERT') {
          setDepartments(prev => prev.some(d => d.id === newRow.id) ? prev : [...prev, newRow]);
        } else if (eventType === 'UPDATE') {
          setDepartments(prev => prev.map(d => d.id === newRow.id ? newRow : d));
        } else if (eventType === 'DELETE') {
          setDepartments(prev => prev.filter(d => d.id !== oldRow.id));
        }
      })
      .subscribe();

    // Listen for system logs (to keep activity log real-time)
    const logsChannel = supabase
      .channel('realtime:qhctv_system_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qhctv_system_logs' }, (payload) => {
        const { new: newRow } = payload;
        setLogs(prev => prev.some(l => l.id === newRow.id) ? prev : [...prev, newRow]);
      })
      .subscribe();

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(deptsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [currentUser]);

  // Update session state when users list is modified and sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pc02_current_user', JSON.stringify(currentUser));
      if (users.length > 0) {
        const freshUser = users.find((u) => u.id === currentUser.id);
        if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
          setCurrentUser(freshUser);
        }
      }
    }
  }, [users, currentUser]);

  // Persist active page to localStorage and update URL
  useEffect(() => {
    try {
      if (activePage) {
        localStorage.setItem('pc02_active_page', activePage);
        const newUrl = activePage === 'dashboard' ? '/' : `/?page=${activePage}`;
        const currentUrl = window.location.search || '/';
        if (currentUrl !== (activePage === 'dashboard' ? '/' : `?page=${activePage}`)) {
          window.history.pushState(null, '', newUrl);
        }
      }
    } catch (err) {
      console.warn("Storage or URL access restricted:", err);
    }
  }, [activePage]);

  const addLog = async (action, module = "Hệ thống") => {
    const time = new Date().toISOString();
    const tempId = Math.max(0, ...logs.map(l => l.id)) + 1;
    
    let ip = "127.0.0.1";
    let browser = "Browser";
    let device = "PC";
    
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      
      // Simple parser for browser
      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) browser = "Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Edg")) browser = "Safari";
      else if (ua.includes("Edg")) browser = "Edge";
      else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
      else browser = "Browser";

      // Simple parser for device
      if (ua.includes("Mobi") || ua.includes("Android") || ua.includes("iPhone") || ua.includes("iPad")) {
        if (ua.includes("iPhone")) device = "iPhone";
        else if (ua.includes("iPad")) device = "iPad";
        else if (ua.includes("Android")) device = "Android Mobile";
        else device = "Mobile";
      } else {
        if (ua.includes("Macintosh")) device = "macOS";
        else if (ua.includes("Windows")) device = "Windows PC";
        else if (ua.includes("Linux")) device = "Linux PC";
        else device = "PC";
      }
    }

    try {
      const res = await Promise.race([
        fetch('https://api.ipify.org?format=json'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1200))
      ]).catch(() => null);
      if (res) {
        const ipData = await res.json().catch(() => null);
        if (ipData && ipData.ip) ip = ipData.ip;
      }
    } catch (e) {}

    const logEntry = {
      id: tempId,
      user_name: currentUser?.name || "Hệ thống",
      username: currentUser?.username || "system",
      ip_address: ip,
      device: device,
      browser: browser,
      action,
      module,
      time
    };
    
    // Update local state immediately
    setLogs(prev => [...prev, logEntry]);
    
    // Insert into backend asynchronously
    try {
      const { error } = await supabase.from('qhctv_system_logs').insert([{
        user_name: logEntry.user_name,
        username: logEntry.username,
        ip_address: logEntry.ip_address,
        device: logEntry.device,
        browser: logEntry.browser,
        action: logEntry.action,
        module: logEntry.module
      }]);
      if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
        // Fallback: columns don't exist in Supabase yet
        await supabase.from('qhctv_system_logs').insert([{
          user_name: logEntry.user_name,
          action: `${logEntry.action} (TK: ${logEntry.username}, IP: ${logEntry.ip_address}, Thiết bị: ${logEntry.device}, Trình duyệt: ${logEntry.browser})`,
          module: logEntry.module
        }]);
      }
    } catch (err) {
      console.error("Failed to insert log entry:", err);
    }
  };

  const handleLogin = (user) => {
    const fresh = users.find((u) => u.id === user.id) || user;
    setCurrentUser(fresh);
    addLog("Đăng nhập hệ thống (HTTP-Only Session)");
  };

  const handleLogout = async () => {
    addLog("Đăng xuất");
    setCurrentUser(null);
    try {
      localStorage.removeItem('pc02_current_user');
    } catch (e) {}
    setActivePage('dashboard');
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {
      console.error("Logout request failed:", e);
    }
  };

  const handleRestoreTrash = async (trashRecord) => {
    let originalData = {};
    try {
      originalData = typeof trashRecord.data === 'string' ? JSON.parse(trashRecord.data) : trashRecord.data;
    } catch (e) {
      console.error(e);
      alert("Lỗi khi giải nén dữ liệu đối tượng!");
      return;
    }

    const moduleKey = trashRecord.module_key;

    try {
      const sanitized = sanitizeItem(moduleKey, originalData);
      const { id, ...rest } = sanitized;
      const { data: inserted, error: insertErr } = await supabase.from(moduleKey).insert([rest]);
      if (insertErr) {
        throw insertErr;
      }
      
      await supabase.from('qhctv_trash_bin').delete().eq('id', trashRecord.id);

      const { data: freshRows } = await supabase.from(moduleKey).select('*');
      const { data: freshTrash } = await supabase.from('qhctv_trash_bin').select('*');
      
      setData(prev => ({
        ...prev,
        [moduleKey]: freshRows ? freshRows.map(item => deserializeItem(moduleKey, item)) : prev[moduleKey],
        qhctv_trash_bin: freshTrash || []
      }));

      addLog(`Khôi phục dữ liệu từ Thùng rác: ${originalData.ma_so || originalData.so_tk || originalData.so_dt || originalData.name || "bản ghi"}`, "sao_luu");
      alert("Khôi phục dữ liệu thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi khôi phục dữ liệu: " + err.message);
    }
  };

  const handleDeleteTrashPermanently = async (trashRecord) => {
    if (!window.confirm("⚠️ CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN dữ liệu này khỏi Thùng rác. Bạn có chắc chắn muốn tiếp tục?")) return;
    try {
      await supabase.from('qhctv_trash_bin').delete().eq('id', trashRecord.id);
      
      const { data: freshTrash } = await supabase.from('qhctv_trash_bin').select('*');
      setData(prev => ({ ...prev, qhctv_trash_bin: freshTrash || [] }));
      
      let itemIdent = "";
      try {
        const itemObj = typeof trashRecord.data === 'string' ? JSON.parse(trashRecord.data) : trashRecord.data;
        itemIdent = itemObj.ma_so || itemObj.so_tk || itemObj.so_dt || itemObj.name || "";
      } catch (e) {}

      addLog(`Xóa vĩnh viễn dữ liệu khỏi Thùng rác: ${itemIdent}`, "sao_luu");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa vĩnh viễn: " + err.message);
    }
  };

  const handleDataChange = async (moduleKey, newArray) => {
    // Generate missing ma_so if needed for so_dien_thoai / so_tai_khoan
    let updatedArray = [...newArray];
    if (moduleKey === 'so_dien_thoai' || moduleKey === 'so_tai_khoan') {
      let maxNum = 0;
      const prefix = moduleKey === 'so_dien_thoai' ? 'SDT' : 'STK';
      const year = new Date().getFullYear();
      updatedArray.forEach(item => {
        if (item.ma_so) {
          const m = item.ma_so.match(new RegExp(`${prefix}-\\d{4}-(\\d+)`));
          if (m) { const val = parseInt(m[1]); if (val > maxNum) maxNum = val; }
        }
      });
      updatedArray = updatedArray.map(item => {
        if (!item.ma_so) {
          maxNum++;
          return { ...item, ma_so: `${prefix}-${year}-${String(maxNum).padStart(3, "0")}` };
        }
        return item;
      });
    }

    // 1. Cập nhật state cục bộ ngay lập tức để UI phản hồi nhanh
    setData(prev => ({ ...prev, [moduleKey]: updatedArray }));

    // 2. Xác định các items đã bị xóa
    const oldArray = data[moduleKey] || [];
    const oldIds = new Set(oldArray.map(i => i.id).filter(Boolean));
    const deletedItems = oldArray.filter(oldItem => !updatedArray.some(newItem => newItem.id === oldItem.id));
    const deletedIds = deletedItems.map(item => {
      const num = Number(item.id);
      return isNaN(num) ? item.id : num;
    }).filter(id => id !== undefined && id !== null);

    // 3. Phân biệt item mới (chưa có trong DB) vs item cũ (đã có trong DB)
    const brandNewItems = updatedArray.filter(item => !item.id || !oldIds.has(item.id));
    const existingItems = updatedArray.filter(item => item.id && oldIds.has(item.id));

    try {
      // 4. Xóa các items đã bị remove
      if (deletedIds.length > 0) {
        try {
          const trashEntries = deletedItems.map(item => ({
            module_key: moduleKey,
            original_id: item.id,
            deleted_by: currentUser?.name || "Hệ thống",
            deleted_at: new Date().toISOString(),
            data: JSON.stringify(item)
          }));
          await supabase.from('qhctv_trash_bin').insert(trashEntries);
          const { data: freshTrash } = await supabase.from('qhctv_trash_bin').select('*');
          if (freshTrash) {
            setData(prev => ({ ...prev, qhctv_trash_bin: freshTrash }));
          }
        } catch (e) {
          console.error("Failed to insert into qhctv_trash_bin:", e);
        }

        const { error: deleteErr } = await supabase
          .from(moduleKey).delete().in('id', deletedIds);
        if (deleteErr) console.error(`[DELETE ERROR] ${moduleKey}:`, deleteErr);
      }

      // 5. Insert item MỚI - bỏ id tạm, để DB tự sinh ID IDENTITY
      if (brandNewItems.length > 0) {
        const toInsert = brandNewItems.map(item => {
          const sanitized = sanitizeItem(moduleKey, item);
          const { id, ...rest } = sanitized; // Bỏ id tạm
          return rest;
        });
        const { error: insertErr } = await supabase
          .from(moduleKey).insert(toInsert);
        if (insertErr) {
          console.error(`[INSERT ERROR] ${moduleKey}:`, insertErr);
          alert(`Lỗi khi lưu dữ liệu: ${insertErr.message || insertErr.code || JSON.stringify(insertErr)}`);
          // Reload để hoàn nguyên state về đúng dữ liệu DB
          const { data: rollbackRows } = await supabase.from(moduleKey).select('*');
          if (rollbackRows) setData(prev => ({ ...prev, [moduleKey]: rollbackRows.map(item => deserializeItem(moduleKey, item)) }));
          return;
        }
      }

      // 6. Update các item đã tồn tại trong DB
      if (existingItems.length > 0) {
        const toUpdate = existingItems.map(item => sanitizeItem(moduleKey, item));
        const { error: updateErr } = await supabase
          .from(moduleKey).upsert(toUpdate);
        if (updateErr) {
          console.error(`[UPDATE ERROR] ${moduleKey}:`, updateErr);
          alert(`Lỗi khi cập nhật: ${updateErr.message || updateErr.code || JSON.stringify(updateErr)}`);
          const { data: rollbackRows } = await supabase.from(moduleKey).select('*');
          if (rollbackRows) setData(prev => ({ ...prev, [moduleKey]: rollbackRows.map(item => deserializeItem(moduleKey, item)) }));
          return;
        }
      }

      // 7. Reload lại từ DB để lấy ID thật và đồng bộ state
      const { data: freshRows, error: reloadErr } = await supabase
        .from(moduleKey).select('*');
      if (!reloadErr && freshRows) {
        const deserialized = freshRows.map(item => deserializeItem(moduleKey, item));
        setData(prev => ({ ...prev, [moduleKey]: deserialized }));
      }
    } catch (err) {
      console.error(`[EXCEPTION] data sync for ${moduleKey}:`, err);
    }
  };

  const handleRestore = async (payload) => {
    try {
      // 1. Restore departments
      if (payload.departments && Array.isArray(payload.departments) && payload.departments.length > 0) {
        await supabase.from('departments').delete().neq('id', -1);
        await supabase.from('departments').insert(payload.departments);
      }
      
      // 2. Restore users
      if (payload.users && Array.isArray(payload.users) && payload.users.length > 0) {
        await supabase.from('qhctv_users').delete().neq('id', -1);
        await supabase.from('qhctv_users').insert(payload.users);
      }
      
      // 3. Restore system_logs (mapped from payload.logs or payload.system_logs)
      const logList = payload.logs || payload.system_logs;
      if (logList && Array.isArray(logList) && logList.length > 0) {
        await supabase.from('qhctv_system_logs').delete().neq('id', -1);
        const formattedLogs = logList.map(l => ({
          user_name: l.user || l.user_name || "Hệ thống",
          action: l.action,
          module: l.module,
          time: l.time
        }));
        await supabase.from('qhctv_system_logs').insert(formattedLogs);
      }
      
      // 4. Restore the collaborators dataset
      const tables = ['collaborators'];
      
      for (const table of tables) {
        if (payload.data && payload.data[table] && Array.isArray(payload.data[table]) && payload.data[table].length > 0) {
          await supabase.from(table).delete().neq('id', -1);
          
          const itemsToInsert = payload.data[table].map(item => {
            return sanitizeItem(table, { ...item });
          });

          await supabase.from(table).insert(itemsToInsert);
        }
      }
      return true;
    } catch (err) {
      console.error("Error during restore operation:", err);
      throw err;
    }
  };

  // Nav Items definition matching the original app sidebar links
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Tổng quan" },
    { id: "collaborators", icon: "👥", label: "Quản lý CTV" },
    { id: "sao_luu_ls", icon: "🗂️", label: "Lịch sử - Sao lưu" }
  ];

  // Calculate high priority metrics for top alerts bar
  const { qh, sh, allQHItems } = useMemo(() => {
    let qhCount = 0;
    let shCount = 0;
    const qhList = [];
    const pageMap = { 
      so_dien_thoai: "so_dt_tk", 
      so_tai_khoan: "so_dt_tk", 
      truy_na: "truy_na_tim", 
      truy_tim: "truy_na_tim", 
      vu_viec: "dashboard" 
    };

    MODULES.forEach((m) => {
      // Find items in underlying datasets
      let items = [];
      if (m.id === "truy_na_tim") {
        items = [...(data.truy_na || []), ...(data.truy_tim || [])];
      } else if (m.id === "so_dt_tk") {
        items = [...(data.so_dien_thoai || []), ...(data.so_tai_khoan || [])];
      } else {
        items = data[m.id] || [];
      }

      items.forEach((item) => {
        let s;
        const statusVal = item.status || item.trang_thai_dt || item.trang_thai;
        if (m.id === "vu_an") {
          const isNotHienHanhOrSuspended = item.trang_thai_an && !["hien_hanh", "tam_dinh_chi"].includes(item.trang_thai_an);
          if (isNotHienHanhOrSuspended) return;
          s = getStatus(item.deadline, statusVal, item.thoi_hieu, item.trang_thai_an);
        } else if (m.id === "tin_bao") {
          s = getStatus(item.deadline, statusVal, item.thoi_hieu, null, item.trang_thai_tin);
        } else {
          s = getStatus(item.deadline, statusVal);
        }
        
        if (s === "qua_han") {
          qhCount++;
          qhList.push({ 
            ...item, 
            _mod: m, 
            _page: pageMap[m.id] || m.id 
          });
        }
        if (s === "sap_het_han") {
          shCount++;
        }
      });
    });

    return { qh: qhCount, sh: shCount, allQHItems: qhList };
  }, [data]);

  // Loading state placeholder or SSR hydration guard
  if (!isMounted || !sessionChecked || (currentUser && loading)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(135deg, #0C1220 0%, #0F172A 50%, #0C1A30 100%)" }}>
        {/* Logo */}
        <div style={{ marginBottom: 22, animation: "spin-slow 8s linear infinite" }}>
          <img
            src="/images/logo_cshs.jpg"
            alt="Logo Cảnh Sát Hình Sự"
            style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 32px rgba(200,16,46,0.45), 0 0 64px rgba(200,16,46,0.15)", border: "3px solid rgba(200,16,46,0.5)" }}
          />
        </div>

        {/* Text block */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 1.5, textTransform: "uppercase", textShadow: "0 2px 12px rgba(200,16,46,0.4)" }}>
            PC02APP
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#FBBF24", marginTop: 6, letterSpacing: 0.5 }}>
            Phần mềm quản lý công việc
          </div>
        </div>

        {/* Spinner + loading text */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #C8102E", borderRadius: "50%", animation: "spin 0.85s linear infinite" }} />
          <div style={{ fontSize: 12, color: "#64748B", letterSpacing: 0.3 }}>Đang tải cấu hình hệ thống...</div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes spin-slow { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Enforce authentication view
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F1F5F9" }}>
      {/* Backdrop overlay for mobile drawer */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            transition: "opacity 0.25s ease"
          }}
        />
      )}

      {/* Sidebar navigation */}
      <div 
        style={{ 
          width: isMobile ? 262 : (sidebarOpen ? 262 : 62), 
          position: isMobile ? "fixed" : "relative",
          left: isMobile ? (sidebarOpen ? 0 : -262) : 0,
          top: 0,
          bottom: 0,
          height: isMobile ? "100vh" : "auto",
          background: "linear-gradient(180deg,#0C1220 0%,#111827 60%,#0C1220 100%)", 
          flexShrink: 0, 
          display: "flex", 
          flexDirection: "column", 
          transition: "width 0.25s ease, left 0.25s ease", 
          overflow: "hidden", 
          boxShadow: "2px 0 16px rgba(0,0,0,0.18)",
          zIndex: 1000
        }}
      >
        {/* Sidebar brand header */}
        <div style={{ padding: sidebarOpen ? "14px 13px 12px" : "14px 9px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flexShrink: 0 }}>
            <LogoImg size={sidebarOpen ? 36 : 30} />
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 12.5, letterSpacing: 0.5, lineHeight: 1.3 }}>PC02APP</div>
              <div style={{ color: "#FBBF24", fontSize: 9, fontWeight: 700, marginTop: 2, letterSpacing: 0.3 }}>QUẢN LÝ CÔNG VIỆC - PC02</div>
              <div style={{ color: "#475569", fontSize: 8.5, marginTop: 1 }}>Công an Thành phố Huế</div>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen((p) => !p)} 
            style={{ 
              background: "rgba(255,255,255,0.08)", 
              border: "none", 
              borderRadius: 7, 
              color: "#94A3B8", 
              cursor: "pointer", 
              width: 26, 
              height: 26, 
              fontSize: 11, 
              flexShrink: 0, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Navigation list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "9px 5px" }}>
          {navItems.map((item, i) => {
            if (item.id.startsWith("sep")) {
              return <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "5px 8px" }} />;
            }
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                className="nav-btn"
                style={{ 
                  width: "100%", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 9, 
                  padding: sidebarOpen ? "8px 11px" : "9px", 
                  borderRadius: 9, 
                  border: "none", 
                  background: isActive ? "rgba(200,16,46,0.22)" : "transparent", 
                  color: isActive ? "#FCA5A5" : "#94A3B8", 
                  cursor: "pointer", 
                  fontSize: 12.5, 
                  fontWeight: isActive ? 700 : 500, 
                  textAlign: "left", 
                  marginBottom: 2, 
                  whiteSpace: "nowrap", 
                  overflow: "hidden" 
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
                {isActive && sidebarOpen && (
                  <div style={{ width: 3, height: 16, background: "#C8102E", borderRadius: 2, marginLeft: "auto", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Profile and log out footer */}
        <div style={{ padding: "9px 5px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div 
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 11px", marginBottom: 5, cursor: "pointer" }} 
            onClick={() => {
              setShowProfileEdit(true);
              if (isMobile) setSidebarOpen(false);
            }}
          >
            <UserAvatar user={currentUser} size={30} />
            {sidebarOpen && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#fff", fontSize: 11.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser.cap_bac} {currentUser.name}
                </div>
                <div style={{ color: "#475569", fontSize: 10.5 }}>
                  {currentUser.role === "admin" ? "Admin" : currentUser.role === "mod" ? "Kiểm duyệt" : currentUser.role === "officer" ? "Cán bộ" : "Xem"}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              width: "100%", 
              padding: "7px 11px", 
              background: "rgba(239,68,68,0.12)", 
              border: "none", 
              borderRadius: 8, 
              color: "#F87171", 
              cursor: "pointer", 
              fontSize: 12, 
              fontWeight: 700, 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              justifyContent: sidebarOpen ? "flex-start" : "center" 
            }}
          >
            <span>🚪</span>
            {sidebarOpen && "Đăng xuất"}
          </button>
          
          {sidebarOpen && (
            <div style={{ padding: "10px 14px 0", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.15)", marginTop: 8 }}>
              <div style={{ textAlign: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 10, color: "#64748B", fontStyle: "italic" }}>
                  © Copyright by Phan Lê Tự Lập
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top menu bar */}
        <div 
          style={{ 
            background: "#fff", 
            borderBottom: "1px solid #E5E7EB", 
            padding: isMobile ? "8px 12px" : "8px 24px", 
            display: "flex", 
            alignItems: "center", 
            gap: 10, 
            justifyContent: "space-between", 
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)", 
            position: "relative", 
            zIndex: 500 
          }}
        >
          {/* Hamburger menu for mobile */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(p => !p)}
              style={{
                background: "rgba(0,0,0,0.05)",
                border: "none",
                borderRadius: 8,
                color: "#1E293B",
                cursor: "pointer",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0
              }}
            >
              ☰
            </button>
          )}

          {/* Quick brand header for mobile */}
          {isMobile && (
            <div style={{ marginRight: "auto" }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#1E293B" }}>PC02 HUẾ</div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            {/* Overdue alerts */}
          {qh > 0 && (
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setShowQHDropdown((p) => !p)} 
                className="alert-badge" 
                style={{ 
                  background: showQHDropdown ? "#DC2626" : "linear-gradient(135deg,#FEF2F2,#FEE2E2)", 
                  border: "1px solid #FECACA", 
                  color: showQHDropdown ? "#fff" : "#DC2626", 
                  padding: "5px 13px", 
                  borderRadius: 20, 
                  fontSize: 12, 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6, 
                  transition: "all 0.15s" 
                }}
              >
                🚨 {qh} quá hạn
                <span style={{ fontSize: 10, opacity: 0.7 }}>{showQHDropdown ? "▲" : "▼"}</span>
              </button>
              
              {showQHDropdown && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 499 }} onClick={() => setShowQHDropdown(false)} />
                  <div 
                    style={{ 
                      position: "absolute", 
                      right: 0, 
                      top: "calc(100% + 8px)", 
                      width: 400, 
                      background: "#fff", 
                      borderRadius: 14, 
                      boxShadow: "0 8px 32px rgba(0,0,0,0.18)", 
                      border: "1px solid #E2E8F0", 
                      zIndex: 500, 
                      overflow: "hidden" 
                    }}
                  >
                    <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#7F1D1D,#DC2626)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>🚨 Danh sách hồ sơ quá hạn</span>
                      <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "1px 9px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {allQHItems.length}
                      </span>
                    </div>
                    
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {allQHItems.length === 0 ? (
                        <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Không có hồ sơ quá hạn</div>
                      ) : (
                        allQHItems.map((item, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              setActivePage(item._page);
                              setSelectedRecord(item);
                              setShowQHDropdown(false);
                            }} 
                            style={{ 
                              padding: "10px 16px", 
                              borderBottom: "1px solid #F8FAFC", 
                              display: "flex", 
                              gap: 10, 
                              alignItems: "center", 
                              cursor: "pointer", 
                              transition: "background 0.15s" 
                            }}
                            className="item-hover"
                          >
                            <div style={{ width: 28, height: 28, background: item._mod.color + "18", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                              {item._mod.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {getDisplayTitle(item, item._mod.id)}
                              </div>
                              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1, display: "flex", gap: 8 }}>
                                <span style={{ background: item._mod.color + "18", color: item._mod.color, padding: "0 6px", borderRadius: 6, fontWeight: 600 }}>
                                  {item._mod.label}
                                </span>
                                {item.deadline && <span>Hạn: {item.deadline}</span>}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 7px", borderRadius: 8, flexShrink: 0, whiteSpace: "nowrap" }}>
                              Quá hạn
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ padding: "8px 16px", background: "#FAFBFC", borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
                      Nhấn vào dòng để chuyển đến mục xử lý
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Warning state alerts */}
          {sh > 0 && (
            <div className="alert-badge" style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "1px solid #FDE68A", color: "#B45309", padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              ⏳ {sh} sắp hết
            </div>
          )}

          {/* Current Date string */}
          {!isMobile && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
          )}
          </div>
        </div>

        {/* View container panel */}
        <div className="page-content" style={{ flex: 1, padding: isMobile ? "12px" : "22px", overflowY: "auto" }}>
          {activePage === "dashboard" && <Dashboard data={data} users={users} setActivePage={setActivePage} setSelectedRecord={setSelectedRecord} isMobile={isMobile} />}
          {activePage === "collaborators" && (
            <CollaboratorView 
              data={data} 
              onDataChange={handleDataChange} 
              currentUser={currentUser} 
              addLog={addLog} 
              users={users} 
              selectedRecord={selectedRecord} 
              clearSelectedRecord={() => setSelectedRecord(null)} 
              isMobile={isMobile} 
            />
          )}
          {activePage === "users" && (
            <UsersPage 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
              data={data} 
              users={users} 
              setUsers={setUsers} 
              departments={departments} 
              setDepartments={setDepartments} 
              addLog={addLog} 
              highlightUser={highlightUser} 
              setHighlightUser={setHighlightUser} 
              isMobile={isMobile}
            />
          )}
          {activePage === "sao_luu_ls" && <SaoLuuLichSuView data={data} users={users} logs={logs} setLogs={setLogs} departments={departments} addLog={addLog} currentUser={currentUser} onRestore={handleRestore} isMobile={isMobile} onRestoreTrash={handleRestoreTrash} onDeleteTrash={handleDeleteTrashPermanently} />}
        </div>
      </div>

      {showProfileEdit && (
        <ProfileEditModal 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setUsers={setUsers}
          addLog={addLog}
          onClose={() => setShowProfileEdit(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function ProfileEditModal({ currentUser, setCurrentUser, setUsers, addLog, onClose, isMobile }) {
  const [f, setF] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
    avatar_img: currentUser?.avatar_img || "",
    cap_bac: currentUser?.cap_bac || "",
    chuc_vu: currentUser?.chuc_vu || "",
    department: currentUser?.department || "",
    role: currentUser?.role || "",
    username: currentUser?.username || ""
  });
  const [newPassword, setNewPassword] = useState("");
  const [showConfirmOldPw, setShowConfirmOldPw] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const fileRef = useRef();

  const handleAvatar = async e => {
    const file = e.target.files[0]; 
    if (!file) return;
    try {
      const compressed = await compressImage(file, 150, 150, 0.7);
      setF(p => ({ ...p, avatar_img: compressed }));
    } catch (err) {
      console.error("Lỗi nén ảnh:", err);
      alert("Không thể nén ảnh: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!f.name.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên!");
      return;
    }
    
    if (newPassword.trim()) {
      setShowConfirmOldPw(true);
    } else {
      await saveUserData(null);
    }
  };

  const saveUserData = async (newPwToSave) => {
    try {
      const updatedData = {
        name: f.name,
        phone: f.phone,
        email: f.email,
        avatar_img: f.avatar_img
      };
      
      if (newPwToSave) {
        updatedData.password = newPwToSave;
      }

      const { error } = await supabase
        .from('qhctv_users')
        .update(updatedData)
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update in user list state
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updatedData } : u));
      
      // Add log
      if (addLog) {
        await addLog("Cập nhật thông tin cá nhân", "Cán bộ");
      }

      if (newPwToSave) {
        alert("Đổi mật khẩu thành công! Bạn sẽ bị đăng xuất.");
        localStorage.removeItem('pc02_current_user');
        setCurrentUser(null);
      } else {
        const newCurrentUser = { ...currentUser, ...updatedData };
        setCurrentUser(newCurrentUser);
        localStorage.setItem('pc02_current_user', JSON.stringify(newCurrentUser));
        alert("Cập nhật thông tin thành công!");
      }
      
      onClose();
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      alert("Lỗi khi cập nhật thông tin: " + err.message);
    }
  };

  const handleConfirmOldPassword = () => {
    if (oldPassword !== currentUser.password) {
      alert("Mật khẩu cũ không chính xác!");
      return;
    }
    saveUserData(newPassword);
  };

  const inputSt = { 
    width: "100%", 
    padding: "9px 12px", 
    border: "1px solid #D1D5DB", 
    borderRadius: 8, 
    fontSize: 14, 
    outline: "none", 
    boxSizing: "border-box" 
  };

  return (
    <>
      <Modal title="✏️ Sửa thông tin tài khoản" onClose={onClose} wide>
        <div style={{ display: "flex", gap: 18, marginBottom: 16, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 90 }}>
            <div
              style={{ width: 80, height: 80, borderRadius: "50%", background: "#F1F5F9", border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}
            >
              {f.avatar_img ? (
                <img src={f.avatar_img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar Preview" />
              ) : (
                <UserAvatar user={{ ...currentUser, avatar_img: f.avatar_img }} size={80} />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
            <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: "4px 10px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 600 }}>📷 Chọn ảnh</button>
            {f.avatar_img && <button type="button" onClick={() => setF(p => ({ ...p, avatar_img: "" }))} style={{ padding: "3px 8px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 10 }}>✕ Xóa ảnh</button>}
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 14px", minWidth: 240, width: "100%" }}>
            <FormField label="Họ và tên" required>
              <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} style={inputSt} />
            </FormField>
            <FormField label="Tên đăng nhập (không thể đổi)">
              <input value={f.username} style={inputSt} disabled />
            </FormField>
            <FormField label="Số điện thoại">
              <input value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value }))} style={inputSt} />
            </FormField>
            <FormField label="Email">
              <input value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} style={inputSt} />
            </FormField>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 14px" }}>
          <FormField label="Cấp bậc (không thể đổi)">
            <input value={f.cap_bac} style={inputSt} disabled />
          </FormField>
          <FormField label="Chức vụ (không thể đổi)">
            <input value={f.chuc_vu} style={inputSt} disabled />
          </FormField>
          <FormField label="Đơn vị (không thể đổi)">
            <input value={f.department} style={inputSt} disabled />
          </FormField>
          <FormField label="Mật khẩu mới (để trống = giữ nguyên)">
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputSt} placeholder="Mật khẩu mới..." />
          </FormField>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
          <button
            onClick={handleSave}
            style={{ padding: "10px 24px", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
          >
            💾 Lưu
          </button>
        </div>
      </Modal>

      {showConfirmOldPw && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 14px", textAlign: "center" }}>🔑 Xác nhận mật khẩu cũ</h3>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 16px", textAlign: "center" }}>
              Để đổi mật khẩu, vui lòng nhập lại mật khẩu hiện tại của bạn.
            </p>
            <div style={{ marginBottom: 20 }}>
              <input
                type="password"
                placeholder="Mật khẩu cũ..."
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                style={{ ...inputSt, textAlign: "center" }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => {
                  setShowConfirmOldPw(false);
                  setOldPassword("");
                }} 
                style={{ flex: 1, padding: "10px", border: "1px solid #D1D5DB", borderRadius: 10, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmOldPassword} 
                style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
