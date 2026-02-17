import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { orders, logs, todos as todosApi, activity as activityApi, ranchFund, cattleTimers } from '../lib/api';
// Stats are computed client-side from the full orders list to avoid needing Firestore composite indexes
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import {
  DollarSign, CheckCircle2, Truck, Landmark,
  ClipboardList, ScrollText, ArrowRight, CheckSquare, Square, X, Eye, EyeOff,
  Beef, Plus, Timer, Trash2, Check,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { profile, currentUser, isGuest } = useAuth();
  const [stats, setStats] = useState(null);
  const [outstandingOrders, setOutstandingOrders] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [fundBalance, setFundBalance] = useState(0);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundDescription, setFundDescription] = useState('');
  const [fundLoading, setFundLoading] = useState(false);
  const [fundHidden, setFundHidden] = useState(false);
  const [timers, setTimers] = useState([]);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [breedForm, setBreedForm] = useState({ quantity: 1, notes: '' });
  const [breedSubmitting, setBreedSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  // Live countdown tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      // Fetch all data independently so one failure doesn't crash everything
      const results = await Promise.allSettled([
        orders.list(),
        logs.list({ max: 10 }),
        todosApi.list(),
        activityApi.list({ max: 10 }),
        ranchFund.get(),
        cattleTimers.list(),
      ]);

      const [ordersRes, logsRes, todosRes, actRes] = results.slice(0, 4).map(r =>
        r.status === 'fulfilled' ? r.value : []
      );
      const fundRes = results[4].status === 'fulfilled' ? results[4].value : { balance: 0 };
      const timersRes = results[5].status === 'fulfilled' ? results[5].value : [];
      setTimers(timersRes);
      setFundBalance(fundRes.balance);

      // Compute stats and filter outstanding orders from the full list
      const allOrders = ordersRes;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setStats({
        totalOutstanding: allOrders
          .filter(o => o.status === 'outstanding')
          .reduce((sum, o) => sum + Number(o.price || 0), 0),
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

  async function handleBreed(e) {
    e.preventDefault();
    setBreedSubmitting(true);
    try {
      await cattleTimers.create(breedForm, currentUser);
      toast.success('Cattle bred! Timer started.');
      setShowBreedModal(false);
      setBreedForm({ quantity: 1, notes: '' });
      setTimers(await cattleTimers.list());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBreedSubmitting(false);
    }
  }

  async function handleClearTimer(id) {
    try {
      await cattleTimers.delete(id, currentUser);
      toast.success('Timer cleared');
      setTimers(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  function formatCountdown(ms) {
    if (ms <= 0) return null;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  async function handleFundAction(action) {
    if (!fundAmount || isNaN(Number(fundAmount))) {
      toast.error('Enter a valid amount');
      return;
    }
    setFundLoading(true);
    try {
      let result;
      if (action === 'adjust') {
        result = await ranchFund.adjust(fundAmount, fundDescription || 'Manual adjustment', currentUser);
      } else {
        result = await ranchFund.withdraw(fundAmount, fundDescription || 'Withdrawal', currentUser);
      }
      setFundBalance(result.balance);
      setFundModalOpen(false);
      setFundAmount('');
      setFundDescription('');
      toast.success(action === 'adjust' ? 'Balance adjusted' : 'Withdrawal recorded');
    } catch {
      toast.error('Failed to update fund');
    } finally {
      setFundLoading(false);
    }
  }

  const showFund = isAdmin && !fundHidden;
  const statCards = [
    { label: 'Ranch Fund', value: showFund ? formatCurrency(fundBalance) : '••••••', icon: Landmark, color: 'text-green-600' },
    { label: 'Outstanding Value', value: formatCurrency(stats?.totalOutstanding), icon: DollarSign, color: 'text-amber-600' },
    { label: 'Completed Today', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'text-green-600' },
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
              <div className="flex-1 min-w-0">
                <p className="text-xs text-parchment-500 dark:text-wood-300">{label}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
              {label === 'Ranch Fund' && isAdmin && (
                <button
                  onClick={() => setFundHidden(h => !h)}
                  className="p-1.5 rounded text-parchment-400 hover:text-parchment-600 dark:hover:text-wood-200 hover:bg-parchment-100 dark:hover:bg-wood-800 transition-colors"
                  title={fundHidden ? 'Show balance' : 'Hide balance'}
                >
                  {fundHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
            {label === 'Ranch Fund' && isAdmin && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setFundModalOpen(true)}
                  className="btn btn-sm btn-secondary text-xs flex-1"
                >
                  Adjust / Withdraw
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cattle Timers */}
      {(timers.length > 0 || !isGuest) && (
        <div className="card mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <div className="flex items-center gap-2">
              <Beef size={18} className="text-amber-600" />
              <h2 className="font-display font-semibold">Cattle Gestation</h2>
            </div>
            {!isGuest && (
              <button onClick={() => setShowBreedModal(true)} className="btn-primary btn-sm">
                <Plus size={14} /> Breed Cattle
              </button>
            )}
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {timers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-parchment-400">No active cattle timers</p>
            ) : (
              timers.map(timer => {
                const bredAt = timer.bredAt?.toDate?.()?.getTime() || 0;
                const readyAt = bredAt + 12 * 60 * 60 * 1000;
                const remaining = readyAt - now;
                const isReady = remaining <= 0;
                const progressPct = bredAt ? Math.min(100, ((now - bredAt) / (12 * 60 * 60 * 1000)) * 100) : 0;
                const canClear = currentUser && (timer.bredBy === currentUser.uid || isAdmin);

                return (
                  <div key={timer.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isReady ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                          {isReady ? <Check size={16} /> : <Timer size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {timer.quantity} cattle
                            {isReady
                              ? <span className="ml-2 text-green-600 dark:text-green-400 font-bold">Ready for market!</span>
                              : <span className="ml-2 text-amber-600 dark:text-amber-400 font-mono">{formatCountdown(remaining)}</span>
                            }
                          </p>
                          <p className="text-xs text-parchment-400">
                            Bred by {timer.bredByName}{timer.notes ? ` — ${timer.notes}` : ''}
                          </p>
                        </div>
                      </div>
                      {canClear && (
                        <button onClick={() => handleClearTimer(timer.id)} className="p-1.5 rounded text-parchment-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Clear timer">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-parchment-200 dark:bg-wood-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isReady ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Breed Cattle Modal */}
      <Modal open={showBreedModal} onClose={() => setShowBreedModal(false)} title="Breed Cattle">
        <form onSubmit={handleBreed} className="space-y-4">
          <div>
            <label className="label">Number of Cattle *</label>
            <input type="number" min="1" className="input" value={breedForm.quantity} onChange={e => setBreedForm(f => ({ ...f, quantity: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={breedForm.notes} onChange={e => setBreedForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>
          <p className="text-xs text-parchment-400">A 12-hour timer will start. All ranch members will see the countdown on the dashboard.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowBreedModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={breedSubmitting}>{breedSubmitting ? 'Starting...' : 'Start Timer'}</button>
          </div>
        </form>
      </Modal>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Misc Logs */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <div className="flex items-center gap-2">
              <ScrollText size={18} className="text-parchment-400" />
              <h2 className="font-display font-semibold">Recent Activity Log</h2>
            </div>
            <Link to="/logs" className="text-xs text-wood-500 hover:text-wood-700 dark:hover:text-wood-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {recentLogs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-parchment-400">No log entries yet</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{log.description}</p>
                    {log.amount != null && (
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">{formatCurrency(log.amount)}</p>
                    )}
                  </div>
                  <p className="text-xs text-parchment-400 mt-0.5">{log.userName} &middot; {formatDateTime(log.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-parchment-400" />
              <h2 className="font-display font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} To-Do List</h2>
            </div>
            <Link to="/todos" className="text-xs text-wood-500 hover:text-wood-700 dark:hover:text-wood-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {todoList.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-parchment-400">No tasks today</p>
            ) : (
              todoList.map(todo => (
                <button
                  key={todo.id}
                  onClick={() => !isGuest && handleToggleTodo(todo.id)}
                  className={`w-full px-5 py-3 flex items-center gap-3 text-left transition-colors ${isGuest ? 'cursor-default' : 'hover:bg-parchment-50 dark:hover:bg-wood-800/50'}`}
                >
                  {todo.isCompleted ? (
                    <CheckSquare size={18} className="text-green-600 shrink-0" />
                  ) : (
                    <Square size={18} className="text-parchment-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm ${todo.isCompleted ? 'line-through text-wood-400' : 'font-medium'}`}>
                      {todo.title}
                    </p>
                    {todo.isCompleted && todo.completedByName && (
                      <p className="text-xs text-parchment-400">Done by {todo.completedByName}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Outstanding Orders */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 dark:border-wood-800">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-parchment-400" />
              <h2 className="font-display font-semibold">Outstanding Orders</h2>
            </div>
            <Link to="/orders" className="text-xs text-wood-500 hover:text-wood-700 dark:hover:text-wood-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100 dark:divide-wood-800">
            {outstandingOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-parchment-400">No outstanding orders</p>
            ) : (
              outstandingOrders.map(order => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.customerName}</p>
                    <p className="text-xs text-parchment-500 dark:text-wood-300 truncate max-w-[200px]">{order.description}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(order.price)}</p>
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
              <p className="px-5 py-8 text-center text-sm text-parchment-400">No activity yet</p>
            ) : (
              recentActivity.map(act => (
                <div key={act.id} className="px-5 py-3">
                  <p className="text-sm">{act.action}</p>
                  <p className="text-xs text-parchment-400 mt-0.5">{act.userName} &middot; {formatDateTime(act.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ranch Fund Modal */}
      {fundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setFundModalOpen(false)}>
          <div className="card w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Ranch Fund</h2>
              <button onClick={() => setFundModalOpen(false)} className="text-parchment-400 hover:text-wood-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-wood-500 mb-4">Current balance: <span className="font-bold text-green-600">{formatCurrency(fundBalance)}</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  className="input w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={fundDescription}
                  onChange={e => setFundDescription(e.target.value)}
                  className="input w-full"
                  placeholder="Reason for change"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleFundAction('adjust')}
                  disabled={fundLoading}
                  className="btn btn-primary flex-1"
                >
                  {fundLoading ? 'Saving…' : 'Adjust to Amount'}
                </button>
                <button
                  onClick={() => handleFundAction('withdraw')}
                  disabled={fundLoading}
                  className="btn btn-secondary flex-1"
                >
                  {fundLoading ? 'Saving…' : 'Withdraw Amount'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
