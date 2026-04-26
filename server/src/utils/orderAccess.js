export const canAccessOrder = (order, user) => {
  if (!order || !user) {
    return false;
  }

  const userId = user._id?.toString?.() || user.id?.toString?.();
  const orderUserId = order.user?._id?.toString?.() || order.user?.toString?.();
  const assignedDeliveryBoyId =
    order.assignedDeliveryBoy?._id?.toString?.() || order.assignedDeliveryBoy?.toString?.();

  return user.role === "admin" || orderUserId === userId || assignedDeliveryBoyId === userId;
};
