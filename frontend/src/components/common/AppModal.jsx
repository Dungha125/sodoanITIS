import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AppModal({ title, children, onClose, size = '', footer }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div className="app-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal-dialog ${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <div className="modal-content app-modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-semibold" id="app-modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Đóng" />
          </div>
          <div className="modal-body pt-3">{children}</div>
          {footer && <div className="modal-footer border-0 pt-0">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
