import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import ProductsPage from "../pages/ProductsPage";
import RegisterPage from "../pages/RegisterPage";

export const router = createBrowserRouter([
    { element: <AppLayout />, children: [
        { path: "/", element: <HomePage /> },
        { path: "/products", element: <ProductsPage /> },
        { path: "/products/:id", element: <ProductDetailPage /> },
    ] },
    {
        path: "/login",
        element: <LoginPage></LoginPage>,
    },
    { path: "/register", element: <RegisterPage /> },
    { path: "*", element: <Navigate to="/" replace /> },
]);
