import moduleFields from './module_fields.json';

export const DEPARTMENTS = [
  { id: 1, name: 'Phòng PC02' },
  { id: 2, name: 'Đội 1' },
  { id: 3, name: 'Đội 2' },
  { id: 4, name: 'Đội 3' },
  { id: 5, name: 'Đội 4' }
];

export const USERS = [
  { id: 0, username: 'admin', password: 'Admin@123', name: 'Quản trị viên', cap_bac: 'Đại úy', chuc_vu: 'Admin', role: 'admin', avatar: 'AD', department: 'Phòng PC02', phone: '0912000000', email: 'admin@catp.hue.vn', avatar_img: null },
  { id: 1, username: 'htsy', password: 'admin123', name: 'Hà Thị Sỹ', cap_bac: 'Thượng tá', chuc_vu: 'Phó Trưởng Phòng', role: 'admin', avatar: 'TS', department: 'Phòng PC02', phone: '0912000001', email: 'htsy@catp.hue.vn', avatar_img: null },
  { id: 2, username: 'dvthanh', password: 'admin123', name: 'Dương Văn Thành', cap_bac: 'Trung tá', chuc_vu: 'Đội Trưởng', role: 'mod', avatar: 'VT', department: 'Đội 3', phone: '0912000002', email: 'dvthanh@catp.hue.vn', avatar_img: null },
  { id: 3, username: 'ttlong', password: 'admin123', name: 'Trương Tuấn Long', cap_bac: 'Thiếu tá', chuc_vu: 'Phó Đội Trưởng', role: 'mod', avatar: 'TL', department: 'Đội 3', phone: '0912000003', email: 'ttlong@catp.hue.vn', avatar_img: null },
  { id: 4, username: 'ltphu', password: 'admin123', name: 'Lương Thanh Phú', cap_bac: 'Trung tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'TP', department: 'Đội 3', phone: '0912000004', email: 'ltphu@catp.hue.vn', avatar_img: null },
  { id: 5, username: 'hxluong', password: 'admin123', name: 'Hồ Xuân Lương', cap_bac: 'Trung tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'XL', department: 'Đội 3', phone: '0912000005', email: 'hxluong@catp.hue.vn', avatar_img: null },
  { id: 6, username: 'cvmnguyen', password: 'admin123', name: 'Châu Văn Minh Nguyên', cap_bac: 'Thiếu tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'MN', department: 'Đội 3', phone: '0912000006', email: 'cvmnguyen@catp.hue.vn', avatar_img: null },
  { id: 7, username: 'tnvhiep', password: 'admin123', name: 'Trần Nguyễn Viết Hiệp', cap_bac: 'Đại úy', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'VH', department: 'Đội 3', phone: '0912000007', email: 'tnvhiep@catp.hue.vn', avatar_img: null },
  { id: 8, username: 'ntntien', password: 'admin123', name: 'Ngô Thời Nhật Tiến', cap_bac: 'Thượng úy', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'NT', department: 'Đội 3', phone: '0912000008', email: 'ntntien@catp.hue.vn', avatar_img: null },
  { id: 9, username: 'nxtu', password: 'admin123', name: 'Nguyễn Xuân Tú', cap_bac: 'Trung tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'XT', department: 'Đội 3', phone: '0912000009', email: 'nxtu@catp.hue.vn', avatar_img: null },
  { id: 10, username: 'dahung', password: 'admin123', name: 'Dương Anh Hùng', cap_bac: 'Trung tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'AH', department: 'Đội 3', phone: '0912000010', email: 'dahung@catp.hue.vn', avatar_img: null },
  { id: 11, username: 'nhhung', password: 'admin123', name: 'Nguyễn Hữu Hùng', cap_bac: 'Trung tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'HH', department: 'Đội 3', phone: '0912000011', email: 'nhhung@catp.hue.vn', avatar_img: null },
  { id: 12, username: 'nvđao', password: 'admin123', name: 'Nguyễn Văn Đào', cap_bac: 'Trung tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'VĐ', department: 'Đội 3', phone: '0912000012', email: 'nvđao@catp.hue.vn', avatar_img: null },
  { id: 13, username: 'tđuc', password: 'admin123', name: 'Trần Đức', cap_bac: 'Thiếu tá', chuc_vu: 'Cán Bộ', role: 'officer', avatar: 'TĐ', department: 'Đội 3', phone: '0912000013', email: 'tđuc@catp.hue.vn', avatar_img: null },
  { id: 14, username: 'lqloc', password: 'admin123', name: 'Lê Quốc Lộc', cap_bac: 'Đại úy', chuc_vu: 'Cán Bộ', role: 'mod', avatar: 'QL', department: 'Đội 3', phone: '0912000014', email: 'lqloc@catp.hue.vn', avatar_img: null },
  { id: 15, username: 'lpthinh', password: 'admin123', name: 'Lê Phúc Thịnh', cap_bac: 'Đại úy', chuc_vu: 'Cán Bộ', role: 'mod', avatar: 'PT', department: 'Đội 3', phone: '0912000015', email: 'lpthinh@catp.hue.vn', avatar_img: null },
  { id: 16, username: 'pltlap', password: 'admin123', name: 'Phan Lê Tự Lập', cap_bac: 'Đại úy', chuc_vu: 'Cán Bộ', role: 'admin', avatar: 'TL', department: 'Đội 3', phone: '0912000016', email: 'pltlap@catp.hue.vn', avatar_img: null },
  { id: 17, username: 'ndphuong', password: 'admin123', name: 'Nguyễn Đình Phương', cap_bac: 'Đại úy', chuc_vu: 'Cán Bộ', role: 'mod', avatar: 'DP', department: 'Đội 2', phone: '0912000017', email: 'ndphuong@catp.hue.vn', avatar_img: null }
];

export const SEED_DATA = {
  ...moduleFields,
  collaborators: [
    { id: 1, ma_so: 'CTV-001', nickname: 'Anh Bảy Chợ Đông Ba', address: 'Chợ Đông Ba, Phú Hòa, Huế', phone: '0905111222', managing_officer: 'Phan Lê Tự Lập', lat: 16.4682, lng: 107.5878, coverage_radius: 400, ghi_chu: 'Địa bàn hoạt động xung quanh cổng chợ', competence: 'Xuất sắc' },
    { id: 2, ma_so: 'CTV-002', nickname: 'Chú Sáu Vỹ Dạ', address: 'Phường Vỹ Dạ, TP Huế', phone: '0905333444', managing_officer: 'Dương Văn Thành', lat: 16.4695, lng: 107.6042, coverage_radius: 600, ghi_chu: 'Theo dõi các tụ điểm karaoke ven sông', competence: 'Tốt' },
    { id: 3, ma_so: 'CTV-003', nickname: 'Chị Năm An Cựu', address: 'Cầu An Cựu, TP Huế', phone: '0905555666', managing_officer: 'Trương Tuấn Long', lat: 16.4528, lng: 107.5955, coverage_radius: 300, ghi_chu: 'Địa bàn ga Huế và bến xe phía Nam', competence: 'Khá' }
  ]
};
