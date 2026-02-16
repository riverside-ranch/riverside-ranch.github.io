import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { formatCurrency, ORDER_STATUSES } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { GripVertical, User } from 'lucide-react';

function KanbanCard({ order, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(order)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{order.customerName}</p>
          <p className="text-xs text-wood-500 dark:text-wood-400 mt-1 line-clamp-2">{order.description}</p>
        </div>
        <button {...attributes} {...listeners} className="shrink-0 p-1 text-wood-400 hover:text-wood-600 cursor-grab">
          <GripVertical size={14} />
        </button>
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-parchment-100 dark:border-wood-800">
        <p className="text-sm font-bold">{formatCurrency(order.price)}</p>
        {order.assignedToName && (
          <span className="flex items-center gap-1 text-xs text-wood-400">
            <User size={12} />{order.assignedToName}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ status, orders, onCardClick }) {
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
          <span className="text-xs text-wood-400 font-medium">{orders.length}</span>
        </div>
      </div>
      <div className="space-y-2 min-h-[100px]">
        {orders.map(order => (
          <KanbanCard key={order.id} order={order} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ orders, onStatusChange, onCardClick }) {
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
          <KanbanColumn key={col.value} status={col} orders={col.orders} onCardClick={onCardClick} />
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
