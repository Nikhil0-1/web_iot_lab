# GETTING STARTED WITH TECH IOT WARRIORS

Welcome to **Tech IoT Warriors**! This guide takes you step-by-step from zero to running live sensor monitoring, whether you are using the browser simulation or physical ESP8266 hardware.

---

## 🏁 Phase 1: Zero-Hardware Browser Simulation

You can explore all eight projects immediately without owning any electronics or microcontroller:

1. **Start a local HTTP server:**
   Open a terminal in the project directory and run:
   ```bash
   python -m http.server 8000
   ```
2. **Open the Launcher:**
   Navigate your web browser to:
   ```
   http://localhost:8000/IoT-Projects-Lab/index.html
   ```
3. **Launch Any Project:**
   Click **Open Dashboard** on any project card (for instance, *Project 04: Digital Thermometer*).
4. **Interact with the Simulation Engine:**
   - Notice the **Simulation Mode** pill in the top bar.
   - Use the **Scenario Dropdown** to test scenarios like *Cold Storage*, *Normal Ambient*, *High Heat Alert*, or *Sensor Fault*.
   - Drag the **Manual Slider** to inject custom values and watch the animations and charts respond in real-time.
   - Click **Export CSV** to download simulated telemetry.

---

## 🛠️ Phase 2: Setting Up Physical ESP8266 Hardware

### Step 1: Install the Arduino IDE
1. Download and install [Arduino IDE](https://www.arduino.cc/en/software) (Version 2.x recommended).
2. Open **File > Preferences** (or `Ctrl + ,`).
3. In **Additional Boards Manager URLs**, paste:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Open **Tools > Board > Boards Manager...**, search for `esp8266` by *ESP8266 Community*, and click **Install**.

### Step 2: Install Sensor Libraries
Open **Tools > Manage Libraries...** (or `Ctrl + Shift + I`) and install the required library for your project:
- **Project 04 (Thermometer):** Search and install `OneWire` and `DallasTemperature`.
- Projects 01, 02, 03, 05, 06, 07 use built-in ESP8266 core functions and `Wire.h`.

### Step 3: Wire Your Sensor
Refer to the `wiring.md` guide inside the specific project folder:
- Follow the pinout tables closely.
- Remember that the NodeMCU board operates on 3.3V logic. Always use a voltage divider on 5V outputs (such as the HC-SR04 Echo pin).

### Step 4: Configure Wi-Fi & Flash Firmware
1. Open the project's `.ino` file in the Arduino IDE (e.g., `projects/04-digital-thermometer/firmware/digital_thermometer.ino`).
2. Update the Wi-Fi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Connect your NodeMCU to your computer using a micro-USB cable.
4. Select **Tools > Board > ESP8266 Boards > NodeMCU 1.0 (ESP-12E Module)**.
5. Select the corresponding USB COM port under **Tools > Port**.
6. Click the **Upload** button (Arrow icon).

---

## 🌐 Phase 3: Finding Your ESP8266 IP Address

1. In Arduino IDE, open the **Serial Monitor** (**Tools > Serial Monitor** or `Ctrl + Shift + M`).
2. Set the baud rate to **115200 baud**.
3. Press the **RST** button on the NodeMCU.
4. The monitor will output:
   ```
   Connecting to Wi-Fi: ...
   Wi-Fi Connected!
   IP Address: http://192.168.1.150
   HTTP REST API server started on port 80.
   ```
   *(Note down the IP address, e.g. `192.168.1.150`)*.

---

## 🔗 Phase 4: Connecting the Dashboard to Hardware

1. In your browser dashboard, switch the top mode toggle from **Simulation** to **Hardware**.
2. In the right-hand panel, paste your device IP (e.g. `http://192.168.1.150`).
3. Click **Test Link**.
   - The dashboard will query `GET /api/health` and `GET /api/device`.
   - If successful, a green confirmation appears verifying the device ID and project ID match.
4. Click **Connect**.
5. The dashboard now polls the ESP8266 REST API every 1.5 seconds and plots live physical sensor data!

---

## ❓ Troubleshooting & Common Questions

### Why do I get a connection timeout error?
- Ensure your computer/laptop and ESP8266 are connected to the **same Wi-Fi network**.
- Check if your router isolates Wi-Fi clients (AP Isolation).
- If your router is inaccessible, the firmware automatically starts an Access Point named `ESP8266-<Project>-AP` (password `password123`). You can connect your laptop directly to this Wi-Fi network and access the board at `http://192.168.4.1`.

### Why does Chrome block network requests when opening HTML directly?
Modern browsers enforce strict CORS and security rules for `file:///` URLs. Always serve the project over a local HTTP server:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000/`.
