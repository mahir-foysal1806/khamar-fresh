import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { admin, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await login(f.email, f.password); nav('/admin', { replace: true }); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-leaf-800 to-leaf-600 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-7">
        <div className="text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-600 text-white"><Leaf /></span><h1 className="mt-3 text-2xl font-bold text-leaf-800">Admin Login</h1><p className="text-sm text-earth-500">Manage your store</p></div>
        <div><label className="label" htmlFor="em">Email</label><input id="em" className="input" type="email" autoComplete="username" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" className="input" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}</button>
      </form>
    </div>
  );
}
