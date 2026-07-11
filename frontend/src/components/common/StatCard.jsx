export default function StatCard({ title, value, icon, color = 'primary', suffix = '' }) {
  return (
    <div className="col-md-4 col-6">
      <div className="stat-card card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className={`stat-card-icon-wrap ${color !== 'primary' ? `stat-${color}` : ''}`}>
            <i className={`bi ${icon}`}></i>
          </div>
          <div className="min-w-0">
            <div className="stat-card-label">{title}</div>
            <div className="stat-card-value">{value ?? 0}{suffix}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
