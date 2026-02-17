import { useEffect, useState, useRef } from 'react';
import { posters as postersApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Image, Trash2, Copy, Check, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostersPage() {
  const { isAdmin, currentUser } = useAuth();
  const [posterList, setPosterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadPosters(); }, []);

  async function loadPosters() {
    try {
      setPosterList(await postersApi.list());
    } catch {
      toast.error('Failed to load posters');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const title = e.target.title.value;
    const file = selectedFile;

    if (!file) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    try {
      await postersApi.upload(file, title, currentUser);
      toast.success('Poster uploaded');
      setShowUpload(false);
      setSelectedFile(null);
      loadPosters();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this poster?')) return;
    try {
      await postersApi.delete(id, currentUser);
      toast.success('Poster deleted');
      loadPosters();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleCopyUrl(poster) {
    navigator.clipboard.writeText(poster.imageUrl);
    setCopiedId(poster.id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <PageHeader title="Posters" description="Ranch poster gallery. Right-click images to copy address for RedM."
        actions={isAdmin && <button onClick={() => setShowUpload(true)} className="btn-primary"><Plus size={16} /> Upload Poster</button>} />

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>
      ) : posterList.length === 0 ? (
        <EmptyState icon={Image} title="No posters yet" description={isAdmin ? 'Upload ranch posters for the gallery' : 'No posters have been uploaded yet'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posterList.map(poster => (
            <div key={poster.id} className="card overflow-hidden group">
              <div className="aspect-[4/3] bg-parchment-100 dark:bg-wood-800 relative">
                <img src={poster.imageUrl} alt={poster.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{poster.title}</h3>
                <p className="text-xs text-parchment-400 mt-1">{formatDate(poster.createdAt)}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => handleCopyUrl(poster)} className="btn-secondary btn-sm flex-1">
                    {copiedId === poster.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === poster.id ? 'Copied!' : 'Copy URL'}
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(poster.id)} className="btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showUpload} onClose={() => { setShowUpload(false); setSelectedFile(null); }} title="Upload Poster">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input name="title" className="input" placeholder="Poster title" required />
          </div>
          <div>
            <label className="label">Image *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-parchment-300 dark:border-wood-700 rounded-lg p-8 text-center cursor-pointer hover:border-wood-500 transition-colors"
            >
              <Upload size={32} className="mx-auto text-parchment-400 mb-2" />
              {selectedFile ? (
                <p className="text-sm text-parchment-700 dark:text-parchment-200 font-medium">{selectedFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-parchment-400">Click to select an image</p>
                  <p className="text-xs text-parchment-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setShowUpload(false); setSelectedFile(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
