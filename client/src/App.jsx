import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { disconnectSocket, getSocket } from "./api/socket.js";
import { getPostAuthPath } from "./lib/appRoutes.js";
import AddGrocery from "./pages/AddGrocery.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminGroceries from "./pages/AdminGroceries.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AuthRedirect from "./pages/AuthRedirect.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import CompleteProfile from "./pages/CompleteProfile.jsx";
import DeliveryDashboard from "./pages/DeliveryDashboard.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import Notifications from "./pages/Notifications.jsx";
import OrderResult from "./pages/OrderResult.jsx";
import Register from "./pages/Register.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import { fetchMe } from "./store/authSlice.js";
import { syncCartOwner } from "./store/cartSlice.js";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const isGuestLanding = location.pathname === "/" && !user;
  const hideNav = isAuthPage || isGuestLanding;

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    dispatch(syncCartOwner(user?.id));
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }
  }, [user?.id]);

  return (
    <>
      {!hideNav && <NavBar />}
      <div className={hideNav ? "" : "pt-28 sm:pt-32"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={user ? <Navigate to={getPostAuthPath(user)} replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to={getPostAuthPath(user)} replace /> : <Register />}
          />
          <Route path="/auth/redirect" element={<AuthRedirect />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute roles={["user"]} requireProfile />}>
            <Route path="/user/cart" element={<Cart />} />
            <Route path="/user/checkout" element={<Checkout />} />
            <Route path="/user/track-order/:id" element={<TrackOrder />} />
            <Route path="/user/orders/track/:id" element={<TrackOrder />} />
            <Route path="/user/order-success" element={<OrderResult />} />
            <Route path="/user/orders/success" element={<OrderResult />} />
            <Route path="/user/order-cancel" element={<OrderResult cancelled />} />
            <Route path="/user/orders/cancel" element={<OrderResult cancelled />} />
          </Route>

          <Route element={<ProtectedRoute roles={["user"]} requireProfile />}>
            <Route path="/user/dashboard" element={<Home />} />
            <Route path="/user/orders" element={<MyOrders />} />
            <Route path="/user/my-orders" element={<MyOrders />} />
            <Route path="/user/notifications" element={<Notifications />} />
          </Route>

          <Route element={<ProtectedRoute roles={["user", "deliveryBoy"]} />}>
            <Route path="/complete-profile" element={<CompleteProfile />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/add-grocery" element={<AddGrocery />} />
            <Route path="/admin/groceries" element={<AdminGroceries />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/admin/view-grocery" element={<Navigate to="/admin/groceries" replace />} />
            <Route path="/admin/manage-orders" element={<Navigate to="/admin/orders" replace />} />
            <Route path="/admin/groceries/add" element={<Navigate to="/admin/add-grocery" replace />} />
            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          <Route element={<ProtectedRoute roles={["deliveryBoy"]} requireProfile />}>
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
            <Route path="/delivery/notifications" element={<Notifications />} />
          </Route>

          <Route element={<ProtectedRoute roles={["user", "deliveryBoy", "admin"]} />}>
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
