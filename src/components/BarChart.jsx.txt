import { useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTheme, Box } from "@mui/material";
import { tokens } from "../theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ isDashboard = false, dataType, lightStates }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode) || {
    greenAccent: { 500: "#00C49F", 700: "#008573" },
    grey: { 100: "#e0e0e0", 900: "#1a1a1a" },
  }; // Cung cấp giá trị mặc định nếu tokens trả về undefined
  const chartRef = useRef(null);

  console.log('BarChart received lightStates:', lightStates, 'dataType:', dataType);

  const getChartData = () => {
    if (!lightStates || Object.keys(lightStates).length === 0) {
      console.warn('lightStates is empty or undefined, returning empty chart data');
      return {
        labels: [],
        datasets: [
          {
            label: "Dữ liệu",
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1,
          },
        ],
      };
    }

    const labels = Object.keys(lightStates).map((nodeId) => `Đèn ${nodeId}`);
    let data = [];

    if (dataType === "lamp_state") {
      data = Object.values(lightStates).map((state) => (state.lamp_state === "ON" ? 1 : 0));
    } else if (dataType === "lamp_dim") {
      data = Object.values(lightStates).map((state) => state.lamp_dim || 0);
    } else if (dataType === "lux") {
      data = Object.values(lightStates).map((state) => state.lux || 0);
    } else if (dataType === "current_a") {
      data = Object.values(lightStates).map((state) => state.current_a || 0);
    }

    return {
      labels,
      datasets: [
        {
          label:
            dataType === "lamp_state"
              ? "Trạng thái (Bật/Tắt)"
              : dataType === "lamp_dim"
              ? "Độ sáng (%)"
              : dataType === "lux"
              ? "Cảm biến ánh sáng (lux)"
              : "Dòng điện (mA)",
          data,
          backgroundColor: colors.greenAccent[500], // Sử dụng màu xanh cho tất cả
          borderColor: colors.greenAccent[700], // Sử dụng màu xanh đậm cho tất cả
          borderWidth: 1,
        },
      ],
    };
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: colors.grey[100],
        },
      },
      title: {
        display: true,
        text:
          dataType === "lamp_state"
            ? "Trạng thái bật/tắt của bóng đèn"
            : dataType === "lamp_dim"
            ? "Độ sáng của bóng đèn"
            : dataType === "lux"
            ? "Cảm biến ánh sáng của bóng đèn"
            : "Dòng điện của bóng đèn",
        color: colors.grey[100],
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            if (dataType === "lamp_state") {
              return context.raw === 1 ? "Bật" : "Tắt";
            }
            return `${context.raw} ${
              dataType === "lamp_dim" ? "%" : dataType === "lux" ? "lux" : "mA"
            }`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.grey[100],
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max:
          dataType === "lamp_state"
            ? 1
            : dataType === "lamp_dim"
            ? 100
            : undefined,
        ticks: {
          color: colors.grey[100],
          stepSize: dataType === "lamp_state" ? 1 : undefined,
          callback: function (value) {
            if (dataType === "lamp_state") {
              return value === 1 ? "Bật" : "Tắt";
            }
            return `${value} ${
              dataType === "lamp_dim" ? "%" : dataType === "lux" ? "lux" : "mA"
            }`;
          },
        },
        grid: {
          color: colors.grey[900],
        },
      },
    },
  };

  return (
    <Box sx={{ height: isDashboard ? "400px" : "100%", width: "100%" }}>
      <Bar ref={chartRef} data={getChartData()} options={options} />
    </Box>
  );
};

export default BarChart;