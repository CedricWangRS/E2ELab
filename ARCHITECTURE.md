# E2ELab — Architecture

## Overview

E2ELab is a single-page application built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies. The entire app runs in the browser via traditional `<script>` tags and global variables.

## Module Architecture

```
index.html
  └─ script tags load in order:
     1. crc.js           → window.CRC          (CRC computation)
     2. e2e-engine.js    → window.E2EEngine     (E2E profiles + PDU ops)
     3. pdu-designer.js  → window.PduDesigner   (SVG PDU layout)
     4. presets.js       → window.Presets       (sample configs)
     5. store.js         → window.Store         (localStorage)
     6. app.js           → window.App           (main controller)
     7. main.js          → (entry point, calls App.init)
```

## Data Flow

```
User Input (hex, profile selection)
  → App state (designerData, crcInput, verifyPduHex, etc.)
  → E2EEngine.buildPdu() / parsePdu() / verifyPdu()
    → CRC.compute8/16/32()
  → PduDesigner.render() (SVG grid)
  → DOM innerHTML update
```

## E2E Engine

### Profile Definitions

Each profile defines:
- `crcType`: CRC8, CRC16, or CRC32
- `crcPoly`: CRC polynomial (0x1D, 0x1021, 0x04C11DB7)
- `crcInit`: Initial CRC value
- `counterBits`: 4, 8, or 16
- `dataIdMode`: implicit, list, or partial-explicit
- `overheadBytes`: PDU overhead (2, 4, or 8 bytes)
- `layoutType`: 1 (P01-P07), 2 (P11), or 3 (P22)

### PDU Layout Types

**Type 1** (P01–P07, 2B overhead):
```
Byte 0: [CRC (8 bits)]
Byte 1: [Counter (4b, low nibble) | Reserved/DataID (4b, high nibble)]
Byte 2+: [Data]
```

**Type 2** (P11, 4B overhead):
```
Bytes 0-1: [CRC (16 bits, LE)]
Byte 2:    [Counter (8 bits)]
Byte 3:    [Reserved]
Bytes 4+:  [Data]
```

**Type 3** (P22, 8B overhead):
```
Bytes 0-3: [CRC (32 bits, LE)]
Bytes 4-5: [Counter (16 bits, LE)]
Bytes 6-7: [Reserved]
Bytes 8+:  [Data]
```

### CRC Computation

The CRC input is assembled as:
1. Data ID bytes (little-endian) — if implicit/list mode
2. Counter byte(s)
3. Data bytes

The CRC field itself is NOT included in the computation.

For CRC-32, all bit shift operations use `>>> 0` to force unsigned 32-bit integers, since JavaScript's `<<` returns signed integers (see project TOOLS.md for the 32-bit address trap lesson).

## Views

The App controller manages 5 views, each with a `render*` and optional `afterRender*` method:

| View | Render Method | Purpose |
|------|--------------|---------|
| Profile Gallery | `renderProfiles()` | Browse/compare profiles |
| PDU Designer | `renderDesigner()` + `afterRenderDesigner()` | Visualize PDU layout |
| CRC Calculator | `renderCrcCalc()` + `afterRenderCrcCalc()` | Compute CRC with steps |
| Counter Simulator | `renderCounterSim()` + `afterRenderCounterSim()` | Simulate TX/RX |
| Verifier | `renderVerifier()` + `afterRenderVerifier()` | Verify complete PDU |

`afterRender*` methods attach event listeners after DOM update.

## PDU Designer

The PDU Designer renders an SVG grid where:
- Each row = one byte
- Each cell = one bit (8 cells per row)
- Cell color = field type (CRC=amber, Counter=purple, Data ID=teal, Data=blue, Reserved=gray)

The `getFieldMap()` method maps each (byteIndex, bitIndex) pair to a field type based on the profile's layout type.

## State Management

All state lives in the `App` object (no external state library):
- `activeProfile`: currently selected E2E profile
- `designerData`, `designerCounter`, `designerDataId`: PDU Designer inputs
- `crcInput`, `crcProfile`: CRC Calculator inputs
- `counterTx`, `counterRx`, `counterHistory`: Counter Simulator state
- `verifyPduHex`, `verifyProfile`, `verifyDataId`, `verifyLastCounter`: Verifier inputs

Theme preference is persisted via `Store` (localStorage wrapper).
