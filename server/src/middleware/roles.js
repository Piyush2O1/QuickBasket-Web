import { forbidden } from "../utils/httpError.js";

export const allowRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw forbidden("You do not have permission for this action");
    }

    next();
  };
};
