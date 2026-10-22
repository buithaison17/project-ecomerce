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
    { path: "*", element: <Navigate to="/" replace /> },
]);
