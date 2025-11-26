import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  TextField,
  MenuItem,
  Select,
  IconButton,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { formatDate } from "@fullcalendar/react";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import Papa from "papaparse";
import { useLightState } from "../../hooks/useLightState"; // Import context

const History = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
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
  const { lightHistory } = useLightState(); // Lấy lightHistory từ context

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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
      if (!token) {
        setApiError("Không tìm thấy token, vui lòng đăng nhập lại.");
        return;
      }
      const response = await axios.get("http://localhost:5000/api/activitylog", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, userId: selectedUser, action: selectedAction, source: selectedSource, startDate, endDate },
      });
      setLogs(response.data.logs);
      setFilteredLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
      setApiError("");
    } catch (e) {
      setApiError(
        e.response?.status === 401
          ? "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại."
          : "Không thể tải lịch sử từ server."
      );
      console.error("Error fetching logs:", e);
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
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
      filtered = filtered.filter(
        (log) =>
          log.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.nodeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.gwId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  const handleClearHistory = useCallback(async () => {
    if (!isAdmin) {
      setApiError("Chỉ admin mới có quyền xóa lịch sử!");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử hoạt động?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/activitylog", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs([]);
      setFilteredLogs([]);
      setApiError("");
    } catch (e) {
      setApiError("Lỗi khi xóa lịch sử từ server. Vui lòng thử lại.");
      console.error("Error clearing history:", e);
    }
  }, [isAdmin]);

  const handleDeleteLog = useCallback(async (id) => {
    if (!isAdmin) {
      setApiError("Chỉ admin mới có quyền xóa lịch sử!");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa mục này?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/activitylog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newLogs = logs.filter((log) => log._id !== id);
      setLogs(newLogs);
      setFilteredLogs(newLogs);
      setApiError("");
    } catch (e) {
      setApiError("Lỗi khi xóa mục lịch sử từ server. Vui lòng thử lại.");
      console.error("Error deleting log:", e);
    }
  }, [isAdmin, logs]);

  const handleExportCSV = useCallback(() => {
    const csvData = filteredLogs.map((log) => ({
      User: log.userId?.username || "Unknown",
      Action: actionLabels[log.action] || log.action,
      Source: sourceLabels[log.source] || log.source || "N/A",
      Lamp: log.details?.nodeId || log.details?.gwId || "N/A",
      StartTime: log.details?.startTime
        ? formatDate(log.details.startTime, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "N/A",
      EndTime: log.details?.endTime
        ? formatDate(log.details.endTime, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "N/A",
      Brightness: log.details?.lampDim !== undefined ? `${log.details.lampDim}%` : "N/A",
      EnergyConsumed: log.details?.energyConsumed !== undefined ? `${log.details.energyConsumed} kWh` : "N/A",
      IP: log.ip || "N/A",
      Timestamp: formatDate(log.timestamp, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "activity_log.csv";
    link.click();
  }, [filteredLogs, actionLabels, sourceLabels]);

  return (
    <Box m="20px">
      <Header title="Lịch sử hoạt động" subtitle="Xem và quản lý lịch sử hoạt động của người dùng" />
      <Typography variant="body2" color={colors.grey[300]} sx={{ mb: "20px", textAlign: "center" }}>
        Thời gian hiện tại: {formatDate(currentTime, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })} (+07)
      </Typography>

      <Box sx={{ backgroundColor: colors.primary[400], borderRadius: "8px", padding: "20px" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
          <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
            Danh sách lịch sử hoạt động
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="error"
              onClick={handleClearHistory}
              sx={{ mr: "10px", fontWeight: "bold" }}
              disabled={filteredLogs.length === 0 || !isAdmin}
            >
              Xóa tất cả
            </Button>
            <Button variant="contained" color="primary" onClick={handleExportCSV}>
              Xuất CSV
            </Button>
          </Box>
        </Box>

        <Box mb="20px" display="flex" gap="10px" alignItems="center">
          <TextField
            label="Tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: "150px", input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
          />
          <Select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            displayEmpty
            sx={{ minWidth: "150px", color: colors.grey[100] }}
          >
            <MenuItem value="">Tất cả người dùng</MenuItem>
            {Array.from(
              new Set(logs.map((log) => log.userId?._id))
            ).map((userId) => (
              <MenuItem key={userId} value={userId}>
                {logs.find((log) => log.userId?._id === userId)?.userId?.username || "Unknown"}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            displayEmpty
            sx={{ minWidth: "150px", color: colors.grey[100] }}
          >
            <MenuItem value="">Tất cả hành động</MenuItem>
            {Array.from(
              new Set(logs.map((log) => log.action))
            ).map((action) => (
              <MenuItem key={action} value={action}>
                {actionLabels[action] || action}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            displayEmpty
            sx={{ minWidth: "150px", color: colors.grey[100] }}
          >
            <MenuItem value="">Tất cả nguồn</MenuItem>
            {Array.from(
              new Set(logs.map((log) => log.source))
            ).map((source) => (
              <MenuItem key={source} value={source}>
                {sourceLabels[source] || source || "Unknown"}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Từ ngày"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
          />
          <TextField
            label="Đến ngày"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
          />
        </Box>

        {apiError && <Alert severity="error" sx={{ mb: "20px" }}>{apiError}</Alert>}
        {filteredLogs.length === 0 && !apiError ? (
          <Typography color={colors.grey[300]} textAlign="center">
            Không có lịch sử hoạt động nào được ghi nhận trong khoảng thời gian đã chọn.
          </Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400] }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Người dùng</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Hành động</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Nguồn</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Bóng đèn</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Thời gian bắt đầu</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Thời gian kết thúc</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Độ sáng (%)</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Năng lượng tiêu thụ (kWh)</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>IP</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Thời gian</TableCell>
                    <TableCell sx={{ color: colors.grey[100], fontWeight: "bold" }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {log.userId?.username || "Unknown"}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {actionLabels[log.action] || log.action}
                      </TableCell>
                      <TableCell sx={{ 
                        color: log.source === "auto" ? colors.greenAccent[400] : 
                               log.source === "manual" ? colors.blueAccent[400] : 
                               log.source === "schedule" ? colors.yellowAccent[400] : colors.grey[100] 
                      }}>
                        {sourceLabels[log.source] || log.source || "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {log.details?.nodeId || log.details?.gwId || "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {log.details?.startTime
                          ? formatDate(log.details.startTime, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })
                          : "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {log.details?.endTime
                          ? formatDate(log.details.endTime, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })
                          : "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {log.details?.lampDim !== undefined ? `${log.details.lampDim}%` : "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {log.details?.energyConsumed !== undefined ? `${log.details.energyConsumed} kWh` : "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{log.ip || "N/A"}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {formatDate(log.timestamp, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteLog(log._id)}
                          aria-label="delete"
                          disabled={!isAdmin}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="center" mt="20px">
              <Button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Trang trước
              </Button>
              <Typography>{`Trang ${page} / ${totalPages}`}</Typography>
              <Button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Trang sau
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default History;