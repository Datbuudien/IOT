#ifndef CONFIG_H
#define CONFIG_H

// --- 1. CẤU HÌNH CHÂN (PIN MAPPING) ---
// Lưu ý: Dùng các chân ADC1 (32, 33, 34, 35, 36, 39) để tránh xung đột WiFi sau này
const int PIN_SOIL = 34;      // Cảm biến Đất (Analog) -> GPIO 34
const int PIN_RAIN = 32;      // Cảm biến Mưa (Digital) -> GPIO 32
const int PIN_DHT  = 33;      // Cảm biến Nhiệt/Ẩm (DHT11) -> GPIO 33
const int PIN_MIC  = 35;      // Cảm biến Âm thanh (Analog) -> GPIO 35
const int PIN_RELAY_1 = 25;
// --- 2. CẤU HÌNH CẢM BIẾN ---
#define DHTTYPE DHT11

// --- 3. CẤU HÌNH HIỆU CHỈNH (CALIBRATION) ---
// Cảm biến Đất FC-28 (Bạn thay số thực tế vào đây)
const int SOIL_AIR_VALUE   = 4095; // Giá trị khi khô
const int SOIL_WATER_VALUE = 1800; // Giá trị khi ướt

// Cảm biến Âm thanh (MAX4466/9814)
const int MIC_NOISE_THRESHOLD = 500; // Ngưỡng phát hiện tiếng ồn

#endif