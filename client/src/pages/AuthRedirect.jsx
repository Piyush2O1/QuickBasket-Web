import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { getPostAuthPath } from "../lib/appRoutes.js";

export default function AuthRedirect() {
  const navigate = useNavigate();
  const { user, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (status === "loading" || status === "idle") return;

    if (!user) {
      navigate("/login?reauth=1", { replace: true });
      return;
    }

    navigate(getPostAuthPath(user), { replace: true });
  }, [navigate, status, user]);

  if (status === "loading" || status === "idle") {
    return (
      <main className="mx-auto w-[94%] max-w-4xl pb-16">
        <div className="glass-panel-strong rounded-[32px] p-10 text-center font-semibold text-slate-500">
          Redirecting...
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login?reauth=1" replace />;
  }

  return null;
}
