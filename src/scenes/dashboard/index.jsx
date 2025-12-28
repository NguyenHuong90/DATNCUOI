import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  useTheme,
  LinearProgress,
  Stack,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import BarChart from "../../components/BarChart";
import Geography from "../../scenes/geography";
import { useNavigate } from "react-router-dom";
import { useLightState } from "../../hooks/useLightState";

// Icons KPI
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// Icons Quick Actions
import OpacityIcon from "@mui/icons-material/Opacity";
import CloudIcon from "@mui/icons-material/Cloud";
import TuneIcon from "@mui/icons-material/Tune";
import BarChartIcon from "@mui/icons-material/BarChart";
import HistoryIcon from "@mui/icons-material/History";

import { useEffect, useMemo } from "react";
import { format } from "date-fns";

const getColor = (colors, path, fallback) => {
  return path.split(".").reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), colors) || fallback;
};

const Dashboard = () => {
  const theme = useTheme();
  const colors = theme.palette?.mode ? require("../../theme").tokens(theme.palette.mode) : {};
  const navigate = useNavigate();
  const { lightStates, syncLightStatesWithSchedule } = useLightState();

  useEffect(() => {
    const interval = setInterval(() => {
      syncLightStatesWithSchedule(new Date()).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [syncLightStatesWithSchedule]);

  const totalLamps = Object.keys(lightStates).length;
  const lampsOn = Object.values(lightStates).filter(l => l.lamp_state === "ON").length;
  const lampsOff = totalLamps - lampsOn;
  const onRate = totalLamps > 0 ? (lampsOn / totalLamps) * 100 : 0;

  const emergencyLights = useMemo(() => {
    return Object.values(lightStates).filter(l => l.lamp_state === "OFF" && (l.lux || 0) < 10);
  }, [lightStates]);

  return (
    <Box m={{ xs: "8px", md: "12px" }} maxWidth="1600px" mx="auto">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="h6" fontWeight="bold" color={getColor(colors, "grey.100", "#fff")}>
          SMART LIGHTING CONTROL
        </Typography>
        <Box display="flex" gap={1}>
          <Button size="small" variant="contained" startIcon={<DownloadOutlinedIcon />}>
            Xuất báo cáo
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
          >
            Đăng xuất
          </Button>
        </Box>
      </Box>

      {/* KPI SIÊU NHỎ GỌN & ĐẸP – PHIÊN BẢN HOÀN HẢO */}
      <Card
        sx={{
          bgcolor: "rgba(20, 27, 45, 0.8)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          mb: 1.5,
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Grid container alignItems="center" spacing={0.8}>
            {/* Thời gian */}
            <Grid item xs={12} md={3.5}>
              <Box display="flex" alignItems="center" gap={0.6}>
                <AccessTimeIcon sx={{ fontSize: 14, color: "#999" }} />
                <Typography variant="caption" color="#bbb" fontSize="0.68rem" fontWeight="500">
                  {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
                </Typography>
              </Box>
            </Grid>

            {/* Các KPI nhỏ gọn */}
            <Grid item xs={12} md={8.5}>
              <Box display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
                {/* Tổng đèn */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    bgcolor: "rgba(99, 102, 241, 0.15)",
                    px: 1.2,
                    py: 0.6,
                    borderRadius: 1.5,
                    border: "1px solid rgba(129, 140, 248, 0.25)",
                  }}
                >
                  <PowerSettingsNewIcon sx={{ fontSize: 18, color: "#9fa8da" }} />
                  <Box>
                    <Typography fontSize="1rem" fontWeight="bold" color="#fff" lineHeight={1}>
                      {totalLamps}
                    </Typography>
                    <Typography variant="caption" color="#999" fontSize="0.65rem">Tổng</Typography>
                  </Box>
                </Box>

                {/* Bật */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    bgcolor: "rgba(34, 197, 94, 0.18)",
                    px: 1.2,
                    py: 0.6,
                    borderRadius: 1.5,
                    border: "1px solid rgba(74, 222, 128, 0.35)",
                  }}
                >
                  <LightbulbIcon sx={{ fontSize: 18, color: "#16d15aff" }} />
                  <Box>
                    <Typography fontSize="1rem" fontWeight="bold" color="#16d15aff" lineHeight={1}>
                      {lampsOn}
                    </Typography>
                    <Typography variant="caption" color="#16d15aff" fontSize="0.65rem">Bật</Typography>
                  </Box>
                </Box>

                {/* Tắt */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    bgcolor: "rgba(239, 68, 68, 0.18)",
                    px: 1.2,
                    py: 0.6,
                    borderRadius: 1.5,
                    border: "1px solid rgba(248, 113, 113, 0.35)",
                  }}
                >
                  <LightbulbOutlinedIcon sx={{ fontSize: 18, color: "#f5c8c8" }} />
                  <Box>
                    <Typography fontSize="1rem" fontWeight="bold" color="#f5c8c8" lineHeight={1}>
                      {lampsOff}
                    </Typography>
                    <Typography variant="caption" color="#e6a0a0" fontSize="0.65rem">Tắt</Typography>
                  </Box>
                </Box>

                {/* Cảnh báo khẩn cấp */}
                {emergencyLights.length > 0 && (
                  <Box
                    sx={{
                      bgcolor: "rgba(220, 38, 38, 0.95)",
                      px: 1.4,
                      py: 0.7,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                      cursor: "pointer",
                      border: "1px solid #ef4444",
                      boxShadow: "0 0 16px rgba(239, 68, 68, 0.6)",
                      animation: "pulse 2s infinite",
                      "&:hover": { bgcolor: "#dc2626" },
                    }}
                    onClick={() => navigate("/geography")}
                  >
                    <ErrorOutlineIcon sx={{ fontSize: 18, color: "#fff" }} />
                    <Box textAlign="center">
                      <Typography fontSize="0.95rem" fontWeight="bold" color="#fff">
                        {emergencyLights.length}
                      </Typography>
                      <Typography variant="caption" color="#ffcccc" fontSize="0.6rem">
                        khẩn cấp
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Thanh tiến độ tỷ lệ bật */}
          <LinearProgress
            variant="determinate"
            value={onRate}
            sx={{
              mt: 1,
              height: 5,
              borderRadius: 3,
              bgcolor: "#2d3748",
              "& .MuiLinearProgress-bar": {
                bgcolor: "#4cceac",
                borderRadius: 3,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* BAR CHART + MAP */}
      <Grid container spacing={1.5} mb={1.5}>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, height: 280 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="600" color="#ff0000" mb={1.5}>
                Trạng thái đèn theo khu vực
              </Typography>
              <Box height={210}>
                <BarChart isDashboard={true} dataType="lamp_state" lightStates={lightStates} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, height: 280 }}>
            <CardContent sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box px={2} pt={2} pb={1}>
                <Typography variant="subtitle1" fontWeight="600" color="#fff0000">
                  Vị trí đèn chiếu sáng
                </Typography>
              </Box>
              <Box flex={1} sx={{ position: "relative", overflow: "hidden" }}>
                <Geography isDashboard={true} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* QUICK ACTIONS */}
      <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 1.5 }}>
        <CardContent sx={{ p: 1.2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            flexWrap="wrap"
          >
            <Button startIcon={<LightbulbIcon />} variant="contained" color="secondary" size="small"
              onClick={() => navigate("/light-control")} sx={{ minWidth: 140 }}>
              Điều khiển
            </Button>
            <Button startIcon={<OpacityIcon />} variant="contained" color="secondary" size="small"
              onClick={() => navigate("/geography")} sx={{ minWidth: 140 }}>
              Bản đồ
            </Button>
            <Button startIcon={<CloudIcon />} variant="contained" color="secondary" size="small"
              onClick={() => navigate("/calendar")} sx={{ minWidth: 140 }}>
              Lịch trình
            </Button>
            <Button startIcon={<TuneIcon />} variant="contained" color="secondary" size="small"
              onClick={() => navigate("/team")} sx={{ minWidth: 140 }}>
              Quản lý
            </Button>
            <Button startIcon={<BarChartIcon />} variant="contained" color="secondary" size="small"
              onClick={() => navigate("/bar")} sx={{ minWidth: 140 }}>
              Thống kê
            </Button>
            <Button startIcon={<HistoryIcon />} variant="contained" color="secondary" size="small"
              onClick={() => navigate("/history")} sx={{ minWidth: 140 }}>
              Lịch sử
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
