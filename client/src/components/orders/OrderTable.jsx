import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Edit2 } from 'lucide-react';

export default function OrderTable({ orders, onEdit, onDelete }) {
  const { isAdmin } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-parchment-200 dark:border-wood-800">
            <th className="text-left py-3 px-4 font-medium text-wood-500 dark:text-wood-400">Customer</th>
            <th className="text-left py-3 px-4 font-medium text-wood-500 dark:text-wood-400">Description</th>
            <th className="text-left py-3 px-4 font-medium text-wood-500 dark:text-wood-400">Price</th>
            <th className="text-left py-3 px-4 font-medium text-wood-500 dark:text-wood-400">Deposit</th>
            <th className="text-left py-3 px-4 font-medium text-wood-500 dark:text-wood-400">Status</th>
            <th className="text-left py-3 px-4 font-medium text-wood-500 dark:text-wood-400">Assigned</th>
            <th className="text-left py-3 px-4 font-medium text-wood-500 dark:text-wood-400">Date</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-parchment-100 dark:divide-wood-800">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-parchment-50 dark:hover:bg-wood-900/50">
              <td className="py-3 px-4">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-wood-400">{order.contactInfo}</p>
              </td>
              <td className="py-3 px-4 max-w-[200px] truncate">{order.description}</td>
              <td className="py-3 px-4 font-semibold">{formatCurrency(order.price)}</td>
              <td className="py-3 px-4">{formatCurrency(order.depositPaid)}</td>
              <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
              <td className="py-3 px-4 text-wood-500">{order.assignedToName || '—'}</td>
              <td className="py-3 px-4 text-wood-400 text-xs">{formatDate(order.createdAt)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(order)} className="p-1.5 rounded hover:bg-parchment-200 dark:hover:bg-wood-800">
                    <Edit2 size={14} />
                  </button>
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
