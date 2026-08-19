/**
 * E2ELab — E2E Protection Engine
 *
 * Defines all AUTOSAR E2E profiles (P01–P22) and provides:
 *   - PDU build / parse operations
 *   - CRC computation (delegates to CRC module)
 *   - Counter management
 *   - PDU verification
 *
 * Profile PDU layouts (byte-level):
 *
 *   P01–P07 (2B overhead):
 *     Byte 0: [ CRC (8 bits) ]
 *     Byte 1: [ Counter (4b, low nibble) | Reserved/DataID (4b, high nibble) ]
 *     Byte 2+: [ Data ]
 *
 *   P11 (4B overhead):
 *     Bytes 0-1: [ CRC (16 bits, little-endian) ]
 *     Byte 2:    [ Counter (8 bits) ]
 *     Byte 3:    [ Reserved (8 bits) ]
 *     Bytes 4+:  [ Data ]
 *
 *   P22 (8B overhead):
 *     Bytes 0-3: [ CRC (32 bits, little-endian) ]
 *     Bytes 4-5: [ Counter (16 bits, little-endian) ]
 *     Bytes 6-7: [ Reserved (16 bits) ]
 *     Bytes 8+:  [ Data ]
 *
 * CRC computation for implicit Data ID profiles:
 *   CRC input = [Data ID bytes (LE)] + [Counter byte(s)] + [Data bytes]
 *   The CRC field itself is NOT included in the CRC computation.
 */

var E2EEngine = {

  // ---- E2E Profile Definitions ----

  PROFILES: {
    P01: {
      id: 'P01',
      name: 'Profile 1',
      category: 'CRC8',
      crcType: 'CRC8',
      crcPoly: 0x1D,
      crcInit: 0xFF,
      counterBits: 4,
      counterMax: 15,
      dataIdBits: 16,
      dataIdMode: 'implicit',
      overheadBytes: 2,
      layoutType: 1,
      maxDelta: 2,
      description: 'Basic E2E protection with a single implicit 16-bit Data ID. The simplest profile — ideal for individual sensor PDUs with a fixed identifier.',
      useCase: 'Single PDU, one fixed identifier (e.g., wheel speed sensor)',
      asilLevel: 'ASIL B',
    },
    P02: {
      id: 'P02',
      name: 'Profile 2',
      category: 'CRC8',
      crcType: 'CRC8',
      crcPoly: 0x1D,
      crcInit: 0xFF,
      counterBits: 4,
      counterMax: 15,
      dataIdBits: 16,
      dataIdMode: 'list',
      dataIdListSize: 16,
      overheadBytes: 2,
      layoutType: 1,
      maxDelta: 2,
      description: 'Supports a list of 16 Data IDs selected by the 4-bit counter. Each counter value maps to a different 16-bit Data ID, allowing multi-PDU protection with one profile instance.',
      useCase: 'Multiple PDUs sharing one E2E instance (e.g., multiplexed sensor data)',
      asilLevel: 'ASIL B',
    },
    P04: {
      id: 'P04',
      name: 'Profile 4',
      category: 'CRC8',
      crcType: 'CRC8',
      crcPoly: 0x1D,
      crcInit: 0xFF,
      counterBits: 4,
      counterMax: 15,
      dataIdBits: 24,
      dataIdMode: 'partial-explicit',
      overheadBytes: 2,
      layoutType: 1,
      maxDelta: 2,
      description: 'Extended 24-bit Data ID — 16 bits implicit, 8 bits explicit (transmitted in the high nibble of byte 1 across two counter cycles). Supports up to 256 unique PDUs.',
      useCase: 'Large number of PDUs with extended addressing',
      asilLevel: 'ASIL B',
    },
    P05: {
      id: 'P05',
      name: 'Profile 5',
      category: 'CRC8',
      crcType: 'CRC8',
      crcPoly: 0x1D,
      crcInit: 0xFF,
      counterBits: 4,
      counterMax: 15,
      dataIdBits: 24,
      dataIdMode: 'partial-explicit',
      overheadBytes: 2,
      layoutType: 1,
      maxDelta: 2,
      description: 'Similar to P04 but optimized for FlexRay. Uses a different Data ID nibble split (4-bit explicit in byte 1 high nibble, 20-bit implicit).',
      useCase: 'FlexRay-based E2E protection',
      asilLevel: 'ASIL B',
    },
    P06: {
      id: 'P06',
      name: 'Profile 6',
      category: 'CRC8',
      crcType: 'CRC8',
      crcPoly: 0x1D,
      crcInit: 0xFF,
      counterBits: 4,
      counterMax: 15,
      dataIdBits: 16,
      dataIdMode: 'implicit',
      overheadBytes: 2,
      layoutType: 1,
      maxDelta: 2,
      description: 'Optimized variant of P01 with a different CRC computation method. The Data ID is XORed into the CRC at a different position, providing an alternative CRC family for legacy compatibility.',
      useCase: 'Legacy systems requiring P01-like behavior with different CRC',
      asilLevel: 'ASIL B',
    },
    P07: {
      id: 'P07',
      name: 'Profile 7',
      category: 'CRC8',
      crcType: 'CRC8',
      crcPoly: 0x1D,
      crcInit: 0xFF,
      counterBits: 4,
      counterMax: 15,
      dataIdBits: 16,
      dataIdMode: 'implicit',
      overheadBytes: 2,
      layoutType: 1,
      maxDelta: 2,
      description: 'Enhanced P01 variant with an additional Data ID check. Uses the same CRC8 polynomial but verifies the Data ID differently, providing stronger protection against masquerading.',
      useCase: 'Enhanced security for ASIL B/D applications',
      asilLevel: 'ASIL D',
    },
    P11: {
      id: 'P11',
      name: 'Profile 11',
      category: 'CRC16',
      crcType: 'CRC16',
      crcPoly: 0x1021,
      crcInit: 0x0000,
      counterBits: 8,
      counterMax: 255,
      dataIdBits: 32,
      dataIdMode: 'implicit',
      overheadBytes: 4,
      layoutType: 2,
      maxDelta: 2,
      description: 'CRC16-CCITT with 8-bit alive counter and 32-bit implicit Data ID. 4-byte overhead. Designed for larger PDUs requiring stronger integrity protection than CRC8.',
      useCase: 'Large CAN-FD PDUs or safety-critical data (e.g., steering angle)',
      asilLevel: 'ASIL D',
    },
    P22: {
      id: 'P22',
      name: 'Profile 22',
      category: 'CRC32',
      crcType: 'CRC32',
      crcPoly: 0x04C11DB7,
      crcInit: 0xFFFFFFFF,
      crcFinalXor: 0xFFFFFFFF,
      counterBits: 16,
      counterMax: 65535,
      dataIdBits: 32,
      dataIdMode: 'implicit',
      overheadBytes: 8,
      layoutType: 3,
      maxDelta: 2,
      description: 'CRC32 with 16-bit alive counter and 32-bit implicit Data ID. 8-byte overhead. Designed for very large PDUs (Ethernet, CAN-FD with 64-byte payload) requiring maximum integrity.',
      useCase: 'Ethernet/SOME-IP PDUs, large CAN-FD payloads (e.g., ADAS camera data)',
      asilLevel: 'ASIL D',
    },
  },

  // ---- Profile accessors ----

  getProfileIds: function () {
    return Object.keys(this.PROFILES);
  },

  getProfile: function (id) {
    return this.PROFILES[id] || null;
  },

  getProfilesByCategory: function (cat) {
    var result = [];
    for (var id in this.PROFILES) {
      if (this.PROFILES[id].category === cat) {
        result.push(this.PROFILES[id]);
      }
    }
    return result;
  },

  getCategories: function () {
    var seen = {};
    var result = [];
    for (var id in this.PROFILES) {
      var cat = this.PROFILES[id].category;
      if (!seen[cat]) {
        seen[cat] = true;
        result.push(cat);
      }
    }
    return result;
  },

  // ---- CRC computation ----

  /**
   * Compute the E2E CRC for a given profile.
   * The CRC input is: [implicit Data ID bytes (LE)] + [counter byte(s)] + [data bytes]
   */
  computeCrc: function (profileId, data, counter, dataId) {
    var profile = this.getProfile(profileId);
    if (!profile) return 0;

    var crcInput = this._buildCrcInput(profile, data, counter, dataId);

    if (profile.crcType === 'CRC8') {
      return CRC.compute8(crcInput, profile.crcPoly, profile.crcInit);
    } else if (profile.crcType === 'CRC16') {
      return CRC.compute16(crcInput, profile.crcPoly, profile.crcInit);
    } else if (profile.crcType === 'CRC32') {
      return CRC.compute32(crcInput, profile.crcPoly, profile.crcInit, profile.crcFinalXor || 0);
    }
    return 0;
  },

  /**
   * Compute CRC with detailed steps for educational display.
   */
  computeCrcDetailed: function (profileId, data, counter, dataId) {
    var profile = this.getProfile(profileId);
    if (!profile) return null;

    var crcInput = this._buildCrcInput(profile, data, counter, dataId);

    if (profile.crcType === 'CRC8') {
      return CRC.compute8Detailed(crcInput, profile.crcPoly, profile.crcInit);
    } else if (profile.crcType === 'CRC16') {
      return CRC.compute16Detailed(crcInput, profile.crcPoly, profile.crcInit);
    } else if (profile.crcType === 'CRC32') {
      return CRC.compute32Detailed(crcInput, profile.crcPoly, profile.crcInit, profile.crcFinalXor || 0);
    }
    return null;
  },

  /**
   * Build the byte array used as CRC input.
   * For implicit profiles: prepends Data ID bytes (little-endian).
   * Then appends counter byte(s) and data bytes.
   */
  _buildCrcInput: function (profile, data, counter, dataId) {
    var input = [];

    // Add implicit Data ID bytes (little-endian)
    if (profile.dataIdMode === 'implicit' || profile.dataIdMode === 'list') {
      if (profile.dataIdBits === 16) {
        input.push(dataId & 0xFF);
        input.push((dataId >> 8) & 0xFF);
      } else if (profile.dataIdBits === 32) {
        input.push(dataId & 0xFF);
        input.push((dataId >> 8) & 0xFF);
        input.push((dataId >> 16) & 0xFF);
        input.push((dataId >> 24) & 0xFF);
      }
    }

    // Add counter byte(s)
    if (profile.counterBits === 4) {
      input.push(counter & 0x0F);
    } else if (profile.counterBits === 8) {
      input.push(counter & 0xFF);
    } else if (profile.counterBits === 16) {
      input.push(counter & 0xFF);
      input.push((counter >> 8) & 0xFF);
    }

    // Add data bytes
    for (var i = 0; i < data.length; i++) {
      input.push(data[i]);
    }

    return input;
  },

  // ---- PDU build / parse ----

  /**
   * Build a complete E2E-protected PDU.
   * @returns {number[]} PDU byte array
   */
  buildPdu: function (profileId, data, counter, dataId) {
    var profile = this.getProfile(profileId);
    if (!profile) return null;

    var pduLen = profile.overheadBytes + data.length;
    var pdu = new Array(pduLen).fill(0);

    // Insert data bytes (after overhead)
    var dataOffset = profile.overheadBytes;
    for (var i = 0; i < data.length; i++) {
      pdu[dataOffset + i] = data[i];
    }

    // Insert counter (depends on layout type)
    if (profile.layoutType === 1) {
      // Byte 1, low nibble
      pdu[1] = (pdu[1] & 0xF0) | (counter & 0x0F);
    } else if (profile.layoutType === 2) {
      // Byte 2, full byte
      pdu[2] = counter & 0xFF;
    } else if (profile.layoutType === 3) {
      // Bytes 4-5, little-endian
      pdu[4] = counter & 0xFF;
      pdu[5] = (counter >> 8) & 0xFF;
    }

    // Insert explicit Data ID nibble for P04/P05
    if (profile.dataIdMode === 'partial-explicit') {
      var idNibble = (dataId >> 16) & 0x0F;
      pdu[1] = (pdu[1] & 0x0F) | (idNibble << 4);
    }

    // Compute and insert CRC
    var crc = this.computeCrc(profileId, data, counter, dataId);
    if (profile.crcType === 'CRC8') {
      pdu[0] = crc & 0xFF;
    } else if (profile.crcType === 'CRC16') {
      pdu[0] = crc & 0xFF;
      pdu[1] = (crc >> 8) & 0xFF;
    } else if (profile.crcType === 'CRC32') {
      pdu[0] = crc & 0xFF;
      pdu[1] = (crc >> 8) & 0xFF;
      pdu[2] = (crc >> 16) & 0xFF;
      pdu[3] = (crc >> 24) & 0xFF;
    }

    return pdu;
  },

  /**
   * Parse an E2E PDU and extract all fields.
   * @returns {{ crc, counter, dataIdNibble, data, rawBytes }}
   */
  parsePdu: function (profileId, pduBytes) {
    var profile = this.getProfile(profileId);
    if (!profile) return null;

    if (pduBytes.length < profile.overheadBytes) {
      return { error: 'PDU too short: need at least ' + profile.overheadBytes + ' bytes, got ' + pduBytes.length };
    }

    var crc = 0;
    var counter = 0;
    var dataIdNibble = 0;
    var dataStart = profile.overheadBytes;

    // Extract CRC
    if (profile.crcType === 'CRC8') {
      crc = pduBytes[0];
    } else if (profile.crcType === 'CRC16') {
      crc = pduBytes[0] | (pduBytes[1] << 8);
      crc &= 0xFFFF;
    } else if (profile.crcType === 'CRC32') {
      crc = (pduBytes[0] | (pduBytes[1] << 8) | (pduBytes[2] << 16) | (pduBytes[3] << 24)) >>> 0;
    }

    // Extract counter
    if (profile.layoutType === 1) {
      counter = pduBytes[1] & 0x0F;
      dataIdNibble = (pduBytes[1] >> 4) & 0x0F;
    } else if (profile.layoutType === 2) {
      counter = pduBytes[2];
    } else if (profile.layoutType === 3) {
      counter = pduBytes[4] | (pduBytes[5] << 8);
      counter &= 0xFFFF;
    }

    // Extract data
    var data = [];
    for (var i = dataStart; i < pduBytes.length; i++) {
      data.push(pduBytes[i]);
    }

    return {
      crc: crc,
      counter: counter,
      dataIdNibble: dataIdNibble,
      data: data,
      rawBytes: pduBytes.slice(),
    };
  },

  // ---- Verification ----

  /**
   * Verify a complete E2E-protected PDU.
   * @param {string} profileId - Profile ID
   * @param {number[]} pduBytes - Raw PDU bytes
   * @param {number} expectedDataId - Expected Data ID (for implicit profiles)
   * @param {number} [lastRxCounter] - Last received counter for delta check
   * @returns {{ crcOk, counterOk, computedCrc, receivedCrc, delta, counter, data, details }}
   */
  verifyPdu: function (profileId, pduBytes, expectedDataId, lastRxCounter) {
    var profile = this.getProfile(profileId);
    if (!profile) return { error: 'Unknown profile: ' + profileId };

    var parsed = this.parsePdu(profileId, pduBytes);
    if (parsed.error) return { error: parsed.error };

    // Recompute CRC
    var computedCrc = this.computeCrc(profileId, parsed.data, parsed.counter, expectedDataId || 0);
    var crcOk = (computedCrc === parsed.crc);

    // Check counter delta
    var counterOk = true;
    var delta = 0;
    if (lastRxCounter !== undefined && lastRxCounter !== null) {
      var counterRange = profile.counterMax + 1;
      delta = (parsed.counter - lastRxCounter + counterRange) % counterRange;
      if (delta === 0) {
        counterOk = false; // Duplicate
      } else if (delta > profile.maxDelta) {
        counterOk = false; // Too many losses
      }
    }

    return {
      crcOk: crcOk,
      counterOk: counterOk,
      computedCrc: computedCrc,
      receivedCrc: parsed.crc,
      delta: delta,
      counter: parsed.counter,
      dataIdNibble: parsed.dataIdNibble,
      data: parsed.data,
      rawBytes: parsed.rawBytes,
      profile: profile,
    };
  },

  // ---- Counter operations ----

  nextCounter: function (profileId, current) {
    var profile = this.getProfile(profileId);
    if (!profile) return 0;
    return (current + 1) % (profile.counterMax + 1);
  },

  checkCounterDelta: function (profileId, txCounter, rxCounter) {
    var profile = this.getProfile(profileId);
    if (!profile) return { ok: false, reason: 'Unknown profile' };

    var counterRange = profile.counterMax + 1;
    var delta = (rxCounter - txCounter + counterRange) % counterRange;

    if (delta === 0) {
      return { ok: false, delta: 0, reason: 'Duplicate (delta = 0)' };
    } else if (delta > profile.maxDelta) {
      return { ok: false, delta: delta, reason: 'Exceeded max delta (' + profile.maxDelta + ')' };
    }
    return { ok: true, delta: delta, reason: 'OK' };
  },

  // ---- Formatting utilities ----

  formatHex: function (val, digits) {
    digits = digits || 2;
    return ((val >>> 0).toString(16)).padStart(digits, '0').toUpperCase();
  },

  toHex: function (bytes) {
    var self = this;
    return bytes.map(function (b) { return self.formatHex(b, 2); }).join(' ');
  },

  parseHex: function (str) {
    if (!str) return [];
    var cleaned = str.replace(/0x/gi, '').replace(/[^0-9a-fA-F\s]/g, ' ').trim();
    if (!cleaned) return [];
    var parts = cleaned.split(/\s+/);
    var bytes = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length === 0) continue;
      if (parts[i].length > 2) {
        // Split long hex strings into byte pairs
        for (var j = 0; j < parts[i].length; j += 2) {
          var byteStr = parts[i].substring(j, j + 2);
          var val = parseInt(byteStr, 16);
          if (isNaN(val)) return null;
          bytes.push(val);
        }
      } else {
        var val = parseInt(parts[i], 16);
        if (isNaN(val)) return null;
        bytes.push(val);
      }
    }
    return bytes;
  },

  formatTime: function (ms) {
    if (ms < 1000) return ms + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  },
};

window.E2EEngine = E2EEngine;
