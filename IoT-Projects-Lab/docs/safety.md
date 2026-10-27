# IoT Projects Lab — Actuator & Electrical Safety Guidelines

---

## 1. Electrical Isolation & Mains Voltage Safety
Several projects in Category B (P14 Water Tank Controller, P16 Wi-Fi Home Automation, P23 Relay Dashboard) demonstrate switching loads that, in real installations, operate at high mains AC voltages (110V–240V AC).

> [!WARNING]
> **MAINS VOLTAGE WARNING:** Mains electricity carries severe risk of fatal electric shock or fire hazard.
> 1. All educational experiments, prototyping, and testing should initially be conducted using **low-voltage DC demonstration loads** (such as 5V–12V DC LED strips, buzzers, or small 5V DC fans).
> 2. Never touch exposed relay screw terminals while energized.
> 3. Mains relays must be housed in fire-retardant, enclosed junction boxes with physical strain reliefs on all wires.
> 4. Ensure an inline fuse or miniature circuit breaker (MCB) is installed on the AC live line.

---

## 2. Boot & Reset State Protection
When an ESP8266 microcontroller powers on or undergoes a watchdog reset, GPIO pins may momentarily float or output pull-up pulses.
- All firmware in Category B initializes output pins to their safe **de-energized state** (Relays OFF, Motors STOPPED, PWM 0) prior to activating pin directions.
- For active-LOW relays, outputs are driven HIGH (`digitalWrite(PIN, HIGH)`) before configuring `pinMode(PIN, OUTPUT)`.

---

## 3. Dry-Run & Runtime Safety Interlocks
1. **P13 & P14 Water Pumps:** Pumps will overheat or fail if run dry or if an ultrasonic sensor gets disconnected. The firmware implements a 5-minute maximum continuous run cutoff timer.
2. **P19 Automatic Door Controller:** Incorporates an active obstruction safety beam that halts and reopens doors if an object or person blocks the transit path.
3. **P24 Greenhouse Automation:** Includes a hardware float switch interlock. If the reservoir drops below minimum level, the irrigation pump is immediately locked out.
