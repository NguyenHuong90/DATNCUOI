// src/scenes/login/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Avatar,
  Link,
  useTheme,
  CircularProgress,
  Grid,
  Checkbox,
  FormControlLabel,
  Fade,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import Lightbulb from "@mui/icons-material/Lightbulb";
import SpeedIcon from "@mui/icons-material/Speed";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import GoogleIcon from "@mui/icons-material/Google";

const GradientButton = styled(Button)(({ theme }) => ({
  mt: 2,
  py: 1.5,
  borderRadius: "12px",
  background: theme.palette.mode === "dark"
    ? "linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)"
    : "linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)",
  color: "#ffffff",
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 700,
  boxShadow: theme.shadows[8],
  transition: "all 0.3s ease",
  "&:hover": {
    background: theme.palette.mode === "dark"
      ? "linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)"
      : "linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)",
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[12],
  },
}));

const SocialButton = styled(Button)(({ theme }) => ({
  mt: 1,
  py: 1,
  borderRadius: "8px",
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  textTransform: "none",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
  },
}));

const Login = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.token && res.data.refreshToken && res.data.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        localStorage.setItem("currentUser", JSON.stringify(res.data.user));
        if (rememberMe) localStorage.setItem("rememberMe", "true");
        navigate("/dashboard", { replace: true });
      } else {
        throw new Error("Dữ liệu phản hồi không hợp lệ");
      }
    } catch (err) {
      const message =
        err.response?.status === 429
          ? "Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."
          : err.response?.status === 401
          ? "Tên đăng nhập hoặc mật khẩu không đúng"
          : err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)"
          : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
      }}
    >
      {/* LEFT: LOGIN FORM */}
      <Grid
        container
        item
        xs={12}
        md={4}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, md: 4 },
          bgcolor: isDark ? "rgba(27, 38, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(12px)",
          borderRight: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          <Fade in={true} timeout={800}>
            <Box textAlign="center" mb={4}>
              <Avatar
                src="/assets/user.png"
                alt="SkyTech"
                sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 2,
                  border: "4px solid",
                  borderColor: "primary.main",
                  boxShadow: 8,
                }}
              />
              <Typography variant="h4" fontWeight={800} color="primary" letterSpacing={1}>
                SKYTECH
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Hệ thống quản lý đèn thông minh
              </Typography>
            </Box>
          </Fade>

          <Typography variant="h6" fontWeight={600} textAlign="center" mb={3}>
            Đăng Nhập Hệ Thống
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} margin="normal" required
              InputProps={{ startAdornment: <InputAdornment position="start">@</InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" } }} />

            <TextField fullWidth label="Mật khẩu" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required
              InputProps={{
                startAdornment: <InputAdornment position="start">[Lock]</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" } }} />

            <FormControlLabel control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="primary" />} label="Ghi nhớ đăng nhập" sx={{ mt: 1 }} />

            {error && <Paper elevation={0} sx={{ bgcolor: "error.light", color: "error.contrastText", p: 2, borderRadius: 2, mt: 1, textAlign: "center" }}>{error}</Paper>}

            <GradientButton fullWidth type="submit" disabled={loading || !username || !password} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}>
              {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </GradientButton>

            <SocialButton fullWidth startIcon={<GoogleIcon />}>Đăng nhập với Google</SocialButton>
          </form>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              Quên mật khẩu? <Link href="#" underline="none" sx={{ color: "primary.main", fontWeight: 600 }}>Khôi phục ngay</Link>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              © 2025 SkyTech. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* RIGHT: BANNER */}
      <Grid item xs={false} md={8} sx={{
        position: "relative",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 9, lg: 6 },
        bgcolor: isDark ? "#0d1b2a" : "#1976d2",
        color: "white",
        overflow: "hidden",
      }}>
        <Box sx={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(/assets/logoskytech.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          filter: "brightness(0.7)",
        }} />

        <Box sx={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: isDark
            ? "linear-gradient(135deg, rgba(13,27,42,0.85) 0%, rgba(27,38,59,0.75) 100%)"
            : "linear-gradient(135deg, rgba(25,118,210,0.85) 0%, rgba(30,136,229,0.75) 100%)",
        }} />

        <Fade in={true} timeout={1000}>
          <Box sx={{ width: "100%", maxWidth: { md: 700, lg: 900, xl: 1100 }, px: { xs: 2, md: 4, lg: 6 }, textAlign: "center", zIndex: 1 }}>
            <Typography variant="h3" fontWeight={900} mb={3} letterSpacing={2}>SMART LIGHTING</Typography>
            <Typography variant="h6" fontWeight={500} mb={5} sx={{ opacity: 0.95, lineHeight: 1.7 }}>
              Giải pháp đèn thông minh hàng đầu Việt Nam. Tiết kiệm năng lượng, tự động hóa và quản lý từ xa với AI.
            </Typography>

            <Grid container spacing={{ xs: 3, md: 6, lg: 8 }} justifyContent="center" mb={5}>
              <Grid item xs={4} sm={3}><Box textAlign="center"><Typography variant="h4" fontWeight="bold" color="#4caf50">98%</Typography><Typography variant="body2">Tiết kiệm điện</Typography><Lightbulb sx={{ fontSize: 40, color: "#4caf50", mt: 1 }} /></Box></Grid>
              <Grid item xs={4} sm={3}><Box textAlign="center"><Typography variant="h4" fontWeight="bold" color="#00bcd4">24/7</Typography><Typography variant="body2">Giám sát realtime</Typography><SpeedIcon sx={{ fontSize: 40, color: "#00bcd4", mt: 1 }} /></Box></Grid>
              <Grid item xs={4} sm={3}><Box textAlign="center"><Typography variant="h4" fontWeight="bold" color="#ff9800">AI</Typography><Typography variant="body2">Tối ưu tự động</Typography><SmartToyIcon sx={{ fontSize: 40, color: "#ff9800", mt: 1 }} /></Box></Grid>
            </Grid>

            <Typography variant="body1" sx={{ opacity: 0.9, fontStyle: "italic", fontSize: "1.2rem" }}>
              "Công nghệ tương lai, hôm nay"
            </Typography>
          </Box>
        </Fade>
      </Grid>
    </Box>
  );
};

export default Login;