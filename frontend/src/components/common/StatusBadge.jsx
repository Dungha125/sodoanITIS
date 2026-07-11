import { COLLECTION_STATUSES } from '../../utils/constants';

export default function StatusBadge({ status }) {
  const info = COLLECTION_STATUSES[status] || { label: status, color: 'secondary' };
  return <span className={`badge bg-${info.color}`}>{info.label}</span>;
}
