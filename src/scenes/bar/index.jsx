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

const ControlCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "8px",
  boxShadow: theme.shadows[1],
  backdropFilter: "blur(6px)",
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.2s ease",
  "&:hover": { boxShadow: theme.shadows[3], transform: "translateY(-1px)" },
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

  const stats = [
    { label: "Tổng đèn", value: totalLights, icon: <LightbulbIcon />, color: colors.redAccent[600], textColor: colors.primary[100] },
    { label: "Đang bật", value: onCount, icon: <FlashOnIcon />, color: colors.greenAccent[600], textColor: colors.greenAccent[500] },
    { label: "Độ sáng TB", value: `${avgBrightness}%`, icon: <Brightness6Icon />, color: colors.blueAccent[600], textColor: colors.blueAccent[500] }
  ];

  return (
    <Box m={{ xs: 2, md: 3 }}>
      <Header title="BIỂU ĐỒ TRẠNG THÁI ĐÈN" subtitle="Phân tích dữ liệu đèn theo thời gian thực" />

      {/* STATISTICS */}
      <Fade in timeout={200}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} mb={0.5}>
          {stats.map((item, idx) => (
            <Card key={idx} elevation={0} sx={{ flex: 1, bgcolor: "background.paper", borderRadius: 0.5 }}>
              <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 } }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Avatar sx={{ bgcolor: item.color, width: 24, height: 24, fontSize: "0.875rem" }}>
                    {item.icon}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} color={item.textColor} fontSize="0.875rem">
                      {item.value}
                    </Typography>
                    <Typography variant="caption" fontSize="0.6rem" color="text.secondary" lineHeight={1.2}>{item.label}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Fade>

      {totalLights === 0 && (
        <Alert severity="info" sx={{ mb: 0.5, borderRadius: 0.5, fontSize: "0.6rem" }}>
          Chưa có bóng đèn. Vui lòng thêm trong trang <strong>Điều khiển đèn</strong>.
        </Alert>
      )}

      {/* CONTROL PANEL */}
      <Fade in timeout={250}>
        <ControlCard elevation={0} sx={{ p: 0.5, mb: 0.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={0.3} alignItems="center" justifyContent="space-between">
            <Typography variant="overline" fontWeight={600}>
              Chọn dữ liệu
            </Typography>
            <Select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              sx={{
                minWidth: 120,
                fontSize: "0.6rem",
                color: colors.grey[100],
                "& .MuiSelect-icon": { color: colors.grey[300] },
              }}
            >
              <MenuItem value="lamp_state">
                <Stack direction="row" spacing={0.2} alignItems="center">
                  <OpacityIcon fontSize="inherit" />
                  <span>Trạng thái</span>
                </Stack>
              </MenuItem>
              <MenuItem value="lamp_dim">
                <Stack direction="row" spacing={0.2} alignItems="center">
                  <Brightness6Icon fontSize="inherit" />
                  <span>Độ sáng (%)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="lux">
                <Stack direction="row" spacing={0.2} alignItems="center">
                  <LightbulbIcon fontSize="inherit" />
                  <span>Ánh sáng (lux)</span>
                </Stack>
              </MenuItem>
              <MenuItem value="current_a">
                <Stack direction="row" spacing={0.2} alignItems="center">
                  <FlashOnIcon fontSize="inherit" />
                  <span>Dòng điện (mA)</span>
                </Stack>
              </MenuItem>
            </Select>
          </Stack>
        </ControlCard>
      </Fade>

      {/* CHART */}
      <Fade in timeout={300}>
        <Paper
          elevation={0}
          sx={{
            p: 0.5,
            borderRadius: 0.5,
            bgcolor: "background.paper",
            boxShadow: theme.shadows[1],
            height: "45vh",
          }}
        >
          <BarChart isDashboard={false} dataType={dataType} lightStates={lightStates} />
        </Paper>
      </Fade>
    </Box>
  );
};

export default Bar;