
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";import { AppLayout } from "@/layouts/app-layout";
import { HomePage } from "@/pages/home";
import { ProductsPage } from "@/pages/products";
import { ProductDetailPage } from "@/pages/product-detail";
import { CartPage } from "@/pages/cart";
import { FavoritesPage } from "@/pages/favorites";
import { CheckoutPage } from "@/pages/checkout";
import { SuccessPage } from "@/pages/success";
import { TrackPage } from "@/pages/track";
import { AccountOrdersPage } from "@/pages/account-orders";
import { AccountProfilePage } from "@/pages/account-profile";
import { AdminPage } from "@/pages/admin";
import { RegisterPage } from "@/pages/register";
import { useAuth } from "@/providers/auth-provider";

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-slate-500">Validando sesión...</p>
      </section>
    );
  }

  if (!user) {
    const redirectTarget = encodeURIComponent(
      `${location.pathname}${location.search}${location.hash}`,
    );

    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  return <Outlet />;
}

function RequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-slate-500">Validando permisos...</p>
      </section>
    );
  }

  if (!user) {
    const redirectTarget = encodeURIComponent(
      `${location.pathname}${location.search}${location.hash}`,
    );

    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/favoritos" element={<FavoritesPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/login" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/mis-compras" element={<AccountOrdersPage />} />
          <Route path="/mi-cuenta" element={<AccountProfilePage />} />
          <Route
            path="/account/orders"
            element={<Navigate to="/mis-compras" replace />}
          />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
