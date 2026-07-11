import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { campaignsApi, departmentsApi, lienChiApi } from '../api';
import PermissionGate from '../components/common/PermissionGate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyOrgBanner from '../components/common/EmptyOrgBanner';
import { usePermission } from '../hooks/usePermission';

const CAMPAIGN_STATUS = { active: 'Đang mở', closed: 'Đã đóng' };

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const canConfirm = usePermission('campaigns.confirm');
  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: { appointments: [{ lien_chi_id: '', appointment_date: '', start_time: '', end_time: '', location: '', note: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'appointments' });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list().then((r) => r.data),
  });

  const { data: lienChiList } = useQuery({
    queryKey: ['lien-chi'],
    queryFn: () => lienChiApi.list().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list().then((r) => r.data),
  });

  const { data: pendingSubs } = useQuery({
    queryKey: ['pending-subs', expandedId],
    queryFn: () => campaignsApi.pendingSubmissions(expandedId).then((r) => r.data),
    enabled: !!expandedId && canConfirm,
  });

  const createMut = useMutation({
    mutationFn: (form) => {
      const deptIds = Array.from(document.querySelectorAll('input[name=dept]:checked')).map((el) => +el.value);
      if (!deptIds.length) throw new Error('Chọn ít nhất một chi đoàn');
      const appointments = (form.appointments || [])
        .filter((a) => a.lien_chi_id && a.appointment_date)
        .map((a) => ({
          lien_chi_id: +a.lien_chi_id,
          appointment_date: a.appointment_date,
          start_time: a.start_time || null,
          end_time: a.end_time || null,
          location: a.location || null,
          note: a.note || null,
        }));
      return campaignsApi.create({
        name: form.name,
        semester: form.semester,
        start_date: form.start_date,
        end_date: form.end_date,
        department_ids: deptIds,
        appointments,
      });
    },
    onSuccess: () => {
      toast.success('Tạo đợt thu thành công');
      qc.invalidateQueries(['campaigns']);
      setShowForm(false);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.message || 'Lỗi tạo đợt'),
  });

  const confirmMut = useMutation({
    mutationFn: ({ campaignId, classId }) => campaignsApi.confirmClass(campaignId, classId),
    onSuccess: (r) => {
      toast.success(`${r.data.message}. Thiếu: ${r.data.missing}`);
      qc.invalidateQueries(['pending-subs', expandedId]);
      qc.invalidateQueries(['campaigns']);
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Lỗi xác nhận'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Đợt thu sổ</h4>
          <p className="text-muted small mb-0">Bí thư lớp thu sổ → nộp Liên chi → Liên chi xác nhận tiếp nhận</p>
        </div>
        <PermissionGate permission="campaigns.manage">
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} disabled={!departments?.length}>
            <i className="bi bi-plus-lg me-1"></i> Tạo đợt thu
          </button>
        </PermissionGate>
      </div>

      <EmptyOrgBanner departments={departments} />

      <div className="row g-3">
        {(data || []).map((c) => (
          <div key={c.id} className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{c.name}</h5>
                    <p className="text-muted small mb-2">{c.semester} | {c.start_date} → {c.end_date}</p>
                  </div>
                  <span className={`badge bg-${c.status === 'active' ? 'success' : 'secondary'}`}>
                    {CAMPAIGN_STATUS[c.status] || c.status}
                  </span>
                </div>

                {c.appointments?.length > 0 && (
                  <div className="mb-3">
                    <strong className="small">Lịch hẹn nộp sổ:</strong>
                    <ul className="small mb-0 mt-1">
                      {c.appointments.map((a) => (
                        <li key={a.id}>
                          <i className="bi bi-calendar-event me-1"></i>
                          {a.lien_chi_name} — {a.appointment_date}
                          {a.start_time && ` ${a.start_time}`}{a.end_time && `–${a.end_time}`}
                          {a.location && ` @ ${a.location}`}
                          {a.note && <span className="text-muted"> ({a.note})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="progress mb-2" style={{ height: 8 }}>
                  <div className="progress-bar bg-primary" style={{ width: `${c.progress_percent}%` }}></div>
                </div>
                <div className="d-flex justify-content-between small mb-3">
                  <span>
                    Tổng {c.total_students} | Đã thu {c.total_collected} | Nộp LC {c.total_submitted} | LC nhận {c.total_received}
                  </span>
                  <span>{c.progress_percent}%</span>
                </div>

                <div className="d-flex gap-2">
                  {c.status === 'active' && (
                    <Link to="/classes" className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-collection me-1"></i> Vào danh sách lớp thu sổ
                    </Link>
                  )}
                  {canConfirm && c.status === 'active' && (
                    <button className="btn btn-sm btn-primary" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                      <i className="bi bi-check2-square me-1"></i>
                      Xác nhận tiếp nhận ({expandedId === c.id ? 'ẩn' : 'hiện'})
                    </button>
                  )}
                </div>

                {expandedId === c.id && canConfirm && (
                  <div className="mt-3 border-top pt-3">
                    <h6>Lớp chờ Liên chi xác nhận</h6>
                    {(pendingSubs || []).length === 0 && <p className="text-muted small">Không có lớp nào chờ xác nhận</p>}
                    {(pendingSubs || []).map((sub) => (
                      <div key={sub.id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                        <div>
                          <strong>{sub.class_name}</strong>
                          <span className="text-muted small ms-2">{sub.department_name}</span>
                          <div className="small text-muted">
                            Nộp {sub.collected_count}/{sub.total_students} sổ
                            {sub.submitted_by_name && ` — ${sub.submitted_by_name}`}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-success"
                          disabled={confirmMut.isPending}
                          onClick={() => { if (confirm('Xác nhận Liên chi tiếp nhận sổ lớp này?')) confirmMut.mutate({ campaignId: c.id, classId: sub.class_id }); }}
                        >
                          Tiếp nhận
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!(data || []).length && <div className="col-12 text-center text-muted py-5">Chưa có đợt thu nào</div>}
      </div>

      {showForm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit((d) => createMut.mutate(d))}>
                <div className="modal-header">
                  <h5>Tạo đợt thu mới</h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên đợt</label>
                    <input className="form-control" placeholder="Thu HK1 2025-2026" {...register('name', { required: true })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Học kỳ</label>
                    <select className="form-select" {...register('semester', { required: true })}>
                      <option value="HK1">HK1</option>
                      <option value="HK2">HK2</option>
                      <option value="Cuối năm">Cuối năm</option>
                    </select>
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">Ngày bắt đầu</label>
                      <input type="date" className="form-control" {...register('start_date', { required: true })} />
                    </div>
                    <div className="col">
                      <label className="form-label">Ngày kết thúc</label>
                      <input type="date" className="form-control" {...register('end_date', { required: true })} />
                    </div>
                  </div>
                  <label className="form-label">Chi đoàn tham gia</label>
                  <div className="mb-3">
                    {(departments || []).map((d) => (
                      <div className="form-check" key={d.id}>
                        <input className="form-check-input" type="checkbox" name="dept" value={d.id} id={`dept-${d.id}`} defaultChecked />
                        <label className="form-check-label" htmlFor={`dept-${d.id}`}>{d.name}</label>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Lịch hẹn nộp sổ với Liên chi</label>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => append({ lien_chi_id: '', appointment_date: '', start_time: '', end_time: '', location: '', note: '' })}>
                      + Thêm lịch
                    </button>
                  </div>
                  {fields.map((field, idx) => (
                    <div key={field.id} className="border rounded p-3 mb-2">
                      <div className="row g-2">
                        <div className="col-md-6">
                          <select className="form-select form-select-sm" {...register(`appointments.${idx}.lien_chi_id`)}>
                            <option value="">Liên chi</option>
                            {(lienChiList || []).map((lc) => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <input type="date" className="form-control form-control-sm" {...register(`appointments.${idx}.appointment_date`)} />
                        </div>
                        <div className="col-md-3">
                          <input type="time" className="form-control form-control-sm" placeholder="Từ" {...register(`appointments.${idx}.start_time`)} />
                        </div>
                        <div className="col-md-3">
                          <input type="time" className="form-control form-control-sm" placeholder="Đến" {...register(`appointments.${idx}.end_time`)} />
                        </div>
                        <div className="col-md-4">
                          <input className="form-control form-control-sm" placeholder="Địa điểm" {...register(`appointments.${idx}.location`)} />
                        </div>
                        <div className="col-md-2">
                          {fields.length > 1 && (
                            <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => remove(idx)}>Xóa</button>
                          )}
                        </div>
                        <div className="col-12">
                          <input className="form-control form-control-sm" placeholder="Ghi chú" {...register(`appointments.${idx}.note`)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Tạo đợt</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
