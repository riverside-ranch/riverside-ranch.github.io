import { useState, useEffect } from 'react';
import { orders as ordersApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderChecklist({ order, onClose, onUpdate }) {
  const { currentUser } = useAuth();
  const [checklist, setChecklist] = useState([]);
  const [items, setItems] = useState(order.items || []);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    loadFresh();
  }, [order.id]);

  async function loadFresh() {
    try {
      const fresh = await ordersApi.get(order.id);
      setItems(fresh.items || []);
      const itemCount = (fresh.items || []).length;
      const cl = fresh.checklist || [];
      // Ensure checklist is the same length as items
      const padded = Array.from({ length: itemCount }, (_, i) =>
        cl[i] || { checked: false, checkedBy: null, checkedByName: null, checkedAt: null }
      );
      setChecklist(padded);
    } catch {
      toast.error('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(index) {
    setToggling(index);
    try {
      const updated = await ordersApi.toggleChecklistItem(order.id, index, currentUser);
      // Re-read fresh state to get server timestamp
      const fresh = await ordersApi.get(order.id);
      const itemCount = (fresh.items || []).length;
      const cl = fresh.checklist || [];
      const padded = Array.from({ length: itemCount }, (_, i) =>
        cl[i] || { checked: false, checkedBy: null, checkedByName: null, checkedAt: null }
      );
      setChecklist(padded);
      onUpdate?.(fresh);
    } catch {
      toast.error('Failed to update checklist');
    } finally {
      setToggling(null);
    }
  }

  const checkedCount = checklist.filter(c => c.checked).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={24} className="animate-spin text-parchment-400" />
      </div>
    );
  }

  if (totalCount === 0) {
    return <p className="text-center text-wood-400 py-6">This order has no items.</p>;
  }

  return (
    <div>
      <p className="text-sm text-parchment-500 dark:text-wood-300 mb-3">
        {order.customerName} — {checkedCount} of {totalCount} items checked
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 bg-parchment-200 dark:bg-wood-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Items list */}
      <div className="space-y-1">
        {items.map((item, index) => {
          const entry = checklist[index] || {};
          const isToggling = toggling === index;

          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                entry.checked
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'hover:bg-parchment-50 dark:hover:bg-wood-800/50'
              }`}
            >
              <button
                onClick={() => handleToggle(index)}
                disabled={isToggling}
                className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  entry.checked
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-wood-300 dark:border-wood-600 hover:border-green-400'
                }`}
              >
                {isToggling ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : entry.checked ? (
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : null}
              </button>

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${entry.checked ? 'line-through text-wood-400' : ''}`}>
                  {item.quantity}x {item.name}
                </p>
                {entry.checked && entry.checkedByName && (
                  <p className="text-xs text-wood-400 dark:text-wood-500 mt-0.5">
                    Checked by {entry.checkedByName} {entry.checkedAt ? `at ${formatDateTime(entry.checkedAt)}` : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
