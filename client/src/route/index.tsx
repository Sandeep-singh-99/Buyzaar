import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import { MainLayout } from "@/layouts/MainLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

// Pages
import Home from "@/page/Home";
import ProductListing from "@/page/ProductListing";
import ProductDetail from "@/page/ProductDetail";
import CategoryProducts from "@/page/CategoryProducts";
import Cart from "@/page/Cart";
import Checkout from "@/page/Checkout";
import PaymentSuccess from "@/page/PaymentSuccess";
import PaymentFailed from "@/page/PaymentFailed";
import Login from "@/page/Login";
import Register from "@/page/Register";
import NotFound from "@/page/NotFound";
import ProjectDetails from "@/page/ProjectDetails";

// Admin Pages
import Dashboard from "@/page/admin/Dashboard";
import AdminProducts from "@/page/admin/AdminProducts";
import AdminOrders from "@/page/admin/AdminOrders";
import AdminUsers from "@/page/admin/AdminUsers";
import ErrorElement from "@/components/ErrorElement";

import Profile from "@/page/Profile";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <ErrorElement />,
        children: [
            // Public Routes with MainLayout
            {
                element: <MainLayout />,
                children: [
                    {
                        path: "",
                        element: <Home />
                    },
                    {
                        path: "products",
                        element: <ProductListing />
                    },
                    {
                        path: "products/:id",
                        element: <ProductDetail />
                    },
                    {
                        path: "category/:slug",
                        element: <CategoryProducts />
                    },
                    {
                        path: "cart",
                        element: <Cart />
                    },
                    {
                        path: "checkout",
                        element: <Checkout />
                    },
                    {
                        path: "payment/success",
                        element: <PaymentSuccess />
                    },
                    {
                        path: "payment/failed",
                        element: <PaymentFailed />
                    },
                    {
                        path: "order-confirmation",
                        element: <PaymentSuccess />
                    },
                    {
                        path: "project",
                        element: <ProjectDetails />
                    },
                    {
                        path: "profile",
                        element: <Profile />
                    }
                ]
            },
            // Auth Routes (No layout)
            {
                path: "login",
                element: <Login />
            },
            {
                path: "register",
                element: <Register />
            },
            // Admin Routes
            {
                path: "admin",
                element: <AdminLayout />,
                children: [
                    {
                        path: "",
                        element: <Dashboard />
                    },
                    {
                        path: "products",
                        element: <AdminProducts />
                    },
                    {
                        path: "orders",
                        element: <AdminOrders />
                    },
                    {
                        path: "users",
                        element: <AdminUsers />
                    }
                ]
            },
            // 404
            {
                path: "*",
                element: <NotFound />
            }
        ]
    }
]);