"""
Tech IoT Warriors — Handbook Data Module: Category B (Part 1: Projects 13–18)
Automation & Actuation Systems
"""

PROJECTS_CAT_B_PART1 = [
    {
        "id": "13",
        "folder": "13-automatic-plant-watering",
        "title": "Automatic Plant Watering — Soil Moisture Closed-Loop Irrigation",
        "category": "Category B — Automation & Actuation",
        "overview": {
            "intro": "The Automatic Plant Watering System is a closed-loop precision agricultural controller integrating a capacitive soil moisture sensor with an optocoupled relay module driving a 5V/12V submersible DC water pump.",
            "problem": "Both under-watering and over-watering cause root rot, stunted plant growth, and massive agricultural water waste when irrigation depends on arbitrary manual schedules.",
            "objectives": "Sample soil volumetric water content on ADC0, implement a deadband hysteresis control loop, actuate an optoisolated DC water pump via GPIO5 (D1), enforce pump timeout safety interlocks, and stream telemetry to a web dashboard.",
            "outcome": "An autonomous precision irrigation controller maintaining soil moisture within optimal botanical bounds with real-time web telemetry and safety run-time limits.",
            "difficulty": "Beginner",
            "time": "2.5 Hours",
            "prior_knowledge": "Capacitive moisture sensing, relay driver circuits, inductive flyback protection, and hysteresis control logic."
        },
        "principle": "The capacitive soil probe outputs an analog voltage inversely proportional to soil water content (dielectric permittivity of water is ~80, dry air is 1). The ESP8266 ADC0 quantizes this voltage. When moisture drops below the calibrated trigger point (e.g. <30%), the firmware energizes the relay on GPIO5 (active-LOW) for a preset duration (e.g. 5 seconds) to deliver water to the root zone. A deadband margin (e.g. pump off above 60%) prevents rapid relay chatter. An inductive flyback clamp diode (1N4007) across the pump terminals absorbs high-voltage inductive kickback.",
        "applications": [
            "Smart indoor home greenhouse and potted plant self-watering systems.",
            "Commercial nursery polyhouse micro-drip irrigation automation.",
            "Rooftop urban garden automated water conservation controllers.",
            "Botanical research environmental test chambers."
        ],
        "benefits_limitations": {
            "benefits": "Corrosion-resistant capacitive probe; closed-loop feedback maintains exact hydration; optoisolation protects microcontroller; software safety run-time limits.",
            "limitations": "Soil salinity or fertilizer concentration alters dielectric reading slightly; single probe monitors only localized root zone volume; pump requires dedicated DC power rail."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Microcontroller, moisture sampler, and Wi-Fi web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "Capacitive Soil Moisture Sensor v1.2", "qty": "1", "purpose": "Corrosion-resistant analog soil moisture probe", "spec": "Operating voltage 3.3V, analog output 1.2V–3.0V", "status": "Mandatory"},
            {"component": "1-Channel Relay Module (Optocoupled)", "qty": "1", "purpose": "High-current DC pump power switching", "spec": "5V coil, 10A 250VAC / 30VDC contacts, active-LOW", "status": "Mandatory"},
            {"component": "5V DC Submersible Mini Water Pump", "qty": "1", "purpose": "Water delivery actuator", "spec": "5V DC, 100–200 mA, 80–120 L/hr flow rate", "status": "Mandatory"},
            {"component": "1N4007 Silicon Rectifier Diode", "qty": "1", "purpose": "Inductive flyback voltage suppression", "spec": "1000V, 1A standard recovery diode", "status": "Mandatory"},
            {"component": "Flexible Vinyl Tubing (6mm ID)", "qty": "1 meter", "purpose": "Water delivery conduit", "spec": "6mm inner diameter food-grade PVC", "status": "Mandatory"},
            {"component": "External 5V 2A DC Power Supply", "qty": "1", "purpose": "Dedicated power for pump and relay coil", "spec": "Regulated 5.0V ±5%, 2000mA", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, wire strippers, small screwdriver for relay screw terminals, water reservoir (beaker or container), plant pot with soil, Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "Soil Sensor VCC", "pin": "VCC", "controller": "NodeMCU 3V3 Pin", "notes": "Must be powered from 3.3V to keep analog output within 0–3.3V range"},
            {"comp": "Soil Sensor GND", "pin": "GND", "controller": "NodeMCU GND", "notes": "Shared common ground"},
            {"comp": "Soil Sensor AOUT", "pin": "AOUT", "controller": "NodeMCU A0 (ADC0)", "notes": "Analog voltage output proportional to soil dryness"},
            {"comp": "Relay Module VCC", "pin": "VCC", "controller": "External 5V Rail (+)", "notes": "Relay coil requires 5.0V for reliable magnetic closure"},
            {"comp": "Relay Module GND", "pin": "GND", "controller": "Common Ground (-)", "notes": "Shared ground with NodeMCU and 5V supply"},
            {"comp": "Relay Module IN", "pin": "IN1", "controller": "NodeMCU D1 (GPIO 5)", "notes": "Active-LOW control signal from microcontroller"},
            {"comp": "Relay Common (COM)", "pin": "COM", "controller": "External 5V Rail (+)", "notes": "Switches the positive supply to the water pump"},
            {"comp": "Relay Normally Open (NO)", "pin": "NO", "controller": "DC Pump Positive Lead (+)", "notes": "Connects power when relay is energized"},
            {"comp": "DC Pump Negative Lead (-)", "pin": "GND", "controller": "Common Ground (-)", "notes": "Direct return to power supply ground"},
            {"comp": "1N4007 Flyback Diode", "pin": "Cathode/Anode", "controller": "Across DC Pump (+) and (-)", "notes": "CRITICAL: Cathode (white stripe) to (+), Anode to (-)"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "Soil Moisture Analog Voltage", "type": "Analog Input (0–3.3V)", "notes": "Reads 0–1023; calibrated to 0–100% moisture."},
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "Water Pump Relay Actuator", "type": "Digital Output (Active-LOW)", "notes": "Boot-safe; drives relay optocoupler LOW to energize."}
        ],
        "firmware": {
            "key_constants": "RELAY_PIN = 5; SOIL_PIN = A0; DRY_THRESHOLD = 30.0; WET_THRESHOLD = 60.0; MAX_PUMP_RUN_SEC = 10;",
            "logic": "The sketch samples A0, maps the voltage to 0–100% moisture, and evaluates irrigation logic. If moisture < DRY_THRESHOLD and the pump is idle, it energizes the relay (digitalWrite(RELAY_PIN, LOW)). A safety watchdog cuts power if the pump runs continuously for MAX_PUMP_RUN_SEC (preventing reservoir flooding if the probe is removed). A mandatory 60-second soak timer prevents immediate re-triggering. Interactive web endpoints (/api/readings, /api/health, /api/command, /api/device) allow manual remote pump overrides and threshold tuning."
        },
        "theory": {
            "formula": "\\text{Moisture \\%} = \\left( \\frac{V_{dry} - V_{measured}}{V_{dry} - V_{wet}} \\right) \\times 100\\%, \\quad V_{kickback} = -L \\frac{di}{dt}",
            "worked_example": "If calibration yields V_dry = 2.80V (ADC 868) and V_wet = 1.40V (ADC 434): When A0 reads 2.10V (ADC 651): Moisture % = ((2.80 - 2.10) / (2.80 - 1.40)) * 100% = (0.70 / 1.40) * 100% = 50.0%. Since 50% is between 30% and 60%, the pump remains OFF."
        },
        "testing": [
            {"id": "T13-01", "procedure": "Hold capacitive probe in dry open air.", "expected": "Moisture reads 0%–5%; Relay energizes (clicks ON); Pump runs for max 10 seconds then safety halts.", "actual": ""},
            {"id": "T13-02", "procedure": "Submerge capacitive probe blade into a glass of water.", "expected": "Moisture jumps to 95%–100%; Relay immediately de-energizes (clicks OFF).", "actual": ""},
            {"id": "T13-03", "procedure": "Insert probe into a pot of dry soil; allow pump to deliver water to the base.", "expected": "Pump runs; as water permeates the root zone, moisture rises; pump shuts off once moisture exceeds 60%.", "actual": ""},
            {"id": "T13-04", "procedure": "Send HTTP POST /api/command with {\"action\": \"pump_on\"} from dashboard.", "expected": "Relay energizes immediately for 5 seconds manual irrigation cycle.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "ESP8266 reboots whenever the water pump switches ON or OFF", "cause": "Inductive electrical noise or voltage brownout on power rail", "diag": "Measure 5V rail with DMM during pump start; check for missing flyback diode", "solution": "Install 1N4007 clamp diode directly across pump leads; use a dedicated 5V 2A external power supply."},
            {"issue": "Moisture percentage reads inverted (shows 100% in dry air)", "cause": "Mapping formula inverted in firmware", "diag": "Inspect raw ADC value: higher voltage = drier soil", "solution": "Ensure formula subtracts measured value from dry reference."},
            {"issue": "Relay LED lights up but pump does not rotate", "cause": "Missing external 5V connection to relay COM terminal or jammed impeller", "diag": "Test DC voltage across pump terminals when relay is closed", "solution": "Verify 5V power rail is wired to relay COM and pump negative to GND."}
        ],
        "safety": "Never operate the submersible pump completely dry for more than 15 seconds; water provides mechanical lubrication for the impeller. Maintain physical isolation between water reservoirs and AC electrical mains.",
        "outcomes": "Implement closed-loop hysteresis control, interface high-power inductive loads with microcontrollers, apply flyback diode clamping, configure hardware-in-the-loop safety watchdog timers, and manage automated irrigation via REST APIs.",
        "viva": [
            {"q": "Why is an optocoupler used on the relay module?", "a": "An optocoupler uses an internal LED and phototransistor to achieve galvanic electrical isolation (~2500V), preventing inductive motor spikes and noise from reaching the ESP8266."},
            {"q": "What is the function of the 1N4007 flyback diode across the DC pump?", "a": "When the relay opens, the pump motor's magnetic field collapses, inducing a massive reverse voltage (V = -L di/dt). The reverse-biased diode safely clamps this spike back into the motor coil."},
            {"q": "Why is a capacitive soil probe superior to resistive prongs?", "a": "Resistive prongs pass direct DC current through the soil, causing rapid electrolytic corrosion and metal stripping within weeks. Capacitive probes are insulated with soldermask, preventing corrosion."},
            {"q": "What is hysteresis in a bang-bang closed-loop control system?", "a": "Hysteresis introduces separate turn-on (e.g. <30%) and turn-off (e.g. >60%) thresholds. This prevents rapid relay chattering and mechanical wear near the setpoint boundary."},
            {"q": "Why is active-LOW signaling standard on 5V relay modules?", "a": "ESP8266 GPIOs output 3.3V HIGH. When driving a 5V PNP/photodiode circuit, pulling the pin LOW to 0V provides a full 3.3V potential difference to turn ON the optodiode reliably."},
            {"q": "What is the purpose of the software maximum run-time watchdog?", "a": "If the water reservoir runs dry or the sensor is accidentally pulled out of the soil, the pump could run forever, burning out the motor and overflowing the area."},
            {"q": "Why is soil volumetric water content (VWC) non-linear with probe capacitance?", "a": "Soil is a heterogeneous mixture of air (dielectric ~1), mineral grains (~4), and water (~80). The overall bulk dielectric constant rises sharply with initial moisture then flattens."},
            {"q": "What is the maximum current capacity of the standard Songle 5V relay?", "a": "10 Amps at 250V AC or 30V DC (resistive load), far exceeding the needs of mini 5V submersible pumps (~0.3A)."}
        ],
        "exercises": {
            "beginner": "Change the dry trigger threshold in the web dashboard from 30% to 45% and test with partially moist soil.",
            "intermediate": "Add an alert email or webhook notification triggered whenever the pump runs for the maximum timeout duration (indicating empty water reservoir).",
            "advanced": "Implement an adaptive watering algorithm that scales pump run-time duration based on ambient temperature and humidity data fetched from Project 04 (DHT22)."
        }
    },
    {
        "id": "14",
        "folder": "14-smart-water-tank-controller",
        "title": "Smart Water Tank Controller — Dual-Level Sonar & Auto-Fill Pump Hub",
        "category": "Category B — Automation & Actuation",
        "overview": {
            "intro": "The Smart Water Tank Controller is an industrial automation station integrating an HC-SR04 ultrasonic transducer, a physical float switch backup, and a 10A optoisolated relay module to fully automate water replenishment in rooftop and storage tanks.",
            "problem": "Unmanaged water tanks frequently run dry during peak hours, causing pump cavitation, or overflow wastefully, causing structural water damage and electricity loss.",
            "objectives": "Measure real-time water ullage using an ultrasonic sensor, integrate a physical magnetic float switch on GPIO12 (D6) for hardware overflow interlock, automate pump switching on GPIO14 (D5), and provide remote manual overrides over Wi-Fi.",
            "outcome": "A self-governing water pump automation system featuring ultrasonic depth tracking, mechanical float fail-safe interlock, dry-run protection, and cloud telemetry.",
            "difficulty": "Intermediate",
            "time": "3.5 Hours",
            "prior_knowledge": "Ultrasonic distance calculations, relay driving, hardware safety interlocks, and state machine design."
        },
        "principle": "The controller executes a multi-layered state machine. Primary level sensing is provided by the HC-SR04 ultrasonic transducer mounted on the tank ceiling. When water level falls below 20% capacity, the pump relay energizes (GPIO14 LOW) to start filling. When water reaches 90% capacity, the pump shuts off. As a fail-safe against ultrasonic sensor blindness or software lockups, a magnetic reed float switch is mounted at the 95% overflow line; if water lifts the float, a hardware interrupt on GPIO12 immediately cuts relay power independently of the main loop. A software timer prevents dry-running if water level fails to rise within 5 minutes of pump activation.",
        "applications": [
            "Residential overhead rooftop water tank automation and leak prevention.",
            "Commercial industrial cooling tower sump replenishment.",
            "Agricultural rainwater harvesting storage and transfer pumping.",
            "Hotel and dormitory centralized hot/cold water supply management."
        ],
        "benefits_limitations": {
            "benefits": "Dual redundancy: acoustic telemetry plus mechanical float switch; zero overflow risk; dry-run pump burnout protection; complete web-based manual override.",
            "limitations": "Ultrasonic sensor requires minimum 5cm standoff distance above max fill line; splashing during rapid filling requires digital filtering."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, state machine processor, and Wi-Fi web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "HC-SR04 Ultrasonic Sensor", "qty": "1", "purpose": "Continuous non-contact water level tracking", "spec": "40kHz, 2cm–400cm range, 5V supply", "status": "Mandatory"},
            {"component": "Magnetic Float Switch (Vertical)", "qty": "1", "purpose": "Hardware fail-safe high-level overflow interlock", "spec": "PP plastic, reed switch, normally open (NO) in dry state", "status": "Mandatory"},
            {"component": "1-Channel Relay Module (Optocoupled)", "qty": "1", "purpose": "AC/DC water pump motor switching", "spec": "5V coil, 10A 250VAC contacts, active-LOW", "status": "Mandatory"},
            {"component": "Resistors (1kΩ, 2kΩ, 10kΩ)", "qty": "1 each", "purpose": "Echo voltage divider (1k/2k) and float switch pullup (10k)", "spec": "1/4W, 1% metal film", "status": "Mandatory"},
            {"component": "1N4007 Diode", "qty": "1", "purpose": "Flyback diode for DC pump motor", "spec": "1000V, 1A silicon rectifier", "status": "Mandatory if DC pump used"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit assembly platform", "spec": "400 or 830 tie-points", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, wire strippers, miniature screwdrivers for terminal blocks, prototype water bucket or clear cylinder, Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "HC-SR04 VCC", "pin": "VCC", "controller": "NodeMCU Vin (5V USB rail)", "notes": "Requires 5.0V for full acoustic range"},
            {"comp": "HC-SR04 GND", "pin": "GND", "controller": "NodeMCU GND", "notes": "Shared common ground"},
            {"comp": "HC-SR04 Trig", "pin": "Trig", "controller": "NodeMCU D1 (GPIO 5)", "notes": "Digital trigger pulse output"},
            {"comp": "HC-SR04 Echo", "pin": "Echo", "controller": "1kΩ series &rarr; D2 (GPIO 4)", "notes": "1kΩ in series to D2; 2kΩ from D2 to GND (5V &rarr; 3.33V level shift)"},
            {"comp": "Float Switch Lead 1", "pin": "Terminal 1", "controller": "NodeMCU D6 (GPIO 12)", "notes": "Digital input with 10kΩ internal/external pull-up to 3.3V"},
            {"comp": "Float Switch Lead 2", "pin": "Terminal 2", "controller": "NodeMCU GND", "notes": "Pulls D6 to GND when water lifts the magnetic float ring"},
            {"comp": "Relay Module IN", "pin": "IN", "controller": "NodeMCU D5 (GPIO 14)", "notes": "Active-LOW pump control output"},
            {"comp": "Relay Module VCC", "pin": "VCC", "controller": "NodeMCU Vin (5V)", "notes": "Powers relay coil"},
            {"comp": "Relay Module GND", "pin": "GND", "controller": "NodeMCU GND", "notes": "Shared common ground"}
        ],
        "pin_config": [
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "Ultrasonic Trigger", "type": "Digital Output", "notes": "Boot-safe; emits 10µs acoustic pulses."},
            {"pin": "D2", "gpio": "GPIO 4", "purpose": "Ultrasonic Echo", "type": "Digital Input", "notes": "Boot-safe; pulseIn() measured with 30ms timeout."},
            {"pin": "D5", "gpio": "GPIO 14", "purpose": "Water Pump Relay Output", "type": "Digital Output (Active-LOW)", "notes": "Boot-safe; LOW energizes relay coil to run pump."},
            {"pin": "D6", "gpio": "GPIO 12", "purpose": "Float Switch Fail-Safe Input", "type": "Digital Input (Pull-Up)", "notes": "Boot-safe; pulling LOW triggers emergency hardware cutoff."}
        ],
        "firmware": {
            "key_constants": "TRIG_PIN = 5; ECHO_PIN = 4; PUMP_RELAY = 14; FLOAT_PIN = 12; LOW_LEVEL_PCT = 20; HIGH_LEVEL_PCT = 90;",
            "logic": "The loop calculates tank water level percentage every 500ms using a 5-sample median filter. If Float Switch (D6) is LOW (float raised), the pump is forced OFF instantly, overriding all software logic. Otherwise, if water level < LOW_LEVEL_PCT, the pump relay turns ON. The pump remains ON until water level reaches HIGH_LEVEL_PCT. If the pump runs for >300 seconds without water level rising by at least 5%, the system transitions to DRY_RUN_ERROR state and shuts down. REST endpoints (/api/readings, /api/health, /api/command, /api/device) allow full monitoring, threshold adjustment, and manual pump override."
        },
        "theory": {
            "formula": "\\text{Level \\%} = \\left( \\frac{H_{tank} - \\text{Distance}}{H_{tank} - H_{deadzone}} \\right) \\times 100\\%, \\quad t_{fill} = \\frac{V_{tank} \\times (1 - \\text{Start\\%})}{Q_{pump}}",
            "worked_example": "For a 100cm tank with a 10cm deadzone: Usable height = 90cm. If Echo distance is 64cm: Water Depth = 100 - 64 = 36cm. Usable Depth = 36 - 10 = 26cm. Level % = (26 / 90) * 100% = 28.8%. Since 28.8% > 20%, pump does not auto-start. If distance increases to 75cm (Depth 25cm, Usable 15cm, Level 16.7%), pump automatically starts filling."
        },
        "testing": [
            {"id": "T14-01", "procedure": "Start with water level below 20% in test tank.", "expected": "Pump relay clicks ON immediately; Web dashboard displays PUMP_RUNNING status.", "actual": ""},
            {"id": "T14-02", "procedure": "Fill tank until ultrasonic distance indicates >90% water level.", "expected": "Pump relay clicks OFF cleanly; Dashboard displays TANK_FULL status.", "actual": ""},
            {"id": "T14-03", "procedure": "While pump is running, manually lift the float switch ring upward.", "expected": "Pump relay shuts OFF instantly (<10ms); Dashboard displays 'FLOAT_FAILSAFE_TRIPPED'.", "actual": ""},
            {"id": "T14-04", "procedure": "Send HTTP POST /api/command with {\"action\": \"pump_off\"} while pump is filling.", "expected": "Relay de-energizes immediately in response to remote web override.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Pump turns ON and OFF repeatedly every few seconds", "cause": "Water turbulence causing ultrasonic distance reading to fluctuate around thresholds", "diag": "Inspect raw distance telemetry log during active pumping", "solution": "Increase software median sample window to 9 samples; ensure at least 15% hysteresis between start and stop."},
            {"issue": "Float switch never triggers when water lifts it", "cause": "Float switch mounted upside down or reed magnet reversed", "diag": "Test continuity with DMM while sliding float collar manually", "solution": "Invert the float ring on the stem or flip the switch orientation."},
            {"issue": "Pump shuts down after 5 minutes with DRY_RUN_ERROR", "cause": "Water source empty or pump air-locked", "diag": "Inspect water output hose and intake line", "solution": "Prime the pump impeller; inspect source water line; reset error state via web dashboard."}
        ],
        "safety": "Ensure all AC mains connections to commercial water pumps are routed through an Earth Leakage Circuit Breaker (ELCB / RCCB). Always enclosure all relay boards in an IP65 rated waterproof electrical junction box away from splash zones.",
        "outcomes": "Design fault-tolerant dual-redundant automation systems, implement hardware fail-safe interlocks, calculate liquid displacement dynamics, handle sensor edge-cases and surface turbulence, and operate remote industrial pump stations.",
        "viva": [
            {"q": "Why is a physical float switch included when an ultrasonic sensor is already present?", "a": "Defense-in-depth engineering. If the ultrasonic sensor fails due to condensation, spiderwebs, or microprocessor hangs, the hardwired float switch prevents catastrophic rooftop tank flooding."},
            {"q": "What is pump cavitation and how does the dry-run watchdog prevent it?", "a": "Cavitation occurs when a pump draws air or vapor bubbles due to empty suction lines, causing extreme impeller shock waves that destroy pump bearings. The watchdog cuts power before damage occurs."},
            {"q": "Why is the ultrasonic deadzone (standoff distance) critical in tank mounting?", "a": "Within 2cm–5cm, the transducer is still ringing from transmission, blinding the receiver. If water rises into this deadzone, the sensor returns false distant readings, potentially keeping the pump running."},
            {"q": "How does a magnetic reed float switch work?", "a": "A permanent magnet inside the buoyant plastic donut ring slides over a hermetically sealed glass reed switch inside the central stem, closing the electrical contact when raised."},
            {"q": "Why is a median filter preferred over a simple average filter for liquid ultrasonic sensing?", "a": "A simple average is skewed by occasional wild outliers (such as a water splash or bubble). A median filter sorts readings and picks the middle value, completely discarding extreme spikes."},
            {"q": "What is the role of the 1kΩ/2kΩ voltage divider on the HC-SR04 Echo line?", "a": "It converts 5V TTL logic from the sensor into 3.33V logic, protecting the sensitive 3.3V ESP8266 GPIO input from over-voltage silicon punch-through."},
            {"q": "What happens if Wi-Fi disconnects during active pumping?", "a": "The ESP8266 runs autonomous local firmware; the pump control state machine and safety float interlocks continue executing with zero reliance on Wi-Fi or cloud connectivity."},
            {"q": "How can pump run-time statistics be used for leak detection in the plumbing network?", "a": "If the tank depletes and refills at unusual hours (such as 3 AM) with no occupants, the controller detects an underground line rupture or running toilet valve."}
        ],
        "exercises": {
            "beginner": "Modify the low-level pump start threshold from 20% to 30% using the web dashboard REST API.",
            "intermediate": "Add an audio-visual alarm (buzzer and flashing red LED on D7) that sounds if the tank exceeds 92% capacity.",
            "advanced": "Implement an off-peak electricity scheduling feature that restricts automated filling to night hours (11 PM - 6 AM) unless water drops below a critical 10% reserve."
        }
    },
    {
        "id": "15",
        "folder": "15-smart-street-light",
        "title": "Smart Street Light — Ambient Lux & PIR Motion PWM Dimming",
        "category": "Category B — Automation & Actuation",
        "overview": {
            "intro": "The Smart Street Light is an energy-conserving municipal illumination hub integrating a GL5528 photoresistor, an HC-SR501 passive infrared (PIR) motion sensor, and an IRLZ44N logic-level N-channel MOSFET for high-efficiency pulse-width modulated (PWM) LED driving.",
            "problem": "Conventional municipal streetlights operate at 100% full brightness throughout the entire night regardless of vehicle or pedestrian presence, consuming vast amounts of electrical energy and causing light pollution.",
            "objectives": "Sample ambient light on A0 to detect twilight/night, monitor pedestrian/vehicular traffic via PIR on GPIO4 (D2), modulate high-power LED array brightness using 1kHz PWM on GPIO5 (D1), and log energy savings on a web dashboard.",
            "outcome": "An adaptive street lighting system that automatically switches off during the day, idles at 15% brightness in dark hours, ramps to 100% when motion is detected, and tracks power savings.",
            "difficulty": "Intermediate",
            "time": "2.5 Hours",
            "prior_knowledge": "MOSFET switching dynamics, gate threshold voltage, PWM duty cycle modulation, PIR pyroelectric sensing, and energy efficiency calculations."
        },
        "principle": "The controller uses a two-tier evaluation algorithm. During daylight hours (LDR ambient lux > 100 Lux), the MOSFET gate is driven LOW (0% PWM), keeping lights completely OFF. At dusk (ambient lux < 100 Lux), the controller enters 'Eco-Night Mode', driving the MOSFET gate with a 15% PWM duty cycle (conserving 85% energy). When the PIR sensor detects infrared thermal radiation from a moving person or vehicle, the controller smoothly ramps PWM duty cycle to 100% over 1.5 seconds. Once motion ceases, a 30-second hold timer elapses before the lighting gently ramps back down to 15% standby.",
        "applications": [
            "Smart city municipal highway and residential street lighting grids.",
            "University campus and industrial facility pedestrian walkway lighting.",
            "Commercial perimeter security lighting and warehouse aisle illumination.",
            "Off-grid solar-powered street lighting battery conservation."
        ],
        "benefits_limitations": {
            "benefits": "Reduces municipal lighting electrical consumption by up to 75%; smooth PWM transitions extend LED lifespan; solid-state MOSFET switching produces zero acoustic noise or mechanical wear.",
            "limitations": "PIR sensors have a ~7 meter detection cone; rapid environmental temperature changes (gusts of hot air) can cause false triggers; requires dedicated 12V DC power for LED arrays."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, PWM generator, and Wi-Fi web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "IRLZ44N Logic-Level N-MOSFET", "qty": "1", "purpose": "High-current low-side PWM LED driver", "spec": "V_DSS = 55V, I_D = 47A, V_GS(th) = 1.0V–2.0V, TO-220", "status": "Mandatory"},
            {"component": "HC-SR501 PIR Motion Sensor", "qty": "1", "purpose": "Pyroelectric human / vehicle motion detector", "spec": "5V supply, 3.3V TTL output, 120° cone, 3–7m range", "status": "Mandatory"},
            {"component": "GL5528 CdS Photoresistor (LDR)", "qty": "1", "purpose": "Ambient day/night twilight detector", "spec": "Dark resistance 1MΩ, light resistance 10k–20kΩ", "status": "Mandatory"},
            {"component": "Metal-Film Resistors (10kΩ, 100Ω)", "qty": "2 each", "purpose": "LDR divider, MOSFET gate pulldown, and gate current limiter", "spec": "1/4W, 1% metal film", "status": "Mandatory"},
            {"component": "12V High-Power LED Strip / Module", "qty": "1 meter", "purpose": "Streetlight luminaire lumination load", "spec": "12V DC, SMD 5050/2835 LEDs, approx 1.0A / meter", "status": "Mandatory"},
            {"component": "External 12V 2A DC Power Supply", "qty": "1", "purpose": "Main power rail for 12V LED luminaire", "spec": "Regulated 12.0V DC ±5%, 2000mA", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, wire strippers, small screwdriver, lux meter / smartphone light app, Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "LDR Lead 1", "pin": "Lead 1", "controller": "NodeMCU 3V3 Pin", "notes": "Connected to 3.3V regulated power rail"},
            {"comp": "LDR Lead 2", "pin": "Lead 2", "controller": "NodeMCU A0 (ADC0)", "notes": "Center tap of voltage divider"},
            {"comp": "10kΩ Resistor", "pin": "Terminals", "controller": "A0 to NodeMCU GND", "notes": "Pull-down resistor completing LDR divider"},
            {"comp": "HC-SR501 VCC", "pin": "VCC", "controller": "NodeMCU Vin (5V USB rail)", "notes": "HC-SR501 requires 5V to power onboard 3.3V regulator"},
            {"comp": "HC-SR501 GND", "pin": "GND", "controller": "NodeMCU GND", "notes": "Shared system ground"},
            {"comp": "HC-SR501 OUT", "pin": "OUT", "controller": "NodeMCU D2 (GPIO 4)", "notes": "Outputs 3.3V TTL logic HIGH upon motion detection"},
            {"comp": "IRLZ44N Gate (Pin 1)", "pin": "Gate", "controller": "100Ω resistor &rarr; D1 (GPIO 5)", "notes": "Series 100Ω limits MCU gate charging current; 10kΩ pulldown to GND"},
            {"comp": "IRLZ44N Drain (Pin 2)", "pin": "Drain", "controller": "12V LED Negative Terminal (-)", "notes": "Low-side switch: sinks LED current to ground when active"},
            {"comp": "IRLZ44N Source (Pin 3)", "pin": "Source", "controller": "Common Ground (-)", "notes": "Ties back directly to 12V supply GND and NodeMCU GND"},
            {"comp": "12V LED Positive (+)", "pin": "Positive", "controller": "External 12V Rail (+)", "notes": "Direct connection to positive 12V DC power source"}
        ],
        "pin_config": [
            {"pin": "A0", "gpio": "ADC0 / TOUT", "purpose": "Ambient Light Telemetry", "type": "Analog Input", "notes": "Samples ambient lux to determine Day vs Night state."},
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "MOSFET Gate PWM Control", "type": "PWM Output (1kHz)", "notes": "Boot-safe; analogWrite(D1, value) modulates duty cycle from 0 to 1023."},
            {"pin": "D2", "gpio": "GPIO 4", "purpose": "PIR Motion Trigger Input", "type": "Digital Input", "notes": "Boot-safe; reads HIGH (3.3V) when human/vehicle enters detection cone."}
        ],
        "firmware": {
            "key_constants": "MOSFET_PIN = 5; PIR_PIN = 4; LDR_PIN = A0; PWM_DAY = 0; PWM_NIGHT_IDLE = 153; PWM_MOTION = 1023; MOTION_HOLD_SEC = 30;",
            "logic": "The sketch executes analogWriteFreq(1000) and analogWriteRange(1023) in setup(). In the loop, it checks ambient light on A0. If DAY (ADC > 400), target PWM is 0. If NIGHT (ADC <= 400), it checks PIR on D2. If motion is HIGH, target PWM is set to 1023 (100%), and a 30-second countdown resets. When motion stops and the countdown expires, target PWM drops to 153 (15% standby). A software ramping function steps the current PWM toward the target PWM smoothly by ±10 steps every 15ms. REST endpoints (/api/readings, /api/health, /api/command, /api/device) allow remote overrides and power metrics reporting."
        },
        "theory": {
            "formula": "\\text{Duty Cycle \\%} = \\left( \\frac{\\text{PWM}}{1023} \\right) \\times 100\\%, \\quad P_{LED} = V \\times I_{max} \\times \\left( \\frac{\\text{Duty Cycle}}{100} \\right), \\quad \\text{Energy Saved \\%} = 100 - \\text{Duty Cycle \\%}",
            "worked_example": "For a 12V LED drawing 1.5A at full 100% brightness (Power = 18.0 Watts): In 15% Eco-Night standby (PWM = 153): P_standby = 12 * 1.5 * 0.15 = 2.70 Watts. Energy saved during idle hours = 100% - 15% = 85.0%. Over an 8-hour midnight period with 1 hour total motion, energy consumed is: (7h * 2.7W) + (1h * 18W) = 18.9 + 18.0 = 36.9 Wh vs 144 Wh for a conventional light—a net 74.4% energy reduction."
        },
        "testing": [
            {"id": "T15-01", "procedure": "Expose LDR to bright room light or smartphone flashlight.", "expected": "Streetlight LED strip turns completely OFF (0% PWM); Dashboard reads 'DAY_MODE'.", "actual": ""},
            {"id": "T15-02", "procedure": "Cover LDR with an opaque black cup with no movement in room.", "expected": "LED strip smoothly ramps up to dim 15% glow; Dashboard reads 'NIGHT_IDLE_ECO'.", "actual": ""},
            {"id": "T15-03", "procedure": "Wave hand across the PIR sensor dome.", "expected": "LED strip ramps up to full 100% brilliant brightness within 1.5s; Dashboard flags 'MOTION_DETECTED'.", "actual": ""},
            {"id": "T15-04", "procedure": "Cease all motion and wait for 30 seconds.", "expected": "After 30s countdown, LED strip smoothly dims back to 15% standby.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "MOSFET becomes extremely hot to the touch during operation", "cause": "Using a standard MOSFET (e.g. IRF540N) instead of logic-level (IRLZ44N)", "diag": "Check gate-source voltage (V_GS); if 3.3V does not fully saturate the channel, R_DS(on) remains high", "solution": "Always use logic-level 'L' series MOSFETs (IRLZ44N) that fully turn on at 3.3V (V_GS(th) < 2V)."},
            {"issue": "LED strip stays ON constantly even when D1 is driven LOW", "cause": "MOSFET drain and source pins swapped, causing internal body diode conduction", "diag": "Check pinout: Pin 1 = Gate, Pin 2 = Drain, Pin 3 = Source", "solution": "Connect Drain to LED (-), Source to GND; verify 10kΩ pulldown on Gate."},
            {"issue": "PIR motion sensor false-triggers continuously every few seconds", "cause": "PIR sensitivity potentiometer set too high or powered from unstable rail", "diag": "Measure PIR 5V supply line during Wi-Fi bursts", "solution": "Turn sensitivity trimmer slightly counter-clockwise; add 100µF capacitor across PIR VCC and GND."}
        ],
        "safety": "Ensure common ground is connected between the 12V DC power supply and the ESP8266 GND. Never connect the 12V power rail directly to any ESP8266 pin. Fasten a small clip-on aluminum heatsink to the TO-220 MOSFET package if driving >3A LED loads.",
        "outcomes": "Understand N-channel logic-level MOSFET switching physics, configure hardware PWM frequency and resolution, implement pyroelectric motion detection, design energy-conservation lighting algorithms, and compute municipal carbon savings.",
        "viva": [
            {"q": "What is the difference between an IRF-series and an IRL-series MOSFET?", "a": "IRF series (e.g. IRF540N) requires 10V V_GS to fully turn on. IRL series (e.g. IRLZ44N) is logic-level, achieving low R_DS(on) with only 3.3V to 5V on the gate, making it directly compatible with 3.3V microcontrollers."},
            {"q": "Why is a 10kΩ pull-down resistor mandatory on the MOSFET gate?", "a": "The MOSFET gate acts like a tiny capacitor. If the microcontroller pin is floating or in reset, static charge can hold the gate open. The pulldown pulls the gate to 0V, keeping the load OFF during boot."},
            {"q": "Why is a 100Ω series resistor placed between the GPIO pin and the MOSFET gate?", "a": "The gate's input capacitance causes an instantaneous current spike when switching. The 100Ω resistor limits this peak current to ~33mA, protecting the ESP8266 GPIO output buffer."},
            {"q": "How does the HC-SR501 PIR sensor detect human motion?", "a": "It contains dual pyroelectric sensor elements behind a Fresnel lens. As a warm human body (emitting ~10µm infrared radiation) moves across the optical sectors, differential charge is generated and amplified by the BISS0001 IC."},
            {"q": "What PWM frequency is configured on the ESP8266 for LED dimming, and why?", "a": "1000 Hz (1 kHz). This is well above the human critical flicker fusion threshold (~60–100 Hz), ensuring zero perceptible flicker or video camera stroboscopic artifacts."},
            {"q": "Why does the firmware ramp PWM smoothly rather than stepping instantly?", "a": "Smooth ramping (1.5 seconds) provides a comfortable aesthetic experience for drivers and pedestrians, prevents sudden electrical current surges, and extends LED semiconductor longevity."},
            {"q": "What is low-side switching with an N-channel MOSFET?", "a": "The MOSFET is placed between the negative terminal of the load and ground. When the gate goes HIGH, it connects the load to ground, completing the electrical circuit."},
            {"q": "How much energy does an 85% dimming standby mode save compared to continuous full brightness?", "a": "Exactly 85% electrical power reduction during idle hours, vastly decreasing municipal electric utility bills and carbon emissions."}
        ],
        "exercises": {
            "beginner": "Change the night idle dimming brightness from 15% to 25% via the web dashboard.",
            "intermediate": "Add a twilight threshold calibration mode where the current ambient light reading can be saved as the new dusk setpoint.",
            "advanced": "Implement an astronomical dusk/dawn calculation algorithm based on NTP network time and geographic latitude/longitude to verify physical LDR readings."
        }
    },
    {
        "id": "16",
        "folder": "16-wifi-home-automation",
        "title": "Wi-Fi Home Automation — 4-Channel Optocoupled Relay Bank",
        "category": "Category B — Automation & Actuation",
        "overview": {
            "intro": "The Wi-Fi Home Automation System is a four-channel mains appliance control station featuring an optocoupled relay bank, state-preserving non-volatile memory (EEPROM/LittleFS), and real-time REST API control for domestic appliances.",
            "problem": "Traditional wall switches lack remote connectivity, automated scheduling, and centralized energy tracking, leading to appliances left running unattended.",
            "objectives": "Interface a 4-channel optoisolated relay module across GPIOs 5, 4, 14, and 12 (D1, D2, D5, D6), construct an interactive web dashboard with toggle buttons, enforce boot-safe pin states, and persist relay states across power outages.",
            "outcome": "A 4-channel home automation hub providing remote control of lighting, fans, heaters, and pumps via responsive web UI and REST API.",
            "difficulty": "Beginner",
            "time": "2.5 Hours",
            "prior_knowledge": "Relay contact ratings (NO/NC/COM), active-LOW optocoupled logic, boot-safe GPIO selection, and JSON REST API formatting."
        },
        "principle": "The 4-channel relay module utilizes Songle SRD-05VDC electromagnetic relays with built-in PC817 optocouplers. The ESP8266 GPIOs control the cathode of the optodiode. When a GPIO is driven LOW (0V), current flows from the 5V rail through the optodiode, turning on the phototransistor, which energizes the relay coil. The magnetic field pulls the mechanical armature, switching the Common (COM) contact from Normally Closed (NC) to Normally Open (NO). Galvanic isolation physically separates the 3.3V microcontroller logic from high-voltage 230V AC mains lines.",
        "applications": [
            "Smart home living room and bedroom architectural lighting control.",
            "Office HVAC, fan, and appliance centralized power scheduling.",
            "Server room and laboratory peripheral equipment automated rebooting.",
            "Agricultural pump and greenhouse supplemental lighting sequencing."
        ],
        "benefits_limitations": {
            "benefits": "Galvanic optical isolation (2500V RMS); switches up to 10A 250VAC per channel; independent control of 4 separate appliances; state memory persistence across reboots.",
            "limitations": "Electromechanical relays produce audible click noise; limited mechanical contact switching life (~100,000 cycles); coil current draw (~70mA per active relay)."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, web server host, and GPIO actuator", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "4-Channel Relay Module (Optocoupled)", "qty": "1", "purpose": "Four independent 10A electromechanical switches", "spec": "5V coils, JD-VCC isolation jumper, 10A 250VAC / 30VDC", "status": "Mandatory"},
            {"component": "External 5V 2A DC Power Supply", "qty": "1", "purpose": "Powers relay coils without brownouts", "spec": "Regulated 5.0V ±5%, 2000mA capacity", "status": "Mandatory"},
            {"component": "AC Test Lamp Fixture or 12V Test LEDs", "qty": "4 sets", "purpose": "Load simulation for channel testing", "spec": "12V LED bulbs with resistors or safe low-voltage indicators", "status": "Mandatory for lab testing"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Power distribution bus", "spec": "400 tie-points", "status": "Mandatory"},
            {"component": "Jumper Wires (F-to-F & M-to-M)", "qty": "12", "purpose": "Module interconnect wiring", "spec": "24 AWG stranded copper", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter (continuity and AC/DC voltage modes), small flathead screwdriver for terminal blocks, wire strippers, Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "Relay Module VCC", "pin": "VCC", "controller": "NodeMCU 3V3 Pin", "notes": "Powers optocoupler input LEDs (3.3V logic)"},
            {"comp": "Relay Module JD-VCC", "pin": "JD-VCC", "controller": "External 5V Rail (+)", "notes": "CRITICAL: Remove jumper between VCC and JD-VCC; power JD-VCC from 5V rail"},
            {"comp": "Relay Module GND", "pin": "GND", "controller": "External 5V Supply GND", "notes": "Provides return path for relay coil current"},
            {"comp": "Relay IN1", "pin": "IN1", "controller": "NodeMCU D1 (GPIO 5)", "notes": "Channel 1 control (Active-LOW)"},
            {"comp": "Relay IN2", "pin": "IN2", "controller": "NodeMCU D2 (GPIO 4)", "notes": "Channel 2 control (Active-LOW)"},
            {"comp": "Relay IN3", "pin": "IN3", "controller": "NodeMCU D5 (GPIO 14)", "notes": "Channel 3 control (Active-LOW)"},
            {"comp": "Relay IN4", "pin": "IN4", "controller": "NodeMCU D6 (GPIO 12)", "notes": "Channel 4 control (Active-LOW)"},
            {"comp": "Channel 1 COM", "pin": "COM1", "controller": "Load Supply (+ or AC Live)", "notes": "Common pole of switch"},
            {"comp": "Channel 1 NO", "pin": "NO1", "controller": "Appliance / Lamp Terminal", "notes": "Normally Open: connects to COM when relay is energized"}
        ],
        "pin_config": [
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "Relay Channel 1 Output", "type": "Digital Output (Active-LOW)", "notes": "Boot-safe; defaults HIGH (OFF) in setup."},
            {"pin": "D2", "gpio": "GPIO 4", "purpose": "Relay Channel 2 Output", "type": "Digital Output (Active-LOW)", "notes": "Boot-safe; defaults HIGH (OFF) in setup."},
            {"pin": "D5", "gpio": "GPIO 14", "purpose": "Relay Channel 3 Output", "type": "Digital Output (Active-LOW)", "notes": "Boot-safe; defaults HIGH (OFF) in setup."},
            {"pin": "D6", "gpio": "GPIO 12", "purpose": "Relay Channel 4 Output", "type": "Digital Output (Active-LOW)", "notes": "Boot-safe; defaults HIGH (OFF) in setup."}
        ],
        "firmware": {
            "key_constants": "R1_PIN = 5; R2_PIN = 4; R3_PIN = 14; R4_PIN = 12; RELAY_ON = LOW; RELAY_OFF = HIGH;",
            "logic": "During setup(), all 4 GPIO pins are initialized as OUTPUT and set HIGH immediately (digitalWrite(pin, HIGH)) before calling pinMode() to prevent spurious relay clicks during power-up. Saved states are loaded from LittleFS JSON configuration. REST endpoints (/api/readings, /api/health, /api/command, /api/device) allow clients to toggle individual channels, query states, or issue 'all_on' / 'all_off' master commands. Every state change is saved to non-volatile flash storage."
        },
        "theory": {
            "formula": "P_{appliance} = V_{RMS} \\times I_{RMS} \\times \\cos(\\phi), \\quad I_{coil\\_total} = N_{active} \\times 70\\text{mA}",
            "worked_example": "When all 4 relays are energized simultaneously: I_coil_total = 4 * 70mA = 280mA drawn from the 5V power supply. If each relay switches a 100W AC light bulb at 230V: Current per channel = 100W / 230V = 0.435A (well below 10A rating). Total switched power = 400 Watts."
        },
        "testing": [
            {"id": "T16-01", "procedure": "Power on the system; inspect relay status indicator LEDs.", "expected": "All 4 relay indicator LEDs remain OFF; no mechanical click sounds occur during boot.", "actual": ""},
            {"id": "T16-02", "procedure": "Toggle Channel 1 ON via web dashboard switch.", "expected": "Relay 1 clicks ON; channel 1 indicator LED illuminates; appliance powers up.", "actual": ""},
            {"id": "T16-03", "procedure": "Click 'ALL APPLIANCES ON' button on web dashboard.", "expected": "All 4 relays click ON in rapid staggered sequence (50ms delay between channels); status updates.", "actual": ""},
            {"id": "T16-04", "procedure": "Power-cycle the ESP8266 by pulling the USB plug and re-inserting.", "expected": "Firmware restores the exact prior relay states from LittleFS flash memory automatically.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Relays chatter or ESP8266 crashes when multiple relays turn ON", "cause": "Powering relay coils directly from NodeMCU 3.3V pin causing voltage brownout", "diag": "Measure 3.3V rail voltage when clicking 'ALL ON'; voltage drops below 2.7V", "solution": "Remove the JD-VCC jumper; supply JD-VCC with dedicated external 5V 2A power."},
            {"issue": "Relays click ON momentarily during power-up or reboot", "cause": "GPIO pin initialized as INPUT before being driven HIGH", "diag": "Observe relay LEDs during hardware reset", "solution": "In setup(), execute digitalWrite(pin, HIGH) *before* executing pinMode(pin, OUTPUT)."},
            {"issue": "Dashboard switch shows ON but relay does not energize", "cause": "Wiring to incorrect relay terminal (NC instead of NO) or blown optocoupler", "diag": "Check continuity between COM and NO with DMM when toggling", "solution": "Ensure load is wired across COM and NO terminals; verify D1–D6 signal lines."}
        ],
        "safety": "When wiring 110V/230V AC mains loads, strictly turn OFF the main circuit breaker. Ensure all AC connections are enclosed inside an insulated electrical enclosure with no exposed copper. In educational labs, use safe 12V DC test lamps instead of live AC mains.",
        "outcomes": "Master multi-channel optoisolated relay interfacing, eliminate power-on relay glitching, design responsive web dashboards, implement non-volatile state persistence, and safely handle high-power domestic loads.",
        "viva": [
            {"q": "What is the JD-VCC jumper on a multi-channel relay board?", "a": "The JD-VCC jumper links the optocoupler logic VCC with the relay coil power rail. Removing the jumper allows complete optical isolation: 3.3V powers the optodiodes, while a separate 5V supply powers the electromagnet coils."},
            {"q": "Why is active-LOW logic used for relay modules?", "a": "ESP8266 GPIOs sink current to ground more effectively than they source current. Driving LOW (0V) creates a 3.3V drop across the optodiode from the 3.3V rail, turning it ON cleanly."},
            {"q": "Why must GPIOs 0, 2, and 15 be avoided for relay channels?", "a": "GPIO 0 and 2 must be HIGH at boot, and GPIO 15 must be LOW at boot. Connecting relay coils to these pins can alter boot voltage levels, preventing the microcontroller from starting."},
            {"q": "What is the difference between Normally Open (NO) and Normally Closed (NC)?", "a": "NO remains disconnected until the relay is energized. NC remains connected to COM when the relay is de-energized, breaking contact only when energized."},
            {"q": "Why is staggered sequential turn-on implemented when switching all relays?", "a": "Staggering turn-on by 50ms per channel prevents a sudden cumulative inrush current spike on the 5V power supply, preventing brownouts."},
            {"q": "What is contact arcing in electromechanical relays?", "a": "When contacts open or close under high inductive AC/DC loads, an electrical spark jumps across the microscopic gap, causing contact pitting over time."},
            {"q": "How does LittleFS flash persistence protect user configuration?", "a": "LittleFS stores a JSON state file in SPI flash memory. When power is restored after a blackout, the firmware reads the file and returns all appliances to their pre-outage states."},
            {"q": "What is the contact resistance of a standard 10A Songle relay?", "a": "Typically less than 100 milliohms (<=100 mΩ), causing negligible voltage drop at normal operating currents."}
        ],
        "exercises": {
            "beginner": "Rename the 4 appliance labels on the web dashboard (e.g., 'Ceiling Light', 'Table Fan', 'Night Lamp', 'Heater').",
            "intermediate": "Add an automated timer countdown on Channel 1 that turns the appliance OFF automatically after 30 minutes.",
            "advanced": "Implement an MQTT publisher/subscriber client in the firmware to integrate the 4-channel relay bank with Home Assistant or Node-RED."
        }
    },
    {
        "id": "17",
        "folder": "17-fan-speed-controller",
        "title": "Fan Speed Controller — High-Frequency MOSFET PWM & Tachometer Feedback",
        "category": "Category B — Automation & Actuation",
        "overview": {
            "intro": "The Fan Speed Controller is an industrial cooling hub utilizing an IRLZ44N logic-level N-channel MOSFET for 25kHz ultrasonic PWM fan speed control, combined with hardware interrupt tachometer pulse counting for closed-loop RPM regulation.",
            "problem": "Low-frequency PWM motor control causes irritating audible acoustic hum (whine) in ventilation fans, while unregulated fans run at full speed constantly, wasting energy and accelerating bearing wear.",
            "objectives": "Generate a 25kHz ultrasonic PWM drive signal on GPIO5 (D1), capture fan tachometer feedback pulses on GPIO0 (D3) via hardware interrupts, calculate actual fan RPM, implement closed-loop PI speed regulation, and display metrics on a web dashboard.",
            "outcome": "A whisper-quiet, closed-loop fan speed controller providing linear 0–100% velocity control, live tachometer RPM display, stall detection, and web telemetry.",
            "difficulty": "Intermediate",
            "time": "3.0 Hours",
            "prior_knowledge": "MOSFET switching dynamics, 25kHz ultrasonic PWM generation, Hall-effect tachometer pulses, and closed-loop speed control."
        },
        "principle": "Computer cooling fans utilize brushless DC (BLDC) motors driven by internal Hall commutation. Standard low-frequency PWM (e.g. 500Hz–1kHz) causes magnetic coil vibration in the human audible spectrum (annoying acoustic whine). By setting the ESP8266 hardware PWM frequency to 25kHz (above human hearing limit of 20kHz), the fan runs completely silently. The fan's open-collector tachometer wire emits 2 pulses per full rotor revolution. An interrupt service routine on GPIO0 counts pulses over a 1-second window: RPM = (Pulses * 60) / 2. If PWM is commanded >20% but RPM remains 0, a 'FAN_STALLED' alarm is triggered.",
        "applications": [
            "Data center server rack dynamic acoustic-optimized cooling systems.",
            "Electronics enclosure and 3D printer hotend/part cooling regulation.",
            "Automotive cabin ventilation and battery pack thermal management.",
            "Smart home quiet bedroom ventilation and air purifier speed control."
        ],
        "benefits_limitations": {
            "benefits": "25kHz ultrasonic PWM eliminates all audible coil whine; real-time RPM tachometer feedback detects motor failure or bearing lockup; high-efficiency MOSFET runs cool.",
            "limitations": "Minimum startup duty cycle required (~20–25%) to overcome static rotor friction; requires 12V DC power supply for fan motor."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, 25kHz PWM generator, and pulse counter", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "IRLZ44N Logic-Level N-MOSFET", "qty": "1", "purpose": "High-efficiency low-side PWM motor driver", "spec": "V_DSS = 55V, I_D = 47A, V_GS(th) = 1.0–2.0V, TO-220", "status": "Mandatory"},
            {"component": "12V 3-Wire or 4-Wire DC Brushless Fan", "qty": "1", "purpose": "Cooling fan under test with tachometer output", "spec": "12V DC, 0.2A–0.8A, 3000 max RPM, Hall tach wire", "status": "Mandatory"},
            {"component": "1N4007 Silicon Rectifier Diode", "qty": "1", "purpose": "Flyback inductive spike suppression", "spec": "1000V, 1A standard diode", "status": "Mandatory"},
            {"component": "Metal-Film Resistors (100Ω, 10kΩ)", "qty": "1 each", "purpose": "Gate current limiter (100Ω) and tachometer pullup (10kΩ)", "spec": "1/4W, 1% tolerance", "status": "Mandatory"},
            {"component": "External 12V 2A DC Power Supply", "qty": "1", "purpose": "Dedicated power for 12V cooling fan", "spec": "Regulated 12.0V DC ±5%, 2000mA", "status": "Mandatory"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit interconnect platform", "spec": "400 tie-points", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, wire strippers, small screwdriver, oscilloscope (optional, for viewing 25kHz PWM waveform), Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "Fan Red Wire (+)", "pin": "VCC", "controller": "External 12V Rail (+)", "notes": "Supplies 12V DC to the fan motor coils"},
            {"comp": "Fan Black Wire (-)", "pin": "GND", "controller": "MOSFET Drain (Pin 2)", "notes": "Switched low-side ground connection"},
            {"comp": "Fan Yellow Wire (Tach)", "pin": "Tach Out", "controller": "NodeMCU D3 (GPIO 0)", "notes": "Open-collector tachometer pulse; pull up to 3.3V with 10kΩ resistor"},
            {"comp": "10kΩ Pull-Up Resistor", "pin": "Terminals", "controller": "D3 to 3V3", "notes": "Pulls tachometer wire to 3.3V between ground pulses"},
            {"comp": "IRLZ44N Gate (Pin 1)", "pin": "Gate", "controller": "100Ω resistor &rarr; NodeMCU D1 (GPIO 5)", "notes": "Series 100Ω damping resistor; 10kΩ pulldown to GND"},
            {"comp": "IRLZ44N Source (Pin 3)", "pin": "Source", "controller": "Common Ground (-)", "notes": "Tied to 12V supply GND and NodeMCU GND"},
            {"comp": "1N4007 Diode", "pin": "Cathode/Anode", "controller": "Across Fan (+) and (-)", "notes": "Cathode (stripe) to 12V (+), Anode to MOSFET Drain (-)"}
        ],
        "pin_config": [
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "25kHz PWM Fan Gate Drive", "type": "PWM Output (25kHz)", "notes": "Boot-safe; analogWriteFreq(25000) generates silent ultrasonic drive."},
            {"pin": "D3", "gpio": "GPIO 0", "purpose": "Tachometer Interrupt Pulse Input", "type": "Digital Input (Pull-Up)", "notes": "MUST BE HIGH AT BOOT. 10kΩ pull-up ensures safe boot state."}
        ],
        "firmware": {
            "key_constants": "PWM_PIN = 5; TACH_PIN = 0; PWM_FREQ = 25000; MIN_DUTY_PCT = 20;",
            "logic": "In setup(), analogWriteFreq(25000) and analogWriteRange(1023) are invoked. An interrupt on D3 (FALLING) increments a volatile pulse counter. Every 1000ms, the loop computes RPM = (pulses * 60) / 2, resets the counter, and checks for stall condition. If commanded speed > 20% but RPM == 0 for >3 seconds, 'STALL_ALARM' is raised. A slider on the web dashboard updates the duty cycle via POST /api/command with {\"action\": \"set_speed\", \"speed\": 75}. Telemetry is published to /api/readings, /api/health, and /api/device."
        },
        "theory": {
            "formula": "\\text{RPM} = \\frac{\\text{Pulses per Second} \\times 60}{\\text{Pulses per Revolution}} = \\frac{f_{tach} \\times 60}{2}, \\quad \\text{Duty Cycle \\%} = \\frac{\\text{PWM}}{1023} \\times 100\\%",
            "worked_example": "If the ESP8266 counts 80 pulses in a 1-second interval: Tachometer frequency f = 80 Hz. Since PC fans emit 2 pulses per revolution: RPM = (80 * 60) / 2 = 4,800 / 2 = 2,400 RPM. If commanded PWM is 768 (out of 1023): Duty Cycle = (768 / 1023) * 100% = 75.0%."
        },
        "testing": [
            {"id": "T17-01", "procedure": "Set fan speed slider to 0% on web dashboard.", "expected": "Fan rotor comes to a complete standstill; Dashboard RPM reads 0.", "actual": ""},
            {"id": "T17-02", "procedure": "Slide fan speed to 50% on web dashboard.", "expected": "Fan spins up silently with zero audible coil whine; RPM reads approx 1400–1600 RPM.", "actual": ""},
            {"id": "T17-03", "procedure": "Slide fan speed to 100% on web dashboard.", "expected": "Fan accelerates to maximum speed; RPM reads manufacturer rated max (e.g. ~2800 RPM ±10%).", "actual": ""},
            {"id": "T17-04", "procedure": "Carefully hold fan rotor stationary with a soft eraser while speed is set to 80%.", "expected": "Rotor stops; tachometer pulses drop to 0; Dashboard triggers 'FAN_STALL_WARNING' after 3 seconds.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "Fan makes a high-pitched buzzing/whining sound at medium speeds", "cause": "PWM frequency defaulting to 1kHz instead of 25kHz", "diag": "Check oscilloscope or verify analogWriteFreq(25000) is executed in setup()", "solution": "Set analogWriteFreq(25000) before any analogWrite() calls."},
            {"issue": "Tachometer RPM reads fixed 0 even when fan is spinning rapidly", "cause": "Missing pull-up resistor on open-collector tachometer wire", "diag": "Measure voltage on D3; without pull-up, it sits near 0V constantly", "solution": "Install 10kΩ pull-up resistor between D3 and 3.3V rail."},
            {"issue": "Fan fails to start spinning until slider reaches 40%", "cause": "Static friction (stiction) in motor bearings", "diag": "Normal physical behavior of brushless DC fans", "solution": "Implement a 200ms 'kick-start' pulse (100% duty cycle) before settling to requested speed."}
        ],
        "safety": "Keep fingers and loose wires completely clear of rotating fan blades. Ensure the 1N4007 clamp diode is installed across the fan power leads to protect the MOSFET from inductive kickback during rapid PWM switching.",
        "outcomes": "Configure ultrasonic 25kHz PWM on ESP8266, implement high-speed hardware interrupt pulse counting, calculate rotational velocity (RPM), design stall-detection protection routines, and control motor speeds via web APIs.",
        "viva": [
            {"q": "Why is 25kHz selected as the standard PWM frequency for PC cooling fans?", "a": "Human hearing spans 20 Hz to 20 kHz. 25kHz is above the human audible limit, ensuring the fan's motor coils cannot produce audible acoustic hum or whine."},
            {"q": "How many pulses does a standard computer fan tachometer generate per revolution?", "a": "2 pulses per full mechanical revolution, generated by internal Hall-effect sensors tracking the 4-pole rotor magnet."},
            {"q": "Why is an open-collector output used for the fan tachometer wire?", "a": "An open-collector allows the fan (running at 12V) to interface safely with 3.3V or 5V microcontrollers by using a pull-up resistor to the microcontroller's logic voltage."},
            {"q": "What is the 'kick-start' technique in brushless DC fan control?", "a": "Applying 100% full power for a brief duration (~200ms) to overcome static bearing friction before dropping down to a low steady-state speed (e.g. 25%)."},
            {"q": "Why can low-side MOSFET switching be problematic for some 3-wire fans?", "a": "Switching the ground wire chops the ground reference of the internal Hall tachometer circuit. 4-wire fans solve this by accepting direct logic-level PWM on a dedicated 4th wire while retaining continuous ground."},
            {"q": "What causes the inductive spike when a MOSFET turns OFF a running DC fan?", "a": "The motor's magnetic field collapses according to Faraday's law: V = -L (di/dt). The 1N4007 flyback diode recirculates this current safely."},
            {"q": "Why is GPIO0 (D3) safe for tachometer input despite being a boot-strap pin?", "a": "GPIO0 must be HIGH at boot. The 10kΩ pull-up resistor on the tachometer line guarantees GPIO0 remains HIGH during power-up."},
            {"q": "How can fan bearing degradation and impending failure be predicted using RPM data?", "a": "If the RPM measured at a given duty cycle (e.g. 100%) gradually declines over months by >15%, increased mechanical friction indicates lubricant dry-out or bearing wear."}
        ],
        "exercises": {
            "beginner": "Change the default startup fan speed in the firmware from 50% to 75%.",
            "intermediate": "Implement a 'Kick-Start' routine in firmware that pulses PWM at 100% for 300ms whenever the fan transitions from 0% to any non-zero speed.",
            "advanced": "Combine this project with Project 08 (DS18B20) to construct an autonomous closed-loop thermal fan controller that automatically scales RPM based on heatsink temperature."
        }
    },
    {
        "id": "18",
        "folder": "18-smart-exhaust-fan",
        "title": "Smart Exhaust Fan — Temperature & Humidity Automated Ventilation",
        "category": "Category B — Automation & Actuation",
        "overview": {
            "intro": "The Smart Exhaust Fan is an automated indoor climate and ventilation controller combining a high-accuracy DHT22 (AM2302) digital environmental sensor with an optoisolated 10A power relay to purge stale, humid, or overheated air from bathrooms, kitchens, and server closets.",
            "problem": "Stagnant humidity in residential bathrooms causes toxic black mold growth, while heat buildup in server rooms causes hardware throttling, and manual exhaust switches are frequently forgotten.",
            "objectives": "Sample ambient temperature and relative humidity via DHT22 on GPIO13 (D7), implement dual-threshold hysteresis ventilation logic on GPIO5 (D1), configure automated run-time purge cycles, and stream indoor climate metrics to a web dashboard.",
            "outcome": "An autonomous ventilation hub that automatically triggers exhaust extraction whenever humidity or temperature exceeds safe healthy limits, displaying live climate trends and manual overrides.",
            "difficulty": "Beginner",
            "time": "2.5 Hours",
            "prior_knowledge": "Psychrometric comfort curves, relative humidity vs absolute humidity, relay driving, and single-bus sensor protocols."
        },
        "principle": "The DHT22 incorporates a capacitive polymer humidity sensor and an NTC thermistor read by an internal 8-bit chip, transmitting 40-bit digital packets over a single bidirectional data line on GPIO13. The ESP8266 calculates relative humidity (0–100% RH ±2%) and temperature (-40°C to +80°C ±0.5°C). If humidity exceeds 70% RH (shower condensation) OR temperature exceeds 30.0°C (server room heat), the controller energizes the relay on GPIO5 (active-LOW) to activate the exhaust fan. A 5% RH / 2°C deadband prevents rapid on/off cycling, and a minimum 5-minute run timer ensures thorough air evacuation.",
        "applications": [
            "Residential bathroom automatic moisture extraction and mold prevention.",
            "Commercial kitchen heat and steam automatic evacuation.",
            "Data closet, telecoms enclosure, and battery room thermal venting.",
            "Greenhouse and hydroponics humidity purge and fresh air exchange."
        ],
        "benefits_limitations": {
            "benefits": "Dual triggers (temperature AND humidity); eliminates toxic bathroom mold; preserves air conditioner energy by only running when needed; optoisolated 10A relay switches any standard fan.",
            "limitations": "DHT22 requires minimum 2-second sampling interval; sensor element must be protected from direct water splashes or heavy grease deposition."
        },
        "bom": [
            {"component": "ESP8266 NodeMCU v2/v3", "qty": "1", "purpose": "Controller, climate evaluator, and Wi-Fi web server", "spec": "32-bit Xtensa LX106 @ 80MHz, 4MB Flash", "status": "Mandatory"},
            {"component": "DHT22 / AM2302 Sensor", "qty": "1", "purpose": "Calibrated temperature and relative humidity sensor", "spec": "-40°C to +80°C (±0.5°C), 0–100% RH (±2% RH)", "status": "Mandatory"},
            {"component": "1-Channel Relay Module (Optocoupled)", "qty": "1", "purpose": "Exhaust fan power switching", "spec": "5V coil, 10A 250VAC / 30VDC contacts, active-LOW", "status": "Mandatory"},
            {"component": "Metal-Film Pull-Up Resistor", "qty": "1", "purpose": "DHT22 single-bus data line pull-up", "spec": "4.7kΩ to 10kΩ, 1/4W, 1% tolerance", "status": "Mandatory (if module lacks onboard)"},
            {"component": "External 5V 2A DC Power Supply", "qty": "1", "purpose": "Powers relay coil and ESP8266", "spec": "Regulated 5.0V ±5%, 2000mA", "status": "Mandatory"},
            {"component": "12V DC or 230V AC Exhaust Fan", "qty": "1", "purpose": "Ventilation air mover load under test", "spec": "12V DC test fan or certified AC bathroom exhaust fan", "status": "Mandatory"},
            {"component": "Solderless Prototyping Breadboard", "qty": "1", "purpose": "Circuit interconnect platform", "spec": "400 tie-points", "status": "Mandatory"}
        ],
        "tools": "Digital Multimeter, wire strippers, miniature screwdriver, warm humid breath source or cup of hot water (for test humidity generation), Arduino IDE 2.x, web browser.",
        "wiring": [
            {"comp": "DHT22 Pin 1 (VCC)", "pin": "VCC", "controller": "NodeMCU 3V3 Pin", "notes": "Powers internal capacitive sensor and ADC (3.3V–5.5V)"},
            {"comp": "DHT22 Pin 2 (DATA)", "pin": "DATA", "controller": "NodeMCU D7 (GPIO 13)", "notes": "Proprietary single-bus digital data line"},
            {"comp": "DHT22 Pin 4 (GND)", "pin": "GND", "controller": "NodeMCU GND", "notes": "System ground reference"},
            {"comp": "Pull-Up Resistor (4.7kΩ)", "pin": "Terminals", "controller": "D7 to 3V3", "notes": "Ensures clean idle HIGH state on DHT22 data line"},
            {"comp": "Relay Module VCC", "pin": "VCC", "controller": "External 5V Rail (+)", "notes": "Relay coil requires 5.0V for reliable operation"},
            {"comp": "Relay Module GND", "pin": "GND", "controller": "Common Ground (-)", "notes": "Shared system ground"},
            {"comp": "Relay Module IN", "pin": "IN", "controller": "NodeMCU D1 (GPIO 5)", "notes": "Active-LOW control signal from microcontroller"},
            {"comp": "Relay Common (COM)", "pin": "COM", "controller": "Fan Power Source (+ or AC Live)", "notes": "Switches the live/positive line to the exhaust fan"},
            {"comp": "Relay Normally Open (NO)", "pin": "NO", "controller": "Fan Motor Positive / Live Lead", "notes": "Connects power when relay is energized"}
        ],
        "pin_config": [
            {"pin": "D7", "gpio": "GPIO 13", "purpose": "DHT22 Climate Data Bus", "type": "Digital Input / Output", "notes": "Boot-safe; single-bus proprietary protocol with 4.7kΩ pull-up."},
            {"pin": "D1", "gpio": "GPIO 5", "purpose": "Exhaust Fan Relay Actuator", "type": "Digital Output (Active-LOW)", "notes": "Boot-safe; drives relay optocoupler LOW to energize fan."}
        ],
        "firmware": {
            "key_constants": "DHT_PIN = 13; RELAY_PIN = 5; HUMIDITY_TRIGGER = 70.0; TEMP_TRIGGER = 30.0; MIN_RUN_TIME_SEC = 300;",
            "logic": "The sketch polls the DHT22 every 2500ms using DHTesp.h. In the loop, it evaluates: if (humidity >= HUMIDITY_TRIGGER || temperature >= TEMP_TRIGGER), the relay energizes (digitalWrite(RELAY_PIN, LOW)) and marks fanStartTime. The fan remains ON until BOTH conditions drop below their deadband thresholds (humidity < 65% AND temperature < 28°C) AND at least MIN_RUN_TIME_SEC (5 minutes) has elapsed. REST endpoints (/api/readings, /api/health, /api/command, /api/device) allow threshold adjustment and manual override."
        },
        "theory": {
            "formula": "\\text{Relative Humidity (RH \\%)} = \\left( \\frac{P_{w}}{P_{ws}(T)} \\right) \\times 100\\%, \\quad \\text{Purge Time} = \\frac{\\text{Room Volume } (m^3)}{\\text{Fan CFM} \\times 0.0283}",
            "worked_example": "For a bathroom measuring 3m x 2.5m x 2.5m: Room Volume = 18.75 m³. If the exhaust fan delivers 70 CFM (Cubic Feet per Minute) = 70 * 0.0283 = 1.981 m³/min: Time required for 1 complete air exchange = 18.75 / 1.981 = 9.46 minutes. A 10-minute minimum run time guarantees a full fresh air purge."
        },
        "testing": [
            {"id": "T18-01", "procedure": "Power on device at normal room ambient (24°C, 50% RH).", "expected": "Dashboard displays accurate climate; Relay remains OFF (fan idle).", "actual": ""},
            {"id": "T18-02", "procedure": "Breathe gently and continuously on the DHT22 mesh grill for 5 seconds.", "expected": "Humidity spikes above 75% RH; Relay immediately clicks ON; Fan starts spinning.", "actual": ""},
            {"id": "T18-03", "procedure": "Allow humidity to drop back down to 55% RH.", "expected": "Fan continues running until 5-minute minimum purge timer expires, then shuts off cleanly.", "actual": ""},
            {"id": "T18-04", "procedure": "Send POST /api/command with {\"action\": \"fan_on\"} from web UI.", "expected": "Relay energizes immediately in manual override mode.", "actual": ""}
        ],
        "troubleshooting": [
            {"issue": "DHT22 returns 'NaN' (Not a Number) for both temperature and humidity", "cause": "Missing pull-up resistor on data wire or polling faster than 2-second limit", "diag": "Check voltage on D7; ensure minimum 2500ms between dht.getTemperature() calls", "solution": "Install 4.7kΩ pull-up between D7 and 3V3; ensure loop delays >= 2.5s."},
            {"issue": "Fan turns OFF prematurely while bathroom is still completely filled with steam", "cause": "Minimum run timer set too short or humidity threshold set too high", "diag": "Log humidity recovery curve after hot shower", "solution": "Increase MIN_RUN_TIME_SEC to 600 (10 minutes); lower trigger threshold to 65% RH."},
            {"issue": "Relay makes audible click but AC fan does not rotate", "cause": "Blown fuse on AC fan circuit or incorrect terminal connection (NC instead of NO)", "diag": "Measure AC voltage across fan motor terminals when relay is active", "solution": "Verify AC wiring across COM and NO terminals of relay."}
        ],
        "safety": "Strictly follow electrical safety standards when wiring high-voltage 230V AC bathroom exhaust fans. House all electronic components inside a splash-proof NEMA/IP rated enclosure away from direct shower water spray.",
        "outcomes": "Interface single-bus digital environmental sensors, implement dual-variable climate threshold algorithms, design minimum run-time purge safety routines, prevent domestic mold growth, and deploy web-controlled ventilation systems.",
        "viva": [
            {"q": "What is relative humidity and why does it change with temperature?", "a": "Relative humidity is the ratio of current water vapor pressure to saturation water vapor pressure at that temperature. Because warm air can hold more water vapor, heating air reduces its relative humidity."},
            {"q": "How does the DHT22 measure relative humidity?", "a": "It uses a capacitive humidity sensing element with a hygroscopic dielectric polymer layer. As water molecules are absorbed, the dielectric constant changes, shifting electrical capacitance measured by the internal IC."},
            {"q": "Why is a minimum run-time timer (e.g. 5–10 minutes) mandatory for exhaust fans?", "a": "Short cycling damages fan motors. Furthermore, even if sensor humidity drops near the wall, pockets of heavy moisture and condensation remain in room corners, requiring sustained air evacuation."},
            {"q": "What is the checksum byte in the DHT22 40-bit data packet?", "a": "The 5th byte in the packet. It must equal the low 8 bits of the sum of the preceding 4 bytes: (Byte1 + Byte2 + Byte3 + Byte4) & 0xFF. If mismatched, the packet was corrupted and is discarded."},
            {"q": "Why is the DHT22 preferred over the DHT11 for professional ventilation?", "a": "DHT22 covers 0–100% RH (±2% accuracy) and -40°C to +80°C. DHT11 only covers 20–80% RH (±5% accuracy) and 0°C to 50°C, making it incapable of reading sub-zero cold or high condensing humidity."},
            {"q": "Why is GPIO13 (D7) chosen for the DHT22 data pin?", "a": "GPIO13 is a fully boot-safe pin with no strapping restrictions, making it ideal for single-bus bidirectional timing-sensitive communication."},
            {"q": "What is the difference between air extraction and air circulation?", "a": "Circulation moves air within a closed space without removing moisture. Extraction physically expels moisture-laden air to the outdoor atmosphere, drawing in fresh drier air."},
            {"q": "How does mold growth correlate with relative humidity levels?", "a": "Toxic black mold (Stachybotrys chartarum) and mildew require sustained relative humidity above 70% to germinate. Keeping indoor humidity below 60% prevents mold formation entirely."}
        ],
        "exercises": {
            "beginner": "Adjust the humidity trigger setpoint from 70% to 60% in the web dashboard.",
            "intermediate": "Add a historical dew point calculation in the firmware: T_dew ≈ T - ((100 - RH) / 5) and display it on the web dashboard.",
            "advanced": "Implement an automated daily 5-minute 'air freshening' purge cycle that runs at 12:00 PM every day even if thresholds are not met."
        }
    }
]

if __name__ == "__main__":
    print(f"Loaded {len(PROJECTS_CAT_B_PART1)} projects in Category B Part 1.")
