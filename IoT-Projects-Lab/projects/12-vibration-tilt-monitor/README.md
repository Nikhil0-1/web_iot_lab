# Project 08: Vibration & Tilt Monitor

## 1. Project Overview
The **Vibration & Tilt Monitor** tracks inertial kinematics in real time using the MPU6050 6-Axis motion tracking sensor. It computes Euler tilt angles (Pitch & Roll) using trigonometric accelerometer decomposition and measures total resultant acceleration (G-Force) to detect mechanical vibration and physical impacts.

## 2. Features
- **3D Artificial Attitude Horizon:** Animated aviation-style attitude director with sky/ground separation, pitch ladder marks, and roll rotation.
- **Vibration & Shock Diagnostics:** Classifies motion states (*Stationary*, *Inclined*, *Excessive Tilt*, *Active Vibration*, *Shock / Impact*).
- **Time-Series Charting:** Tracks peak G-Force vibrations over time.
- **REST API:** Clean JSON endpoints for hardware integration.

## 3. Mathematical Foundations
- $\text{Pitch} = \text{atan2}(A_x, \sqrt{A_y^2 + A_z^2}) \times \frac{180}{\pi}$
- $\text{Roll} = \text{atan2}(A_y, A_z) \times \frac{180}{\pi}$
- $\text{Total G} = \sqrt{A_x^2 + A_y^2 + A_z^2}$
