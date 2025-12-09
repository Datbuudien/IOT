/*
 * ESP32 Audio Sender
 * Chức năng: Đọc microphone MAX4466 và gửi dữ liệu thô qua Serial
 * Kết nối:
 * - OUT (MAX4466) -> GPIO 35 (ADC1)
 * - VCC -> 3V3
 * - GND -> GND
 */

const int MIC_PIN = 35;

// Chu kỳ lấy mẫu cho 16kHz: 1 giây / 16000 = 62.5 micro giây
const unsigned long SAMPLE_PERIOD_US = 62;

void setup() {
  // Tốc độ Serial cực cao để truyền kịp âm thanh
  // Phải khớp với BAUD_RATE trong code Python
  Serial.begin(921600);

  // Cấu hình ADC độ phân giải 12-bit (0-4095)
  analogReadResolution(12);
  pinMode(MIC_PIN, INPUT);
}

void loop() {
  unsigned long startMicros = micros();

  // 1. Đọc giá trị Analog
  int val = analogRead(MIC_PIN);

  // 2. Gửi giá trị thô xuống máy tính (kèm xuống dòng)
  Serial.println(val);

  // 3. Chờ cho đủ thời gian của 1 mẫu (để ổn định tần số 16kHz)
  while (micros() - startMicros < SAMPLE_PERIOD_US);
}