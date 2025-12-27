// src/scenes/ml-prediction/index.jsx
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
  TextField,
  IconButton,
  Paper,
  Divider,
  Fab,
  Drawer,
  Badge,
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
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import * as tf from '@tensorflow/tfjs';
import { useLightState } from '../../hooks/useLightState';
import { ColorModeContext } from '../../theme';

const MLPrediction = () => {
  const { lightStates, lightHistory } = useLightState();
  const { mode } = useContext(ColorModeContext);
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState({});
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
  const prepareData = () => {
    const features = [];
    const labels = [];
    (lightHistory || []).forEach(hist => {
      if (hist?.details) {
        const startTime = new Date(hist.details.startTime);
        const endTime = new Date(hist.details.endTime || new Date());
        const hoursOn = isNaN(endTime - startTime) ? 1 : (endTime - startTime) / (1000 * 60 * 60);
        features.push([
          hist.details.lampDim || 0,
          hist.details.lux || 0,
          hist.details.currentA || 0,
          hoursOn,
        ]);
        labels.push(Math.max(0, hist.details.energyConsumed || 0));
      }
    });
    // Add fake data for OFF state
    for (let i = 0; i < 8; i++) {
      features.push([
        0,
        Math.random() * 15,
        0,
        1 + Math.random() * 2,
      ]);
      labels.push(0);
    }
    if (features.length === 0) {
      setErrorMsg('Không có dữ liệu lịch sử để huấn luyện mô hình. Vui lòng kiểm tra log hoạt động trong mục History.');
      return null;
    }
    console.log(`Training on ${features.length} samples`);
    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels, [labels.length, 1]),
    };
  };
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
        if (modelRef.current) {
          modelRef.current.dispose();
          modelRef.current = null;
        }
        const mlModel = tf.sequential();
        mlModel.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [4] }));
        mlModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        mlModel.add(tf.layers.dense({ units: 1, activation: 'relu' }));
        mlModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        await mlModel.fit(data.features, data.labels, { epochs: 120, shuffle: true, verbose: 0 });
        data.features.dispose();
        data.labels.dispose();
        if (isMounted) {
          modelRef.current = mlModel;
          setModel(mlModel);
        }
      } catch (err) {
        console.error('Error training model:', err);
        if (isMounted) setErrorMsg('Đã xảy ra lỗi khi huấn luyện mô hình.');
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
  const predictEnergy = async (lamp) => {
    if (!modelRef.current) return null;
    if (lamp.lamp_state === 'OFF') return 0;
    const input = tf.tensor2d([[lamp.lamp_dim || 0, lamp.lux || 0, lamp.current_a || 0, 1]]);
    const predTensor = modelRef.current.predict(input);
    const pred = await predTensor.data();
    predTensor.dispose();
    input.dispose();
    return Math.max(0, pred[0]);
  };
  useEffect(() => {
    if (!modelRef.current || !lightStates || Object.keys(lightStates).length === 0) return;
    const updatePredictions = async () => {
      const preds = {};
      for (const [nodeId, lamp] of Object.entries(lightStates)) {
        const value = await predictEnergy(lamp);
        preds[nodeId] = value;
      }
      setPredictions(preds);
    };
    updatePredictions();
  }, [modelRef.current, lightStates]);
  // Calculate accumulated energy
  const calculateAccumulatedEnergy = () => {
    const accum = {};
    (lightHistory || []).forEach(hist => {
      if (hist?.details?.nodeId && hist.details.energyConsumed !== undefined) {
        const nodeId = hist.details.nodeId;
        const energy = Math.max(0, parseFloat(hist.details.energyConsumed) || 0);
        if (!accum[nodeId]) accum[nodeId] = 0;
        accum[nodeId] += energy;
      }
    });
    Object.keys(accum).forEach(key => {
      accum[key] = accum[key].toFixed(2);
    });
    setAccumulatedEnergy(accum);
  };
  useEffect(() => {
    calculateAccumulatedEnergy();
  }, [lightHistory]);
  const getSuggestion = (value) => {
    if (value === null || value === undefined) return {
      text: 'Đang tính...',
      color: 'default',
      icon: <AutoGraphIcon />
    };
    if (value === 0) return {
      text: 'Đèn tắt - Không tiêu thụ',
      color: 'success',
      icon: <TrendingDownIcon />
    };
    if (value > 20) return {
      text: 'Tiêu thụ cao - Giảm độ sáng',
      color: 'error',
      icon: <TrendingUpIcon />
    };
    if (value < 5) return {
      text: 'Tiêu thụ thấp - Hiệu quả',
      color: 'success',
      icon: <TrendingDownIcon />
    };
    return {
      text: 'Tiêu thụ ổn định',
      color: 'info',
      icon: <AutoGraphIcon />
    };
  };
  const getTotalPrediction = () => {
    const total = Object.values(predictions).reduce((sum, val) => sum + (val || 0), 0);
    return total.toFixed(2);
  };
  const getAveragePrediction = () => {
    const values = Object.values(predictions).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return '0.00';
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return avg.toFixed(2);
  };
  const getLampContext = () => {
    const onLamps = Object.values(lightStates).filter(l => l.lamp_state === 'ON');
    const offLamps = Object.values(lightStates).filter(l => l.lamp_state === 'OFF');
    return {
      total: Object.keys(lightStates).length,
      on: onLamps.length,
      off: offLamps.length,
      lamps: Object.values(lightStates).map(l => ({
        id: l.node_id,
        state: l.lamp_state,
        brightness: l.lamp_dim,
        prediction: predictions[l.node_id] ? predictions[l.node_id].toFixed(2) : 'N/A'
      })),
      totalPrediction: getTotalPrediction(),
      avgPrediction: getAveragePrediction()
    };
  };
  const generateSmartResponse = (question, context) => {
    const q = question.toLowerCase();
    if (q.includes('bao nhiêu') && (q.includes('đèn') || q.includes('bật'))) {
      return `🔆 Hiện tại có ${context.on}/${context.total} đèn đang bật.\n\n${context.lamps.filter(l => l.state === 'ON').map(l => `• Đèn ${l.id}: ${l.brightness}% (${l.prediction} kWh/h)`).join('\n')}`;
    }
    if (q.includes('tắt')) {
      return `💤 Hiện tại có ${context.off}/${context.total} đèn đang tắt.\n\n${context.lamps.filter(l => l.state === 'OFF').map(l => `• Đèn ${l.id}`).join('\n')}`;
    }
    if (q.includes('tiêu thụ') || q.includes('năng lượng') || q.includes('điện')) {
      const maxLamp = context.lamps.reduce((max, l) =>
        parseFloat(l.prediction) > parseFloat(max.prediction) ? l : max
      );
      return `⚡ Tổng quan tiêu thụ năng lượng:\n\n• Tổng: ${context.totalPrediction} kWh/h\n• Trung bình: ${context.avgPrediction} kWh/h\n• Đèn tiêu thụ cao nhất: Đèn ${maxLamp.id} (${maxLamp.prediction} kWh/h)\n\n💡 Gợi ý: ${parseFloat(maxLamp.prediction) > 15 ? 'Nên giảm độ sáng đèn ' + maxLamp.id + ' để tiết kiệm năng lượng.' : 'Hệ thống đang hoạt động hiệu quả.'}`;
    }
    if (q.includes('đèn') && /\d+/.test(q)) {
      const lampId = q.match(/\d+/)[0];
      const lamp = context.lamps.find(l => l.id === lampId);
      if (lamp) {
        return `💡 Đèn ${lampId}:\n\n• Trạng thái: ${lamp.state}\n• Độ sáng: ${lamp.brightness}%\n• Dự đoán tiêu thụ: ${lamp.prediction} kWh/h\n\n${lamp.state === 'ON' && parseFloat(lamp.prediction) > 15 ? '⚠️ Đang tiêu thụ cao, nên giảm độ sáng.' : '✅ Hoạt động bình thường.'}`;
      }
      return `❌ Không tìm thấy đèn ${lampId}.`;
    }
    if (q.includes('tối ưu') || q.includes('tiết kiệm') || q.includes('giảm')) {
      const highConsumption = context.lamps.filter(l => parseFloat(l.prediction) > 15 && l.state === 'ON');
      if (highConsumption.length > 0) {
        return `💡 Gợi ý tối ưu:\n\n${highConsumption.map(l => `• Đèn ${l.id}: Giảm từ ${l.brightness}% xuống ${Math.max(50, l.brightness - 20)}% để tiết kiệm ~${((parseFloat(l.prediction) * 0.2).toFixed(2))} kWh/h`).join('\n')}\n\n📊 Tiết kiệm ước tính: ${(highConsumption.reduce((sum, l) => sum + parseFloat(l.prediction) * 0.2, 0)).toFixed(2)} kWh/h`;
      }
      return `✅ Hệ thống đang hoạt động tối ưu! Không cần điều chỉnh.`;
    }
    if (q.includes('cao nhất') || q.includes('nhiều nhất')) {
      const maxLamp = context.lamps.reduce((max, l) =>
        parseFloat(l.prediction) > parseFloat(max.prediction) ? l : max
      );
      return `🔥 Đèn tiêu thụ nhiều nhất:\n\nĐèn ${maxLamp.id}\n• Độ sáng: ${maxLamp.brightness}%\n• Tiêu thụ: ${maxLamp.prediction} kWh/h\n\n${parseFloat(maxLamp.prediction) > 15 ? '💡 Gợi ý: Giảm độ sáng xuống 60-70% để tiết kiệm năng lượng.' : '✅ Mức tiêu thụ trong giới hạn hợp lý.'}`;
    }
    if (q.includes('thấp nhất') || q.includes('ít nhất')) {
      const minLamp = context.lamps.filter(l => l.state === 'ON').reduce((min, l) =>
        parseFloat(l.prediction) < parseFloat(min.prediction) ? l : min
      );
      return `🌟 Đèn tiêu thụ ít nhất:\n\nĐèn ${minLamp.id}\n• Độ sáng: ${minLamp.brightness}%\n• Tiêu thụ: ${minLamp.prediction} kWh/h\n\n✅ Đèn này đang hoạt động hiệu quả!`;
    }
    return `👋 Xin chào! Tôi có thể giúp bạn:\n\n• Kiểm tra trạng thái đèn\n• Phân tích tiêu thụ năng lượng\n• Đưa ra gợi ý tối ưu\n\n💬 Hãy thử hỏi:\n- "Có bao nhiêu đèn đang bật?"\n- "Đèn nào tiêu thụ nhiều nhất?"\n- "Gợi ý tối ưu năng lượng"`;
  };
  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setChatLoading(true);
    try {
      const context = getLampContext();
      const smartResponse = generateSmartResponse(input, context);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: smartResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date()
      }]);
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
        content: '👋 Xin chào! Tôi là trợ lý AI quản lý đèn thông minh.\n\n💬 Bạn có thể hỏi tôi:\n• "Có bao nhiêu đèn đang bật?"\n• "Đèn nào tiêu thụ điện nhiều nhất?"\n• "Gợi ý tối ưu năng lượng"\n• "Trạng thái đèn 3"',
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
                  ML Prediction - Dự Đoán Năng Lượng
                </Typography>
                <Typography variant="subtitle2" color="#b0b0b0">
                  Phân tích và dự báo tiêu thụ điện năng dựa trên AI
                </Typography>
              </Box>
            </Box>
            {loading && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: '#6870fa' }} />
                <Typography variant="body2" color="#b0b0b0">Training...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
      {errorMsg && (
        <Alert severity="warning" icon={<AutoGraphIcon />} sx={{ mb: 2, borderRadius: 1.5, bgcolor: '#3e2a00', color: '#ffecb3', '& .MuiAlert-icon': { color: '#ffecb3' } }}>
          {errorMsg}
        </Alert>
      )}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1e2538', borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BoltIcon sx={{ color: '#ffc107' }} />
                <Typography variant="subtitle2" color="#b0b0b0">Tổng Dự Đoán</Typography>
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
                <Typography variant="subtitle2" color="#b0b0b0">Đèn Hoạt Động</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="#e0e0e0">
                {Object.values(lightStates).filter(l => l.lamp_state === 'ON').length}/{Object.keys(lightStates).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {Object.entries(lightStates || {}).map(([nodeId, lamp]) => {
          const prediction = predictions[nodeId];
          const suggestion = getSuggestion(prediction);
          const isOn = lamp.lamp_state === 'ON';
          const totalConsumed = accumulatedEnergy[nodeId] || '0.00';
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={nodeId}>
              <Card
                sx={{
                  bgcolor: '#1e2538',
                  borderRadius: 2,
                  border: `2px solid ${isOn ? '#4caf50' : '#424242'}`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(104, 112, 250, 0.3)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LightbulbIcon sx={{ color: isOn ? '#4caf50' : '#666', fontSize: 28 }} />
                      <Typography variant="h6" fontWeight="bold" color="#e0e0e0">
                        Đèn {nodeId}
                      </Typography>
                    </Box>
                    <Chip
                      label={isOn ? 'BẬT' : 'TẮT'}
                      size="small"
                      sx={{
                        bgcolor: isOn ? '#4caf50' : '#666',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="#b0b0b0">Độ sáng</Typography>
                      <Typography variant="caption" fontWeight="bold" color="#e0e0e0">
                        {lamp.lamp_dim}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={lamp.lamp_dim}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: '#151a27',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: isOn ? '#4caf50' : '#666',
                          borderRadius: 1
                        }
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      bgcolor: '#151a27',
                      borderRadius: 1.5,
                      p: 2,
                      mb: 1.5
                    }}
                  >
                    <Typography variant="caption" color="#b0b0b0" display="block" mb={0.5}>
                      Dự đoán tiêu thụ
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#6870fa">
                      {prediction !== null && prediction !== undefined
                        ? `${prediction.toFixed(2)} kWh/h`
                        : 'Đang tính...'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: '#151a27',
                      borderRadius: 1.5,
                      p: 2,
                      mb: 1.5
                    }}
                  >
                    <Typography variant="caption" color="#b0b0b0" display="block" mb={0.5}>
                      Tổng tiêu thụ cộng dồn
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="#9c27b0">
                      {totalConsumed} kWh
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {suggestion.icon}
                    <Chip
                      label={suggestion.text}
                      color={suggestion.color}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        flex: 1
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setChatOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#6870fa',
          '&:hover': { bgcolor: '#5a5fd4' }
        }}
      >
        <Badge badgeContent={messages.length > 1 ? messages.length - 1 : 0} color="error">
          <SmartToyIcon />
        </Badge>
      </Fab>
      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            bgcolor: '#1e2538',
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, bgcolor: '#151a27', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <SmartToyIcon sx={{ color: '#6870fa' }} />
              <Typography variant="h6" color="#e0e0e0" fontWeight="bold">
                AI Assistant
              </Typography>
            </Box>
            <IconButton onClick={() => setChatOpen(false)} size="small">
              <CloseIcon sx={{ color: '#e0e0e0' }} />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#0f121a' }}>
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    maxWidth: '80%',
                    display: 'flex',
                    gap: 1,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: msg.role === 'user' ? '#6870fa' : '#4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {msg.role === 'user' ? (
                      <PersonIcon sx={{ fontSize: 18, color: '#fff' }} />
                    ) : (
                      <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />
                    )}
                  </Box>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1.5,
                      bgcolor: msg.role === 'user' ? '#6870fa' : '#2a3142',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#e0e0e0',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.content}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0', mt: 0.5, display: 'block' }}>
                      {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            ))}
           
            {chatLoading && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 18, color: '#fff' }} />
                </Box>
                <Paper elevation={2} sx={{ p: 1.5, bgcolor: '#2a3142', borderRadius: 2 }}>
                  <Box display="flex" gap={0.5}>
                    <CircularProgress size={8} sx={{ color: '#6870fa' }} />
                  </Box>
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
                placeholder="Hỏi về đèn, năng lượng..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={chatLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#e0e0e0',
                    bgcolor: '#0f121a',
                    '& fieldset': { borderColor: '#2a3142' },
                    '&:hover fieldset': { borderColor: '#6870fa' },
                    '&.Mui-focused fieldset': { borderColor: '#6870fa' }
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={sendMessage}
                disabled={!input.trim() || chatLoading}
                sx={{
                  bgcolor: '#6870fa',
                  '&:hover': { bgcolor: '#5a5fd4' },
                  '&.Mui-disabled': { bgcolor: '#424242' }
                }}
              >
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