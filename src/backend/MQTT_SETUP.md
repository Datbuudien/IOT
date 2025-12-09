# MQTT Setup Guide

## Cấu trúc thư mục với MQTT

```
src/backend/
├── config/
│   ├── database.js
│   ├── cors.js
│   └── mqtt.js              # ✨ MQTT configuration
├── controllers/
│   └── ...
├── models/
│   └── ...
├── routes/
│   └── ...
├── middleware/
│   └── ...
├── services/
│   ├── schedulerService.js
│   └── mqttService.js        # ✨ MQTT service (singleton)
├── mqtt/                      # ✨ MQTT module
│   ├── handlers/
│   │   ├── sensorHandler.js   # Xử lý dữ liệu sensor
│   │   └── deviceHandler.js   # Xử lý trạng thái thiết bị
│   └── topics.js              # Định nghĩa MQTT topics
├── server.js                  # ✨ Khởi động MQTT service
└── app.js
```

## Cài đặt MQTT

### 1. Cài đặt package

```bash
cd src/backend
npm install mqtt
```

### 2. Cấu hình .env

Thêm vào file `.env`:

```env
# MQTT Configuration
MQTT_BROKER=mqtt://localhost:1883
# Hoặc dùng MQTT broker công cộng:
# MQTT_BROKER=mqtt://broker.hivemq.com:1883
# MQTT_BROKER=mqtt://test.mosquitto.org:1883

# Authentication (nếu có)
MQTT_USERNAME=
MQTT_PASSWORD=
```

### 3. Chạy MQTT Broker

**Option 1: Mosquitto (Local)**
```bash
# Windows (với Chocolatey)
choco install mosquitto

# Hoặc download từ: https://mosquitto.org/download/

# Start broker
mosquitto -c mosquitto.conf
```

**Option 2: Docker**
```bash
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

**Option 3: Cloud MQTT (Free)**
- HiveMQ: https://www.hivemq.com/public-mqtt-broker/
- Mosquitto Test: test.mosquitto.org

## MQTT Topics Structure

### ESP32 → Backend (Publish)

```
iot/device/{deviceId}/sensor/data
  → Payload: { temperature, humidity, soilMoisture, isRain, timestamp }

iot/device/{deviceId}/status
  → Payload: { status: "online" | "offline", timestamp }

iot/device/{deviceId}/heartbeat
  → Payload: { timestamp }
```

### Backend → ESP32 (Subscribe)

```
iot/device/{deviceId}/command
  → Payload: { action: "pump_on" | "pump_off" | "light_on" | "light_off" }

iot/device/{deviceId}/config
  → Payload: { threshold: {...}, schedule: {...} }
```

## Sử dụng trong Code

### Backend: Gửi lệnh đến ESP32

```javascript
const mqttService = require('./services/mqttService');

// Gửi lệnh bật bơm
mqttService.sendCommand('ESP32_001', {
  action: 'pump_on',
  timestamp: new Date()
});

// Gửi cấu hình
mqttService.sendConfig('ESP32_001', {
  threshold: {
    soilMoisture: 40,
    temperature: 35
  }
});
```

### Backend: Nhận dữ liệu từ ESP32

Dữ liệu tự động được xử lý bởi handlers:
- `sensorHandler.js` - Lưu vào database
- `deviceHandler.js` - Cập nhật trạng thái thiết bị

## ESP32 Code Example

Xem file: `src/firmware/mqtt_client/mqtt_client.ino`

