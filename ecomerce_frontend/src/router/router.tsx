import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import HomePage from "../pages/user/HomePage";
import ProductsPage from "../pages/user/ProductsPage";
import ProductDetailPage from "../pages/user/ProductDetailPage";
import RegisterPage from "../pages/user/RegisterPage";
import LoginPage from "../pages/user/LoginPage";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
            { path: "/", element: <HomePage /> },
            { path: "/products", element: <ProductsPage /> },
            { path: "/products/:id", element: <ProductDetailPage /> },
        ],
    },
    {
        path: "/admin",
        element: (
            <ProtectedRoute role="ADMIN">
                <></>
            </ProtectedRoute>
        ),
    },
    {
        path: "/login",
        element: <LoginPage></LoginPage>,
    },
    { path: "/register", element: <RegisterPage /> },
    { path: "*", element: <Navigate to="/" replace /> },
]);
