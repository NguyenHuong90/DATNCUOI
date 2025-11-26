import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Alert,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  Avatar,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Fade,
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

// Styled components
const FormContainer = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "20px",
  boxShadow: theme.shadows[8],
  backdropFilter: "blur(12px)",
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[16],
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  mt: 3,
  py: 1.5,
  borderRadius: "12px",
  background: "linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)",
  color: "#ffffff",
  textTransform: "none",
  fontSize: "1.1rem",
  fontWeight: 700,
  boxShadow: theme.shadows[8],
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)",
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[12],
  },
  "&:disabled": {
    background: "#90caf9",
    opacity: 0.7,
  },
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

      await axios.post("http://localhost:5000/api/auth/register", dataToSend, {
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
    firstName: yup
      .string()
      .trim()
      .required("Vui lòng nhập họ")
      .min(2, "Họ phải có ít nhất 2 ký tự")
      .max(50, "Họ không được vượt quá 50 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Họ chỉ được chứa chữ cái và khoảng trắng"),
    lastName: yup
      .string()
      .trim()
      .required("Vui lòng nhập tên")
      .min(2, "Tên phải có ít nhất 2 ký tự")
      .max(50, "Tên không được vượt quá 50 ký tự")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Tên chỉ được chứa chữ cái và khoảng trắng"),
    email: yup
      .string()
      .trim()
      .email("Email không hợp lệ")
      .required("Vui lòng nhập email")
      .max(100, "Email không được vượt quá 100 ký tự"),
    contact: yup
      .string()
      .trim()
      .matches(phoneRegExp, "SĐT phải 10-11 số, bắt đầu bằng 0")
      .required("Vui lòng nhập số điện thoại"),
    address1: yup
      .string()
      .trim()
      .required("Vui lòng nhập địa chỉ")
      .min(5, "Địa chỉ phải có ít nhất 5 ký tự")
      .max(200, "Địa chỉ không được vượt quá 200 ký tự"),
    username: yup
      .string()
      .trim()
      .required("Vui lòng nhập tên tài khoản")
      .min(4, "Tên tài khoản phải có ít nhất 4 ký tự")
      .max(30, "Tên tài khoản không được vượt quá 30 ký tự")
      .matches(/^[a-zA-Z0-9_]+$/, "Chỉ chứa chữ, số và _"),
    password: yup
      .string()
      .trim()
      .required("Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/, "Phải có chữ và số"),
    confirmPassword: yup
      .string()
      .trim()
      .required("Vui lòng xác nhận mật khẩu")
      .oneOf([yup.ref("password")], "Mật khẩu không khớp"),
    role: yup
      .string()
      .required("Vui lòng chọn vai trò")
      .oneOf(["admin", "user"], "Vai trò không hợp lệ"),
  });

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    address1: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "user",
  };

  if (!isAdmin) {
    return (
      <Box m={{ xs: "10px", md: "20px" }}>
        <Header title="TẠO NGƯỜI DÙNG" subtitle="Tạo hồ sơ người dùng mới" />
        <Fade in={true} timeout={600}>
          <Alert severity="warning" sx={{ mt: 3, borderRadius: 3, fontSize: "1rem" }}>
            Bạn không có quyền admin để tạo người dùng. Vui lòng đăng nhập với tài khoản quản trị viên!
          </Alert>
        </Fade>
      </Box>
    );
  }

  return (
    <Box m={{ xs: "10px", md: "20px" }}>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Tooltip title="Quay lại">
          <IconButton onClick={() => navigate(-1)} size="large">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Header title="TẠO NGƯỜI DÙNG MỚI" subtitle="Thêm thành viên vào hệ thống" />
      </Box>

      <Fade in={true} timeout={800}>
        <FormContainer elevation={0} sx={{ p: { xs: 3, md: 5 } }}>
          <Box textAlign="center" mb={4}>
            <Avatar
              sx={{
                width: 90,
                height: 90,
                mx: "auto",
                mb: 2,
                bgcolor: "primary.main",
                boxShadow: 8,
              }}
            >
              <PersonAddAlt1Icon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              Điền thông tin người dùng
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Tạo tài khoản mới với đầy đủ quyền hạn
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
              setFieldValue,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box
                  display="grid"
                  gap="24px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                  sx={{
                    "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                  }}
                >
                  {/* HỌ & TÊN */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Họ"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.firstName}
                    name="firstName"
                    error={!!touched.firstName && !!errors.firstName}
                    helperText={touched.firstName && errors.firstName}
                    sx={{ gridColumn: "span 2" }}
                  />
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Tên"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.lastName}
                    name="lastName"
                    error={!!touched.lastName && !!errors.lastName}
                    helperText={touched.lastName && errors.lastName}
                    sx={{ gridColumn: "span 2" }}
                  />

                  {/* EMAIL & SĐT */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="email"
                    label="Email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.email}
                    name="email"
                    error={!!touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                    sx={{ gridColumn: "span 4" }}
                  />
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Số điện thoại"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.contact}
                    name="contact"
                    error={!!touched.contact && !!errors.contact}
                    helperText={touched.contact && errors.contact}
                    sx={{ gridColumn: "span 4" }}
                  />

                  {/* ĐỊA CHỈ */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Địa chỉ"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.address1}
                    name="address1"
                    error={!!touched.address1 && !!errors.address1}
                    helperText={touched.address1 && errors.address1}
                    sx={{ gridColumn: "span 4" }}
                  />

                  {/* USERNAME & PASSWORD */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Tên tài khoản"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.username}
                    name="username"
                    error={!!touched.username && !!errors.username}
                    helperText={touched.username && errors.username}
                    sx={{ gridColumn: "span 2" }}
                  />
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="password"
                    label="Mật khẩu"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.password}
                    name="password"
                    error={!!touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                    sx={{ gridColumn: "span 2" }}
                  />
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="password"
                    label="Xác nhận mật khẩu"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.confirmPassword}
                    name="confirmPassword"
                    error={!!touched.confirmPassword && !!errors.confirmPassword}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    sx={{ gridColumn: "span 2" }}
                  />

                  {/* VAI TRÒ */}
                  <FormControl fullWidth variant="outlined" sx={{ gridColumn: "span 4" }}>
                    <InputLabel>Vai trò</InputLabel>
                    <Select
                      value={values.role}
                      onChange={(e) => setFieldValue("role", e.target.value)}
                      label="Vai trò"
                    >
                      <MenuItem value="user">
                        <Chip label="USER" color="primary" size="small" sx={{ mr: 1 }} />
                        Người dùng
                      </MenuItem>
                      <MenuItem value="admin">
                        <Chip label="ADMIN" color="success" size="small" sx={{ mr: 1 }} />
                        Quản trị viên
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={4}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate(-1)}
                    sx={{ borderRadius: "12px", px: 3 }}
                  >
                    Hủy bỏ
                  </Button>

                  <GradientButton
                    type="submit"
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : <PersonAddAlt1Icon />}
                  >
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