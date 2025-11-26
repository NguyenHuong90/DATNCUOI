import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  useTheme,
  Stack,
  LinearProgress,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Header from "../../components/Header";
import BarChart from "../../components/BarChart";
import PieChart from "../../components/PieChart";
import Geography from "../../scenes/geography";
import { useNavigate } from "react-router-dom";
import { useLightState } from "../../hooks/useLightState";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import OpacityIcon from "@mui/icons-material/Opacity";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import CloudIcon from "@mui/icons-material/Cloud";

// Safe color getter
const getColor = (colors, path, fallback) => {
  return path.split(".").reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), colors) || fallback;
};

const Dashboard = () => {
  const theme = useTheme();
  const colors = theme.palette?.mode ? require("../../theme").tokens(theme.palette.mode) : {};
  const navigate = useNavigate();
  const { lightStates, syncLightStatesWithSchedule } = useLightState();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <Box m={{ xs: "10px", md: "20px" }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Header title="SMART LIGHTING CONTROL" subtitle="Hệ thống quản lý đèn thông minh doanh nghiệp" />
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            sx={{
              bgcolor: getColor(colors, "blueAccent.700", "#1e88e5"),
              color: getColor(colors, "grey.100", "#e0e0e0"),
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Xuất báo cáo
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
          >
            Đăng xuất
          </Button>
        </Box>
      </Box>

      {/* HÀNG TỔNG QUAN - SIÊU NỔI BẬT */}
      <Card sx={{ mt: 3, bgcolor: getColor(colors, "primary.500", "#141b2d"), borderRadius: 3, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={3} alignItems="center">
            {/* Thời gian */}
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <AccessTimeIcon sx={{ fontSize: 32, color: getColor(colors, "grey.300", "#a3a3a3") }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold" color={getColor(colors, "grey.100", "#e0e0e0")}>
                    {format(currentTime, "PPP")}
                  </Typography>
                  <Typography variant="body2" color={getColor(colors, "grey.300", "#a3a3a3")}>
                    {format(currentTime, "HH:mm:ss")} (GMT+7)
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* TỔNG SỐ ĐÈN - SIÊU RÕ RÀNG */}
            <Grid item xs={12} md={8}>
              <Box display="flex" justifyContent="flex-end" gap={2} flexWrap="wrap">
                {/* Tổng số đèn */}
                <Box
                  sx={{
                    bgcolor: getColor(colors, "primary.400", "#1F2A40"),
                    borderRadius: 3,
                    p: 2,
                    minWidth: 140,
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <PowerSettingsNewIcon sx={{ fontSize: 36, color: getColor(colors, "grey.100", "#e0e0e0") }} />
                  <Typography variant="h5" fontWeight="bold" color={getColor(colors, "grey.100", "#e0e0e0")} mt={1}>
                    {totalLamps}
                  </Typography>
                  <Typography variant="body2" color={getColor(colors, "grey.300", "#a3a3a3")}>
                    Tổng đèn
                  </Typography>
                </Box>

                {/* Đèn bật */}
                <Box
                  sx={{
                    bgcolor: "#1e7b3a",
                    borderRadius: 3,
                    p: 2,
                    minWidth: 140,
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(30, 123, 58, 0.3)",
                  }}
                >
                  <LightbulbIcon sx={{ fontSize: 36, color: "#c8f5d5" }} />
                  <Typography variant="h5" fontWeight="bold" color="#c8f5d5" mt={1}>
                    {lampsOn}
                  </Typography>
                  <Typography variant="body2" color="#a0e6b8">
                    Đang bật
                  </Typography>
                </Box>

                {/* Đèn tắt */}
                <Box
                  sx={{
                    bgcolor: "#7f1f1f",
                    borderRadius: 3,
                    p: 2,
                    minWidth: 140,
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(127, 31, 31, 0.3)",
                  }}
                >
                  <LightbulbOutlinedIcon sx={{ fontSize: 36, color: "#f5c8c8" }} />
                  <Typography variant="h5" fontWeight="bold" color="#f5c8c8" mt={1}>
                    {lampsOff}
                  </Typography>
                  <Typography variant="body2" color="#e6a0a0">
                    Đang tắt
                  </Typography>
                </Box>

                {/* Cảnh báo khẩn */}
                {emergencyLights.length > 0 && (
                  <Box
                    sx={{
                      bgcolor: "#c62828",
                      borderRadius: 3,
                      p: 2,
                      minWidth: 160,
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(198, 40, 40, 0.4)",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.05)" },
                    }}
                    onClick={() => navigate("/geography")}
                  >
                    <ErrorOutlineIcon sx={{ fontSize: 36, color: "#ffebee" }} />
                    <Typography variant="h6" fontWeight="bold" color="#ffebee" mt={1}>
                      {emergencyLights.length}
                    </Typography>
                    <Typography variant="body2" color="#ffb3b3">
                      Cần bật khẩn
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Thanh tiến độ tỷ lệ bật */}
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={onRate}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: getColor(colors, "grey.700", "#3d3d3d"),
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#4cceac",
                  borderRadius: 5,
                },
              }}
            />
            <Typography variant="caption" color={getColor(colors, "grey.300", "#a3a3a3")} textAlign="right" mt={0.5}>
              {onRate.toFixed(1)}% đèn đang hoạt động
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* MAIN CONTENT */}
      <Grid container spacing={2} mt={2}>
        {/* BAR CHART */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color={getColor(colors, "grey.100", "#e0e0e0")} mb={2} fontWeight="bold">
                Trạng thái đèn
              </Typography>
              <Box height={280}>
                <BarChart isDashboard={true} dataType="lamp_state" lightStates={lightStates} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* PIE CHART */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color={getColor(colors, "grey.100", "#e0e0e0")} mb={2} fontWeight="bold">
                Năng lượng tiêu thụ
              </Typography>
              <Box height={280}>
                <PieChart
                  data={Object.entries(lightStates)
                    .filter(([_, l]) => l.energy_consumed > 0)
                    .map(([id, l]) => ({ id, label: `Đèn ${id}`, value: l.energy_consumed }))}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* BẢN ĐỒ - FULL HEIGHT, SIÊU ĐẸP */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, boxShadow: 3, height: "100%" }}>
            <CardContent sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
              {/* Tiêu đề */}
              <Box p={2} pb={1}>
                <Typography variant="h6" color={getColor(colors, "grey.100", "#e0e0e0")} fontWeight="bold">
                  Vị trí đèn
                </Typography>
              </Box>

              {/* Bản đồ - FULL HEIGHT */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
                  borderRadius: "0 0 8px 8px",
                  overflow: "hidden",
                  "& > div": {
                    height: "100% !important",
                  },
                }}
              >
                <Geography isDashboard={true} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* QUICK ACTIONS */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" color={getColor(colors, "grey.100", "#e0e0e0")} mb={2} fontWeight="bold">
                Hành động nhanh
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button variant="contained" color="success" startIcon={<LightbulbIcon />} onClick={() => navigate("/light-control")}>
                  Điều khiển đèn
                </Button>
                <Button variant="contained" color="primary" startIcon={<OpacityIcon />} onClick={() => navigate("/geography")}>
                  Xem bản đồ
                </Button>
                <Button variant="outlined" startIcon={<CloudIcon />} onClick={() => navigate("/calendar")}>
                  Lịch trình
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;