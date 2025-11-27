import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  useTheme,
  Button,
  TextField,
  Alert,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Fade,
} from '@mui/material';
import { tokens } from '../../theme';
import { useLightState } from '../../hooks/useLightState';
import Header from '../../components/Header';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  useEffect(() => {
    fetchLightStates();
    syncLightStatesWithSchedule(new Date());
  }, [location, fetchLightStates, syncLightStatesWithSchedule]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleToggleLight = useCallback(async (nodeId) => {
    const current = lightStates[nodeId];
    const isCurrentlyOn = current?.lamp_state === 'ON';
    try {
      if (isCurrentlyOn) {
        await updateLightState(nodeId, { lamp_state: 'OFF', lamp_dim: 0 });
        setLocalBrightness((prev) => ({ ...prev, [nodeId]: 0 }));
      } else {
        const targetBrightness = 100;
        await updateLightState(nodeId, { lamp_state: 'ON', lamp_dim: targetBrightness });
        setLocalBrightness((prev) => ({ ...prev, [nodeId]: targetBrightness }));
      }
      await syncLightStatesWithSchedule(new Date());
    } catch (err) { handleError(err); }
  }, [lightStates, updateLightState, syncLightStatesWithSchedule]);

  const handleBrightnessChange = useCallback((nodeId, newValue) => {
    setLocalBrightness((prev) => ({ ...prev, [nodeId]: newValue }));
  }, []);

  const handleBrightnessChangeCommitted = useCallback(async (nodeId, newValue) => {
    try {
      await updateLightState(nodeId, { lamp_dim: newValue });
      await syncLightStatesWithSchedule(new Date());
    } catch (err) { handleError(err); }
  }, [updateLightState, syncLightStatesWithSchedule]);

  const handleError = (err) => {
    const message = err.response?.status === 401
      ? 'Phiên hết hạn'
      : err.response?.status === 429
      ? 'Quá nhiều yêu cầu'
      : err.response?.data?.message || 'Lỗi hệ thống';
    setError(message);
    if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
  };

  const handleAddLight = useCallback(async () => {
    const nodeIdNum = parseInt(newNodeId);
    const latNum = newLat ? parseFloat(newLat) : null;
    const lngNum = newLng ? parseFloat(newLng) : null;
    if (!newNodeId.trim() || isNaN(nodeIdNum) || nodeIdNum < 1) return setError('ID đèn phải >0!');
    if (lightStates[nodeIdNum]) return setError(`Đèn ${nodeIdNum} đã tồn tại!`);
    if (newLat && (isNaN(latNum) || latNum < -90 || latNum > 90)) return setError('Vĩ độ không hợp lệ!');
    if (newLng && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) return setError('Kinh độ không hợp lệ!');
    try {
      await addLight({ gw_id: newGwId, node_id: nodeIdNum.toString(), lamp_state: 'OFF', lamp_dim: 50, lux: 0, current_a: 0, lat: latNum, lng: lngNum });
      setNewNodeId(''); setNewLat(''); setNewLng('');
      await syncLightStatesWithSchedule(new Date());
    } catch (err) { handleError(err); }
  }, [newNodeId, newGwId, newLat, newLng, lightStates, addLight, syncLightStatesWithSchedule]);

  const handleDeleteLight = useCallback(async (nodeId) => {
    if (!window.confirm(`Xóa đèn ${nodeId}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/lamp/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { gw_id: lightStates[nodeId].gw_id, node_id: nodeId },
      });
      setLightStates(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
      setLocalBrightness(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
      await syncLightStatesWithSchedule(new Date());
      fetchLightStates();
    } catch (err) { handleError(err); }
  }, [lightStates, setLightStates, fetchLightStates, syncLightStatesWithSchedule]);

  const handleEditLight = useCallback(async () => {
    const latNum = parseFloat(selectedLight.lat);
    const lngNum = parseFloat(selectedLight.lng);
    if (isNaN(latNum) || isNaN(lngNum)) return setError('Tọa độ không hợp lệ!');
    try {
      await updateLightState(selectedLight.node_id, { lat: latNum, lng: lngNum });
      setOpenEditDialog(false); setSelectedLight(null);
    } catch (err) { handleError(err); }
  }, [selectedLight, updateLightState]);

  return (
    <Box m="5px">
      <Header title="ĐIỀU KHIỂN ĐÈN" subtitle="Quản lý trạng thái, độ sáng và vị trí" />

      {/* Thêm đèn */}
      <Fade in={true} timeout={400}>
        <Card sx={{ mb: 1.5, bgcolor: colors.primary[400], borderRadius: 1 }}>
          <CardContent sx={{ py: 0.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.5} alignItems="center">
              <TextField label="Cổng" value={newGwId} onChange={e => setNewGwId(e.target.value)} size="small" sx={{ minWidth: 60, fontSize: '0.7rem' }} />
              <TextField label="ID" value={newNodeId} onChange={e => setNewNodeId(e.target.value)} type="number" size="small" sx={{ minWidth: 40, fontSize: '0.7rem' }} />
              <TextField label="Vĩ" value={newLat} onChange={e => setNewLat(e.target.value)} type="number" size="small" inputProps={{ step: 0.0001 }} sx={{ minWidth: 70 }} />
              <TextField label="Kinh" value={newLng} onChange={e => setNewLng(e.target.value)} type="number" size="small" inputProps={{ step: 0.0001 }} sx={{ minWidth: 70 }} />
              <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: colors.greenAccent[600], minWidth: 55, fontSize: '0.7rem' }} onClick={handleAddLight}>Thêm</Button>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {error && <Alert severity="error" sx={{ mb: 1, fontSize: '0.7rem' }}>{error}</Alert>}

      {/* Danh sách đèn */}
      {Object.keys(lightStates).length === 0 ? (
        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>Chưa có bóng đèn</Alert>
      ) : (
        <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
          {Object.keys(lightStates).map(nodeId => {
            const light = lightStates[nodeId];
            const isOn = light.lamp_state === 'ON';
            const brightness = isOn ? (localBrightness[nodeId] ?? light.lamp_dim) : 0;

            return (
              <Fade in key={nodeId} timeout={200}>
                <Card sx={{ mb: 1, bgcolor: colors.grey[900], borderRadius: 1, '&:hover': { borderColor: colors.greenAccent[500] } }}>
                  <CardContent sx={{ py: 0.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
                      
                      {/* Thông tin đèn */}
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {isOn ? <LightbulbIcon sx={{ color: colors.greenAccent[500], fontSize: 20 }} /> : <LightbulbOutlinedIcon sx={{ color: colors.grey[500], fontSize: 20 }} />}
                          <Typography sx={{ fontSize: '0.75rem', color: colors.grey[100] }}>Đèn {nodeId}</Typography>
                          <Chip label={isOn ? 'BẬT' : 'TẮT'} size="small" sx={{ bgcolor: isOn ? colors.greenAccent[600] : colors.redAccent[600], fontSize: '0.65rem', color: '#fff' }} />
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.25, fontSize: '0.7rem', mt: 0.25 }}>
                          <Typography color={colors.grey[300]}>Cổng: <strong>{light.gw_id}</strong></Typography>
                          <Typography color={colors.grey[300]}>Vị trí: <strong>{light.lat && light.lng ? `${light.lat.toFixed(4)}, ${light.lng.toFixed(4)}` : 'Chưa đặt'}</strong></Typography>
                        </Box>
                      </Box>

                      {/* Slider */}
                      <Box sx={{ width: { xs: '100%', md: 130 }, textAlign: 'center', mr: { xs: 0, md: 1 } }}>
                        <Slider
                          value={brightness}
                          onChange={(e, v) => handleBrightnessChange(nodeId, v)}
                          onChangeCommitted={(e, v) => handleBrightnessChangeCommitted(nodeId, v)}
                          min={0}
                          max={100}
                          disabled={!isOn}
                          sx={{
                            color: colors.greenAccent[500],
                            height: 5,
                          }}
                        />
                        <Typography sx={{ fontSize: '0.7rem', color: colors.grey[100] }}>{brightness}%</Typography>
                      </Box>

                      {/* Nút và icon */}
                      <Stack direction="row" spacing={0.3}>
                        <Button
                          size="small"
                          sx={{ minWidth: 50, fontSize: '0.65rem', bgcolor: isOn ? colors.redAccent[600] : colors.greenAccent[600] }}
                          onClick={() => handleToggleLight(nodeId)}
                        >
                          {isOn ? 'TẮT' : 'BẬT'}
                        </Button>
                        <IconButton size="small" sx={{ p: 0.3, bgcolor: colors.primary[600] }} onClick={() => { setSelectedLight({ node_id: nodeId, lat: light.lat, lng: light.lng }); setOpenEditDialog(true); }}>
                          <EditLocationIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ p: 0.3, bgcolor: colors.redAccent[600], color: '#fff' }} onClick={() => handleDeleteLight(nodeId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
            )
          })}
        </Box>
      )}

      {/* Dialog sửa vị trí */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.primary[600], color: '#fff', fontSize: '0.8rem' }}>Sửa vị trí</DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[400], py: 1 }}>
          {selectedLight && (
            <Stack spacing={1}>
              <TextField label="Vĩ độ" value={selectedLight.lat || ''} onChange={e => setSelectedLight({ ...selectedLight, lat: e.target.value })} size="small" fullWidth inputProps={{ step: 0.0001 }} />
              <TextField label="Kinh độ" value={selectedLight.lng || ''} onChange={e => setSelectedLight({ ...selectedLight, lng: e.target.value })} size="small" fullWidth inputProps={{ step: 0.0001 }} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ py: 0.5 }}>
          <Button size="small" onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button size="small" variant="contained" onClick={handleEditLight} disabled={!selectedLight?.lat || !selectedLight?.lng}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LightControl;
