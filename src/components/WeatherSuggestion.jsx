import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import CloudIcon from "@mui/icons-material/Cloud";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";

const WeatherSuggestion = ({ forecast }) => {
  if (!forecast || forecast.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        Không có dữ liệu gợi ý thời tiết.
      </Typography>
    );
  }

  const today = forecast[0];
  let suggestion = "";
  let icon = <WbSunnyIcon color="warning" fontSize="large" />;

  if (today.precipitationProb > 70) {
    suggestion = "☔ Trời mưa lớn, nên bật đèn sớm hơn để đảm bảo tầm nhìn.";
    icon = <ThunderstormIcon color="info" fontSize="large" />;
  } else if (today.precipitationProb > 30) {
    suggestion = "☁️ Có thể nhiều mây, cần bật đèn sớm hơn một chút.";
    icon = <CloudIcon color="action" fontSize="large" />;
  } else if (today.sunset) {
    const sunset = new Date(today.sunset).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    suggestion = `🌇 Mặt trời lặn lúc ${sunset}. Nên bật đèn trước 15 phút.`;
  }

  return (
    <Card
      sx={{
        width: 280,
        backgroundColor: "rgba(30, 30, 47, 0.9)",
        color: "white",
        boxShadow: 4,
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Gợi ý điều khiển
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {suggestion}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default WeatherSuggestion;
