"""
Tech IoT Warriors — Handbook Data Module: Category A (Part 2: Projects 07–12)
Sensors & Monitoring Laboratory
"""

PROJECTS_CAT_A_PART2 = [
    {
        "id": "07",
        "folder": "07-ldr-light-intensity-monitor",
        "title": "LDR Light Intensity Monitor — Precision Ambient Lux Gauging",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The LDR Light Intensity Monitor is an automated optical telemetry system utilizing a GL5528 cadmium sulfide (CdS) photoresistor in a calibrated voltage divider configuration to measure ambient illuminance from complete darkness to direct sunlight.",
            "problem": "Manual light switching in commercial facilities, street lighting grids, and architectural zones causes severe energy wastage and fails to adjust dynamically to passing clouds or twilight.",
            "objectives": "Design a precision analog optical sensing circuit, linearize photoresistor response via logarithmic lux equations, stream live illumination metrics to a web dashboard, and trigger automated threshold alerts.",
            "outcome": "A fully functional ambient lux telemetry station featuring calibrated illuminance readouts, twilight detection, historical trending charts, and REST API telemetry.",
            "difficulty": "Beginner",
            "time": "2.0 Hours",
            "prior_knowledge": "Ohm's law, voltage divider formulas, ADC quantization, and analog-to-digital signal conversion."
        },
        "principle": "The GL5528 photoresistor exhibits photoconductivity: photon absorption generates electron-hole pairs, decreasing semiconductor bulk resistance from >1MΩ in total darkness to <500Ω in intense sunlight. In series with a 10kΩ reference resistor connected across 3.3V, the node voltage V_out = V_CC * (R_fixed / (R_LDR + R_fixed)). As light increases, R_LDR drops, causing V_out to rise toward 3.3V. The ESP8266 ADC0 quantizes this into a 10-bit integer (0–1023), which the firmware converts to illuminance (Lux) using the empirical power-law relation: Lux = 500 * (1023 / ADC - 1)^(-1.4).",
        "applications": [
            "Smart architectural and greenhouse supplemental lighting management.",
            "Automated municipal street lighting and twilight astronomical controllers.",
            "Solar tracking orientation verification and panel shade monitoring.",
            "Museum and art gallery preservation lux exposure datalogging."
        ],
        "benefits_limitations": {
            "benefits": "Extremely low cost; broad dynamic optical range; robust analog interface; minimal power consumption (<1mA).",
            "limitations": "Non-linear resistance curve requiring logarithmic computation; light history memory effect (hysteresis); slow response time (20–30ms)."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Microcontroller, 10-bit ADC sampler, and Wi-Fi REST web server", "spec": "Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "GL5528 CdS Photoresistor", "qty": "1", "purpose": "Ambient photon detection transducer", "spec": "Dark resistance 1MΩ, 10 Lux resistance 10k–20kΩ", "status": "Mandatory"},
            {"component": "Precision Metal-Film Resistor", "qty": "1", "purpose": "Voltage divider reference arm", "spec": "10kΩ, 1/4W, 1% tolerance", "status": "Mandatory"},
            {"component": "Ceramic Noise Decoupling Capacitor", "qty": "1", "purpose": "High-frequency noise rejection on ADC input", "spec": "100nF (0.1µF), 50V multilayer ceramic", "status": "Optional / Recommended"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit interconnect platform", "spec": "400 or 830 tie-points", "status": "Mandatory"},
            {"component": "Jumper Wires (M-to-M)", "qty": "5", "purpose": "Signal and power connections", "spec": "24 AWG stranded copper", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter (resistance and DC voltage modes), calibrated lux meter (or smartphone ambient lux sensor app for calibration), Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "GL5528 Pin 1", "pin": "Lead 1", "controller": "NodeMCU 3V3 Pin", "notes": "Connected to stable regulated 3.3V power rail"},
            {"comp": "GL5528 Pin 2", "pin": "Lead 2", "controller": "NodeMCU A0 (ADC0)", "notes": "Center tap of voltage divider"},
            {"comp": "10kΩ Resistor Lead 1", "pin": "Terminal 1", "controller": "NodeMCU A0 (ADC0)", "notes": "Tied directly to GL5528 Lead 2 at breadboard node"},
            {"comp": "10kΩ Resistor Lead 2", "pin": "Terminal 2", "controller": "NodeMCU GND", "notes": "Pulldown to ground completing the voltage divider"},
            {"comp": "100nF Capacitor (Optional)", "pin": "Terminals", "controller": "A0 to GND", "notes": "Parallel with 10kΩ resistor to shunt 50/60Hz AC ambient ripple"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "Analog Illuminance Voltage Sampling", "type": "Analog Input (0–1.0V internal, 0–3.3V on NodeMCU)", "notes": "NodeMCU includes onboard 220k/100k divider scaling 3.3V to 1.0V internally."}
        ],
        "firmware": {
            "key_constants": "LDR_PIN = A0; SAMPLES = 16; R_FIXED = 10000; LUX_CALC_EXPONENT = -1.4;",
            "logic": "The firmware takes 16 successive analog readings on A0 with a 2ms inter-sample delay, filters random noise using a moving average, calculates the instantaneous LDR resistance, computes ambient Lux via calibrated power-law equations, and broadcasts the metrics via REST endpoints (/api/readings, /api/health, /api/device). Automatic thresholds categorize light states: DARK (<50 lux), DIM (50–200 lux), NORMAL (200–800 lux), BRIGHT (>800 lux)."
        },
        "theory": {
            "formula": "V_{out} = V_{CC} \\times \\frac{R_{fixed}}{R_{LDR} + R_{fixed}} \\implies R_{LDR} = R_{fixed} \\times \\left( \\frac{V_{CC}}{V_{out}} - 1 \\right) = 10000 \\times \\left( \\frac{1023}{ADC} - 1 \\right)",
            "worked_example": "If the ADC reads 682 at noon: R_LDR = 10000 * (1023 / 682 - 1) = 10000 * (1.5 - 1) = 5,000 Ω (5 kΩ). Using empirical calibration: Lux = 500 * (5000 / 10000)^(-1.4) ≈ 500 * (0.5)^(-1.4) ≈ 1319 Lux, corresponding to bright overcast daylight."
        },
        "testing": [
            {"id": "T07-01", "procedure": "Cover LDR completely with an opaque black shroud or finger.", "expected": "ADC drops below 100; Lux reads < 10 Lux; Status displays 'DARK'.", "actual": ""},
            {"id": "T07-02", "procedure": "Expose LDR to normal indoor room lighting (fluorescent or LED desk lamp).", "expected": "ADC reads between 400 and 700; Lux reads 250–500 Lux; Status displays 'NORMAL'.", "actual": ""},
            {"id": "T07-03", "procedure": "Shine a focused LED smartphone torch directly at the LDR surface.", "expected": "ADC exceeds 950; Lux reads > 2000 Lux; Status displays 'BRIGHT'.", "actual": ""},
            {"id": "T07-04", "procedure": "Disconnect A0 jumper wire to float analog input.", "expected": "ADC reading floats randomly; health diagnostic flags 'SIGNAL_UNSTABLE'.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "ADC reading stuck at 1023 continuously", "cause": "LDR shorted or A0 tied directly to 3.3V rail", "diag": "Measure voltage between A0 and GND with DMM", "solution": "Check breadboard wiring; ensure 10kΩ pull-down resistor is in place."},
            {"issue": "ADC reading stuck at 0 regardless of light", "cause": "Missing connection to 3.3V or A0 tied to GND", "diag": "Verify 3.3V across LDR Lead 1 and Ground", "solution": "Re-seat LDR leads firmly into breadboard tie-points."},
            {"issue": "Lux readings fluctuate wildly ±200 Lux", "cause": "AC fluorescent flicker (100Hz/120Hz) or floating ground", "diag": "Inspect raw ADC readings over 100ms intervals", "solution": "Add 100nF ceramic capacitor across A0 and GND to filter AC flicker."}
        ],
        "safety": "Keep total input voltage to A0 strictly within 0V to 3.3V. CdS cells contain trace cadmium compounds; do not incinerate, puncture, or ingest components. Wash hands after handling raw unsealed LDRs.",
        "outcomes": "Master voltage divider circuit design, understand photoconductive sensor physics, implement multi-sample software filtering, convert raw ADC telemetry to engineering units (Lux), and interface analog sensors with web dashboards.",
        "viva": [
            {"q": "What physical principle allows the GL5528 to change resistance with light?", "a": "Photoconductivity in Cadmium Sulfide (CdS). Absorbed photon energy excites valence electrons into the conduction band, increasing electrical conductivity."},
            {"q": "Why is a fixed 10kΩ resistor required alongside the LDR?", "a": "The ESP8266 ADC measures voltage, not pure resistance. The 10kΩ resistor creates a voltage divider, translating resistance changes into measurable voltage shifts."},
            {"q": "What is the resolution of the ESP8266 internal ADC?", "a": "10 bits, giving 1024 discrete quantization steps (0 to 1023), representing 0V to 3.3V with ~3.22mV per step resolution."},
            {"q": "Why is the relationship between LDR resistance and Lux non-linear?", "a": "Semiconductor recombination dynamics follow a logarithmic power law (R = A * Lux^gamma), where gamma is typically -0.7 to -0.9."},
            {"q": "What happens if you swap the positions of the LDR and 10kΩ resistor in the divider?", "a": "The voltage response inverts: V_out will decrease with increasing light instead of increasing."},
            {"q": "What is the typical spectral sensitivity peak of a CdS photoresistor?", "a": "Around 540nm (green light), which closely matches human eye photopic sensitivity."},
            {"q": "How does ambient temperature affect LDR readings?", "a": "Thermal agitation increases dark current slightly, reducing dark resistance at elevated temperatures (typically 0.2% per °C)."},
            {"q": "Why is oversampling (averaging 16 readings) recommended for A0?", "a": "It cancels out high-frequency electromagnetic noise, RF interference from Wi-Fi packet bursts, and 50/60Hz AC optical lighting flicker."}
        ],
        "exercises": {
            "beginner": "Modify the alert threshold in firmware from 200 Lux to 350 Lux and observe dashboard status transitions.",
            "intermediate": "Connect an LED on D1 (GPIO5) programmed to illuminate automatically whenever ambient light drops below 100 Lux (automatic night lamp).",
            "advanced": "Log 24 hours of ambient lux readings to a cloud database or SD card to plot the diurnal sunlight curve."
        }
    },
    {
        "id": "08",
        "folder": "08-digital-thermometer",
        "title": "Digital Thermometer — High-Precision Maxim DS18B20 OneWire Sensor",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The Digital Thermometer is a waterproof industrial temperature telemetry station powered by the Maxim Dallas DS18B20 digital thermal sensor operating over the Maxim 1-Wire proprietary digital communication bus.",
            "problem": "Analog temperature sensors (such as LM35 or thermistors) suffer severe voltage drop, ground loop offset, and RF noise pickup when long cable runs (5–50 meters) are required in industrial tanks or outdoor weather stations.",
            "objectives": "Implement a 1-Wire multi-drop digital bus on ESP8266 GPIO12 (D6), extract 12-bit factory-calibrated Celsius temperature telemetry, configure programmable alarm trip points, and stream real-time data to a web dashboard.",
            "outcome": "A precision digital thermometer providing 0.0625°C thermal resolution, waterproof probe immersion capability, and complete immunity to cable resistance drop.",
            "difficulty": "Intermediate",
            "time": "2.5 Hours",
            "prior_knowledge": "Open-drain digital buses, pull-up resistors, 1-Wire protocol fundamentals, and CRC checksum validation."
        },
        "principle": "The DS18B20 utilizes an onboard bandgap temperature sensor, a delta-sigma analog-to-digital converter, and a unique 64-bit factory lasered ROM address. Communication occurs over a single bidirectional open-drain data wire referencing ground. The bus requires an external 4.7kΩ pull-up resistor to 3.3V. The microcontroller initiates time slots by pulling the line LOW; the DS18B20 responds by modulating the line within strict timing windows (15µs–60µs). Onboard 12-bit conversion provides 0.0625°C resolution across -55°C to +125°C with an internal 8-bit cyclic redundancy check (CRC) preventing corrupted readings.",
        "applications": [
            "Industrial chemical tank, pasteurization, and chiller thermal surveillance.",
            "Aquaculture fish farm and hydroponic nutrient reservoir water monitoring.",
            "Data center server rack cold/hot aisle environmental profiling.",
            "Cold chain pharmaceutical logistics and refrigeration compliance."
        ],
        "benefits_limitations": {
            "benefits": "Factory calibrated; true digital bus immune to cable voltage drop; waterproof stainless steel probe; unique 64-bit ROM ID allows dozens of sensors on a single GPIO wire.",
            "limitations": "Slow conversion time (750ms for full 12-bit resolution); requires precise microsecond bus timing; strict 4.7kΩ pull-up requirement."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "1-Wire bus master controller and Wi-Fi REST web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "DS18B20 Waterproof Probe", "qty": "1", "purpose": "Stainless steel encapsulated digital temperature sensor", "spec": "-55°C to +125°C, ±0.5°C accuracy from -10°C to +85°C", "status": "Mandatory"},
            {"component": "Metal-Film Pull-Up Resistor", "qty": "1", "purpose": "1-Wire open-drain bus pull-up", "spec": "4.7kΩ, 1/4W, 1% tolerance", "status": "Mandatory"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit assembly and bus connection", "spec": "400 tie-points", "status": "Mandatory"},
            {"component": "Terminal Block Adapter (Optional)", "qty": "1", "purpose": "Secure clamping of waterproof probe wire pigtails", "spec": "3-pin 5.08mm screw terminal", "status": "Optional / Recommended"},
            {"component": "Jumper Wires (M-to-M)", "qty": "5", "purpose": "Interconnect wiring", "spec": "24 AWG stranded", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter (continuity and DC voltage), small flathead screwdriver for terminal blocks, thermal reference (ice water bath and warm water cup), Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "DS18B20 Red Wire", "pin": "VCC", "controller": "NodeMCU 3V3 Pin", "notes": "Powers internal delta-sigma ADC and oscillator (3.0V–5.5V)"},
            {"comp": "DS18B20 Black Wire", "pin": "GND", "controller": "NodeMCU GND", "notes": "System ground reference"},
            {"comp": "DS18B20 Yellow/Blue Wire", "pin": "DATA", "controller": "NodeMCU D6 (GPIO 12)", "notes": "Bidirectional 1-Wire open-drain data bus"},
            {"comp": "4.7kΩ Resistor", "pin": "Between DATA & 3V3", "controller": "D6 to 3V3", "notes": "CRITICAL: Mandatory bus pull-up; without this, bus stays floating LOW"}
        ],
        "pin_config": [
            {"pin": "D6", "gpio": "GPIO 12", "purpose": "1-Wire Bidirectional Data Bus", "type": "Digital Input / Open-Drain Output", "notes": "Fully boot-safe pin; supports hardware interrupts and microsecond bit-banging."}
        ],
        "firmware": {
            "key_constants": "ONE_WIRE_BUS = 12; TEMPERATURE_PRECISION = 12; POLL_INTERVAL = 1000ms;",
            "logic": "The sketch uses OneWire.h and DallasTemperature.h libraries. During setup, it scans the bus, captures the 64-bit device address, and configures 12-bit ADC conversion mode. In the loop, it issues an asynchronous requestTemperatures() command, reads the scratchpad after 750ms, validates the 8-bit CRC checksum, converts Celsius to Fahrenheit, and updates REST endpoints (/api/readings, /api/health, /api/device). High and low thermal alerts are evaluated against preset thresholds."
        },
        "theory": {
            "formula": "T_{Celsius} = RAW \\times 0.0625, \\quad T_{Fahrenheit} = (T_{Celsius} \\times 1.8) + 32",
            "worked_example": "The DS18B20 scratchpad returns raw 16-bit register value 0x0191 (decimal 401). T_Celsius = 401 * 0.0625 = 25.0625°C. T_Fahrenheit = (25.0625 * 1.8) + 32 = 77.1125°F."
        },
        "testing": [
            {"id": "T08-01", "procedure": "Power on device at room ambient (22°C–25°C).", "expected": "Web dashboard displays 22°C–25°C ±0.5°C; 64-bit ROM address recognized in console.", "actual": ""},
            {"id": "T08-02", "procedure": "Submerge waterproof probe tip into a slurry of ice water.", "expected": "Temperature steadily drops and stabilizes between 0.0°C and 0.5°C.", "actual": ""},
            {"id": "T08-03", "procedure": "Submerge probe tip into warm water (~50°C).", "expected": "Temperature rises rapidly above 45°C; dashboard triggers 'HIGH_TEMP_WARNING'.", "actual": ""},
            {"id": "T08-04", "procedure": "Temporarily disconnect 4.7kΩ pull-up resistor while running.", "expected": "1-Wire bus halts; firmware returns error code -127.0°C and flags 'SENSOR_DISCONNECTED'.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Temperature consistently reads -127.0°C", "cause": "Missing 4.7kΩ pull-up resistor or broken data wire", "diag": "Measure voltage on D6 with DMM; should sit at 3.3V when idle", "solution": "Install 4.7kΩ resistor between D6 and 3V3; verify wire continuity."},
            {"issue": "Temperature reads fixed +85.0°C", "cause": "Read commanded before ADC conversion completed", "diag": "+85°C is the DS18B20 factory power-on reset scratchpad default", "solution": "Ensure a minimum 750ms delay between requestTemperatures() and getTempC()."},
            {"issue": "ESP8266 crashes with WDT reset during temperature read", "cause": "Blocking delay() freezing the Wi-Fi background stack", "diag": "Inspect serial monitor for 'Soft WDT reset' stack trace", "solution": "Use asynchronous non-blocking temperature requests (setWaitForConversion(false))."}
        ],
        "safety": "Although the stainless steel probe tube is fully waterproof, the heat-shrink joint and cable pigtails are NOT hermetically sealed for pressurized or prolonged deep submersion. Do not touch mains AC heaters directly with the probe.",
        "outcomes": "Implement the Dallas 1-Wire protocol, calculate binary temperature conversions, understand CRC validation, handle asynchronous sensor timings, and construct high-reliability industrial thermal monitoring stations.",
        "viva": [
            {"q": "What is the 1-Wire protocol and why is it beneficial for industrial sensing?", "a": "It is a master-slave bus developed by Dallas Semiconductor requiring only one data wire and ground. Multiple devices share the same wire via unique 64-bit ROM addresses."},
            {"q": "What is the function of the 4.7kΩ pull-up resistor on the 1-Wire bus?", "a": "1-Wire devices use open-drain drivers. Devices can only pull the bus LOW; the pull-up resistor pulls the bus back to HIGH when released."},
            {"q": "What does a reading of -127.0°C indicate?", "a": "Total communication failure. The bus was pulled LOW or disconnected, returning all 1s (0xFF) or 0s, which DallasTemperature translates to DEVICE_DISCONNECTED_C (-127°C)."},
            {"q": "What does a reading of +85.0°C indicate?", "a": "It is the power-on reset state of the DS18B20 temperature register. It means reading occurred before the 750ms temperature conversion finished."},
            {"q": "How does 12-bit resolution differ from 9-bit resolution on the DS18B20?", "a": "12-bit provides 0.0625°C resolution taking 750ms; 9-bit provides 0.5°C resolution taking only 93.75ms."},
            {"q": "What is parasitic power mode on the DS18B20?", "a": "A mode where the sensor steals power from the data line via an internal diode and capacitor during HIGH periods, eliminating the separate VCC wire."},
            {"q": "What is the purpose of the 8-bit CRC byte in the scratchpad?", "a": "Cyclic Redundancy Check ensures that electrical noise or bus collisions did not corrupt the temperature bits during wire transmission."},
            {"q": "How many DS18B20 sensors can theoretically be connected to a single ESP8266 pin?", "a": "Dozens (theoretically hundreds), constrained only by bus capacitance, pull-up sizing, and polling latency."}
        ],
        "exercises": {
            "beginner": "Change temperature reporting units from Celsius to Fahrenheit on the dashboard display.",
            "intermediate": "Add an active buzzer on D5 that sounds a continuous alarm whenever temperature exceeds 40.0°C.",
            "advanced": "Connect two DS18B20 probes in parallel on D6, enumerate their unique 64-bit ROM addresses, and display differential temperature (T1 - T2) on the web dashboard."
        }
    },
    {
        "id": "09",
        "folder": "09-water-level-monitor",
        "title": "Water Level Monitor — Non-Contact Acoustic Tank Gauging",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The Water Level Monitor is a non-contact acoustic gauging system mounted above liquid storage reservoirs, utilizing an HC-SR04 ultrasonic transducer to continuously calculate ullage distance, total water volume, and percentage capacity.",
            "problem": "Submerged mechanical float sensors and conductive probes suffer rapid chemical corrosion, mineral scaling, bio-fouling, and mechanical jamming in water storage tanks.",
            "objectives": "Mount an acoustic transducer above the maximum liquid line, convert time-of-flight acoustic echo pulses into liquid depth, calculate tank liquid volume in liters, and generate low/high water level alarms over Wi-Fi.",
            "outcome": "A hygienic, non-contact liquid level monitor displaying real-time tank depth, volume in liters, capacity percentage, and overflow protection alerts.",
            "difficulty": "Intermediate",
            "time": "2.5 Hours",
            "prior_knowledge": "Ultrasonic pulseIn() timing, geometric volume calculations (cylindrical/rectangular tanks), and level-shifting dividers."
        },
        "principle": "The sensor transmits a 40kHz acoustic burst downward from the tank ceiling. The burst strikes the liquid surface and reflects back to the transducer receiver. The travel time Delta_t represents the 'ullage' distance (air space between sensor and water surface). Given the calibrated empty tank depth H_total: Liquid Depth = H_total - Ullage. Liquid Volume = Tank Cross-Sectional Area * Liquid Depth. Level Percentage = (Liquid Depth / Max Usable Depth) * 100%.",
        "applications": [
            "Overhead residential and municipal rooftop water distribution tanks.",
            "Industrial chemical tanks containing corrosive or hazardous fluids.",
            "Rainwater harvesting cistern storage and filtration monitoring.",
            "Agricultural irrigation sump and cattle trough monitoring."
        ],
        "benefits_limitations": {
            "benefits": "Completely non-contact (no contamination or probe corrosion); highly accurate (±3mm resolution); easy to install on tank lid.",
            "limitations": "Blind zone of 20mm–200mm (cannot measure closer than 2cm); condensation on transducer cones can attenuate sound; high humidity causes minor acoustic velocity shifts."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, ultrasonic timer, and Wi-Fi REST web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "HC-SR04 Ultrasonic Sensor", "qty": "1", "purpose": "Acoustic pulse transmitter and receiver", "spec": "40kHz resonance, 2cm–400cm range, 5V VCC", "status": "Mandatory"},
            {"component": "Metal-Film Resistors (1kΩ & 2kΩ)", "qty": "1 set", "purpose": "5V to 3.3V Echo signal voltage divider", "spec": "1/4W, 1% tolerance", "status": "Mandatory"},
            {"component": "Piezo Buzzer (5V Active)", "qty": "1", "purpose": "Audible tank overflow and dry-run alarm", "spec": "85dB @ 10cm, 5V active", "status": "Optional / Recommended"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit interconnect platform", "spec": "400 tie-points", "status": "Mandatory"},
            {"component": "Jumper Wires (M-to-M & M-to-F)", "qty": "8", "purpose": "Interconnect wiring", "spec": "24 AWG stranded", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, measuring tape (for physical tank height calibration), test water container (bucket or acrylic cylinder), Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "HC-SR04 VCC", "pin": "Pin 1", "controller": "NodeMCU Vin (5V from USB)", "notes": "Requires 5.0V for reliable 40kHz transducer drive"},
            {"comp": "HC-SR04 GND", "pin": "Pin 4", "controller": "NodeMCU GND", "notes": "Shared system ground reference"},
            {"comp": "HC-SR04 Trig", "pin": "Pin 2", "controller": "NodeMCU D1 (GPIO 5)", "notes": "Outputs 10µs trigger pulse"},
            {"comp": "HC-SR04 Echo", "pin": "Pin 3", "controller": "1kΩ series &rarr; D2 (GPIO 4)", "notes": "CRITICAL: Connect 1kΩ from Echo to D2, and 2kΩ from D2 to GND (5V &rarr; 3.33V)"},
            {"comp": "Buzzer (+)", "pin": "Anode", "controller": "NodeMCU D5 (GPIO 14)", "notes": "Digital alarm output for tank empty / overflow states"}
        ],
        "pin_config": [
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "Ultrasonic Trigger Output", "type": "Digital Output", "notes": "Boot-safe; sends 10µs pulses every 250ms."},
            {"pin": "D2", "gpio": "GPIO 4", "purpose": "Ultrasonic Echo Input", "type": "Digital Input", "notes": "Boot-safe; measures echo pulse width via pulseIn()."},
            {"pin": "D5", "gpio": "GPIO 14", "purpose": "Alarm Buzzer Output", "type": "Digital Output", "notes": "Boot-safe; drives piezo buzzer HIGH during overflow or critical dry-run."}
        ],
        "firmware": {
            "key_constants": "TRIG_PIN = 5; ECHO_PIN = 4; BUZZER_PIN = 14; TANK_HEIGHT_CM = 100.0; TANK_RADIUS_CM = 25.0;",
            "logic": "The sketch triggers the ultrasonic transducer, measures round-trip echo pulse duration with a 30ms timeout, calculates distance, and applies a 5-sample median filter to eliminate water wave ripples. It computes liquid depth = TANK_HEIGHT_CM - distance, calculates volume V = pi * r^2 * depth / 1000 (Liters), and derives percentage capacity. The data is served via REST endpoints (/api/readings, /api/health, /api/device). Buzzer activates if level < 15% (dry run) or > 95% (overflow)."
        },
        "theory": {
            "formula": "Ullage = \\frac{\\Delta t}{58.2}, \\quad Depth = H_{total} - Ullage, \\quad Volume (L) = \\frac{\\pi \\times r^2 \\times Depth}{1000}",
            "worked_example": "For a tank with total height H = 100 cm and radius r = 25 cm: If Echo duration is 2328 µs, Ullage = 2328 / 58.2 = 40.0 cm. Liquid Depth = 100 - 40 = 60.0 cm. Volume = (3.1416 * 25^2 * 60) / 1000 = (3.1416 * 625 * 60) / 1000 = 117.81 Liters. Tank capacity = (60 / 100) * 100% = 60.0%."
        },
        "testing": [
            {"id": "T09-01", "procedure": "Place sensor facing an empty bucket of calibrated depth 30 cm.", "expected": "Ullage reads 30 cm ±0.5 cm; Water depth reads 0.0 cm (0% capacity); Buzzer sounds LOW_LEVEL.", "actual": ""},
            {"id": "T09-02", "procedure": "Fill bucket half full with water (15 cm liquid depth).", "expected": "Ullage reads 15 cm ±0.5 cm; Water depth reads 15 cm (50% capacity); Status displays 'NORMAL'.", "actual": ""},
            {"id": "T09-03", "procedure": "Fill bucket to within 3 cm of sensor rim (90% capacity).", "expected": "Water depth reads 27 cm (90% capacity); High level warning illuminates on dashboard.", "actual": ""},
            {"id": "T09-04", "procedure": "Wave hand rapidly across sensor face to create turbulent ripples.", "expected": "Median filter stabilizes readings; prevents false jitter or sudden erratic spikes.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Water depth displays negative values or erratic spikes", "cause": "Water surface closer than 2cm (inside sensor blind zone)", "diag": "Check distance between sensor face and maximum high water line", "solution": "Ensure sensor is mounted at least 5cm above the absolute maximum overflow line."},
            {"issue": "Sensor reads fixed 400cm or zero", "cause": "Echo bounced off tank sidewall instead of water surface", "diag": "Check sensor alignment; beam angle is 15° cone", "solution": "Mount sensor in the exact center of tank ceiling, away from corrugated sidewalls."},
            {"issue": "Buzzer does not sound during low level alarm", "cause": "Reversed polarity on piezo buzzer or incorrect GPIO definition", "diag": "Test buzzer directly across 3.3V and GND", "solution": "Connect long buzzer lead (+) to D5 and short lead (-) to GND."}
        ],
        "safety": "Keep all electrical connections, ESP8266 board, and DC power supplies completely sealed from water spray, condensation, and evaporation fumes. Use an IP65 rated junction box for permanent tank installation.",
        "outcomes": "Apply ultrasonic time-of-flight to liquid level measurement, calculate geometric tank liquid volumes, implement median digital filtering for surface ripple suppression, and configure audio-visual automated alarm triggers.",
        "viva": [
            {"q": "What is meant by the term 'ullage' in liquid level measurement?", "a": "Ullage is the empty headspace or air distance between the top of the container (sensor face) and the liquid surface."},
            {"q": "Why is non-contact ultrasonic sensing superior to conductive electrode probes?", "a": "Conductive probes suffer rapid electrolytic corrosion, mineral scaling, and biofouling. Ultrasonic sensors never touch the fluid, ensuring zero contamination and maintenance."},
            {"q": "What is the ultrasonic sensor 'blind zone' and how is it managed?", "a": "Transducer mechanical ringing prevents echo reception during the first ~2cm (up to 20cm depending on model). The sensor must be mounted with sufficient standoff clearance above maximum fill level."},
            {"q": "How does water surface agitation (waves/ripples) affect ultrasonic accuracy?", "a": "Waves scatter acoustic pulses away from the receiver, causing lost echoes or erratic readings. Software median filtering eliminates these intermittent outliers."},
            {"q": "How does ambient temperature inside a closed tank affect level accuracy?", "a": "Hot vapor increases acoustic velocity (approx +0.6 m/s per °C), making the tank appear slightly fuller than it actually is unless compensated with a temperature sensor."},
            {"q": "Why is a 1kΩ/2kΩ voltage divider necessary on the Echo pin?", "a": "The HC-SR04 Echo pin outputs 5V TTL logic. ESP8266 GPIOs are rated for 3.3V maximum. The divider safely attenuates the signal to 3.33V."},
            {"q": "What happens if acoustic foam or floating scum is present on the water surface?", "a": "Porous foam absorbs the 40kHz acoustic burst, severely attenuating the echo and potentially causing timeout errors."},
            {"q": "How do you calculate liquid volume in a horizontal cylindrical tank?", "a": "Using circular segment geometry: V = L * [r^2 * arccos((r-h)/r) - (r-h) * sqrt(2*r*h - h^2)], requiring advanced math in firmware."}
        ],
        "exercises": {
            "beginner": "Change tank dimensions in the firmware to match a rectangular tank (Length * Width * Depth) and observe volume recalculation.",
            "intermediate": "Add a dynamic visual progress bar on the dashboard that changes color from Green (>40%) to Orange (15-40%) to Red (<15%).",
            "advanced": "Implement an automated pump cutoff relay on D6 that de-energizes when tank water level reaches 95% to prevent overflowing."
        }
    },
    {
        "id": "10",
        "folder": "10-water-flow-meter",
        "title": "Water Flow Meter — Hall-Effect Turbine Pulse Telemetry",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The Water Flow Meter is an in-line fluid velocity and volume quantification station utilizing a YF-S201 magnetic Hall-effect turbine flow sensor to measure instantaneous flow rates (L/min) and cumulative water consumption (Liters).",
            "problem": "Unmonitored pipeline leaks, unbilled municipal water consumption, and inefficient irrigation cause billions of liters of clean water loss globally each year.",
            "objectives": "Install an in-line turbine sensor, capture high-frequency digital pulses via ESP8266 hardware interrupts on GPIO14 (D5), compute instantaneous flow rate in Liters/minute, integrate cumulative consumption volume, and stream telemetry to a web dashboard.",
            "outcome": "A precision fluid metering station featuring real-time flow rate display, total volume accumulator, leak detection alerts, and REST API telemetry.",
            "difficulty": "Intermediate",
            "time": "3.0 Hours",
            "prior_knowledge": "Hardware interrupt service routines (ISRs), volatile variables, turbine K-factor calibration, and fluid dynamics basics."
        },
        "principle": "The YF-S201 houses a pinwheel turbine embedded with a permanent neodymium magnet and an isolated integrated Hall-effect semiconductor sensor. When fluid passes through the 1/2-inch chamber, water velocity rotates the turbine proportionally. Each rotation sweeps the magnet past the Hall sensor, producing digital square-wave pulses. The pulse frequency f (Hz) is directly related to flow rate Q (L/min) by the manufacturer calibration factor: f = 7.5 * Q. The ESP8266 hardware interrupt counts pulses over calibrated 1-second intervals: Q = f / 7.5 (L/min). Total volume is computed by integrating pulses: Volume = Total Pulses / (7.5 * 60) = Total Pulses / 450 (Liters).",
        "applications": [
            "Smart municipal residential water sub-metering and billing.",
            "Commercial reverse-osmosis (RO) water purification output monitoring.",
            "Agricultural drip irrigation zone volumetric water distribution.",
            "Pipeline burst and continuous leak detection telemetry."
        ],
        "benefits_limitations": {
            "benefits": "Rugged in-line construction; clean digital square wave output; wide operating pressure (up to 1.75 MPa / 250 PSI); low electrical power draw.",
            "limitations": "Moving mechanical parts susceptible to abrasive silt or grit; minimum flow threshold required to overcome rotor inertia (~1 L/min); head loss across turbine restriction."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, hardware pulse counter, and Wi-Fi REST web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "YF-S201 Water Flow Sensor", "qty": "1", "purpose": "In-line turbine with Hall-effect pulse generator", "spec": "1/2\" BSP thread, 1–30 L/min, 5V–18V VCC", "status": "Mandatory"},
            {"component": "Pull-Up Resistor", "qty": "1", "purpose": "Ensures clean logic HIGH between Hall pulses", "spec": "4.7kΩ to 10kΩ, 1/4W", "status": "Mandatory"},
            {"component": "Current-Limiting Resistor", "qty": "1", "purpose": "Protects GPIO14 from 5V over-voltage transients", "spec": "1kΩ metal film, 1/4W", "status": "Mandatory"},
            {"component": "1/2\" Hose Barbs and Tubing", "qty": "1 set", "purpose": "Plumbing interconnect to water reservoir / tap", "spec": "1/2\" NPT/BSP food grade silicone or PVC hose", "status": "Mandatory"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit assembly platform", "spec": "400 tie-points", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, 1-Liter graduated measuring jug (for volumetric K-factor calibration), water tap or submersible pump, Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "YF-S201 Red Wire", "pin": "VCC", "controller": "NodeMCU Vin (5V from USB)", "notes": "Requires 5V for robust internal Hall switch operation"},
            {"comp": "YF-S201 Black Wire", "pin": "GND", "controller": "NodeMCU GND", "notes": "Shared system ground reference"},
            {"comp": "YF-S201 Yellow Wire", "pin": "PULSE OUT", "controller": "NodeMCU D5 (GPIO 14)", "notes": "Digital square wave output; connect via 1kΩ series resistor"},
            {"comp": "Pull-Up Resistor (4.7kΩ)", "pin": "Terminal", "controller": "D5 to 3V3", "notes": "Pull-up resistor ensures crisp rising edges on interrupt line"}
        ],
        "pin_config": [
            {"pin": "D5", "gpio": "GPIO 14", "purpose": "Hall Sensor Pulse Hardware Interrupt", "type": "Digital Input (Interrupt Capable)", "notes": "Configured as attachInterrupt(digitalPinToInterrupt(D5), pulseCounter, RISING)."}
        ],
        "firmware": {
            "key_constants": "FLOW_PIN = 14; CALIBRATION_FACTOR = 7.5; SAMPLE_INTERVAL_MS = 1000;",
            "logic": "An ICACHE_RAM_ATTR interrupt service routine increments a volatile 32-bit counter on every rising pulse edge. Every 1000ms, the main loop detaches interrupts, copies the pulse count, resets the counter, and re-enables interrupts. Flow rate is computed as Q = pulses / 7.5 (L/min). Total liters is accumulated as totalLiters += (pulses / 450.0). Results are serialized to JSON and served over /api/readings, /api/health, and /api/device endpoints. A continuous leak flag triggers if flow persists without pause for >30 minutes."
        },
        "theory": {
            "formula": "Q (\\text{L/min}) = \\frac{f (\\text{Hz})}{K}, \\quad V (\\text{L}) = \\sum \\frac{\\text{Pulses}}{K \\times 60} = \\frac{\\text{Total Pulses}}{450} \\quad (\\text{for } K = 7.5)",
            "worked_example": "If the ESP8266 counts 150 pulses in a 1-second interval: Frequency f = 150 Hz. Instantaneous Flow Rate Q = 150 / 7.5 = 20.0 Liters/minute. Volume passed in that single second = 20.0 / 60 = 0.333 Liters. Total pulses required for exactly 1.00 Liter = 7.5 * 60 = 450 pulses."
        },
        "testing": [
            {"id": "T10-01", "procedure": "Blow gently through the turbine intake nozzle with no water connected.", "expected": "Turbine spins freely; serial monitor and dashboard show flow rate ~5 L/min.", "actual": ""},
            {"id": "T10-02", "procedure": "Dispense exactly 1.0 Liter of water through the sensor into a graduated measuring cylinder.", "expected": "Dashboard accumulated total volume reads 1.00 L ±0.05 L (within 5% factory tolerance).", "actual": ""},
            {"id": "T10-03", "procedure": "Shut off water valve completely.", "expected": "Pulse frequency drops to 0 Hz immediately; Flow rate displays 0.00 L/min.", "actual": ""},
            {"id": "T10-04", "procedure": "Simulate slow persistent leak (10 pulses/sec) for >60 seconds.", "expected": "Dashboard indicates 'LEAK_DETECTED' alert status.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Flow rate displays 0.00 L/min even when water is actively running", "cause": "Water flowing backward or interrupt pin misconfigured", "diag": "Inspect directional arrow embossed on the plastic housing", "solution": "Ensure water flows strictly in the direction of the arrow; verify D5 interrupt wiring."},
            {"issue": "Cumulative volume reads significantly higher than actual water dispensed", "cause": "Electrical noise or bounce on pulse line triggering duplicate interrupts", "diag": "Inspect pulse waveform on oscilloscope or log pulse counts per second", "solution": "Add a 100nF capacitor between D5 and GND to filter high-frequency contact noise."},
            {"issue": "Turbine rotor stops spinning after several days of operation", "cause": "Sand particles, rust flakes, or sediment jammed the rotor", "diag": "Unscrew the 4 housing screws and inspect internal rotor chamber", "solution": "Install a 50-mesh in-line Y-strainer filter upstream of the flow meter."}
        ],
        "safety": "Ensure pipe connections are sealed with Teflon thread tape. Secure all electrical wiring away from fluid pipes. Do not exceed 1.75 MPa (250 PSI) liquid pressure rating to prevent plastic housing rupture.",
        "outcomes": "Configure microcontroller hardware interrupts, understand Hall-effect magnetic transduction, calibrate volumetric K-factors, perform numerical integration for total volume accumulation, and detect fluid pipeline leaks.",
        "viva": [
            {"q": "How does the Hall-effect sensor detect turbine rotation?", "a": "A permanent magnet mounted in the turbine rotor passes over the integrated Hall IC with each revolution, generating a magnetic field perturbation that toggles the output voltage between HIGH and LOW."},
            {"q": "Why are hardware interrupts required instead of digitalRead() polling in the loop?", "a": "At high flow rates (30 L/min), pulse frequency exceeds 225 Hz. Polling in the main loop would miss pulses during Wi-Fi transmission or blocking delays."},
            {"q": "Why must the interrupt counter variable be declared as 'volatile'?", "a": "The 'volatile' keyword directs the compiler to always read the variable from RAM rather than caching it in CPU registers, ensuring the main loop sees updates from the ISR."},
            {"q": "What is the K-factor of a flow meter?", "a": "The K-factor represents the number of pulses generated by the meter per unit volume of fluid passed (e.g., 450 pulses per Liter for YF-S201)."},
            {"q": "Why is the calibration factor f = 7.5 * Q only an approximation?", "a": "Fluid viscosity, turbulence, and pipe wall friction cause the K-factor to vary slightly across low, medium, and high velocity ranges."},
            {"q": "Why must the sensor be mounted horizontally or with fluid flowing upward vertically?", "a": "Vertical upward flow or horizontal mounting ensures the turbine chamber remains completely filled with liquid, preventing air pockets that cause inaccurate over-spinning."},
            {"q": "What is head loss in a flow meter?", "a": "The pressure drop across the sensor caused by the mechanical restriction of the turbine wheel inside the flow path."},
            {"q": "Why is ICACHE_RAM_ATTR required on ESP8266 interrupt service routines?", "a": "It forces the ISR code to reside in fast Instruction RAM rather than external flash memory, preventing fatal cache-read exceptions during flash operations."}
        ],
        "exercises": {
            "beginner": "Reset the cumulative volume accumulator to zero via a button click on the web dashboard.",
            "intermediate": "Perform a three-point calibration test using 1L, 2L, and 5L containers to calculate the exact K-factor for your specific piping setup.",
            "advanced": "Add an automated solenoid shutoff valve on D1 that energizes to cut water flow automatically if consumption exceeds a daily quota (e.g. 50 Liters)."
        }
    },
    {
        "id": "11",
        "folder": "11-tds-water-quality-monitor",
        "title": "TDS Water Quality Monitor — Hydroponic & Drinking Purity Analysis",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The TDS Water Quality Monitor is an electrochemical analytical station measuring Total Dissolved Solids (TDS in ppm) and Electrical Conductivity (EC in µS/cm) to evaluate drinking water purity, reverse-osmosis filtration efficiency, and hydroponic nutrient concentration.",
            "problem": "Unseen mineral salts, dissolved heavy metals, and agricultural fertilizer runoff contaminate groundwater supplies without altering water clarity, posing chronic health risks.",
            "objectives": "Construct an AC-excited electrochemical probe driver, sample analog conductivity signals on ESP8266 ADC0, implement automatic temperature compensation (ATC), calculate TDS in parts per million (ppm), and categorize water drinkability on a web dashboard.",
            "outcome": "A precision water quality station providing real-time TDS (ppm), EC (µS/cm), water purity rating, and automatic temperature compensation.",
            "difficulty": "Intermediate",
            "time": "2.5 Hours",
            "prior_knowledge": "Electrolytic conduction, AC excitation to prevent electrode polarization, temperature compensation curves, and ADC sampling."
        },
        "principle": "Pure deionized water is an electrical insulator. Dissolved inorganic minerals (calcium, magnesium, chloride, sodium) dissociate into mobile positive and negative ions, increasing electrical conductivity (EC). The TDS transmitter board generates a high-frequency AC excitation signal across two titanium probe pins to prevent electrolytic deposition and galvanic polarization. The resulting output voltage is inversely proportional to solution resistance. The ESP8266 ADC0 samples this voltage. Because conductivity rises by ~2% per °C rise in temperature, the firmware applies an automatic temperature compensation formula (ATC) referenced to standard 25°C: TDS (ppm) = (EC_25 * 0.5), where EC_25 = EC_raw / (1.0 + 0.02 * (T - 25.0)).",
        "applications": [
            "Household Reverse-Osmosis (RO) membrane degradation and filter replacement alerting.",
            "Hydroponic and aquaponic nutrient solution electrical conductivity management.",
            "Aquarium and ornamental fish tank salinity and hardness control.",
            "Municipal tap water compliance and well water mineral surveillance."
        ],
        "benefits_limitations": {
            "benefits": "Titanium probes prevent corrosion; AC excitation eliminates probe electroplating; direct reading in standard engineering units (ppm); compact transmitter board.",
            "limitations": "Cannot distinguish between beneficial minerals (calcium) and harmful contaminants (lead/arsenic); probe must be completely submerged and free of air bubbles; temperature sensitive."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, analog sampler, and Wi-Fi REST web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "Analog TDS Sensor & Signal Transmitter", "qty": "1", "purpose": "AC excitation generator and titanium 2-pin probe", "spec": "0–1000 ppm range, 3.3V–5.5V supply, waterproof probe", "status": "Mandatory"},
            {"component": "DS18B20 Waterproof Temp Sensor", "qty": "1", "purpose": "Automatic Temperature Compensation (ATC) reference", "spec": "Stainless steel probe, -55°C to +125°C", "status": "Optional / Recommended"},
            {"component": "Metal-Film Resistor (4.7kΩ)", "qty": "1", "purpose": "Pull-up resistor for DS18B20 1-Wire bus", "spec": "1/4W, 1% tolerance", "status": "Optional (Mandatory if DS18B20 used)"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit interconnect platform", "spec": "400 tie-points", "status": "Mandatory"},
            {"component": "Calibration Standard Solution (1382 ppm or 500 ppm)", "qty": "1 bottle", "purpose": "Electrochemical reference verification", "spec": "Standard NaCl or KCl calibration buffer", "status": "Optional / Recommended"}
        ],
        "tools": "Digital Multimeter, three glass beakers (distilled water, tap water, mineral/salt water), Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "TDS Driver VCC", "pin": "Pin 1 (+)", "controller": "NodeMCU 3V3 Pin", "notes": "Powers AC oscillator and analog amplifier (3.3V safe)"},
            {"comp": "TDS Driver GND", "pin": "Pin 2 (-)", "controller": "NodeMCU GND", "notes": "System common ground"},
            {"comp": "TDS Driver Signal", "pin": "Pin 3 (A)", "controller": "NodeMCU A0 (ADC0)", "notes": "Analog output voltage (0V–2.3V)"},
            {"comp": "TDS 2-Pin Probe", "pin": "XH2.54 Header", "controller": "TDS Driver Board Probe Port", "notes": "Waterproof two-pin titanium probe plug"},
            {"comp": "DS18B20 Data (Optional)", "pin": "Yellow Lead", "controller": "NodeMCU D6 (GPIO 12)", "notes": "For real-time ATC; pull up to 3.3V with 4.7kΩ resistor"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "TDS Analog Voltage Measurement", "type": "Analog Input (0–3.3V)", "notes": "Samples amplified AC-rectified analog voltage."},
            {"pin": "D6", "gpio": "GPIO 12", "purpose": "DS18B20 ATC Temperature Input", "type": "Digital 1-Wire Input", "notes": "Optional temperature reference for real-time ATC algorithm."}
        ],
        "firmware": {
            "key_constants": "TDS_PIN = A0; VREF = 3.3; SAMPLES = 30; TEMP_COEFF = 0.02;",
            "logic": "The firmware takes 30 analog samples on A0 over 150ms, applies median filtering to strip electrical transients, and converts the raw ADC value to voltage. If a DS18B20 is present, it reads real-time temperature (defaulting to 25.0°C otherwise). It applies the temperature compensation coefficient: compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0). Compensated voltage is fed into a 3rd-order polynomial: TDS_Value = (133.42 * V^3 - 255.86 * V^2 + 857.39 * V) * 0.5. Telemetry is published to /api/readings, /api/health, and /api/device. Water status is categorized: EXCELLENT (<50 ppm), GOOD (50–150 ppm), FAIR (150–300 ppm), POOR (300–500 ppm), UNACCEPTABLE (>500 ppm)."
        },
        "theory": {
            "formula": "V_{comp} = \\frac{V_{raw}}{1.0 + 0.02 \\times (T - 25.0)}, \\quad \\text{TDS (ppm)} = (133.42 V_{comp}^3 - 255.86 V_{comp}^2 + 857.39 V_{comp}) \\times 0.5",
            "worked_example": "If V_raw = 1.20V at 25.0°C: V_comp = 1.20 / (1.0 + 0) = 1.20V. TDS = [133.42*(1.20)^3 - 255.86*(1.20)^2 + 857.39*(1.20)] * 0.5 = [133.42*1.728 - 255.86*1.44 + 1028.87] * 0.5 = [230.55 - 368.44 + 1028.87] * 0.5 = 890.98 * 0.5 = 445.5 ppm, representing mineral-rich hard tap water."
        },
        "testing": [
            {"id": "T11-01", "procedure": "Submerge probe into a glass of pure distilled / demineralized water.", "expected": "Dashboard reads 0 to 15 ppm; status displays 'EXCELLENT / PURE'.", "actual": ""},
            {"id": "T11-02", "procedure": "Transfer probe into normal municipal tap water.", "expected": "Dashboard reads 120 to 280 ppm; status displays 'GOOD / POTABLE'.", "actual": ""},
            {"id": "T11-03", "procedure": "Dissolve 1 pinch (approx 0.5g) of table salt (NaCl) into the tap water.", "expected": "TDS immediately spikes above 800 ppm; status displays 'UNACCEPTABLE / CONTAMINATED'.", "actual": ""},
            {"id": "T11-04", "procedure": "Remove probe from water and hold in open air.", "expected": "ADC drops to near zero; dashboard reads 0 ppm; status flags 'PROBE_DRY'.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "TDS reading drops over time while probe is held stationary in water", "cause": "Air micro-bubbles clinging to titanium probe pins", "diag": "Inspect probe pins underwater under bright lighting", "solution": "Swirl the probe gently in the solution to dislodge trapped bubbles."},
            {"issue": "Reading fluctuates by ±50 ppm constantly", "cause": "RF noise coupling into high-impedance probe cables from Wi-Fi", "diag": "Inspect raw ADC readings with Wi-Fi transmitting vs idle", "solution": "Increase software median sample count to 30; keep probe cable separated from ESP8266 antenna."},
            {"issue": "TDS reads unexpectedly low in very hot water", "cause": "Missing or improperly tuned temperature compensation", "diag": "Measure water temperature with thermometer", "solution": "Integrate DS18B20 waterproof probe for dynamic real-time ATC."}
        ],
        "safety": "Do not submerge the black plastic transmitter module or cable connector into water; only the titanium probe tip is waterproof. Do not drink water tested with industrial probes unless certified clean.",
        "outcomes": "Explain electrochemical conduction in water, implement AC probe excitation, apply polynomial calibration curves, perform Automatic Temperature Compensation (ATC), and assess drinking water quality standards.",
        "viva": [
            {"q": "What does TDS stand for and what units is it measured in?", "a": "Total Dissolved Solids, representing the cumulative mass of mobile dissolved inorganic ions, measured in parts per million (ppm) or mg/L."},
            {"q": "Why can DC current not be used to measure water conductivity?", "a": "Direct current causes electrolytic electrolysis, causing bubbles and chemical electroplating on the electrodes, creating a polarizing counter-EMF that corrupts the reading."},
            {"q": "How does the TDS transmitter board prevent probe polarization?", "a": "It incorporates a high-frequency AC oscillator circuit (~1kHz to 10kHz) that continuously reverses current direction, preventing ion accumulation."},
            {"q": "Why is temperature compensation (ATC) mandatory for accurate TDS measurement?", "a": "Water viscosity decreases with temperature, allowing ions to move faster and increasing electrical conductivity by approximately 2% per °C rise, even if salt concentration remains unchanged."},
            {"q": "What is the standard reference temperature for TDS and EC measurements?", "a": "25.0°C (77.0°F). All raw conductivity readings must be mathematically normalized to 25°C."},
            {"q": "Can a TDS meter detect bacterial contamination or chemical pesticides?", "a": "No. TDS meters only detect charged inorganic dissolved mineral ions (salts, minerals). Non-ionized organic pollutants, bacteria, and viruses do not conduct electricity."},
            {"q": "What is the typical TDS threshold for acceptable drinking water according to the WHO?", "a": "Below 300 ppm is considered excellent; 300–600 ppm is good; 600–900 ppm is fair; above 1000 ppm is considered unpalatable and non-potable."},
            {"q": "What is the mathematical relationship between Electrical Conductivity (EC) and TDS?", "a": "TDS (ppm) ≈ EC (µS/cm) * 0.5 to 0.7, depending on the specific mineral composition of the water."}
        ],
        "exercises": {
            "beginner": "Compare TDS readings between filtered water, tap water, bottled mineral water, and rainwater, recording results in a lab table.",
            "intermediate": "Add a visual water quality gauge widget on the web dashboard with custom color bands: Blue (<150), Green (150-300), Yellow (300-500), Red (>500).",
            "advanced": "Integrate an in-line solenoid valve that automatically diverts water to drain if TDS exceeds 500 ppm, protecting sensitive RO membranes."
        }
    },
    {
        "id": "12",
        "folder": "12-vibration-tilt-monitor",
        "title": "Vibration & Tilt Monitor — Dual-Sensor Structural Health Telemetry",
        "category": "Category A — Sensors & Monitoring",
        "overview": {
            "intro": "The Vibration & Tilt Monitor is a structural health and seismic telemetry station combining a high-sensitivity SW-420 mechanical vibration switch with an MPU-6050 6-axis MEMS inertial measurement unit (IMU).",
            "problem": "Bridges, industrial machinery, elevators, and wind turbines undergo structural fatigue and mechanical imbalance that lead to catastrophic failures if subtle vibration spikes and angular tilt shifts are unmonitored.",
            "objectives": "Interface the SW-420 vibration switch via hardware interrupts on GPIO15 (D8) and the MPU-6050 via I²C on GPIO5/GPIO4 (D1/D2), compute real-time roll/pitch Euler angles, calculate Root Mean Square (RMS) acceleration, and trigger seismic/shock alerts over Wi-Fi.",
            "outcome": "A dual-sensor telemetry monitor displaying live 3-axis acceleration, roll/pitch angular tilt, mechanical shock counts, and structural integrity alarms.",
            "difficulty": "Advanced",
            "time": "3.5 Hours",
            "prior_knowledge": "MEMS accelerometer/gyroscope operation, I²C bus protocol, trigonometric tilt calculations (atan2), and digital filtering."
        },
        "principle": "The SW-420 contains a gold-plated spring resting against a conductive contact pin inside a sealed tube; shock waves induce momentary contact bounce, causing the onboard LM393 comparator to pulse digital line DO. Concurrently, the MPU-6050 houses a 3-axis micro-machined capacitive accelerometer and a 3-axis vibrating ring gyroscope. Acceleration along X, Y, and Z axes produces capacitive deflection sampled by internal 16-bit ADCs. The ESP8266 polls the MPU-6050 via I²C (address 0x68). Pitch and Roll angles are derived using trigonometry: Pitch = atan2(-Ax, sqrt(Ay^2 + Az^2)) * (180 / pi); Roll = atan2(Ay, Az) * (180 / pi). Combined total vibration energy is computed as RMS acceleration: G_total = sqrt(Ax^2 + Ay^2 + Az^2).",
        "applications": [
            "Industrial electric motor bearing vibration and imbalance surveillance.",
            "Civil infrastructure structural monitoring (bridges, overpasses, tall towers).",
            "Earthquake seismic shock and building tilt safety cut-off systems.",
            "Automated cargo logistics transit impact and tilt datalogging."
        ],
        "benefits_limitations": {
            "benefits": "Dual sensing: ultra-fast transient shock detection (SW-420) plus continuous precision 6-axis spatial tracking (MPU-6050); high dynamic range (±2g to ±16g, ±250°/s to ±2000°/s).",
            "limitations": "MEMS gyroscope suffers integration drift over time; accelerometer sensitive to centrifugal and linear external accelerations; SW-420 lacks magnitude quantification."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, I²C bus master, and Wi-Fi REST web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "MPU-6050 6-Axis IMU Module", "qty": "1", "purpose": "3-axis accelerometer and 3-axis gyroscope", "spec": "16-bit ADCs, I²C bus (0x68), 3.3V–5V onboard regulator", "status": "Mandatory"},
            {"component": "SW-420 Vibration Sensor Module", "qty": "1", "purpose": "Transient shock and vibration switch with LM393", "spec": "Digital DO output, adjustable sensitivity trimmer", "status": "Mandatory"},
            {"component": "Metal-Film Pull-Up Resistors (4.7kΩ)", "qty": "2", "purpose": "I²C bus lines (SCL and SDA) pull-up", "spec": "1/4W, 1% tolerance", "status": "Optional (MPU-6050 board usually includes)"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit assembly platform", "spec": "400 or 830 tie-points", "status": "Mandatory"},
            {"component": "Jumper Wires (M-to-M & M-to-F)", "qty": "10", "purpose": "Interconnect wiring", "spec": "24 AWG stranded", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, small flathead screwdriver (for SW-420 trimmer tuning), rigid mounting platform or ruler, Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "MPU-6050 VCC", "pin": "VCC", "controller": "NodeMCU 3V3 Pin", "notes": "Powers internal MEMS silicon and digital processor"},
            {"comp": "MPU-6050 GND", "pin": "GND", "controller": "NodeMCU GND", "notes": "Shared ground reference"},
            {"comp": "MPU-6050 SCL", "pin": "SCL", "controller": "NodeMCU D1 (GPIO 5)", "notes": "Hardware I²C Clock line"},
            {"comp": "MPU-6050 SDA", "pin": "SDA", "controller": "NodeMCU D2 (GPIO 4)", "notes": "Hardware I²C Data line"},
            {"comp": "MPU-6050 AD0", "pin": "AD0", "controller": "NodeMCU GND", "notes": "Selects I²C address 0x68 (tied to GND)"},
            {"comp": "SW-420 VCC", "pin": "VCC", "controller": "NodeMCU 3V3 Pin", "notes": "Powers onboard LM393 comparator"},
            {"comp": "SW-420 GND", "pin": "GND", "controller": "NodeMCU GND", "notes": "Shared ground reference"},
            {"comp": "SW-420 DO", "pin": "DO", "controller": "NodeMCU D8 (GPIO 15)", "notes": "Digital shock pulse; ensure D8 is LOW at boot"}
        ],
        "pin_config": [
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "I²C Clock (SCL)", "type": "Digital Open-Drain / I²C", "notes": "Boot-safe; shared I²C bus."},
            {"pin": "D2", "gpio": "GPIO 4", "purpose": "I²C Data (SDA)", "type": "Digital Open-Drain / I²C", "notes": "Boot-safe; shared I²C bus."},
            {"pin": "D8", "gpio": "GPIO 15", "purpose": "SW-420 Shock Interrupt", "type": "Digital Input", "notes": "MUST BE LOW AT BOOT. SW-420 idle state is normally LOW."}
        ],
        "firmware": {
            "key_constants": "MPU_ADDR = 0x68; VIB_PIN = 15; TILT_THRESHOLD_DEG = 15.0; SHOCK_THRESHOLD_G = 1.8;",
            "logic": "In setup(), the sketch wakes the MPU-6050 by writing 0x00 to register 0x6B (PWR_MGMT_1) and attaches a rising-edge interrupt to D8 for the SW-420 shock counter. In the loop, it bursts 14 bytes from register 0x3B to read raw 16-bit Accel and Gyro data, divides by sensitivity scale factors (16384 LSB/g for ±2g), computes Pitch and Roll Euler angles using atan2, and calculates total vector magnitude G_total = sqrt(Ax^2 + Ay^2 + Az^2). Telemetry is served via /api/readings, /api/health, and /api/device endpoints. Tilt alert triggers if |Pitch| or |Roll| > 15°; Shock alert triggers if G_total > 1.8g."
        },
        "theory": {
            "formula": "\\text{Pitch} = \\arctan2\\left(-A_x, \\sqrt{A_y^2 + A_z^2}\\right) \\times \\frac{180}{\\pi}, \\quad \\text{Roll} = \\arctan2(A_y, A_z) \\times \\frac{180}{\\pi}, \\quad G_{total} = \\sqrt{A_x^2 + A_y^2 + A_z^2}",
            "worked_example": "When sitting completely flat under Earth's gravity: Ax = 0.0g, Ay = 0.0g, Az = 1.0g. Pitch = atan2(0, 1.0) * (180/pi) = 0.0°. Roll = atan2(0, 1.0) * (180/pi) = 0.0°. G_total = sqrt(0 + 0 + 1) = 1.0g. If tilted 30° along X: Ax = 0.5g, Ay = 0.0g, Az = 0.866g. Pitch = atan2(-0.5, sqrt(0 + 0.75)) * (180/pi) = atan2(-0.5, 0.866) * (180/pi) = -30.0°."
        },
        "testing": [
            {"id": "T12-01", "procedure": "Place breadboard flat on a level tabletop.", "expected": "Roll and Pitch read 0.0° ±1.5°; G_total reads 1.00g ±0.05g; status displays 'STABLE'.", "actual": ""},
            {"id": "T12-02", "procedure": "Tilt breadboard forward by 20° along pitch axis.", "expected": "Pitch angle reads +20.0° ±2.0°; dashboard highlights 'EXCESSIVE_TILT_ALERT'.", "actual": ""},
            {"id": "T12-03", "procedure": "Tap the table firmly near the breadboard with knuckles.", "expected": "SW-420 triggers interrupt; shock event counter increments; G_total momentarily spikes > 1.8g.", "actual": ""},
            {"id": "T12-04", "procedure": "Disconnect SDA wire while running to test I²C error handling.", "expected": "I²C bus transaction fails gracefully; firmware flags 'IMU_BUS_ERROR' without freezing ESP8266.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "ESP8266 hangs during startup or fails to boot", "cause": "SW-420 outputting HIGH on D8 (GPIO15) during power-up", "diag": "Measure voltage on D8 during power cycle; if HIGH, bootloader fails", "solution": "Adjust SW-420 trimmer so output sits LOW when idle, or connect to D7 instead."},
            {"issue": "MPU-6050 not detected on I²C bus (returns 0xFF or fails begin)", "cause": "AD0 pin floating or wrong I²C address", "diag": "Run an I²C scanner sketch; check if device responds at 0x68 or 0x69", "solution": "Tie AD0 pin firmly to GND for address 0x68 (or to 3.3V for 0x69)."},
            {"issue": "Pitch and roll angles drift continuously over several minutes", "cause": "Integrating pure gyroscope rate without accelerometer gravity reference", "diag": "Check if math uses raw gyro integral instead of accelerometer atan2 or complementary filter", "solution": "Use accelerometer atan2 for static tilt or implement a complementary filter (alpha = 0.96)."}
        ],
        "safety": "Handle the MPU-6050 with electrostatic discharge (ESD) precautions; MEMS structures are sensitive to static shock. Securely bolt or clamp the sensor to machinery under test to prevent detachment during violent vibration.",
        "outcomes": "Master I²C protocol communication with complex MEMS sensors, compute 3-axis Euler angles from gravitational acceleration, implement hardware interrupt shock counting, configure complementary filtering, and design industrial structural health monitors.",
        "viva": [
            {"q": "How does a capacitive MEMS accelerometer detect linear acceleration?", "a": "A microscopic silicon proof mass is suspended on compliant silicon springs between fixed capacitive plates. Acceleration deflects the mass, altering differential capacitance, which is converted to voltage by internal ADCs."},
            {"q": "Why does the accelerometer read 1.0g when resting completely motionless on a table?", "a": "It measures specific force, which includes the 1.0g upward normal force exerted by the table preventing the sensor from free-falling under Earth's gravity."},
            {"q": "What is the difference between an accelerometer and a gyroscope in the MPU-6050?", "a": "The accelerometer measures linear acceleration (including static gravity to determine tilt); the gyroscope measures angular rate of rotation (°/s) around the three axes."},
            {"q": "Why is atan2() used instead of atan() to calculate pitch and roll?", "a": "atan2(y, x) computes the arctangent using the signs of both arguments, determining the correct quadrant across a full 360-degree range (-180° to +180°) without division-by-zero errors."},
            {"q": "What is the function of the SW-420 module alongside the MPU-6050?", "a": "The SW-420 acts as an ultra-fast zero-power hardware interrupt trigger for sudden seismic shock or impacts, waking or alerting the system without continuous high-speed I²C polling."},
            {"q": "What is the default I²C address of the MPU-6050 and how can it be changed?", "a": "The default address is 0x68 when AD0 is pulled to GND. Connecting AD0 to VCC changes the address to 0x69."},
            {"q": "What register in the MPU-6050 must be written during setup to wake it from sleep?", "a": "Register 0x6B (PWR_MGMT_1) must be set to 0x00; upon power-on, the sensor defaults to sleep mode to conserve power."},
            {"q": "What is a complementary filter in IMU sensor fusion?", "a": "A filter combining high-pass filtered gyroscope data (accurate for fast motions) with low-pass filtered accelerometer data (accurate for slow, static gravity orientation): Angle = alpha * (Angle + Gyro * dt) + (1 - alpha) * Accel."}
        ],
        "exercises": {
            "beginner": "Adjust the tilt alert threshold from 15° to 25° in the firmware and observe the web dashboard indicator.",
            "intermediate": "Implement a complementary filter algorithm in the firmware to smoothly blend accelerometer and gyroscope data at 50Hz.",
            "advanced": "Design an automated machine shutdown relay on D5 that opens if RMS vibration exceeds 2.5g for more than 3 consecutive seconds (motor bearing failure protection)."
        }
    }
]

if __name__ == "__main__":
    print(f"Loaded {len(PROJECTS_CAT_A_PART2)} projects in Category A Part 2.")
