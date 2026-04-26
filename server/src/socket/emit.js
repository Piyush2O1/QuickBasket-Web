import { User } from "../models/user.model.js";

const getSocketIds = (users) =>
  [...new Set((users || []).map((user) => user?.socketId).filter(Boolean).map(String))];

export const emitToSocketIds = (io, socketIds, event, data) => {
  getSocketIds((socketIds || []).map((socketId) => ({ socketId }))).forEach((socketId) => {
    io?.to(socketId).emit(event, data);
  });
};

export const emitToUser = (io, user, event, data) => {
  if (user?.socketId) {
    io?.to(String(user.socketId)).emit(event, data);
  }
};

export const emitToRoles = async (io, roles, event, data) => {
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];
  const users = await User.find({
    role: { $in: normalizedRoles },
    socketId: { $ne: null },
    isOnline: true,
  }).select("socketId");

  emitToSocketIds(io, users.map((user) => user.socketId), event, data);
};
