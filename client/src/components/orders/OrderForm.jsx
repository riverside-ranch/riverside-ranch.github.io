import { useState, useEffect } from 'react';
import { users } from '../../lib/api';

export default function OrderForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    customerName: '',
    contactInfo: '',
    description: '',
    price: '',
    depositPaid: '',
    notes: '',
    assignedTo: '',
    assignedToName: '',
    ...initial,
    price: initial?.price ?? '',
    depositPaid: initial?.depositPaid ?? '',
  });
  const [members, setMembers] = useState([]);

  useEffect(() => {
    users.list().then(setMembers).catch(() => {});
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
    onSubmit({
      ...form,
      price: parseFloat(form.price) || 0,
      depositPaid: parseFloat(form.depositPaid) || 0,
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

      <div>
        <label className="label">Order Description *</label>
        <textarea name="description" className="input" rows={3} value={form.description} onChange={handleChange} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Price ($)</label>
          <input name="price" type="number" step="0.01" min="0" className="input" value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Deposit Paid ($)</label>
          <input name="depositPaid" type="number" step="0.01" min="0" className="input" value={form.depositPaid} onChange={handleChange} />
        </div>
      </div>

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
