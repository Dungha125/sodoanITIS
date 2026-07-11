export default function EmptyState({ icon = 'bi-inbox', title = 'Chưa có dữ liệu', description }) {
  return (
    <div className="empty-state text-center py-5 px-3">
      <div className="empty-state-icon-wrap">
        <i className={`bi ${icon}`}></i>
      </div>
      <p className="empty-state-title mb-0">{title}</p>
      {description && <p className="empty-state-desc mb-0">{description}</p>}
    </div>
  );
}
