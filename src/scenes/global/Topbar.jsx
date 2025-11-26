import { Box, IconButton, useTheme } from "@mui/material";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={1} // Giảm padding từ 2 xuống 1
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        backgroundColor: colors.primary[500],
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Thêm bóng nhẹ
      }}
    >
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="4px"
        width="250px" // Giới hạn chiều rộng thanh tìm kiếm
      >
        <InputBase sx={{ ml: 1, flex: 1, fontSize: "14px" }} placeholder="Tìm kiếm" />
        <IconButton type="button" sx={{ p: 0.5 }}>
          <SearchIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ICONS */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode} size="small">
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon fontSize="small" />
          ) : (
            <LightModeOutlinedIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton size="small">
          <NotificationsOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small">
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small">
          <PersonOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={handleLogout} color="error" size="small">
          <LogoutOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;