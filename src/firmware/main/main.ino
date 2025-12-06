#include <Arduino.h>
#include <iostream>
#include "Config.h"
#include "Sensors.h"
#include<DHT.h>
int temperature;
int humidity;
bool isRain;
int soilMoisture;
DHT dht(PIN_DHT, DHTTYPE);
void setup() {
  Serial.begin(115200);
  delay(1000);
  dht.begin();
  initSensors();
  Serial.println("\Start");
  pinMode(PIN_RELAY_1, OUTPUT);
  digitalWrite(PIN_RELAY_1, HIGH); 
}

void loop() {
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  isRain = readRainStatus();
  soilMoisture = readSoilMoisture();
  if(soilMoisture <40 && isRain==false){
    //bật bơm
    digitalWrite(PIN_RELAY_1, LOW);
  }
  else if (soilMoisture <40 && isRain ==true){
    //tắt bơm
    digitalWrite(PIN_RELAY_1, HIGH); 
  }
  else if (soilMoisture >=80){ 
    //tắt bơm
    digitalWrite(PIN_RELAY_1, HIGH); 
  }
  else if ( (soilMoisture<=60 || soilMoisture >=40) && temperature >=35 && humidity <=40){
    // bật máy
    digitalWrite(PIN_RELAY_1, LOW);
  }
  delay(5*1000);
}