import { useEffect, useState, useCallback } from "react";
import {
  Box,
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
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LoginIcon from "@mui/icons-material/Login";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import Header from "../../components/Header";
import axios from "axios";
import { format } from "date-fns";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

/* ===== NHÓM HÀNH VI ===== */
const ACTION_GROUPS = {
  all: { label: "Tất cả" },
  auth: { label: "Đăng nhập" },
  lamp: { label: "Điều khiển đèn" },
  schedule: { label: "Lịch trình" },
  user: { label: "Người dùng" },
  node: { label: "Báo cáo từ Node" },
};

/* ===== ICON THEO ACTION ===== */
const actionIcon = (action) => {
  if (action === "login") return <LoginIcon fontSize="small" />;
  if (action.startsWith("set_lamp")) return <LightbulbOutlinedIcon fontSize="small" />;
  if (action.includes("schedule")) return <EventNoteOutlinedIcon fontSize="small" />;
  if (action.match(/(user|clear_activity_log|delete_activity_log)/))
    return <PersonOutlineIcon fontSize="small" />;
  if (action === "node_report") return <DevicesOtherIcon fontSize="small" />;
  return <InfoOutlinedIcon fontSize="small" />;
};

const History = () => {
  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [group, setGroup] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  /* ===== FETCH LOGS - GỬI GROUP VÀ DATE VÀO BACKEND ===== */
  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const params = {
        page,
        limit,
      };
      if (group !== "all") params.group = group;
      if (fromDate) params.startDate = fromDate;
      if (toDate) params.endDate = toDate;

      const res = await axios.get(`${API_BASE}/api/activitylog`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Fetch log error:", err);
    }
  }, [page, group, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* ===== EXPORT CSV ===== */
  const exportCSV = () => {
    if (!logs.length) return;

    const header = ["User", "Action", "Time", "IP"];
    const rows = logs.map((l) => [
      l.userId?.username || "N/A",
      l.action,
      format(new Date(l.timestamp), "yyyy-MM-dd HH:mm:ss"),
      l.ip || "-",
    ]);

    const csv =
      [header, ...rows]
        .map((r) => r.map((x) => `"${x}"`).join(","))
        .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_log_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAll = group === "all";

  return (
    <Box sx={{ p: 1.5 }}>
      <Header title="Activity Log" subtitle="Giám sát hoạt động hệ thống" />

      {/* FILTER BAR */}
      <Paper
        sx={{
          p: 0.75,
          mb: 1,
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <FilterAltOutlinedIcon sx={{ fontSize: 18 }} />

          <Select
            size="small"
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150, fontSize: "0.75rem", height: 30 }}
          >
            {Object.entries(ACTION_GROUPS).map(([key, g]) => (
              <MenuItem key={key} value={key} sx={{ fontSize: "0.75rem" }}>
                {g.label}
              </MenuItem>
            ))}
          </Select>

          <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />

          <TextField
            size="small"
            type="date"
            label="Từ"
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            sx={{ width: 125, "& .MuiInputBase-root": { height: 30, fontSize: "0.75rem" } }}
          />

          <TextField
            size="small"
            type="date"
            label="Đến"
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            sx={{ width: 125, "& .MuiInputBase-root": { height: 30, fontSize: "0.75rem" } }}
          />

          <Box flexGrow={1} />

          <Tooltip title="Export CSV">
            <IconButton size="small" onClick={exportCSV}>
              <DownloadOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* TABLE */}
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log._id} hover>
                  <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    {log.userId?.username || "N/A"}
                  </TableCell>

                  <TableCell>
                    {isAll ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {actionIcon(log.action)}
                        <Typography fontSize="0.75rem">
                          {log.action.replaceAll("_", " ")}
                        </Typography>
                      </Stack>
                    ) : (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={log.action.replaceAll("_", " ")}
                        sx={{ fontSize: "0.7rem" }}
                      />
                    )}
                  </TableCell>

                  <TableCell sx={{ fontSize: "0.75rem" }}>
                    {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm")}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      color: "text.secondary",
                    }}
                  >
                    {log.ip || "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography fontSize="0.8rem" color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINATION */}
      <Stack alignItems="center" mt={1.5}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, v) => setPage(v)}
          size="small"
        />
      </Stack>
    </Box>
  );
};

export default History;