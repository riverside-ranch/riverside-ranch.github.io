import { useEffect, useState } from 'react';
import { quotes as quotesApi, prices as pricesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { QUOTE_STATUSES, formatCurrency, formatDate, calculateOrderTotals, generateItemsDescription } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import ItemPicker from '../components/shared/ItemPicker';
import { Plus, FileText, Search, ArrowRightCircle, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuotesPage() {
  const { isAdmin, isGuest, currentUser } = useAuth();
  const [quoteList, setQuoteList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => { loadQuotes(); }, [search, statusFilter]);
  useEffect(() => { pricesApi.list().then(setCatalog).catch(() => {}); }, []);

  async function loadQuotes() {
    try {
      const data = await quotesApi.list({ status: statusFilter || undefined, search: search || undefined });
      setQuoteList(data);
    } catch {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data) {
    setSubmitting(true);
    try {
      if (editingQuote) {
        await quotesApi.update(editingQuote.id, data);
        toast.success('Quote updated');
        setEditingQuote(null);
      } else {
        await quotesApi.create(data, currentUser);
        toast.success('Quote created');
        setShowForm(false);
      }
      loadQuotes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConvert(id) {
    if (!confirm('Convert this quote to an order?')) return;
    try {
      await quotesApi.convert(id, currentUser);
      toast.success('Quote converted to order!');
      loadQuotes();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this quote?')) return;
    try {
      await quotesApi.delete(id, currentUser);
      toast.success('Quote deleted');
      loadQuotes();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await quotesApi.update(id, { status });
      toast.success('Status updated');
      loadQuotes();
    } catch {
      toast.error('Failed to update');
    }
  }

  function QuoteForm({ initial }) {
    const [form, setForm] = useState({
      customerName: '', contactInfo: '', notes: '',
      ...initial,
    });
    const [items, setItems] = useState(initial?.items || []);
    const [discount, setDiscount] = useState(initial?.discount ?? '');

    function onSubmit(e) {
      e.preventDefault();
      const { subtotal, total } = calculateOrderTotals(items, discount);
      const requestedItems = generateItemsDescription(items);
      handleSubmit({
        ...form,
        items,
        subtotal,
        discount: Number(discount) || 0,
        estimatedPrice: total,
        requestedItems: requestedItems || form.customerName,
      });
    }

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Customer Name *</label>
            <input className="input" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Contact Info *</label>
            <input className="input" value={form.contactInfo} onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))} required />
          </div>
        </div>

        <ItemPicker
          items={items}
          onChange={setItems}
          prices={catalog}
          discount={discount}
          onDiscountChange={setDiscount}
        />

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => { setShowForm(false); setEditingQuote(null); }} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : initial ? 'Update Quote' : 'Create Quote'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Manage price quotes and convert them to orders."
        actions={!isGuest && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> New Quote</button>}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-400" />
          <input className="input pl-9" placeholder="Search quotes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {QUOTE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : quoteList.length === 0 ? (
        <EmptyState icon={FileText} title="No quotes found" description="Create your first quote to get started" />
      ) : (
        <div className="space-y-3">
          {quoteList.map(quote => (
            <div key={quote.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{quote.customerName}</h3>
                    <StatusBadge status={quote.status} type="quote" />
                  </div>
                  <p className="text-sm text-parchment-500 dark:text-wood-300">{quote.contactInfo}</p>
                  <p className="text-sm mt-2">{quote.requestedItems}</p>
                  {quote.discount > 0 && <p className="text-xs text-parchment-400 mt-1">Discount: {quote.discount}%</p>}
                  {quote.notes && <p className="text-xs text-parchment-400 mt-2 italic">{quote.notes}</p>}
                  <div className="flex items-center gap-4 mt-3 text-xs text-parchment-400">
                    <span>{formatDate(quote.createdAt)}</span>
                    <span className="font-semibold text-sm text-parchment-700 dark:text-parchment-200">{formatCurrency(quote.estimatedPrice)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isGuest && quote.status === 'pending' && (
                    <>
                      <select className="input w-auto text-xs" value={quote.status} onChange={e => handleStatusChange(quote.id, e.target.value)}>
                        {QUOTE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <button onClick={() => handleConvert(quote.id)} className="btn-primary btn-sm" title="Convert to Order">
                        <ArrowRightCircle size={14} /> Convert
                      </button>
                    </>
                  )}
                  {!isGuest && <button onClick={() => setEditingQuote(quote)} className="btn-ghost btn-sm"><Edit2 size={14} /></button>}
                  {isAdmin && (
                    <button onClick={() => handleDelete(quote.id)} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
              {quote.convertedOrderId && <p className="text-xs text-green-600 dark:text-green-400 mt-2">Converted to order</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Quote" wide><QuoteForm /></Modal>
      <Modal open={!!editingQuote} onClose={() => setEditingQuote(null)} title="Edit Quote" wide>
        {editingQuote && <QuoteForm initial={editingQuote} />}
      </Modal>
    </div>
  );
}
