import { useEffect, useState } from 'react';
import { activity as activityApi } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { Activity, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ActivityPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setEntries(await activityApi.list());
    } catch {
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }

  // Unique users for filter
  const users = [...new Set(entries.map(a => a.userName).filter(Boolean))].sort();

  const filtered = entries.filter(a => {
    if (userFilter !== 'all' && a.userName !== userFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(a.action || '').toLowerCase().includes(s) && !(a.userName || '').toLowerCase().includes(s)) return false;
    }
    return true;
  });

  // Group entries by date
  const grouped = {};
  filtered.forEach(entry => {
    const date = entry.createdAt?.toDate?.();
    const key = date
      ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'Unknown Date';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  return (
    <div>
      <PageHeader
        title="Activity Timeline"
        description="Full history of all actions across the ranch."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <input
          className="input pl-4 flex-1 w-full sm:max-w-xs"
          placeholder="Search activity..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
          <option value="all">All Users</option>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Activity} title="No activity found" description={search ? 'Try a different search term' : 'No activity has been recorded yet'} />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-parchment-500 dark:text-wood-300 mb-3 sticky top-0 bg-parchment-50 dark:bg-wood-950 py-1 z-10">{date}</h2>
              <div className="space-y-2">
                {items.map(entry => (
                  <div key={entry.id}>
                    <div className="card px-4 py-3">
                      <p className="text-sm text-parchment-800 dark:text-white">{entry.action}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-parchment-400">
                        <span className="flex items-center gap-1"><User size={11} /> {entry.userName}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {formatDateTime(entry.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
