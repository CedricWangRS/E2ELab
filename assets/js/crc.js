/**
 * E2ELab — CRC Computation Engine
 *
 * Implements CRC-8, CRC-16, and CRC-32 with configurable parameters.
 * Used by the E2E engine for profile-specific CRC computation.
 *
 * IMPORTANT: All 32-bit shift operations use `>>> 0` to force unsigned
 * (JavaScript bit ops return signed 32-bit integers by default).
 */

var CRC = {

  // ---- CRC-8 ----

  /**
   * Compute CRC-8 (bit-by-bit, any polynomial).
   * @param {number[]} data - byte array
   * @param {number} poly - 8-bit polynomial (e.g. 0x1D)
   * @param {number} init - initial value (e.g. 0xFF)
   * @returns {number} 8-bit CRC
   */
  compute8: function (data, poly, init) {
    var crc = init & 0xFF;
    for (var i = 0; i < data.length; i++) {
      crc ^= data[i] & 0xFF;
      for (var j = 0; j < 8; j++) {
        if (crc & 0x80) {
          crc = ((crc << 1) ^ poly) & 0xFF;
        } else {
          crc = (crc << 1) & 0xFF;
        }
      }
    }
    return crc;
  },

  /**
   * Compute CRC-8 with per-byte steps for educational display.
   * @returns {{ crc: number, steps: Array }}
   */
  compute8Detailed: function (data, poly, init) {
    var crc = init & 0xFF;
    var steps = [];
    steps.push({ phase: 'init', label: 'Init CRC = 0x' + this.hex8(init), crc: crc });

    for (var i = 0; i < data.length; i++) {
      crc ^= data[i] & 0xFF;
      steps.push({
        phase: 'xor',
        label: 'XOR byte[' + i + '] = 0x' + this.hex8(data[i]),
        crc: crc,
        byteIndex: i,
        byteVal: data[i],
      });

      for (var j = 0; j < 8; j++) {
        var bit7 = (crc >> 7) & 1;
        crc = (crc << 1) & 0xFF;
        if (bit7) {
          crc ^= poly;
          crc &= 0xFF;
        }
      }
      steps.push({
        phase: 'shift',
        label: 'Shift 8 bits (poly 0x' + this.hex8(poly) + ')',
        crc: crc,
      });
    }

    return { crc: crc, steps: steps };
  },

  // ---- CRC-16 ----

  /**
   * Compute CRC-16 (bit-by-bit, any polynomial).
   * @param {number[]} data - byte array
   * @param {number} poly - 16-bit polynomial (e.g. 0x1021)
   * @param {number} init - initial value
   * @returns {number} 16-bit CRC
   */
  compute16: function (data, poly, init) {
    var crc = init & 0xFFFF;
    for (var i = 0; i < data.length; i++) {
      crc ^= (data[i] << 8) & 0xFFFF;
      for (var j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ poly) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc;
  },

  /**
   * Compute CRC-16 with per-byte steps.
   */
  compute16Detailed: function (data, poly, init) {
    var crc = init & 0xFFFF;
    var steps = [];
    steps.push({ phase: 'init', label: 'Init CRC = 0x' + this.hex16(init), crc: crc });

    for (var i = 0; i < data.length; i++) {
      crc ^= (data[i] << 8) & 0xFFFF;
      steps.push({
        phase: 'xor',
        label: 'XOR byte[' + i + '] = 0x' + this.hex8(data[i]),
        crc: crc,
        byteIndex: i,
        byteVal: data[i],
      });

      for (var j = 0; j < 8; j++) {
        var bit15 = (crc >> 15) & 1;
        crc = (crc << 1) & 0xFFFF;
        if (bit15) {
          crc ^= poly;
          crc &= 0xFFFF;
        }
      }
      steps.push({
        phase: 'shift',
        label: 'Shift 8 bits (poly 0x' + this.hex16(poly) + ')',
        crc: crc,
      });
    }

    return { crc: crc, steps: steps };
  },

  // ---- CRC-32 ----

  /**
   * Compute CRC-32 (bit-by-bit, any polynomial).
   * Uses `>>> 0` to force unsigned 32-bit result.
   * @param {number[]} data - byte array
   * @param {number} poly - 32-bit polynomial (e.g. 0x04C11DB7)
   * @param {number} init - initial value
   * @param {number} finalXor - final XOR value (0 if none)
   * @returns {number} 32-bit CRC (unsigned)
   */
  compute32: function (data, poly, init, finalXor) {
    var crc = init >>> 0;
    for (var i = 0; i < data.length; i++) {
      crc ^= (data[i] << 24) >>> 0;
      crc = crc >>> 0;
      for (var j = 0; j < 8; j++) {
        if (crc & 0x80000000) {
          crc = ((crc << 1) ^ poly) >>> 0;
        } else {
          crc = (crc << 1) >>> 0;
        }
      }
    }
    if (finalXor) {
      crc = (crc ^ finalXor) >>> 0;
    }
    return crc;
  },

  /**
   * Compute CRC-32 with per-byte steps.
   */
  compute32Detailed: function (data, poly, init, finalXor) {
    var crc = init >>> 0;
    var steps = [];
    steps.push({ phase: 'init', label: 'Init CRC = 0x' + this.hex32(init), crc: crc });

    for (var i = 0; i < data.length; i++) {
      crc ^= (data[i] << 24) >>> 0;
      crc = crc >>> 0;
      steps.push({
        phase: 'xor',
        label: 'XOR byte[' + i + '] = 0x' + this.hex8(data[i]),
        crc: crc,
        byteIndex: i,
        byteVal: data[i],
      });

      for (var j = 0; j < 8; j++) {
        var bit31 = (crc >>> 31) & 1;
        crc = (crc << 1) >>> 0;
        if (bit31) {
          crc = (crc ^ poly) >>> 0;
        }
      }
      steps.push({
        phase: 'shift',
        label: 'Shift 8 bits (poly 0x' + this.hex32(poly) + ')',
        crc: crc,
      });
    }

    if (finalXor) {
      crc = (crc ^ finalXor) >>> 0;
      steps.push({
        phase: 'finalXor',
        label: 'Final XOR 0x' + this.hex32(finalXor),
        crc: crc,
      });
    }

    return { crc: crc, steps: steps };
  },

  // ---- Formatting helpers ----

  hex8: function (val) {
    return ((val & 0xFF).toString(16)).padStart(2, '0').toUpperCase();
  },

  hex16: function (val) {
    return ((val & 0xFFFF).toString(16)).padStart(4, '0').toUpperCase();
  },

  hex32: function (val) {
    return ((val >>> 0).toString(16)).padStart(8, '0').toUpperCase();
  },

  bin8: function (val) {
    return (val & 0xFF).toString(2).padStart(8, '0');
  },

  bin16: function (val) {
    return (val & 0xFFFF).toString(2).padStart(16, '0');
  },

  bin32: function (val) {
    return ((val >>> 0).toString(2)).padStart(32, '0');
  },
};

window.CRC = CRC;
