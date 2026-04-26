export const dashboardRoutes = {
  user: "/user/dashboard",
  deliveryBoy: "/delivery/dashboard",
  admin: "/admin/dashboard",
};

export const notificationRoutes = {
  user: "/user/notifications",
  deliveryBoy: "/delivery/notifications",
  admin: "/admin/notifications",
};

export const getDashboardPath = (role) => {
  if (!role) return "/";
  return dashboardRoutes[role] || "/";
};

export const getNotificationPath = (role) => notificationRoutes[role] || "/notifications";

export const getPostAuthPath = ({ role, mobile }) => {
  if (role === "admin") {
    return getDashboardPath(role);
  }

  if (!mobile) {
    return "/complete-profile";
  }

  return getDashboardPath(role);
};
