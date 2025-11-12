#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// --- 1. CẤU HÌNH CHÂN (PIN MAPPING) ---
// Dựa trên sơ đồ nguyên lý Fritzing bạn đã vẽ
#define PIN_DHT         4       // Chân DATA của DHT11
#define PIN_SOIL        34      // Chân AO của Cảm biến đất (Analog Input)
#define PIN_RELAY       5       // Chân IN của Relay (Digital Output)

#define DHTTYPE         DHT11   // Loại cảm biến nhiệt độ

// --- 2. CẤU HÌNH WIFI & MQTT ---
const char* ssid        = "Ten_Wifi_Nha_Ban";    // <--- THAY TÊN WIFI CỦA BẠN
const char* password    = "Mat_Khau_Wifi";       // <--- THAY MẬT KHẨU WIFI
const char* mqtt_server = "192.168.1.x";         // <--- THAY ĐỊA CHỈ IP MÁY TÍNH CHẠY SERVER NODEJS
const int mqtt_port     = 1883;                  // Cổng mặc định của MQTT Broker

// Các Topic MQTT
const char* topic_sensor  = "home/garden/sensor";  // Gửi dữ liệu lên
const char* topic_control = "home/garden/control"; // Nhận lệnh về

// --- 3. BIẾN TOÀN CỤC ---
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(PIN_DHT, DHTTYPE);

bool isAutoMode = true;      // Mặc định là chế độ Tự động
bool pumpStatus = false;     // Trạng thái bơm (false = Tắt)
int soilThreshold = 40;      // Ngưỡng độ ẩm đất để tưới (40%)

unsigned long lastMsg = 0;
const long interval = 5000;  // Đọc cảm biến mỗi 5 giây

// --- 4. HÀM KẾT NỐI WIFI ---
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi da ket noi!");
  Serial.print("Dia chi IP: ");
  Serial.println(WiFi.localIP());
}

// --- 5. HÀM XỬ LÝ KHI NHẬN LỆNH TỪ SERVER (CALLBACK) ---
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Nhan tin nhan MQTT [");
  Serial.print(topic);
  Serial.print("] ");

  // Chuyển payload thành chuỗi
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Phân tích JSON (Ví dụ: {"mode":"MANUAL", "pump":"ON"})
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (!error) {
    // 1. Cập nhật chế độ (AUTO / MANUAL)
    if (doc.containsKey("mode")) {
      const char* mode = doc["mode"];
      if (strcmp(mode, "AUTO") == 0) isAutoMode = true;
      else if (strcmp(mode, "MANUAL") == 0) isAutoMode = false;
      Serial.print("-> Che do hien tai: ");
      Serial.println(isAutoMode ? "TU DONG" : "THU CONG");
    }

    // 2. Điều khiển bơm (Chỉ khi ở chế độ MANUAL)
    if (!isAutoMode && doc.containsKey("pump")) {
      const char* cmd = doc["pump"];
      if (strcmp(cmd, "ON") == 0) {
        digitalWrite(PIN_RELAY, HIGH); // Bật Relay (Kích mức cao)
        pumpStatus = true;
      } else {
        digitalWrite(PIN_RELAY, LOW);  // Tắt Relay
        pumpStatus = false;
      }
    }
  }
}

// --- 6. HÀM KẾT NỐI LẠI MQTT ---
void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi MQTT...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("da ket noi!");
      // Đăng ký nhận lệnh điều khiển
      client.subscribe(topic_control);
    } else {
      Serial.print("loi, rc=");
      Serial.print(client.state());
      Serial.println(" thu lai sau 5 giay");
      delay(5000);
    }
  }
}

// --- 7. SETUP ---
void setup() {
  Serial.begin(115200);

  // Cài đặt chân
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW); // Mặc định tắt bơm
  pinMode(PIN_SOIL, INPUT);

  // Khởi động cảm biến
  dht.begin();

  // Kết nối mạng
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// --- 8. VÒNG LẶP CHÍNH (LOOP) ---
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  // Chỉ đọc cảm biến mỗi 5 giây (tránh làm chậm hệ thống)
  if (now - lastMsg > interval) {
    lastMsg = now;

    // A. ĐỌC CẢM BIẾN
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    
    // Đọc Analog độ ẩm đất (Giá trị từ 0 - 4095)
    int soilRaw = analogRead(PIN_SOIL); 
    // Chuyển đổi sang phần trăm (0% - 100%)
    // Lưu ý: Cảm biến đất thường trả về 4095 khi khô, 0 khi ướt (Ngược)
    int soilPercent = map(soilRaw, 4095, 0, 0, 100); 
    soilPercent = constrain(soilPercent, 0, 100); // Giới hạn trong 0-100

    if (isnan(h) || isnan(t)) {
      Serial.println("Loi doc DHT11!");
      return;
    }

    // B. LOGIC TỰ ĐỘNG (AUTOMATION)
    if (isAutoMode) {
      if (soilPercent < soilThreshold) {
        digitalWrite(PIN_RELAY, HIGH); // Bật bơm
        pumpStatus = true;
        Serial.println("-> Dat kho! [AUTO] BAT BOM");
      } else {
        digitalWrite(PIN_RELAY, LOW);  // Tắt bơm
        pumpStatus = false;
        Serial.println("-> Dat du am. [AUTO] TAT BOM");
      }
    }

    // C. ĐÓNG GÓI JSON & GỬI MQTT
    StaticJsonDocument<200> doc;
    doc["device_id"] = "esp32_garden_01";
    doc["temp"] = t;
    doc["hum"] = h;
    doc["soil"] = soilPercent;
    doc["pump"] = pumpStatus ? "ON" : "OFF";
    doc["mode"] = isAutoMode ? "AUTO" : "MANUAL";

    char buffer[256];
    serializeJson(doc, buffer);
    
    client.publish(topic_sensor, buffer);
    Serial.print("Gui du lieu: ");
    Serial.println(buffer);
  }
}
