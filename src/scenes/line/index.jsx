/*import React, { useContext, useMemo, useState } from 'react';
import { Line as LineChartComponent } from 'react-chartjs-2';
import { LightStateContext } from '../../hooks/useLightState';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = ({ data, labels, dataType }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `Light ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`,
        data: data,
        fill: false,
        borderColor: '#42A5F5',
        backgroundColor: '#42A5F5',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Light ${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Over Time` },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: dataType.charAt(0).toUpperCase() + dataType.slice(1) },
      },
      x: {
        title: { display: true, text: 'Time' },
      },
    },
  };

  return <LineChartComponent data={chartData} options={options} />;
};

const Line = () => {
  const { lightStates, lightHistory, activityLogs } = useContext(LightStateContext);
  const [selectedLight, setSelectedLight] = useState('');
  const [dataType, setDataType] = useState('brightness');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const chartData = useMemo(() => {
    let labels = [];
    let data = [];

    if (dataType === 'brightness') {
      const filteredHistory = lightHistory
        .filter((entry) => entry.lightId === selectedLight)
        .filter((entry) => {
          const entryDate = new Date(entry.timestamp);
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return entryDate >= start && entryDate <= end;
        })
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      labels = filteredHistory.map((entry) =>
        new Date(entry.timestamp).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );

      data = filteredHistory.map((entry) => {
        const brightnessMatch = entry.action.match(/brightness (\d+)%/);
        return brightnessMatch ? parseInt(brightnessMatch[1]) : entry.action === 'on' ? 100 : 0;
      });
    } else {
      const filteredLogs = activityLogs
        .filter((log) => log.details?.nodeId === selectedLight)
        .filter((log) => {
          const logDate = new Date(log.timestamp);
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return logDate >= start && logDate <= end;
        })
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      labels = filteredLogs.map((log) =>
        new Date(log.timestamp).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );

      data = filteredLogs.map((log) => {
        if (dataType === 'lux') {
          return log.details?.lux || 0;
        } else if (dataType === 'current') {
          return log.details?.currentA || 0;
        }
        return 0;
      });
    }

    return { data, labels };
  }, [lightHistory, activityLogs, selectedLight, dataType, startDate, endDate]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Biểu đồ dữ liệu đèn</h2>
      <div className="mb-4">
        <label className="mr-2">Chọn đèn:</label>
        <select
          value={selectedLight}
          onChange={(e) => setSelectedLight(e.target.value)}
          className="border p-2"
        >
          <option value="">Chọn một đèn</option>
          {Object.keys(lightStates).map((lightId) => (
            <option key={lightId} value={lightId}>
              Đèn {lightId}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="mr-2">Loại dữ liệu:</label>
        <select
          value={dataType}
          onChange={(e) => setDataType(e.target.value)}
          className="border p-2"
        >
          <option value="brightness">Độ sáng</option>
          <option value="lux">Lux</option>
          <option value="current">Dòng điện (A)</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="mr-2">Ngày bắt đầu:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2"
        />
      </div>
      <div className="mb-4">
        <label className="mr-2">Ngày kết thúc:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2"
        />
      </div>
      {selectedLight && chartData.labels.length > 0 ? (
        <LineChart data={chartData.data} labels={chartData.labels} dataType={dataType} />
      ) : (
        <p className="text-red-500">
          {selectedLight
            ? 'Không có dữ liệu cho đèn và khoảng thời gian đã chọn.'
            : 'Vui lòng chọn một đèn.'}
        </p>
      )}
    </div>
  );
};

export default Line;*/