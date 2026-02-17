import { useEffect, useState } from 'react';
import { orders as ordersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ORDER_STATUSES, exportToCSV } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import OrderForm from '../components/orders/OrderForm';
import KanbanBoard from '../components/orders/KanbanBoard';
import OrderTable from '../components/orders/OrderTable';
import OrderChecklist from '../components/orders/OrderChecklist';
import { Plus, LayoutGrid, Table, Search, Download, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const { isAdmin, isGuest, currentUser } = useAuth();
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checklistOrder, setChecklistOrder] = useState(null);

  useEffect(() => { loadOrders(); }, [search, statusFilter]);

  async function loadOrders() {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await ordersApi.list(params);
      setOrderList(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data) {
    setSubmitting(true);
    try {
      await ordersApi.create(data, currentUser);
      toast.success('Order created');
      setShowForm(false);
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(data) {
    setSubmitting(true);
    try {
      await ordersApi.update(editingOrder.id, data, currentUser);
      toast.success('Order updated');
      setEditingOrder(null);
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await ordersApi.update(id, { status: newStatus }, currentUser);
      setOrderList(prev => prev.map(o => (o.id === id ? { ...o, status: newStatus } : o)));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this order?')) return;
    try {
      await ordersApi.delete(id, currentUser);
      toast.success('Order deleted');
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleChecklistUpdate(updatedOrder) {
    setOrderList(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, checklist: updatedOrder.checklist } : o));
    setChecklistOrder(prev => prev?.id === updatedOrder.id ? { ...prev, checklist: updatedOrder.checklist } : prev);
  }

  function handleExport() {
    exportToCSV(orderList.map(o => ({
      customer: o.customerName,
      contact: o.contactInfo,
      description: o.description,
      price: o.price,
      status: o.status,
      assigned: o.assignedToName || '',
      created: o.createdAt?.toDate?.()?.toISOString?.() || '',
    })), 'riverside-orders');
    toast.success('Exported to CSV');
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Manage customer orders and track delivery status."
        actions={!isGuest &&
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> New Order
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-400" />
          <input className="input pl-9" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-colors ${view === 'kanban' ? 'bg-brand-500 text-white' : 'hover:bg-parchment-200 dark:hover:bg-wood-800'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('table')} className={`p-2 rounded-lg transition-colors ${view === 'table' ? 'bg-brand-500 text-white' : 'hover:bg-parchment-200 dark:hover:bg-wood-800'}`}>
            <Table size={16} />
          </button>
          <button onClick={handleExport} className="btn-ghost btn-sm ml-2">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : orderList.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description={search ? 'Try a different search term' : 'Create your first order to get started'}
          action={!search && !isGuest && <button onClick={() => setShowForm(true)} className="btn-primary btn-sm"><Plus size={14} /> New Order</button>}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard orders={orderList} onStatusChange={handleStatusChange} onCardClick={isGuest ? () => {} : setEditingOrder} onDelete={handleDelete} onChecklist={isGuest ? () => {} : setChecklistOrder} readOnly={isGuest} />
      ) : (
        <div className="card overflow-hidden">
          <OrderTable orders={orderList} onEdit={isGuest ? () => {} : setEditingOrder} onDelete={handleDelete} onChecklist={isGuest ? () => {} : setChecklistOrder} readOnly={isGuest} />
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Order" wide>
        <OrderForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitting={submitting} />
      </Modal>

      <Modal open={!!editingOrder} onClose={() => setEditingOrder(null)} title="Edit Order" wide>
        {editingOrder && (
          <OrderForm initial={editingOrder} onSubmit={handleUpdate} onCancel={() => setEditingOrder(null)} submitting={submitting} />
        )}
      </Modal>

      <Modal open={!!checklistOrder} onClose={() => setChecklistOrder(null)} title="Order Checklist">
        {checklistOrder && (
          <OrderChecklist order={checklistOrder} onClose={() => setChecklistOrder(null)} onUpdate={handleChecklistUpdate} />
        )}
      </Modal>
    </div>
  );
}
