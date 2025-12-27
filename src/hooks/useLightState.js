// Frontend: hooks/useLightState.js (giữ nguyên, chỉ thêm comment)
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';

// Tự động chọn ws hoặc wss tùy môi trường
const getMqttUrl = () => {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://broker.hivemq.com:8000/mqtt`;
};

const mqttClient = mqtt.connect(getMqttUrl(), {
  reconnectPeriod: 2000,
  connectTimeout: 10000,
  keepalive: 60,
});

mqttClient.on('connect', () => {
  console.log('MQTT Connected via', getMqttUrl());
});

mqttClient.on('error', (err) => console.error('MQTT Error:', err));
mqttClient.on('offline', () => console.log('MQTT Offline'));
mqttClient.on('reconnect', () => console.log('MQTT Reconnecting...'));

const LightStateContext = createContext();

export function LightStateProvider({ children }) {
  const [lightStates, setLightStates] = useState({});
  const [lightHistory, setLightHistory] = useState([]);
  const [currentEvents, setCurrentEvents] = useState([]);

  // Linh hoạt URL backend
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const updateLightState = useCallback(async (nodeId, updates, source = 'manual') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return console.error('No token');

      const payload = {
        gw_id: lightStates[nodeId]?.gw_id || 'gw-01',
        node_id: nodeId.toString(),
        ...updates,
      };

      // Gửi qua backend
      await axios.post(`${API_BASE}/api/lamp/control`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Gửi luôn qua MQTT
      mqttClient.publish(`lamp/control/${nodeId}`, JSON.stringify(updates), { qos: 1 });

      // Cập nhật state local
      setLightStates(prev => {
        const newState = {
          ...prev,
          [nodeId]: {
            ...prev[nodeId],
            ...updates,
            manualOverride: source === 'manual',
            lastManualAction: source === 'manual' ? new Date().toISOString() : prev[nodeId]?.lastManualAction,
          },
        };
        return JSON.stringify(newState) !== JSON.stringify(prev) ? newState : prev;
      });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        console.error('Lỗi updateLightState:', err);
      }
    }
  }, [lightStates, API_BASE]);

  const addLight = useCallback(async (lampData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await axios.post(`${API_BASE}/api/lamp/control`, lampData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const lamp = data.lamp;
      setLightStates(prev => ({
        ...prev,
        [lamp.node_id]: {
          gw_id: lamp.gw_id,
          node_id: lamp.node_id,
          lamp_state: lamp.lamp_state,
          lamp_dim: lamp.lamp_dim,
          lux: lamp.lux || 0,
          current_a: lamp.current_a || 0,
          lat: lamp.lat,
          lng: lamp.lng,
          energy_consumed: lamp.energy_consumed || 0,
          manualOverride: false,
          lastManualAction: null,
        },
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }, [API_BASE]);

  const fetchLightStates = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await axios.get(`${API_BASE}/api/lamp/state`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newStates = {};
      data.forEach(lamp => {
        newStates[lamp.node_id] = {
          gw_id: lamp.gw_id,
          node_id: lamp.node_id,
          lamp_state: lamp.lamp_state,
          lamp_dim: lamp.lamp_dim,
          lux: lamp.lux || 0,
          current_a: lamp.current_a || 0,
          lat: lamp.lat,
          lng: lamp.lng,
          energy_consumed: lamp.energy_consumed || 0,
          manualOverride: false,
          lastManualAction: null,
        };
      });

      setLightStates(prev => JSON.stringify(prev) !== JSON.stringify(newStates) ? newStates : prev);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }, [API_BASE]);

  const syncLightStatesWithSchedule = useCallback(async (now = new Date()) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];

      const { data: schedules } = await axios.get(`${API_BASE}/api/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const events = [];
      const toDelete = [];

      schedules.forEach(sch => {
        const start = new Date(sch.start);
        const end = sch.end ? new Date(sch.end) : null;
        const nodeId = sch.node_id;

        if (!lightStates[nodeId]?.manualOverride) {
          if (sch.action === 'on' && now >= start && (!end || now < end)) {
            const dim = sch.lamp_dim ?? 50;
            if (lightStates[nodeId]?.lamp_state !== 'ON') {
              updateLightState(nodeId, { lamp_state: 'ON', lamp_dim: dim }, 'schedule');
            }
          } else if ((sch.action === 'off' && now >= start) || (sch.action === 'on' && end && now >= end)) {
            if (lightStates[nodeId]?.lamp_state !== 'OFF') {
              updateLightState(nodeId, { lamp_state: 'OFF', lamp_dim: 0 }, 'schedule');
            }
            toDelete.push(sch._id);
          }
        }

        if (!(sch.action === 'off' && now >= start) && !(sch.action === 'on' && end && now >= end)) {
          events.push({
            id: sch._id,
            title: `${sch.node_id} - ${sch.action === 'on' ? `Bật ${sch.lamp_dim ?? 50}%` : 'Tắt'}`,
            start: new Date(sch.start),
            end: end ? new Date(end) : null,
            allDay: false,
            extendedProps: { lightId: sch.node_id, action: sch.action, lamp_dim: sch.lamp_dim },
          });
        }
      });

      for (const id of toDelete) {
        await axios.delete(`${API_BASE}/api/schedule/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setCurrentEvents(prev => JSON.stringify(prev) !== JSON.stringify(events) ? events : prev);
      return events;
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      console.error('Lỗi sync schedule:', err);
      return [];
    }
  }, [lightStates, updateLightState, API_BASE]);

  const addSchedule = useCallback(async (schedule) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.post(`${API_BASE}/api/schedule`, schedule, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await syncLightStatesWithSchedule();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }, [API_BASE, syncLightStatesWithSchedule]);

  const deleteSchedule = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.delete(`${API_BASE}/api/schedule/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await syncLightStatesWithSchedule();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }, [API_BASE, syncLightStatesWithSchedule]);

  // Subscribe MQTT
  useEffect(() => {
    Object.keys(lightStates).forEach(nodeId => {
      mqttClient.subscribe(`lamp/state/${nodeId}`, { qos: 1 });
    });
    return () => {
      Object.keys(lightStates).forEach(nodeId => {
        mqttClient.unsubscribe(`lamp/state/${nodeId}`);
      });
    };
  }, [lightStates]);

  // Nhận dữ liệu MQTT
  useEffect(() => {
    const handler = (topic, message) => {
      try {
        const nodeId = topic.split('/')[2];
        if (!nodeId || !lightStates[nodeId]) return;
        const data = JSON.parse(message.toString());
        setLightStates(prev => ({
          ...prev,
          [nodeId]: { ...prev[nodeId], ...data }
        }));
      } catch (err) {
        console.error('MQTT parse error:', err);
      }
    };
    mqttClient.on('message', handler);
    return () => mqttClient.off('message', handler);
  }, [lightStates]);

  // Khởi động
  useEffect(() => {
    fetchLightStates();
    const interval = setInterval(() => syncLightStatesWithSchedule(), 10000);
    return () => clearInterval(interval);
  }, [fetchLightStates, syncLightStatesWithSchedule]);

  return (
    <LightStateContext.Provider value={{
      lightStates,
      setLightStates,
      lightHistory,
      setLightHistory,
      currentEvents,
      setCurrentEvents,
      updateLightState,
      addLight,
      fetchLightStates,
      addSchedule,
      deleteSchedule,
      syncLightStatesWithSchedule,
    }}>
      {children}
    </LightStateContext.Provider>
  );
}

export const useLightState = () => useContext(LightStateContext);