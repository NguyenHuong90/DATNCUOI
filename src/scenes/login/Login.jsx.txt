import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";

const StyledButton = styled(Button)(({ theme }) => ({
  mt: 3,
  py: 1.5,
  borderRadius: "8px",
  background: "linear-gradient(90deg, #1976d2, #42a5f5)",
  color: "#ffffff",
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(90deg, #1565c0, #2196f3)",
    transform: "scale(1.05)",
    boxShadow: "0 6px 15px rgba(25, 118, 210, 0.4)",
  },
}));

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Sending login request:", { username, password });
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      }, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Login response:", res.data);
      if (res.data.token && res.data.refreshToken && res.data.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: res.data.user.id,
            username: res.data.user.username,
            role: res.data.user.role,
            firstName: res.data.user.firstName,
            lastName: res.data.user.lastName,
            email: res.data.user.email,
            contact: res.data.user.contact,
            address1: res.data.user.address1,
          })
        );
        console.log("LocalStorage after login:", {
          token: localStorage.getItem("token"),
          refreshToken: localStorage.getItem("refreshToken"),
          currentUser: localStorage.getItem("currentUser"),
        });
        console.log("Navigating to dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        console.error("Missing data in response:", res.data);
        throw new Error("Phản hồi từ server không chứa đầy đủ dữ liệu.");
      }
    } catch (err) {
      console.error("Login error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const message = err.response?.status === 429
        ? "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút."
        : err.response?.status === 401
        ? "Thông tin đăng nhập không hợp lệ"
        : err.response?.data?.message || "Đăng nhập thất bại!";
      setError(message);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundColor: "#f5f7fa",
        fontFamily: '"Poppins", sans-serif',
        animation: "fadeIn 0.5s ease-in-out",
        width: "100%",
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>

      <Box
        p={4}
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
          width: { xs: "90%", sm: 400 },
          maxWidth: 400,
          textAlign: "center",
          animation: "fadeIn 0.5s ease-in-out",
          margin: "0 auto",
        }}
      >
        <Box mb={3}>
          <img
            src={process.env.PUBLIC_URL + "/assets/logoskytech.png"}
            alt="Logo"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              display: "block",
              margin: "0 auto",
            }}
          />
        </Box>

        <Typography
          variant="h4"
          mb={2}
          color="#05814fff"
          fontWeight="bold"
          sx={{ fontFamily: '"Poppins", sans-serif' }}
        >
          SKYTECH
        </Typography>

        <Typography
          variant="h6"
          mb={4}
          color="#666"
          sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 500 }}
        >
          Đăng Nhập Vào Hệ Thống
        </Typography>

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Tên tài khoản"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                "& fieldset": { borderColor: "#e0e0e0" },
                "&:hover fieldset": { borderColor: "#1976d2" },
                "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                "& input": { color: "#333" },
              },
              "& .MuiInputLabel-root": { color: "#666" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#1976d2" },
            }}
          />
          <TextField
            fullWidth
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                "& fieldset": { borderColor: "#e0e0e0" },
                "&:hover fieldset": { borderColor: "#1976d2" },
                "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                "& input": { color: "#333" },
              },
              "& .MuiInputLabel-root": { color: "#666" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#1976d2" },
            }}
          />
          {error && (
            <Typography
              color="#d32f2f"
              mt={1}
              sx={{ fontSize: "0.9rem", fontFamily: '"Poppins", sans-serif' }}
            >
              {error}
            </Typography>
          )}
          <StyledButton fullWidth type="submit" variant="contained">
            Đăng Nhập
          </StyledButton>
        </form>
      </Box>
    </Box>
  );
};

export default Login;