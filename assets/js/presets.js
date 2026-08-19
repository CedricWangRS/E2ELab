/**
 * E2ELab — E2E Configuration Presets
 *
 * Sample E2E-protected PDU configurations for common automotive scenarios.
 */

var Presets = {

  configurations: [
    {
      id: 'brake_sensor',
      name: 'Brake Pressure Sensor (P01)',
      description: 'Single CAN PDU, 6-byte payload, P01 protection with ASIL B',
      profile: 'P01',
      dataId: 0x0001,
      counter: 5,
      dataHex: '10 20 30 40 50 60',
      useCase: 'Brake pressure sensor transmitting 6 bytes of pressure data',
    },
    {
      id: 'steering_angle',
      name: 'Steering Angle Sensor (P11)',
      description: 'Safety-critical CAN-FD PDU, 8-byte payload, P11 CRC16 protection with ASIL D',
      profile: 'P11',
      dataId: 0x00001000,
      counter: 42,
      dataHex: 'AA BB CC DD EE FF 00 11',
      useCase: 'Steering angle sensor with high-integrity CRC16 protection',
    },
    {
      id: 'adas_camera',
      name: 'ADAS Camera Data (P22)',
      description: 'Ethernet/SOME-IP PDU, 16-byte payload, P22 CRC32 protection with ASIL D',
      profile: 'P22',
      dataId: 0x0000ABCD,
      counter: 300,
      dataHex: '01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F 10',
      useCase: 'ADAS camera streaming object detection data over Ethernet',
    },
    {
      id: 'wheel_speed',
      name: 'Wheel Speed Sensor (P02)',
      description: 'Multiplexed 4-wheel PDU, 4-byte payload, P02 with 16 Data IDs',
      profile: 'P02',
      dataId: 0x0010,
      counter: 3,
      dataHex: 'E1 E2 E3 E4',
      useCase: 'Four wheel speed sensors sharing one CAN PDU via multiplexing',
    },
    {
      id: 'body_control',
      name: 'Body Control Module (P06)',
      description: 'Comfort CAN PDU, 3-byte payload, P06 optimized protection',
      profile: 'P06',
      dataId: 0x0042,
      counter: 7,
      dataHex: '77 88 99',
      useCase: 'Body control module (lights, wipers) with legacy P06 protection',
    },
    {
      id: 'battery_mgmt',
      name: 'Battery Management (P07)',
      description: 'BMS CAN PDU, 5-byte payload, P07 enhanced ASIL D protection',
      profile: 'P07',
      dataId: 0x00FE,
      counter: 12,
      dataHex: '64 00 FA 02 58',
      useCase: 'Battery management system with masquerade-resistant P07',
    },
  ],

  /**
   * AUTOSAR E2E parameter reference (R19-11).
   */
  PARAM_REFERENCE: [
    { name: 'E2EProfile', unit: 'enum', default: 'P01', desc: 'Selected E2E protection profile (P01-P22). Determines CRC, counter, and Data ID handling.' },
    { name: 'DataId', unit: 'hex', default: '0x0001', desc: 'Unique identifier for the protected PDU. Used as CRC seed for implicit profiles.' },
    { name: 'MaxDeltaCounter', unit: 'count', default: 2, desc: 'Maximum allowed counter delta between consecutive messages. Values > MaxDelta indicate message loss.' },
    { name: 'DataIdMode', unit: 'enum', default: 'implicit', desc: 'Data ID transmission mode: implicit (not sent), list (counter-selected), or partial-explicit.' },
    { name: 'CrcOffset', unit: 'byte', default: 0, desc: 'Byte offset of the CRC field within the PDU. Typically 0 (first byte).' },
    { name: 'CounterOffset', unit: 'bit', default: 8, desc: 'Bit offset of the alive counter field within the PDU.' },
    { name: 'CrcPoly', unit: 'hex', default: '0x1D', desc: 'CRC polynomial. P01-P07: 0x1D (CRC8), P11: 0x1021 (CRC16-CCITT), P22: 0x04C11DB7 (CRC32).' },
    { name: 'CrcInit', unit: 'hex', default: '0xFF', desc: 'CRC initial value. P01-P07: 0xFF, P11: 0x0000, P22: 0xFFFFFFFF.' },
  ],

  getAll: function () { return this.configurations; },
  getById: function (id) { return this.configurations.find(function (c) { return c.id === id; }); },
  clone: function (id) {
    var config = this.getById(id);
    if (!config) return null;
    return JSON.parse(JSON.stringify(config));
  },
};

window.Presets = Presets;
