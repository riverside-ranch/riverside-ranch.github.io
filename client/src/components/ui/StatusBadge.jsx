import { ORDER_STATUSES, QUOTE_STATUSES } from '../../lib/utils';

export default function StatusBadge({ status, type = 'order' }) {
  const list = type === 'quote' ? QUOTE_STATUSES : ORDER_STATUSES;
  const found = list.find(s => s.value === status);
  if (!found) return <span className="badge bg-gray-100 text-gray-600">{status}</span>;
  return <span className={found.color}>{found.label}</span>;
}
