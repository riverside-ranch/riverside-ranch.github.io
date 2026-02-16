// Convert Firestore Timestamp or ISO string to JS Date
function toDate(val) {
  if (!val) return null;
  if (val.toDate) return val.toDate(); // Firestore Timestamp
  return new Date(val);
}

export function formatDate(val) {
  const d = toDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(val) {
  const d = toDate(val);
  if (!d) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const ORDER_STATUSES = [
  { value: 'outstanding', label: 'Outstanding', color: 'badge-outstanding' },
  { value: 'preparing', label: 'Preparing', color: 'badge-preparing' },
  { value: 'ready', label: 'Ready for Delivery', color: 'badge-ready' },
  { value: 'delivered', label: 'Delivered', color: 'badge-delivered' },
];

export const QUOTE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'badge-pending' },
  { value: 'accepted', label: 'Accepted', color: 'badge-accepted' },
  { value: 'rejected', label: 'Rejected', color: 'badge-rejected' },
];

export const LOG_CATEGORIES = [
  { value: 'livestock', label: 'Livestock' },
  { value: 'crops', label: 'Crops' },
  { value: 'finance', label: 'Finance' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'misc', label: 'Misc' },
];

export function exportToCSV(data, filename) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
