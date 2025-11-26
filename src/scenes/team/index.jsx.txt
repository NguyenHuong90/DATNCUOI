import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import Header from "../../components/Header";
import * as yup from "yup";
import { Formik } from "formik";
import axios from "axios";
import useMediaQuery from "@mui/material/useMediaQuery";

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [teamData, setTeamData] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/auth/users?page=1&limit=10", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamData(res.data.users || []);
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentUser");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!isAdmin) {
      alert("Chỉ admin mới có quyền xóa người dùng!");
      return;
    }
    if (selectionModel.length === 0) {
      alert("Vui lòng chọn ít nhất một người dùng để xóa!");
      return;
    }
    const selectedUsers = teamData.filter((user) => selectionModel.includes(user._id || user.id));
    const hasAdmin = selectedUsers.some((user) => user.role === "admin");

    if (hasAdmin) {
      alert("Bạn không thể xóa tài khoản admin!");
      return;
    }

    if (window.confirm("Bạn có chắc muốn xóa những người dùng đã chọn?")) {
      try {
        const token = localStorage.getItem("token");
        for (const id of selectionModel) {
          await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setTeamData((prev) => prev.filter((user) => !selectionModel.includes(user._id || user.id)));
        setSelectionModel([]);
        alert("Người dùng đã được xóa thành công!");
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentUser");
          window.location.href = "/login";
        } else {
          alert(err.response?.data?.message || "Không thể xóa người dùng!");
        }
      }
    }
  };

  const handleEdit = () => {
    if (!isAdmin) {
      alert("Chỉ admin mới có quyền sửa người dùng!");
      return;
    }
    if (selectionModel.length !== 1) {
      alert("Vui lòng chọn đúng một người dùng để sửa!");
      return;
    }
    const userToEdit = teamData.find((user) => selectionModel[0] === (user._id || user.id));
    setSelectedUser(userToEdit);
    setOpenEditDialog(true);
  };

  const handleAdd = () => {
    if (!isAdmin) {
      alert("Chỉ admin mới có quyền thêm người dùng!");
      return;
    }
    setOpenAddDialog(true);
  };

  const handleEditSubmit = async (values, { resetForm }) => {
    try {
      const token = localStorage.getItem("token");
      const { id, ...updateData } = values;
      await axios.put(`http://localhost:5000/api/auth/users/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamData((prev) =>
        prev.map((user) => ((user._id || user.id) === id ? { ...user, ...updateData } : user))
      );
      if (id === currentUser.id) {
        localStorage.setItem("currentUser", JSON.stringify({ ...currentUser, ...updateData }));
        alert("Bạn đã thay đổi vai trò của chính mình. Trang sẽ tải lại để cập nhật.");
        window.location.reload();
      }
      setOpenEditDialog(false);
      setSelectedUser(null);
      setSelectionModel([]);
      alert("Người dùng đã được cập nhật thành công!");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      } else {
        alert(err.response?.data?.message || "Không thể cập nhật người dùng!");
      }
    }
  };

  const handleAddSubmit = async (values, { resetForm }) => {
    try {
      const token = localStorage.getItem("token");
      const { confirmPassword, ...dataToSend } = values;
      console.log("Data sent to register:", dataToSend); // Thêm log để kiểm tra
      const res = await axios.post("http://localhost:5000/api/auth/register", dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamData((prev) => [...prev, res.data.user]);
      setOpenAddDialog(false);
      resetForm();
      alert("Người dùng đã được thêm thành công!");
    } catch (err) {
      console.error("Register error:", err.response); // Thêm log lỗi
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      } else {
        alert(err.response?.data?.message || "Không thể thêm người dùng!");
      }
    }
  };

  const phoneRegExp = /^(0[1-9][0-9]{8,9})$/;

  const editSchema = yup.object().shape({
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
      .matches(phoneRegExp, "Số điện thoại không hợp lệ (phải là 10-11 số, bắt đầu bằng 0)")
      .required("Vui lòng nhập số điện thoại"),
    address1: yup
      .string()
      .trim()
      .required("Vui lòng nhập địa chỉ")
      .min(5, "Địa chỉ phải có ít nhất 5 ký tự")
      .max(200, "Địa chỉ không được vượt quá 200 ký tự"),
    role: yup
      .string()
      .required("Vui lòng chọn vai trò")
      .oneOf(["admin", "user"], "Vai trò không hợp lệ"),
  });

  const addSchema = yup.object().shape({
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
      .matches(phoneRegExp, "Số điện thoại không hợp lệ (phải là 10-11 số, bắt đầu bằng 0)")
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
      .matches(/^[a-zA-Z0-9_]+$/, "Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới"),
    password: yup
      .string()
      .trim()
      .required("Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .max(50, "Mật khẩu không được vượt quá 50 ký tự")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, "Mật khẩu phải chứa ít nhất một chữ cái và một số"),
    confirmPassword: yup
      .string()
      .trim()
      .required("Vui lòng xác nhận mật khẩu")
      .oneOf([yup.ref("password"), null], "Mật khẩu xác nhận không khớp"),
    role: yup
      .string()
      .required("Vui lòng chọn vai trò")
      .oneOf(["admin", "user"], "Vai trò không hợp lệ"),
  });

  const initialValues = {
    id: "",
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

  const columns = [
    {
      field: "name",
      headerName: "Tên",
      flex: 1,
      renderCell: ({ row }) => `${row.firstName || ""} ${row.lastName || ""}`,
    },
    { field: "username", headerName: "Tên tài khoản", flex: 1 },
    { field: "contact", headerName: "Số điện thoại", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "role",
      headerName: "Vai trò",
      flex: 1,
      renderCell: ({ row }) => (
        <Box
          width="60%"
          m="0 auto"
          p="5px"
          display="flex"
          justifyContent="center"
          backgroundColor={row.role === "admin" ? colors.greenAccent[600] : colors.greenAccent[700]}
          borderRadius="4px"
        >
          {row.role === "admin" && <AdminPanelSettingsOutlinedIcon />}
          {row.role === "user" && <LockOpenOutlinedIcon />}
          <Typography color={colors.grey[100]} sx={{ ml: "5px" }}>
            {row.role}
          </Typography>
        </Box>
      ),
    },
  ];

  if (loading) return <Box m="20px"><Typography>Đang tải dữ liệu...</Typography></Box>;
  if (error) return (
    <Box m="20px">
      <Alert severity="error">{error}</Alert>
      <Button onClick={() => window.location.reload()}>Thử lại</Button>
    </Box>
  );

  return (
    <Box m="20px">
      <Header title="ĐỘI NGŨ" subtitle="Quản lý thành viên đội ngũ" />
      {isAdmin ? (
        <Box>
          {selectionModel.length === 0 && (
            <Alert severity="info" sx={{ mb: "10px" }}>
              Vui lòng tích vào checkbox bên trái để chọn người dùng trước khi xóa hoặc sửa.
            </Alert>
          )}
          <Box display="flex" justifyContent="flex-end" mb="20px" gap="10px">
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={selectionModel.length === 0}
              sx={{
                padding: "12px 24px",
                fontSize: "1.1rem",
                backgroundColor: "#d32f2f",
                "&:hover": { backgroundColor: "#b71c1c" },
                "&:disabled": { backgroundColor: "#f44336", opacity: 0.5 },
              }}
            >
              Xóa
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEdit}
              disabled={selectionModel.length !== 1}
              sx={{
                padding: "12px 24px",
                fontSize: "1.1rem",
                backgroundColor: "#4404abff",
                "&:hover": { backgroundColor: "#4404abff" },
                "&:disabled": { backgroundColor: "#4404abff", opacity: 0.5 },
              }}
            >
              Sửa
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleAdd}
              sx={{
                padding: "12px 24px",
                fontSize: "1.1rem",
                backgroundColor: "#4caf50",
                "&:hover": { backgroundColor: "#388e3c" },
              }}
            >
              Thêm
            </Button>
          </Box>
        </Box>
      ) : (
        <Alert severity="warning" sx={{ mb: "20px" }}>
          Bạn không có quyền admin để quản lý người dùng. Vui lòng đăng nhập với tài khoản admin!
        </Alert>
      )}
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid
          checkboxSelection={isAdmin}
          rows={teamData}
          columns={columns}
          selectionModel={selectionModel}
          onSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
          getRowId={(row) => row._id || row.id}
          pageSize={5}
          rowsPerPageOptions={[5]}
        />
      </Box>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Sửa Thông Tin Người Dùng</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              id: selectedUser?._id || selectedUser?.id || "",
              firstName: selectedUser?.firstName || "",
              lastName: selectedUser?.lastName || "",
              email: selectedUser?.email || "",
              contact: selectedUser?.contact || "",
              address1: selectedUser?.address1 || "",
              role: selectedUser?.role || "user",
            }}
            validationSchema={editSchema}
            onSubmit={handleEditSubmit}
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
                  <FormControl
                    fullWidth
                    variant="filled"
                    error={!!touched.role && !!errors.role}
                    sx={{ gridColumn: "span 4" }}
                  >
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
                <DialogActions>
                  <Button onClick={() => setOpenEditDialog(false)} color="secondary">
                    Hủy
                  </Button>
                  <Button type="submit" color="primary" variant="contained">
                    Lưu
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Thêm Người Dùng Mới</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={initialValues}
            validationSchema={addSchema}
            onSubmit={handleAddSubmit}
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
                  <FormControl
                    fullWidth
                    variant="filled"
                    error={!!touched.role && !!errors.role}
                    sx={{ gridColumn: "span 4" }}
                  >
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
                <DialogActions>
                  <Button onClick={() => setOpenAddDialog(false)} color="secondary">
                    Hủy
                  </Button>
                  <Button type="submit" color="primary" variant="contained">
                    Thêm
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Team;