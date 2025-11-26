import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

const LineChart = ({ chartData }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Đảm bảo Chart.js đã được đăng ký
    const Chart = require("chart.js/auto").default;

    // Hủy biểu đồ cũ nếu tồn tại
    if (chartRef.current?.chart) {
      chartRef.current.chart.destroy();
    }

    // Tạo biểu đồ mới
    const ctx = chartRef.current.getContext("2d");
    chartRef.current.chart = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Thời gian",
              color: "#ffffff",
            },
            ticks: {
              color: "#ffffff",
              maxTicksLimit: 10,
            },
          },
          y: {
            title: {
              display: true,
              text: "Độ sáng (%)",
              color: "#ffffff",
            },
            ticks: {
              color: "#ffffff",
            },
            beginAtZero: true,
            max: 100,
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
            },
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}%`,
            },
          },
        },
      },
    });

    // Cleanup khi component unmount
    return () => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.destroy();
      }
    };
  }, [chartData]);

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <canvas ref={chartRef} />
    </Box>
  );
};

export default LineChart;