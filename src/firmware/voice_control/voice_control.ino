/*
 * ESP32 Mic Sender với Handshake Mechanism
 * Cơ chế Handshake cho Data Collection phù hợp Training AI
 * 
 * Workflow:
 * 1. Python gửi 'R' → ESP32 bắt đầu thu và gửi raw data
 * 2. Python gửi 'S' → ESP32 dừng thu
 * 
 * Đảm bảo đồng bộ, không có dữ liệu rác, phù hợp cho training
 */

#include <WiFi.h>

const int MIC_PIN = 35; 
const unsigned long SAMPLE_PERIOD_US = 62; // ~16kHz sample rate (62.5us = 16000Hz)
const int PIN_RELAY = 13;
bool isRecording = false; // Biến trạng thái

// Cấu hình oversampling để giảm nhiễu ADC
const int OVERSAMPLE_COUNT = 4; // Đọc 4 lần và lấy trung bình

void setup() {
  // Khởi tạo Serial với baud rate cực cao để truyền 16000 samples/giây
  Serial.begin(921600);
  
  // Cấu hình ADC với attenuation 11dB (0-3.3V range)
  // Điều này giúp ADC đọc chính xác hơn với MAX4466
  analogSetAttenuation(ADC_11db);
  analogReadResolution(12); // 12-bit resolution (0-4095)
  
  // Tắt WiFi để giảm nhiễu (nếu không cần WiFi)
  // WiFi có thể gây nhiễu cho ADC
  WiFi.mode(WIFI_OFF); // Uncomment nếu không cần WiFi
  
  pinMode(MIC_PIN, INPUT);
  pinMode(PIN_RELAY, OUTPUT);
  
  // Chờ ESP32 và MAX4466 ổn định sau khi khởi động
  delay(500);
  
  // Xóa buffer Serial để tránh dữ liệu cũ
  Serial.flush();
  while(Serial.available() > 0) {
    Serial.read();
  }
}

void loop() {
  // 1. HANDSHAKE: Kiểm tra lệnh từ Python
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    
    if (cmd == 'R') {
      // Lệnh 'R' = Start Recording
      // Xóa buffer để đảm bảo không có dữ liệu cũ (quan trọng cho training!)
      Serial.flush();
      while(Serial.available() > 0) {
        Serial.read(); // Xóa input buffer
      }
      delay(10); // Chờ ổn định ngắn
      
      // Bắt đầu thu âm
      isRecording = true;
      
    } else if (cmd == 'S') {
      // Lệnh 'S' = Stop Recording
      isRecording = false;
      Serial.flush(); // Đảm bảo gửi hết dữ liệu trước khi dừng
    }
  }

  // 2. Thu và gửi raw data khi đang Recording
  if (isRecording) {
    digitalWrite(PIN_RELAY, LOW);
    unsigned long startMicros = micros();
    
    // Đọc ADC với oversampling để giảm nhiễu
    // Vẫn giữ nguyên bản từ MAX4466, chỉ giảm nhiễu do ADC
    long sum = 0;
    for(int i = 0; i < OVERSAMPLE_COUNT; i++) {
      sum += analogRead(MIC_PIN);
    }
    int rawVal = sum / OVERSAMPLE_COUNT;
    
    // Gửi raw analog value dạng text (ví dụ: 2048\n)
    // Định dạng đơn giản, Python sẽ xử lý phần còn lại
    Serial.println(rawVal);
    
    // Kiểm tra buffer Serial để tránh overflow
    while (Serial.availableForWrite() < 100) {
      delayMicroseconds(50);
    }
    
    // Đảm bảo sample rate chính xác 16kHz
    unsigned long elapsed = micros() - startMicros;
    if (elapsed < SAMPLE_PERIOD_US) {
      delayMicroseconds(SAMPLE_PERIOD_US - elapsed);
    }
  }
  else{
    digitalWrite(PIN_RELAY, HIGH);
  }
}