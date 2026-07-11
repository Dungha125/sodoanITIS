import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '../api';

import LoadingSpinner from '../components/common/LoadingSpinner';



export default function NotificationsPage() {

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({

    queryKey: ['notifications'],

    queryFn: () => notificationsApi.list().then((r) => r.data),

  });



  const markReadMut = useMutation({

    mutationFn: (id) => notificationsApi.markRead(id),

    onSuccess: () => qc.invalidateQueries(['notifications']),

  });



  if (isLoading) return <LoadingSpinner />;



  return (

    <div>

      <h4 className="mb-4">Thông báo</h4>

      <div className="list-group">

        {(data || []).length === 0 && <p className="text-muted">Không có thông báo</p>}

        {(data || []).map((n) => (

          <button

            key={n.id}

            type="button"

            className={`list-group-item list-group-item-action text-start ${!n.is_read ? 'list-group-item-warning' : ''}`}

            onClick={() => !n.is_read && markReadMut.mutate(n.id)}

          >

            <div className="d-flex justify-content-between">

              <strong>{n.title}</strong>

              <small className="text-muted">{new Date(n.created_at).toLocaleString('vi-VN')}</small>

            </div>

            <p className="mb-0 small">{n.message}</p>

          </button>

        ))}

      </div>

    </div>

  );

}

