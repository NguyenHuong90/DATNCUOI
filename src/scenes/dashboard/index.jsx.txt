import { Box, Button, IconButton, Typography, useTheme, Alert } from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import Geography from "../../scenes/geography";
import BarChart from "../../components/BarChart";
import ProgressCircle from "../../components/ProgressCircle";
import { useNavigate } from "react-router-dom";
import { useLightState } from "../../hooks/useLightState";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { useState, useEffect } from "react";
import { formatDate } from "@fullcalendar/react";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { lightStates, currentEvents, syncLightStatesWithSchedule } = useLightState();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusMessage, setStatusMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setStatusMessage("Không có token, vui lòng đăng nhập lại.");
        navigate("/login", { replace: true });
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(response.status);
        setIsAuthenticated(true);
      } catch (err) {
        if (err.message === "401") {
          setIsAuthenticated(false);
          setStatusMessage("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
          navigate("/login", { replace: true });
        }
      }
    };

    verifyToken();

    const interval = setInterval(async () => {
      if (!isAuthenticated) return; // Không gọi API nếu không xác thực
      const now = new Date();
      setCurrentTime(now);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsAuthenticated(false);
          setStatusMessage("Không có token, vui lòng đăng nhập lại.");
          navigate("/login", { replace: true });
          return;
        }
        const activeEvents = await syncLightStatesWithSchedule(now);
        const displayEvents = activeEvents.filter(
          (e) =>
            (e.extendedProps.action === "on" &&
              new Date(e.start) <= now &&
              (!e.end || new Date(e.end) > now)) ||
            (e.extendedProps.action === "off" && new Date(e.start) > now)
        );
        setStatusMessage(
          displayEvents.length > 0
            ? `Đang áp dụng lịch trình: ${displayEvents
                .map(
                  (e) =>
                    `${e.extendedProps.lightId} (${
                      e.extendedProps.action === "on" ? "Bật" : "Tắt"
                    } từ ${formatDate(e.start, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })} ${e.end ? "đến " + formatDate(e.end, { hour: "2-digit", minute: "2-digit", hour12: false }) : ""})`
                )
                .join(", ")}`
            : "Không có lịch trình đang hoạt động."
        );
      } catch (e) {
        console.error("Lỗi trong Dashboard useEffect:", e);
        if (e.message === "401") {
          setIsAuthenticated(false);
          setStatusMessage("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
          navigate("/login", { replace: true });
        } else {
          setStatusMessage("Lỗi khi đồng bộ lịch trình. Vui lòng thử lại sau.");
        }
      }
    }, 30000); // Tăng interval lên 30 giây để giảm tải
    return () => clearInterval(interval);
  }, [currentEvents, syncLightStatesWithSchedule, navigate, isAuthenticated]);

  const handleLogout = () => {
    try {
      localStorage.clear();
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Lỗi khi đăng xuất:", e);
      alert("Lỗi khi đăng xuất. Vui lòng thử lại.");
    }
  };

  const lightsOn = Object.values(lightStates).filter((light) => light.lamp_state === "ON").length;
  const lightsOff = Object.values(lightStates).length - lightsOn;

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" subtitle="Chào mừng bạn đến với dashboard" />
        <Box>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              mr: 2,
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Tải báo cáo
          </Button>
          <Button
            onClick={handleLogout}
            sx={{
              backgroundColor: colors.redAccent[500],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": { backgroundColor: colors.redAccent[600] },
            }}
          >
            Đăng xuất
          </Button>
        </Box>
      </Box>

      <Typography
        variant="body2"
        color={colors.grey[300]}
        sx={{ mb: "20px", textAlign: "center" }}
      >
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

      {statusMessage && (
        <Alert severity={statusMessage.includes("Lỗi") || statusMessage.includes("hết hạn") ? "error" : "info"} sx={{ mb: "20px" }}>
          {statusMessage}
        </Alert>
      )}

      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="160px"
        gap="20px"
        height="100%"
      >
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box mt="25px" p="0 30px" display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
              Trạng thái thực của điện áp
            </Typography>
            <IconButton>
              <DownloadOutlinedIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
            </IconButton>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
            <LineChart isDashboard={true} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Trạng thái bóng đèn
            </Typography>
          </Box>
          <Box p="15px">
            <Box display="flex" alignItems="center" sx={{ mb: "10px" }}>
              <Typography variant="h6" color={colors.grey[100]} sx={{ mr: "20px" }}>
                Tổng số đèn: {Object.keys(lightStates).length}
              </Typography>
              <Box display="flex" alignItems="center" sx={{ mr: "20px" }}>
                <LightbulbIcon sx={{ color: colors.greenAccent[500], fontSize: "24px", mr: "5px" }} />
                <Typography variant="body2" color={colors.grey[100]}>
                  Đèn bật: {lightsOn}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <LightbulbOutlinedIcon sx={{ color: colors.grey[500], fontSize: "24px", mr: "5px" }} />
                <Typography variant="body2" color={colors.grey[100]}>
                  Đèn tắt: {lightsOff}
                </Typography>
              </Box>
            </Box>
            {Object.keys(lightStates).map((lightId) => (
              <Box key={lightId} mb="15px" sx={{ display: "flex", alignItems: "center" }}>
                {lightStates[lightId].lamp_state === "ON" ? (
                  <LightbulbIcon sx={{ color: colors.greenAccent[500], fontSize: "24px", mr: "10px" }} />
                ) : (
                  <LightbulbOutlinedIcon sx={{ color: colors.grey[500], fontSize: "24px", mr: "10px" }} />
                )}
                <Box>
                  <Typography color={colors.grey[100]} variant="h6">
                    Bóng đèn {lightId}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={lightStates[lightId].lamp_state === "ON" ? colors.greenAccent[500] : colors.redAccent[500]}
                  >
                    Trạng thái: {lightStates[lightId].lamp_state === "ON" ? "Bật" : "Tắt"}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Công suất: {(lightStates[lightId].current_a * 220 * (lightStates[lightId].lamp_dim / 100)).toFixed(2)} W
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Độ sáng: {lightStates[lightId].lamp_dim || 0}%
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Cảm biến dòng: {lightStates[lightId].current_a || 0} A
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Cảm biến ánh sáng: {lightStates[lightId].lux || 0} lux
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Vị trí: {lightStates[lightId].lat && lightStates[lightId].lng ? `(${lightStates[lightId].lat.toFixed(4)}, ${lightStates[lightId].lng.toFixed(4)})` : "Chưa đặt"}
                  </Typography>
                  <Typography variant="body2" color={colors.grey[300]}>
                    Năng lượng tiêu thụ: {lightStates[lightId].energy_consumed?.toFixed(2) || 0} kWh
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600">
            Công suất tiêu thụ
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="center" mt="25px">
            <ProgressCircle size="125" />
            <Typography variant="h5" color={colors.greenAccent[500]} sx={{ mt: "15px" }}>
              {(Object.values(lightStates).reduce((sum, light) => sum + (light.energy_consumed || 0), 0)).toFixed(2)} kWh
            </Typography>
            <Typography>Tổng năng lượng tiêu thụ của tất cả bóng đèn</Typography>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ padding: "30px 30px 0 30px" }}
          >
            Trạng thái bóng đèn
          </Typography>
          <Box height="250px" mt="-20px">
            <BarChart isDashboard={true} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          padding="30px"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ marginBottom: "15px" }}
          >
            Bản đồ đèn
          </Typography>
          <Box height="90%" sx={{ "& > div": { height: "100% !important" } }}>
            <Geography isDashboard={true} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
