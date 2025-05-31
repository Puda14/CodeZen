import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

export const getUserIdFromToken = () => {
  try {
    const token = Cookies.get("token");
    if (!token) return null;

    const decoded = jwtDecode(token);
    return decoded?._id || null;
  } catch (err) {
    return null;
  }
};
