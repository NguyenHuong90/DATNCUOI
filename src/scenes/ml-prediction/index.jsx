// src/scenes/ml-prediction/index.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
import { useLightState } from '../../hooks/useLightState';
import { ColorModeContext } from '../../theme';

const MLPrediction = () => {
  const { lightStates, lightHistory } = useLightState();
  const { mode } = useContext(ColorModeContext);
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const modelRef = useRef(null); // Lưu model để dispose an toàn

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
        labels.push(hist.details.energyConsumed || 0);
      }
    });

    if (features.length === 0) {
      setErrorMsg('Không có dữ liệu lịch sử để huấn luyện mô hình. Vui lòng kiểm tra log hoạt động trong mục History.');
      return null;
    }

    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels, [labels.length, 1]),
    };
  };

  // Train model - FIX TRIỆT ĐỂ LỖI DISPOSE
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
        // Dispose model cũ nếu tồn tại
        if (modelRef.current) {
          modelRef.current.dispose();
          console.log("Old model disposed safely");
          modelRef.current = null;
        }

        const mlModel = tf.sequential();
        mlModel.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [4] }));
        mlModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        mlModel.add(tf.layers.dense({ units: 1 }));

        mlModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        await mlModel.fit(data.features, data.labels, { epochs: 60, shuffle: true, verbose: 0 });

        data.features.dispose();
        data.labels.dispose();

        if (isMounted) {
          modelRef.current = mlModel;
          setModel(mlModel);
          tfvis.show.modelSummary({ name: 'ML Model Summary' }, mlModel);
        }
      } catch (err) {
        console.error('Error training model:', err);
        if (isMounted) setErrorMsg('Đã xảy ra lỗi khi huấn luyện mô hình.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    trainModel();

    // Cleanup khi unmount
    return () => {
      isMounted = false;
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
        console.log("Model disposed on unmount");
      }
    };
  }, [lightHistory]); // Retrain khi có log mới

  // Dự đoán
  const predictEnergy = async (lamp) => {
    if (!modelRef.current) return null;
    const input = tf.tensor2d([[lamp.lamp_dim || 0, lamp.lux || 0, lamp.current_a || 0, 1]]);
    const predTensor = modelRef.current.predict(input);
    const pred = await predTensor.data();
    predTensor.dispose();
    input.dispose();
    return pred[0];
  };

  // Cập nhật dự đoán khi model hoặc lightStates thay đổi
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

  const getSuggestion = (value) => {
    if (value === null || value === undefined) return { text: 'Đang tính...', color: 'default' };
    return value > 20
      ? { text: 'Tiêu thụ cao - Giảm độ sáng để tối ưu', color: 'error' }
      : { text: 'Tiêu thụ ổn định - Có thể duy trì', color: 'success' };
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#0f121a', minHeight: '100vh' }}>
      <Card elevation={4} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#1e2538' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <AutoGraphIcon sx={{ fontSize: 36, color: '#6870fa', mr: 1.5 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" color="#e0e0e0">
                ML Prediction - Dự Đoán Tiêu Thụ Năng Lượng
              </Typography>
              <Typography variant="subtitle2" color="#b0b0b0">
                Phân tích và dự báo dựa trên dữ liệu lịch sử hoạt động đèn đường thông minh
              </Typography>
            </Box>
          </Box>

          {errorMsg && (
            <Alert severity="warning" icon={<AutoGraphIcon />} sx={{ mb: 3, borderRadius: 1.5, bgcolor: '#3e2a00', color: '#ffecb3', '& .MuiAlert-icon': { color: '#ffecb3' } }}>
              {errorMsg}
            </Alert>
          )}

          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="contained"
              startIcon={<AutoGraphIcon />}
              onClick={() => tfvis.visor().toggle()}
              disabled={loading}
              sx={{ bgcolor: '#6870fa', '&:hover': { bgcolor: '#5a5fd4' }, borderRadius: 1.5, px: 3, py: 1, fontWeight: 'bold' }}
            >
              Xem Biểu Đồ Mô Hình
            </Button>
            {loading && <CircularProgress size={24} sx={{ alignSelf: 'center', color: '#6870fa' }} />}
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 1.5, overflow: 'hidden', bgcolor: '#151a27' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead sx={{ bgcolor: '#1e2538' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.875rem' }}>Node ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.875rem' }}>Trạng Thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.875rem' }}>Độ Sáng (%)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.875rem' }}>Lux</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.875rem' }}>Current (A)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.875rem' }}>Dự Đoán (kWh/giờ)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '0.875rem' }}>Gợi Ý Tối Ưu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(lightStates || {}).map(([nodeId, lamp]) => {
                  const suggestion = getSuggestion(predictions[nodeId]);
                  return (
                    <TableRow key={nodeId} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#1a2033' }, '&:hover': { bgcolor: '#2a3142' } }}>
                      <TableCell sx={{ fontWeight: 'medium', color: '#6870fa', fontSize: '0.875rem' }}>{nodeId}</TableCell>
                      <TableCell>
                        <Chip label={lamp.lamp_state} size="small" color={lamp.lamp_state === 'ON' ? 'success' : 'error'} sx={{ fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#e0e0e0', fontSize: '0.875rem' }}>{lamp.lamp_dim}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0', fontSize: '0.875rem' }}>{lamp.lux}</TableCell>
                      <TableCell sx={{ color: '#e0e0e0', fontSize: '0.875rem' }}>{lamp.current_a.toFixed(4)}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: '#e0e0e0', fontSize: '0.875rem' }}>
                        {predictions[nodeId] !== null && predictions[nodeId] !== undefined ? predictions[nodeId].toFixed(2) : 'Đang tính...'}
                      </TableCell>
                      <TableCell>
                        <Chip label={suggestion.text} color={suggestion.color} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MLPrediction;