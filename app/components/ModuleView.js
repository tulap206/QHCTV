import React, { useState, useMemo } from 'react';
import { MODULES, StatusBadge, PriorityBadge, getStatus, getDisplayTitle, Modal } from './shared';
import RecordForm from './RecordForm';

const VU_VIEC_FIELDS = [
  { key: "ma_so", label: "Mã số", required: true },
  { key: "tieu_de", label: "Tiêu đề", required: true },
  { key: "loai", label: "Loại vụ việc" },
  { key: "ngay_tiep_nhan", label: "Ngày tiếp nhận", type: "date" },
  { key: "deadline", label: "Hạn giải quyết", type: "date" },
  { key: "phu_trach", label: "Phụ trách" },
  { key: "priority", label: "Ưu tiên", type: "priority" },
  { key: "ghi_chu", label: "Ghi chú", type: "textarea" }
];

const inputSt = { 
  width: "100%", 
  padding: "9px 12px", 
  border: "1px solid #D1D5DB", 
  borderRadius: 8, 
  fontSize: 14, 
  outline: "none", 
  boxSizing: "border-box" 
};

const selectSt = { 
  ...inputSt, 
  background: "#fff" 
};

export default function ModuleView({ moduleId, data, onDataChange, currentUser, addLog }) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const items = data[moduleId] || [];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const canEdit = currentUser.role !== "viewer";

  const filtered = useMemo(() => items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || Object.values(item).some((v) => String(v).toLowerCase().includes(q));
    const itemStatus = getStatus(item.deadline, item.status);
    const matchesStatus = filterStatus === "all" || itemStatus === filterStatus;
    return matchesSearch && matchesStatus;
  }), [items, search, filterStatus]);

  const handleSave = (form) => {
    let nd;
    if (editItem) {
      nd = items.map((i) => i.id === editItem.id ? { ...form, id: editItem.id } : i);
      addLog(`Cập nhật ${mod.label}: ${getDisplayTitle(form, moduleId)}`);
    } else {
      const id = Math.max(0, ...items.map((i) => i.id)) + 1;
      nd = [...items, { ...form, id }];
      addLog(`Thêm mới ${mod.label}: ${getDisplayTitle(form, moduleId)}`);
    }
    onDataChange(moduleId, nd);
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Xóa "${getDisplayTitle(item, moduleId)}"?`)) return;
    onDataChange(moduleId, items.filter((i) => i.id !== item.id));
    addLog(`Xóa ${mod.label}: ${getDisplayTitle(item, moduleId)}`);
  };

  const fields = moduleId === "vu_viec" ? VU_VIEC_FIELDS : [];
  const cols = fields.filter((f) => f.key !== "ghi_chu").slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{mod.icon} {mod.label}</h2>
        {canEdit && (
          <button 
            onClick={() => {
              setEditItem(null);
              setShowModal(true);
            }} 
            style={{ 
              padding: "9px 18px", 
              background: "#3B82F6", 
              color: "#fff", 
              border: "none", 
              borderRadius: 10, 
              cursor: "pointer", 
              fontWeight: 700 
            }}
          >
            + Thêm mới
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="🔍 Tìm kiếm..." 
          style={{ ...inputSt, maxWidth: 300, flex: 1 }} 
        />
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          style={{ ...selectSt, maxWidth: 200 }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="dang_lam">Đang làm</option>
          <option value="sap_het_han">Sắp hết hạn</option>
          <option value="qua_han">Quá hạn</option>
          <option value="hoan_thanh">Hoàn thành</option>
        </select>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 550 }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {cols.map((c) => (
                  <th key={c.key} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {c.label}
                  </th>
                ))}
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                  Trạng Thái
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 2} style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className="row-hover" 
                    style={{ borderTop: "1px solid #F3F4F6", background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}
                  >
                    {cols.map((c) => (
                      <td key={c.key} style={{ padding: "12px 16px", fontSize: 13, color: "#374151", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.type === "priority" ? (
                          <PriorityBadge priority={item[c.key]} />
                        ) : (
                          item[c.key] || "—"
                        )}
                      </td>
                    ))}
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge deadline={item.deadline} statusOverride={item.status} />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button 
                        onClick={() => setViewItem(item)} 
                        style={{ border: "none", background: "#EFF6FF", color: "#3B82F6", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 4 }}
                      >
                        Xem
                      </button>
                      {canEdit && (
                        <button 
                          onClick={() => {
                            setEditItem(item);
                            setShowModal(true);
                          }} 
                          style={{ border: "none", background: "#FEF3C7", color: "#D97706", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 4 }}
                        >
                          Sửa
                        </button>
                      )}
                      {currentUser?.role === 'admin' && (
                        <button 
                          onClick={() => handleDelete(item)} 
                          style={{ border: "none", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ padding: "8px 16px", borderTop: "1px solid #F3F4F6", fontSize: 12, color: "#9CA3AF" }}>
        Hiển thị {filtered.length}/{items.length} bản ghi
      </div>

      {showModal && (
        <Modal 
          title={editItem ? `Chỉnh sửa ${mod.label}` : `Thêm mới ${mod.label}`} 
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
        >
          <RecordForm 
            moduleId={moduleId} 
            initial={editItem} 
            onSave={handleSave} 
            onClose={() => {
              setShowModal(false);
              setEditItem(null);
            }} 
          />
        </Modal>
      )}

      {viewItem && (
        <Modal title={`Chi tiết: ${getDisplayTitle(viewItem, moduleId)}`} onClose={() => setViewItem(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map((f) => (
              <div key={f.key} style={{ gridColumn: f.type === "textarea" ? "1/-1" : "auto" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 14, color: "#111827", padding: "8px 12px", background: "#F9FAFB", borderRadius: 8 }}>
                  {f.type === "priority" ? (
                    <PriorityBadge priority={viewItem[f.key]} />
                  ) : (
                    viewItem[f.key] || "—"
                  )}
                </div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>
                Trạng thái
              </div>
              <div style={{ padding: "8px 12px", background: "#F9FAFB", borderRadius: 8 }}>
                <StatusBadge deadline={viewItem.deadline} statusOverride={viewItem.status} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
