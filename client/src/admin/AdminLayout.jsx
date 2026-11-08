import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, MessageSquareText, Settings, LogOut, ExternalLink, Leaf, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';

const NAV = [
  ['/admin', 'Dashboard', LayoutDashboard, true],
  ['/admin/products', 'Products', Package],
  ['/admin/orders', 'Orders', ClipboardList],
  ['/admin/reviews', 'Reviews', MessageSquareText],
  ['/admin/settings', 'Site Settings', Settings],
];

export default function AdminLayout() {
  const { admin, loading, logout } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-leaf-600" /></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;

  const item = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-leaf-600 text-white shadow-soft' : 'text-earth-700 hover:bg-leaf-50'}`;
  const tab = ({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-leaf-700' : 'text-earth-500'}`;

  return (
    <div className="min-h-screen bg-earth-50">
      <Helmet><meta name="robots" content="noindex,nofollow" /><title>Admin — KhamarFresh</title></Helmet>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-earth-100 bg-white p-4 lg:flex">
        <Link to="/admin" className="mb-6 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-600 text-white"><Leaf size={20} /></span><span className="font-display text-lg font-bold text-leaf-800">Admin Panel</span></Link>
        <nav className="space-y-1">{NAV.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={item}><Icon size={18} />{label}</NavLink>)}</nav>
        <div className="mt-auto space-y-2 border-t border-earth-100 pt-4">
          <Link to="/" target="_blank" className="btn-ghost w-full justify-start"><ExternalLink size={16} /> View store</Link>
          <button onClick={logout} className="btn-ghost w-full justify-start text-red-600"><LogOut size={16} /> Log out</button>
          <p className="px-3 text-xs text-earth-500">{admin.name} · {admin.role}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-earth-100 bg-white px-4 py-3 lg:hidden">
        <span className="font-display font-bold text-leaf-800">Admin Panel</span>
        <div className="flex gap-1"><Link to="/" target="_blank" className="btn-ghost !p-2" aria-label="View store"><ExternalLink size={18} /></Link><button onClick={logout} className="btn-ghost !p-2 text-red-600" aria-label="Log out"><LogOut size={18} /></button></div>
      </header>

      <main className="px-4 pb-24 pt-5 lg:ml-60 lg:px-8 lg:pb-10"><Outlet /></main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-earth-100 bg-white lg:hidden">
        {NAV.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={tab}><Icon size={20} />{label.replace('Site ', '')}</NavLink>)}
      </nav>
    </div>
  );
}
