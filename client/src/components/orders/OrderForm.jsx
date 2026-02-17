import { useState, useEffect } from 'react';
import { users, prices as pricesApi } from '../../lib/api';
import { calculateOrderTotals, generateItemsDescription } from '../../lib/utils';
import ItemPicker from '../shared/ItemPicker';

export default function OrderForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    customerName: '',
    contactInfo: '',
    notes: '',
    assignedTo: '',
    assignedToName: '',
    ...initial,
  });
  const [items, setItems] = useState(initial?.items || []);
  const [discount, setDiscount] = useState(initial?.discount ?? '');
  const [members, setMembers] = useState([]);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    users.list().then(setMembers).catch(() => {});
    pricesApi.list().then(setCatalog).catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleMemberChange(e) {
    const uid = e.target.value;
    const member = members.find(m => m.id === uid);
    setForm(prev => ({
      ...prev,
      assignedTo: uid || null,
      assignedToName: member?.displayName || null,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { subtotal, total } = calculateOrderTotals(items, discount);
    const description = generateItemsDescription(items);
    onSubmit({
      ...form,
      items,
      subtotal,
      discount: Number(discount) || 0,
      price: total,
      description: description || form.customerName,
      assignedTo: form.assignedTo || null,
      assignedToName: form.assignedToName || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Customer Name *</label>
          <input name="customerName" className="input" value={form.customerName} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Contact Info *</label>
          <input name="contactInfo" className="input" placeholder="Discord / Telegram / In-game" value={form.contactInfo} onChange={handleChange} required />
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
        <label className="label">Assigned To</label>
        <select name="assignedTo" className="input" value={form.assignedTo || ''} onChange={handleMemberChange}>
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.displayName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea name="notes" className="input" rows={2} value={form.notes} onChange={handleChange} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : initial ? 'Update Order' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
