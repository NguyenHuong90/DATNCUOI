// src/scenes/calendar/index.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  Typography,
  useTheme,
  Select,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Alert,
  Paper,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Fade,
  Slider,
  Card,
  CardContent,
  FormControl,     // ĐÃ THÊM
  InputLabel,      // ĐÃ THÊM
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { useLightState } from "../../hooks/useLightState";
import { styled } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AddTaskIcon from "@mui/icons-material/AddTask";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { format } from "date-fns";

// Styled components
const CalendarCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
  borderRadius: "20px",
  boxShadow: theme.shadows[8],
  backdropFilter: "blur(12px)",
  border: `1px solid ${theme.palette.divider}`,
  overflow: "hidden",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[16],
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 700,
  boxShadow: theme.shadows[6],
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[12],
  },
}));

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();
  const { lightStates, addSchedule, deleteSchedule, currentEvents, fetchLightStates, syncLightStatesWithSchedule } = useLightState();

  const [selectedLight, setSelectedLight] = useState("");
  const [action, setAction] = useState("on");
  const [openDialog, setOpenDialog] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [brightness, setBrightness] = useState(75);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [error, setError] = useState("");
  const calendarRef = useRef(null);

  useEffect(() => {
    fetchLightStates();
    syncLightStatesWithSchedule(new Date());
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [location, fetchLightStates, syncLightStatesWithSchedule]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedLight(Object.keys(lightStates)[0] || "");
    setAction("on");
    setStartTime("");
    setEndTime("");
    setBrightness(75);
    setSelectedDate(null);
    setError("");
  }, [lightStates]);

  const handleDateClick = useCallback((selected) => {
    setSelectedDate(selected);
    setOpenDialog(true);
  }, []);

  const handleEventClick = useCallback(async (selected) => {
    if (!window.confirm(`Xóa lịch: "${selected.event.title}"?`)) return;
    try {
      await deleteSchedule(selected.event.id);
      await syncLightStatesWithSchedule(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi xóa lịch!");
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
  }, [deleteSchedule, syncLightStatesWithSchedule]);

  const handleConfirmEvent = useCallback(async () => {
    if (!selectedLight || !startTime || !selectedDate) {
      setError("Vui lòng chọn đèn và thời gian!");
      return;
    }

    const [sh, sm] = startTime.split(":").map(Number);
    const start = new Date(selectedDate.startStr);
    start.setHours(sh, sm, 0, 0);

    let end = null;
    if (action === "on") {
      if (!endTime) return setError("Chọn thời gian kết thúc!");
      const [eh, em] = endTime.split(":").map(Number);
      end = new Date(selectedDate.startStr);
      end.setHours(eh, em, 0, 0);
      if (end <= start) return setError("Kết thúc phải sau bắt đầu!");
      if (brightness < 1 || brightness > 100) return setError("Độ sáng: 1-100%");
    }

    try {
      await addSchedule({
        gw_id: lightStates[selectedLight]?.gw_id || "gw-01",
        node_id: selectedLight,
        action,
        start: start.toISOString(),
        end: end?.toISOString() || null,
        lamp_dim: action === "on" ? brightness : undefined,
      });
      handleCloseDialog();
      await syncLightStatesWithSchedule(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi thêm lịch!");
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
  }, [selectedLight, startTime, endTime, action, brightness, selectedDate, lightStates, addSchedule, syncLightStatesWithSchedule, handleCloseDialog]);

  const activeSchedules = currentEvents.filter(e => {
    const now = new Date();
    const end = e.end ? new Date(e.end) : new Date(4102444800000);
    return now < end;
  }).length;

  const totalLights = Object.keys(lightStates).length;

  return (
    <Box m={{ xs: "10px", md: "20px" }}>
      <Header title="LỊCH HẸN GIỜ" subtitle="Quản lý bật/tắt đèn tự động" />

      {/* STATISTICS */}
      <Fade in={true} timeout={600}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
          <Card elevation={0} sx={{ flex: 1, bgcolor: "background.paper", borderRadius: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.blueAccent[600], width: 56, height: 56 }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.primary[100]}>
                    {activeSchedules}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Lịch đang hoạt động</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ flex: 1, bgcolor: "background.paper", borderRadius: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.greenAccent[600], width: 56, height: 56 }}>
                  <LightbulbIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={800} color={colors.greenAccent[500]}>
                    {totalLights}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Tổng số bóng đèn</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ flex: 1, bgcolor: "background.paper", borderRadius: 4 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: colors.redAccent[600], width: 56, height: 56 }}>
                  <AccessTimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color={colors.blueAccent[500]}>
                    {format(currentDateTime, "HH:mm:ss")} {/* DÙNG currentDateTime */}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(currentDateTime, "dd/MM/yyyy")} {/* DÙNG currentDateTime */}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Fade>

      {error && (
        <Fade in={true}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {totalLights === 0 && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          Chưa có bóng đèn. Vui lòng thêm trong trang <strong>Điều khiển đèn</strong>.
        </Alert>
      )}

      {/* CALENDAR */}
      <Fade in={true} timeout={800}>
        <CalendarCard elevation={0}>
          <FullCalendar
            ref={calendarRef}
            height="70vh"
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth", // ĐÃ THÊM LẠI listMonth
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateClick}
            eventClick={handleEventClick}
            events={currentEvents}
            eventDidMount={(info) => {
              const now = new Date();
              const eventEnd = info.event.end ? new Date(info.event.end) : new Date(4102444800000);
              const isActive = now < eventEnd;
              const isOn = info.event.extendedProps.action === "on";

              info.el.style.background = isActive
                ? (isOn ? "linear-gradient(135deg, #4caf50, #66bb6a)" : "linear-gradient(135deg, #f44336, #ef5350)")
                : "linear-gradient(135deg, #9e9e9e, #bdbdbd)";
              info.el.style.color = "#fff";
              info.el.style.border = "none";
              info.el.style.borderRadius = "8px";
              info.el.style.fontWeight = "600";
            }}
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            buttonText={{
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày",
              list: "Danh sách",
            }}
          />
        </CalendarCard>
      </Fade>

      {/* DIALOG */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.primary[600], color: "#fff", py: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AddTaskIcon />
            <Typography variant="h6" fontWeight={700}>Lập lịch hẹn giờ</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: colors.primary[400], pt: 3 }}>
          {totalLights === 0 ? (
            <Alert severity="warning">Không có bóng đèn để lập lịch!</Alert>
          ) : (
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.grey[300] }}>Chọn bóng đèn</InputLabel>
                <Select
                  value={selectedLight}
                  onChange={(e) => setSelectedLight(e.target.value)}
                  label="Chọn bóng đèn"
                  sx={{ color: colors.grey[100] }}
                >
                  {Object.entries(lightStates).map(([id, state]) => (
                    <MenuItem key={id} value={id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LightbulbIcon fontSize="small" color={state.status === "on" ? "success" : "inherit"} />
                        <span>Đèn {id}</span>
                        {state.status === "on" && <Chip label="Đang bật" size="small" color="success" />}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.grey[300] }}>Hành động</InputLabel>
                <Select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  label="Hành động"
                  sx={{ color: colors.grey[100] }}
                >
                  <MenuItem value="on">
                    <Chip label="BẬT" color="success" size="small" sx={{ mr: 1 }} />
                    Bật đèn
                  </MenuItem>
                  <MenuItem value="off">
                    <Chip label="TẮT" color="error" size="small" sx={{ mr: 1 }} />
                    Tắt đèn
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Thời gian bắt đầu"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
              />

              {action === "on" && (
                <>
                  <TextField
                    label="Thời gian kết thúc"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
                  />

                  <Box>
                    <Typography gutterBottom color={colors.grey[300]}>
                      Độ sáng: <strong>{brightness}%</strong>
                    </Typography>
                    <Slider
                      value={brightness}
                      onChange={(_, v) => setBrightness(v)}
                      min={1}
                      max={100}
                      valueLabelDisplay="auto"
                      sx={{
                        color: colors.greenAccent[500],
                        "& .MuiSlider-thumb": { bgcolor: colors.greenAccent[600] },
                      }}
                    />
                  </Box>

                  <Alert severity="info" icon={<ScheduleIcon />}>
                    Đèn sẽ tự động tắt lúc <strong>{endTime}</strong> với độ sáng <strong>{brightness}%</strong>.
                  </Alert>
                </>
              )}

              {action === "off" && (
                <Alert severity="warning" icon={<DeleteSweepIcon />}>
                  Đèn sẽ bị <strong>tắt vĩnh viễn</strong> từ <strong>{startTime}</strong>. Có thể bật lại thủ công.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ bgcolor: colors.primary[400], p: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: 3 }}>
            Hủy
          </Button>
          <GradientButton
            onClick={handleConfirmEvent}
            variant="contained"
            color="success"
            disabled={!selectedLight || !startTime || (action === "on" && (!endTime || brightness < 1))}
            sx={{ bgcolor: colors.greenAccent[600], "&:hover": { bgcolor: colors.greenAccent[700] } }}
          >
            Xác nhận
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;