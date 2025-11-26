import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, useTheme, Button, TextField, Alert, Slider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { tokens } from '../../theme';
import { useLightState } from '../../hooks/useLightState';
import Header from '../../components/Header';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import axios from 'axios';

// Component điều khiển đèn
const LightControl = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();
  const { lightStates, setLightStates, syncLightStatesWithSchedule, fetchLightStates, updateLightState, addLight } = useLightState();
  const [localBrightness, setLocalBrightness] = useState({});
  const [newGwId, setNewGwId] = useState('gw-01');
  const [newNodeId, setNewNodeId] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [error, setError] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedLight, setSelectedLight] = useState(null);

  // Tải trạng thái đèn và đồng bộ lịch trình
  useEffect(() => {
    console.log('Tải trạng thái đèn và đồng bộ lịch trình khi mount LightControl hoặc chuyển trang');
    fetchLightStates();
    syncLightStatesWithSchedule(new Date());
  }, [location, fetchLightStates, syncLightStatesWithSchedule]);

  // Xóa thông báo lỗi sau 5 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Bật/tắt đèn
  const handleToggleLight = useCallback(async (nodeId) => {
    console.log('Đang bật/tắt đèn:', nodeId, 'Trạng thái hiện tại:', lightStates[nodeId]?.lamp_state);
    const now = new Date();
    const newState = lightStates[nodeId]?.lamp_state === 'ON' ? 'OFF' : 'ON';
    try {
      await updateLightState(nodeId, { lamp_state: newState });
      if (newState === 'OFF') {
        setLocalBrightness((prev) => ({ ...prev, [nodeId]: 0 }));
      }
      await syncLightStatesWithSchedule(now);
      setError('');
      console.log('Bật/tắt đèn thành công:', nodeId, 'Trạng thái mới:', newState);
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
        : err.response?.status === 429
        ? 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút'
        : err.response?.data?.message || 'Không thể bật/tắt đèn';
      setError(message);
      console.error('Lỗi khi bật/tắt đèn:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
  }, [lightStates, updateLightState, syncLightStatesWithSchedule]);

  // Thay đổi độ sáng
  const handleBrightnessChange = useCallback((nodeId, newValue) => {
    console.log('Đang thay đổi độ sáng:', nodeId, 'Giá trị mới:', newValue);
    setLocalBrightness((prev) => ({ ...prev, [nodeId]: newValue }));
  }, []);

  // Xác nhận thay đổi độ sáng
  const handleBrightnessChangeCommitted = useCallback(async (nodeId, newValue) => {
    console.log('Xác nhận độ sáng:', nodeId, 'Giá trị mới:', newValue);
    const now = new Date();
    try {
      await updateLightState(nodeId, { lamp_dim: newValue });
      await syncLightStatesWithSchedule(now);
      setError('');
      console.log('Cập nhật độ sáng thành công:', nodeId, newValue);
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
        : err.response?.status === 429
        ? 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút'
        : err.response?.data?.message || 'Không thể cập nhật độ sáng';
      setError(message);
      console.error('Lỗi khi cập nhật độ sáng:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
  }, [updateLightState, syncLightStatesWithSchedule]);

  // Thêm bóng đèn
  const handleAddLight = useCallback(async () => {
    if (!newNodeId.trim()) {
      setError('Vui lòng nhập ID bóng đèn (số nguyên, ví dụ: 2)!');
      return;
    }
    if (!newGwId.trim()) {
      setError('Vui lòng nhập ID cổng kết nối!');
      return;
    }
    const nodeIdNum = parseInt(newNodeId);
    const latNum = parseFloat(newLat);
    const lngNum = parseFloat(newLng);
    if (isNaN(nodeIdNum) || nodeIdNum < 1) {
      setError('ID bóng đèn phải là số nguyên dương!');
      return;
    }
    if (lightStates[nodeIdNum]) {
      setError(`Bóng đèn với ID ${nodeIdNum} đã tồn tại!`);
      return;
    }
    if (newLat && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
      setError('Vĩ độ phải là số từ -90 đến 90!');
      return;
    }
    if (newLng && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
      setError('Kinh độ phải là số từ -180 đến 180!');
      return;
    }

    try {
      await addLight({
        gw_id: newGwId,
        node_id: nodeIdNum.toString(),
        lamp_state: 'OFF',
        lamp_dim: 50,
        lux: 0,
        current_a: 0,
        lat: newLat ? latNum : null,
        lng: newLng ? lngNum : null,
      });
      setNewNodeId('');
      setNewGwId('gw-01');
      setNewLat('');
      setNewLng('');
      setError('');
      console.log('Thêm bóng đèn thành công:', nodeIdNum);
      await syncLightStatesWithSchedule(new Date());
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
        : err.response?.status === 429
        ? 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút'
        : err.response?.data?.message || 'Không thể thêm bóng đèn';
      setError(message);
      console.error('Lỗi khi thêm bóng đèn:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
  }, [newNodeId, newGwId, newLat, newLng, lightStates, addLight, syncLightStatesWithSchedule]);

  // Xóa bóng đèn
  const handleDeleteLight = useCallback(async (nodeId) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bóng đèn ${nodeId}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/lamp/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { gw_id: lightStates[nodeId].gw_id, node_id: nodeId },
      });
      const now = new Date();
      setLightStates((prev) => {
        const newStates = { ...prev };
        delete newStates[nodeId];
        return JSON.stringify(newStates) !== JSON.stringify(prev) ? newStates : prev;
      });
      setLocalBrightness((prev) => {
        const newBrightness = { ...prev };
        delete newBrightness[nodeId];
        return JSON.stringify(newBrightness) !== JSON.stringify(prev) ? newBrightness : prev;
      });
      await syncLightStatesWithSchedule(now);
      fetchLightStates();
      setError('');
      console.log('Xóa bóng đèn thành công:', nodeId);
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
        : err.response?.status === 429
        ? 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút'
        : err.response?.data?.message || 'Không thể xóa bóng đèn';
      setError(message);
      console.error('Lỗi khi xóa bóng đèn:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
  }, [lightStates, setLightStates, fetchLightStates, syncLightStatesWithSchedule]);

  // Chỉnh sửa vị trí đèn
  const handleEditLight = useCallback(async () => {
    const latNum = parseFloat(selectedLight.lat);
    const lngNum = parseFloat(selectedLight.lng);

    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setError('Tọa độ không hợp lệ (lat: -90 đến 90, lng: -180 đến 180)!');
      return;
    }

    try {
      await updateLightState(selectedLight.node_id, {
        lat: latNum,
        lng: lngNum,
      });
      setOpenEditDialog(false);
      setSelectedLight(null);
      setError('');
      console.log('Cập nhật vị trí đèn thành công:', selectedLight.node_id);
    } catch (err) {
      const message = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
        : err.response?.status === 429
        ? 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút'
        : err.response?.data?.message || 'Không thể cập nhật vị trí đèn';
      setError(message);
      console.error('Lỗi khi cập nhật vị trí đèn:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
  }, [selectedLight, updateLightState]);

  return (
    <Box m="20px">
      <Header title="Điều khiển đèn" subtitle="Bật/tắt, điều chỉnh độ sáng và quản lý bóng đèn" />
      <Box mb="20px">
        <Box display="flex" alignItems="center" gap="10px">
          <TextField
            label="ID cổng kết nối (gw_id)"
            value={newGwId}
            onChange={(e) => setNewGwId(e.target.value)}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
          />
          <TextField
            label="ID bóng đèn (số, ví dụ: 2)"
            value={newNodeId}
            onChange={(e) => setNewNodeId(e.target.value)}
            type="number"
            inputProps={{ min: 1 }}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
          />
          <TextField
            label="Vĩ độ (-90 đến 90)"
            value={newLat}
            onChange={(e) => setNewLat(e.target.value)}
            type="number"
            inputProps={{ step: 0.0001 }}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
          />
          <TextField
            label="Kinh độ (-180 đến 180)"
            value={newLng}
            onChange={(e) => setNewLng(e.target.value)}
            type="number"
            inputProps={{ step: 0.0001 }}
            sx={{ input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
          />
          <Button variant="contained" color="success" onClick={handleAddLight}>
            Thêm bóng đèn
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: '10px' }}>{error}</Alert>}
      </Box>
      {Object.keys(lightStates).length === 0 && (
        <Alert severity="info" sx={{ mt: '10px' }}>
          Hiện tại chưa có bóng đèn nào được thêm.
        </Alert>
      )}
      <Box
        display="flex"
        flexDirection="column"
        gap="10px"
        sx={{ maxHeight: '70vh', overflowY: 'auto', padding: '10px', backgroundColor: colors.primary[400], borderRadius: '8px' }}
      >
        {Object.keys(lightStates).map((nodeId) => (
          <Box
            key={nodeId}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px',
              backgroundColor: colors.grey[900],
              borderRadius: '12px',
            }}
          >
            <Box display="flex" alignItems="center" gap="10px">
              {lightStates[nodeId]?.lamp_state === 'ON' ? (
                <LightbulbIcon sx={{ color: colors.greenAccent[500], fontSize: '24px' }} />
              ) : (
                <LightbulbOutlinedIcon sx={{ color: colors.grey[500], fontSize: '24px' }} />
              )}
              <Box>
                <Typography color={colors.grey[100]} variant="h6">
                  Đèn {nodeId}
                </Typography>
                <Typography color={lightStates[nodeId]?.lamp_state === 'ON' ? colors.greenAccent[500] : colors.redAccent[500]} variant="body2">
                  {lightStates[nodeId]?.lamp_state === 'ON' ? 'Bật' : 'Tắt'}
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  Cổng kết nối: {lightStates[nodeId]?.gw_id || 'N/A'}
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  Vị trí: {lightStates[nodeId]?.lat && lightStates[nodeId]?.lng ? `(${lightStates[nodeId].lat.toFixed(4)}, ${lightStates[nodeId].lng.toFixed(4)})` : 'Chưa đặt'}
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  Cảm biến ánh sáng: {lightStates[nodeId]?.lux || 0} lux
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  Dòng điện: {lightStates[nodeId]?.current_a || 0} A
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  Năng lượng tiêu thụ: {lightStates[nodeId]?.energy_consumed || 0} kWh
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: '150px', ml: '20px' }}>
              <Slider
                value={lightStates[nodeId]?.lamp_state === 'ON' ? (localBrightness[nodeId] ?? lightStates[nodeId]?.lamp_dim) : 0}
                onChange={(e, newValue) => handleBrightnessChange(nodeId, newValue)}
                onChangeCommitted={(e, newValue) => handleBrightnessChangeCommitted(nodeId, newValue)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                disabled={lightStates[nodeId]?.lamp_state !== 'ON'}
                sx={{
                  color: colors.greenAccent[500],
                  '& .MuiSlider-thumb': { backgroundColor: colors.greenAccent[500] },
                  '& .MuiSlider-track': { backgroundColor: colors.greenAccent[500] },
                  '& .MuiSlider-rail': { backgroundColor: colors.grey[700] },
                  '& .MuiSlider-thumb.Mui-disabled': { backgroundColor: colors.grey[600] },
                  '& .MuiSlider-track.Mui-disabled': { backgroundColor: colors.grey[700] },
                }}
              />
              <Typography color={colors.grey[100]} variant="body2" textAlign="center">
                Độ sáng: {lightStates[nodeId]?.lamp_state === 'ON' ? (localBrightness[nodeId] ?? lightStates[nodeId]?.lamp_dim) : 0}%
              </Typography>
            </Box>
            <Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: lightStates[nodeId]?.lamp_state === 'ON' ? colors.redAccent[500] : colors.greenAccent[500],
                  '&:hover': { backgroundColor: lightStates[nodeId]?.lamp_state === 'ON' ? colors.redAccent[600] : colors.greenAccent[600] },
                }}
                onClick={() => handleToggleLight(nodeId)}
              >
                {lightStates[nodeId]?.lamp_state === 'ON' ? 'Tắt' : 'Bật'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{ ml: '10px' }}
                onClick={() => {
                  setSelectedLight({ node_id: nodeId, lat: lightStates[nodeId].lat, lng: lightStates[nodeId].lng });
                  setOpenEditDialog(true);
                }}
              >
                Sửa vị trí
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ ml: '10px' }}
                onClick={() => handleDeleteLight(nodeId)}
              >
                Xóa
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle sx={{ color: colors.grey[100], backgroundColor: colors.primary[400] }}>
          Sửa vị trí bóng đèn
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: colors.primary[400] }}>
          {selectedLight && (
            <>
              <Typography sx={{ mb: '10px', color: colors.grey[100] }}>
                Đèn: {selectedLight.node_id}
              </Typography>
              <TextField
                label="Vĩ độ (-90 đến 90)"
                value={selectedLight.lat || ''}
                onChange={(e) => setSelectedLight({ ...selectedLight, lat: e.target.value })}
                type="number"
                inputProps={{ step: 0.0001 }}
                fullWidth
                sx={{ mb: '10px', input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
              />
              <TextField
                label="Kinh độ (-180 đến 180)"
                value={selectedLight.lng || ''}
                onChange={(e) => setSelectedLight({ ...selectedLight, lng: e.target.value })}
                type="number"
                inputProps={{ step: 0.0001 }}
                fullWidth
                sx={{ mb: '10px', input: { color: colors.grey[100] }, label: { color: colors.grey[300] } }}
              />
              <Alert severity="info" sx={{ mt: '10px' }}>
                Nhập tọa độ thủ công hoặc chuyển sang trang Bản đồ để chọn vị trí trực tiếp.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[400], p: '10px' }}>
          <Button onClick={() => setOpenEditDialog(false)} color="secondary">
            Hủy
          </Button>
          <Button onClick={handleEditLight} color="success" disabled={!selectedLight?.lat || !selectedLight?.lng}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LightControl;
