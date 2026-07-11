export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle mb-0">{subtitle}</p>}
      </div>
      {children && <div className="page-actions d-flex flex-wrap align-items-center gap-2">{children}</div>}
    </div>
  );
}
