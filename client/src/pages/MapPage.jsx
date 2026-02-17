import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { mapPins } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import {
  Leaf, Mountain, Gem, Store, MapPin, Landmark, Home,
  ZoomIn, ZoomOut, Crosshair, Trash2, User, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;
const ZOOM_WHEEL_STEP = 0.15;
const DRAG_THRESHOLD = 4;
const IMAGE_WIDTH = 4505;
const IMAGE_HEIGHT = 3340;

const PIN_CATEGORIES = [
  { value: 'herb',   label: 'Herb',        icon: Leaf,     color: 'text-green-500',  bg: 'bg-green-100 dark:bg-green-900/40' },
  { value: 'mine',   label: 'Mine',        icon: Mountain, color: 'text-amber-500',  bg: 'bg-amber-100 dark:bg-amber-900/40' },
  { value: 'ore',    label: 'Ore',         icon: Gem,      color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  { value: 'market', label: 'Market/Shop', icon: Store,    color: 'text-brand-500',  bg: 'bg-brand-100 dark:bg-brand-900/40' },
  { value: 'ranch',  label: 'Ranch',       icon: Landmark, color: 'text-rose-500',   bg: 'bg-rose-100 dark:bg-rose-900/40' },
  { value: 'house',  label: 'House',       icon: Home,     color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/40' },
  { value: 'other',  label: 'Other POI',   icon: MapPin,   color: 'text-parchment-500', bg: 'bg-parchment-200 dark:bg-wood-700' },
];

function getCat(value) {
  return PIN_CATEGORIES.find(c => c.value === value) || PIN_CATEGORIES.find(c => c.value === 'other');
}

function PinMarker({ pin }) {
  const cat = getCat(pin.category);
  const Icon = cat.icon;
  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg ${cat.bg} ${cat.color} transition-transform group-hover:scale-125`}>
      <Icon size={16} />
    </div>
  );
}

export default function MapPage() {
  const { currentUser, isAdmin, isGuest } = useAuth();

  // Data
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null);
  const [pendingPin, setPendingPin] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Map transform
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const fitZoomRef = useRef(0.1);

  // Keep refs in sync for wheel handler
  zoomRef.current = zoom;
  panRef.current = pan;

  // Load pins
  useEffect(() => { loadPins(); }, []);

  async function loadPins() {
    try {
      setPins(await mapPins.list());
    } catch {
      toast.error('Failed to load map pins');
    } finally {
      setLoading(false);
    }
  }

  // Fit image to viewport on mount
  function calcFitView() {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const fitZoom = Math.min(rect.width / IMAGE_WIDTH, rect.height / IMAGE_HEIGHT);
    fitZoomRef.current = fitZoom;
    return {
      zoom: fitZoom,
      pan: {
        x: (rect.width - IMAGE_WIDTH * fitZoom) / 2,
        y: (rect.height - IMAGE_HEIGHT * fitZoom) / 2,
      },
    };
  }

  useLayoutEffect(() => {
    if (loading) return;
    const fit = calcFitView();
    if (!fit) return;
    setZoom(fit.zoom);
    setPan(fit.pan);
  }, [loading]);

  // Wheel zoom (must be non-passive to preventDefault)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const currentZoom = zoomRef.current;
    const currentPan = panRef.current;
    const direction = e.deltaY < 0 ? 1 : -1;
    const newZoom = Math.min(MAX_ZOOM, Math.max(fitZoomRef.current, currentZoom + direction * ZOOM_WHEEL_STEP));
    if (newZoom === currentZoom) return;

    const imgX = (cursorX - currentPan.x) / currentZoom;
    const imgY = (cursorY - currentPan.y) / currentZoom;

    setPan({
      x: cursorX - imgX * newZoom,
      y: cursorY - imgY * newZoom,
    });
    setZoom(newZoom);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, loading]);

  // Zoom buttons (toward center)
  function handleZoomButton(direction) {
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newZoom = Math.min(MAX_ZOOM, Math.max(fitZoomRef.current, zoom + direction * ZOOM_STEP));
    if (newZoom === zoom) return;

    const imgX = (cx - pan.x) / zoom;
    const imgY = (cy - pan.y) / zoom;
    setPan({ x: cx - imgX * newZoom, y: cy - imgY * newZoom });
    setZoom(newZoom);
  }

  // Reset to fit view
  function handleResetView() {
    const fit = calcFitView();
    if (!fit) return;
    setZoom(fit.zoom);
    setPan(fit.pan);
  }

  // Pan handlers
  function handlePointerDown(e) {
    if (e.target.closest('[data-pin]') || e.target.closest('button')) return;
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: pan.x, y: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      hasMoved.current = true;
    }
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }

  function handlePointerUp(e) {
    if (!isDragging) return;
    setIsDragging(false);
    if (!hasMoved.current) {
      handleMapClick(e);
    }
  }

  // Pin placement
  function handleMapClick(e) {
    if (isGuest || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const imgX = (clickX - pan.x) / zoom;
    const imgY = (clickY - pan.y) / zoom;

    const xPct = (imgX / IMAGE_WIDTH) * 100;
    const yPct = (imgY / IMAGE_HEIGHT) * 100;

    if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
    setPendingPin({ x: xPct, y: yPct });
  }

  // Filtered pins
  const filteredPins = categoryFilter === 'all' ? pins : pins.filter(p => p.category === categoryFilter);

  // Zoom percentage relative to fit (fit = 100%)
  const zoomPct = Math.round((zoom / fitZoomRef.current) * 100);

  // --- Sub-components ---

  function PinCreateForm() {
    const [form, setForm] = useState({ title: '', description: '', category: 'other' });
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
      e.preventDefault();
      setSubmitting(true);
      try {
        await mapPins.create({ x: pendingPin.x, y: pendingPin.y, ...form }, currentUser);
        toast.success('Pin placed!');
        setPendingPin(null);
        loadPins();
      } catch (err) {
        toast.error(err.message);
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Pin title" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details..." />
        </div>
        <div>
          <label className="label">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PIN_CATEGORIES.map(cat => {
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    form.category === cat.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                      : 'border-parchment-200 dark:border-wood-700 hover:bg-parchment-50 dark:hover:bg-wood-800'
                  }`}
                >
                  <CatIcon size={16} className={cat.color} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setPendingPin(null)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Placing...' : 'Place Pin'}</button>
        </div>
      </form>
    );
  }

  function PinDetailView() {
    const pin = selectedPin;
    const cat = getCat(pin.category);
    const CatIcon = cat.icon;
    const canDelete = !isGuest && currentUser && (pin.createdBy === currentUser.uid || isAdmin);

    async function handleDelete() {
      if (!confirm('Delete this pin?')) return;
      try {
        await mapPins.delete(pin.id, currentUser);
        toast.success('Pin deleted');
        setSelectedPin(null);
        loadPins();
      } catch (err) {
        toast.error(err.message);
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${cat.bg} ${cat.color} shrink-0`}>
            <CatIcon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-parchment-800 dark:text-white">{pin.title}</h3>
            <span className={`badge ${cat.bg} ${cat.color} mt-1`}>{cat.label}</span>
          </div>
        </div>
        {pin.description && (
          <p className="text-sm text-parchment-600 dark:text-wood-300">{pin.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-parchment-400">
          <span className="flex items-center gap-1"><User size={12} /> {pin.createdByName}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {formatDateTime(pin.createdAt)}</span>
        </div>
        {canDelete && (
          <div className="pt-2 border-t border-parchment-200 dark:border-wood-800">
            <button onClick={handleDelete} className="btn-ghost btn-sm text-red-500 w-full justify-center">
              <Trash2 size={14} /> Delete Pin
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Render ---

  if (loading) {
    return (
      <div>
        <PageHeader title="Interactive Map" description="Points of interest across the map." />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Interactive Map"
        description={isGuest ? "View-only mode. Drag to pan, scroll to zoom." : "Click the map to place pins. Drag to pan, scroll to zoom."}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => handleZoomButton(-1)} disabled={zoom <= fitZoomRef.current} className="btn-secondary btn-sm">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono text-parchment-500 w-12 text-center">{zoomPct}%</span>
            <button onClick={() => handleZoomButton(1)} disabled={zoom >= MAX_ZOOM} className="btn-secondary btn-sm">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleResetView} className="btn-secondary btn-sm" title="Reset view">
              <Crosshair size={16} />
            </button>
          </div>
        }
      />

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === 'all' ? 'bg-brand-500 text-white' : 'bg-parchment-100 dark:bg-wood-800 text-parchment-600 dark:text-wood-300'
          }`}
        >
          All ({pins.length})
        </button>
        {PIN_CATEGORIES.map(cat => {
          const count = pins.filter(p => p.category === cat.value).length;
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat.value ? 'bg-brand-500 text-white' : 'bg-parchment-100 dark:bg-wood-800 text-parchment-600 dark:text-wood-300'
              }`}
            >
              <CatIcon size={12} /> {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Map viewport */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-wood-950 select-none rounded-lg"
          style={{
            height: 'calc(100vh - 260px)',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
              position: 'relative',
              willChange: 'transform',
            }}
          >
            <img
              ref={imageRef}
              src="/rdr2map.jpg"
              alt="Map"
              draggable={false}
              style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
            />
            {/* Pins */}
            {filteredPins.map(pin => (
              <button
                key={pin.id}
                data-pin="true"
                onClick={(e) => { e.stopPropagation(); setSelectedPin(pin); }}
                className="absolute -translate-x-1/2 -translate-y-full group z-10 focus:outline-none"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <PinMarker pin={pin} />
                {/* Hover tooltip */}
                <div
                  className="absolute bottom-full left-1/2 mb-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-20"
                  style={{ transform: `translateX(-50%) scale(${1 / zoom})`, transformOrigin: 'bottom center' }}
                >
                  <div className="bg-white dark:bg-wood-900 rounded-lg shadow-lg border border-parchment-200 dark:border-wood-700 px-3 py-2 whitespace-nowrap text-left min-w-[120px]">
                    <p className="text-sm font-semibold text-parchment-800 dark:text-white">{pin.title}</p>
                    {pin.description && (
                      <p className="text-xs text-parchment-500 dark:text-parchment-400 mt-0.5 max-w-[200px] whitespace-normal">{pin.description}</p>
                    )}
                    <p className="text-[10px] text-parchment-400 mt-1 flex items-center gap-1">
                      <User size={10} /> {pin.createdByName}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create pin modal */}
      <Modal open={!!pendingPin} onClose={() => setPendingPin(null)} title="Place a Pin">
        {pendingPin && <PinCreateForm />}
      </Modal>

      {/* Pin detail modal */}
      <Modal open={!!selectedPin} onClose={() => setSelectedPin(null)} title="Pin Details">
        {selectedPin && <PinDetailView />}
      </Modal>
    </div>
  );
}
