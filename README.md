# E2ELab — AUTOSAR E2E Protection Studio

> Interactive studio for AUTOSAR E2E (End-to-End) Protection: profile gallery, PDU layout designer, CRC calculator, alive counter simulator, and PDU verifier. Zero dependencies. Runs in any browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version: 1.0.0](https://img.shields.io/badge/version-1.0.0-blue.svg)](./CHANGELOG.md)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-purple.svg)](./manifest.json)
[![Author: Cedric.Wang](https://img.shields.io/badge/author-Cedric.Wang-teal.svg)](https://cedric.wang/)

---

## What is E2ELab?

E2ELab is a zero-dependency, browser-based tool for AUTOSAR engineers who work with **E2E (End-to-End) Protection** — the safety mechanism defined in ISO 26262 for protecting communication data integrity on CAN, CAN-FD, FlexRay, and Automotive Ethernet.

If you've ever:
- Stared at an E2E Profile specification wondering which one to use
- Computed a CRC8 by hand to verify a protected PDU
- Debugged an alive counter mismatch between two ECUs
- Struggled to visualize where the CRC and counter sit in a 64-bit CAN frame

**E2ELab was built for you.**

## Features

### 1. Profile Gallery
Browse all 8 AUTOSAR E2E profiles (P01–P22) side by side:
- CRC type (CRC8/16/32), counter size, Data ID mode, overhead
- Mini PDU layout diagram for each profile
- Use case recommendations (which profile for which sensor/ECU)
- ASIL level guidance

### 2. PDU Designer
Visualize the bit-level PDU layout for any profile:
- Color-coded bit grid showing CRC, Counter, Data ID, Data, and Reserved fields
- Real-time PDU construction from hex input
- Byte-by-byte field decomposition table
- Copy complete PDU hex to clipboard

### 3. CRC Calculator
Compute CRC8/16/32 with step-by-step visualization:
- Configurable polynomial and initial value
- AUTOSAR E2E default parameters per profile
- Per-byte CRC state progression
- Binary representation at each step

### 4. Counter Simulator
Simulate alive counter behavior (TX and RX):
- Visual counter display (4-bit / 8-bit / 16-bit)
- TX (send) and RX (receive) simulation
- Inject message loss to see counter delta detection
- Configurable MaxDelta threshold
- History timeline with pass/fail status

### 5. PDU Verifier
Verify a complete E2E-protected PDU:
- Paste hex bytes, select profile, enter expected Data ID
- CRC verification (recompute and compare)
- Counter delta check (against last received counter)
- Decoded field table (CRC, Counter, Data ID, Data)
- Pass/fail dashboard with detailed diagnostics

## Quick Start

1. Download or clone this repository
2. Open `index.html` in any modern browser
3. No server, no build step, no dependencies — just double-click

That's it. It also works as a PWA (installable, works offline).

## E2E Profile Reference

| Profile | CRC | Counter | Data ID | Overhead | Use Case |
|---------|-----|---------|---------|----------|----------|
| P01 | CRC8 | 4-bit | 16-bit implicit | 2B | Simple sensor (wheel speed) |
| P02 | CRC8 | 4-bit | 16 × 16-bit list | 2B | Multi-PDU with ID list |
| P04 | CRC8 | 4-bit | 24-bit partial | 2B | Extended ID space |
| P05 | CRC8 | 4-bit | 24-bit partial | 2B | FlexRay optimization |
| P06 | CRC8 | 4-bit | 16-bit implicit | 2B | Optimized P01 |
| P07 | CRC8 | 4-bit | 16-bit implicit | 2B | Enhanced P01 |
| P11 | CRC16 | 8-bit | 32-bit implicit | 4B | Safety-critical (steering) |
| P22 | CRC32 | 16-bit | 32-bit implicit | 8B | Ethernet / large PDUs |

## Project Structure

```
e2elab/
├── index.html              # HTML entry point
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (offline cache)
├── assets/
│   ├── css/
│   │   ├── variables.css    # Design tokens (colors, spacing, layout)
│   │   ├── base.css         # Reset + typography
│   │   ├── layout.css       # Sidebar + topbar + main grid
│   │   └── components.css   # Cards, forms, bit grids, tables, etc.
│   └── js/
│       ├── crc.js           # CRC-8/16/32 computation engine
│       ├── e2e-engine.js   # E2E profile definitions + PDU operations
│       ├── pdu-designer.js  # SVG PDU bit-level layout renderer
│       ├── presets.js       # Sample E2E configurations
│       ├── store.js         # localStorage wrapper
│       ├── app.js           # Main controller (5 views)
│       └── main.js          # Entry point
├── LICENSE                  # MIT
├── NOTICE                   # Attribution
├── README.md                # This file
├── CHANGELOG.md             # Version history
├── CONTRIBUTING.md          # How to contribute
└── ARCHITECTURE.md          # Technical architecture
```

## Browser Support

Works in any modern browser (Chrome 80+, Firefox 75+, Safari 14+, Edge 80+). No external requests, no CDNs, no frameworks.

## Part of the AUTOSAR Tool Matrix

E2ELab is part of a zero-dependency AUTOSAR tool suite:

| Tool | Purpose |
|------|---------|
| [DevKit](https://github.com/cedricwang/) | General-purpose developer utilities |
| [AUTOSAR Lab](https://github.com/cedricwang/) | Interactive AUTOSAR learning |
| [CANcraft](https://github.com/cedricwang/) | CAN signal manipulation |
| [OSviz](https://github.com/cedricwang/) | OS scheduling visualization |
| [DTC Lab](https://github.com/cedricwang/) | Diagnostic trouble code management |
| [MemViz](https://github.com/cedricwang/) | Memory layout visualization |
| [NmViz](https://github.com/cedricwang/) | Network management state machine |
| **E2ELab** | **E2E protection configuration** |

## License

MIT — see [LICENSE](./LICENSE).

## Author

Cedric.Wang — https://cedric.wang/
