import React, { useEffect, useState, useRef } from 'react';
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
  Divider,
  Fab,
  Drawer,
  Badge,
  TextField,
  IconButton,
  Paper,
} from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import * as tf from '@tensorflow/tfjs';
import { useLightState } from '../../hooks/useLightState';

const MLPrediction = () => {
  const { lightStates, lightHistory } = useLightState();

  const [predictions, setPredictions] = useState({});
  const [estimatedCostPerHour, setEstimatedCostPerHour] = useState(0);
  const [estimatedCostPerDay, setEstimatedCostPerDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const modelRef = useRef(null);
  const hasInitialTrain = useRef(false);

  const ELECTRICITY_PRICE = 2000;

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Tính chi phí điện
  useEffect(() => {
    const totalPrediction = Object.values(predictions).reduce((sum, val) => sum + (val || 0), 0);
    const costPerHour = Math.round(totalPrediction * ELECTRICITY_PRICE);
    const costPerDay = Math.round(costPerHour * 24);

    setEstimatedCostPerHour(costPerHour);
    setEstimatedCostPerDay(costPerDay);
  }, [predictions]);

  // Dữ liệu giả tối ưu cho bóng ~13W
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

      features.push([lampDim / 100.0, currentA, hoursOn]);
      labels.push(Math.max(0, parseFloat(energyConsumed) || 0));
    });

    const syntheticSamples = [
      { dim: 100, powerW: 13, hours: 1, energy: 0.013 },
      { dim: 100, powerW: 12, hours: 1, energy: 0.012 },
      { dim: 100, powerW: 14, hours: 1, energy: 0.014 },
      { dim: 80,  powerW: 13, hours: 1, energy: 0.0104 },
      { dim: 60,  powerW: 13, hours: 1, energy: 0.0078 },
      { dim: 40,  powerW: 13, hours: 1, energy: 0.0052 },
      { dim: 20,  powerW: 13, hours: 1, energy: 0.0026 },
      { dim: 100, powerW: 10, hours: 2, energy: 0.020 },
      { dim: 100, powerW: 15, hours: 0.5, energy: 0.0075 },
      { dim: 70,  powerW: 11, hours: 3, energy: 0.0231 },
      { dim: 50,  powerW: 14, hours: 2, energy: 0.014 },
      { dim: 90,  powerW: 12, hours: 1.5, energy: 0.0162 },
      { dim: 30,  powerW: 13, hours: 4, energy: 0.0156 },
      { dim: 100, powerW: 13, hours: 2, energy: 0.026 },
      { dim: 75,  powerW: 13, hours: 3, energy: 0.02925 },
    ];

    syntheticSamples.forEach(s => {
      const currentA = s.powerW / 220;
      features.push([s.dim / 100.0, currentA, s.hours]);
      labels.push(s.energy);
    });

    for (let i = 0; i < 30; i++) {
      features.push([0, 0, 0.5 + Math.random() * 8]);
      labels.push(0);
    }

    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels, [labels.length, 1]),
    };
  };

  // Train AI chỉ 1 lần
  useEffect(() => {
    let isMounted = true;

    const trainModel = async () => {
      if (!isMounted || hasInitialTrain.current) return;

      setLoading(true);

      const data = prepareData();

      try {
        if (modelRef.current) {
          modelRef.current.dispose();
          modelRef.current = null;
        }

        const mlModel = tf.sequential();
        mlModel.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [3] }));
        mlModel.add(tf.layers.dropout({ rate: 0.3 }));
        mlModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        mlModel.add(tf.layers.dense({ units: 1, activation: 'linear' }));

        mlModel.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });

        await mlModel.fit(data.features, data.labels, { epochs: 120, batchSize: 8, shuffle: true, verbose: 0 });

        data.features.dispose();
        data.labels.dispose();

        if (isMounted) {
          modelRef.current = mlModel;
          hasInitialTrain.current = true;
        }
      } catch (err) {
        console.error('Lỗi huấn luyện:', err);
        if (isMounted) setErrorMsg('AI đang học. Sẽ chính xác hơn khi có dữ liệu thực tế.');
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
  }, []);

  const predictHourlyConsumption = async (lamp) => {
    if (!modelRef.current || lamp.lamp_state === 'OFF') return 0;

    try {
      const input = tf.tensor2d([[(lamp.lamp_dim || 0) / 100.0, lamp.current_a || 0, 1.0]]);
      const predTensor = modelRef.current.predict(input);
      const pred = await predTensor.data();
      input.dispose();
      predTensor.dispose();
      return Math.max(0, pred[0]);
    } catch (err) {
      return 0;
    }
  };

  useEffect(() => {
    if (!modelRef.current || Object.keys(lightStates).length === 0) {
      setPredictions({});
      return;
    }

    const update = async () => {
      const preds = {};
      for (const [nodeId, lamp] of Object.entries(lightStates)) {
        preds[nodeId] = await predictHourlyConsumption(lamp);
      }
      setPredictions(preds);
    };

    update();
  }, [modelRef.current, lightStates]);

  const getTotalPrediction = () => Object.values(predictions).reduce((sum, v) => sum + (v || 0), 0).toFixed(3);

  const getLampContext = () => {
    const onCount = Object.values(lightStates).filter(l => l.lamp_state === 'ON').length;
    const totalCount = Object.keys(lightStates).length;

    return {
      total: totalCount,
      on: onCount,
      isAllOff: onCount === 0,
      lamps: Object.entries(lightStates).map(([nodeId, l]) => ({
        id: nodeId,
        state: l.lamp_state,
        brightness: l.lamp_dim || 0,
        prediction: predictions[nodeId] !== undefined ? predictions[nodeId].toFixed(3) : '0.000',
        costPerHour: predictions[nodeId] !== undefined ? Math.round(predictions[nodeId] * ELECTRICITY_PRICE) : 0,
      })),
      totalPrediction: getTotalPrediction(),
      costPerHour: estimatedCostPerHour,
      costPerDay: estimatedCostPerDay,
    };
  };

  // Chatbot siêu thông minh, ngắn gọn, thân thiện
  const generateSmartResponse = (question, context) => {
    const q = question.toLowerCase().trim();

    // Tiền điện
    if (q.match(/tiền|chi phí|điện|bao nhiêu tiền|tốn/i)) {
      if (context.isAllOff) {
        return `🎉 Tuyệt vời! Tất cả đèn đang tắt → **0 VNĐ/giờ**`;
      }
      return `💡 Chi phí hiện tại:\n• **${context.costPerHour.toLocaleString()} VNĐ/giờ**\n• Nếu chạy cả ngày: **${context.costPerDay.toLocaleString()} VNĐ**`;
    }

    // Số đèn bật
    if (q.includes('đèn') && q.includes('bao nhiêu')) {
      if (context.isAllOff) return `Hiện tại **không có đèn nào bật** 😊`;
      return `🔆 Có **${context.on}/${context.total}** đèn đang bật`;
    }

    // Gợi ý tiết kiệm
    if (q.match(/tiết kiệm|gợi ý|giảm/i)) {
      const high = context.lamps.filter(l => parseFloat(l.prediction) > 0.012 && l.state === 'ON');
      if (high.length === 0) return `👍 Hệ thống đang rất tiết kiệm rồi!`;
      return `💰 Gợi ý tiết kiệm:\n${high.map(l => `• Đèn ${l.id}: giảm xuống 70% → tiết kiệm ~${Math.round(l.costPerHour * 0.3).toLocaleString()} VNĐ/giờ`).join('\n')}`;
    }

    // Thông tin đèn cụ thể
    if (q.match(/đèn\s*\d+/i)) {
      const id = q.match(/\d+/)[0];
      const lamp = context.lamps.find(l => l.id === id);
      if (!lamp) return `Không tìm thấy Đèn ${id}`;
      if (lamp.state === 'OFF') return `Đèn ${id} đang tắt → 0 VNĐ`;
      return `💡 Đèn ${id}:\n• Độ sáng: ${lamp.brightness}%\n• Dự báo: ${lamp.prediction} kWh/h\n• Tiền/giờ: **${lamp.costPerHour.toLocaleString()} VNĐ**`;
    }

    // Mặc định
    return `Chào bạn! Tôi giúp bạn tiết kiệm điện 💰\n\nHỏi tôi:\n• "Tiền điện hiện tại?"\n• "Có bao nhiêu đèn bật?"\n• "Gợi ý tiết kiệm"\n• "Đèn 1 tốn bao nhiêu?"`;
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    const context = getLampContext();
    const response = generateSmartResponse(input, context);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
      setChatLoading(false);
    }, 300); // Giả lập thời gian suy nghĩ
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Xin chào! 👋\nTôi là AI giúp bạn tiết kiệm tiền điện.\n\nHỏi tôi về chi phí, số đèn bật, hoặc gợi ý tiết kiệm nhé!',
        timestamp: new Date()
      }]);
    }
  }, [chatOpen]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, bgcolor: '#0f121a', minHeight: '100vh' }}>
      {/* Header nhỏ gọn hơn */}
      <Card elevation={4} sx={{ borderRadius: 2, bgcolor: '#1e2538', mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, py: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <AutoGraphIcon sx={{ fontSize: 32, color: '#6870fa' }} />
              <Box>
                <Typography variant="h6" fontWeight="bold" color="#e0e0e0">
                  AI Tiết Kiệm Điện
                </Typography>
                <Typography variant="caption" color="#b0b0b0">
                  Dự báo chính xác • Tiết kiệm tiền điện
                </Typography>
              </Box>
            </Box>
            {loading && <CircularProgress size={18} sx={{ color: '#6870fa' }} />}
          </Box>
        </CardContent>
      </Card>

      {/* Tổng quan - thu nhỏ, gọn gàng */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#1e2538', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <AttachMoneyIcon sx={{ fontSize: 28, color: '#4caf50', mb: 0.5 }} />
              <Typography variant="caption" color="#b0b0b0" display="block">Chi phí / giờ</Typography>
              <Typography variant="h6" fontWeight="bold" color="#4caf50">
                {estimatedCostPerHour.toLocaleString()}đ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#1e2538', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <AutoGraphIcon sx={{ fontSize: 28, color: '#6870fa', mb: 0.5 }} />
              <Typography variant="caption" color="#b0b0b0" display="block">Dự báo AI</Typography>
              <Typography variant="h6" fontWeight="bold" color="#e0e0e0">
                {getTotalPrediction()} kWh/h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#1e2538', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <LightbulbIcon sx={{ fontSize: 28, color: '#ffc107', mb: 0.5 }} />
              <Typography variant="caption" color="#b0b0b0" display="block">Đèn bật</Typography>
              <Typography variant="h6" fontWeight="bold" color="#ffc107">
                {Object.values(lightStates).filter(l => l.lamp_state === 'ON').length}/{Object.keys(lightStates).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Danh sách đèn - thu nhỏ, gọn hơn */}
      <Grid container spacing={1.5}>
        {Object.entries(lightStates || {}).map(([nodeId, lamp]) => {
          const prediction = predictions[nodeId];
          const isOn = lamp.lamp_state === 'ON';
          const costPerHour = prediction !== undefined ? Math.round(prediction * ELECTRICITY_PRICE) : 0;

          return (
            <Grid item xs={6} sm={4} md={3} key={nodeId}>
              <Card sx={{
                bgcolor: '#1e2538',
                borderRadius: 2,
                border: `2px solid ${isOn ? '#4caf50' : '#424242'}`,
                height: '100%',
              }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold" color="#e0e0e0">
                      Đèn {nodeId}
                    </Typography>
                    <Chip label={isOn ? 'BẬT' : 'TẮT'} size="small" sx={{ 
                      bgcolor: isOn ? '#4caf50' : '#666', 
                      color: '#fff',
                      fontSize: '0.7rem',
                      height: 20
                    }} />
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={lamp.lamp_dim} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 1, 
                      mb: 1,
                      bgcolor: '#151a27',
                      '& .MuiLinearProgress-bar': { bgcolor: isOn ? '#4caf50' : '#666' }
                    }} 
                  />
                  <Typography variant="caption" color="#b0b0b0" display="block" mb={1}>
                    {lamp.lamp_dim}%
                  </Typography>

                  <Box sx={{ bgcolor: '#151a27', borderRadius: 1.5, p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="#b0b0b0" display="block">
                      Dự báo
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="#6870fa">
                      {prediction !== undefined ? `${prediction.toFixed(3)} kWh/h` : '--'}
                    </Typography>
                    <Typography variant="body2" color="#4caf50" fontWeight="bold">
                      {costPerHour.toLocaleString()}đ/giờ
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Chatbot */}
      <Fab color="primary" onClick={() => setChatOpen(true)} sx={{ position: 'fixed', bottom: 16, right: 16, bgcolor: '#6870fa' }}>
        <Badge badgeContent={messages.length > 1 ? messages.length - 1 : 0} color="error">
          <SmartToyIcon />
        </Badge>
      </Fab>

      <Drawer anchor="right" open={chatOpen} onClose={() => setChatOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 380 }, bgcolor: '#1e2538' } }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, bgcolor: '#151a27', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <SmartToyIcon sx={{ color: '#6870fa' }} />
              <Typography variant="h6" color="#e0e0e0" fontWeight="bold">AI Tiết Kiệm Điện</Typography>
            </Box>
            <IconButton onClick={() => setChatOpen(false)}><CloseIcon sx={{ color: '#e0e0e0' }} /></IconButton>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#0f121a' }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
                <Box sx={{ maxWidth: '85%', display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: msg.role === 'user' ? '#6870fa' : '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 18, color: '#fff' }} /> : <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />}
                  </Box>
                  <Paper elevation={2} sx={{ p: 1.5, bgcolor: msg.role === 'user' ? '#6870fa' : '#2a3142', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
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
                  <Typography variant="body2" color="#e0e0e0">Đang suy nghĩ...</Typography>
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
                placeholder="Hỏi về tiền điện, tiết kiệm..."
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