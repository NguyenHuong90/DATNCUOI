import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        await axios.get("http://localhost:5000/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
      } catch (err) {
        // Token sai → thử refresh
        if (err.response?.status === 401) {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const res = await axios.post("http://localhost:5000/api/auth/refresh", { refreshToken });
              localStorage.setItem("token", res.data.token);
              setIsAuthenticated(true);
            } catch {
              localStorage.clear();
              setIsAuthenticated(false);
            }
          } else {
            localStorage.clear();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(true); // Server chết vẫn cho vào tạm
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  if (isLoading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#141b2d" }}>
        <CircularProgress color="primary" />
        <Typography ml={2} color="white">Đang tải...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;