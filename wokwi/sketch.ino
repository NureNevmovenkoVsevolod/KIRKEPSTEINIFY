/*
 * KirkEpsteinify - IoT Weather Station (Advanced)
 * ESP32 + DHT22 + BME280 + PIR + LDR + Button
 * Платформа: Wokwi (https://wokwi.com)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>
#include <time.h>

// ============================================
// КОНФІГУРАЦІЯ
// ============================================

// WiFi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// API Server
const char* SERVER_URL = "http://192.168.4.1:5000/api/measurements";
const char* STATION_ID = "wokwi-station-001";

// Pin definitions (from diagram.json)
#define DHT_PIN 15
#define PIR_PIN 13
#define LDR_PIN 34
#define BUTTON_PIN 33
#define LED_STATUS 2
#define LED_CAM 4

// Sensors
#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);
Adafruit_BME280 bme;

// Interval (5 seconds for testing)
const unsigned long MEASUREMENT_INTERVAL = 5000;
unsigned long lastMeasurementTime = 0;

// Motion & Light detection
bool motionDetected = false;
int lightLevel = 0;
bool buttonPressed = false;
unsigned long buttonLastPress = 0;
const unsigned long DEBOUNCE_TIME = 200;

// Statistics
struct Stats {
  int totalSent = 0;
  int successCount = 0;
  int failureCount = 0;
  int alertsTriggered = 0;
} stats;

// ============================================
// SETUP
// ============================================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n╔════════════════════════════════════════╗");
  Serial.println("║   KirkEpsteinify - Advanced Sensor Node ║");
  Serial.println("║      DHT22 + BME280 + PIR + LDR        ║");
  Serial.println("╚════════════════════════════════════════╝\n");
  
  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_STATUS, OUTPUT);
  pinMode(LED_CAM, OUTPUT);
  
  digitalWrite(LED_STATUS, LOW);
  digitalWrite(LED_CAM, LOW);
  
  Serial.println("[1/4] Initializing sensors...");
  initializeSensors();
  
  Serial.println("[2/4] Connecting to WiFi...");
  connectToWiFi();
  
  Serial.println("[3/4] Configuration complete!");
  Serial.println("[4/4] Ready!\n");
  printSystemInfo();
}

void initializeSensors() {
  // DHT22
  dht.begin();
  Serial.println("  ✓ DHT22 initialized on pin D15");
  
  // BME280
  if (bme.begin(0x76)) {
    Serial.println("  ✓ BME280 initialized on I2C (0x76)");
  } else {
    Serial.println("  ✗ BME280 not found!");
  }
  
  // PIR Motion sensor
  Serial.println("  ✓ PIR motion sensor initialized on D13");
  
  // LDR Light sensor
  Serial.println("  ✓ LDR light sensor initialized on A34");
  
  // Button
  Serial.println("  ✓ Button initialized on D33");
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_STATUS, HIGH);
    Serial.println("  ✓ WiFi connected!");
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(LED_STATUS, LOW);
    Serial.println("  ✗ WiFi connection failed!");
  }
}

void printSystemInfo() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("SYSTEM CONFIGURATION:");
  Serial.print("  Station ID: ");
  Serial.println(STATION_ID);
  Serial.print("  API Server: ");
  Serial.println(SERVER_URL);
  Serial.println("  Available Sensors:");
  Serial.println("    - DHT22 (Temperature, Humidity)");
  Serial.println("    - BME280 (Pressure, Altitude)");
  Serial.println("    - PIR Motion Sensor (D13)");
  Serial.println("    - LDR Light Sensor (A34)");
  Serial.println("    - Button (D33)");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_STATUS, LOW);
    connectToWiFi();
  } else {
    digitalWrite(LED_STATUS, HIGH);
  }
  
  // Read sensors continuously
  readSensorInputs();
  
  // Check button press
  checkButton();
  
  // Send measurements periodically
  if (millis() - lastMeasurementTime >= MEASUREMENT_INTERVAL) {
    lastMeasurementTime = millis();
    takeMeasurement();
  }
  
  delay(50);
}

// ============================================
// SENSOR INPUT READING
// ============================================

void readSensorInputs() {
  // PIR Motion detection
  motionDetected = digitalRead(PIR_PIN) == HIGH;
  
  // LDR Light level (0-4095)
  lightLevel = analogRead(LDR_PIN);
}

void checkButton() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    if (millis() - buttonLastPress > DEBOUNCE_TIME) {
      buttonPressed = true;
      buttonLastPress = millis();
      
      // Toggle LED_CAM
      digitalWrite(LED_CAM, !digitalRead(LED_CAM));
      
      Serial.println("🔘 Button pressed! LED_CAM toggled.");
    }
  } else {
    buttonPressed = false;
  }
}

// ============================================
// MEASUREMENT & TELEMETRY
// ============================================

struct Measurement {
  float temperature;
  float humidity;
  float pressure;
  float altitude;
  int lightLevel;
  bool motionDetected;
  bool valid;
};

Measurement readSensors() {
  Measurement m;
  m.valid = false;
  
  // Read DHT22
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  
  if (isnan(t) || isnan(h)) {
    Serial.println("✗ DHT22 read error!");
    return m;
  }
  
  m.temperature = t;
  m.humidity = h;
  
  // Read BME280
  m.pressure = bme.readPressure() / 100.0; // Convert to hPa
  m.altitude = bme.readAltitude(1013.25); // Sea level pressure
  
  // Read additional sensors
  m.lightLevel = lightLevel;
  m.motionDetected = motionDetected;
  
  m.valid = true;
  return m;
}

void takeMeasurement() {
  Serial.println("\n┌─────────────────────────────────────────┐");
  Serial.print("│ Measurement #");
  Serial.print(stats.totalSent + 1);
  Serial.println(" - Reading sensors...     │");
  
  Measurement m = readSensors();
  
  if (!m.valid) {
    Serial.println("│ ✗ Sensor read failed!                   │");
    Serial.println("└─────────────────────────────────────────┘");
    stats.failureCount++;
    return;
  }
  
  // Display readings
  Serial.print("│ Temperature: ");
  Serial.print(m.temperature, 1);
  Serial.println("°C                     │");
  Serial.print("│ Humidity:    ");
  Serial.print(m.humidity, 1);
  Serial.println("%                       │");
  Serial.print("│ Pressure:    ");
  Serial.print(m.pressure, 1);
  Serial.println(" hPa                   │");
  Serial.print("│ Altitude:    ");
  Serial.print(m.altitude, 1);
  Serial.println(" m                     │");
  
  // Display motion & light
  Serial.print("│ Motion:      ");
  Serial.print(m.motionDetected ? "Yes" : "No");
  Serial.println("                      │");
  Serial.print("│ Light Level: ");
  Serial.print(m.lightLevel);
  Serial.println(" (0-4095)            │");
  
  // Check for anomalies
  checkAnomalies(m);
  
  // Send to server
  sendToServer(m);
  
  Serial.println("└─────────────────────────────────────────┘");
}

void checkAnomalies(Measurement m) {
  bool hasAnomaly = false;
  
  if (m.temperature > 35.0) {
    Serial.println("│ ⚠️  ANOMALY: Temperature critical high!  │");
    hasAnomaly = true;
  }
  
  if (m.temperature < 0.0) {
    Serial.println("│ ⚠️  ANOMALY: Frost warning!             │");
    hasAnomaly = true;
  }
  
  if (m.humidity > 90.0) {
    Serial.println("│ ⚠️  ANOMALY: High humidity!             │");
    hasAnomaly = true;
  }
  
  if (m.motionDetected) {
    Serial.println("│ 🚨 Motion detected!                     │");
    hasAnomaly = true;
  }
  
  if (hasAnomaly) {
    stats.alertsTriggered++;
    blinkLED(LED_STATUS, 3);
  }
}

void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(100);
    digitalWrite(pin, LOW);
    delay(100);
  }
}

// ============================================
// HTTP REQUEST & RESPONSE HANDLING
// ============================================

void sendToServer(Measurement m) {
  Serial.print("│ Sending to server...");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("            │");
    Serial.println("│ ✗ WiFi not connected!                  │");
    stats.failureCount++;
    return;
  }
  
  // Create JSON payload
  StaticJsonDocument<384> doc;
  doc["stationId"] = STATION_ID;
  doc["temperature"] = round(m.temperature * 10) / 10.0;
  doc["humidity"] = round(m.humidity * 10) / 10.0;
  doc["pressure"] = round(m.pressure * 10) / 10.0;
  doc["altitude"] = round(m.altitude * 10) / 10.0;
  doc["lightLevel"] = m.lightLevel;
  doc["motionDetected"] = m.motionDetected;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // HTTP POST
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setConnectTimeout(5000);
  http.setTimeout(5000);
  
  int httpCode = http.POST(jsonString);
  
  Serial.print("               │");
  Serial.println();
  
  if (httpCode == 201 || httpCode == 200) {
    Serial.print("│ ✓ HTTP ");
    Serial.print(httpCode);
    Serial.println(" - Success!                    │");
    
    stats.successCount++;
    digitalWrite(LED_STATUS, HIGH);
    delay(200);
    
  } else if (httpCode > 0) {
    Serial.print("│ ✗ HTTP ");
    Serial.print(httpCode);
    Serial.println(" - Error                     │");
    stats.failureCount++;
  } else {
    Serial.println("│ ✗ Connection failed!                   │");
    stats.failureCount++;
  }
  
  http.end();
  
  stats.totalSent++;
  printStatistics();
}

void printStatistics() {
  Serial.println("│                                         │");
  Serial.print("│ Stats: ");
  Serial.print(stats.totalSent);
  Serial.print(" sent, ");
  Serial.print(stats.successCount);
  Serial.print(" ok, ");
  Serial.print(stats.failureCount);
  Serial.println(" fail ");
  Serial.println("│                                         │");
}




