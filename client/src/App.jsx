import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import TrackOrder from './pages/TrackOrder.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import AdminLogin from './admin/AdminLogin.jsx';
import Dashboard from './admin/Dashboard.jsx';
import AdminProducts from './admin/AdminProducts.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import AdminReviews from './admin/AdminReviews.jsx';
import AdminSettings from './admin/AdminSettings.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-success/:orderId" element={<OrderSuccess />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  );
}
