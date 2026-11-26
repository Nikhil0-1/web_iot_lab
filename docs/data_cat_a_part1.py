"""
Tech IoT Warriors — Handbook Data Module: Category A (Part 1: Projects 01–06)
Sensors & Monitoring Laboratory
"""

PROJECTS_CAT_A_PART1 = [
    {
        "id": "01",
        "folder": "01-terrascan-x-elite",
        "title": "TERRASCAN X ELITE — Ultrasonic Radar Scanner",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The TERRASCAN X ELITE is an intelligent 180-degree azimuthal radar scanning system integrating an ultrasonic time-of-flight acoustic transducer with a micro-actuated servo motor. Designed for obstacle mapping, autonomous robotics spatial awareness, and non-contact proximity telemetry.",
            "problem": "Traditional stationary ultrasonic sensors are constrained to a narrow cone of detection (typically 15 degrees), leaving wide blind zones in automated vehicles and perimeter surveillance setups.",
            "objectives": "Construct a dynamic acoustic scanning radar that sweeps 0 to 180 degrees in azimuth, captures millimeter-resolution distance telemetry at each degree increment, and renders real-time polar sweep maps on a browser dashboard.",
            "outcome": "A fully functional azimuth-scanning acoustic radar with live polar sector visualization, collision warning tiers, and ESP8266 REST API telemetry.",
            "difficulty": "Intermediate",
            "time": "3.5 Hours",
            "prior_knowledge": "Basic micro-servo PWM operation, speed of sound physics, pulse duration timing, and voltage divider level shifting."
        },
        "principle": "The system utilizes the HC-SR04 ultrasonic transducer operating on piezo-electric resonance. The ESP8266 emits a 10µs TTL trigger pulse on GPIO5 (D1), commanding the transducer's internal 40kHz sonic burst generator to pulse eight cycles of ultrasound. Upon striking an obstacle, acoustic reflections travel back to the receiver piezo element, asserting the Echo line HIGH. The pulse duration on the Echo line is directly proportional to round-trip acoustic travel time: Distance (cm) = (Echo Time in µs) / 58.2.",
        "applications": [
            "Autonomous Mobile Robot (AMR) obstacle collision avoidance and spatial mapping.",
            "Perimeter security tripwires and intrusion vector sector surveillance.",
            "Industrial conveyor part positioning and bin clearance profiling.",
            "Automated vehicle blind-spot warning and parking bay approach detection."
        ],
        "benefits_limitations": {
            "benefits": "Unaffected by ambient optical illumination, smoke, or transparent glass; highly cost-effective; predictable linear response.",
            "limitations": "Sound absorption on soft fabrics and foam; acoustic beam divergence at wide angles; speed of sound temperature drift (~0.6 m/s per °C)."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Main controller and Wi-Fi web telemetry server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "HC-SR04 Ultrasonic Sensor", "qty": "1", "purpose": "Acoustic pulse transmitter and receiver", "spec": "40kHz resonance, 2cm–400cm range, 5V VCC", "status": "Mandatory"},
            {"component": "TowerPro SG90 Micro Servo", "qty": "1", "purpose": "180-degree azimuthal scanning actuator", "spec": "Operating voltage 4.8V–6.0V, 1.8 kg-cm torque", "status": "Mandatory"},
            {"component": "Metal-Film Resistors (1kΩ & 2kΩ)", "qty": "1 set", "purpose": "5V to 3.3V Echo signal voltage divider", "spec": "1/4W, 1% precision metal film", "status": "Mandatory"},
            {"component": "External 5V 2A DC Power Supply", "qty": "1", "purpose": "Dedicated power rail for servo actuator and sensor", "spec": "Regulated 5.0V ±5%, 2000mA capacity", "status": "Mandatory"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit assembly and bus distribution", "spec": "830 tie-point dual power rails", "status": "Mandatory"},
            {"component": "Electrolytic Decoupling Capacitor", "qty": "1", "purpose": "Servo peak current transient smoothing", "spec": "100µF to 220µF, 16V radial", "status": "Optional / Recommended"}
        ],
        "tools": "Digital Multimeter (DC volts & continuity), wire strippers, miniature screwdriver for servo horn fastening, Arduino IDE 2.x, and Google Chrome/Firefox browser.",
        "wiring": [
            {"comp": "HC-SR04 VCC", "pin": "Pin 1", "controller": "External 5V Rail (+)", "notes": "Must be powered by 5V for reliable 40kHz transducer oscillation"},
            {"comp": "HC-SR04 GND", "pin": "Pin 4", "controller": "Common Ground (-)", "notes": "Shared common reference with NodeMCU GND pin"},
            {"comp": "HC-SR04 Trig", "pin": "Pin 2", "controller": "NodeMCU D1 (GPIO 5)", "notes": "Direct connection; 3.3V logic high is recognized as valid TTL HIGH by HC-SR04"},
            {"comp": "HC-SR04 Echo", "pin": "Pin 3", "controller": "1kΩ series &rarr; D2 (GPIO 4)", "notes": "CRITICAL: Connect 1kΩ from Echo to D2, and 2kΩ from D2 to GND. Drops 5V to 3.33V"},
            {"comp": "SG90 Servo Red", "pin": "VCC", "controller": "External 5V Rail (+)", "notes": "DO NOT power servo from NodeMCU 3.3V pin (causes instant brownout)"},
            {"comp": "SG90 Servo Brown", "pin": "GND", "controller": "Common Ground (-)", "notes": "Must tie back to NodeMCU GND"},
            {"comp": "SG90 Servo Orange", "pin": "Signal", "controller": "NodeMCU D4 (GPIO 2)", "notes": "50Hz PWM output (boot-safe pullup already present onboard)"}
        ],
        "pin_config": [
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "Ultrasonic Trigger Output", "type": "Digital Output (Push-Pull)", "notes": "Fully boot-safe; emits 10µs initiation pulses."},
            {"pin": "D2", "gpio": "GPIO 4", "purpose": "Ultrasonic Echo Pulse Input", "type": "Digital Input", "notes": "Fully boot-safe; measured via pulseIn() with 30ms timeout."},
            {"pin": "D4", "gpio": "GPIO 2", "purpose": "Servo Azimuth PWM Drive", "type": "PWM Output (50Hz)", "notes": "Tied to onboard blue LED. Must be HIGH at power-up (handled by servo idle)."}
        ],
        "firmware": {
            "key_constants": "TRIG_PIN = 5; ECHO_PIN = 4; SERVO_PIN = 2; MEASURE_INTERVAL = 100ms;",
            "logic": "The sketch steps the servo from 0° to 180° in 2° increments. At each stop, it triggers an ultrasonic ping, calculates distance via pulseIn(), packages the metrics into JSON using ArduinoJson, and serves it on /api/readings. Endpoints /api/health, /api/device, and /api/command provide full system diagnostics and interactive control."
        },
        "theory": {
            "formula": "Distance (cm) = (\\Delta t \\times v_{sound}) / 2 = \\Delta t / 58.2",
            "worked_example": "If the Echo line remains HIGH for 1,164 microseconds, the measured distance is: d = 1164 / 58.2 = 20.0 cm. The round-trip travel time confirms an object located exactly 20 cm from the transducer acoustic face."
        },
        "testing": [
            {"id": "T01-01", "procedure": "Power up system with external 5V supply connected.", "expected": "ESP8266 boots, connects to Wi-Fi or starts SoftAP 'Terrascan-Radar-AP'.", "actual": ""},
            {"id": "T01-02", "procedure": "Place a rigid cardboard flat barrier at 15cm from sensor.", "expected": "Dashboard reads 15.0 cm ±0.5 cm; sector marks COLLISION_RISK alert.", "actual": ""},
            {"id": "T01-03", "procedure": "Move target barrier to 100cm away.", "expected": "Dashboard distance updates to 100cm ±2cm; sector status indicates SECTOR_CLEAR.", "actual": ""},
            {"id": "T01-04", "procedure": "Disconnect Echo wire to simulate open circuit.", "expected": "Sensor times out at 30ms; firmware defaults cleanly to 400.0cm without hang.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "ESP8266 crashes/restarts continuously", "cause": "Servo powered from NodeMCU 3.3V pin", "diag": "Measure 3.3V rail with DMM during servo sweep; dips below 2.8V", "solution": "Power SG90 from external 5V 2A rail and tie grounds together."},
            {"issue": "Distance reads fixed 400cm or 0cm", "cause": "Missing voltage divider or loose Echo wire", "diag": "Check continuity from Echo pin through 1kΩ resistor to D2", "solution": "Verify 1kΩ series and 2kΩ pull-down divider circuit."},
            {"issue": "Servo chatters and vibrates without turning", "cause": "Unstable PWM or insufficient current", "diag": "Check voltage drop on 5V external power supply rail", "solution": "Install 220µF electrolytic decoupling capacitor across servo VCC and GND."}
        ],
        "safety": "Never feed 5V directly to ESP8266 GPIO pins. Always ensure the 1kΩ/2kΩ voltage divider is verified before connecting the Echo pin to D2. Maintain common ground across power rails.",
        "outcomes": "Explain ultrasonic time-of-flight physics, implement level shifting, control PWM servo sweep, build REST API telemetry endpoints, and interpret acoustic reflection data.",
        "viva": [
            {"q": "Why is a voltage divider required on the HC-SR04 Echo pin?", "a": "The HC-SR04 outputs 5V TTL logic. ESP8266 GPIOs are rated for 3.3V max. The 1k/2k divider steps 5V down to 3.33V, preventing silicon damage."},
            {"q": "What is the physical frequency of the acoustic pulse emitted?", "a": "40 kHz, which is well above the human hearing limit (20 Hz - 20 kHz) and minimizes acoustic environmental interference."},
            {"q": "How does ambient temperature affect ultrasonic accuracy?", "a": "Speed of sound increases by approximately 0.6 m/s per °C increase in temperature. Precision systems incorporate a DHT22 to dynamically compensate."},
            {"q": "What causes acoustic specular reflection?", "a": "When an ultrasonic beam strikes a hard, smooth surface at an incident angle greater than 45 degrees, the sound bounces away rather than returning to the receiver."},
            {"q": "Why is pulseIn() given a 30ms timeout in the firmware?", "a": "Sound travels 400cm and back (800cm) in ~23.3ms. A 30ms timeout prevents the microcontroller from blocking indefinitely if an echo is lost."},
            {"q": "What is the beam angle of the HC-SR04 transducer?", "a": "Approximately 15 degrees conical. Sweeping with a servo extends detection across a full 180-degree sector."},
            {"q": "Why must external servo power share a common ground with NodeMCU?", "a": "Ground provides the 0V reference voltage for the 50Hz PWM control signal. Without common ground, the servo receives floating, corrupt PWM timing."},
            {"q": "What is the resolution of the SG90 servo sweep?", "a": "Typically 1 degree mechanically, providing 181 discrete polar measurement points across the half-circle."}
        ],
        "exercises": {
            "beginner": "Adjust the servo sweep step delay from 30ms to 60ms to observe the trade-off between scan speed and acoustic echo stabilization.",
            "intermediate": "Implement an alert buzzer on D5 that beeps at an increasing frequency as target distance drops below 20 cm.",
            "advanced": "Integrate temperature telemetry from Project 04 (DHT22) to compute dynamic speed of sound compensation in real time."
        }
    },
    {
        "id": "02",
        "folder": "02-rainwatch-ai",
        "title": "RAINWATCH AI — Rain Detection & Precipitation Gauging",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "RAINWATCH AI is an automated environmental precipitation monitoring station combining an interleaved conductive rain sensor board with an onboard LM393 dual comparator and analog ADC telemetry.",
            "problem": "Unpredictable downpours cause extensive damage to open-air agricultural produce, solar panel arrays, and open residential awnings when human response is delayed.",
            "objectives": "Construct a precipitation monitor that distinguishes dry weather, light mist, steady rain, and heavy downpours with sub-second digital alert triggering and web dashboard telemetry.",
            "outcome": "An operational precipitation detector with continuous analog resistance evaluation, instant digital interrupt warning, and Wi-Fi dashboard reporting.",
            "difficulty": "Beginner to Intermediate",
            "time": "2.0 Hours",
            "prior_knowledge": "Resistive conductivity principles, comparator threshold adjustment, and analog-to-digital conversion."
        },
        "principle": "The sensing board features parallel, interleaved copper tracks acting as an open variable resistor. In dry conditions, air gap resistance exceeds 1MΩ (ADC reads high near 3.3V). When rain droplets bridge the tracks, water acts as an electrolytic conductor, drastically reducing surface resistance down to 10kΩ–50kΩ. The LM393 comparator detects when the analog voltage falls below a user-tuned potentiometer reference, immediately pulling digital pin D8 LOW.",
        "applications": [
            "Automated rainwater harvesting valve diversion systems.",
            "Smart motorized awning, roof hatch, and skylight retraction.",
            "Precision agricultural drip-irrigation pause controllers.",
            "Solar panel surface cleansing detection and weather station logging."
        ],
        "benefits_limitations": {
            "benefits": "Immediate sub-millisecond storm detection; low cost; dual analog and digital threshold outputs.",
            "limitations": "Surface electrolytic oxidation over prolonged exposure; false readings from bird droppings; residual water droplet holdover."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Telemetry processing and Wi-Fi REST API host", "spec": "3.3V logic, ADC0 input", "status": "Mandatory"},
            {"component": "Rain Sensor Grid Board", "qty": "1", "purpose": "Precipitation collection surface", "spec": "Nickel-plated or gold-plated interleaved tracks", "status": "Mandatory"},
            {"component": "LM393 Comparator Module", "qty": "1", "purpose": "Signal amplification and adjustable threshold trigger", "spec": "Dual differential comparator with 10kΩ trimmer", "status": "Mandatory"},
            {"component": "Jumper Wires (Female-Female)", "qty": "5", "purpose": "Signal routing between sensor and controller", "spec": "20cm 26 AWG insulated", "status": "Mandatory"},
            {"component": "ADS1115 16-Bit ADC (Optional)", "qty": "1", "purpose": "High-precision 16-bit analog sampling on I2C", "spec": "I2C address 0x48, 4 single-ended channels", "status": "Optional"}
        ],
        "tools": "Precision flathead screwdriver (for LM393 trimmer adjustment), digital multimeter, dropper bottle for water testing, and Arduino IDE.",
        "wiring": [
            {"comp": "LM393 VCC", "pin": "VCC", "controller": "NodeMCU 3V3 Pin", "notes": "Power with 3.3V to ensure analog signal stays within ADC safe limits"},
            {"comp": "LM393 GND", "pin": "GND", "controller": "NodeMCU GND Pin", "notes": "Common circuit reference"},
            {"comp": "LM393 AO", "pin": "Analog Out", "controller": "NodeMCU A0 (ADC0)", "notes": "Analog voltage drops proportionally with increasing rain intensity"},
            {"comp": "LM393 DO", "pin": "Digital Out", "controller": "NodeMCU D8 (GPIO 15)", "notes": "Active-LOW digital rain trigger (internal 10k pull-down on D8)"},
            {"comp": "Grid Sensor Pins", "pin": "2-Pin Header", "controller": "LM393 2-Pin Input", "notes": "Polarity agnostic; connect via 2-wire ribbon cable"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "Precipitation Intensity Analog Reading", "type": "Analog Input (0–3.3V)", "notes": "Mapped to percentage: 1023 (0% Dry) to 200 (100% Torrential)."},
            {"pin": "D8", "gpio": "GPIO 15", "purpose": "Instant Rain Trigger Interrupt", "type": "Digital Input", "notes": "Must be LOW at boot! DO pin stays HIGH via pullup until water bridges grid."}
        ],
        "firmware": {
            "key_constants": "RAIN_AO = A0; RAIN_DO = 15; READ_INTERVAL = 250ms;",
            "logic": "Samples A0 every 250ms, inverts the reading into Rain Intensity (0-100%), evaluates tier ('DRY', 'LIGHT_MIST', 'MODERATE_RAIN', 'HEAVY_STORM'), and responds via REST API endpoints /api/readings, /api/health, and /api/device."
        },
        "theory": {
            "formula": "Intensity (\\%) = \\left(1.0 - \\frac{V_{ADC}}{V_{dry}}\\right) \\times 100",
            "worked_example": "If dry baseline ADC reading is 1023 (3.3V) and rain droplets reduce the analog reading to 410 (1.32V), the calculated rain intensity is: ((1023 - 410) / 1023) * 100 = 59.9% (Moderate Rain)."
        },
        "testing": [
            {"id": "T02-01", "procedure": "Inspect sensor board in dry ambient air.", "expected": "Dashboard indicates 0% Intensity, status DRY, DO pin HIGH.", "actual": ""},
            {"id": "T02-02", "procedure": "Deposit 2 drops of clean water onto the grid surface.", "expected": "Intensity jumps to 20%–40%, status LIGHT_MIST, digital trigger trips.", "actual": ""},
            {"id": "T02-03", "procedure": "Submerge lower half of tracks with water film.", "expected": "Intensity exceeds 80%, status HEAVY_STORM, dashboard warning sounds.", "actual": ""},
            {"id": "T02-04", "procedure": "Wipe grid completely dry with lint-free microfiber cloth.", "expected": "Reading restores smoothly back to 0% within 3 seconds.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Sensor always reads 100% rain even when dry", "cause": "Residue or water bridging between PCB traces", "diag": "Inspect board under magnifying lens for solder bridges or mineral buildup", "solution": "Clean surface with isopropyl alcohol (IPA) and dry thoroughly."},
            {"issue": "Digital DO pin never trips", "cause": "Comparator threshold trimmer set too high", "diag": "Check voltage at LM393 pin 2 with multimeter while turning trimmer", "solution": "Turn potentiometer clockwise until onboard indicator LED just turns off."},
            {"issue": "NodeMCU fails to boot when sensor connected", "cause": "D8 (GPIO 15) pulled HIGH by LM393 at boot", "diag": "Disconnect D8 wire and check if NodeMCU boots normally", "solution": "Ensure LM393 digital out is configured correctly or move digital signal to D5."}
        ],
        "safety": "Keep water droplets strictly confined to the sensing grid plate. Never allow moisture to spill onto the LM393 electronic amplifier module or NodeMCU microcontroller board.",
        "outcomes": "Demonstrate understanding of electrolytic conduction, LM393 comparator circuits, analog signal inversion, hysteresis tuning, and threshold alert automation.",
        "viva": [
            {"q": "What is the role of the LM393 module in this project?", "a": "It compares the analog voltage from the rain grid against an adjustable reference voltage, producing a crisp digital LOW/HIGH switching signal."},
            {"q": "Why does rain reduce resistance across the PCB tracks?", "a": "Pure rainwater contains dissolved minerals and atmospheric ions that create a conductive electrolyte bridging the positive and negative nickel tracks."},
            {"q": "How can electrochemical corrosion of the rain plate be minimized?", "a": "Power the sensing grid through a GPIO pin only during measurement pulses rather than providing continuous 3.3V DC current."},
            {"q": "What is the resolution of the ESP8266 onboard ADC?", "a": "10 bits, providing 1024 discrete quantization steps between 0V and 3.3V (~3.22 mV per step)."},
            {"q": "Why is the digital signal on D8 active-LOW?", "a": "When rain falls, the analog voltage drops below reference, driving the LM393 open-collector output to ground (LOW)."},
            {"q": "What is the benefit of gold plating over nickel plating on the sensor board?", "a": "Gold (ENIG) does not oxidize or tarnish when exposed to moisture and oxygen, extending operating lifespan by years."},
            {"q": "How does the software filter out false rain spikes from vibrations?", "a": "By requiring 3 consecutive readings below threshold before confirming a rain alert state (temporal debouncing)."},
            {"q": "Can this sensor measure rainfall depth in millimeters?", "a": "No, it detects the presence and instantaneous surface coverage of precipitation, not volumetric accumulation (which requires a tipping-bucket rain gauge)."}
        ],
        "exercises": {
            "beginner": "Modify the status evaluation thresholds in the firmware to classify rain into 5 distinct categories.",
            "intermediate": "Add a servo-controlled wiper motor that clears the sensor plate every 60 seconds to detect when rain has stopped.",
            "advanced": "Implement an automated MQTT alert message that transmits a storm warning payload to a Home Assistant server."
        }
    },
    {
        "id": "03",
        "folder": "03-terraiq",
        "title": "TerraIQ — Capacitive Soil Moisture Monitoring",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "TerraIQ is a precision agricultural soil moisture instrumentation system utilizing a capacitive dielectric sensor probe (v1.2) to measure soil volumetric water content without electrode corrosion.",
            "problem": "Traditional resistive soil probes suffer rapid galvanic corrosion and copper dissolution within days due to DC electrolysis in wet soil, causing frequent sensor failure.",
            "objectives": "Construct a maintenance-free soil hydration monitoring probe that measures soil dielectric permittivity, isolates copper tracks with solder mask, and transmits real-time hydration curves to a cloud lab dashboard.",
            "outcome": "A corrosion-free soil monitoring station delivering calibrated moisture percentage (0–100%) and irrigation status alerts.",
            "difficulty": "Beginner",
            "time": "1.5 Hours",
            "prior_knowledge": "Dielectric permittivity, analog signal calibration (dry vs saturated air), and plant water stress points."
        },
        "principle": "The capacitive probe incorporates a TLC555 timer generating a high-frequency (~1.5 MHz) square wave into a planar capacitor formed by PCB ground and sensor planes. Soil acts as the dielectric medium. Dry air has a dielectric constant (relative permittivity) of ~1, whereas liquid water has a permittivity of ~80. As soil moisture increases, sensor capacitance rises proportionally: C = (\\varepsilon_r \\varepsilon_0 A) / d. Increased capacitance reduces the output analog DC voltage (inverted relationship: Dry ~2.8V, Wet ~1.2V).",
        "applications": [
            "Precision automated greenhouse drip and mist irrigation.",
            "Smart municipal landscaping and park hydration scheduling.",
            "Drought stress early warning and soil moisture retention analysis.",
            "Indoor potted plant moisture monitoring and automated plant care."
        ],
        "benefits_limitations": {
            "benefits": "Zero exposed metal electrodes; no galvanic oxidation; immune to modest soil salinity; long operational life.",
            "limitations": "Readings vary slightly across different soil textures (sand vs clay vs peat); non-linear output response near saturation."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller and Wi-Fi telemetry station", "spec": "3.3V logic, A0 analog input", "status": "Mandatory"},
            {"component": "Capacitive Soil Probe v1.2", "qty": "1", "purpose": "Dielectric soil moisture transducer", "spec": "Operating voltage 3.3V, analog output 1.2V–3.0V", "status": "Mandatory"},
            {"component": "3-Pin JST Connector Cable", "qty": "1", "purpose": "Waterproof probe interconnect", "spec": "VCC, GND, AOUT color-coded", "status": "Mandatory"},
            {"component": "Moisture Calibration Sample Cups", "qty": "2", "purpose": "Bench calibration (1 dry air, 1 cup of water)", "spec": "Plastic 100mL cups", "status": "Mandatory"}
        ],
        "tools": "Digital multimeter, soil sample containers, ruler for insertion depth marking, and Arduino IDE.",
        "wiring": [
            {"comp": "Capacitive Probe VCC", "pin": "Red Wire", "controller": "NodeMCU 3V3 Pin", "notes": "Operate strictly on 3.3V to ensure output does not exceed A0 3.3V limit"},
            {"comp": "Capacitive Probe GND", "pin": "Black Wire", "controller": "NodeMCU GND Pin", "notes": "Common ground reference"},
            {"comp": "Capacitive Probe AOUT", "pin": "Yellow/White", "controller": "NodeMCU A0 (ADC0)", "notes": "Analog signal: Dry ~820 ADC counts, Saturated ~380 ADC counts"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "Capacitive Analog Voltage Reading", "type": "Analog Input (0–3.3V)", "notes": "Inverted transfer function: Higher water content yields LOWER analog voltage."}
        ],
        "firmware": {
            "key_constants": "SOIL_PIN = A0; DRY_CALIBRATION = 820; WET_CALIBRATION = 380;",
            "logic": "Reads A0 with a 16-sample moving average filter, computes moisture percentage via linear interpolation between calibrated dry/wet thresholds, constrains values to 0-100%, and publishes JSON via /api/readings."
        },
        "theory": {
            "formula": "Moisture (\\%) = \\left( \\frac{ADC_{dry} - ADC_{raw}}{ADC_{dry} - ADC_{wet}} \\right) \\times 100",
            "worked_example": "With bench calibration of ADC_dry = 820 (in air) and ADC_wet = 380 (submerged in water): an in-soil reading of ADC_raw = 600 yields: ((820 - 600) / (820 - 380)) * 100 = (220 / 440) * 100 = 50.0% Volumetric Water Content."
        },
        "testing": [
            {"id": "T03-01", "procedure": "Hold probe completely dry in open ambient air.", "expected": "Moisture percentage reads 0.0% (±1.0%), status ARID / DRY.", "actual": ""},
            {"id": "T03-02", "procedure": "Insert probe blade into moist garden soil up to white line.", "expected": "Moisture percentage displays 45%–65%, status OPTIMAL.", "actual": ""},
            {"id": "T03-03", "procedure": "Submerge probe blade up to white line in water cup.", "expected": "Moisture percentage displays 98%–100%, status SATURATED.", "actual": ""},
            {"id": "T03-04", "procedure": "Observe reading over 15 minutes in steady soil.", "expected": "Telemetry variation remains within ±0.5% (smooth moving average).", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Reading jumps erratically between 0% and 100%", "cause": "Loose ground wire or unshielded long cable", "diag": "Check resistance between probe GND and NodeMCU GND with DMM", "solution": "Ensure clean soldered ground connection and twist signal wires."},
            {"issue": "Moisture percentage reads negative or exceeds 100%", "cause": "Soil salinity or sensor variance outside calibration constants", "diag": "Read raw ADC counts in air and in pure water via Serial monitor", "solution": "Update DRY_CALIBRATION and WET_CALIBRATION constants in firmware."},
            {"issue": "Sensor stops responding after several weeks", "cause": "Water penetration into top electronics/components of probe", "diag": "Inspect top circuit board of probe for water condensation", "solution": "Coat the top electronics header with conformal silicone sealant."}
        ],
        "safety": "Do not submerge the top white circuit components or cable joint into soil or water. Only the lower PCB blade below the white silk-screen line is waterproof.",
        "outcomes": "Explain dielectric constant measurement, perform multi-point calibration, eliminate electrochemical corrosion in sensors, and compute volumetric moisture percentages.",
        "viva": [
            {"q": "Why do capacitive sensors outlast resistive soil probes?", "a": "Resistive sensors pass DC electrical current directly through exposed copper traces, causing fast galvanic corrosion. Capacitive probes insulate electrodes under a protective solder mask layer."},
            {"q": "What is the relative permittivity of dry air versus water?", "a": "Air has a relative permittivity of approximately 1, while pure water is approximately 80 at 20°C."},
            {"q": "Why is high-frequency excitation used in capacitive soil sensors?", "a": "Frequencies above 1 MHz minimize the effect of soil electrical conductivity and salt ions, making the reading dependent strictly on water dielectric properties."},
            {"q": "What happens if the probe is inserted deeper than the maximum line?", "a": "The onboard oscillator circuit and components get wet, causing short circuits and permanent sensor failure."},
            {"q": "How does soil compaction affect capacitive readings?", "a": "Higher compaction reduces air voids and increases contact density, resulting in slightly higher dielectric readings for the same moisture volume."},
            {"q": "What is field capacity in soil science?", "a": "The maximum amount of water soil can hold against the pull of gravity, typically between 25% and 40% volumetric moisture."},
            {"q": "What is the permanent wilting point (PWP)?", "a": "The minimum soil moisture level at which plants can no longer extract water, typically below 10%–15% moisture."},
            {"q": "Why is oversampling / moving averaging used in the firmware?", "a": "High-frequency soil probes pick up minor RF noise; a 16-sample moving average smooths the analog curve for stable automation control."}
        ],
        "exercises": {
            "beginner": "Perform calibration with 3 cups of different soil types (sandy soil, garden loam, potting mix) and record the raw ADC values.",
            "intermediate": "Add an LED indicator on D1 that illuminates red when moisture drops below 25% (irrigation needed) and green when above 40%.",
            "advanced": "Implement deep-sleep mode on the ESP8266 where it wakes up for 2 seconds every 10 minutes to log soil moisture, cutting power consumption by 98%."
        }
    },
    {
        "id": "04",
        "folder": "04-atmos-ai",
        "title": "ATMOS AI — Temperature & Humidity Climate Station",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "ATMOS AI is an environmental climate telemetry station employing the DHT22 (AM2302) digital capacitive humidity and NTC thermistor sensor to track atmospheric thermal comfort and compute the human Heat Index.",
            "problem": "Unmonitored temperature and humidity extremes compromise server room reliability, agricultural crop storage, and workplace productivity while increasing heat exhaustion risks.",
            "objectives": "Develop a precision atmospheric monitor that measures ambient temperature (-40°C to +80°C) and relative humidity (0% to 100% RH), computes the Rothfusz Heat Index, and classifies ASHRAE thermal comfort tiers.",
            "outcome": "A calibrated climate station providing dual live radial gauges, ASHRAE thermal classification, and ESP8266 Wi-Fi telemetry.",
            "difficulty": "Beginner",
            "time": "2.0 Hours",
            "prior_knowledge": "Single-bus digital communication, relative humidity concepts, and psychrometric comfort charts."
        },
        "principle": "The DHT22 encapsulates a capacitive humidity sensing element, an NTC thermistor, and an 8-bit custom signal-processing microcontroller. When queried by the host pulling the single data line LOW for 1–10ms, the DHT22 returns a 40-bit serial packet: 16 bits of humidity data (resolution 0.1% RH), 16 bits of temperature data (resolution 0.1°C), and an 8-bit parity checksum. The digital transmission eliminates analog ADC noise over long wire runs.",
        "applications": [
            "Data center server rack thermal monitoring and HVAC regulation.",
            "Greenhouse environmental control and humidity venting.",
            "Pharmaceutical medicine cold-chain storage logging.",
            "Occupational heat stress monitoring in industrial factory floors."
        ],
        "benefits_limitations": {
            "benefits": "Factory calibrated digital output; long-distance signal transmission (up to 20m); high humidity resolution (0.1% RH); wide thermal range.",
            "limitations": "Slow sampling rate (maximum 0.5 Hz / 2-second interval); thermal mass creates response latency in rapidly changing air currents."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Processor and Wi-Fi Web Server", "spec": "3.3V logic, GPIO2/13 interrupt capable", "status": "Mandatory"},
            {"component": "DHT22 / AM2302 Sensor", "qty": "1", "purpose": "Digital temperature and relative humidity transducer", "spec": "Temp: -40 to 80°C ±0.5°C; RH: 0–100% ±2% RH", "status": "Mandatory"},
            {"component": "Metal-Film Pull-Up Resistor (4.7kΩ)", "qty": "1", "purpose": "Single-bus open-drain line pull-up", "spec": "1/4W 1% metal film (between Data and 3.3V)", "status": "Mandatory"},
            {"component": "Breadboard & Jumper Wires", "qty": "1 set", "purpose": "Circuit interconnects", "spec": "20cm insulated DuPont wires", "status": "Mandatory"}
        ],
        "tools": "Digital multimeter, Arduino IDE with DHT sensor library installed, and Google Chrome browser.",
        "wiring": [
            {"comp": "DHT22 Pin 1 (VCC)", "pin": "Pin 1", "controller": "NodeMCU 3V3 Pin", "notes": "Operates safely between 3.3V and 5.0V DC"},
            {"comp": "DHT22 Pin 2 (Data)", "pin": "Pin 2", "controller": "NodeMCU D4 (GPIO 2)", "notes": "Single-wire bidirectional bus. Must install 4.7kΩ resistor between Pin 1 and Pin 2"},
            {"comp": "DHT22 Pin 3 (NC)", "pin": "Pin 3", "controller": "No Connection", "notes": "Leave floating / unconnected"},
            {"comp": "DHT22 Pin 4 (GND)", "pin": "Pin 4", "controller": "NodeMCU GND Pin", "notes": "Common ground reference"}
        ],
        "pin_config": [
            {"pin": "D4", "gpio": "GPIO 2", "purpose": "DHT22 Bidirectional Data Bus", "type": "Digital Input / Output with Pull-Up", "notes": "Tied to onboard blue LED. High at boot required (4.7k pullup ensures safe startup)."}
        ],
        "firmware": {
            "key_constants": "DHTPIN = 2; DHTTYPE = DHT22; INTERVAL_MS = 2000;",
            "logic": "Queries sensor every 2 seconds via DHT library, validates 8-bit checksum, calculates heat index using the Rothfusz polynomial formula, evaluates ASHRAE comfort tier, and serves JSON on /api/readings."
        },
        "theory": {
            "formula": "HI = -42.379 + 2.04901523 T + 10.14333127 R - 0.22475541 T R - 6.83783 \\times 10^{-3} T^2 - 5.481717 \\times 10^{-2} R^2 + 1.22874 \\times 10^{-3} T^2 R + 8.5282 \\times 10^{-4} T R^2 - 1.99 \\times 10^{-6} T^2 R^2",
            "worked_example": "At ambient temperature T = 32°C (89.6°F) and relative humidity R = 75%, the calculated Heat Index reaches 43.1°C (109.6°F). This triggers the 'DANGER: Heat Exhaustion Likely' classification."
        },
        "testing": [
            {"id": "T04-01", "procedure": "Power up system in normal room environment (24°C, 50% RH).", "expected": "Readings stabilize within 4 seconds; temperature matches room thermometer ±0.5°C.", "actual": ""},
            {"id": "T04-02", "procedure": "Gently exhale warm breath onto sensor face for 5 seconds.", "expected": "Humidity immediately spikes to 85%–95%; temperature rises by 1°C–2°C.", "actual": ""},
            {"id": "T04-03", "procedure": "Disconnect data wire while system runs.", "expected": "Firmware handles NaN gracefully, displays SENSOR_OFFLINE alert, and retries.", "actual": ""},
            {"id": "T04-04", "procedure": "Observe polling rate over 1 minute.", "expected": "Readings update precisely every 2.0 seconds without sensor self-heating.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Readings consistently display 'nan' (Not a Number)", "cause": "Missing 4.7kΩ pull-up resistor or incorrect GPIO assignment", "diag": "Check voltage on Data pin with DMM; should sit near 3.3V when idle", "solution": "Install 4.7kΩ pull-up between VCC and Data pin."},
            {"issue": "Temperature reads 2°C–3°C higher than ambient", "cause": "Sensor queried too frequently, causing internal self-heating", "diag": "Check loop sampling interval in firmware code", "solution": "Ensure query interval is at least 2000ms (0.5Hz max for DHT22)."},
            {"issue": "NodeMCU fails to boot when DHT22 connected", "cause": "Data pin pulled to ground at bootup", "diag": "Check if GPIO 2 or GPIO 0 is grounded during power-on", "solution": "Ensure 4.7k pull-up resistor is connected to 3.3V rail."}
        ],
        "safety": "Do not expose the sensor mesh to condensing liquids, organic solvents, or direct flame. Thermal self-heating occurs if read more frequently than every 2 seconds.",
        "outcomes": "Master single-bus digital communication protocols, implement multi-bit packet checksum verification, calculate psychrometric Heat Index, and evaluate comfort criteria.",
        "viva": [
            {"q": "How does the DHT22 transmit 40 bits of data on a single wire?", "a": "It uses pulse-width modulation timing: after a start pulse, each bit begins with a 50µs LOW, followed by a HIGH pulse. A 26–28µs HIGH represents '0', while a 70µs HIGH represents '1'."},
            {"q": "What is the difference between DHT11 and DHT22?", "a": "DHT22 has double the thermal range (-40 to 80°C vs 0 to 50°C), higher accuracy (±0.5°C vs ±2°C), and 10x higher humidity resolution (0.1% RH vs 1% RH)."},
            {"q": "What is the formula used to verify data integrity?", "a": "Checksum = (Byte1 + Byte2 + Byte3 + Byte4) & 0xFF. If the sum does not match Byte 5, the packet is discarded."},
            {"q": "What is relative humidity (RH)?", "a": "The ratio of the partial pressure of water vapor in the air to the equilibrium vapor pressure of water at a given temperature, expressed as a percentage."},
            {"q": "Why is the Heat Index higher than actual temperature in humid conditions?", "a": "High humidity slows down the evaporation of sweat from human skin, impairing the body's natural cooling mechanism and making it feel much hotter."},
            {"q": "Why is a 4.7k pull-up resistor required on the data line?", "a": "The data line is open-drain: neither the sensor nor the microcontroller actively drives it HIGH; the resistor pulls it to 3.3V when devices release the line."},
            {"q": "What is the maximum wire length recommended for DHT22?", "a": "Up to 20 meters with a shielded cable and 4.7k pull-up; longer runs require 1k–2k pull-up to overcome parasitic wire capacitance."},
            {"q": "What causes thermal lag in DHT22?", "a": "The physical plastic casing and thermal mass of the internal thermistor require time to reach thermal equilibrium with ambient air."}
        ],
        "exercises": {
            "beginner": "Add a temperature unit conversion toggle in the web dashboard between Celsius (°C) and Fahrenheit (°F).",
            "intermediate": "Log temperature and humidity readings every 10 seconds into a local browser CSV array for historical chart rendering.",
            "advanced": "Implement the Magnus-Tetens approximation formula in firmware to compute and display the atmospheric Dew Point temperature."
        }
    },
    {
        "id": "05",
        "folder": "05-smart-air-quality-monitor",
        "title": "Smart Air Quality Monitor — Hazardous Gas & Vapor Telemetry",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The Smart Air Quality Monitor is an environmental safety instrument employing an MQ-135 tin dioxide (SnO2) semiconductor transducer to detect airborne contaminants including ammonia (NH3), nitrogen oxides (NOx), alcohol vapors, benzene, carbon dioxide, and smoke.",
            "problem": "Poor Indoor Air Quality (IAQ) caused by volatile chemical vapors and inadequate ventilation leads to respiratory illness, 'sick building syndrome', and impaired cognitive performance.",
            "objectives": "Construct a continuous air quality monitor that samples ambient gas concentrations, converts sensor resistance into parts-per-million (PPM) estimates, and streams air tier metrics to a dashboard.",
            "outcome": "A calibrated air quality station providing real-time air tier classification (Good, Moderate, Unhealthy, Hazardous) with warm-up timer protection.",
            "difficulty": "Intermediate",
            "time": "2.5 Hours",
            "prior_knowledge": "Gas sensor heating physics, baseline resistance (R0) calibration, and non-linear logarithmic curve fitting."
        },
        "principle": "The MQ-135 utilizes a micro-ceramic tube coated with tin dioxide (SnO2) heated to ~300°C by an internal 5V heating coil. In clean air, oxygen molecules adsorb onto the SnO2 crystal boundary, trapping conduction electrons and creating a high electrical resistance. When reducing gases (CO2, NH3, benzene) contact the heated surface, they react with adsorbed oxygen ions, releasing electrons back into the semiconductor conduction band and drastically reducing sensor resistance (Rs). The ratio Rs/R0 is mapped via a power-law formula: PPM = a \\times (R_s / R_0)^b.",
        "applications": [
            "Smart HVAC automated fresh air damper and ventilation modulation.",
            "Industrial chemical storage leak detection and solvent monitoring.",
            "Classroom and commercial office carbon dioxide accumulation tracking.",
            "Automotive cabin air purification automation."
        ],
        "benefits_limitations": {
            "benefits": "High sensitivity to broad-spectrum hazardous gases; rugged physical build; analog output compatible with ADC; long service life.",
            "limitations": "Cross-sensitivity across multiple gas species (cannot distinguish pure CO2 from ammonia); requires 5V 150mA continuous heater power; 24h burn-in time."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller and Wi-Fi Web Server", "spec": "3.3V logic, ADC0 input", "status": "Mandatory"},
            {"component": "MQ-135 Gas Sensor Module", "qty": "1", "purpose": "Air contaminant gas transducer", "spec": "Heater voltage 5.0V ±0.2V, 150mA; 10ppm–1000ppm detection", "status": "Mandatory"},
            {"component": "External 5V 1A DC Regulated Supply", "qty": "1", "purpose": "Heater coil power rail", "spec": "5.0V regulated, 1000mA capacity", "status": "Mandatory"},
            {"component": "Load Resistor (RL)", "qty": "1", "purpose": "Voltage divider circuit", "spec": "10kΩ to 47kΩ (usually integrated on module)", "status": "Mandatory"},
            {"component": "ADS1115 16-Bit ADC (Optional)", "qty": "1", "purpose": "High-precision sampling without NodeMCU ADC attenuation", "spec": "I2C 0x48, 4 channels", "status": "Optional"}
        ],
        "tools": "Digital multimeter, regulated 5V power supply, stopwatch for preheating, and Arduino IDE.",
        "wiring": [
            {"comp": "MQ-135 VCC", "pin": "VCC", "controller": "External 5V Rail (+)", "notes": "MANDATORY: Must use 5V rail; heater will not reach operating temperature on 3.3V"},
            {"comp": "MQ-135 GND", "pin": "GND", "controller": "Common Ground (-)", "notes": "Must tie to NodeMCU GND for signal reference"},
            {"comp": "MQ-135 AOUT", "pin": "Analog Out", "controller": "NodeMCU A0 (ADC0)", "notes": "Analog voltage output (0.1V to 3.0V). Ensure load resistor stays under 3.3V"},
            {"comp": "MQ-135 DOUT", "pin": "Digital Out", "controller": "NodeMCU D8 (GPIO 15)", "notes": "Active-LOW comparator threshold alarm output"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "Analog Gas Concentration Signal", "type": "Analog Input (0–3.3V)", "notes": "Sampled every 200ms with moving average filter to eliminate heater thermal noise."}
        ],
        "firmware": {
            "key_constants": "MQ_PIN = A0; RLOAD = 10.0; R0_CLEAN_AIR = 76.63; WARMUP_SECS = 20;",
            "logic": "Implements a non-blocking 20-second startup warmup timer during which sensor diagnostics run. Computes Rs from ADC reading, calculates Rs/R0 ratio, maps to PPM via curve coefficients (a=110.47, b=-2.862), and broadcasts data over /api/readings."
        },
        "theory": {
            "formula": "R_s = R_L \\times \\left( \\frac{V_{in} - V_{out}}{V_{out}} \\right), \\quad \\text{PPM} = a \\times \\left(\\frac{R_s}{R_0}\\right)^b",
            "worked_example": "If load resistor RL = 10kΩ, sensor output Vout = 1.65V (half of 3.3V), then Rs = 10k * ((3.3 - 1.65) / 1.65) = 10.0kΩ. With calibrated R0 = 10.0kΩ (Rs/R0 = 1.0), the formula yields PPM = 110.5 PPM (Moderate Air Quality)."
        },
        "testing": [
            {"id": "T05-01", "procedure": "Power up system and observe preheating countdown.", "expected": "Dashboard displays 'PREHEATING (20s)' status; heater barrel gets warm to touch.", "actual": ""},
            {"id": "T05-02", "procedure": "Expose sensor to clean outdoor ambient air.", "expected": "Reading stabilizes between 40 PPM and 120 PPM, status EXCELLENT / GOOD.", "actual": ""},
            {"id": "T05-03", "procedure": "Introduce mild alcohol vapor (rubbing alcohol wipe 5cm away).", "expected": "Analog voltage rises sharply within 1.5s; reading spikes above 300 PPM, status HAZARDOUS.", "actual": ""},
            {"id": "T05-04", "procedure": "Remove vapor source and allow air circulation.", "expected": "Sensor resistance recovers back toward baseline within 60 to 90 seconds.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Sensor body stays cold and reads 0 PPM", "cause": "Heater coil not receiving 5V power", "diag": "Measure voltage across MQ-135 VCC and GND pins with DMM; must be 5.0V ±0.2V", "solution": "Connect VCC to external 5V regulated supply, not NodeMCU 3.3V pin."},
            {"issue": "Readings drift constantly without stabilizing", "cause": "Sensor not burned in or cold ambient drafts", "diag": "Check sensor operational history (new MQ sensors require 24–48 hours initial burn-in)", "solution": "Leave sensor powered continuously for 24 hours to stabilize tin dioxide surface."},
            {"issue": "Analog reading exceeds 3.3V and damages A0", "cause": "Module powered from 5V with high load resistor RL", "diag": "Measure max AOUT voltage with DMM in concentrated gas", "solution": "Add a 10kΩ/20kΩ voltage divider on AOUT pin or reduce RL trimmer."}
        ],
        "safety": "The MQ-135 internal heater reaches ~300°C and the metal mesh casing gets warm. Never use near flammable aerosol sprays or explosive gas leaks during bench testing. Maintain adequate ventilation.",
        "outcomes": "Understand metal-oxide semiconductor gas detection mechanisms, compute sensor resistance ratios, perform baseline R0 calibration, and build air tier classification algorithms.",
        "viva": [
            {"q": "What is the primary sensing material inside the MQ-135?", "a": "Tin Dioxide (SnO2), an n-type metal-oxide semiconductor."},
            {"q": "Why does the sensor require an internal heating element?", "a": "The adsorption and desorption of oxygen ions and chemical reaction with target gases only occur efficiently at elevated temperatures (~300°C)."},
            {"q": "What is R0 in the context of MQ sensors?", "a": "The baseline sensor resistance measured in clean air under standard temperature (20°C) and humidity (65% RH)."},
            {"q": "Why is the MQ-135 cross-sensitive to alcohol vapors?", "a": "SnO2 reacts with any reducing gas that can be oxidized by surface oxygen ions. It cannot distinguish between alcohol molecules, benzene, and carbon dioxide."},
            {"q": "What is the typical heater resistance and power consumption?", "a": "Heater resistance is approximately 33Ω ±3Ω, drawing ~150mA at 5V (~750mW power)."},
            {"q": "Why can the sensor not be powered from the NodeMCU 3.3V pin?", "a": "The onboard 3.3V regulator cannot supply the 150mA continuous heater current without overheating or dropping the logic rail voltage."},
            {"q": "What does a 24-hour burn-in period achieve?", "a": "It burns off chemical residues, atmospheric moisture, and manufacturing impurities from the SnO2 layer, stabilizing the crystalline boundary resistance."},
            {"q": "How does relative humidity affect MQ-135 readings?", "a": "High humidity decreases sensor resistance by competing with oxygen for adsorption sites, causing artificially elevated gas readings unless compensated."}
        ],
        "exercises": {
            "beginner": "Modify the alert tier thresholds in the web dashboard so that UNHEALTHY air triggers at 200 PPM instead of 300 PPM.",
            "intermediate": "Add temperature and humidity compensation using Project 04 (DHT22) data based on the manufacturer's Rs/R0 correction curve.",
            "advanced": "Implement an automated baseline self-calibration routine that updates R0 based on the lowest observed resistance over a rolling 7-day period."
        }
    },
    {
        "id": "06",
        "folder": "06-gas-leakage-detector",
        "title": "Gas Leakage Detector — Flammable Hydrocarbon Safety System",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The Gas Leakage Detector is an industrial and domestic safety apparatus utilizing an MQ-2 electrochemical tin-dioxide transducer to detect combustible hydrocarbons including Liquefied Petroleum Gas (LPG), propane, methane (natural gas), butane, and hydrogen.",
            "problem": "Undetected combustible gas leaks in domestic kitchens, commercial boiler rooms, and industrial pipelines lead to catastrophic explosions, severe fires, and loss of life.",
            "objectives": "Construct a high-reliability combustible gas detector that monitors lower explosive limit (LEL) percentages, sounds an immediate hardware buzzer alarm upon threshold breach, and transmits telemetry to a remote emergency dashboard.",
            "outcome": "An operational gas alert system with millisecond acoustic alarm trip, visual emergency flashing, and ESP8266 REST API incident logging.",
            "difficulty": "Intermediate",
            "time": "2.5 Hours",
            "prior_knowledge": "Combustible gas safety standards, lower explosive limit (LEL) concepts, transistor switching, and buzzer driver circuits."
        },
        "principle": "The MQ-2 sensor's SnO2 sensing layer is sensitive to combustible hydrocarbons. In clean air, adsorbed oxygen forms an electron depletion layer. When combustible gas molecules diffuse into the sensor, they undergo catalytic oxidation with the oxygen ions: 2C_3H_8 + 10O^- \\rightarrow 6CO_2 + 8H_2O + 10e^-. The liberated electrons collapse the depletion barrier, causing a sharp drop in electrical resistance Rs. A comparator or microcontroller ADC measures the voltage across an in-series load resistor RL, triggering acoustic and optical alarms when gas concentration exceeds 20% of the Lower Explosive Limit (LEL).",
        "applications": [
            "Domestic kitchen LPG cylinder and pipeline leakage detection.",
            "Commercial restaurant kitchen safety interlock and gas shutoff valve trigger.",
            "Compressed Natural Gas (CNG) vehicle refueling station monitoring.",
            "Industrial chemical synthesis and flammable solvent storage bays."
        ],
        "benefits_limitations": {
            "benefits": "Fast response time (<10 seconds); high sensitivity to LPG and propane; rugged metal mesh arrestor prevents internal ignition.",
            "limitations": "Cross-sensitivity to harmless alcohol vapors or cigarette smoke; requires 5V 150mA continuous heater current; not intrinsically safe for Class 1 Div 1 zones without certified enclosure."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller and Wi-Fi emergency broadcaster", "spec": "3.3V logic, A0 analog input", "status": "Mandatory"},
            {"component": "MQ-2 Combustible Gas Sensor", "qty": "1", "purpose": "Hydrocarbon gas detection element", "spec": "300ppm–10000ppm detection; 5V VCC, 150mA heater", "status": "Mandatory"},
            {"component": "Active Piezo Buzzer (5V)", "qty": "1", "purpose": "High-decibel local acoustic evacuation siren", "spec": "85dB @ 10cm, 5V DC, 2.3kHz tone", "status": "Mandatory"},
            {"component": "2N2222 NPN Transistor", "qty": "1", "purpose": "Buzzer current driver", "spec": "TO-92, 40V, 800mA max, hFE > 100", "status": "Mandatory"},
            {"component": "Resistors (1kΩ, 10kΩ)", "qty": "2", "purpose": "Transistor base drive and pull-down", "spec": "1/4W 5% carbon film", "status": "Mandatory"},
            {"component": "High-Brightness Red LED", "qty": "1", "purpose": "Visual emergency strobe indicator", "spec": "5mm, 20mA, 2.0V forward voltage", "status": "Mandatory"},
            {"component": "External 5V 2A Power Supply", "qty": "1", "purpose": "Sensor heater and siren power supply", "spec": "Regulated 5.0V ±5%, 2000mA", "status": "Mandatory"}
        ],
        "tools": "Digital multimeter, wire strippers, breadboard, lighter (gas only, do not ignite flame) for bench bump testing, and Arduino IDE.",
        "wiring": [
            {"comp": "MQ-2 VCC", "pin": "Pin 1", "controller": "External 5V Rail (+)", "notes": "Heater requires dedicated 5V rail; never power from NodeMCU 3.3V"},
            {"comp": "MQ-2 GND", "pin": "Pin 2", "controller": "Common Ground (-)", "notes": "Shared circuit ground reference"},
            {"comp": "MQ-2 AOUT", "pin": "Pin 4", "controller": "NodeMCU A0 (ADC0)", "notes": "Analog gas reading scaled 0–3.3V via module load resistor"},
            {"comp": "MQ-2 DOUT", "pin": "Pin 3", "controller": "NodeMCU D8 (GPIO 15)", "notes": "Active-LOW digital comparator alarm trip"},
            {"comp": "2N2222 Base", "pin": "Base (Pin 2)", "controller": "1kΩ resistor &rarr; NodeMCU D5 (GPIO 14)", "notes": "Microcontroller drives base HIGH to turn on siren"},
            {"comp": "2N2222 Emitter", "pin": "Emitter (Pin 1)", "controller": "Common Ground (-)", "notes": "Direct to ground"},
            {"comp": "2N2222 Collector", "pin": "Collector (Pin 3)", "controller": "Buzzer Negative (-)", "notes": "Buzzer Positive (+) connects to External 5V rail"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "LPG / Hydrocarbon Analog Concentration", "type": "Analog Input (0–3.3V)", "notes": "Analog voltage proportional to gas volume."},
            {"pin": "D5", "gpio": "GPIO 14", "purpose": "Active Siren / Alarm Driver", "type": "Digital Output (Active-HIGH)", "notes": "Switches 2N2222 transistor to sound 85dB piezo siren."},
            {"pin": "D8", "gpio": "GPIO 15", "purpose": "Hardware Emergency Trip Input", "type": "Digital Input", "notes": "Direct trigger from module LM393 comparator."}
        ],
        "firmware": {
            "key_constants": "GAS_ANALOG = A0; ALARM_PIN = 14; THRESHOLD_PPM = 400; WARMUP_TIME = 20000;",
            "logic": "Samples gas concentration every 150ms. If reading exceeds THRESHOLD_PPM or digital trip activates, immediately drives ALARM_PIN HIGH, pulses visual LED, flags EMERGENCY_STATE in JSON telemetry, and serves data over /api/readings and /api/command."
        },
        "theory": {
            "formula": "\\text{LEL (\\%)} = \\left( \\frac{\\text{Measured PPM}}{\\text{LEL Threshold PPM}} \\right) \\times 100",
            "worked_example": "For Liquefied Petroleum Gas (LPG/Propane), the Lower Explosive Limit (LEL) is approximately 2.1% by volume (21,000 PPM). If the sensor measures 4,200 PPM, the gas level is at (4200 / 21000) * 100 = 20.0% of LEL, triggering an immediate mandatory evacuation alarm before reaching explosive concentrations."
        },
        "testing": [
            {"id": "T06-01", "procedure": "Power on detector and allow 20-second preheating.", "expected": "Dashboard displays NORMAL, PPM sits below 100, buzzer silent.", "actual": ""},
            {"id": "T06-02", "procedure": "Depress lighter gas release valve (without spark) 10cm from sensor for 1 second.", "expected": "Sensor detects butane within 0.8s; PPM spikes >800; buzzer sounds continuously.", "actual": ""},
            {"id": "T06-03", "procedure": "Ventilate sensor area with clean air wave.", "expected": "Buzzer turns off within 4 seconds as gas dissipates below threshold.", "actual": ""},
            {"id": "T06-04", "procedure": "Trigger REST API /api/command endpoint with {siren: true}.", "expected": "Microcontroller sounds buzzer for 2-second diagnostic test, then restores.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Buzzer sounds continuously even in clean air", "cause": "LM393 potentiometer adjusted too sensitively or sensor not warmed up", "diag": "Read raw A0 ADC value; verify if sensor has had at least 5 minutes of preheating", "solution": "Allow full warmup; turn comparator trimmer counter-clockwise until LED goes out."},
            {"issue": "Buzzer sounds very weakly or clicks", "cause": "Buzzer driven directly from GPIO pin without transistor", "diag": "Check current draw; NodeMCU GPIO can only source 12mA (buzzer needs 30mA)", "solution": "Install 2N2222 NPN transistor driver between GPIO and buzzer."},
            {"issue": "Gas concentration readings remain flat 0 PPM", "cause": "Open circuit on heater or broken sensor ground", "diag": "Measure resistance across heater pins with DMM; should read ~33Ω", "solution": "Replace sensor module if heater coil is open circuit."}
        ],
        "safety": "NEVER use a live flame to test the sensor. Test exclusively by releasing small amounts of unignited lighter gas for 1 second in a well-ventilated space. Educational student prototypes MUST NOT be used as primary life-safety alarms in occupied dwellings.",
        "outcomes": "Understand Lower Explosive Limit (LEL) safety metrics, implement NPN transistor switching for high-current sirens, calculate gas concentration curves, and design emergency interlocks.",
        "viva": [
            {"q": "What is the Lower Explosive Limit (LEL)?", "a": "The lowest concentration (percentage) of a gas or vapor in air capable of producing a flash of fire in the presence of an ignition source."},
            {"q": "What are the main target gases of the MQ-2 sensor?", "a": "LPG, propane, butane, methane, hydrogen, alcohol, and smoke."},
            {"q": "Why is an NPN transistor used to drive the piezo buzzer?", "a": "The buzzer requires 30mA–50mA at 5V. ESP8266 GPIO pins can only safely source 12mA at 3.3V. The 2N2222 acts as an amplifier switch."},
            {"q": "What safety feature is integrated into the MQ-2 sensor housing?", "a": "A dual stainless-steel wire mesh explosion-proof flame arrestor that prevents internal heater sparks from igniting external gas mixtures."},
            {"q": "What is the Upper Explosive Limit (UEL)?", "a": "The highest concentration of gas in air above which the mixture is too rich in fuel and lacks sufficient oxygen to burn."},
            {"q": "Why is LPG gas heavier than air?", "a": "Propane and butane have higher molecular weights than air (average MW 29); LPG settles near the floor, requiring detectors to be mounted low (30cm from floor)."},
            {"q": "Where should a natural gas (methane) detector be mounted?", "a": "Near the ceiling (within 30cm of ceiling), because methane (MW 16) is significantly lighter than air and rises rapidly."},
            {"q": "How does the firmware prevent false transient alarms?", "a": "By using a debounce counter that requires gas readings to stay above threshold for 3 consecutive samples (450ms) before asserting the siren."}
        ],
        "exercises": {
            "beginner": "Add a visual warning state where the dashboard and LED flash amber at 200 PPM before sounding the full siren at 400 PPM.",
            "intermediate": "Connect an optocoupled relay on D6 that can cut power to a 12V motorized solenoid gas shutoff valve upon alarm.",
            "advanced": "Implement an automated emergency HTTP webhook that pushes an instant notification to a smartphone via Pushover or Telegram."
        }
    }
]

print(f"Loaded {len(PROJECTS_CAT_A_PART1)} projects in Category A Part 1.")
