export default function AppModal({ title, children, onClose, size = '', footer }) {
  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div className={`modal-dialog ${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content app-modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-semibold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Đóng"></button>
          </div>
          <div className="modal-body pt-3">{children}</div>
          {footer && <div className="modal-footer border-0 pt-0">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
