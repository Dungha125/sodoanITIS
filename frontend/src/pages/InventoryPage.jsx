import { useState } from 'react';
import { toast } from 'react-toastify';
import { booksApi } from '../api';
import StatusBadge from '../components/common/StatusBadge';

const CHECKLIST = [
  { key: 'missing_photo', label: 'Thiếu ảnh' },
  { key: 'missing_stamp', label: 'Thiếu dấu' },
  { key: 'missing_signature', label: 'Thiếu chữ ký' },
  { key: 'wrong_info', label: 'Sai thông tin' },
  { key: 'torn', label: 'Rách' },
  { key: 'missing_pages', label: 'Mất trang' },
];

export default function InventoryPage() {
  const [bookCode, setBookCode] = useState('');
  const [book, setBook] = useState(null);
  const [checks, setChecks] = useState({});
  const [notes, setNotes] = useState('');

  const lookup = async () => {
    if (!bookCode.trim()) return;
    try {
      const { data } = await booksApi.qrLookup(bookCode.trim());
      setBook(data);
    } catch {
      toast.error('Không tìm thấy sổ');
      setBook(null);
    }
  };

  const submit = async () => {
    if (!book) return;
    const payload = { other_notes: notes };
    CHECKLIST.forEach(({ key }) => { payload[key] = !!checks[key]; });
    try {
      const { data } = await booksApi.inventory(book.id, payload);
      toast.success(data.result === 'pass' ? 'Kiểm kê đạt' : 'Yêu cầu bổ sung');
      setBook(null);
      setChecks({});
      setNotes('');
      setBookCode('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi kiểm kê');
    }
  };

  return (
    <div>
      <h4 className="mb-4">Kiểm kê sổ</h4>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <label className="form-label">Mã sổ / QR / MSSV</label>
              <div className="d-flex gap-2 mb-3">
                <input
                  className="form-control"
                  value={bookCode}
                  onChange={(e) => setBookCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookup()}
                />
                <button className="btn btn-primary" onClick={lookup}>Tìm</button>
              </div>
              {book && (
                <div className="alert alert-info mb-0">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{book.student_name}</strong> — {book.book_code}
                      <div className="small text-muted">{book.department_name} · {book.cohort}</div>
                    </div>
                    <StatusBadge status={book.status} />
                  </div>
                  {!['REGISTERED', 'INVENTORY'].includes(book.status) && (
                    <div className="small text-warning mt-2">
                      Sổ cần ở trạng thái &quot;Đã đăng ký nộp&quot; mới kiểm kê được.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent"><strong>Checklist kiểm kê</strong></div>
            <div className="card-body">
              {CHECKLIST.map(({ key, label }) => (
                <div className="form-check mb-2" key={key}>
                  <input className="form-check-input" type="checkbox" id={key} checked={!!checks[key]} onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })} />
                  <label className="form-check-label" htmlFor={key}>{label}</label>
                </div>
              ))}
              <div className="mb-3">
                <label className="form-label">Ghi chú khác</label>
                <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button className="btn btn-primary" disabled={!book || !['REGISTERED', 'INVENTORY'].includes(book.status)} onClick={submit}>
                Hoàn tất kiểm kê
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
