// src/scenes/global/Sidebar.jsx
import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
        padding: "1px 10px !important",
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography fontSize="10px">{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("currentUser") || "{}")
  );

  useEffect(() => {
    const syncUser = () =>
      setCurrentUser(JSON.parse(localStorage.getItem("currentUser") || "{}"));
    window.addEventListener("storage", syncUser);
    syncUser();
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const isAdmin = currentUser?.role === "admin";

  return (
    <Box
      sx={{
        "& .pro-sidebar": {
          width: isCollapsed ? "70px !important" : "190px !important",
          minWidth: isCollapsed ? "70px !important" : "190px !important",
        },
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {       // Bỏ màu nền icon
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "1px 8px !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* MENU TOGGLE */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={<MenuOutlinedIcon />}
            style={{ margin: "1px 0" }}
          />

          {/* USER INFO */}
          {!isCollapsed && (
            <Box mb="4px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="55px"
                  height="55px"
                  src="/assets/user.png"
                  style={{ borderRadius: "50%" }}
                />
              </Box>

              <Box textAlign="center" mt="2px">
                <Typography
                  fontSize="9px"
                  color={colors.grey[100]}
                  fontWeight="600"
                >
                  {currentUser.firstName || "Guest"} {currentUser.lastName || ""}
                </Typography>
                <Typography
                  fontSize="8px"
                  color={isAdmin ? colors.greenAccent[500] : colors.grey[300]}
                  sx={{ mt: "1px" }}
                >
                  {isAdmin ? "Admin" : "User"}
                </Typography>
              </Box>
            </Box>
          )}

          {/* MENU ITEMS */}
          <Box paddingLeft={isCollapsed ? undefined : "4%"}>
            <Item title="Dashboard" to="/dashboard" icon={<HomeOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="body2" fontSize="8px" color={colors.grey[300]} sx={{ m: "2px 0 1px 6px" }}>Data</Typography>
            <Item title="Manage Team" to="/team" icon={<PeopleOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="body2" fontSize="8px" color={colors.grey[300]} sx={{ m: "2px 0 1px 6px" }}>Pages</Typography>
            {isAdmin && <Item title="Profile Form" to="/form" icon={<PersonOutlinedIcon />} selected={selected} setSelected={setSelected} />}
            <Item title="Calendar" to="/calendar" icon={<CalendarTodayOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="body2" fontSize="8px" color={colors.grey[300]} sx={{ m: "2px 0 1px 6px" }}>Charts</Typography>
            <Item title="Bar Chart" to="/bar" icon={<BarChartOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="Geography Chart" to="/geography" icon={<MapOutlinedIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="body2" fontSize="8px" color={colors.grey[300]} sx={{ m: "2px 0 1px 6px" }}>Light</Typography>
            <Item title="Light Control" to="/light-control" icon={<LightbulbOutlinedIcon />} selected={selected} setSelected={setSelected} />
            <Item title="ML Prediction" to="/ml-prediction" icon={<AutoGraphIcon />} selected={selected} setSelected={setSelected} />

            <Typography variant="body2" fontSize="8px" color={colors.grey[300]} sx={{ m: "2px 0 1px 6px" }}>History</Typography>
            <Item title="History" to="/history" icon={<HistoryOutlinedIcon />} selected={selected} setSelected={setSelected} />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
