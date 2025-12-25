import { useState } from "react";
import {
  Box, Button, TextField, Alert, Paper, Typography, Avatar, Stack, CircularProgress, IconButton, Tooltip, Fade,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import axios from "axios";
import { styled } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GoogleIcon from "@mui/icons-material/Google"; // ← THÊM DUY NHẤT DÒNG NÀY
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const FormContainer = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "10px",
  boxShadow: theme.shadows[3],
  border: `1px solid ${theme.palette.divider}`,
  padding: "12px",
  maxWidth: "480px",
  width: "90%",
  margin: "0 auto",
  overflowY: "hidden",
}));

const GradientButton = styled(Button)(({ theme }) => ({
  py: 0.8, px: 2, borderRadius: "8px",
  background: "linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)",
  color: "#fff", textTransform: "none", fontWeight: 600, fontSize: "0.8rem",
  "&:hover": {
    background: "linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)",
    transform: "translateY(-1px)",
  },
  "&:disabled": { background: "#90caf9", opacity: 0.7 },
}));

// THÊM STYLE RIÊNG CHO NÚT GOOGLE (giữ màu chuẩn Google)
const GoogleButton = styled(Button)(({ theme }) => ({
  borderRadius: "8px",
  border: "1px solid #dadce0",
  backgroundColor: "#fff",
  color: "#3c4043",
  textTransform: "none",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#f8f9fa",
    border: "1px solid #dadce0",
  },
}));

const Form = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, values);
      const { token, refreshToken, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("currentUser", JSON.stringify(user));

      navigate("/team");
    } catch (err) {
      alert(err.response?.data?.message || "Đăng nhập thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  // THÊM HÀM XỬ LÝ GOOGLE LOGIN (chỉ redirect sang backend)
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const checkoutSchema = yup.object().shape({
    username: yup.string().required("Vui lòng nhập tên tài khoản"),
    password: yup.string().required("Vui lòng nhập mật khẩu"),
  });

  const initialValues = {
    username: "",
    password: "",
  };

  return (
    <Box m={{ xs: 1, md: 2 }}>
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <Tooltip title="Quay lại">
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Header title="ĐĂNG NHẬP" subtitle="Truy cập vào hệ thống" />
      </Box>

      <Fade in={true} timeout={500}>
        <FormContainer elevation={0}>
          <Box textAlign="center" mb={2}>
            <Avatar sx={{ width: 50, height: 50, mx: "auto", mb: 1, bgcolor: "primary.main" }}>
              <ArrowBackIcon sx={{ fontSize: 28 }} /> {/* giữ icon cũ nếu bạn muốn, hoặc thay bằng LockIcon */}
            </Avatar>
            <Typography variant="subtitle2" fontWeight={600}>Chào mừng trở lại</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Đăng nhập bằng tài khoản hoặc Google
            </Typography>
          </Box>

          <Formik
            initialValues={initialValues}
            validationSchema={checkoutSchema}
            onSubmit={handleFormSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
              isSubmitting,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box display="grid" gap="10px" gridTemplateColumns={isNonMobile ? "repeat(2, 1fr)" : "1fr"}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tên tài khoản"
                    name="username"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!touched.username && !!errors.username}
                    helperText={touched.username && errors.username}
                    sx={{ gridColumn: isNonMobile ? "span 2" : "1" }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                    sx={{ gridColumn: isNonMobile ? "span 2" : "1" }}
                  />
                </Box>

                <Stack direction="column" spacing={2} mt={3}>
                  <GradientButton
                    type="submit"
                    fullWidth
                    disabled={submitting || isSubmitting}
                    startIcon={submitting ? <CircularProgress size={16} /> : null}
                  >
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                  </GradientButton>

                  {/* CHỈ THÊM NÚT GOOGLE Ở ĐÂY */}
                  <GoogleButton
                    fullWidth
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleLogin}
                  >
                    Đăng nhập bằng Google
                  </GoogleButton>
                </Stack>
              </form>
            )}
          </Formik>
        </FormContainer>
      </Fade>
    </Box>
  );
};

export default Form;
