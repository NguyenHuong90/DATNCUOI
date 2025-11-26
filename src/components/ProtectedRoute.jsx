import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false); // ✅ Trạng thái xác thực
  const token = localStorage.getItem("token");

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        await axios.get("http://localhost:5000/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) setIsVerified(true); // ✅ Token hợp lệ → cho phép hiển thị
      } catch (err) {
        if (err.response?.status === 401) {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const refreshResponse = await axios.post(
                "http://localhost:5000/api/auth/refresh",
                { refreshToken },
                { headers: { "Content-Type": "application/json" } }
              );
              localStorage.setItem("token", refreshResponse.data.token);
              if (isMounted) setIsVerified(true);
              return;
            } catch (refreshErr) {
              console.error("Refresh token failed:", refreshErr);
            }
          }
          localStorage.clear();
          if (isMounted) navigate("/login", { replace: true });
        } else if (err.code === "ECONNREFUSED") {
          console.warn("Server not responding — skip verify");
          if (isMounted) setIsVerified(true); // ✅ Cho phép tạm vào dashboard khi server verify off
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  // ✅ Tránh return null khi chưa xác minh xong
  if (!isVerified) {
    return <div style={{ textAlign: "center", marginTop: "20%" }}>Đang kiểm tra xác thực...</div>;
  }

  return children;
};

export default ProtectedRoute;
