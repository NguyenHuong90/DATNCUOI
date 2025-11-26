import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

// BIẾN MÔI TRƯỜNG – HOẠT ĐỘNG CẢ LOCAL + VERCEL
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
        await axios.get(`${API_BASE}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
      } catch (err) {
        if (err.response?.status === 401) {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const res = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
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
          setIsAuthenticated(true);
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