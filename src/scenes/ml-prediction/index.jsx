import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Divider,
  Fab,
  Drawer,
  Badge,
  TextField,
  IconButton,
} from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BoltIcon from '@mui/icons-material/Bolt';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import * as tf from '@tensorflow/tfjs';
import { useLightState } from '../../hooks/useLightState';
import { ColorModeContext } from '../../theme';

const MLPrediction = () => {
  const { lightStates, lightHistory } = useLightState();
  const { mode } = useContext(ColorModeContext);

  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState({}); // kWh/h dự đoán
  const [accumulatedEnergy, setAccumulatedEnergy] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const modelRef = useRef(null);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Chuẩn bị dữ liệu huấn luyện: chỉ dùng lamp_dim, current_a, hoursOn → energy (kWh)
  const prepareData = () => {
    const features = [];
    const labels = [];

    (lightHistory || []).forEach(hist => {
      if (!hist?.details) return;

      const { lampDim, currentA, energyConsumed, startTime, endTime } = hist.details;

      if (lampDim === undefined || currentA === undefined || energyConsumed === undefined) return;

      const start = new Date(startTime || hist.timestamp);
      const end = new Date(endTime || new Date());
      const hoursOn = (end - start) / (1000 * 60 * 60);

      if (hoursOn <= 0) return;

      features.push([
        lampDim / 100.0,        // normalize độ sáng về [0,1]
        currentA,               // dòng điện thực tế (A)
        hoursOn,                // thời gian bật (giờ)
      ]);

      labels.push(Math.max(0, parseFloat(energyConsumed) || 0));
    });

    // Thêm một số mẫu đèn tắt để mô hình học tốt hơn
    for (let i = 0; i < Math.max(10, features.length / 3); i++) {
      features.push([0, 0, 1 + Math.random() * 3]);
      labels.push(0);
    }

    if (features.length < 10) {
      setErrorMsg('Chưa đủ dữ liệu lịch sử (ít nhất 10 bản ghi) để huấn luyện mô hình AI.');
      return null;
    }

    console.log(`Huấn luyện mô hình với ${features.length} mẫu dữ liệu thực tế`);

    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels, [labels.length, 1]),
    };
  };

  // Huấn luyện mô hình khi có dữ liệu mới
  useEffect(() => {
    let isMounted = true;

    const trainModel = async () => {
      if (!isMounted) return;
      setLoading(true);
      setErrorMsg('');

      const data = prepareData();
      if (!data) {
        setLoading(false);
        return;
      }

      try {
        // Xóa mô hình cũ
        if (modelRef.current) {
          modelRef.current.dispose();
        }

        const mlModel = tf.sequential();
        mlModel.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [3] }));
        mlModel.add(tf.layers.dropout({ rate: 0.2 }));
        mlModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        mlModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        mlModel.add(tf.layers.dense({ units: 1, activation: 'linear' })); // linear cho regression

        mlModel.compile({
          optimizer: tf.train.adam(0.001),
          loss: 'meanSquaredError',
          metrics: ['mae'],
        });

        await mlModel.fit(data.features, data.labels, {
          epochs: 150,
          batchSize: 8,
          shuffle: true,
          verbose: 0,
        });

        data.features.dispose();
        data.labels.dispose();

        if (isMounted) {
          modelRef.current = mlModel;
          setModel(mlModel);
        }
      } catch (err) {
        console.error('Lỗi huấn luyện mô hình:', err);
        if (isMounted) setErrorMsg('Lỗi khi huấn luyện mô hình AI. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    trainModel();

    return () => {
      isMounted = false;
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [lightHistory]);

  // Dự đoán tiêu thụ mỗi giờ (kWh/h) dựa trên trạng thái hiện tại
  const predictHourlyConsumption = async (lamp) => {
    if (!modelRef.current) return null;
    if (lamp.lamp_state === 'OFF') return 0;

    const input = tf.tensor2d([[
      (lamp.lamp_dim || 0) / 100.0,
      lamp.current_a || 0,
      1.0  // giả sử dự đoán cho 1 giờ bật liên tục
    ]]);

    const predTensor = modelRef.current.predict(input);
    const pred = await predTensor.data();
    input.dispose();
    predTensor.dispose();

    return Math.max(0, pred[0]);
  };

  // Cập nhật dự đoán cho tất cả đèn
  useEffect(() => {
    if (!modelRef.current || Object.keys(lightStates).length === 0) return;

    const updatePredictions = async () => {
      const preds = {};
      for (const [nodeId, lamp] of Object.entries(lightStates)) {
        const value = await predictHourlyConsumption(lamp);
        preds[nodeId] = value;
      }
      setPredictions(preds);
    };

    updatePredictions();
  }, [modelRef.current, lightStates]);

  // Tính tổng năng lượng cộng dồn từ lịch sử
  useEffect(() => {
    const accum = {};
    (lightHistory || []).forEach(hist => {
      if (hist?.details?.nodeId && hist.details.energyConsumed !== undefined) {
        const nodeId = hist.details.nodeId;
        const energy = parseFloat(hist.details.energyConsumed) || 0;
        if (!accum[nodeId]) accum[nodeId] = 0;
        accum[nodeId] += energy;
      }
    });
    Object.keys(accum).forEach(key => {
      accum[key] = parseFloat(accum[key].toFixed(3));
    });
    setAccumulatedEnergy(accum);
  }, [lightHistory]);

  const getSuggestion = (value) => {
    if (value === null) return { text: 'Đang tính...', color: 'default', icon: <AutoGraphIcon /> };
    if (value === 0) return { text: 'Đèn tắt', color: 'success', icon: <TrendingDownIcon /> };
    if (value > 0.015) return { text: 'Tiêu thụ cao - Nên giảm sáng', color: 'error', icon: <TrendingUpIcon /> };
    if (value < 0.005) return { text: 'Rất tiết kiệm', color: 'success', icon: <TrendingDownIcon /> };
    return { text: 'Tiêu thụ hợp lý', color: 'info', icon: <BoltIcon /> };
  };

  const getTotalPrediction = () => {
    const total = Object.values(predictions).reduce((sum, val) => sum + (val || 0), 0);
    return total.toFixed(3);
  };

  const getAveragePrediction = () => {
    const values = Object.values(predictions).filter(v => v > 0);
    if (values.length === 0) return '0.000';
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(3);
  };

  const getLampContext = () => {
    return {
      total: Object.keys(lightStates).length,
      on: Object.values(lightStates).filter(l => l.lamp_state === 'ON').length,
      lamps: Object.entries(lightStates).map(([nodeId, l]) => ({
        id: nodeId,
        state: l.lamp_state,
        brightness: l.lamp_dim || 0,
        current: l.current_a ? l.current_a.toFixed(3) : '0.000',
        prediction: predictions[nodeId] !== undefined ? predictions[nodeId].toFixed(3) : 'N/A',
        lux: l.lux || 0,
      })),
      totalPrediction: getTotalPrediction(),
      avgPrediction: getAveragePrediction(),
    };
  };

  const generateSmartResponse = (question, context) => {
    const q = question.toLowerCase();
    if (q.includes('bao nhiêu') && q.includes('đèn')) {
      return `Hiện tại có ${context.on}/${context.total} đèn đang bật.\n\n${context.lamps.filter(l => l.state === 'ON').map(l => `• Đèn ${l.id}: ${l.brightness}% (${l.prediction} kWh/h)`).join('\n')}`;
    }
    if (q.includes('tiêu thụ') || q.includes('năng lượng')) {
      const maxLamp = context.lamps.reduce((max, l) => (parseFloat(l.prediction) || 0) > (parseFloat(max.prediction) || 0) ? l : max, context.lamps[0]);
      return `Dự báo tiêu thụ (AI):\n\n• Tổng: ${context.totalPrediction} kWh/h\n• Trung bình: ${context.avgPrediction} kWh/h\n• Cao nhất: Đèn ${maxLamp.id} (${maxLamp.prediction} kWh/h)\n\n${parseFloat(maxLamp.prediction) > 0.015 ? 'Gợi ý giảm độ sáng đèn ' + maxLamp.id : 'Hệ thống đang tiết kiệm tốt!'}`;
    }
    if (q.includes('đèn') && /\d+/.test(q)) {
      const id = q.match(/\d+/)[0];
      const lamp = context.lamps.find(l => l.id === id);
      if (lamp) {
        return `Đèn ${id}:\n• Trạng thái: ${lamp.state}\n• Độ sáng: ${lamp.brightness}%\n• Dòng hiện tại: ${lamp.current}A\n• Dự báo AI: ${lamp.prediction} kWh/h\n• Ánh sáng môi trường: ${lamp.lux} lux`;
      }
      return `Không tìm thấy đèn ${id}`;
    }
    if (q.includes('tối ưu') || q.includes('tiết kiệm')) {
      const high = context.lamps.filter(l => parseFloat(l.prediction) > 0.012 && l.state === 'ON');
      if (high.length > 0) {
        return `Gợi ý tiết kiệm:\n${high.map(l => `• Đèn ${l.id}: giảm xuống ~70% → tiết kiệm ~${(parseFloat(l.prediction) * 0.3).toFixed(3)} kWh/h`).join('\n')}`;
      }
      return 'Hệ thống đang hoạt động rất tiết kiệm!';
    }

    return `Xin chào! Tôi là AI dự báo năng lượng đèn thông minh.\n\nBạn có thể hỏi:\n• "Có bao nhiêu đèn bật?"\n• "Tiêu thụ năng lượng thế nào?"\n• "Đèn 1 đang tiêu thụ bao nhiêu?"\n• "Gợi ý tiết kiệm điện"`;
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: input, timestamp: new Date() }]);
    setInput('');
    setChatLoading(true);

    try {
      const context = getLampContext();
      const response = generateSmartResponse(input, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi xử lý. Thử lại nhé!', timestamp: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Xin chào! Tôi là AI dự báo tiêu thụ năng lượng dựa trên dữ liệu thực tế từ đèn.\n\nHỏi tôi về dự báo, tiết kiệm điện hoặc trạng thái từng đèn nhé!',
        timestamp: new Date()
      }]);
    }
  }, [chatOpen]);

  return (
    <Box sx={{ p: 2, bgcolor: '#0f121a', minHeight: '100vh' }}>
      <Card elevation={4} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#1e2538', mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <AutoGraphIcon sx={{ fontSize: 36, color: '#6870fa', mr: 1.5 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#e0e0e0">
                  AI Dự Báo Tiêu Thụ Năng Lượng (TensorFlow.js)
                </Typography>
                <Typography variant="subtitle2" color="#b0b0b0">
                  Mô hình học từ độ sáng và dòng điện thực tế – không dùng lux
                </Typography>
              </Box>
            </Box>
            {loading && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: '#6870fa' }} />
                <Typography variant="body2" color="#b0b0b0">Đang huấn luyện AI...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {errorMsg && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Tổng quan */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1e2538', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BoltIcon sx={{ color: '#ffc107' }} />
                <Typography variant="subtitle2" color="#b0b0b0">Tổng Dự Báo (AI)</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="#e0e0e0">
                {getTotalPrediction()} kWh/h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1e2538', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AutoGraphIcon sx={{ color: '#6870fa' }} />
                <Typography variant="subtitle2" color="#b0b0b0">Trung Bình</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="#e0e0e0">
                {getAveragePrediction()} kWh/h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1e2538', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LightbulbIcon sx={{ color: '#4caf50' }} />
                <Typography variant="subtitle2" color="#b0b0b0">Đèn Đang Bật</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="#e0e0e0">
                {Object.values(lightStates).filter(l => l.lamp_state === 'ON').length}/{Object.keys(lightStates).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Danh sách đèn */}
      <Grid container spacing={2}>
        {Object.entries(lightStates || {}).map(([nodeId, lamp]) => {
          const prediction = predictions[nodeId];
          const suggestion = getSuggestion(prediction);
          const isOn = lamp.lamp_state === 'ON';
          const totalConsumed = accumulatedEnergy[nodeId] || '0.00';

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={nodeId}>
              <Card sx={{
                bgcolor: '#1e2538',
                borderRadius: 2,
                border: `2px solid ${isOn ? '#4caf50' : '#424242'}`,
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(104, 112, 250, 0.3)' }
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LightbulbIcon sx={{ color: isOn ? '#4caf50' : '#666', fontSize: 28 }} />
                      <Typography variant="h6" fontWeight="bold" color="#e0e0e0">Đèn {nodeId}</Typography>
                    </Box>
                    <Chip label={isOn ? 'BẬT' : 'TẮT'} size="small" sx={{ bgcolor: isOn ? '#4caf50' : '#666', color: '#fff' }} />
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="#b0b0b0">Độ sáng</Typography>
                      <Typography variant="caption" fontWeight="bold" color="#e0e0e0">{lamp.lamp_dim}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={lamp.lamp_dim} sx={{
                      height: 8, borderRadius: 1, bgcolor: '#151a27',
                      '& .MuiLinearProgress-bar': { bgcolor: isOn ? '#4caf50' : '#666' }
                    }} />
                  </Box>

                  <Box sx={{ bgcolor: '#151a27', borderRadius: 1.5, p: 2, mb: 1.5 }}>
                    <Typography variant="caption" color="#b0b0b0" display="block" mb={0.5}>
                      Dự báo AI (kWh/h)
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#6870fa">
                      {prediction !== undefined ? `${prediction.toFixed(3)} kWh/h` : 'Đang tính...'}
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: '#151a27', borderRadius: 1.5, p: 2, mb: 1.5 }}>
                    <Typography variant="caption" color="#b0b0b0" display="block" mb={0.5}>
                      Tổng cộng dồn
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#9c27b0">
                      {totalConsumed} kWh
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    {suggestion.icon}
                    <Chip label={suggestion.text} color={suggestion.color} size="small" variant="outlined" sx={{ flex: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Chatbot AI */}
      <Fab color="primary" onClick={() => setChatOpen(true)} sx={{ position: 'fixed', bottom: 24, right: 24, bgcolor: '#6870fa' }}>
        <Badge badgeContent={messages.length > 1 ? messages.length - 1 : 0} color="error">
          <SmartToyIcon />
        </Badge>
      </Fab>

      <Drawer anchor="right" open={chatOpen} onClose={() => setChatOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, bgcolor: '#1e2538' } }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, bgcolor: '#151a27', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <SmartToyIcon sx={{ color: '#6870fa' }} />
              <Typography variant="h6" color="#e0e0e0" fontWeight="bold">AI Assistant</Typography>
            </Box>
            <IconButton onClick={() => setChatOpen(false)}><CloseIcon sx={{ color: '#e0e0e0' }} /></IconButton>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#0f121a' }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
                <Box sx={{ maxWidth: '80%', display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: msg.role === 'user' ? '#6870fa' : '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 18, color: '#fff' }} /> : <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />}
                  </Box>
                  <Paper elevation={2} sx={{ p: 1.5, bgcolor: msg.role === 'user' ? '#6870fa' : '#2a3142', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0', mt: 0.5, display: 'block' }}>
                      {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            ))}
            {chatLoading && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Paper elevation={2} sx={{ p: 1.5, bgcolor: '#2a3142', borderRadius: 2 }}>
                  <CircularProgress size={16} sx={{ color: '#6870fa' }} />
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          <Box sx={{ p: 2, bgcolor: '#151a27', borderTop: '1px solid #2a3142' }}>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Hỏi về dự báo, đèn, năng lượng..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={chatLoading}
                sx={{ '& .MuiOutlinedInput-root': { color: '#e0e0e0', bgcolor: '#0f121a' } }}
              />
              <IconButton onClick={sendMessage} disabled={!input.trim() || chatLoading} sx={{ bgcolor: '#6870fa', '&:hover': { bgcolor: '#5a5fd4' } }}>
                <SendIcon sx={{ color: '#fff' }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MLPrediction;