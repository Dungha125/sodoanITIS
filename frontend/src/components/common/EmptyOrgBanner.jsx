import { Link } from 'react-router-dom';

export default function EmptyOrgBanner({ departments, lienChi }) {
  const noDept = departments !== undefined && departments.length === 0;
  const noLc = lienChi !== undefined && lienChi.length === 0;
  if (!noDept && !noLc) return null;
  return (
    <div className="alert alert-warning mb-4">
      <i className="bi bi-info-circle me-2"></i>
      Chưa có tổ chức. Vào menu <Link to="/organization">Tổ chức</Link> để tạo Liên chi và Chi đoàn trước khi thao tác dữ liệu.
    </div>
  );
}
