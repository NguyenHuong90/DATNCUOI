// src/scenes/history/index.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  useTheme,
  Paper,
  Button,
  Alert,
  TextField,
  MenuItem,
  Select,
  IconButton,
  Card,
  CardContent,
  Stack,
  Chip,
  Pagination,
  Tooltip,
  Fade,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { format } from "date-fns";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import Papa from "papaparse";

const History = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // MÀU CỐ ĐỊNH – AN TOÀN 100% (KHÔNG DÙNG theme.xxx[600])
  const SOURCE_COLORS = {
    auto: "#4cceac",     // xanh lá
    manual: "#42a5f5",   // xanh dương
    schedule: "#fdd835", // vàng
  };

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

  const sourceLabels = {
    manual: "Thủ công",
    schedule: "Lịch trình",
    auto: "Tự động",
  };

  // Cập nhật thời gian
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Xóa lỗi sau 5s
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  // Lấy dữ liệu
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

      const response = await axios.get("http://localhost:5000/api/activitylog", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const fetchedLogs = response.data.logs || [];
      setLogs(fetchedLogs);
      setFilteredLogs(fetchedLogs);
      setTotalPages(response.data.totalPages || 1);
      setApiError("");
    } catch (e) {
      const msg = e.response?.status === 401
        ? "Phiên đăng nhập hết hạn"
        : "Không thể tải lịch sử";
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

  // Tìm kiếm
  useEffect(() => {
    let filtered = [...logs];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.userId?.username?.toLowerCase().includes(term) ||
        String(log.details?.nodeId || "").includes(term) ||
        String(log.details?.gwId || "").toLowerCase().includes(term)
      );
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  // Xóa toàn bộ
  const handleClearHistory = useCallback(async () => {
    if (!isAdmin || !window.confirm("Xóa toàn bộ lịch sử?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/activitylog", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs([]);
      setFilteredLogs([]);
    } catch (e) {
      setApiError("Lỗi xóa lịch sử");
    }
  }, [isAdmin]);

  // Xóa 1 mục
  const handleDeleteLog = useCallback(async (id) => {
    if (!isAdmin || !window.confirm("Xóa mục này?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/activitylog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(prev => prev.filter(log => log._id !== id));
      setFilteredLogs(prev => prev.filter(log => log._id !== id));
    } catch (e) {
      setApiError("Lỗi xóa mục");
    }
  }, [isAdmin]);

  // Xuất CSV
  const handleExportCSV = useCallback(() => {
    const csvData = filteredLogs.map(log => ({
      "Người dùng": log.userId?.username || "Unknown",
      "Hành động": actionLabels[log.action] || log.action,
      "Nguồn": sourceLabels[log.source] || log.source || "N/A",
      "Đèn": log.details?.nodeId || log.details?.gwId || "N/A",
      "Bắt đầu": log.details?.startTime ? format(new Date(log.details.startTime), "dd/MM HH:mm") : "N/A",
      "Kết thúc": log.details?.endTime ? format(new Date(log.details.endTime), "dd/MM HH:mm") : "N/A",
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
    <Box m="20px">
      <Header title="LỊCH SỬ HOẠT ĐỘNG" subtitle="Theo dõi chi tiết mọi thao tác hệ thống" />

      {/* THỜI GIAN HIỆN TẠI */}
      <Fade in={true} timeout={600}>
        <Card sx={{ mb: 3, bgcolor: colors.primary[400], border: `1px solid ${colors.grey[700]}`, borderRadius: 3 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color={colors.grey[300]} textAlign="center">
              <strong>Thời gian hiện tại:</strong> {format(currentTime, "dd/MM/yyyy HH:mm:ss")} (+07)
            </Typography>
          </CardContent>
        </Card>
      </Fade>

      {/* LỌC & TÌM KIẾM */}
      <Card sx={{ mb: 3, bgcolor: colors.primary[400], border: `1px solid ${colors.grey[700]}`, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Tìm kiếm (người dùng, đèn...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} displayEmpty size="small" sx={{ minWidth: 160 }}>
              <MenuItem value="">Tất cả người dùng</MenuItem>
              {Array.from(new Set(logs.map(l => l.userId?._id).filter(Boolean))).map(id => (
                <MenuItem key={id} value={id}>
                  {logs.find(l => l.userId?._id === id)?.userId?.username}
                </MenuItem>
              ))}
            </Select>
            <Select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} displayEmpty size="small" sx={{ minWidth: 160 }}>
              <MenuItem value="">Tất cả hành động</MenuItem>
              {Array.from(new Set(logs.map(l => l.action))).map(a => (
                <MenuItem key={a} value={a}>{actionLabels[a] || a}</MenuItem>
              ))}
            </Select>
            <Select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} displayEmpty size="small" sx={{ minWidth: 140 }}>
              <MenuItem value="">Tất cả nguồn</MenuItem>
              {Array.from(new Set(logs.map(l => l.source))).map(s => (
                <MenuItem key={s} value={s}>{sourceLabels[s] || s}</MenuItem>
              ))}
            </Select>
            <TextField label="Từ ngày" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Đến ngày" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Stack>
        </CardContent>
      </Card>

      {/* LỖI */}
      {apiError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{apiError}</Alert>}

      {/* BẢNG DỮ LIỆU */}
      {filteredLogs.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Không có dữ liệu trong khoảng thời gian đã chọn.
        </Alert>
      ) : (
        <>
          <Paper sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${colors.grey[700]}`, bgcolor: colors.primary[400] }}>
            <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Người dùng", "Hành động", "Nguồn", "Đèn", "Bắt đầu", "Kết thúc", "Độ sáng", "Năng lượng", "IP", "Thời gian", "Hành động"].map(h => (
                      <th key={h} style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        bgcolor: colors.primary[600],
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log._id} style={{ borderBottom: `1px solid ${colors.grey[700]}` }}>
                      <td style={{ padding: "12px 16px", color: colors.grey[100] }}>
                        {log.userId?.username || "Unknown"}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.grey[100] }}>
                        {actionLabels[log.action] || log.action}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Chip
                          label={sourceLabels[log.source] || log.source || "N/A"}
                          size="small"
                          sx={{
                            bgcolor: SOURCE_COLORS[log.source] || colors.grey[600],
                            color: "white",
                            fontWeight: 600,
                            height: 24,
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.grey[100] }}>
                        {log.details?.nodeId || log.details?.gwId || "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.grey[300], fontSize: "0.875rem" }}>
                        {log.details?.startTime ? format(new Date(log.details.startTime), "HH:mm") : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.grey[300], fontSize: "0.875rem" }}>
                        {log.details?.endTime ? format(new Date(log.details.endTime), "HH:mm") : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#4cceac", fontWeight: 600 }}>
                        {log.details?.lampDim !== undefined ? `${log.details.lampDim}%` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#fdd835" }}>
                        {log.details?.energyConsumed !== undefined ? `${log.details.energyConsumed} kWh` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.grey[300], fontSize: "0.875rem" }}>
                        {log.ip || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.grey[100], fontSize: "0.875rem" }}>
                        {format(new Date(log.timestamp), "dd/MM HH:mm")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Tooltip title={isAdmin ? "Xóa mục này" : "Chỉ admin mới được xóa"}>
                          <span>
                            <IconButton
                              size="small"
                              sx={{
                                color: colors.redAccent[500],
                                '&:hover': { bgcolor: colors.redAccent[900] },
                              }}
                              onClick={() => handleDeleteLog(log._id)}
                              disabled={!isAdmin}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>

          {/* PHÂN TRANG & HÀNH ĐỘNG */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, v) => setPage(v)}
              color="primary"
              size="small"
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleClearHistory}
                disabled={!isAdmin || filteredLogs.length === 0}
              >
                Xóa tất cả
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                sx={{ bgcolor: "#4cceac", '&:hover': { bgcolor: "#3da58a" } }}
                onClick={handleExportCSV}
              >
                Xuất CSV
              </Button>
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default History;