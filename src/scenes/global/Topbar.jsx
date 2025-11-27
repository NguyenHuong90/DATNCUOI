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
      px={2}
      py={0.75}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        backgroundColor: colors.primary[400],
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        minHeight: "50px",
      }}
    >
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[500]}
        borderRadius="6px"
        width="220px"
        sx={{
          border: `1px solid ${colors.primary[300]}`,
          "&:focus-within": {
            border: `1px solid ${colors.blueAccent[500]}`,
          },
        }}
      >
        <InputBase 
          sx={{ 
            ml: 1.5, 
            flex: 1, 
            fontSize: "13px",
            py: 0.5,
          }} 
          placeholder="Tìm kiếm..." 
        />
        <IconButton type="button" sx={{ p: 0.75 }}>
          <SearchIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ICONS */}
      <Box display="flex" gap={0.5}>
        <IconButton 
          onClick={colorMode.toggleColorMode} 
          size="small"
          sx={{ 
            p: 0.75,
            "&:hover": {
              bgcolor: colors.primary[500],
            }
          }}
        >
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
          ) : (
            <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
        <IconButton 
          size="small"
          sx={{ 
            p: 0.75,
            "&:hover": {
              bgcolor: colors.primary[500],
            }
          }}
        >
          <NotificationsOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton 
          size="small"
          sx={{ 
            p: 0.75,
            "&:hover": {
              bgcolor: colors.primary[500],
            }
          }}
        >
          <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton 
          size="small"
          sx={{ 
            p: 0.75,
            "&:hover": {
              bgcolor: colors.primary[500],
            }
          }}
        >
          <PersonOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton 
          onClick={handleLogout} 
          color="error" 
          size="small"
          sx={{ 
            p: 0.75,
            "&:hover": {
              bgcolor: "rgba(244, 67, 54, 0.1)",
            }
          }}
        >
          <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;