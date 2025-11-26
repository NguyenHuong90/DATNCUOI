// src/components/AIChatbot.jsx
import React, { useState, useRef } from "react";
import Chatbot from "react-chatbot-kit";
import "react-chatbot-kit/build/react-chatbot-kit.css";
import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import { tokens } from "../theme";
import { useLightState } from "../hooks/useLightState";

const ActionProvider = ({ createChatBotMessage, setState, children }) => {
  const { updateLightState, lightStates } = useLightState();

  const addMessage = (message) => {
    const botMessage = createChatBotMessage(message);
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const handleCommand = async (userMessage) => {
    const text = userMessage.toLowerCase().trim();

    const turnOnMatch = text.match(/bật đèn (\d+)/);
    const turnOffMatch = text.match(/tắt đèn (\d+)/);
    const dimMatch = text.match(/đặt độ sáng đèn (\d+) thành (\d+)%/);

    if (turnOnMatch) {
      const id = turnOnMatch[1];
      if (lightStates[id]) {
        await updateLightState(id, { lamp_state: "ON" });
        addMessage(`Đã bật đèn ${id}`);
      } else {
        addMessage(`Không tìm thấy đèn ${id}`);
      }
      return;
    }

    if (turnOffMatch) {
      const id = turnOffMatch[1];
      if (lightStates[id]) {
        await updateLightState(id, { lamp_state: "OFF" });
        addMessage(`Đã tắt đèn ${id}`);
      } else {
        addMessage(`Không tìm thấy đèn ${id}`);
      }
      return;
    }

    if (dimMatch) {
      const [_, id, dim] = dimMatch;
      if (lightStates[id]) {
        await updateLightState(id, { lamp_dim: parseInt(dim) });
        addMessage(`Đã đặt độ sáng đèn ${id} thành ${dim}%`);
      } else {
        addMessage(`Không tìm thấy đèn ${id}`);
      }
      return;
    }

    if (text.includes("bật hết") || text.includes("bật tất cả")) {
      for (const [id] of Object.entries(lightStates)) {
        await updateLightState(id, { lamp_state: "ON" });
      }
      addMessage("Đã bật tất cả đèn");
      return;
    }

    if (text.includes("tắt hết") || text.includes("tắt tất cả")) {
      for (const [id] of Object.entries(lightStates)) {
        await updateLightState(id, { lamp_state: "OFF" });
      }
      addMessage("Đã tắt tất cả đèn");
      return;
    }

    if (text.includes("trời mưa") || text.includes("thời tiết")) {
      try {
        const light = Object.values(lightStates)[0];
        if (!light?.lat || !light?.lng) {
          addMessage("Không có tọa độ để kiểm tra thời tiết");
          return;
        }
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${light.lat}&longitude=${light.lng}&current=precipitation_probability`
        );
        const data = await res.json();
        const rain = data.current?.precipitation_probability || 0;
        addMessage(`Xác suất mưa hiện tại: ${rain}%`);
      } catch {
        addMessage("Không thể lấy dữ liệu thời tiết");
      }
      return;
    }

    addMessage("Tôi chưa hiểu. Thử: 'Bật đèn 2', 'Tắt tất cả', 'Trời mưa không?'");
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: { handleCommand },
        });
      })}
    </div>
  );
};

const MessageParser = ({ children, actions }) => {
  const parse = (message) => {
    actions.handleCommand(message);
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: { parse },
        });
      })}
    </div>
  );
};

const AIChatbot = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Trình duyệt không hỗ trợ voice");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const input = document.querySelector(".react-chatbot-kit-chat-input");
      if (input) input.value = text;
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <>
      <Tooltip title="Mở AI Assistant">
        <IconButton
          onClick={() => setOpen(!open)}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            bgcolor: "#4cceac",
            color: "white",
            width: 60,
            height: 60,
            boxShadow: 6,
            "&:hover": { bgcolor: "#3da58a" },
            zIndex: 1300,
          }}
        >
          <ChatIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>

      {open && (
        <Box
          sx={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 380,
            height: 520,
            bgcolor: colors.primary[400],
            borderRadius: 3,
            boxShadow: 8,
            border: `1px solid ${colors.grey[700]}`,
            zIndex: 1200,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2, bgcolor: colors.primary[600], color: "white", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            AI Trợ Lý Đèn Thông Minh
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "white" }}>
              ×
            </IconButton>
          </Box>

          <Box sx={{ height: 400 }}>
            <Chatbot
              config={{
                botName: "AI",
                initialMessages: [
                  { type: "bot", message: "Chào bạn! Tôi có thể bật/tắt đèn, điều chỉnh độ sáng, kiểm tra thời tiết. Thử nói: 'Bật đèn 2'" },
                ],
              }}
              messageParser={MessageParser}
              actionProvider={ActionProvider}
            />
          </Box>

          <Box sx={{ p: 1, textAlign: "center", bgcolor: colors.primary[500] }}>
            <Tooltip title={listening ? "Đang nghe..." : "Giữ để nói lệnh"}>
              <IconButton
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                sx={{
                  bgcolor: listening ? "#f44336" : "#42a5f5",
                  color: "white",
                  "&:hover": { bgcolor: listening ? "#d32f2f" : "#1976d2" },
                }}
              >
                {listening ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </>
  );
};

export default AIChatbot;