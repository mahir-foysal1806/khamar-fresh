import { Check, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Stars } from '../components/ui';
import { useFetch } from '../lib/hooks';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';

export default function AdminReviews() {
  const { data, setData, loading } = useFetch(() => api.aget('/admin/reviews'), []);
  const approve = async (r, approved) => {
    try { const u = await api.apatch(`/admin/reviews/${r._id}`, { approved }); setData((c) => c.map((x) => (x._id === r._id ? { ...x, approved: u.approved } : x))); toast.success(approved ? 'Approved' : 'Hidden'); } catch (e) { toast.error(e.message); }
  };
  const del = async (r) => { if (!confirm('Delete this review?')) return; await api.adel(`/admin/reviews/${r._id}`); setData((c) => c.filter((x) => x._id !== r._id)); };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-leaf-800 sm:text-3xl">Product Reviews</h1>
      <p className="mb-4 text-sm text-earth-500">New reviews stay hidden until you approve them.</p>
      {loading ? <Loader2 className="mx-auto animate-spin text-leaf-600" /> : (
        <div className="space-y-3">
          {data?.map((r) => (
            <div key={r._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-semibold">{r.name} <span className="font-normal text-earth-500">on {r.product?.name || 'deleted product'} · {timeAgo(r.createdAt)}</span></p><Stars value={r.rating} /></div>
                <span className={`chip ${r.approved ? 'bg-leaf-100 text-leaf-800' : 'bg-amber-100 text-amber-800'}`}>{r.approved ? 'Live' : 'Pending'}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-earth-700">{r.comment}</p>}
              <div className="mt-3 flex gap-2">
                {r.approved ? <button className="btn-ghost border border-earth-200 !py-1.5 text-xs" onClick={() => approve(r, false)}>Hide</button> : <button className="btn-primary !py-1.5 text-xs" onClick={() => approve(r, true)}><Check size={14} /> Approve</button>}
                <button className="btn-ghost !py-1.5 text-xs text-red-600" onClick={() => del(r)}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          ))}
          {!data?.length && <p className="py-10 text-center text-earth-500">No reviews yet.</p>}
        </div>
      )}
    </div>
  );
}
