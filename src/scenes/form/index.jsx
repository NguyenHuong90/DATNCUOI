import { useState } from "react";
import {
  Box, Button, TextField, Select, MenuItem, Alert, FormControl, InputLabel,
  Paper, Typography, Avatar, Stack, Chip, CircularProgress, IconButton, Tooltip, Fade,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import axios from "axios";
import { styled } from "@mui/material/styles";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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

const Form = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser?.role === "admin";

  const handleFormSubmit = async (values, { resetForm }) => {
    if (!isAdmin) return alert("Chỉ admin mới có quyền tạo người dùng!");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const { confirmPassword, ...dataToSend } = values;
      await axios.post(`${API_BASE}/api/auth/register`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      resetForm();
      alert("Người dùng đã được tạo thành công!");
      navigate("/team");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
      } else {
        alert(err.response?.data?.message || "Không thể tạo người dùng!");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const phoneRegExp = /^(0[1-9][0-9]{8,9})$/;

  const checkoutSchema = yup.object().shape({
    firstName: yup.string().trim().required("Vui lòng nhập họ").min(2).max(50).matches(/^[a-zA-ZÀ-ỹ\s]+$/),
    lastName: yup.string().trim().required("Vui lòng nhập tên").min(2).max(50).matches(/^[a-zA-ZÀ-ỹ\s]+$/),
    email: yup.string().trim().email("Email không hợp lệ").required("Vui lòng nhập email").max(100),
    contact: yup.string().trim().matches(phoneRegExp, "SĐT phải 10-11 số, bắt đầu bằng 0").required("Vui lòng nhập số điện thoại"),
    address1: yup.string().trim().required("Vui lòng nhập địa chỉ").min(5).max(200),
    username: yup.string().trim().required("Vui lòng nhập tên tài khoản").min(4).max(30).matches(/^[a-zA-Z0-9_]+$/),
    password: yup.string().trim().required("Vui lòng nhập mật khẩu").min(6).matches(/^(?=.*[A-Za-z])(?=.*\d)/),
    confirmPassword: yup.string().trim().required("Vui lòng xác nhận mật khẩu").oneOf([yup.ref("password")], "Mật khẩu không khớp"),
    role: yup.string().required("Vui lòng chọn vai trò").oneOf(["admin", "user"]),
  });

  const initialValues = {
    firstName: "", lastName: "", email: "", contact: "", address1: "",
    username: "", password: "", confirmPassword: "", role: "user",
  };

  if (!isAdmin) {
    return (
      <Box m={{ xs: 1, md: 2 }}>
        <Header title="TẠO NGƯỜI DÙNG" subtitle="Tạo hồ sơ người dùng mới" />
        <Fade in={true} timeout={600}>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, fontSize: "0.8rem" }}>
            Bạn không có quyền admin để tạo người dùng.
          </Alert>
        </Fade>
      </Box>
    );
  }

  return (
    <Box m={{ xs: 1, md: 2 }}>
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <Tooltip title="Quay lại">
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Header title="TẠO NGƯỜI DÙNG MỚI" subtitle="Thêm thành viên vào hệ thống" />
      </Box>

      <Fade in={true} timeout={500}>
        <FormContainer elevation={0}>
          <Box textAlign="center" mb={2}>
            <Avatar sx={{ width: 50, height: 50, mx: "auto", mb: 1, bgcolor: "primary.main" }}>
              <PersonAddAlt1Icon sx={{ fontSize: 28 }} />
            </Avatar>
            <Typography variant="subtitle2" fontWeight={600}>Điền thông tin người dùng</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Tạo tài khoản mới với đầy đủ quyền hạn</Typography>
          </Box>

          <Formik initialValues={initialValues} validationSchema={checkoutSchema} onSubmit={handleFormSubmit}>
            {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue }) => (
              <form onSubmit={handleSubmit}>
                <Box display="grid" gap="10px" gridTemplateColumns={isNonMobile ? "repeat(2, 1fr)" : "1fr"}>
                  <TextField fullWidth size="small" label="Họ" name="firstName" value={values.firstName} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.firstName && !!errors.firstName} helperText={touched.firstName && errors.firstName} />
                  <TextField fullWidth size="small" label="Tên" name="lastName" value={values.lastName} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.lastName && !!errors.lastName} helperText={touched.lastName && errors.lastName} />
                  <TextField fullWidth size="small" label="Email" name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.email && !!errors.email} helperText={touched.email && errors.email} />
                  <TextField fullWidth size="small" label="Số điện thoại" name="contact" value={values.contact} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.contact && !!errors.contact} helperText={touched.contact && errors.contact} />
                  <TextField fullWidth size="small" label="Địa chỉ" name="address1" value={values.address1} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.address1 && !!errors.address1} helperText={touched.address1 && errors.address1} sx={{ gridColumn: "span 2" }} />
                  <TextField fullWidth size="small" label="Tên tài khoản" name="username" value={values.username} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.username && !!errors.username} helperText={touched.username && errors.username} />
                  <TextField fullWidth size="small" label="Mật khẩu" name="password" type="password" value={values.password} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.password && !!errors.password} helperText={touched.password && errors.password} />
                  <TextField fullWidth size="small" label="Xác nhận mật khẩu" name="confirmPassword" type="password" value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                    error={!!touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
                  <FormControl fullWidth size="small">
                    <InputLabel>Vai trò</InputLabel>
                    <Select value={values.role} onChange={(e) => setFieldValue("role", e.target.value)} label="Vai trò">
                      <MenuItem value="user"><Chip label="USER" color="primary" size="small" sx={{ mr: 1 }} />Người dùng</MenuItem>
                      <MenuItem value="admin"><Chip label="ADMIN" color="success" size="small" sx={{ mr: 1 }} />Quản trị viên</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
                  <Button variant="outlined" color="inherit" onClick={() => navigate(-1)} sx={{ borderRadius: 8, px: 2, fontSize: "0.75rem" }}>Hủy bỏ</Button>
                  <GradientButton type="submit" disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : <PersonAddAlt1Icon fontSize="small" />}>
                    {submitting ? "Đang tạo..." : "Tạo người dùng"}
                  </GradientButton>
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