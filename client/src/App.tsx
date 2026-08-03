import React, { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { setUser } from "./redux/slice/authSlice";
import { useAuthCheck } from "./api/authApi";
import { useAppDispatch } from "./hooks/hooks";

export default function App() {
  const dispatch = useAppDispatch();
    const { data: user, isSuccess } = useAuthCheck();
  
    useEffect(() => {
      if (isSuccess && user) {
        dispatch(setUser(user));
      }
    }, [isSuccess, user, dispatch]);
  return (
    <div>
      <Toaster />
      <Outlet />
      <ScrollRestoration />
    </div>
  );
}
