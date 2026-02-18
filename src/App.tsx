import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/app-layout";
import { HomePage } from "@/pages/home";
import { ProductsPage } from "@/pages/products";
import { ProductDetailPage } from "@/pages/product-detail";
import { CartPage } from "@/pages/cart";
import { CheckoutPage } from "@/pages/checkout";
import { SuccessPage } from "@/pages/success";
import { TrackPage } from "@/pages/track";
import { AccountOrdersPage } from "@/pages/account-orders";
import { AdminPage } from "@/pages/admin";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/account/orders" element={<AccountOrdersPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
