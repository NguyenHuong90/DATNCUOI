// src/components/BarChart.jsx
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
import { useTheme, Box, Typography } from "@mui/material";
import { tokens } from "../theme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ isDashboard = false, dataType, lightStates }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const chartRef = useRef(null);

  const getChartData = () => {
    if (!lightStates || Object.keys(lightStates).length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = Object.keys(lightStates).map((id) => `Đèn ${id}`);
    let data = [];

    if (dataType === "lamp_state") {
      data = Object.values(lightStates).map((s) => (s.lamp_state === "ON" ? 100 : 0));
    } else if (dataType === "lamp_dim") {
      data = Object.values(lightStates).map((s) => s.lamp_dim || 0);
    } else if (dataType === "lux") {
      data = Object.values(lightStates).map((s) => s.lux || 0);
    } else if (dataType === "current_a") {
      data = Object.values(lightStates).map((s) => s.current_a || 0);
    }

    const backgroundColors = data.map((value) => {
      if (dataType === "lamp_state") return value === 100 ? colors.greenAccent[500] : colors.redAccent[500];
      if (dataType === "lamp_dim") return value > 70 ? colors.greenAccent[500] : value > 30 ? colors.blueAccent[500] : colors.redAccent[500];
      return colors.greenAccent[500];
    });

    return {
      labels,
      datasets: [
        {
          label:
            dataType === "lamp_state"
              ? "Trạng thái"
              : dataType === "lamp_dim"
              ? "Độ sáng"
              : dataType === "lux"
              ? "Ánh sáng"
              : "Dòng điện",
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(c => c.replace("500", "700")),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      duration: 1500,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: colors.primary[600],
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.raw;
            if (dataType === "lamp_state") return value === 100 ? "BẬT" : "TẮT";
            return `${value} ${dataType === "lamp_dim" ? "%" : dataType === "lux" ? "lux" : "mA"}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.grey[300], font: { weight: 600 } },
      },
      y: {
        beginAtZero: true,
        max: dataType === "lamp_state" ? 100 : dataType === "lamp_dim" ? 100 : undefined,
        grid: { color: colors.grey[900], borderDash: [5, 5] },
        ticks: {
          color: colors.grey[300],
          stepSize: dataType === "lamp_state" ? 100 : dataType === "lamp_dim" ? 25 : undefined,
          callback: (value) => {
            if (dataType === "lamp_state") return value === 100 ? "BẬT" : "TẮT";
            return `${value}${dataType === "lamp_dim" ? "%" : dataType === "lux" ? " lux" : " mA"}`;
          },
        },
      },
    },
  };

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <Typography
        variant="h6"
        fontWeight={700}
        color={colors.grey[100]}
        mb={2}
        textAlign="center"
      >
        {dataType === "lamp_state" && "Trạng thái bật/tắt"}
        {dataType === "lamp_dim" && "Độ sáng của đèn"}
        {dataType === "lux" && "Cảm biến ánh sáng"}
        {dataType === "current_a" && "Dòng điện tiêu thụ"}
      </Typography>
      <Bar ref={chartRef} data={getChartData()} options={options} />
    </Box>
  );
};

export default BarChart;