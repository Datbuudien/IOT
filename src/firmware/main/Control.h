/**
 * Control Logic Module
 * Logic điều khiển bơm dựa trên dữ liệu sensor
 * CHỈ CHẠY KHI MODE = "auto"
 */

#ifndef CONTROL_H
#define CONTROL_H

#include "Config.h"

/**
 * Điều khiển bơm dựa trên logic nghiệp vụ
 * CHỈ CHẠY KHI deviceMode == "auto"
 * @param soilMoisture Độ ẩm đất (%)
 * @param temperature Nhiệt độ (°C)
 * @param humidity Độ ẩm không khí (%)
 * @param isRain Có mưa hay không
 * @param currentMode Chế độ hiện tại của thiết bị ("auto", "manual", "schedule")
 */
void controlPump(int soilMoisture, int temperature, int humidity, bool isRain, String currentMode) {
  // CHỈ chạy logic tự động khi mode = "auto"
  if (currentMode != "auto") {
    // Ở chế độ manual hoặc schedule, không chạy logic tự động
    // Bơm chỉ được điều khiển qua MQTT command từ Backend
    return;
  }
  
  // Logic tự động chỉ chạy khi mode = "auto"
  if(soilMoisture < 40 && isRain == false){
    // Đất khô và không mưa → Bật bơm
    digitalWrite(PIN_RELAY_1, LOW);
    Serial.println("💧 [AUTO] Pump ON: Soil dry, no rain");
  }
  else if (soilMoisture < 40 && isRain == true){
    // Đất khô nhưng có mưa → Tắt bơm (đợi mưa)
    digitalWrite(PIN_RELAY_1, HIGH); 
    Serial.println("💧 [AUTO] Pump OFF: Rain detected");
  }
  else if (soilMoisture >= 80){ 
    // Đất đủ ẩm → Tắt bơm
    digitalWrite(PIN_RELAY_1, HIGH); 
    Serial.println("💧 [AUTO] Pump OFF: Soil moist enough");
  }
  else if ((soilMoisture <= 60 || soilMoisture >= 40) && temperature >= 35 && humidity <= 40){
    // Đất vừa phải, nóng và khô → Bật bơm
    digitalWrite(PIN_RELAY_1, LOW);
    Serial.println("💧 [AUTO] Pump ON: Hot and dry conditions");
  }
}

#endif

