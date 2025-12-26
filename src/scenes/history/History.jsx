// src/scenes/history/index.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  TextField,
  MenuItem,
  Select,
  IconButton,
  Stack,
  Pagination,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Grid,
  Collapse,
} from "@mui/material";
import Header from "../../components/Header";
import { format } from "date-fns";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import Papa from "papaparse";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const History = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [apiError, setApiError] = useState("");
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState([]);
  const limit = 10;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser?.role === "admin";

  const actionLabels = {
    set_lamp_on: "Bật đèn",
    set_lamp_off: "Tắt đèn",
    set_lamp_brightness_to_50: "Điều chỉnh độ sáng",
    add_schedule: "Thêm lịch trình",
    delete_schedule: "Xóa lịch trình",
    create_user: "Tạo người dùng",
    update_user: "Cập nhật người dùng",
    delete_user: "Xóa người dùng",
    clear_activity_log: "Xóa toàn bộ lịch sử",
    delete_activity_log: "Xóa một mục lịch sử",
    login: "Đăng nhập",
  };

  const sourceLabels = { manual: "Thủ công", schedule: "Lịch trình", auto: "Tự động" };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  // Fetch danh sách users để lọc
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data || []);
      } catch (e) {
        console.error("Không thể tải danh sách users");
      }
    };
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");

      const params = { page, limit };
      if (selectedUser) params.userId = selectedUser;
      if (selectedAction) params.action = selectedAction;
      if (selectedSource) params.source = selectedSource;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(`${API_BASE}/api/activitylog`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setLogs(response.data.logs || []);
      setFilteredLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
      setApiError("");
    } catch (e) {
      const msg = e.response?.status === 401 ? "Phiên đăng nhập hết hạn" : "Không thể tải lịch sử";
      setApiError(msg);
      if (e.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
  }, [page, selectedUser, selectedAction, selectedSource, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    let filtered = [...logs];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userId?.username?.toLowerCase().includes(term) ||
          String(log.details?.nodeId || "").includes(term) ||
          String(log.details?.gwId || "").toLowerCase().includes(term) ||
          (actionLabels[log.action] || log.action).toLowerCase().includes(term)
      );
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  const handleClearHistory = useCallback(async () => {
    if (!isAdmin || !window.confirm("Xóa toàn bộ lịch sử?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/activitylog`, { headers: { Authorization: `Bearer ${token}` } });
      setLogs([]);
      setFilteredLogs([]);
    } catch (e) {
      setApiError("Lỗi xóa lịch sử");
    }
  }, [isAdmin]);

  const handleDeleteLog = useCallback(
    async (id) => {
      if (!isAdmin || !window.confirm("Xóa mục này?")) return;
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE}/api/activitylog/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setLogs((prev) => prev.filter((log) => log._id !== id));
        setFilteredLogs((prev) => prev.filter((log) => log._id !== id));
      } catch (e) {
        setApiError("Lỗi xóa mục");
      }
    },
    [isAdmin]
  );

  const handleExportCSV = useCallback(() => {
    const csvData = filteredLogs.map((log) => ({
      "Người dùng": log.userId?.username || "Unknown",
      "Hành động": actionLabels[log.action] || log.action,
      "Nguồn": sourceLabels[log.source] || log.source || "N/A",
      "Đèn": log.details?.nodeId || log.details?.gwId || "N/A",
      "Bắt đầu": log.details?.startTime ? format(new Date(log.details.startTime), "dd/MM HH:mm") : "N/A",
      "Kết thúc": log.details?.endTime ? format(new Date(log.details.endTime), "dd/MM") : "N/A",
      "Độ sáng": log.details?.lampDim !== undefined ? `${log.details.lampDim}%` : "N/A",
      "Năng lượng": log.details?.energyConsumed !== undefined ? `${log.details.energyConsumed} kWh` : "N/A",
      "IP": log.ip || "N/A",
      "Thời gian": format(new Date(log.timestamp), "dd/MM/yyyy HH:mm"),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lich_su_hoat_dong_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    link.click();
  }, [filteredLogs]);

  const handleClearFilters = () => {
    setSelectedUser("");
    setSelectedAction("");
    setSelectedSource("");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setPage(1);
  };

  const activeFiltersCount = [selectedUser, selectedAction, selectedSource, startDate, endDate].filter(Boolean).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", p: 2, gap: 2, bgcolor: "#0f121a" }}>
      {/* Header */}
      <Header title="LỊCH SỬ HOẠT ĐỘNG" subtitle="Theo dõi chi tiết mọi thao tác hệ thống" />

      {/* Toolbar */}
      <Paper sx={{ p: 2, bgcolor: "#151a27", borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Thời gian */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "#4caf50",
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                  },
                }}
              />
              <Typography fontSize="0.85rem" color="#e0e0e0">
                {format(currentTime, "dd/MM/yyyy HH:mm:ss")} (+07)
              </Typography>
            </Box>
          </Grid>

          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm theo tên, đèn, hành động..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#6870fa" }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <ClearIcon fontSize="small" sx={{ color: "#e0e0e0" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#1a1f2e",
                  color: "#e0e0e0",
                  fontSize: "0.85rem",
                  "& fieldset": { borderColor: "#2a3142" },
                  "&:hover fieldset": { borderColor: "#6870fa" },
                  "&.Mui-focused fieldset": { borderColor: "#6870fa" },
                },
              }}
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
              <Tooltip title="Làm mới dữ liệu">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchLogs}
                  sx={{
                    fontSize: "0.75rem",
                    borderColor: "#6870fa",
                    color: "#6870fa",
                    "&:hover": { borderColor: "#5a5fd4", bgcolor: "rgba(104, 112, 250, 0.08)" },
                  }}
                >
                  Làm mới
                </Button>
              </Tooltip>
              <Tooltip title={showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}>
                <Button
                  variant={showFilters ? "contained" : "outlined"}
                  size="small"
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    fontSize: "0.75rem",
                    borderColor: "#6870fa",
                    color: showFilters ? "#fff" : "#6870fa",
                    bgcolor: showFilters ? "#6870fa" : "transparent",
                    "&:hover": {
                      borderColor: "#5a5fd4",
                      bgcolor: showFilters ? "#5a5fd4" : "rgba(104, 112, 250, 0.08)",
                    },
                  }}
                >
                  Bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </Tooltip>
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
                sx={{
                  fontSize: "0.75rem",
                  bgcolor: "#4caf50",
                  "&:hover": { bgcolor: "#45a049" },
                  "&.Mui-disabled": { bgcolor: "#1a1f2e", color: "#555" },
                }}
              >
                Xuất CSV
              </Button>
              {isAdmin && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleClearHistory}
                  disabled={filteredLogs.length === 0}
                  sx={{ fontSize: "0.75rem" }}
                >
                  Xóa tất cả
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Filters Section */}
        <Collapse in={showFilters}>
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #2a3142" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: "#9e9e9e", fontSize: "0.85rem" }}>Người dùng</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label="Người dùng"
                    sx={{
                      bgcolor: "#1a1f2e",
                      color: "#e0e0e0",
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a3142" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6870fa" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6870fa" },
                      "& .MuiSvgIcon-root": { color: "#e0e0e0" },
                    }}
                  >
                    <MenuItem value="">
                      <em>Tất cả</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: "#9e9e9e", fontSize: "0.85rem" }}>Hành động</InputLabel>
                  <Select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    label="Hành động"
                    sx={{
                      bgcolor: "#1a1f2e",
                      color: "#e0e0e0",
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a3142" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6870fa" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6870fa" },
                      "& .MuiSvgIcon-root": { color: "#e0e0e0" },
                    }}
                  >
                    <MenuItem value="">
                      <em>Tất cả</em>
                    </MenuItem>
                    {Object.entries(actionLabels).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: "#9e9e9e", fontSize: "0.85rem" }}>Nguồn</InputLabel>
                  <Select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    label="Nguồn"
                    sx={{
                      bgcolor: "#1a1f2e",
                      color: "#e0e0e0",
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2a3142" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6870fa" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6870fa" },
                      "& .MuiSvgIcon-root": { color: "#e0e0e0" },
                    }}
                  >
                    <MenuItem value="">
                      <em>Tất cả</em>
                    </MenuItem>
                    {Object.entries(sourceLabels).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Từ ngày"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true, sx: { color: "#9e9e9e", fontSize: "0.85rem" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#1a1f2e",
                      color: "#e0e0e0",
                      fontSize: "0.85rem",
                      "& fieldset": { borderColor: "#2a3142" },
                      "&:hover fieldset": { borderColor: "#6870fa" },
                      "&.Mui-focused fieldset": { borderColor: "#6870fa" },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Đến ngày"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true, sx: { color: "#9e9e9e", fontSize: "0.85rem" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#1a1f2e",
                      color: "#e0e0e0",
                      fontSize: "0.85rem",
                      "& fieldset": { borderColor: "#2a3142" },
                      "&:hover fieldset": { borderColor: "#6870fa" },
                      "&.Mui-focused fieldset": { borderColor: "#6870fa" },
                    },
                  }}
                />
              </Grid>
            </Grid>

            {activeFiltersCount > 0 && (
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Typography fontSize="0.75rem" color="#9e9e9e">
                  Bộ lọc đang áp dụng:
                </Typography>
                {selectedUser && (
                  <Chip
                    label={`User: ${users.find((u) => u._id === selectedUser)?.username || "..."}`}
                    size="small"
                    onDelete={() => setSelectedUser("")}
                    sx={{ bgcolor: "#2a3142", color: "#e0e0e0", fontSize: "0.75rem" }}
                  />
                )}
                {selectedAction && (
                  <Chip
                    label={`Hành động: ${actionLabels[selectedAction]}`}
                    size="small"
                    onDelete={() => setSelectedAction("")}
                    sx={{ bgcolor: "#2a3142", color: "#e0e0e0", fontSize: "0.75rem" }}
                  />
                )}
                {selectedSource && (
                  <Chip
                    label={`Nguồn: ${sourceLabels[selectedSource]}`}
                    size="small"
                    onDelete={() => setSelectedSource("")}
                    sx={{ bgcolor: "#2a3142", color: "#e0e0e0", fontSize: "0.75rem" }}
                  />
                )}
                {startDate && (
                  <Chip
                    label={`Từ: ${format(new Date(startDate), "dd/MM/yyyy")}`}
                    size="small"
                    onDelete={() => setStartDate("")}
                    sx={{ bgcolor: "#2a3142", color: "#e0e0e0", fontSize: "0.75rem" }}
                  />
                )}
                {endDate && (
                  <Chip
                    label={`Đến: ${format(new Date(endDate), "dd/MM/yyyy")}`}
                    size="small"
                    onDelete={() => setEndDate("")}
                    sx={{ bgcolor: "#2a3142", color: "#e0e0e0", fontSize: "0.75rem" }}
                  />
                )}
                <Button
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                  sx={{ fontSize: "0.7rem", color: "#f44336", textTransform: "none" }}
                >
                  Xóa tất cả bộ lọc
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {apiError && (
        <Alert severity="error" sx={{ fontSize: "0.85rem", bgcolor: "#3e0000", color: "#ffcccc" }}>
          {apiError}
        </Alert>
      )}

      {/* Summary Info */}
      <Paper sx={{ p: 1.5, bgcolor: "#151a27", borderRadius: 2 }}>
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography fontSize="0.7rem" color="#9e9e9e">
              Tổng số bản ghi
            </Typography>
            <Typography fontSize="1.2rem" fontWeight="bold" color="#6870fa">
              {logs.length}
            </Typography>
          </Box>
          <Box>
            <Typography fontSize="0.7rem" color="#9e9e9e">
              Kết quả hiển thị
            </Typography>
            <Typography fontSize="1.2rem" fontWeight="bold" color="#4caf50">
              {filteredLogs.length}
            </Typography>
          </Box>
          <Box>
            <Typography fontSize="0.7rem" color="#9e9e9e">
              Trang hiện tại
            </Typography>
            <Typography fontSize="1.2rem" fontWeight="bold" color="#e0e0e0">
              {page} / {totalPages}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper sx={{ flexGrow: 1, borderRadius: 2, overflow: "hidden", bgcolor: "#151a27" }}>
        <TableContainer sx={{ maxHeight: "100%" }}>
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {["Người dùng", "Hành động", "Nguồn", "Đèn", "Bắt đầu", "Kết thúc", "Độ sáng", "Năng lượng", "IP", "Thời gian", ""].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: "bold",
                        color: "#e0e0e0",
                        fontSize: "0.8rem",
                        bgcolor: "#1e2538",
                        borderBottom: "2px solid #6870fa",
                        py: 1.5,
                      }}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: "#9e9e9e", fontSize: "0.9rem" }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log._id}
                    hover
                    sx={{
                      "&:nth-of-type(odd)": { bgcolor: "#1a2033" },
                      "&:hover": { bgcolor: "#2a3142" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      <Chip
                        label={log.userId?.username || "Unknown"}
                        size="small"
                        sx={{
                          bgcolor: "#2a3142",
                          color: "#e0e0e0",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      {actionLabels[log.action] || log.action}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      <Chip
                        label={sourceLabels[log.source] || log.source || "N/A"}
                        size="small"
                        sx={{
                          bgcolor:
                            log.source === "manual"
                              ? "#1976d2"
                              : log.source === "schedule"
                              ? "#ed6c02"
                              : "#2e7d32",
                          color: "#fff",
                          fontSize: "0.7rem",
                          height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      {log.details?.nodeId || log.details?.gwId || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      {log.details?.startTime ? format(new Date(log.details.startTime), "HH:mm") : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      {log.details?.endTime ? format(new Date(log.details.endTime), "HH:mm") : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      {log.details?.lampDim !== undefined ? `${log.details.lampDim}%` : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      {log.details?.energyConsumed !== undefined ? `${log.details.energyConsumed} kWh` : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#9e9e9e", fontSize: "0.75rem" }}>{log.ip || "—"}</TableCell>
                    <TableCell sx={{ color: "#e0e0e0", fontSize: "0.8rem" }}>
                      {format(new Date(log.timestamp), "dd/MM HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={isAdmin ? "Xóa mục này" : "Chỉ admin mới được xóa"}>
                        <span>
                          <IconButton size="small" onClick={() => handleDeleteLog(log._id)} disabled={!isAdmin}>
                            <DeleteIcon fontSize="small" sx={{ color: isAdmin ? "#f44336" : "#555" }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      <Stack direction="row" justifyContent="center">
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, v) => setPage(v)}
          color="primary"
          size="medium"
          sx={{
            "& .MuiPaginationItem-root": {
              color: "#e0e0e0",
              borderColor: "#2a3142",
              "&:hover": { bgcolor: "#2a3142" },
              "&.Mui-selected": {
                bgcolor: "#6870fa",
                color: "#fff",
                "&:hover": { bgcolor: "#5a5fd4" },
              },
            },
          }}
        />
      </Stack>
    </Box>
  );
};

export default History;