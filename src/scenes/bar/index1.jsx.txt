// src/scenes/bar/index.jsx
import { Box, Select, MenuItem, useTheme, Alert, Paper, Stack, Card, CardContent, Avatar, Typography, Fade } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import BarChart from "../../components/BarChart";
import { useState } from "react";
import { useLightState } from "../../hooks/useLightState";
import { styled } from "@mui/material/styles";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import OpacityIcon from "@mui/icons-material/Opacity";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import Brightness6Icon from "@mui/icons-material/Brightness6";

// Styled components
const ControlCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "16px",
  boxShadow: theme.shadows[6],
  backdropFilter: "blur(12px)",
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[12],
    transform: "translateY(-2px)",
  },
}));

const Bar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { lightStates } = useLightState();
  const [dataType, setDataType] = useState("lamp_state");

  const totalLights = Object.keys(lightStates).length;
  const onCount = Object.values(lightStates).filter(s => s.lamp_state === "ON").length;
  const avgBrightness = totalLights > 0 
    ? Math.round(Object.values(lightStates).reduce((sum, s) => sum + (s.lamp_dim || 0), 0) / totalLights)
    : 0;

  return (
    <Box m={{ xs: "10px", md: "20px" }}>
      <Header title="BIỂU ĐỒ TRẠNG THÁI ĐÈN" subtitle="Phân tích dữ liệu đèn theo thời gian thực" />

      {/* STATISTICS */}
      <Fade in={true} timeout={600}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
          <Card elevation={0} sx={{ flex: 1, bgcolor: "background.paper", borderRadius: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.redAccent[600], width: 56, height: 56 }}>
                  <LightbulbIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.primary[100]}>
                    {totalLights}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Tổng số đèn</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ flex: 1, bgcolor: "background.paper", borderRadius: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.greenAccent[600], width: 56, height: 56 }}>
                  <FlashOnIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.greenAccent[500]}>
                    {onCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Đang bật</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ flex: 1, bgcolor: "background.paper", borderRadius: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.blueAccent[600], width: 56, height: 56 }}>
                  <Brightness6Icon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.blueAccent[500]}>
                    {avgBrightness}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Độ sáng trung bình</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Fade>

      {totalLights === 0 && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          Chưa có bóng đèn. Vui lòng thêm trong trang <strong>Điều khiển đèn</strong>.
        </Alert>
      )}

      {/* CONTROL PANEL */}
      <Fade in={true} timeout={800}>
        <ControlCard elevation={0} sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>
              Chọn loại dữ liệu
            </Typography>
            <Select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              sx={{
                minWidth: 240,
                color: colors.grey[100],
                "& .MuiSelect-icon": { color: colors.grey[300] },
              }}
            >
              <MenuItem value="lamp_state">
                <Stack direction="row" spacing={1} alignItems="center">
                  <OpacityIcon fontSize="small" />
                  <span>Trạng thái (Bật/Tắt)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="lamp_dim">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Brightness6Icon fontSize="small" />
                  <span>Độ sáng (%)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="lux">
                <Stack direction="row" spacing={1} alignItems="center">
                  <LightbulbIcon fontSize="small" />
                  <span>Cảm biến ánh sáng (lux)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="current_a">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FlashOnIcon fontSize="small" />
                  <span>Dòng điện (mA)</span>
                </Stack>
              </MenuItem>
            </Select>
          </Stack>
        </ControlCard>
      </Fade>

      {/* CHART */}
      <Fade in={true} timeout={1000}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: "background.paper",
            boxShadow: theme.shadows[8],
            height: "70vh",
          }}
        >
          <BarChart isDashboard={false} dataType={dataType} lightStates={lightStates} />
        </Paper>
      </Fade>
    </Box>
  );
};

export default Bar;