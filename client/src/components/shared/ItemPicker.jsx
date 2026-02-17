import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '../../lib/utils';
import { Search, X, Plus, Minus } from 'lucide-react';

export default function ItemPicker({ items, onChange, prices, discount, onDiscountChange }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredPrices = prices.filter(p => {
    if (!search) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  function addItem(priceItem) {
    const existing = items.find(i => i.priceId === priceItem.id);
    if (existing) {
      onChange(items.map(i => i.priceId === priceItem.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      onChange([...items, { priceId: priceItem.id, name: priceItem.name, price: priceItem.price, quantity: 1 }]);
    }
    setSearch('');
    setShowDropdown(false);
  }

  function updateQuantity(priceId, delta) {
    onChange(items.map(i => {
      if (i.priceId !== priceId) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    }));
  }

  function setQuantity(priceId, value) {
    const qty = Math.max(1, parseInt(value) || 1);
    onChange(items.map(i => i.priceId === priceId ? { ...i, quantity: qty } : i));
  }

  function removeItem(priceId) {
    onChange(items.filter(i => i.priceId !== priceId));
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = subtotal * (Number(discount) || 0) / 100;
  const total = subtotal - discountAmount;

  return (
    <div className="space-y-4">
      {/* Search / Add dropdown */}
      <div ref={wrapperRef} className="relative">
        <label className="label">Add Items from Catalog</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-400" />
          <input
            className="input pl-9"
            placeholder="Search catalog..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
          />
        </div>
        {showDropdown && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-wood-900 border border-parchment-200 dark:border-wood-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredPrices.length === 0 ? (
              <div className="px-4 py-3 text-sm text-parchment-400">No items found</div>
            ) : (
              filteredPrices.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-parchment-100 dark:hover:bg-wood-800 flex items-center justify-between transition-colors"
                  onClick={() => addItem(p)}
                >
                  <span>{p.name}</span>
                  <span className="text-parchment-500 dark:text-wood-300 font-medium">{formatCurrency(p.price)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected items table */}
      {items.length > 0 && (
        <div className="overflow-x-auto border border-parchment-200 dark:border-wood-700 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-parchment-50 dark:bg-wood-800/50 border-b border-parchment-200 dark:border-wood-700">
                <th className="text-left py-2 px-3 font-medium text-parchment-500 dark:text-wood-300">Item</th>
                <th className="text-right py-2 px-3 font-medium text-parchment-500 dark:text-wood-300">Unit Price</th>
                <th className="text-center py-2 px-3 font-medium text-parchment-500 dark:text-wood-300">Qty</th>
                <th className="text-right py-2 px-3 font-medium text-parchment-500 dark:text-wood-300">Line Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.priceId} className="border-b border-parchment-100 dark:border-wood-800/50">
                  <td className="py-2 px-3">{item.name}</td>
                  <td className="py-2 px-3 text-right text-parchment-500 dark:text-wood-300">{formatCurrency(item.price)}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => updateQuantity(item.priceId, -1)} className="p-0.5 rounded hover:bg-parchment-200 dark:hover:bg-wood-700">
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="w-12 text-center text-sm border border-parchment-200 dark:border-wood-700 rounded bg-transparent py-0.5"
                        value={item.quantity}
                        onChange={e => setQuantity(item.priceId, e.target.value)}
                      />
                      <button type="button" onClick={() => updateQuantity(item.priceId, 1)} className="p-0.5 rounded hover:bg-parchment-200 dark:hover:bg-wood-700">
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                  <td className="py-2 px-1">
                    <button type="button" onClick={() => removeItem(item.priceId)} className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <div className="flex flex-col items-end gap-2 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-parchment-500 dark:text-wood-300">Subtotal:</span>
            <span className="font-medium w-24 text-right">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-parchment-500 dark:text-wood-300">Discount (%):</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="w-24 text-right text-sm border border-parchment-200 dark:border-wood-700 rounded bg-transparent px-2 py-1"
              value={discount}
              onChange={e => onDiscountChange(e.target.value)}
            />
          </div>
          {Number(discount) > 0 && (
            <div className="flex items-center gap-4 text-red-500">
              <span>Discount:</span>
              <span className="w-24 text-right">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-base font-bold border-t border-parchment-200 dark:border-wood-700 pt-2">
            <span>Total:</span>
            <span className="w-24 text-right">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
