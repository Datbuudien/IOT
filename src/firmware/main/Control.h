/**
 * Control Logic Module
 * Logic điều khiển bơm dựa trên dữ liệu sensor
 */

#ifndef CONTROL_H
#define CONTROL_H

#include "Config.h"

/**
 * Điều khiển bơm dựa trên logic nghiệp vụ
 * @param soilMoisture Độ ẩm đất (%)
 * @param temperature Nhiệt độ (°C)
 * @param humidity Độ ẩm không khí (%)
 * @param isRain Có mưa hay không
 */
void controlPump(int soilMoisture, int temperature, int humidity, bool isRain) {
  if(soilMoisture < 40 && isRain == false){
    // Đất khô và không mưa → Bật bơm
    digitalWrite(PIN_RELAY_1, LOW);
    Serial.println("💧 Pump ON: Soil dry, no rain");
  }
  else if (soilMoisture < 40 && isRain == true){
    // Đất khô nhưng có mưa → Tắt bơm (đợi mưa)
    digitalWrite(PIN_RELAY_1, HIGH); 
    Serial.println("💧 Pump OFF: Rain detected");
  }
  else if (soilMoisture >= 80){ 
    // Đất đủ ẩm → Tắt bơm
    digitalWrite(PIN_RELAY_1, HIGH); 
    Serial.println("💧 Pump OFF: Soil moist enough");
  }
  else if ((soilMoisture <= 60 || soilMoisture >= 40) && temperature >= 35 && humidity <= 40){
    // Đất vừa phải, nóng và khô → Bật bơm
    digitalWrite(PIN_RELAY_1, LOW);
    Serial.println("💧 Pump ON: Hot and dry conditions");
  }
}

#endif

