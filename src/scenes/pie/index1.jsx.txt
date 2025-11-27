// src/scenes/pie/index.jsx
import { Box, Paper, Stack, Card, CardContent, Avatar, Typography, Fade, Alert, Chip } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import { useLightState } from "../../hooks/useLightState";
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { styled } from "@mui/material/styles";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import ShowChartIcon from "@mui/icons-material/ShowChart";

// Styled components
const StatsCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "20px",
  boxShadow: theme.shadows[8],
  backdropFilter: "blur(12px)",
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[16],
    transform: "translateY(-4px)",
  },
}));

const ChartContainer = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "24px",
  boxShadow: theme.shadows[10],
  backdropFilter: "blur(16px)",
  border: `1px solid ${theme.palette.divider}`,
  p: 4,
  height: "70vh",
  position: "relative",
}));

const Pie = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { lightStates, lightHistory } = useLightState();

  // Tính toán dữ liệu năng lượng
  const energyDataFromStates = Object.entries(lightStates).reduce((acc, [nodeId, state]) => {
    if (state.energy_consumed > 0) {
      acc[nodeId] = { id: nodeId, label: `Đèn ${nodeId}`, value: state.energy_consumed };
    }
    return acc;
  }, {});

  const energyDataFromHistory = lightHistory.reduce((acc, entry) => {
    const lampId = entry.lightId;
    if (entry.energy_consumed > 0) {
      if (!acc[lampId]) {
        acc[lampId] = { id: lampId, label: `Đèn ${lampId}`, value: 0 };
      }
      acc[lampId].value += entry.energy_consumed;
    }
    return acc;
  }, { ...energyDataFromStates });

  const pieData = Object.values(energyDataFromHistory)
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalEnergy = pieData.reduce((sum, item) => sum + item.value, 0).toFixed(3);
  const activeLamps = pieData.length;
  const highestConsumption = pieData[0]?.value.toFixed(3) || 0;

  return (
    <Box m={{ xs: "10px", md: "20px" }}>
      <Header title="TIÊU THỤ NĂNG LƯỢNG" subtitle="Phân tích điện năng tiêu thụ theo từng bóng đèn" />

      {/* STATISTICS */}
      <Fade in={true} timeout={600}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
          <StatsCard elevation={0} sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.blueAccent[600], width: 60, height: 60 }}>
                  <FlashOnIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.primary[100]}>
                    {totalEnergy} kWh
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Tổng tiêu thụ</Typography>
                </Box>
              </Stack>
            </CardContent>
          </StatsCard>

          <StatsCard elevation={0} sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.greenAccent[600], width: 60, height: 60 }}>
                  <LightbulbIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.greenAccent[500]}>
                    {activeLamps}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Đèn tiêu thụ</Typography>
                </Box>
              </Stack>
            </CardContent>
          </StatsCard>

          <StatsCard elevation={0} sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.redAccent[600], width: 60, height: 60 }}>
                  <ShowChartIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.redAccent[500]}>
                    {highestConsumption} kWh
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Cao nhất</Typography>
                </Box>
              </Stack>
            </CardContent>
          </StatsCard>
        </Stack>
      </Fade>

      {/* ALERT */}
      {pieData.length === 0 && (
        <Fade in={true}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3, fontSize: "1rem" }}>
            Chưa có dữ liệu tiêu thụ năng lượng. Đèn cần hoạt động để ghi nhận.
          </Alert>
        </Fade>
      )}

      {/* CHART */}
      <Fade in={true} timeout={800}>
        <ChartContainer elevation={0}>
          <Stack spacing={2} mb={3}>
            <Typography variant="h6" fontWeight={700} color={colors.grey[100]} textAlign="center">
              Phân bố tiêu thụ năng lượng
            </Typography>
            <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={1}>
              {pieData.slice(0, 6).map((item) => (
                <Chip
                  key={item.id}
                  label={`${item.label}: ${item.value.toFixed(3)} kWh`}
                  size="small"
                  sx={{
                    bgcolor: colors.primary[600],
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
              ))}
              {pieData.length > 6 && (
                <Chip label={`+${pieData.length - 6} đèn khác`} size="small" color="default" />
              )}
            </Stack>
          </Stack>
          <Box height="calc(100% - 80px)">
            <PieChart data={pieData} />
          </Box>
        </ChartContainer>
      </Fade>
    </Box>
  );
};

export default Pie;