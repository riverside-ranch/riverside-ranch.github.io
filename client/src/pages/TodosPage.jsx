import { useEffect, useState } from 'react';
import { todos as todosApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, CheckSquare, Square, Trash2, Edit2, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TodosPage() {
  const { isAdmin, isGuest, currentUser } = useAuth();
  const [todoList, setTodoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTodos(); }, []);

  async function loadTodos() {
    try {
      setTodoList(await todosApi.list());
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id) {
    try {
      const updated = await todosApi.toggle(id, currentUser);
      setTodoList(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
    } catch {
      toast.error('Failed to update');
    }
  }

  async function handleSubmit(data) {
    setSubmitting(true);
    try {
      if (editingTodo) {
        await todosApi.update(editingTodo.id, data);
        toast.success('Task updated');
        setEditingTodo(null);
      } else {
        await todosApi.create(data, currentUser);
        toast.success('Task added');
        setShowForm(false);
      }
      loadTodos();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await todosApi.delete(id, currentUser);
      toast.success('Task deleted');
      loadTodos();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function TodoForm({ initial }) {
    const [form, setForm] = useState({
      title: '', description: '', assignedRole: '', sortOrder: 0,
      ...initial,
    });
    return (
      <form onSubmit={e => { e.preventDefault(); handleSubmit(form); }} className="space-y-4">
        <div>
          <label className="label">Task Title *</label>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assigned Role</label>
            <select className="input" value={form.assignedRole || ''} onChange={e => setForm(f => ({ ...f, assignedRole: e.target.value || null }))}>
              <option value="">Anyone</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input type="number" className="input" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => { setShowForm(false); setEditingTodo(null); }} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : initial ? 'Update Task' : 'Add Task'}</button>
        </div>
      </form>
    );
  }

  const incomplete = todoList.filter(t => !t.isCompleted);
  const completed = todoList.filter(t => t.isCompleted);

  return (
    <div>
      <PageHeader title={`${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — To-Do List`} description="Ranch to-do list. Admins manage tasks, everyone checks them off."
        actions={isAdmin && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Add Task</button>} />

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : todoList.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description={isAdmin ? 'Add daily tasks for the ranch' : 'No tasks have been added yet'} />
      ) : (
        <div className="space-y-6">
          {incomplete.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-parchment-500 dark:text-wood-300 mb-3">To Do ({incomplete.length})</h2>
              <div className="space-y-2">
                {incomplete.map(todo => (
                  <div key={todo.id} className="card px-5 py-4 flex items-start gap-4">
                    <button onClick={() => !isGuest && handleToggle(todo.id)} className={`mt-0.5 shrink-0 ${isGuest ? 'text-parchment-300 cursor-default' : 'text-parchment-400 hover:text-wood-600'}`}><Square size={20} /></button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{todo.title}</p>
                      {todo.description && <p className="text-sm text-parchment-500 dark:text-wood-300 mt-1">{todo.description}</p>}
                      {todo.assignedRole && <span className="badge bg-parchment-200 dark:bg-wood-800 text-parchment-600 dark:text-wood-300 mt-2 text-xs capitalize">{todo.assignedRole}</span>}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditingTodo(todo)} className="p-1.5 rounded hover:bg-parchment-200 dark:hover:bg-wood-800"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(todo.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-parchment-500 dark:text-wood-300 mb-3">Completed ({completed.length})</h2>
              <div className="space-y-2">
                {completed.map(todo => (
                  <div key={todo.id} className="card px-5 py-4 flex items-start gap-4 opacity-70">
                    <button onClick={() => !isGuest && handleToggle(todo.id)} className={`mt-0.5 shrink-0 ${isGuest ? 'cursor-default' : ''} text-green-600`}><CheckSquare size={20} /></button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-through text-parchment-400">{todo.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-parchment-400">
                        {todo.completedByName && <span className="flex items-center gap-1"><User size={12} />{todo.completedByName}</span>}
                        {todo.completedAt && <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(todo.completedAt)}</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDelete(todo.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Task"><TodoForm /></Modal>
      <Modal open={!!editingTodo} onClose={() => setEditingTodo(null)} title="Edit Task">{editingTodo && <TodoForm initial={editingTodo} />}</Modal>
    </div>
  );
}
