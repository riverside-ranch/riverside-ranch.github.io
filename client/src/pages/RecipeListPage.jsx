import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Search, Trash2, Edit2, User, Clock, MapPin, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecipeListPage({ title, singular, description, api, emptyIcon: EmptyIcon = Package }) {
  const itemLabel = singular || title.slice(0, -1);
  const { isAdmin, isGuest, currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [search]);

  async function load() {
    try {
      setItems(await api.list({ search: search || undefined }));
    } catch {
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data) {
    setSubmitting(true);
    try {
      if (editing) {
        await api.update(editing.id, data, currentUser);
        toast.success('Updated');
        setEditing(null);
      } else {
        await api.create(data, currentUser);
        toast.success('Created');
        setShowForm(false);
      }
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete(id, currentUser);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function RecipeForm({ initial }) {
    const [form, setForm] = useState({
      name: '', description: '', location: '',
      ...initial,
    });
    const [ingredients, setIngredients] = useState(initial?.ingredients || [{ name: '', quantity: '' }]);

    function addIngredient() {
      setIngredients(prev => [...prev, { name: '', quantity: '' }]);
    }

    function removeIngredient(index) {
      setIngredients(prev => prev.filter((_, i) => i !== index));
    }

    function updateIngredient(index, field, value) {
      setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
    }

    function onSubmit(e) {
      e.preventDefault();
      const filtered = ingredients.filter(i => i.name.trim());
      handleSubmit({ ...form, ingredients: filtered });
    }

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Item Name *</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Potent Health Cure" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes about this recipe..." />
        </div>
        <div>
          <label className="label">Crafting Location</label>
          <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Campfire, Wilderness Camp" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Requirements</label>
            <button type="button" onClick={addIngredient} className="btn-ghost btn-sm text-brand-500">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  value={ing.name}
                  onChange={e => updateIngredient(index, 'name', e.target.value)}
                  placeholder="Item name"
                />
                <input
                  className="input w-24"
                  value={ing.quantity}
                  onChange={e => updateIngredient(index, 'quantity', e.target.value)}
                  placeholder="Qty"
                />
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(index)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initial ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={!isGuest &&
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> Add {itemLabel}
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-400" />
          <input className="input pl-9" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={EmptyIcon} title={`No ${title.toLowerCase()} found`} description={search ? 'Try a different search term' : `Add your first entry to get started`} />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-parchment-800 dark:text-white">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-parchment-500 dark:text-wood-300 mt-1">{item.description}</p>
                  )}

                  {/* Requirements */}
                  {item.ingredients?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-parchment-500 dark:text-wood-300 mb-1.5">Requirements:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.ingredients.map((ing, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-parchment-100 dark:bg-wood-800 text-parchment-700 dark:text-wood-200">
                            <Package size={10} />
                            {ing.quantity && <span className="font-bold">{ing.quantity}x</span>}
                            {ing.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {item.location && (
                    <p className="flex items-center gap-1 text-xs text-parchment-400 mt-2">
                      <MapPin size={12} /> {item.location}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-parchment-400">
                    <span className="flex items-center gap-1"><User size={12} /> {item.createdByName}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDateTime(item.createdAt)}</span>
                  </div>
                </div>

                {!isGuest && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditing(item)} className="btn-ghost btn-sm"><Edit2 size={14} /></button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(item.id)} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`New ${itemLabel}`} wide>
        <RecipeForm />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${itemLabel}`} wide>
        {editing && <RecipeForm initial={editing} />}
      </Modal>
    </div>
  );
}
