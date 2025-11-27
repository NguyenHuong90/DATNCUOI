import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const Header = ({ title, subtitle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box mb="15px"> {/* giảm margin-bottom */}
      <Typography
        variant="h5"          // giảm từ h2 -> h4
        color={colors.grey[100]}
        fontWeight="bold"
        sx={{ m: "0 0 2px 0" }} // giảm margin-bottom
      >
        {title}
      </Typography>
      <Typography
        variant="subtitle1"    // giảm từ h5 -> subtitle1
        color={colors.greenAccent[400]}
        sx={{ fontSize: "0.85rem" }} // tùy chỉnh nhỏ thêm
      >
        {subtitle}
      </Typography>
    </Box>
  );
};

export default Header;
