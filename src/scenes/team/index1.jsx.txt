import { useState, useEffect, useMemo } from "react";
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
  Chip,
  Stack,
  IconButton,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Avatar,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import Header from "../../components/Header";
import * as yup from "yup";
import { Formik } from "formik";
import axios from "axios";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";

// Styled components
const ActionCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
  borderRadius: "16px",
  boxShadow: theme.shadows[4],
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[12],
    transform: "translateY(-4px)",
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
  borderRadius: "16px",
  boxShadow: theme.shadows[6],
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[12],
  },
}));

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [pageSize, setPageSize] = useState(10);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser?.role === "admin";

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = teamData.filter(user => 
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    return filtered;
  }, [teamData, searchTerm, filterRole]);

  // Stats
  const adminCount = filteredData.filter(user => user.role === "admin").length;
  const userCount = filteredData.filter(user => user.role === "user").length;
  const totalCount = filteredData.length;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/auth/users?page=1&limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamData(res.data.users || []);
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!isAdmin) return alert("Chỉ admin mới có quyền xóa!");
    if (selectionModel.length === 0) return alert("Vui lòng chọn người dùng!");

    const selectedUsers = teamData.filter(u => selectionModel.includes(u._id));
    if (selectedUsers.some(u => u.role === "admin")) return alert("Không thể xóa admin!");

    if (!window.confirm(`Xóa ${selectionModel.length} người dùng?`)) return;

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectionModel.map(id => 
          axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setTeamData(prev => prev.filter(u => !selectionModel.includes(u._id)));
      setSelectionModel([]);
      alert("Xóa thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi xóa!");
    }
  };

  const handleEdit = () => {
    if (!isAdmin) return alert("Chỉ admin mới có quyền sửa!");
    if (selectionModel.length !== 1) return alert("Chọn đúng 1 người dùng!");

    const user = teamData.find(u => u._id === selectionModel[0]);
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleAdd = () => {
    if (!isAdmin) return alert("Chỉ admin mới có quyền thêm!");
    setOpenAddDialog(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const { id, ...data } = values;
      await axios.put(`http://localhost:5000/api/auth/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamData(prev => prev.map(u => u._id === id ? { ...u, ...data } : u));
      if (id === currentUser._id) {
        localStorage.setItem("currentUser", JSON.stringify({ ...currentUser, ...data }));
        alert("Cập nhật vai trò thành công. Tải lại trang...");
        window.location.reload();
      }
      setOpenEditDialog(false);
      setSelectionModel([]);
      alert("Cập nhật thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi cập nhật!");
    }
  };

  const handleAddSubmit = async (values, { resetForm }) => {
    try {
      const token = localStorage.getItem("token");
      const { confirmPassword, ...data } = values;
      const res = await axios.post("http://localhost:5000/api/auth/register", data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamData(prev => [...prev, res.data.user]);
      setOpenAddDialog(false);
      resetForm();
      alert("Thêm thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi thêm người dùng!");
    }
  };

  const phoneRegExp = /^(0[1-9][0-9]{8,9})$/;

  const editSchema = yup.object().shape({
    firstName: yup.string().trim().required("Nhập họ").min(2).max(50),
    lastName: yup.string().trim().required("Nhập tên").min(2).max(50),
    email: yup.string().email("Email sai").required("Nhập email"),
    contact: yup.string().matches(phoneRegExp, "SĐT sai").required("Nhập SĐT"),
    address1: yup.string().trim().required("Nhập địa chỉ").min(5).max(200),
    role: yup.string().oneOf(["admin", "user"]).required("Chọn vai trò"),
  });

  const addSchema = yup.object().shape({
    ...editSchema.fields,
    username: yup.string().trim().required("Nhập tên tài khoản").min(4).max(30).matches(/^[a-zA-Z0-9_]+$/),
    password: yup.string().trim().required("Nhập mật khẩu").min(6).matches(/^(?=.*[A-Za-z])(?=.*\d)/),
    confirmPassword: yup.string().oneOf([yup.ref("password")], "Mật khẩu không khớp").required(),
  });

  const columns = [
    {
      field: "avatar",
      headerName: "",
      width: 70,
      renderCell: ({ row }) => (
        <Avatar
          sx={{
            bgcolor: row.role === "admin" ? colors.greenAccent[600] : colors.blueAccent[600],
            width: 40,
            height: 40,
            fontWeight: 700,
          }}
        >
          {(row.firstName?.[0] || "") + (row.lastName?.[0] || "")}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Họ & Tên",
      flex: 1,
      renderCell: ({ row }) => (
        <Box>
          <Typography fontWeight={600}>{`${row.firstName || ""} ${row.lastName || ""}`}</Typography>
          <Typography variant="caption" color="text.secondary">@{row.username}</Typography>
        </Box>
      ),
    },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "contact", headerName: "SĐT", flex: 1 },
    {
      field: "role",
      headerName: "Vai trò",
      flex: 1,
      renderCell: ({ row }) => (
        <Chip
          icon={row.role === "admin" ? <AdminPanelSettingsOutlinedIcon /> : <LockOpenOutlinedIcon />}
          label={row.role.toUpperCase()}
          color={row.role === "admin" ? "success" : "primary"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
  ];

  if (loading) return (
    <Box m="40px" display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress size={60} thickness={5} />
    </Box>
  );

  if (error) return (
    <Box m="40px">
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      <Button variant="contained" onClick={() => window.location.reload()}>Thử lại</Button>
    </Box>
  );

  return (
    <Box m={{ xs: "10px", md: "20px" }}>
      <Header title="ĐỘI NGŨ" subtitle="Quản lý thành viên hệ thống" />

      {/* STATISTICS */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
        <StatCard elevation={0} sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={800} color={colors.primary[100]}>
              {totalCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">Tổng thành viên</Typography>
          </CardContent>
        </StatCard>
        <StatCard elevation={0} sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={800} color={colors.greenAccent[500]}>
              {adminCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">Quản trị viên</Typography>
          </CardContent>
        </StatCard>
        <StatCard elevation={0} sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={800} color={colors.blueAccent[500]}>
              {userCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">Người dùng</Typography>
          </CardContent>
        </StatCard>
      </Stack>

      {/* ACTIONS & FILTER */}
      {isAdmin && (
        <ActionCard elevation={0} sx={{ p: 3, mb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1}>
              <Tooltip title="Thêm người dùng">
                <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleAdd}>
                  Thêm
                </Button>
              </Tooltip>
              <Tooltip title="Sửa">
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit} disabled={selectionModel.length !== 1}>
                  Sửa
                </Button>
              </Tooltip>
              <Tooltip title="Xóa">
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={selectionModel.length === 0}>
                  Xóa
                </Button>
              </Tooltip>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} startAdornment={<FilterListIcon sx={{ mr: 1 }} />}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </ActionCard>
      )}

      {/* DATA GRID */}
      <Box
        height="65vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none", borderRadius: "12px" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.primary[600], color: "#fff" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { backgroundColor: colors.primary[600], color: "#fff" },
        }}
      >
        <DataGrid
          rows={filteredData}
          columns={columns}
          checkboxSelection={isAdmin}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          rowsPerPageOptions={[5, 10, 20]}
          selectionModel={selectionModel}
          onSelectionModelChange={setSelectionModel}
          getRowId={(row) => row._id}
          disableSelectionOnClick
        />
      </Box>

      {/* DIALOGS */}
      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sửa Thông Tin</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              id: selectedUser?._id || "",
              firstName: selectedUser?.firstName || "",
              lastName: selectedUser?.lastName || "",
              email: selectedUser?.email || "",
              contact: selectedUser?.contact || "",
              address1: selectedUser?.address1 || "",
              role: selectedUser?.role || "user",
            }}
            validationSchema={editSchema}
            onSubmit={handleEditSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} mt={1}>
                  <Stack direction="row" spacing={2}>
                    <TextField label="Họ" name="firstName" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.firstName} error={touched.firstName && !!errors.firstName} helperText={touched.firstName && errors.firstName} />
                    <TextField label="Tên" name="lastName" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.lastName} error={touched.lastName && !!errors.lastName} helperText={touched.lastName && errors.lastName} />
                  </Stack>
                  <TextField label="Email" name="email" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.email} error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
                  <TextField label="SĐT" name="contact" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.contact} error={touched.contact && !!errors.contact} helperText={touched.contact && errors.contact} />
                  <TextField label="Địa chỉ" name="address1" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.address1} error={touched.address1 && !!errors.address1} helperText={touched.address1 && errors.address1} />
                  <FormControl fullWidth>
                    <InputLabel>Vai trò</InputLabel>
                    <Select name="role" value={values.role} onChange={handleChange}>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <DialogActions sx={{ mt: 2 }}>
                  <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={20} /> : "Lưu"}
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Người Dùng Mới</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              firstName: "", lastName: "", email: "", contact: "", address1: "", username: "", password: "", confirmPassword: "", role: "user"
            }}
            validationSchema={addSchema}
            onSubmit={handleAddSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} mt={1}>
                  <Stack direction="row" spacing={2}>
                    <TextField label="Họ" name="firstName" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.firstName} error={touched.firstName && !!errors.firstName} helperText={touched.firstName && errors.firstName} />
                    <TextField label="Tên" name="lastName" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.lastName} error={touched.lastName && !!errors.lastName} helperText={touched.lastName && errors.lastName} />
                  </Stack>
                  <TextField label="Email" name="email" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.email} error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
                  <TextField label="SĐT" name="contact" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.contact} error={touched.contact && !!errors.contact} helperText={touched.contact && errors.contact} />
                  <TextField label="Địa chỉ" name="address1" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.address1} error={touched.address1 && !!errors.address1} helperText={touched.address1 && errors.address1} />
                  <TextField label="Tên tài khoản" name="username" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.username} error={touched.username && !!errors.username} helperText={touched.username && errors.username} />
                  <Stack direction="row" spacing={2}>
                    <TextField label="Mật khẩu" name="password" type="password" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.password} error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
                    <TextField label="Xác nhận" name="confirmPassword" type="password" fullWidth onChange={handleChange} onBlur={handleBlur} value={values.confirmPassword} error={touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
                  </Stack>
                  <FormControl fullWidth>
                    <InputLabel>Vai trò</InputLabel>
                    <Select name="role" value={values.role} onChange={handleChange}>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <DialogActions sx={{ mt: 2 }}>
                  <Button onClick={() => setOpenAddDialog(false)}>Hủy</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={20} /> : "Thêm"}
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