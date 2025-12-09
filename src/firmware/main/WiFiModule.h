/**
 * WiFi Connection Module
 * Xử lý kết nối WiFi
 */

#ifndef WIFI_MODULE_H
#define WIFI_MODULE_H

#include <WiFi.h>
#include "Config.h"

/**
 * Kết nối WiFi
 */
void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

#endif

