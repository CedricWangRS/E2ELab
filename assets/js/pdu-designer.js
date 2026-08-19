/**
 * E2ELab — PDU Layout Visualizer
 *
 * Renders the bit-level PDU layout as a colored SVG grid.
 * Each byte is a row; each bit is a colored cell.
 *
 * Field colors:
 *   CRC       — amber (#d97706)
 *   Counter   — purple (#8b5cf6)
 *   Data ID   — teal (#14b8a6)
 *   Data      — blue (#3b82f6)
 *   Reserved  — gray (#6b7280)
 */

var PduDesigner = {

  COLORS: {
    crc:      { fill: '#d97706', light: 'rgba(217,119,6,0.15)', name: 'CRC',       short: 'C' },
    counter:  { fill: '#8b5cf6', light: 'rgba(139,92,246,0.15)', name: 'Counter',  short: 'Cn' },
    dataid:   { fill: '#14b8a6', light: 'rgba(20,184,166,0.15)', name: 'Data ID',  short: 'ID' },
    data:     { fill: '#3b82f6', light: 'rgba(59,130,246,0.15)', name: 'Data',     short: 'D' },
    reserved: { fill: '#6b7280', light: 'rgba(107,114,128,0.10)', name: 'Reserved', short: 'R' },
  },

  CELL_W: 32,
  CELL_H: 28,
  LABEL_W: 80,
  RIGHT_PAD: 20,

  /**
   * Map each byte index and bit position to a field type.
   * Returns a 2D array: byteMap[byteIndex][bitPosition] = fieldType
   */
  buildByteMap: function (profile, dataLength) {
    var totalBytes = profile.overheadBytes + dataLength;
    var byteMap = [];
    for (var b = 0; b < totalBytes; b++) {
      byteMap.push(['reserved', 'reserved', 'reserved', 'reserved',
                    'reserved', 'reserved', 'reserved', 'reserved']);
    }

    // CRC field
    if (profile.crcType === 'CRC8') {
      this._fillBits(byteMap, 0, 0, 8, 'crc');
    } else if (profile.crcType === 'CRC16') {
      this._fillBits(byteMap, 0, 0, 8, 'crc');
      this._fillBits(byteMap, 1, 0, 8, 'crc');
    } else if (profile.crcType === 'CRC32') {
      this._fillBits(byteMap, 0, 0, 8, 'crc');
      this._fillBits(byteMap, 1, 0, 8, 'crc');
      this._fillBits(byteMap, 2, 0, 8, 'crc');
      this._fillBits(byteMap, 3, 0, 8, 'crc');
    }

    // Counter field
    if (profile.layoutType === 1) {
      // Byte 1, bits 0-3 (low nibble)
      this._fillBits(byteMap, 1, 0, 4, 'counter');
      // Byte 1, bits 4-7: Data ID nibble or reserved
      if (profile.dataIdMode === 'partial-explicit' || profile.dataIdMode === 'list') {
        this._fillBits(byteMap, 1, 4, 4, 'dataid');
      } else {
        this._fillBits(byteMap, 1, 4, 4, 'reserved');
      }
    } else if (profile.layoutType === 2) {
      // Byte 2, all 8 bits
      this._fillBits(byteMap, 2, 0, 8, 'counter');
      // Byte 3: reserved
      this._fillBits(byteMap, 3, 0, 8, 'reserved');
    } else if (profile.layoutType === 3) {
      // Bytes 4-5, 16 bits
      this._fillBits(byteMap, 4, 0, 8, 'counter');
      this._fillBits(byteMap, 5, 0, 8, 'counter');
      // Bytes 6-7: reserved
      this._fillBits(byteMap, 6, 0, 8, 'reserved');
      this._fillBits(byteMap, 7, 0, 8, 'reserved');
    }

    // Data field
    for (var d = 0; d < dataLength; d++) {
      this._fillBits(byteMap, profile.overheadBytes + d, 0, 8, 'data');
    }

    return byteMap;
  },

  _fillBits: function (byteMap, byteIdx, startBit, count, fieldType) {
    if (!byteMap[byteIdx]) return;
    for (var i = startBit; i < startBit + count && i < 8; i++) {
      byteMap[byteIdx][i] = fieldType;
    }
  },

  /**
   * Render the PDU layout SVG.
   * @param {HTMLElement} container
   * @param {Object} profile - E2E profile definition
   * @param {number[]} pduBytes - actual PDU byte values (optional, for display)
   */
  render: function (container, profile, pduBytes) {
    if (!container || !profile) return;
    pduBytes = pduBytes || [];
    var dataLength = Math.max(pduBytes.length - profile.overheadBytes, 4);
    if (pduBytes.length > 0) {
      dataLength = pduBytes.length - profile.overheadBytes;
    }

    var totalBytes = profile.overheadBytes + dataLength;
    if (totalBytes < profile.overheadBytes + 1) totalBytes = profile.overheadBytes + 4;

    var byteMap = this.buildByteMap(profile, Math.max(dataLength, 4));
    var actualBytes = Math.max(totalBytes, profile.overheadBytes + 4);
    if (pduBytes.length > 0) actualBytes = pduBytes.length;

    var w = this.LABEL_W + 8 * this.CELL_W + this.RIGHT_PAD;
    var h = actualBytes * (this.CELL_H + 4) + 60;

    var self = this;
    var svg = '<svg width="100%" viewBox="0 0 ' + w + ' ' + h + '" role="img">';
    svg += '<style>.pdu-cell{transition:opacity 150ms}.pdu-cell:hover{opacity:0.8}.pdu-bit-val{font-size:11px;font-weight:600;text-anchor:middle;pointer-events:none}.pdu-byte-label{font-size:11px;font-weight:600;fill:var(--text-muted)}.pdu-field-label{font-size:10px;font-weight:500;fill:var(--text-secondary)}</style>';

    // Header row: bit numbers
    svg += '<text x="' + (this.LABEL_W / 2) + '" y="16" text-anchor="middle" class="pdu-byte-label">Byte</text>';
    for (var bit = 7; bit >= 0; bit--) {
      var bx = this.LABEL_W + (7 - bit) * this.CELL_W + this.CELL_W / 2;
      svg += '<text x="' + bx + '" y="16" text-anchor="middle" class="pdu-byte-label">' + bit + '</text>';
    }

    // Byte rows
    for (var byteIdx = 0; byteIdx < actualBytes; byteIdx++) {
      var y = 30 + byteIdx * (this.CELL_H + 4);

      // Byte label
      svg += '<text x="' + (this.LABEL_W / 2) + '" y="' + (y + this.CELL_H / 2 + 4) + '" text-anchor="middle" class="pdu-byte-label">' + byteIdx + '</text>';

      // Bit cells
      for (var bitPos = 0; bitPos < 8; bitPos++) {
        var fieldType = byteMap[byteIdx] ? byteMap[byteIdx][bitPos] : 'reserved';
        var color = this.COLORS[fieldType] || this.COLORS.reserved;
        var cx = this.LABEL_W + (7 - bitPos) * this.CELL_W;
        var cy = y;

        svg += '<rect class="pdu-cell" x="' + cx + '" y="' + cy + '" width="' + (this.CELL_W - 2) + '" height="' + (this.CELL_H - 2) + '" rx="3"';
        svg += ' fill="' + color.light + '" stroke="' + color.fill + '" stroke-width="1"';
        svg += ' title="' + color.name + ' (bit ' + bitPos + ')" />';

        // Bit value (if PDU bytes provided)
        if (pduBytes.length > byteIdx) {
          var bitVal = (pduBytes[byteIdx] >> bitPos) & 1;
          svg += '<text class="pdu-bit-val" x="' + (cx + (this.CELL_W - 2) / 2) + '" y="' + (cy + (this.CELL_H - 2) / 2 + 4) + '"';
          svg += ' fill="' + color.fill + '">' + bitVal + '</text>';
        } else {
          svg += '<text class="pdu-bit-val" x="' + (cx + (this.CELL_W - 2) / 2) + '" y="' + (cy + (this.CELL_H - 2) / 2 + 4) + '"';
          svg += ' fill="' + color.fill + '">' + color.short + '</text>';
        }
      }

      // Field label on the right
      var fieldLabel = this._getFieldLabel(profile, byteIdx);
      if (fieldLabel) {
        var rx = this.LABEL_W + 8 * this.CELL_W + 6;
        svg += '<text x="' + rx + '" y="' + (y + this.CELL_H / 2 + 4) + '" class="pdu-field-label">' + fieldLabel + '</text>';
      }
    }

    svg += '</svg>';
    container.innerHTML = svg;
  },

  _getFieldLabel: function (profile, byteIdx) {
    if (profile.crcType === 'CRC8' && byteIdx === 0) return 'CRC';
    if (profile.crcType === 'CRC16' && byteIdx <= 1) return 'CRC';
    if (profile.crcType === 'CRC32' && byteIdx <= 3) return 'CRC';

    if (profile.layoutType === 1 && byteIdx === 1) {
      if (profile.dataIdMode === 'partial-explicit' || profile.dataIdMode === 'list') {
        return 'Cntr + ID';
      }
      return 'Counter';
    }
    if (profile.layoutType === 2 && byteIdx === 2) return 'Counter';
    if (profile.layoutType === 2 && byteIdx === 3) return 'Reserved';
    if (profile.layoutType === 3 && byteIdx >= 4 && byteIdx <= 5) return 'Counter';
    if (profile.layoutType === 3 && byteIdx >= 6 && byteIdx <= 7) return 'Reserved';

    if (byteIdx >= profile.overheadBytes) return 'Data[' + (byteIdx - profile.overheadBytes) + ']';
    return '';
  },

  /**
   * Render a compact PDU layout bar (for profile gallery cards).
   * Shows a horizontal bar with colored sections.
   */
  renderCompact: function (container, profile) {
    if (!container || !profile) return;
    var dataLen = 4; // represent 4 data bytes
    var totalBytes = profile.overheadBytes + dataLen;
    var barWidth = 100 / totalBytes;

    var self = this;
    var html = '<div class="pdu-compact-bar">';

    for (var i = 0; i < totalBytes; i++) {
      var fieldType = 'data';
      if (i < profile.overheadBytes) {
        // Determine field type for overhead bytes
        if (profile.crcType === 'CRC8' && i === 0) fieldType = 'crc';
        else if (profile.crcType === 'CRC16' && i <= 1) fieldType = 'crc';
        else if (profile.crcType === 'CRC32' && i <= 3) fieldType = 'crc';
        else if (profile.layoutType === 1 && i === 1) fieldType = 'counter';
        else if (profile.layoutType === 2 && i === 2) fieldType = 'counter';
        else if (profile.layoutType === 2 && i === 3) fieldType = 'reserved';
        else if (profile.layoutType === 3 && i >= 4 && i <= 5) fieldType = 'counter';
        else if (profile.layoutType === 3 && i >= 6 && i <= 7) fieldType = 'reserved';
        else fieldType = 'reserved';
      }
      var color = this.COLORS[fieldType] || this.COLORS.reserved;
      html += '<div class="pdu-compact-cell" style="flex:1;background:' + color.light + ';border-color:' + color.fill + ';color:' + color.fill + '" title="' + color.name + '">' + color.short + '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Render the color legend.
   */
  renderLegend: function (container) {
    if (!container) return;
    var html = '';
    for (var key in this.COLORS) {
      var c = this.COLORS[key];
      html += '<div class="legend-item">';
      html += '<span class="legend-dot" style="background:' + c.fill + '"></span>';
      html += '<span class="legend-label">' + c.name + '</span>';
      html += '</div>';
    }
    container.innerHTML = html;
  },
};

window.PduDesigner = PduDesigner;
