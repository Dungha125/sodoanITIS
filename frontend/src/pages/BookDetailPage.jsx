import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { booksApi, campaignsApi } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import PermissionGate from '../components/common/PermissionGate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BOOK_STATUSES } from '../utils/constants';

export default function BookDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: book, isLoading, isError } = useQuery({
    queryKey: ['book', id],
    queryFn: () => booksApi.get(id).then((r) => r.data),
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list().then((r) => r.data),
  });

  const activeCampaigns = (campaigns || []).filter((c) => c.status === 'active');

  const statusMut = useMutation({
    mutationFn: ({ toStatus, note }) => booksApi.changeStatus(id, { to_status: toStatus, note }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công');
      qc.invalidateQueries(['book', id]);
      qc.invalidateQueries(['books']);
    },
    onError: (e) => toast.error(e.response?.data?.detail?.message || e.response?.data?.detail || 'Lỗi'),
  });

  const registerMut = useMutation({
    mutationFn: (campaignId) => campaignsApi.register({ campaign_id: campaignId, book_id: +id }),
    onSuccess: () => {
      toast.success('Đăng ký nộp thành công');
      qc.invalidateQueries(['book', id]);
      qc.invalidateQueries(['books']);
      qc.invalidateQueries(['campaigns']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi đăng ký'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !book) {
    return (
      <div className="alert alert-danger">
        Không tìm thấy sổ. <Link to="/books">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Chi tiết sổ <code>{book.book_code}</code></h4>
        <StatusBadge status={book.status} />
      </div>

      <div className="row g-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent"><strong>Thông tin sổ</strong></div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6"><label className="text-muted small">MSSV</label><div>{book.student_mssv}</div></div>
                <div className="col-md-6"><label className="text-muted small">Họ tên</label><div>{book.student_name}</div></div>
                <div className="col-md-6"><label className="text-muted small">Chi đoàn</label><div>{book.department_name}</div></div>
                <div className="col-md-6"><label className="text-muted small">Khóa</label><div>{book.cohort}</div></div>
                <div className="col-md-6"><label className="text-muted small">Mã QR</label><div><code>{book.qr_code}</code></div></div>
                <div className="col-md-6"><label className="text-muted small">Barcode</label><div><code>{book.barcode}</code></div></div>
              </div>
            </div>
          </div>

          <PermissionGate permission="books.manage">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent"><strong>Thao tác nghiệp vụ</strong></div>
              <div className="card-body d-flex flex-wrap gap-2">
                {book.status === 'AT_CHI_DOAN' && activeCampaigns.length > 0 && (
                  <div className="w-100">
                    <label className="form-label small text-muted">Đăng ký nộp vào đợt thu</label>
                    <div className="d-flex flex-wrap gap-2">
                      {activeCampaigns.map((c) => (
                        <button key={c.id} className="btn btn-sm btn-primary" disabled={registerMut.isPending} onClick={() => registerMut.mutate(c.id)}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {book.status === 'AT_CHI_DOAN' && !activeCampaigns.length && (
                  <span className="text-muted small">Chưa có đợt thu đang mở — tạo đợt thu trước khi đăng ký nộp.</span>
                )}
                {book.status === 'REGISTERED' && (
                  <Link to="/inventory" className="btn btn-sm btn-primary">Chuyển sang kiểm kê</Link>
                )}
                {book.status === 'INVENTORY_DONE' && (
                  <button className="btn btn-sm btn-success" onClick={() => statusMut.mutate({ toStatus: 'HANDED_OVER', note: 'Bàn giao sổ' })}>
                    Xác nhận bàn giao
                  </button>
                )}
                {book.status === 'HANDED_OVER' && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => statusMut.mutate({ toStatus: 'AT_CHI_DOAN', note: 'Trả về chi đoàn' })}>
                    Trả về Chi đoàn
                  </button>
                )}
                {book.status === 'NEED_SUPPLEMENT' && (
                  <>
                    <span className="text-warning small w-100"><i className="bi bi-exclamation-triangle me-1"></i>Đoàn viên cần bổ sung sổ.</span>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => statusMut.mutate({ toStatus: 'AT_CHI_DOAN', note: 'Đã bổ sung, trả về chi đoàn' })}>
                      Xác nhận đã bổ sung
                    </button>
                  </>
                )}
                {['AT_CHI_DOAN', 'REGISTERED', 'INVENTORY', 'NEED_SUPPLEMENT', 'INVENTORY_DONE'].includes(book.status) && (
                  <>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => { if (confirm('Đánh dấu sổ mất?')) statusMut.mutate({ toStatus: 'MISSING', note: 'Đánh dấu mất' }); }}>Đánh dấu mất</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { if (confirm('Đánh dấu sổ hỏng?')) statusMut.mutate({ toStatus: 'DAMAGED', note: 'Đánh dấu hỏng' }); }}>Đánh dấu hỏng</button>
                  </>
                )}
              </div>
            </div>
          </PermissionGate>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent"><strong>Lịch sử</strong></div>
            <div className="card-body timeline">
              {(book.status_logs || []).length === 0 && <p className="text-muted small mb-0">Chưa có lịch sử</p>}
              {(book.status_logs || []).map((log) => (
                <div key={log.id} className="timeline-item mb-3 pb-3 border-bottom">
                  <div className="small text-muted">{new Date(log.created_at).toLocaleString('vi-VN')}</div>
                  <div>
                    {log.from_status && <span className="text-muted">{BOOK_STATUSES[log.from_status]?.label || log.from_status} → </span>}
                    <strong>{BOOK_STATUSES[log.to_status]?.label || log.to_status}</strong>
                  </div>
                  <div className="small">{log.actor_name} {log.note && `— ${log.note}`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
