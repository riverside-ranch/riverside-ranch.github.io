import { useEffect, useState } from 'react';
import { prices as pricesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PRICE_CATEGORIES, formatCurrency } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, DollarSign, Search, Edit2, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_PRICES = [
  { name: 'American Ginseng', price: 0.30 },
  { name: 'Animal Fat', price: 1.00 },
  { name: 'Animal Feed', price: 0.75 },
  { name: 'Barley', price: 0.25 },
  { name: 'Bay Bolete', price: 0.30 },
  { name: 'Bay Leaf', price: 0.30 },
  { name: 'Beef', price: 0.75 },
  { name: 'Bell Pepper', price: 0.25 },
  { name: 'Bird Meat (Gamey)', price: 0.75 },
  { name: 'Bird Meat (Plump)', price: 0.75 },
  { name: 'Blueberry', price: 0.30 },
  { name: 'Broccoli', price: 0.25 },
  { name: 'Burdock Root', price: 0.30 },
  { name: 'Butter', price: 0.50 },
  { name: 'Cabbage', price: 0.25 },
  { name: 'Carrot', price: 0.25 },
  { name: 'Cheese', price: 0.50 },
  { name: 'Chilli Pepper', price: 0.25 },
  { name: 'Cinnamon', price: 0.25 },
  { name: 'Coffee Bean', price: 0.25 },
  { name: 'Corn', price: 0.25 },
  { name: 'Cotton', price: 0.30 },
  { name: 'Cotton (Raw)', price: 0.25 },
  { name: 'Creek Plum', price: 0.30 },
  { name: 'Creeping Thyme', price: 0.30 },
  { name: 'Cream', price: 0.50 },
  { name: 'Crows Garlic', price: 0.25 },
  { name: 'Cucumber', price: 0.25 },
  { name: 'Deluxe Fertilizer', price: 1.50 },
  { name: 'Desert Sage', price: 0.30 },
  { name: 'Dewberry', price: 0.30 },
  { name: 'Eggs', price: 0.75 },
  { name: 'Echinacea', price: 0.30 },
  { name: 'Evergreen Huckleberry', price: 0.30 },
  { name: 'Feather', price: 0.55 },
  { name: 'Fertiliser', price: 0.50 },
  { name: 'Flour', price: 0.25 },
  { name: 'Ginseng (Alaskan)', price: 0.30 },
  { name: 'Ginseng (American)', price: 0.30 },
  { name: 'Glass Jar', price: 0.50 },
  { name: 'Hay', price: 0.75 },
  { name: 'Haycube', price: 1.25 },
  { name: 'Hop', price: 0.25 },
  { name: 'Lavender', price: 0.30 },
  { name: 'Lasso', price: 8.00 },
  { name: 'Lettuce', price: 0.25 },
  { name: 'Mature Venison Meat', price: 0.40 },
  { name: 'Manure', price: 0.55 },
  { name: 'Milk', price: 0.75 },
  { name: 'Mint', price: 0.30 },
  { name: 'Mutton', price: 0.75 },
  { name: 'Nitrite', price: 0.75 },
  { name: 'Oat', price: 0.25 },
  { name: 'Onion', price: 0.25 },
  { name: 'Pork', price: 0.75 },
  { name: 'Potato', price: 0.25 },
  { name: 'Pumpkin', price: 0.25 },
  { name: 'Raspberry', price: 0.30 },
  { name: 'Rye', price: 0.25 },
  { name: 'Sap', price: 0.20 },
  { name: 'Saw Dust', price: 0.20 },
  { name: 'Stick', price: 0.20 },
  { name: 'Sugar', price: 0.25 },
  { name: 'Sugar Cane', price: 0.25 },
  { name: 'Sulfur', price: 0.75 },
  { name: 'Sunflower', price: 0.25 },
  { name: 'Tobacco', price: 0.25 },
  { name: 'Tomato', price: 0.25 },
  { name: 'Watermelon', price: 0.25 },
  { name: 'Wintergreen Huckleberry', price: 0.30 },
  { name: 'Wheat', price: 0.25 },
  { name: 'Wood', price: 0.20 },
  { name: 'Wool', price: 0.60 },
  { name: 'Yarrow', price: 0.30 },
];

export default function PricesPage() {
  const { isAdmin, currentUser } = useAuth();
  const [priceList, setPriceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => { loadPrices(); }, []);

  async function loadPrices() {
    try {
      setPriceList(await pricesApi.list());
    } catch {
      toast.error('Failed to load prices');
    } finally {
      setLoading(false);
    }
  }

  const filtered = priceList.filter(item => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!item.name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  async function handleSubmit(data) {
    setSubmitting(true);
    try {
      if (editingItem) {
        await pricesApi.update(editingItem.id, data, currentUser);
        toast.success('Price item updated');
        setEditingItem(null);
      } else {
        await pricesApi.create(data, currentUser);
        toast.success('Price item added');
        setShowForm(false);
      }
      loadPrices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this price item?')) return;
    try {
      await pricesApi.delete(id, currentUser);
      toast.success('Price item deleted');
      loadPrices();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleImportDefaults() {
    if (!confirm(`Import ${DEFAULT_PRICES.length} default price items?`)) return;
    setImporting(true);
    try {
      await pricesApi.bulkCreate(DEFAULT_PRICES, currentUser);
      toast.success(`Imported ${DEFAULT_PRICES.length} items`);
      loadPrices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  }

  function PriceForm({ initial }) {
    const [form, setForm] = useState({
      name: '', category: '',
      ...initial,
      price: initial?.price ?? '',
    });

    return (
      <form onSubmit={e => { e.preventDefault(); handleSubmit(form); }} className="space-y-4">
        <div>
          <label className="label">Item Name *</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Price ($) *</label>
          <input type="number" step="0.01" min="0" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">No Category</option>
            {PRICE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initial ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <PageHeader
        title="Prices"
        description="Price catalog for orders and quotes."
        actions={isAdmin && (
          <div className="flex items-center gap-2">
            {priceList.length === 0 && (
              <button onClick={handleImportDefaults} className="btn-secondary" disabled={importing}>
                <Upload size={16} /> {importing ? 'Importing...' : 'Import Defaults'}
              </button>
            )}
            <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Add Item</button>
          </div>
        )}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-400" />
          <input className="input pl-9" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {PRICE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="No price items found" description={isAdmin ? 'Add items to the price catalog' : 'No items in the catalog yet'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-parchment-200 dark:border-wood-800">
                <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Item</th>
                <th className="text-left py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Category</th>
                <th className="text-right py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Price</th>
                {isAdmin && <th className="text-right py-3 px-4 font-medium text-parchment-500 dark:text-wood-300">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-parchment-100 dark:border-wood-800/50 hover:bg-parchment-50 dark:hover:bg-wood-900/50">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-parchment-500 dark:text-wood-300 capitalize">{item.category || '—'}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(item.price)}</td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditingItem(item)} className="btn-ghost btn-sm"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Price Item"><PriceForm /></Modal>
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Price Item">
        {editingItem && <PriceForm initial={editingItem} />}
      </Modal>
    </div>
  );
}
