import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { LightStateProvider } from "./hooks/useLightState";

import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";

import Login from "./scenes/login/Login";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Form from "./scenes/form";
import Bar from "./scenes/bar";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import Calendar from "./scenes/calendar/calendar";
import Geography from "./scenes/geography";
import LightControl from "./scenes/lightcontrol/LightControl";
import History from "./scenes/history/History";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [theme, colorMode] = useMode();

  const PrivateLayout = () => (
    <div className="app" style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main className="content" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/form" element={<Form />} />
          <Route path="/bar" element={<Bar />} />
          <Route path="/pie" element={<Pie />} />
          <Route path="/line" element={<Line />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/geography" element={<Geography />} />
          <Route path="/light-control" element={<LightControl />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LightStateProvider>
          <Routes>
            {/* Luôn vào login trước */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Tất cả các trang cần đăng nhập */}
            <Route path="/*" element={<ProtectedRoute><PrivateLayout /></ProtectedRoute>} />
          </Routes>
        </LightStateProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;