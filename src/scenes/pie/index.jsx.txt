import { Box } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import { useLightState } from "../../hooks/useLightState";

const Pie = () => {
  const { lightStates, lightHistory } = useLightState();

  // Lấy năng lượng từ lightStates (từ database khi load)
  const energyDataFromStates = Object.entries(lightStates).reduce((acc, [nodeId, state]) => {
    if (state.energy_consumed > 0) {
      acc[nodeId] = { id: nodeId, label: `Lamp ${nodeId}`, value: state.energy_consumed };
    }
    return acc;
  }, {});

  // Kết hợp với lightHistory để cập nhật thêm nếu có
  const energyDataFromHistory = lightHistory.reduce((acc, entry) => {
    const lampId = entry.lightId;
    if (entry.energy_consumed > 0) {
      if (!acc[lampId]) {
        acc[lampId] = { id: lampId, label: `Lamp ${lampId}`, value: 0 };
      }
      acc[lampId].value += entry.energy_consumed;
    }
    return acc;
  }, energyDataFromStates);

  const pieData = Object.values(energyDataFromHistory).filter(item => item.value > 0);

  return (
    <Box m="20px">
      <Header title="Energy Consumption" subtitle="Pie Chart of Energy Consumption per Lamp" />
      <Box height="75vh">
        <PieChart data={pieData} />
      </Box>
    </Box>
  );
};

export default Pie;