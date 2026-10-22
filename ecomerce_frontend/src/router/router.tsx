import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import HomePage from "../pages/user/HomePage.tsx";
import LoginPage from "../pages/user/LoginPage.tsx";
import ProductDetailPage from "../pages/user/ProductDetailPage.tsx";
import ProductsPage from "../pages/user/ProductsPage.tsx";
import RegisterPage from "../pages/user/RegisterPage.tsx";
import CartPage from "../pages/user/CartPage.tsx";
import CheckoutPage from "../pages/user/CheckoutPage.tsx";
import CheckoutSuccessPage from "../pages/user/CheckoutSuccessPage.tsx";
import AdminLayout from "../components/AdminLayout.tsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.tsx";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage.tsx";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage.tsx";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage.tsx";
import AdminProductsPage from "../pages/admin/AdminProductsPage.tsx";

export const router = createBrowserRouter([
    { element: <AppLayout />, children: [
        { path: "/", element: <HomePage /> },
        { path: "/products", element: <ProductsPage /> },
        { path: "/products/:id", element: <ProductDetailPage /> },
        { path: "/cart", element: <CartPage /> },
        { path: "/checkout", element: <CheckoutPage /> },
        { path: "/checkout/success", element: <CheckoutSuccessPage /> },
    ] },
    {
        path: "/login",
        element: <LoginPage></LoginPage>,
    },
    { path: "/register", element: <RegisterPage /> },
    {
        path: "/admin",
        element: <AdminLayout />,
        children: [
            { index: true, element: <AdminDashboardPage /> },
            { path: "orders", element: <AdminOrdersPage /> },
            { path: "categories", element: <AdminCategoriesPage /> },
            { path: "products", element: <AdminProductsPage /> },
            { path: "inventory", element: <AdminInventoryPage /> },
        ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
]);
