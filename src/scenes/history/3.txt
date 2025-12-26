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
} from "@mui/material";
import Header from "../../components/Header";
import { format } from "date-fns";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
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
          String(log.details?.gwId || "").toLowerCase().includes(term)
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", p: 0.5, gap: 0.5, bgcolor: "#0f121a" }}>
      {/* Header */}
      <Header title="LỊCH SỬ HOẠT ĐỘNG" subtitle="Theo dõi chi tiết mọi thao tác hệ thống" />

      {/* Thời gian + Nút */}
      <Paper sx={{ p: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#151a27", borderRadius: 1 }}>
        <Typography fontSize="0.7rem" color="#e0e0e0">
          <strong>Thời gian hiện tại:</strong> {format(currentTime, "dd/MM/yyyy HH:mm:ss")} (+07)
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Button variant="contained" color="error" size="small" startIcon={<DeleteIcon />} onClick={handleClearHistory} disabled={!isAdmin || filteredLogs.length === 0} sx={{ fontSize: "0.65rem", py: 0.3, bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}>
            Xóa tất cả
          </Button>
          <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={handleExportCSV} sx={{ fontSize: "0.65rem", py: 0.3, bgcolor: '#6870fa', '&:hover': { bgcolor: '#5a5fd4' } }}>
            Xuất CSV
          </Button>
        </Box>
      </Paper>

      {apiError && <Alert severity="error" sx={{ fontSize: "0.7rem", bgcolor: '#3e0000', color: '#ffcccc' }}>{apiError}</Alert>}

      {/* Table */}
      <Paper sx={{ flexGrow: 1, borderRadius: 1, overflow: "auto", mt: 0.5, bgcolor: "#151a27" }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#1e2538' }}>
              <TableRow>
                {["Người dùng", "Hành động", "Nguồn", "Đèn", "Bắt đầu", "Kết thúc", "Độ sáng", "Năng lượng", "IP", "Thời gian", "Hành động"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow
                  key={log._id}
                  hover
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: '#1a2033' },
                    '&:hover': { bgcolor: '#2a3142' },
                  }}
                >
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>{log.userId?.username || "Unknown"}</TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>{actionLabels[log.action] || log.action}</TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>{sourceLabels[log.source] || log.source || "N/A"}</TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>{log.details?.nodeId || log.details?.gwId || "N/A"}</TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>
                    {log.details?.startTime ? format(new Date(log.details.startTime), "HH:mm") : "—"}
                  </TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>
                    {log.details?.endTime ? format(new Date(log.details.endTime), "HH:mm") : "—"}
                  </TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>
                    {log.details?.lampDim !== undefined ? `${log.details.lampDim}%` : "—"}
                  </TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>
                    {log.details?.energyConsumed !== undefined ? `${log.details.energyConsumed} kWh` : "—"}
                  </TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>{log.ip || "—"}</TableCell>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.7rem', p: 0.5 }}>
                    {format(new Date(log.timestamp), "dd/MM HH:mm")}
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <Tooltip title={isAdmin ? "Xóa mục này" : "Chỉ admin mới được xóa"}>
                      <span>
                        <IconButton size="small" onClick={() => handleDeleteLog(log._id)} disabled={!isAdmin}>
                          <DeleteIcon fontSize="small" sx={{ color: '#e0e0e0' }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      <Stack direction="row" justifyContent="center" mt={0.5}>
        <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" size="small" />
      </Stack>
    </Box>
  );
};

export default History;