export default function DataTableCard({ title, toolbar, footer, children, className = '' }) {
  return (
    <div className={`data-card card border-0 shadow-sm ${className}`}>
      {(title || toolbar) && (
        <div className="data-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          {title && <span className="data-card-title">{title}</span>}
          {toolbar && <div className="data-card-toolbar">{toolbar}</div>}
        </div>
      )}
      <div className="table-responsive">{children}</div>
      {footer && <div className="data-card-footer">{footer}</div>}
    </div>
  );
}
