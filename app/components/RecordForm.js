import React, { useState } from 'react';
import { FormField } from './shared';

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

const textareaSt = { 
  ...inputSt, 
  resize: "vertical", 
  minHeight: 80 
};

export default function RecordForm({ moduleId, initial, onSave, onClose }) {
  const fields = moduleId === "vu_viec" ? VU_VIEC_FIELDS : [];
  
  const [form, setForm] = useState(() => {
    const b = { status: "dang_xu_ly", priority: "trung_binh" };
    fields.forEach((f) => b[f.key] = "");
    return initial ? { ...b, ...initial } : b;
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        {fields.map((f) => (
          <div key={f.key} style={{ gridColumn: f.type === "textarea" ? "1/-1" : "auto" }}>
            <FormField label={f.label} required={f.required}>
              {f.type === "textarea" ? (
                <textarea 
                  value={form[f.key] || ""} 
                  onChange={(e) => set(f.key, e.target.value)} 
                  style={textareaSt} 
                />
              ) : f.type === "priority" ? (
                <select 
                  value={form[f.key] || "trung_binh"} 
                  onChange={(e) => set(f.key, e.target.value)} 
                  style={selectSt}
                >
                  <option value="cao">Cao</option>
                  <option value="trung_binh">Trung Bình</option>
                  <option value="thap">Thấp</option>
                </select>
              ) : (
                <input 
                  type={f.type || "text"} 
                  value={form[f.key] || ""} 
                  onChange={(e) => set(f.key, e.target.value)} 
                  style={inputSt} 
                />
              )}
            </FormField>
          </div>
        ))}
        
        <div>
          <FormField label="Trạng thái">
            <select 
              value={form.status || "dang_xu_ly"} 
              onChange={(e) => set("status", e.target.value)} 
              style={selectSt}
            >
              <option value="dang_xu_ly">Đang xử lý</option>
              <option value="hoan_thanh">Hoàn thành</option>
            </select>
          </FormField>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button 
          onClick={onClose} 
          style={{ 
            padding: "10px 20px", 
            border: "1px solid #D1D5DB", 
            borderRadius: 8, 
            background: "#fff", 
            cursor: "pointer", 
            fontWeight: 600 
          }}
        >
          Hủy
        </button>
        <button 
          onClick={() => onSave(form)} 
          style={{ 
            padding: "10px 24px", 
            background: "#3B82F6", 
            color: "#fff", 
            border: "none", 
            borderRadius: 8, 
            cursor: "pointer", 
            fontWeight: 700 
          }}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
