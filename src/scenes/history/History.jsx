import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
} from "@mui/material";
import Header from "../../components/Header";
import axios from "axios";
import { format } from "date-fns";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

/* ===== NHÓM HÀNH VI ===== */
const ACTION_GROUPS = {
  auth: {
    label: "🔐 Đăng nhập",
    actions: ["login"],
  },
  lamp: {
    label: "💡 Điều khiển đèn",
    actions: ["set_lamp_on", "set_lamp_off", "set_lamp_brightness_to_50"],
  },
  schedule: {
    label: "📅 Lịch trình",
    actions: ["add_schedule", "delete_schedule"],
  },
  user: {
    label: "👤 Quản lý người dùng",
    actions: ["create_user", "update_user", "delete_user"],
  },
};

const History = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [group, setGroup] = useState("auth");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  /* ===== FETCH LOG ===== */
  const fetchLogs = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_BASE}/api/activitylog`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });

    setLogs(res.data.logs || []);
    setTotalPages(res.data.totalPages || 1);
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* ===== FILTER ===== */
  useEffect(() => {
    const actions = ACTION_GROUPS[group].actions;
    setFilteredLogs(logs.filter((l) => actions.includes(l.action)));
  }, [logs, group]);

  return (
    <Box sx={{ p: 1 }}>
      <Header title="LỊCH SỬ HOẠT ĐỘNG" subtitle="Theo dõi hành vi người dùng & hệ thống" />

      {/* FILTER */}
      <Paper sx={{ p: 1, mb: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography fontSize="0.85rem">Nhóm hành vi:</Typography>
          <Select
            size="small"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {Object.entries(ACTION_GROUPS).map(([key, g]) => (
              <MenuItem key={key} value={key}>
                {g.label}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Paper>

      {/* TABLE */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><b>Người dùng</b></TableCell>
              <TableCell><b>Hành động</b></TableCell>
              <TableCell><b>Thời gian</b></TableCell>
              <TableCell><b>IP</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{log.userId?.username || "N/A"}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                </TableCell>
                <TableCell>{log.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINATION */}
      <Stack alignItems="center" mt={1}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Stack>
    </Box>
  );
};

export default History;
