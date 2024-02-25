import { UserRole } from "../Models/EnumUser";

export const checkRole = function (role: string | undefined) {
  switch (role) {
    case "admin":
      return UserRole.admin;
    case "leadGuide":
      return UserRole.leadGuide;
    case "guide":
      return UserRole.guide;
    case "user":
      return UserRole.user;
    default:
      return UserRole.user;
  }
};
