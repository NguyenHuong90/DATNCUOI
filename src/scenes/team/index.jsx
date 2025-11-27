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
  Tooltip,
  Avatar,
  CircularProgress,
  Card,
  CardContent,
  Paper,
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

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Styled components
const ActionCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
  borderRadius: "12px",
  boxShadow: theme.shadows[3],
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[8],
    transform: "translateY(-2px)",
  },
  padding: theme.spacing(1),
}));

const StatCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
  borderRadius: "12px",
  boxShadow: theme.shadows[4],
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[8],
  },
  padding: theme.spacing(1),
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
    let filtered = teamData.filter(
      (user) =>
        `${user.firstName || ""} ${user.lastName || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    return filtered;
  }, [teamData, searchTerm, filterRole]);

  // Stats
  const adminCount = filteredData.filter((user) => user.role === "admin").length;
  const userCount = filteredData.filter((user) => user.role === "user").length;
  const totalCount = filteredData.length;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/auth/users?page=1&limit=100`, {
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

    const selectedUsers = teamData.filter((u) => selectionModel.includes(u._id));
    if (selectedUsers.some((u) => u.role === "admin")) return alert("Không thể xóa admin!");

    if (!window.confirm(`Xóa ${selectionModel.length} người dùng?`)) return;

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectionModel.map((id) =>
          axios.delete(`${API_BASE}/api/auth/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setTeamData((prev) => prev.filter((u) => !selectionModel.includes(u._id)));
      setSelectionModel([]);
      alert("Xóa thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi xóa!");
    }
  };

  const handleEdit = () => {
    if (!isAdmin) return alert("Chỉ admin mới có quyền sửa!");
    if (selectionModel.length !== 1) return alert("Chọn đúng 1 người dùng!");

    const user = teamData.find((u) => u._id === selectionModel[0]);
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
      await axios.put(`${API_BASE}/api/auth/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamData((prev) => prev.map((u) => (u._id === id ? { ...u, ...data } : u)));
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
      const res = await axios.post(`${API_BASE}/api/auth/register`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamData((prev) => [...prev, res.data.user]);
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
    username: yup
      .string()
      .trim()
      .required("Nhập tên tài khoản")
      .min(4)
      .max(30)
      .matches(/^[a-zA-Z0-9_]+$/),
    password: yup
      .string()
      .trim()
      .required("Nhập mật khẩu")
      .min(6)
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Mật khẩu không khớp")
      .required(),
  });

  const columns = [
    {
      field: "avatar",
      headerName: "",
      width: 50,
      renderCell: ({ row }) => (
        <Avatar
          sx={{
            bgcolor: row.role === "admin" ? colors.greenAccent[600] : colors.blueAccent[600],
            width: 30,
            height: 30,
            fontWeight: 700,
            fontSize: 14,
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
          <Typography fontWeight={600} fontSize={13}>
            {`${row.firstName || ""} ${row.lastName || ""}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            @{row.username}
          </Typography>
        </Box>
      ),
    },
    { field: "email", headerName: "Email", flex: 1, headerAlign: "center", align: "center" },
    { field: "contact", headerName: "SĐT", flex: 1, headerAlign: "center", align: "center" },
    {
      field: "role",
      headerName: "Vai trò",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => (
        <Chip
          icon={row.role === "admin" ? <AdminPanelSettingsOutlinedIcon fontSize="small" /> : <LockOpenOutlinedIcon fontSize="small" />}
          label={row.role.toUpperCase()}
          color={row.role === "admin" ? "success" : "primary"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
  ];

  if (loading)
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={50} thickness={5} />
      </Box>
    );

  if (error)
    return (
      <Box m="20px">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </Box>
    );

  return (
    <Box m={{ xs: "10px", md: "15px" }}>
      <Header title="ĐỘI NGŨ" subtitle="Quản lý thành viên hệ thống" />

      {/* STATISTICS */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} mb={2} flexWrap="wrap">
        <StatCard elevation={0} sx={{ flex: "1 1 120px", p: 1 }}>
          <CardContent sx={{ p: 1 }}>
            <Typography variant="h6" fontWeight={700} color={colors.primary[100]}>
              {totalCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng thành viên
            </Typography>
          </CardContent>
        </StatCard>

        <StatCard elevation={0} sx={{ flex: "1 1 120px", p: 1 }}>
          <CardContent sx={{ p: 1 }}>
            <Typography variant="h6" fontWeight={700} color={colors.greenAccent[500]}>
              {adminCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản trị viên
            </Typography>
          </CardContent>
        </StatCard>

        <StatCard elevation={0} sx={{ flex: "1 1 120px", p: 1 }}>
          <CardContent sx={{ p: 1 }}>
            <Typography variant="h6" fontWeight={700} color={colors.blueAccent[500]}>
              {userCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Người dùng
            </Typography>
          </CardContent>
        </StatCard>
      </Stack>

      {/* ACTIONS & FILTER */}
      {isAdmin && (
        <ActionCard elevation={0} sx={{ p: 1, mb: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
          >
            <Stack direction="row" spacing={1} mb={{ xs: 1, sm: 0 }}>
              <Tooltip title="Thêm người dùng">
                <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleAdd} size="small">
                  Thêm
                </Button>
              </Tooltip>
              <Tooltip title="Sửa">
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit} disabled={selectionModel.length !== 1} size="small">
                  Sửa
                </Button>
              </Tooltip>
              <Tooltip title="Xóa">
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={selectionModel.length === 0} size="small">
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
                sx={{ minWidth: 150 }}
              />
              <FormControl size="small" sx={{ minWidth: 100 }}>
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
        height="60vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none", borderRadius: "8px", fontSize: 13 },
          "& .MuiDataGrid-cell": { borderBottom: "none", py: 0.5 },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.primary[600], color: "#fff", minHeight: 32, lineHeight: "32px" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { backgroundColor: colors.primary[600], color: "#fff", minHeight: 30 },
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
    </Box>
  );
};

export default Team;
