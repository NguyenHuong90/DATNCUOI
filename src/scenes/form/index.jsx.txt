import { Box, Button, TextField, Select, MenuItem, Alert, FormControl, InputLabel } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import axios from "axios";

const Form = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser?.role === "admin";

  const handleFormSubmit = async (values, { resetForm }) => {
    if (!isAdmin) {
      alert("Chỉ admin mới có quyền tạo người dùng mới!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/auth/register", values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      resetForm();
      alert("Người dùng đã được tạo thành công!");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      } else {
        const message = err.response?.data?.message || "Không thể tạo người dùng!";
        alert(message);
      }
    }
  };

  if (!isAdmin) {
    return (
      <Box m="20px">
        <Header title="TẠO NGƯỜI DÙNG" subtitle="Tạo hồ sơ người dùng mới" />
        <Alert severity="warning" sx={{ mt: "20px" }}>
          Bạn không có quyền admin để tạo người dùng. Vui lòng đăng nhập với tài khoản admin!
        </Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="TẠO NGƯỜI DÙNG" subtitle="Tạo hồ sơ người dùng mới" />
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
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
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              <TextField
                fullWidth
                variant="filled"
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
                variant="filled"
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
              <TextField
                fullWidth
                variant="filled"
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
                variant="filled"
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
              <TextField
                fullWidth
                variant="filled"
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
              <TextField
                fullWidth
                variant="filled"
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
                variant="filled"
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
                variant="filled"
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
              <FormControl fullWidth variant="filled" error={!!touched.role && !!errors.role} sx={{ gridColumn: "span 4" }}>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={values.role}
                  onChange={(e) => setFieldValue("role", e.target.value)}
                  label="Vai trò"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" justifyContent="end" mt="20px">
              <Button type="submit" color="secondary" variant="contained">
                Tạo người dùng mới
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

// Schema và initial values
const phoneRegExp = /^(0[1-9][0-9]{8,9})$/;

const checkoutSchema = yup.object().shape({
  firstName: yup.string().trim().required("Vui lòng nhập họ").min(2, "Họ phải có ít nhất 2 ký tự").max(50, "Họ không được vượt quá 50 ký tự").matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Họ chỉ được chứa chữ cái và khoảng trắng"),
  lastName: yup.string().trim().required("Vui lòng nhập tên").min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không được vượt quá 50 ký tự").matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Tên chỉ được chứa chữ cái và khoảng trắng"),
  email: yup.string().trim().email("Email không hợp lệ").required("Vui lòng nhập email").max(100, "Email không được vượt quá 100 ký tự"),
  contact: yup.string().trim().matches(phoneRegExp, "Số điện thoại không hợp lệ (phải là 10-11 số, bắt đầu bằng 0)").required("Vui lòng nhập số điện thoại"),
  address1: yup.string().trim().required("Vui lòng nhập địa chỉ").min(5, "Địa chỉ phải có ít nhất 5 ký tự").max(200, "Địa chỉ không được vượt quá 200 ký tự"),
  username: yup.string().trim().required("Vui lòng nhập tên tài khoản").min(4, "Tên tài khoản phải có ít nhất 4 ký tự").max(30, "Tên tài khoản không được vượt quá 30 ký tự").matches(/^[a-zA-Z0-9_]+$/, "Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới"),
  password: yup.string().trim().required("Vui lòng nhập mật khẩu").min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(50, "Mật khẩu không được vượt quá 50 ký tự").matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, "Mật khẩu phải chứa ít nhất một chữ cái và một số"),
  confirmPassword: yup.string().trim().required("Vui lòng xác nhận mật khẩu").oneOf([yup.ref("password"), null], "Mật khẩu xác nhận không khớp"),
  role: yup.string().required("Vui lòng chọn vai trò").oneOf(["admin", "user"], "Vai trò không hợp lệ"),
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

export default Form;
