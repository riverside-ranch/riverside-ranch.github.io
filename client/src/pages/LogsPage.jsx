import { useEffect, useState } from 'react';
import { logs as logsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LOG_CATEGORIES, formatCurrency, formatDateTime } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, ScrollText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const categoryColors = {
  livestock: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  crops: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  finance: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  misc: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export default function LogsPage() {
  const { isAdmin, isGuest, currentUser } = useAuth();
  const [logList, setLogList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadLogs(); }, [category]);

  async function loadLogs() {
    try {
      const data = await logsApi.list({ category });
      setLogList(data);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data) {
    setSubmitting(true);
    try {
      await logsApi.create(data, currentUser);
      toast.success('Entry logged');
      setShowForm(false);
      loadLogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this log entry?')) return;
    try {
      await logsApi.delete(id, currentUser);
      toast.success('Entry deleted');
      loadLogs();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function LogForm() {
    const [form, setForm] = useState({ description: '', amount: '', category: 'misc' });
    return (
      <form onSubmit={e => { e.preventDefault(); handleCreate(form); }} className="space-y-4">
        <div>
          <label className="label">Task Description *</label>
          <textarea className="input" rows={3} placeholder="e.g. Sold 20 cattle at auction" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Money Amount ($)</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="Optional" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {LOG_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Log Entry'}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <PageHeader title="Misc Log" description="Track completed ranch tasks and activities."
        actions={!isGuest && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> New Entry</button>} />

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setCategory('all')} className={`btn-sm rounded-full ${category === 'all' ? 'bg-brand-500 text-white' : 'btn-secondary'}`}>All</button>
        {LOG_CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)} className={`btn-sm rounded-full ${category === c.value ? 'bg-brand-500 text-white' : 'btn-secondary'}`}>{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : logList.length === 0 ? (
        <EmptyState icon={ScrollText} title="No log entries" description="Start logging ranch activities" />
      ) : (
        <div className="space-y-2">
          {logList.map(log => (
            <div key={log.id} className="card px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge text-xs ${categoryColors[log.category]}`}>{log.category}</span>
                  <p className="text-sm font-medium">{log.description}</p>
                </div>
                <p className="text-xs text-parchment-400 mt-1">{log.userName} &middot; {formatDateTime(log.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {log.amount != null && (
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">{formatCurrency(log.amount)}</p>
                )}
                {isAdmin && (
                  <button onClick={() => handleDelete(log.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Log Entry"><LogForm /></Modal>
    </div>
  );
}
