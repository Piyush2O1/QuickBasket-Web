export const adminOrderStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "out of delivery", label: "Out for delivery" },
];

const orderStatusMeta = {
  pending: {
    label: "Pending",
    badgeClasses: "bg-yellow-100 text-yellow-700",
  },
  "out of delivery": {
    label: "Out for delivery",
    badgeClasses: "bg-blue-100 text-blue-700",
  },
  delivered: {
    label: "Delivered",
    badgeClasses: "bg-green-100 text-green-700",
  },
  cancelled: {
    label: "Cancelled",
    badgeClasses: "bg-red-100 text-red-700",
  },
};

export const getOrderStatusMeta = (status) =>
  orderStatusMeta[status] || {
    label: status || "Unknown",
    badgeClasses: "bg-slate-100 text-slate-700",
  };
