import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { formatCurrency, ORDER_STATUSES } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { GripVertical, User, Trash2, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function KanbanCard({ order, onClick, onDelete, onChecklist, readOnly }) {
  const { isAdmin } = useAuth();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
    disabled: readOnly,
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-3 ${readOnly ? '' : 'cursor-pointer hover:shadow-md'} transition-shadow`}
      onClick={() => !readOnly && onClick(order)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{order.customerName}</p>
          <p className="text-xs text-parchment-500 dark:text-wood-300 mt-1 line-clamp-2">{order.description}</p>
        </div>
        {!readOnly && (
          <button {...attributes} {...listeners} className="shrink-0 p-1 text-parchment-400 hover:text-wood-600 cursor-grab">
            <GripVertical size={14} />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-parchment-100 dark:border-wood-800">
        <p className="text-sm font-bold">{formatCurrency(order.price)}</p>
        <div className="flex items-center gap-2">
          {order.assignedToName && (
            <span className="flex items-center gap-1 text-xs text-parchment-400">
              <User size={12} />{order.assignedToName}
            </span>
          )}
          {!readOnly && (order.items?.length > 0) && (() => {
            const cl = order.checklist || [];
            const checked = cl.filter(c => c.checked).length;
            const total = order.items.length;
            return (
              <button
                onClick={e => { e.stopPropagation(); onChecklist(order); }}
                className={`flex items-center gap-1 p-1 rounded text-xs transition-colors ${
                  checked === total && total > 0
                    ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-parchment-400 hover:bg-parchment-200 dark:hover:bg-wood-800'
                }`}
              >
                <ClipboardCheck size={12} />
                <span>{checked}/{total}</span>
              </button>
            );
          })()}
          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(order.id); }}
              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, orders, onCardClick, onDelete, onChecklist, readOnly }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] rounded-xl p-3 transition-colors ${
        isOver ? 'bg-parchment-200 dark:bg-wood-800' : 'bg-parchment-100/50 dark:bg-wood-900/50'
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={status.value} />
          <span className="text-xs text-parchment-400 font-medium">{orders.length}</span>
        </div>
      </div>
      <div className="space-y-2 min-h-[100px]">
        {orders.map(order => (
          <KanbanCard key={order.id} order={order} onClick={onCardClick} onDelete={onDelete} onChecklist={onChecklist} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ orders, onStatusChange, onCardClick, onDelete, onChecklist, readOnly }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const columns = ORDER_STATUSES.map(status => ({
    ...status,
    orders: orders.filter(o => o.status === status.value),
  }));

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const orderId = active.id;
    const newStatus = over.id;
    const order = orders.find(o => o.id === orderId);

    if (order && order.status !== newStatus && ORDER_STATUSES.some(s => s.value === newStatus)) {
      onStatusChange(orderId, newStatus);
    }
  }

  const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={e => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <KanbanColumn key={col.value} status={col} orders={col.orders} onCardClick={onCardClick} onDelete={onDelete} onChecklist={onChecklist} readOnly={readOnly} />
        ))}
      </div>

      <DragOverlay>
        {activeOrder && (
          <div className="card p-3 shadow-xl w-[280px] rotate-2">
            <p className="text-sm font-semibold">{activeOrder.customerName}</p>
            <p className="text-xs text-wood-500 mt-1">{activeOrder.description}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
