import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orders, logs, todos as todosApi, activity as activityApi } from '../lib/api';
// Stats are computed client-side from the full orders list to avoid needing Firestore composite indexes
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import {
  DollarSign, CheckCircle2, Package, Truck,
  ClipboardList, ScrollText, ArrowRight, CheckSquare, Square,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { profile, currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [outstandingOrders, setOutstandingOrders] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      // Fetch all data independently so one failure doesn't crash everything
      const results = await Promise.allSettled([
        orders.list(),
        logs.list({ max: 10 }),
        todosApi.list(),
        activityApi.list({ max: 10 }),
      ]);

      const [ordersRes, logsRes, todosRes, actRes] = results.map(r =>
        r.status === 'fulfilled' ? r.value : []
      );

      // Compute stats and filter outstanding orders from the full list
      const allOrders = ordersRes;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setStats({
        totalOutstanding: allOrders
          .filter(o => o.status === 'outstanding')
          .reduce((sum, o) => sum + Number(o.price || 0), 0),
        totalDeposits: allOrders
          .filter(o => o.status !== 'delivered')
          .reduce((sum, o) => sum + Number(o.depositPaid || 0), 0),
        completedToday: allOrders.filter(o => {
          if (o.status !== 'delivered') return false;
          const updated = o.updatedAt?.toDate?.() || new Date(0);
          return updated >= today;
        }).length,
        pendingDeliveries: allOrders.filter(o => o.status === 'ready').length,
      });

      setOutstandingOrders(allOrders.filter(o => o.status === 'outstanding').slice(0, 10));
      setRecentLogs(logsRes);
      setTodoList(todosRes);
      setRecentActivity(actRes);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleTodo(id) {
    try {
      const updated = await todosApi.toggle(id, currentUser);
      setTodoList(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
    } catch {
      toast.error('Failed to update task');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-wood-300 border-t-wood-700 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Outstanding Value', value: formatCurrency(stats?.totalOutstanding), icon: DollarSign, color: 'text-amber-600' },
    { label: 'Completed Today', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Deposits Held', value: formatCurrency(stats?.totalDeposits), icon: Package, color: 'text-blue-600' },
    { label: 'Pending Deliveries', value: stats?.pendingDeliveries || 0, icon: Truck, color: 'text-wood-600' },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.displayName}`}
        description="Here's what's happening at the ranch today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-parchment-100 dark:bg-wood-800 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-wood-500 dark:text-wood-400">{label}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Outstanding Orders */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-wood-500" />
              <h2 className="font-display font-semibold">Outstanding Orders</h2>
            </div>
            <Link to="/orders" className="text-xs text-wood-500 hover:text-wood-700 dark:hover:text-wood-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {outstandingOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-wood-400">No outstanding orders</p>
            ) : (
              outstandingOrders.map(order => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.customerName}</p>
                    <p className="text-xs text-wood-500 dark:text-wood-400 truncate max-w-[200px]">{order.description}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(order.price)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-wood-500" />
              <h2 className="font-display font-semibold">Daily Tasks</h2>
            </div>
            <Link to="/todos" className="text-xs text-wood-500 hover:text-wood-700 dark:hover:text-wood-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {todoList.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-wood-400">No tasks today</p>
            ) : (
              todoList.map(todo => (
                <button
                  key={todo.id}
                  onClick={() => handleToggleTodo(todo.id)}
                  className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-parchment-50 dark:hover:bg-wood-800/50 transition-colors"
                >
                  {todo.isCompleted ? (
                    <CheckSquare size={18} className="text-green-600 shrink-0" />
                  ) : (
                    <Square size={18} className="text-wood-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm ${todo.isCompleted ? 'line-through text-wood-400' : 'font-medium'}`}>
                      {todo.title}
                    </p>
                    {todo.isCompleted && todo.completedByName && (
                      <p className="text-xs text-wood-400">Done by {todo.completedByName}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Recent Misc Logs */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <div className="flex items-center gap-2">
              <ScrollText size={18} className="text-wood-500" />
              <h2 className="font-display font-semibold">Recent Activity Log</h2>
            </div>
            <Link to="/logs" className="text-xs text-wood-500 hover:text-wood-700 dark:hover:text-wood-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {recentLogs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-wood-400">No log entries yet</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{log.description}</p>
                    {log.amount != null && (
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">{formatCurrency(log.amount)}</p>
                    )}
                  </div>
                  <p className="text-xs text-wood-400 mt-0.5">{log.userName} &middot; {formatDateTime(log.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="card">
          <div className="px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <h2 className="font-display font-semibold">Activity Timeline</h2>
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {recentActivity.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-wood-400">No activity yet</p>
            ) : (
              recentActivity.map(act => (
                <div key={act.id} className="px-5 py-3">
                  <p className="text-sm">{act.action}</p>
                  <p className="text-xs text-wood-400 mt-0.5">{act.userName} &middot; {formatDateTime(act.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
