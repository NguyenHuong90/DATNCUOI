import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';

const LightStateContext = createContext();

const mqttClient = mqtt.connect('ws://broker.hivemq.com:8000/mqtt', {
  reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker in useLightState');
});

mqttClient.on('error', (err) => {
  console.error('MQTT error in useLightState:', err);
});

mqttClient.on('close', () => {
  console.log('MQTT connection closed, attempting to reconnect');
});

export function LightStateProvider({ children }) {
  const [lightStates, setLightStates] = useState({});
  const [lightHistory, setLightHistory] = useState([]);
  const [currentEvents, setCurrentEvents] = useState([]);

  const updateLightState = useCallback(async (nodeId, updates, source = 'manual') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, skipping update light state');
        return;
      }
      console.log('Updating light state:', nodeId, updates, 'Source:', source);
      const response = await axios.post(
        'http://localhost:5000/api/lamp/control',
        {
          gw_id: lightStates[nodeId]?.gw_id || 'gw-01',
          node_id: nodeId.toString(),
          ...updates,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { lamp } = response.data;
      setLightStates((prev) => {
        const newState = {
          ...prev,
          [nodeId]: {
            ...prev[nodeId],
            lamp_state: lamp.lamp_state,
            lamp_dim: lamp.lamp_dim,
            lux: lamp.lux,
            current_a: lamp.current_a,
            lat: lamp.lat,
            lng: lamp.lng,
            manualOverride: source === 'manual' ? true : prev[nodeId].manualOverride,
            lastManualAction: source === 'manual' ? new Date().toISOString() : prev[nodeId].lastManualAction,
            energy_consumed: lamp.energy_consumed,
          },
        };
        return JSON.stringify(newState) !== JSON.stringify(prev) ? newState : prev;
      });
      setLightHistory((prev) => {
        const lastEvent = prev.findLast((e) => e.lightId === nodeId.toString() && e.action === 'on');
        let duration = 0;
        let energyConsumed = 0;
        if (lastEvent && updates.lamp_state === 'OFF') {
          const endTime = new Date();
          duration = (endTime - new Date(lastEvent.timestamp)) / (1000 * 60 * 60); // Giờ
          const current = lightStates[nodeId]?.current_a || 0;
          const power = current * 220 * (lightStates[nodeId]?.lamp_dim / 100 || 0); // Công suất (W), điều chỉnh theo độ sáng
          energyConsumed = (power * duration) / 1000; // kWh
        }
        const newHistory = [
          ...prev,
          {
            lightId: nodeId.toString(),
            action: updates.lamp_state
              ? updates.lamp_state === 'ON' ? 'on' : 'off'
              : updates.lat !== undefined || updates.lng !== undefined
              ? 'update_location'
              : `brightness ${updates.lamp_dim}%`,
            start: new Date(),
            end: updates.lamp_state === 'OFF' ? new Date() : null,
            duration: duration,
            energy_consumed: energyConsumed,
            timestamp: new Date(),
          },
        ];
        return JSON.stringify(newHistory) !== JSON.stringify(prev) ? newHistory : prev;
      });
      console.log('Light state updated:', { nodeId, ...lamp });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      } else {
        console.error('Lỗi khi cập nhật trạng thái đèn:', err);
        throw err;
      }
    }
  }, [lightStates]);

  const addLight = useCallback(async (lampData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, skipping add light');
        return;
      }
      console.log('Adding light to backend:', lampData);
      const response = await axios.post(
        'http://localhost:5000/api/lamp/control',
        lampData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { lamp } = response.data;
      setLightStates((prev) => {
        const newState = {
          ...prev,
          [lamp.node_id]: {
            gw_id: lamp.gw_id,
            node_id: lamp.node_id,
            lamp_state: lamp.lamp_state,
            lamp_dim: lamp.lamp_dim,
            lux: lamp.lux,
            current_a: lamp.current_a,
            lat: lamp.lat,
            lng: lamp.lng,
            manualOverride: false,
            lastManualAction: null,
            energy_consumed: lamp.energy_consumed,
          },
        };
        return JSON.stringify(newState) !== JSON.stringify(prev) ? newState : prev;
      });
      console.log('Light added:', lamp);
    } catch (err) {
      console.error('Lỗi khi thêm bóng đèn:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
      throw err;
    }
  }, []);

const fetchLightStates = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, skipping fetch light states');
      return;
    }
    console.log('Fetching light states from backend');
    const response = await axios.get('http://localhost:5000/api/lamp/state', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const lamps = response.data;
    const newLightStates = {};
    lamps.forEach((lamp) => {
      newLightStates[lamp.node_id] = {
        gw_id: lamp.gw_id,
        node_id: lamp.node_id,
        lamp_state: lamp.lamp_state,
        lamp_dim: lamp.lamp_dim,
        lux: lamp.lux,
        current_a: lamp.current_a,
        lat: lamp.lat,
        lng: lamp.lng,
        energy_consumed: lamp.energy_consumed || 0, // Thêm trường từ backend
        manualOverride: false,
        lastManualAction: null,
      };
    });
    if (JSON.stringify(newLightStates) !== JSON.stringify(lightStates)) {
      setLightStates(newLightStates);
      console.log('Light states fetched and updated:', newLightStates);
    } else {
      console.log('No changes in light states, skipping update');
    }
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    } else {
      console.error('Lỗi khi lấy trạng thái đèn:', err);
    }
  }
}, [lightStates]);

  /*const autoControlLights = useCallback(async () => {
    const lowThreshold = 50; // lux < 50: trời tối, bật đèn
    const highThreshold = 100; // lux > 100: có ánh sáng tự nhiên, giảm sáng
    const step = 10; // Bước tăng/giảm độ sáng (%)
    const intervalTime = 1000; // Thời gian mỗi bước (1 giây)

    Object.entries(lightStates).forEach(([nodeId, state]) => {
      if (state.manualOverride) return; // Bỏ qua nếu manual

      const lux = state.lux || 0;
      let targetDim = state.lamp_dim;

      if (lux < lowThreshold && state.lamp_state !== 'ON') {
        // Trời tối, bật đèn và tăng sáng dần
        updateLightState(nodeId, { lamp_state: 'ON', lamp_dim: 0 }, 'auto');
        let currentDim = 0;
        const interval = setInterval(() => {
          currentDim += step;
          if (currentDim >= 100) {
            clearInterval(interval);
            currentDim = 100;
          }
          updateLightState(nodeId, { lamp_dim: currentDim }, 'auto');
        }, intervalTime);
      } else if (lux > highThreshold && state.lamp_state === 'ON') {
        // Có ánh sáng tự nhiên, giảm sáng dần và tắt
        let currentDim = state.lamp_dim;
        const interval = setInterval(() => {
          currentDim -= step;
          if (currentDim <= 0) {
            clearInterval(interval);
            updateLightState(nodeId, { lamp_state: 'OFF', lamp_dim: 0 }, 'auto');
          } else {
            updateLightState(nodeId, { lamp_dim: currentDim }, 'auto');
          }
        }, intervalTime);
      }
    });
  }, [lightStates, updateLightState]);*/

  const syncLightStatesWithSchedule = useCallback(async (now) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, skipping schedule sync');
        return [];
      }
      console.log('Fetching schedules from backend at', now.toISOString());
      const response = await axios.get('http://localhost:5000/api/schedule', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const schedules = response.data;
      console.log('Schedules fetched for sync:', schedules);

      const events = [];
      const updatedLightStates = { ...lightStates };
      const schedulesToDelete = [];

      schedules.forEach((sch) => {
        const start = new Date(sch.start);
        const end = sch.end ? new Date(sch.end) : null;
        const nodeId = sch.node_id;

        console.log(`Processing schedule for node ${nodeId}: action=${sch.action}, start=${start.toISOString()}, end=${end ? end.toISOString() : 'null'}, now=${now.toISOString()}`);

        if (!lightStates[nodeId]) {
          console.warn(`Node ${nodeId} not found in lightStates, skipping schedule`);
          return;
        }

        if (!lightStates[nodeId].manualOverride) {
          if (sch.action === 'on' && now >= start && (!end || now < end)) {
            const scheduleBrightness = sch.lamp_dim !== undefined ? sch.lamp_dim : (lightStates[nodeId].lamp_dim || 50);
            if (updatedLightStates[nodeId].lamp_state !== 'ON') {
              updatedLightStates[nodeId] = {
                ...updatedLightStates[nodeId],
                lamp_state: 'ON',
                lamp_dim: scheduleBrightness,
              };
              const payload = JSON.stringify({
                lamp_state: 'ON',
                lamp_dim: scheduleBrightness,
              });
              mqttClient.publish(`lamp/control/${nodeId}`, payload, { qos: 0 }, (err) => {
                if (err) {
                  console.error(`Lỗi khi gửi MQTT đến lamp/control/${nodeId}:`, err);
                } else {
                  console.log(`MQTT published to lamp/control/${nodeId}: ${payload}`);
                }
              });
              updateLightState(nodeId, { lamp_state: 'ON', lamp_dim: scheduleBrightness }, 'schedule');
            } else {
              console.log(`Node ${nodeId} already ON, skipping MQTT publish`);
            }
          } else if (sch.action === 'off' && now >= start) {
            if (updatedLightStates[nodeId].lamp_state !== 'OFF') {
              updatedLightStates[nodeId] = {
                ...updatedLightStates[nodeId],
                lamp_state: 'OFF',
                lamp_dim: 0,
              };
              const payload = JSON.stringify({
                lamp_state: 'OFF',
                lamp_dim: 0,
              });
              mqttClient.publish(`lamp/control/${nodeId}`, payload, { qos: 0 }, (err) => {
                if (err) {
                  console.error(`Lỗi khi gửi MQTT đến lamp/control/${nodeId}:`, err);
                } else {
                  console.log(`MQTT published to lamp/control/${nodeId}: ${payload}`);
                }
              });
              updateLightState(nodeId, { lamp_state: 'OFF', lamp_dim: 0 }, 'schedule');
            } else {
              console.log(`Node ${nodeId} already OFF, skipping MQTT publish`);
            }
            schedulesToDelete.push(sch._id);
          } else if (sch.action === 'on' && end && now >= end) {
            if (updatedLightStates[nodeId].lamp_state !== 'OFF') {
              updatedLightStates[nodeId] = {
                ...updatedLightStates[nodeId],
                lamp_state: 'OFF',
                lamp_dim: 0,
              };
              const payload = JSON.stringify({
                lamp_state: 'OFF',
                lamp_dim: 0,
              });
              mqttClient.publish(`lamp/control/${nodeId}`, payload, { qos: 0 }, (err) => {
                if (err) {
                  console.error(`Lỗi khi gửi MQTT đến lamp/control/${nodeId}:`, err);
                } else {
                  console.log(`MQTT published to lamp/control/${nodeId}: ${payload}`);
                }
              });
              updateLightState(nodeId, { lamp_state: 'OFF', lamp_dim: 0 }, 'schedule');
            } else {
              console.log(`Node ${nodeId} already OFF, skipping MQTT publish`);
            }
            schedulesToDelete.push(sch._id);
          }
        } else {
          console.log(`Node ${nodeId} has manual override, skipping schedule`);
        }

        if (!(sch.action === 'off' && now >= start) && !(sch.action === 'on' && end && now >= end)) {
          events.push({
            id: sch._id,
            title: `${sch.node_id} - ${sch.action === 'on' ? `Bật (${sch.lamp_dim !== undefined ? sch.lamp_dim + '%' : '50%'})` : 'Tắt'}`,
            start: new Date(sch.start),
            end: sch.end ? new Date(sch.end) : null,
            allDay: false,
            extendedProps: {
              lightId: sch.node_id,
              action: sch.action,
              lamp_dim: sch.lamp_dim,
            },
          });
        }
      });

      for (const id of schedulesToDelete) {
        await deleteSchedule(id);
      }

      const lightStatesChanged = JSON.stringify(updatedLightStates) !== JSON.stringify(lightStates);
      const eventsChanged = JSON.stringify(events) !== JSON.stringify(currentEvents);

      if (lightStatesChanged) {
        setLightStates(updatedLightStates);
        console.log('Light states updated after sync:', updatedLightStates);
      }
      if (eventsChanged) {
        setCurrentEvents(events);
        console.log('Current events updated after sync:', events);
      }

      return events;
    } catch (err) {
      console.error('Lỗi khi đồng bộ lịch trình:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
      return [];
    }
  }, [lightStates, updateLightState]);

  const deleteSchedule = useCallback(async (scheduleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, skipping delete schedule');
        return;
      }
      console.log('Deleting schedule:', scheduleId);
      await axios.delete(`http://localhost:5000/api/schedule/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentEvents((prev) => {
        const newEvents = prev.filter((event) => event.id !== scheduleId);
        return JSON.stringify(newEvents) !== JSON.stringify(prev) ? newEvents : prev;
      });
      console.log('Schedule deleted:', scheduleId);
      await syncLightStatesWithSchedule(new Date());
    } catch (err) {
      console.error('Lỗi khi xóa lịch trình:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
      throw err;
    }
  }, [syncLightStatesWithSchedule]);

  const addSchedule = useCallback(async (schedule) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, skipping add schedule');
        return;
      }
      console.log('Adding schedule to backend:', schedule);
      const response = await axios.post(
        'http://localhost:5000/api/schedule',
        schedule,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { schedule: newSchedule } = response.data;
      setCurrentEvents((prev) => {
        const newEvents = [
          ...prev,
          {
            id: newSchedule._id,
            title: `${newSchedule.node_id} - ${newSchedule.action === 'on' ? `Bật (${newSchedule.lamp_dim !== undefined ? newSchedule.lamp_dim + '%' : '50%'})` : 'Tắt'}`,
            start: new Date(newSchedule.start),
            end: newSchedule.end ? new Date(newSchedule.end) : null,
            allDay: false,
            extendedProps: {
              lightId: newSchedule.node_id,
              action: newSchedule.action,
              lamp_dim: newSchedule.lamp_dim,
            },
          },
        ];
        return JSON.stringify(newEvents) !== JSON.stringify(prev) ? newEvents : prev;
      });
      console.log('Schedule added:', newSchedule);
      await syncLightStatesWithSchedule(new Date());
    } catch (err) {
      console.error('Lỗi khi thêm lịch trình:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
      throw err;
    }
  }, [syncLightStatesWithSchedule]);

  useEffect(() => {
    console.log('Setting up sync interval in LightStateProvider');
    fetchLightStates();
    const interval = setInterval(() => {
      const now = new Date();
      console.log('Running syncLightStatesWithSchedule at', now.toISOString());
      syncLightStatesWithSchedule(now);
    }, 10000);
    return () => {
      console.log('Cleaning up sync interval in LightStateProvider');
      clearInterval(interval);
    };
  }, [fetchLightStates, syncLightStatesWithSchedule]);

  /*useEffect(() => {
    console.log('Setting up auto control interval');
    const autoInterval = setInterval(autoControlLights, 30000); // Kiểm tra mỗi 30 giây
    return () => clearInterval(autoInterval);
  }, [autoControlLights]);*/

  useEffect(() => {
    console.log('Setting up MQTT subscriptions in LightStateProvider');
    Object.keys(lightStates).forEach((nodeId) => {
      const topic = `lamp/state/${nodeId}`;
      mqttClient.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`Lỗi khi subscribe MQTT topic ${topic}:`, err);
        } else {
          console.log(`Subscribed to MQTT topic ${topic}`);
        }
      });
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const nodeId = topic.split('/')[2];
        console.log(`Received MQTT message on ${topic}:`, data);
        setLightStates((prev) => {
          if (!prev[nodeId]) return prev;
          const newState = {
            ...prev,
            [nodeId]: {
              ...prev[nodeId],
              lamp_state: data.lamp_state || prev[nodeId].lamp_state,
              lamp_dim: data.lamp_dim !== undefined ? data.lamp_dim : prev[nodeId].lamp_dim,
              lux: data.lux !== undefined ? data.lux : prev[nodeId].lux,
              current_a: data.current_a !== undefined ? data.current_a : prev[nodeId].current_a,
              lat: data.lat !== undefined ? data.lat : prev[nodeId].lat,
              lng: data.lng !== undefined ? data.lng : prev[nodeId].lng,
              energy_consumed: data.energy_consumed !== undefined ? data.energy_consumed : prev[nodeId].energy_consumed,
            },
          };
          return JSON.stringify(newState) !== JSON.stringify(prev) ? newState : prev;
        });
      } catch (err) {
        console.error(`Lỗi khi xử lý MQTT message trên topic ${topic}:`, err);
      }
    });

    return () => {
      console.log('Cleaning up MQTT subscriptions in LightStateProvider');
      Object.keys(lightStates).forEach((nodeId) => {
        mqttClient.unsubscribe(`lamp/state/${nodeId}`);
      });
    };
  }, [lightStates]);

  return (
    <LightStateContext.Provider
      value={{
        lightStates,
        setLightStates,
        lightHistory,
        setLightHistory,
        currentEvents,
        setCurrentEvents,
        syncLightStatesWithSchedule,
        fetchLightStates,
        updateLightState,
        addSchedule,
        deleteSchedule,
        addLight,
      }}
    >
      {children}
    </LightStateContext.Provider>
  );
};

export const useLightState = () => useContext(LightStateContext);