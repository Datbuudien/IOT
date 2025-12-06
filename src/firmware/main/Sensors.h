#include "Config.h"

// Khởi tạo đối tượng DHT


// --- HÀM KHỞI TẠO CẢM BIẾN ---
void initSensors() {
  pinMode(PIN_SOIL, INPUT);
  pinMode(PIN_RAIN, INPUT);
  pinMode(PIN_MIC, INPUT);
}

// --- HÀM ĐỌC ĐỘ ẨM ĐẤT (%) ---
int readSoilMoisture() {
  int raw = analogRead(PIN_SOIL);
  // Map ngược: Khô (4095) -> 0%, Ướt (1800) -> 100%
  int percent = map(raw, SOIL_AIR_VALUE, SOIL_WATER_VALUE, 0, 100);
  return constrain(percent, 0, 100);
}

// --- HÀM ĐỌC CẢM BIẾN MƯA ---
// Trả về: "CO MUA" hoặc "KHONG MUA"
bool readRainStatus() {
  int rainVal = digitalRead(PIN_RAIN);
  return rainVal == 0;
  // Cảm biến mưa thường trả về 0 (LOW) khi có nước
}

// --- HÀM IN THÔNG TIN TỔNG HỢP ---
