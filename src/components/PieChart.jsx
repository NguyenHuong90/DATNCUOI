// src/components/PieChart.jsx – ĐÃ SỬA HOÀN CHỈNH
import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../theme";
import { useTheme, Box, Typography } from "@mui/material";

const PieChart = ({ data }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const colorPalette = [
    "#4caf50", "#2196f3", "#ff9800", "#f44336", "#9c27b0",
    "#00bcd4", "#ffeb3b", "#8bc34a", "#ff5722", "#607d8b"
  ];

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <ResponsivePie
        data={data}
        margin={{ top: 40, right: 160, bottom: 80, left: 80 }} // Tăng right để legend rộng
        innerRadius={0.55}
        padAngle={2}
        cornerRadius={8}
        activeOuterRadiusOffset={12}
        borderWidth={2}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        colors={colorPalette}

        // TẮT LABEL TRÊN HÌNH TRÒN
        enableArcLinkLabels={false}     // TẮT DÒNG NỐI + LABEL
        arcLinkLabelsSkipAngle={999}    // Backup
        arcLinkLabelsTextColor="transparent"
        arcLinkLabelsThickness={0}

        // CHỈ HIỆN GIÁ TRỊ TRÊN MIẾNG TRÒN
        enableArcLabels={true}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="#ffffff"
        arcLabelsRadiusOffset={0.65}
        arcLabel={(d) => `${d.value.toFixed(3)} kWh`}

        theme={{
          labels: {
            text: {
              fontSize: 14,
              fontWeight: 700,
              fill: "#fff",
            },
          },
          legends: {
            text: { fill: colors.grey[100], fontSize: 13, fontWeight: 600 },
          },
        }}

        // LEGEND BÊN PHẢI – RÕ RÀNG, CHUYÊN NGHIỆP
        legends={[
          {
            anchor: "right",
            direction: "column",
            justify: false,
            translateX: 80,
            translateY: 0,
            itemsSpacing: 12,
            itemWidth: 140,
            itemHeight: 24,
            itemDirection: "left-to-right",
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: "circle",
            itemTextColor: colors.grey[100],
            effects: [
              {
                on: "hover",
                style: {
                  itemTextColor: colors.grey[300],
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}

        motionConfig="gentle"

        // TOOLTIP ĐẸP, CHI TIẾT
        tooltip={({ datum }) => {
          const percent = data.length > 0 
            ? ((datum.value / data.reduce((s, i) => s + i.value, 0)) * 100).toFixed(1)
            : 0;
          return (
            <Box
              sx={{
                bgcolor: colors.primary[600],
                color: "#fff",
                p: 1.5,
                borderRadius: 2,
                boxShadow: 8,
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              <Typography variant="subtitle2">{datum.label}</Typography>
              <Typography>{datum.value.toFixed(3)} kWh</Typography>
              <Typography variant="caption">{percent}% tổng</Typography>
            </Box>
          );
        }}
      />
    </Box>
  );
};

export default PieChart;