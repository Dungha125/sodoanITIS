import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { booksApi, studentsApi, departmentsApi } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import PermissionGate from '../components/common/PermissionGate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BOOK_STATUSES } from '../utils/constants';

export default function BooksPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['books', page, search, status, deptFilter],
    queryFn: () => booksApi.list({
      page, size: 20, search: search || undefined,
      status: status || undefined, department_id: deptFilter || undefined,
    }).then((r) => r.data),
  });

  const { data: studentResults } = useQuery({
    queryKey: ['students-search', studentSearch],
    queryFn: () => studentsApi.list({ search: studentSearch, size: 10, page: 1 }).then((r) => r.data),
    enabled: studentSearch.length >= 2,
  });

  const createMut = useMutation({
    mutationFn: () => booksApi.create({ student_id: selectedStudent.id }),
    onSuccess: () => {
      toast.success('Tạo sổ thành công');
      qc.invalidateQueries(['books']);
      setShowCreate(false);
      setSelectedStudent(null);
      setStudentSearch('');
    },
    onError: (e) => toast.error(e.response?.data?.detail?.message || e.response?.data?.detail || 'Lỗi tạo sổ'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Sổ đoàn</h4>
        <PermissionGate permission="books.manage">
          <button className="btn btn-danger btn-sm" onClick={() => setShowCreate(true)}>
            <i className="bi bi-plus-lg me-1"></i> Tạo sổ mới
          </button>
        </PermissionGate>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent d-flex gap-2 flex-wrap">
          <input className="form-control form-control-sm" style={{ maxWidth: 200 }} placeholder="Tìm mã sổ..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="form-select form-select-sm" style={{ maxWidth: 180 }} value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
            <option value="">Chi đoàn</option>
            {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="form-select form-select-sm" style={{ maxWidth: 180 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Trạng thái</option>
            {Object.entries(BOOK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>Mã sổ</th><th>MSSV</th><th>Họ tên</th><th>Chi đoàn</th><th>Khóa</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {(data?.items || []).map((book) => (
                <tr key={book.id}>
                  <td><code>{book.book_code}</code></td>
                  <td>{book.student_mssv}</td>
                  <td>{book.student_name}</td>
                  <td>{book.department_name}</td>
                  <td>{book.cohort}</td>
                  <td><StatusBadge status={book.status} /></td>
                  <td><Link to={`/books/${book.id}`} className="btn btn-sm btn-outline-danger">Chi tiết</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="card-footer d-flex justify-content-between">
            <span className="text-muted small">Tổng {data.total} sổ</span>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</button>
              <span className="btn btn-outline-secondary disabled">{page}/{data.pages || 1}</span>
              <button className="btn btn-outline-secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Sau</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Tạo sổ đoàn mới</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreate(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Tìm đoàn viên (MSSV / tên)</label>
                <input className="form-control mb-2" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                <div className="list-group">
                  {(studentResults?.items || []).map((s) => (
                    <button key={s.id} type="button" className={`list-group-item list-group-item-action ${selectedStudent?.id === s.id ? 'active' : ''}`} onClick={() => setSelectedStudent(s)}>
                      <strong>{s.mssv}</strong> — {s.full_name} ({s.department_name})
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Hủy</button>
                <button className="btn btn-danger" disabled={!selectedStudent} onClick={() => createMut.mutate()}>Tạo sổ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
