# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-11

### Added
- Initial release of E2ELab — AUTOSAR E2E Protection Studio
- Profile Gallery: all 8 AUTOSAR E2E profiles (P01, P02, P04, P05, P06, P07, P11, P22)
- PDU Designer: bit-level PDU layout visualization with color-coded fields
- CRC Calculator: CRC-8/16/32 computation with step-by-step display
- Counter Simulator: TX/RX alive counter simulation with loss injection
- PDU Verifier: complete E2E PDU verification (CRC + counter + field decode)
- 4 sample configurations: Brake Sensor (P01), Steering Angle (P11), ADAS Camera (P22), Body Control (P06)
- Dark/light theme toggle with localStorage persistence
- PWA support (installable, offline-capable)
- Zero external dependencies — pure HTML/CSS/JS
