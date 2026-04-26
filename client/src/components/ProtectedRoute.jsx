import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ roles, requireProfile = false }) {
  const location = useLocation();
  const { user, status } = useSelector((state) => state.auth);

  if (status === "idle" || status === "loading") {
    return (
      <div className="mx-auto w-[94%] max-w-7xl pb-16">
        <div className="glass-panel-strong rounded-[32px] p-10 text-center text-sm font-semibold text-slate-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (requireProfile && !user.mobile) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
