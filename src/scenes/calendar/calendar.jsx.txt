import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import FullCalendar, { formatDate } from "@fullcalendar/react";
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
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { useLightState } from "../../hooks/useLightState";

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();
  const { lightStates, addSchedule, deleteSchedule, currentEvents, fetchLightStates, syncLightStatesWithSchedule } = useLightState();
  const [selectedLight, setSelectedLight] = useState(Object.keys(lightStates)[0] || "");
  const [action, setAction] = useState("on");
  const [openDialog, setOpenDialog] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [brightness, setBrightness] = useState(50); // Thêm state cho độ sáng
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [error, setError] = useState("");
  const calendarRef = useRef(null);

  useEffect(() => {
    console.log('Fetching light states and syncing schedules on Calendar mount or route change');
    fetchLightStates();
    syncLightStatesWithSchedule(new Date());
    const timeInterval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => {
      console.log('Cleaning up Calendar time interval');
      clearInterval(timeInterval);
    };
  }, [location, fetchLightStates, syncLightStatesWithSchedule]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedLight(Object.keys(lightStates)[0] || "");
    setAction("on");
    setStartTime("");
    setEndTime("");
    setBrightness(50); // Reset độ sáng
    setSelectedDate(null);
    setError("");
  }, [lightStates]);

  const handleDateClick = useCallback((selected) => {
    console.log('Date clicked:', selected.startStr);
    setSelectedDate(selected);
    setOpenDialog(true);
  }, []);

  const handleEventClick = useCallback(async (selected) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sự kiện '${selected.event.title}'?`)) return;
    try {
      console.log('Deleting schedule:', selected.event.id);
      await deleteSchedule(selected.event.id);
      setError("");
      await syncLightStatesWithSchedule(new Date());
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
        : err.response?.status === 429
        ? 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút'
        : err.response?.data?.message || 'Có lỗi khi xóa lịch trình. Vui lòng thử lại!';
      setError(message);
      console.error('Error deleting schedule:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
  }, [deleteSchedule, syncLightStatesWithSchedule]);

  const handleConfirmEvent = useCallback(async () => {
    if (!selectedLight || !startTime || !selectedDate) {
      setError("Vui lòng chọn bóng đèn và thời gian bắt đầu!");
      return;
    }

    const startDateTime = new Date(selectedDate.startStr);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    if (isNaN(startHours) || isNaN(startMinutes) || startHours > 23 || startMinutes > 59) {
      setError("Thời gian bắt đầu không hợp lệ! Vui lòng dùng định dạng HH:MM (00:00-23:59).");
      return;
    }
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    let endDateTime = null;
    if (action === "on") {
      if (!endTime) {
        setError("Vui lòng chọn thời gian kết thúc khi đặt bật đèn!");
        return;
      }
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      if (isNaN(endHours) || isNaN(endMinutes) || endHours > 23 || endMinutes > 59) {
        setError("Thời gian kết thúc không hợp lệ! Vui lòng dùng định dạng HH:MM (00:00-23:59).");
        return;
      }
      endDateTime = new Date(selectedDate.startStr);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      if (endDateTime <= startDateTime) {
        setError("Thời gian kết thúc phải sau thời gian bắt đầu!");
        return;
      }
      const brightnessNum = parseInt(brightness);
      if (isNaN(brightnessNum) || brightnessNum < 0 || brightnessNum > 100) {
        setError("Độ sáng phải là số từ 0 đến 100!");
        return;
      }
    }

    try {
      console.log('Adding schedule:', {
        gw_id: lightStates[selectedLight]?.gw_id || "gw-01",
        node_id: selectedLight,
        action,
        start: startDateTime.toISOString(),
        end: endDateTime ? endDateTime.toISOString() : null,
        lamp_dim: action === "on" ? parseInt(brightness) : undefined,
      });
      await addSchedule({
        gw_id: lightStates[selectedLight]?.gw_id || "gw-01",
        node_id: selectedLight,
        action,
        start: startDateTime.toISOString(),
        end: endDateTime ? endDateTime.toISOString() : null,
        lamp_dim: action === "on" ? parseInt(brightness) : undefined,
      });
      setError("");
      handleCloseDialog();
      await syncLightStatesWithSchedule(new Date());
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
        : err.response?.status === 429
        ? 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút'
        : err.response?.data?.message || 'Có lỗi khi thêm lịch trình. Vui lòng thử lại!';
      setError(message);
      console.error('Error adding schedule:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
  }, [selectedLight, startTime, selectedDate, action, endTime, brightness, lightStates, addSchedule, syncLightStatesWithSchedule, handleCloseDialog]);

  return (
    <Box m="20px">
      <Header title="Lịch hẹn giờ" subtitle="Lập lịch bật/tắt bóng đèn" />
      <Typography variant="body2" color={colors.grey[300]} sx={{ mb: "20px", textAlign: "center" }}>
        Thời gian hiện tại: {formatDate(currentDateTime, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })} (+07)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: "10px" }}>{error}</Alert>}

      {Object.keys(lightStates).length === 0 && (
        <Alert severity="info" sx={{ mb: "10px" }}>
          Hiện tại chưa có bóng đèn nào được thêm. Vui lòng thêm bóng đèn trong trang Điều khiển đèn.
        </Alert>
      )}

      <Box>
        <FullCalendar
          ref={calendarRef}
          height="75vh"
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
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
            const eventEnd = info.event.end ? new Date(info.event.end) : (info.event.extendedProps.action === "off" ? new Date(4102444800000) : new Date(info.event.start));
            info.el.style.backgroundColor = now >= eventEnd ? colors.redAccent[500] : info.event.extendedProps.action === "on" ? colors.greenAccent[500] : colors.redAccent[500];
            info.el.style.borderColor = now >= eventEnd ? colors.redAccent[500] : info.event.extendedProps.action === "on" ? colors.greenAccent[600] : colors.redAccent[600];
          }}
        />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle sx={{ color: colors.grey[100], backgroundColor: colors.primary[400] }}>
          Thêm lịch hẹn giờ
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: colors.primary[400] }}>
          {Object.keys(lightStates).length === 0 ? (
            <Alert severity="warning">
              Không có bóng đèn nào để lập lịch. Vui lòng thêm bóng đèn trong trang Điều khiển đèn.
            </Alert>
          ) : (
            <>
              <Select
                value={selectedLight}
                onChange={(e) => setSelectedLight(e.target.value)}
                fullWidth
                sx={{ mb: "10px", color: colors.grey[100] }}
              >
                {Object.keys(lightStates).map((light) => (
                  <MenuItem key={light} value={light}>
                    Đèn {light}
                  </MenuItem>
                ))}
              </Select>
              <Select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                fullWidth
                sx={{ mb: "10px", color: colors.grey[100] }}
              >
                <MenuItem value="on">Bật</MenuItem>
                <MenuItem value="off">Tắt</MenuItem>
              </Select>
              <TextField
                label="Thời gian bắt đầu (HH:MM)"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                fullWidth
                sx={{ mb: "10px", input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
                required
              />
              {action === "on" && (
                <>
                  <TextField
                    label="Thời gian kết thúc (HH:MM)"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    fullWidth
                    sx={{ mb: "10px", input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
                    required
                  />
                  <TextField
                    label="Độ sáng (%) (0-100)"
                    type="number"
                    value={brightness}
                    onChange={(e) => setBrightness(e.target.value)}
                    inputProps={{ min: 0, max: 100, step: 1 }}
                    fullWidth
                    sx={{ mb: "10px", input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
                    required
                  />
                  <Alert severity="info" sx={{ mt: "10px" }}>
                    Lưu ý: Đèn sẽ tự động tắt khi đến thời gian kết thúc, với độ sáng đã chọn.
                  </Alert>
                </>
              )}
              {action === "off" && (
                <Alert severity="info" sx={{ mt: "10px" }}>
                  Lưu ý: Đèn sẽ được tắt vĩnh viễn từ thời gian bắt đầu và sự kiện sẽ tự động xóa khỏi lịch. Có thể bật lại đèn qua LightControl.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[400], p: "10px" }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleConfirmEvent} color="success" disabled={!selectedLight || !startTime || (action === "on" && (!endTime || !brightness))}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;