#include <Arduino.h>
int relay = 5;
int cb =6;
void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  pinMode (cb,INPUT);
  pinMode (relay,OUTPUT);
  digitalWrite(relay, LOW);
}

void loop() {
  // put your main code here, to run repeatedly:
  int digital = digitalRead(cb);
  Serial.print("Digital: ");
  Serial.println(digital);
  delay(500);
  if(digital ==0)
  {
    digitalWrite(relay,LOW);
  }
  else
  {
    digitalWrite(relay,HIGH);
  }
}
