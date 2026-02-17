import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Edit2, ClipboardCheck } from 'lucide-react';

export default function OrderTable({ orders, onEdit, onDelete, onChecklist, readOnly }) {
  const { isAdmin } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-parchment-200 dark:border-wood-800">
            <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Customer</th>
            <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Description</th>
            <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Price</th>
            <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Status</th>
            <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Assigned</th>
            <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Date</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-parchment-100 dark:divide-wood-800">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-parchment-50 dark:hover:bg-wood-900/50">
              <td className="py-3 px-4">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-parchment-400">{order.contactInfo}</p>
              </td>
              <td className="py-3 px-4 max-w-[200px] truncate">{order.description}</td>
              <td className="py-3 px-4 font-semibold">{formatCurrency(order.price)}</td>
              <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
              <td className="py-3 px-4 text-parchment-400">{order.assignedToName || '—'}</td>
              <td className="py-3 px-4 text-parchment-400 text-xs">{formatDate(order.createdAt)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  {!readOnly && order.items?.length > 0 && (
                    <button onClick={() => onChecklist(order)} className="p-1.5 rounded hover:bg-parchment-200 dark:hover:bg-wood-800 text-parchment-400 hover:text-wood-600">
                      <ClipboardCheck size={14} />
                    </button>
                  )}
                  {!readOnly && (
                    <button onClick={() => onEdit(order)} className="p-1.5 rounded hover:bg-parchment-200 dark:hover:bg-wood-800">
                      <Edit2 size={14} />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => onDelete(order.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
