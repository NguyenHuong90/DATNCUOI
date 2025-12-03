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
  Select,
  MenuItem,
  Paper,
  Avatar,
  Fade,
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
import FlashOnIcon from "@mui/icons-material/FlashOn";
import Brightness6Icon from "@mui/icons-material/Brightness6";
import { styled } from "@mui/material/styles";

const getColor = (colors, path, fallback) => {
  return path.split(".").reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), colors) || fallback;
};

const ControlCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "8px",
  boxShadow: theme.shadows[1],
  backdropFilter: "blur(6px)",
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.2s ease",
}));

const Dashboard = () => {
  const theme = useTheme();
  const colors = theme.palette?.mode ? require("../../theme").tokens(theme.palette.mode) : {};
  const navigate = useNavigate();
  const { lightStates, syncLightStatesWithSchedule } = useLightState();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataType, setDataType] = useState("lamp_state");

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

  const avgBrightness = totalLamps > 0 
    ? Math.round(Object.values(lightStates).reduce((sum, s) => sum + (s.lamp_dim || 0), 0) / totalLamps)
    : 0;

  const chartStats = [
    { label: "Tổng đèn", value: totalLamps, icon: <LightbulbIcon />, color: colors.redAccent?.[600] || "#f44336", textColor: colors.primary?.[100] || "#e0e0e0" },
    { label: "Đang bật", value: lampsOn, icon: <FlashOnIcon />, color: colors.greenAccent?.[600] || "#4caf50", textColor: colors.greenAccent?.[500] || "#66bb6a" },
    { label: "Độ sáng TB", value: `${avgBrightness}%`, icon: <Brightness6Icon />, color: colors.blueAccent?.[600] || "#2196f3", textColor: colors.blueAccent?.[500] || "#42a5f5" }
  ];

  return (
    <Box m={{ xs: "10px", md: "16px" }} maxWidth="1600px" mx="auto">
      {/* HEADER - Compact */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight="700" color={getColor(colors, "grey.100", "#e0e0e0")}>
            SMART LIGHTING CONTROL
          </Typography>
          <Typography variant="body2" color={getColor(colors, "grey.300", "#a3a3a3")}>
            Hệ thống quản lý đèn thông minh doanh nghiệp
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            sx={{
              bgcolor: getColor(colors, "blueAccent.700", "#1e88e5"),
              color: getColor(colors, "grey.100", "#e0e0e0"),
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.875rem",
              py: 0.75,
              px: 2,
            }}
          >
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
            sx={{ 
              fontWeight: 600, 
              textTransform: "none",
              fontSize: "0.875rem",
              py: 0.75,
              px: 2,
            }}
          >
            Đăng xuất
          </Button>
        </Box>
      </Box>

      {/* TỔNG QUAN - Micro Compact */}
      <Card sx={{ 
        bgcolor: getColor(colors, "primary.500", "#141b2d"), 
        borderRadius: 1.5, 
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        mb: 1.5
      }}>
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Grid container spacing={1} alignItems="center">
            {/* Thời gian - Micro */}
            <Grid item xs={12} md={2}>
              <Box display="flex" alignItems="center" gap={0.75}>
                <AccessTimeIcon sx={{ fontSize: 16, color: getColor(colors, "grey.300", "#a3a3a3") }} />
                <Box>
                  <Typography variant="caption" fontWeight="600" color={getColor(colors, "grey.100", "#e0e0e0")} display="block" fontSize="0.7rem" lineHeight={1.2}>
                    {format(currentTime, "dd/MM/yyyy")}
                  </Typography>
                  <Typography variant="caption" color={getColor(colors, "grey.300", "#a3a3a3")} fontSize="0.65rem" lineHeight={1.2}>
                    {format(currentTime, "HH:mm:ss")}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Stats Cards - Micro */}
            <Grid item xs={12} md={10}>
              <Box display="flex" justifyContent="flex-end" gap={0.75} flexWrap="wrap">
                {/* Tổng số đèn */}
                <Box
                  sx={{
                    bgcolor: getColor(colors, "primary.400", "#1F2A40"),
                    borderRadius: 1,
                    p: 0.75,
                    minWidth: 70,
                    textAlign: "center",
                  }}
                >
                  <PowerSettingsNewIcon sx={{ fontSize: 18, color: getColor(colors, "grey.100", "#e0e0e0") }} />
                  <Typography variant="body2" fontWeight="700" color={getColor(colors, "grey.100", "#e0e0e0")} lineHeight={1.1} mt={0.25}>
                    {totalLamps}
                  </Typography>
                  <Typography variant="caption" color={getColor(colors, "grey.300", "#a3a3a3")} fontSize="0.65rem" lineHeight={1.1}>
                    Tổng đèn
                  </Typography>
                </Box>

                {/* Đèn bật */}
                <Box
                  sx={{
                    bgcolor: "#1e7b3a",
                    borderRadius: 1,
                    p: 0.75,
                    minWidth: 70,
                    textAlign: "center",
                  }}
                >
                  <LightbulbIcon sx={{ fontSize: 18, color: "#c8f5d5" }} />
                  <Typography variant="body2" fontWeight="700" color="#c8f5d5" lineHeight={1.1} mt={0.25}>
                    {lampsOn}
                  </Typography>
                  <Typography variant="caption" color="#a0e6b8" fontSize="0.65rem" lineHeight={1.1}>
                    Đang bật
                  </Typography>
                </Box>

                {/* Đèn tắt */}
                <Box
                  sx={{
                    bgcolor: "#7f1f1f",
                    borderRadius: 1,
                    p: 0.75,
                    minWidth: 70,
                    textAlign: "center",
                  }}
                >
                  <LightbulbOutlinedIcon sx={{ fontSize: 18, color: "#f5c8c8" }} />
                  <Typography variant="body2" fontWeight="700" color="#f5c8c8" lineHeight={1.1} mt={0.25}>
                    {lampsOff}
                  </Typography>
                  <Typography variant="caption" color="#e6a0a0" fontSize="0.65rem" lineHeight={1.1}>
                    Đang tắt
                  </Typography>
                </Box>

                {/* Cảnh báo khẩn */}
                {emergencyLights.length > 0 && (
                  <Box
                    sx={{
                      bgcolor: "#c62828",
                      borderRadius: 1,
                      p: 0.75,
                      minWidth: 80,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.05)" },
                    }}
                    onClick={() => navigate("/geography")}
                  >
                    <ErrorOutlineIcon sx={{ fontSize: 18, color: "#ffebee" }} />
                    <Typography variant="body2" fontWeight="700" color="#ffebee" lineHeight={1.1} mt={0.25}>
                      {emergencyLights.length}
                    </Typography>
                    <Typography variant="caption" color="#ffb3b3" fontSize="0.65rem" lineHeight={1.1}>
                      Cần bật khẩn
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Progress Bar - Micro Slim */}
          <Box mt={0.75}>
            <LinearProgress
              variant="determinate"
              value={onRate}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: getColor(colors, "grey.700", "#3d3d3d"),
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#4cceac",
                  borderRadius: 2,
                },
              }}
            />
            <Typography variant="caption" color={getColor(colors, "grey.300", "#a3a3a3")} display="block" textAlign="right" mt={0.25} fontSize="0.65rem">
              {onRate.toFixed(1)}% đang hoạt động
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* MAIN CONTENT - 2 Rows Layout */}
      <Grid container spacing={2}>
        {/* Row 1: Charts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, height: "100%" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="subtitle1" color={getColor(colors, "grey.100", "#e0e0e0")} mb={1.5} fontWeight="600">
                Trạng thái đèn
              </Typography>
              <Box height={220}>
                <BarChart isDashboard={true} dataType="lamp_state" lightStates={lightStates} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, height: "100%" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="subtitle1" color={getColor(colors, "grey.100", "#e0e0e0")} mb={1.5} fontWeight="600">
                Năng lượng tiêu thụ
              </Typography>
              <Box height={220}>
                <PieChart
                  data={Object.entries(lightStates)
                    .filter(([_, l]) => l.energy_consumed > 0)
                    .map(([id, l]) => ({ id, label: `Đèn ${id}`, value: l.energy_consumed }))}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 2: Map + Quick Actions */}
        <Grid item xs={12} md={10}>
          <Card sx={{ 
            bgcolor: getColor(colors, "primary.400", "#1F2A40"), 
            borderRadius: 2, 
            height: 400 
          }}>
            <CardContent sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
              <Box px={2} pt={2} pb={1}>
                <Typography variant="subtitle1" color={getColor(colors, "grey.100", "#e0e0e0")} fontWeight="600">
                  Vị trí đèn
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: "relative",
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

        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: getColor(colors, "primary.400", "#1F2A40"), borderRadius: 2, height: 400 }}>
            <CardContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle1" color={getColor(colors, "grey.100", "#e0e0e0")} mb={2} fontWeight="600">
                Hành động nhanh
              </Typography>
              <Stack spacing={1.5} flex={1}>
                <Button 
                  fullWidth
                  variant="contained" 
                  color="success" 
                  startIcon={<LightbulbIcon />} 
                  onClick={() => navigate("/light-control")}
                  sx={{ py: 1.5, textTransform: "none", fontWeight: 600 }}
                >
                  Điều khiển đèn
                </Button>
                <Button 
                  fullWidth
                  variant="contained" 
                  color="primary" 
                  startIcon={<OpacityIcon />} 
                  onClick={() => navigate("/geography")}
                  sx={{ py: 1.5, textTransform: "none", fontWeight: 600 }}
                >
                  Xem bản đồ
                </Button>
                <Button 
                  fullWidth
                  variant="outlined" 
                  startIcon={<CloudIcon />} 
                  onClick={() => navigate("/calendar")}
                  sx={{ py: 1.5, textTransform: "none", fontWeight: 600 }}
                >
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