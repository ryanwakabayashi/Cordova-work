/*
* Description :   Example of TSD305 Sensor (by TE-Connectivity) for Arduino platform.
* Author      :   Pranjal Joshi
* Date        :   25/05/2020 
* License     :   MIT
* This code is published as open source software. Feel free to share/modify.
* Edited      :   Ryan Wakabayashi 08/06/2020
*/

#include <tsd305lib.h>
#include <ArduinoBLE.h>
BLEService customService("19B10000-E8F2-537E-4F6C-D104768A1214"); // BLE customService
BLEByteCharacteristic switchCharacteristic("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite | BLENotify);
const int ledPin = LED_BUILTIN; // pin to use for the LED

tsd305 tsd;
tsd_eeprom_struct tes;
float sensorTemp, objDeg, objFar;

void setup() {
  Serial.begin(9600);                 // Change baudrate according to your application
  Serial.println();
  pinMode(ledPin, OUTPUT);
  tes = tsd.begin(); //sensor start
  
  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1);
  }
  // set advertised local name and service UUID:
  BLE.setLocalName("MKR1010");
  BLE.setAdvertisedService(customService);
  // add the characteristic to the service
  customService.addCharacteristic(switchCharacteristic);
  // add service
  BLE.addService(customService);
  // set the initial value for the characeristic:
  switchCharacteristic.writeValue(0);
  // start advertising
  BLE.advertise();
  Serial.println("MKR 1010 Advertisement start.. ");
}

//send data
  void sendSensorData() {
    float temperature = tsd.DtoF(objDeg);
    switchCharacteristic.setValue(temperature);
  }

void loop() {
  // wait for a BLE central
  BLEDevice central = BLE.central();

  // if a BLE central is connected to the peripheral:
  if (central) {

    if(tsd.isConnected()) {
      Serial.print("Connected to central: ");
      // print the central's BT address:
      Serial.println(central.address());
      // turn on the LED to indicate the connection:
      digitalWrite(ledPin, HIGH);

      // while the central is connected:
      while (central.connected()) {
        sensorTemp = tsd.getSensorTemp();   // Get temperature of sensor itself i.e. ambient temperature
        objDeg = tsd.getObjectTemp();       // Get temperature of object
        objFar = tsd.DtoF(objDeg); 
        delay(500);
        Serial.println(objFar);
        sendSensorData();
        switchCharacteristic.writeValue(objFar);
      }
      // when the central disconnects, turn off the LED:
      digitalWrite(ledPin, LOW);
      Serial.print("Disconnected from central: ");
      Serial.println(central.address());
    }
  }
}
