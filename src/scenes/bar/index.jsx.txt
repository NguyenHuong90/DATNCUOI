import { Box, Select, MenuItem, useTheme, Alert } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import BarChart from "../../components/BarChart";
import { useState } from "react";
import { useLightState } from "../../hooks/useLightState";

const Bar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { lightStates } = useLightState();
  const [dataType, setDataType] = useState("lamp_state");

  console.log('Light states in Bar:', lightStates);

  return (
    <Box m="20px">
      <Header title="Biểu đồ trạng thái đèn" subtitle="Biểu đồ cột hiển thị trạng thái, độ sáng, cảm biến ánh sáng hoặc dòng điện" />
      {Object.keys(lightStates).length === 0 && (
        <Alert severity="info" sx={{ mb: "10px" }}>
          Hiện tại chưa có bóng đèn nào được thêm. Vui lòng thêm bóng đèn trong trang Điều khiển đèn.
        </Alert>
      )}
      <Box display="flex" justifyContent="flex-end" mb="10px">
        <Select
          value={dataType}
          onChange={(e) => setDataType(e.target.value)}
          sx={{ color: colors.grey[100] }}
        >
          <MenuItem value="lamp_state">Trạng thái (Bật/Tắt)</MenuItem>
          <MenuItem value="lamp_dim">Độ sáng</MenuItem>
          <MenuItem value="lux">Cảm biến ánh sáng</MenuItem>
          <MenuItem value="current_a">Dòng điện</MenuItem>
        </Select>
      </Box>
      <Box height="75vh">
        <BarChart isDashboard={false} dataType={dataType} lightStates={lightStates} />
      </Box>
    </Box>
  );
};

export default Bar;