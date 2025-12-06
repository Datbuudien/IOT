#include <Arduino.h>

// Cấu hình chân
#define PIN_MIC 35  // MAX4466 kết nối với GPIO 35

// Cấu hình audio
#define SAMPLE_RATE 16000
#define RECORD_DURATION 1000  // 1 giây (ms)
#define SAMPLES_COUNT (SAMPLE_RATE * RECORD_DURATION / 1000)  // 16000 samples

// Buffer để lưu audio
int16_t audio_buffer[SAMPLES_COUNT];

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(PIN_MIC, INPUT);
  
  Serial.println("\n=== ESP32 Voice Data Collector ===");
  Serial.println("Sẵn sàng thu âm!");
  Serial.println("Gửi lệnh 'RECORD' qua Serial để bắt đầu\n");
}
 
 void record_audio() {
   Serial.println("RECORD_START");  // Báo hiệu bắt đầu thu
   
   unsigned long start_time = millis();
   int sample_count = 0;
   
   while (sample_count < SAMPLES_COUNT) {
     // Đọc từ ADC (MAX4466)
     int raw = analogRead(PIN_MIC);
     
     // Convert từ 0-4095 (12-bit ADC) sang -32768 to 32767 (int16 range)
     // Trung tâm ở 2048, scale factor = 16
     audio_buffer[sample_count] = (int16_t)((raw - 2048) * 16);
     sample_count++;
     
     // Delay để đảm bảo sample rate chính xác 16kHz
     // 1 giây = 1,000,000 microseconds
     // 1 sample = 1,000,000 / 16000 = 62.5 microseconds
     delayMicroseconds(1000000 / SAMPLE_RATE);
   }
   
   unsigned long elapsed = millis() - start_time;
   Serial.printf("RECORD_END - Đã thu %d samples trong %lu ms\n", sample_count, elapsed);
 }
 
 void send_audio_data() {
   Serial.println("DATA_START");
   
   // Gửi số lượng samples (để PC biết cần đọc bao nhiêu)
   Serial.println(SAMPLES_COUNT);
   
   // Gửi raw audio data (bytes)
   // int16_t = 2 bytes, nên tổng cộng là SAMPLES_COUNT * 2 bytes
   Serial.write((uint8_t*)audio_buffer, sizeof(audio_buffer));
   
   Serial.println("DATA_END");
   Serial.flush();  // Đảm bảo gửi hết dữ liệu trước khi tiếp tục
 }
 
 void loop() {
   // Kiểm tra lệnh từ Serial
   if (Serial.available() > 0) {
     String cmd = Serial.readStringUntil('\n');
     cmd.trim();  // Loại bỏ khoảng trắng
     
     if (cmd == "RECORD") {
       Serial.println("Bắt đầu thu âm...");
       record_audio();
       
       Serial.println("Đang gửi dữ liệu...");
       send_audio_data();
       
       Serial.println("Hoàn thành!\n");
     }
   }
   
   delay(10);  // Tránh đọc Serial quá nhanh
 }