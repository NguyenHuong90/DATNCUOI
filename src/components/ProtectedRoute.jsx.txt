import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    let isMounted = true;
    console.log("Checking token:", token);

    const verifyToken = async () => {
      if (!token) {
        console.log("No token, redirecting to login");
        if (isMounted) navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Token verification success:", response.data);
      } catch (err) {
        console.error("Token verification error:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        if (err.response?.status === 401 || err.code === "ECONNREFUSED") {
          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken && isMounted) {
              const refreshResponse = await axios.post("http://localhost:5000/api/auth/refresh", { refreshToken }, {
                headers: { "Content-Type": "application/json" },
              });
              localStorage.setItem("token", refreshResponse.data.token);
              console.log("Token refreshed successfully:", refreshResponse.data.token);
            } else if (isMounted) {
              console.log("No refresh token, redirecting to login");
              localStorage.clear();
              navigate("/login", { replace: true });
            }
          } catch (refreshErr) {
            console.error("Refresh token error:", {
              status: refreshErr.response?.status,
              data: refreshErr.response?.data,
              message: refreshErr.message,
            });
            if (isMounted) {
              localStorage.clear();
              navigate("/login", { replace: true });
            }
          }
        }
      }
    };

    if (token) verifyToken();

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  return token ? children : null;
};

export default ProtectedRoute;