# Project 05: Water Level Monitor

## 1. Project Overview
The **Water Level Monitor** uses ultrasonic time-of-flight acoustic ranging (HC-SR04 or waterproof JSN-SR04T) mounted atop a storage tank to measure distance to the liquid surface. The system calculates water column depth, fill percentage, and stored volume in liters.

## 2. Features
- **Dynamic Fluid Tank Animation:** Visual cross-section with fluid waves and fill markers responding to data.
- **Configurable Geometry:** Computes volumetric capacity and remaining depth.
- **Low & High Threshold Warnings:** Highlights overflow risks and empty tank alarms.
- **Safe 5V/3.3V Voltage Divider:** Detailed electrical protection guidelines for NodeMCU GPIO.
