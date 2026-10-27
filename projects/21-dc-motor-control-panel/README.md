# Project 21 — DC Motor Control Panel

## Purpose
Control a DC motor direction and speed via a proper H-bridge driver (TB6612FNG or DRV8833).

## Hardware
- ESP8266 NodeMCU
- TB6612FNG or DRV8833 motor driver
- DC motor (appropriate voltage/current for driver)
- External motor power supply

## Features
- Motor ON/OFF, direction control (Forward/Reverse)
- PWM speed adjustment
- Smooth acceleration/deceleration model
- Simulated load and stall fault
- Speed and direction history
- Command log

## Safety
- NEVER connect motor directly to GPIO pin
- Use appropriately rated motor driver
- External motor supply — do not share with logic supply without proper decoupling
