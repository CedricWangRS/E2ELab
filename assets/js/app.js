/**
 * E2ELab — Main Application Controller
 *
 * Manages 5 views:
 *   1. Profile Gallery   — Browse and compare E2E profiles
 *   2. PDU Designer      — Visualize bit-level PDU layout
 *   3. CRC Calculator    — Compute CRC8/16/32 with step-by-step detail
 *   4. Counter Simulator — Simulate TX/RX alive counter behavior
 *   5. Verifier           — Verify a complete E2E-protected PDU
 */

var App = {
  config: null,
  currentView: 'profiles',
  activeProfile: 'P01',
  activePreset: null,

  // PDU Designer state
  designerData: '10 20 30 40 50 60',
  designerCounter: 5,
  designerDataId: 1,

  // CRC Calculator state
  crcInput: '01 02 03 04',
  crcProfile: 'P01',

  // Counter Simulator state
  counterTx: 0,
  counterRx: 0,
  counterHistory: [],
  counterMaxDelta: 2,

  // Verifier state
  verifyPduHex: '2A 15 10 20 30 40 50 60',
  verifyProfile: 'P01',
  verifyDataId: 1,
  verifyLastCounter: null,

  VIEWS: [
    { id: 'profiles', icon: '\u{1F4CB}', label: 'Profile Gallery' },
    { id: 'designer', icon: '\u{1F3A8}', label: 'PDU Designer' },
    { id: 'crc',      icon: '\u{1F522}', label: 'CRC Calculator' },
    { id: 'counter',  icon: '\u{23F1}\u{FE0F}', label: 'Counter Sim' },
    { id: 'verify',   icon: '\u{2705}', label: 'Verifier' },
  ],

  init: function () {
    var theme = Store.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    this.config = Presets.clone('brake_sensor');
    this.activePreset = 'brake_sensor';

    this.renderSidebar();
    this.renderTopbar();
    this.renderView();
  },

  // ---- Sidebar ----

  renderSidebar: function () {
    var sidebar = document.getElementById('sidebar');
    var html = '';

    // Header
    html += '<div class="sidebar-header">';
    html += '<span class="sidebar-logo">\u{1F6E1}\u{FE0F}</span>';
    html += '<div>';
    html += '<div class="sidebar-title">E2ELab</div>';
    html += '<div class="sidebar-subtitle">E2E Protection Studio</div>';
    html += '</div>';
    html += '</div>';

    // Presets section
    html += '<div class="sidebar-section">';
    html += '<div class="sidebar-section-title">E2E PRESETS</div>';
    var presets = Presets.getAll();
    for (var i = 0; i < presets.length; i++) {
      var p = presets[i];
      var active = (this.activePreset === p.id) ? ' active' : '';
      html += '<div class="sidebar-item' + active + '" data-preset="' + p.id + '">';
      html += '<div class="sidebar-item-label">' + this.escape(p.name) + '</div>';
      html += '<div class="sidebar-item-sub">' + this.escape(p.profile) + ' \u00B7 ' + this.escape(p.useCase.substring(0, 20)) + '...</div>';
      html += '</div>';
    }
    html += '</div>';

    // Views section
    html += '<div class="sidebar-section">';
    html += '<div class="sidebar-section-title">VIEWS</div>';
    for (var v = 0; v < this.VIEWS.length; v++) {
      var view = this.VIEWS[v];
      var activeV = (this.currentView === view.id) ? ' active' : '';
      html += '<div class="sidebar-item' + activeV + '" data-view="' + view.id + '">';
      html += '<span class="sidebar-item-icon">' + view.icon + '</span>';
      html += '<span class="sidebar-item-label">' + this.escape(view.label) + '</span>';
      html += '</div>';
    }
    html += '</div>';

    // Legend section
    html += '<div class="sidebar-section">';
    html += '<div class="sidebar-section-title">FIELD LEGEND</div>';
    html += '<div id="pdu-legend"></div>';
    html += '</div>';

    sidebar.innerHTML = html;

    // Bind events
    var self = this;
    sidebar.querySelectorAll('[data-preset]').forEach(function (el) {
      el.addEventListener('click', function () {
        self.loadPreset(el.getAttribute('data-preset'));
      });
    });
    sidebar.querySelectorAll('[data-view]').forEach(function (el) {
      el.addEventListener('click', function () {
        self.switchView(el.getAttribute('data-view'));
      });
    });

    // Render legend
    var legendEl = document.getElementById('pdu-legend');
    if (legendEl) PduDesigner.renderLegend(legendEl);
  },

  // ---- Topbar ----

  renderTopbar: function () {
    var topbar = document.getElementById('topbar');
    var theme = Store.getTheme();
    var themeIcon = theme === 'dark' ? '\u{2600}\u{FE0F}' : '\u{1F319}';

    var html = '<div class="topbar-tabs">';
    for (var i = 0; i < this.VIEWS.length; i++) {
      var view = this.VIEWS[i];
      var active = (this.currentView === view.id) ? ' active' : '';
      html += '<div class="view-tab' + active + '" data-view="' + view.id + '">';
      html += '<span class="view-tab-icon">' + view.icon + '</span>';
      html += '<span>' + this.escape(view.label) + '</span>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="topbar-right">';
    html += '<span class="topbar-badge">v1.0</span>';
    html += '<button class="theme-toggle" id="themeToggle">' + themeIcon + '</button>';
    html += '</div>';

    topbar.innerHTML = html;

    var self = this;
    topbar.querySelectorAll('[data-view]').forEach(function (el) {
      el.addEventListener('click', function () {
        self.switchView(el.getAttribute('data-view'));
      });
    });
    document.getElementById('themeToggle').addEventListener('click', function () {
      self.toggleTheme();
    });
  },

  // ---- View router ----

  renderView: function () {
    var main = document.getElementById('main');

    // Welcome banner
    var showWelcome = !Store.get('welcomeDismissed', false);
    var welcomeHtml = '';
    if (showWelcome) {
      welcomeHtml = this.renderWelcomeBanner();
    }

    var contentHtml = '';
    switch (this.currentView) {
      case 'profiles': contentHtml = this.renderProfiles(); break;
      case 'designer': contentHtml = this.renderDesigner(); break;
      case 'crc':      contentHtml = this.renderCrcCalc(); break;
      case 'counter':  contentHtml = this.renderCounterSim(); break;
      case 'verify':   contentHtml = this.renderVerifier(); break;
      default:         contentHtml = this.renderProfiles(); break;
    }

    main.innerHTML = welcomeHtml + contentHtml;

    // Post-render hooks
    if (this.currentView === 'profiles') this.afterRenderProfiles();
    if (this.currentView === 'designer') this.afterRenderDesigner();
    if (this.currentView === 'crc') this.afterRenderCrcCalc();
    if (this.currentView === 'counter') this.afterRenderCounterSim();
    if (this.currentView === 'verify') this.afterRenderVerifier();

    // Bind welcome banner close
    var welcomeClose = document.getElementById('welcomeClose');
    if (welcomeClose) {
      welcomeClose.addEventListener('click', function () {
        Store.set('welcomeDismissed', true);
        App.renderView();
      });
    }
  },

  switchView: function (view) {
    this.currentView = view;
    this.renderSidebar();
    this.renderTopbar();
    this.renderView();
  },

  loadPreset: function (presetId) {
    var preset = Presets.clone(presetId);
    if (!preset) return;
    this.config = preset;
    this.activePreset = presetId;
    this.activeProfile = preset.profile;
    this.designerData = preset.dataHex;
    this.designerCounter = preset.counter;
    this.designerDataId = preset.dataId;
    this.crcProfile = preset.profile;
    this.crcInput = preset.dataHex;
    this.verifyProfile = preset.profile;
    this.verifyDataId = preset.dataId;
    this.toast('Loaded: ' + preset.name);
    this.renderSidebar();
    this.renderView();
  },

  // ---- Welcome Banner ----

  renderWelcomeBanner: function () {
    var html = '<div class="welcome-banner">';
    html += '<button class="welcome-close" id="welcomeClose" title="Close">\u00D7</button>';
    html += '<div class="welcome-content">';
    html += '<div class="welcome-title">\u{1F6E1}\u{FE0F} Welcome to E2ELab</div>';
    html += '<div class="welcome-body">';
    html += '<p>E2ELab is an interactive studio for AUTOSAR E2E (End-to-End) Protection — the safety mechanism defined in ISO 26262 for protecting communication data integrity.</p>';
    html += '<div class="welcome-steps">';
    html += '<div class="welcome-step"><span class="step-num">1</span><span><strong>Profile Gallery</strong> — Compare P01 through P22 E2E profiles</span></div>';
    html += '<div class="welcome-step"><span class="step-num">2</span><span><strong>PDU Designer</strong> — Visualize bit-level PDU layout</span></div>';
    html += '<div class="welcome-step"><span class="step-num">3</span><span><strong>CRC Calculator</strong> — Compute CRC8/16/32 with step-by-step detail</span></div>';
    html += '<div class="welcome-step"><span class="step-num">4</span><span><strong>Counter Simulator</strong> — Test alive counter behavior</span></div>';
    html += '<div class="welcome-step"><span class="step-num">5</span><span><strong>Verifier</strong> — Check CRC, counter, and data integrity</span></div>';
    html += '</div>';
    html += '<p style="font-size:11px;color:var(--text-muted);margin-top:8px">Tip: Click a preset in the sidebar to load a realistic E2E configuration.</p>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
  },

  // ---- View 1: Profile Gallery ----

  renderProfiles: function () {
    var categories = E2EEngine.getCategories();
    var html = '<h2 class="view-title">E2E Profile Gallery</h2>';
    html += '<p class="view-desc">AUTOSAR E2E profiles protect communication against bit flips, message loss, and masquerading. Select a profile to see its PDU layout and parameters.</p>';

    for (var ci = 0; ci < categories.length; ci++) {
      var cat = categories[ci];
      var profiles = E2EEngine.getProfilesByCategory(cat);
      html += '<div class="profile-section">';
      html += '<h3 class="section-heading">' + this.escape(cat) + ' Profiles</h3>';
      html += '<div class="profile-grid">';

      for (var pi = 0; pi < profiles.length; pi++) {
        var p = profiles[pi];
        var active = (this.activeProfile === p.id) ? ' active' : '';
        html += '<div class="profile-card' + active + '" data-profile="' + p.id + '">';
        html += '<div class="profile-card-header">';
        html += '<span class="profile-id">' + p.id + '</span>';
        html += '<span class="profile-name">' + this.escape(p.name) + '</span>';
        html += '</div>';
        html += '<div class="profile-card-body">';
        html += '<div class="profile-mini-layout" id="mini-' + p.id + '"></div>';
        html += '<div class="profile-stats">';
        html += '<div class="profile-stat"><span class="stat-label">CRC</span><span class="stat-value">' + p.crcType + '</span></div>';
        html += '<div class="profile-stat"><span class="stat-label">Counter</span><span class="stat-value">' + p.counterBits + 'b</span></div>';
        html += '<div class="profile-stat"><span class="stat-label">Data ID</span><span class="stat-value">' + p.dataIdBits + 'b</span></div>';
        html += '<div class="profile-stat"><span class="stat-label">Overhead</span><span class="stat-value">' + p.overheadBytes + 'B</span></div>';
        html += '<div class="profile-stat"><span class="stat-label">ASIL</span><span class="stat-value">' + p.asilLevel + '</span></div>';
        html += '</div>';
        html += '<p class="profile-desc">' + this.escape(p.description) + '</p>';
        html += '</div>';
        html += '</div>';
      }

      html += '</div>';
      html += '</div>';
    }

    // Selected profile details
    var sp = E2EEngine.getProfile(this.activeProfile);
    if (sp) {
      html += '<div class="detail-panel">';
      html += '<h3 class="section-heading">' + sp.id + ' \u2014 Detailed Parameters</h3>';
      html += '<div class="detail-grid">';
      html += this.renderDetailRow('CRC Type', sp.crcType);
      html += this.renderDetailRow('CRC Polynomial', '0x' + sp.crcPoly.toString(16).toUpperCase());
      html += this.renderDetailRow('CRC Init', '0x' + sp.crcInit.toString(16).toUpperCase());
      html += this.renderDetailRow('Counter Bits', sp.counterBits + ' (max: ' + sp.counterMax + ')');
      html += this.renderDetailRow('Data ID Bits', sp.dataIdBits);
      html += this.renderDetailRow('Data ID Mode', sp.dataIdMode);
      html += this.renderDetailRow('Overhead Bytes', sp.overheadBytes);
      html += this.renderDetailRow('Max Delta', sp.maxDelta);
      html += this.renderDetailRow('ASIL Level', sp.asilLevel);
      html += '</div>';
      html += '<div class="detail-use-case"><strong>Use Case:</strong> ' + this.escape(sp.useCase) + '</div>';
      html += '</div>';
    }

    return html;
  },

  afterRenderProfiles: function () {
    // Render mini PDU layouts
    var profiles = E2EEngine.getProfileIds();
    for (var i = 0; i < profiles.length; i++) {
      var id = profiles[i];
      var el = document.getElementById('mini-' + id);
      if (el) {
        var profile = E2EEngine.getProfile(id);
        PduDesigner.renderCompact(el, profile);
      }
    }

    // Bind card clicks
    var cards = document.querySelectorAll('.profile-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        App.activeProfile = card.getAttribute('data-profile');
        App.renderView();
      });
    });
  },

  // ---- View 2: PDU Designer ----

  renderDesigner: function () {
    var profile = E2EEngine.getProfile(this.activeProfile);
    var dataBytes = E2EEngine.parseHex(this.designerData) || [];

    var html = '<h2 class="view-title">PDU Designer</h2>';
    html += '<p class="view-desc">Visualize the bit-level layout of an E2E-protected PDU. Enter data bytes and adjust parameters to see the CRC, counter, and data positions.</p>';

    // Controls
    html += '<div class="designer-controls">';
    html += '<div class="form-group">';
    html += '<label>Profile</label>';
    html += '<select id="designerProfile">';
    var ids = E2EEngine.getProfileIds();
    for (var i = 0; i < ids.length; i++) {
      var sel = (ids[i] === this.activeProfile) ? ' selected' : '';
      html += '<option value="' + ids[i] + '"' + sel + '>' + ids[i] + ' (' + E2EEngine.getProfile(ids[i]).name + ')</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>Data (hex bytes)</label>';
    html += '<input type="text" id="designerData" value="' + this.escape(this.designerData) + '" placeholder="10 20 30 40 50 60" />';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>Counter (' + (profile ? '0-' + profile.counterMax : '') + ')</label>';
    html += '<input type="number" id="designerCounter" value="' + this.designerCounter + '" min="0" max="' + (profile ? profile.counterMax : 15) + '" />';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>Data ID (hex)</label>';
    html += '<input type="text" id="designerDataId" value="0x' + this.designerDataId.toString(16).toUpperCase() + '" />';
    html += '</div>';
    html += '</div>';

    // Build PDU
    var dataIdNum = this.parseIntSafe(this.designerDataId);
    var pduBytes = E2EEngine.buildPdu(this.activeProfile, dataBytes, this.designerCounter, dataIdNum);

    // PDU layout visualization
    html += '<div class="card">';
    html += '<div class="card-header"><h3>PDU Bit Layout</h3></div>';
    html += '<div id="pduLayoutContainer" class="card-body"></div>';
    html += '</div>';

    // PDU hex dump
    if (pduBytes) {
      html += '<div class="card">';
      html += '<div class="card-header"><h3>Complete PDU (Hex)</h3>';
      html += '<button class="btn btn-sm" id="copyPduBtn">Copy</button></div>';
      html += '<div class="card-body"><div class="hex-dump" id="pduHexDump"></div></div>';
      html += '</div>';

      // Field breakdown
      html += '<div class="card">';
      html += '<div class="card-header"><h3>Field Breakdown</h3></div>';
      html += '<div class="card-body">';
      html += '<table class="data-table">';
      html += '<tr><th>Field</th><th>Bytes</th><th>Value (hex)</th><th>Description</th></tr>';

      if (profile.crcType === 'CRC8') {
        html += '<tr><td class="field-crc">CRC</td><td>0</td><td>0x' + CRC.hex8(pduBytes[0]) + '</td><td>CRC8 checksum (poly: 0x' + profile.crcPoly.toString(16).toUpperCase() + ')</td></tr>';
      } else if (profile.crcType === 'CRC16') {
        var crc16 = (pduBytes[0] | (pduBytes[1] << 8)) & 0xFFFF;
        html += '<tr><td class="field-crc">CRC</td><td>0-1</td><td>0x' + CRC.hex16(crc16) + '</td><td>CRC16-CCITT checksum</td></tr>';
      } else if (profile.crcType === 'CRC32') {
        var crc32 = (pduBytes[0] | (pduBytes[1] << 8) | (pduBytes[2] << 16) | (pduBytes[3] << 24)) >>> 0;
        html += '<tr><td class="field-crc">CRC</td><td>0-3</td><td>0x' + CRC.hex32(crc32) + '</td><td>CRC32 checksum</td></tr>';
      }

      if (profile.layoutType === 1) {
        html += '<tr><td class="field-counter">Counter</td><td>1 (bits 0-3)</td><td>0x' + (pduBytes[1] & 0x0F).toString(16).toUpperCase() + '</td><td>4-bit alive counter</td></tr>';
        var nibble = (pduBytes[1] >> 4) & 0x0F;
        var nibbleDesc = (profile.dataIdMode === 'partial-explicit' || profile.dataIdMode === 'list') ? 'Data ID nibble' : 'Reserved';
        html += '<tr><td class="field-' + (nibbleDesc === 'Reserved' ? 'reserved' : 'dataid') + '">' + nibbleDesc + '</td><td>1 (bits 4-7)</td><td>0x' + nibble.toString(16).toUpperCase() + '</td><td>High nibble of byte 1</td></tr>';
      } else if (profile.layoutType === 2) {
        html += '<tr><td class="field-counter">Counter</td><td>2</td><td>0x' + CRC.hex8(pduBytes[2]) + '</td><td>8-bit alive counter</td></tr>';
        html += '<tr><td class="field-reserved">Reserved</td><td>3</td><td>0x' + CRC.hex8(pduBytes[3]) + '</td><td>Reserved byte</td></tr>';
      } else if (profile.layoutType === 3) {
        var cnt16 = (pduBytes[4] | (pduBytes[5] << 8)) & 0xFFFF;
        html += '<tr><td class="field-counter">Counter</td><td>4-5</td><td>0x' + CRC.hex16(cnt16) + '</td><td>16-bit alive counter</td></tr>';
        html += '<tr><td class="field-reserved">Reserved</td><td>6-7</td><td>0x' + CRC.hex8(pduBytes[6]) + ' ' + CRC.hex8(pduBytes[7]) + '</td><td>Reserved bytes</td></tr>';
      }

      var dataStart = profile.overheadBytes;
      var dataHex = [];
      for (var d = dataStart; d < pduBytes.length; d++) {
        dataHex.push(CRC.hex8(pduBytes[d]));
      }
      html += '<tr><td class="field-data">Data</td><td>' + dataStart + '+' + dataHex.length + 'B</td><td>' + dataHex.join(' ') + '</td><td>Payload data</td></tr>';
      html += '</table>';
      html += '</div>';
      html += '</div>';
    }

    return html;
  },

  afterRenderDesigner: function () {
    var self = this;
    var profileSel = document.getElementById('designerProfile');
    if (profileSel) {
      profileSel.addEventListener('change', function () {
        self.activeProfile = profileSel.value;
        self.renderView();
      });
    }
    var dataInput = document.getElementById('designerData');
    if (dataInput) {
      dataInput.addEventListener('input', function () {
        self.designerData = dataInput.value;
        var parsed = E2EEngine.parseHex(dataInput.value);
        if (parsed === null) {
          dataInput.classList.add('error');
        } else {
          dataInput.classList.remove('error');
        }
        self.renderView();
      });
    }
    var counterInput = document.getElementById('designerCounter');
    if (counterInput) {
      counterInput.addEventListener('input', function () {
        var val = parseInt(counterInput.value, 10);
        if (!isNaN(val)) {
          self.designerCounter = val;
          self.renderView();
        }
      });
    }
    var dataIdInput = document.getElementById('designerDataId');
    if (dataIdInput) {
      dataIdInput.addEventListener('input', function () {
        var val = self.parseIntSafe(dataIdInput.value);
        if (val !== null) {
          self.designerDataId = val;
          self.renderView();
        }
      });
    }

    // Render PDU layout
    var layoutEl = document.getElementById('pduLayoutContainer');
    if (layoutEl) {
      var profile = E2EEngine.getProfile(this.activeProfile);
      var dataBytes = E2EEngine.parseHex(this.designerData) || [];
      var dataIdNum = this.parseIntSafe(this.designerDataId);
      var pduBytes = E2EEngine.buildPdu(this.activeProfile, dataBytes, this.designerCounter, dataIdNum || 0);
      PduDesigner.render(layoutEl, profile, pduBytes);
    }

    // Render hex dump
    var hexEl = document.getElementById('pduHexDump');
    if (hexEl) {
      var pduB = E2EEngine.buildPdu(this.activeProfile, E2EEngine.parseHex(this.designerData) || [], this.designerCounter, this.parseIntSafe(this.designerDataId) || 0);
      if (pduB) {
        hexEl.innerHTML = this.renderHexDump(pduB);
      }
    }

    // Copy button
    var copyBtn = document.getElementById('copyPduBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var pdu = E2EEngine.buildPdu(self.activeProfile, E2EEngine.parseHex(self.designerData) || [], self.designerCounter, self.parseIntSafe(self.designerDataId) || 0);
        if (pdu) {
          var hexStr = pdu.map(function (b) { return CRC.hex8(b); }).join(' ');
          self.copyToClipboard(hexStr);
          self.toast('PDU copied to clipboard');
        }
      });
    }
  },

  // ---- View 3: CRC Calculator ----

  renderCrcCalc: function () {
    var profile = E2EEngine.getProfile(this.crcProfile);
    var dataBytes = E2EEngine.parseHex(this.crcInput) || [];

    var html = '<h2 class="view-title">CRC Calculator</h2>';
    html += '<p class="view-desc">Compute CRC8, CRC16, or CRC32 with step-by-step detail. Select an E2E profile to auto-configure the CRC parameters, or use custom settings.</p>';

    // Controls
    html += '<div class="designer-controls">';
    html += '<div class="form-group">';
    html += '<label>E2E Profile (auto-configures CRC)</label>';
    html += '<select id="crcProfile">';
    var ids = E2EEngine.getProfileIds();
    for (var i = 0; i < ids.length; i++) {
      var sel = (ids[i] === this.crcProfile) ? ' selected' : '';
      html += '<option value="' + ids[i] + '"' + sel + '>' + ids[i] + ' (' + E2EEngine.getProfile(ids[i]).crcType + ')</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>Input Data (hex bytes)</label>';
    html += '<input type="text" id="crcInput" value="' + this.escape(this.crcInput) + '" placeholder="01 02 03 04" />';
    html += '</div>';
    html += '</div>';

    // CRC parameters
    if (profile) {
      html += '<div class="card">';
      html += '<div class="card-header"><h3>' + profile.crcType + ' Parameters (' + profile.id + ')</h3></div>';
      html += '<div class="card-body">';
      html += '<div class="detail-grid">';
      html += this.renderDetailRow('Polynomial', '0x' + profile.crcPoly.toString(16).toUpperCase());
      html += this.renderDetailRow('Initial Value', '0x' + profile.crcInit.toString(16).toUpperCase());
      if (profile.crcFinalXor) {
        html += this.renderDetailRow('Final XOR', '0x' + (profile.crcFinalXor >>> 0).toString(16).toUpperCase());
      }
      html += this.renderDetailRow('Input Reflection', 'None');
      html += this.renderDetailRow('Output Reflection', 'None');
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    // CRC result
    var result = E2EEngine.computeCrcDetailed(this.crcProfile, dataBytes, 0, 0);
    if (result) {
      var crcVal = result.crc;
      var crcHex;
      if (profile && profile.crcType === 'CRC8') {
        crcHex = '0x' + CRC.hex8(crcVal);
      } else if (profile && profile.crcType === 'CRC16') {
        crcHex = '0x' + CRC.hex16(crcVal);
      } else {
        crcHex = '0x' + CRC.hex32(crcVal);
      }

      html += '<div class="card crc-result-card">';
      html += '<div class="card-header"><h3>CRC Result</h3></div>';
      html += '<div class="card-body">';
      html += '<div class="crc-result-big">' + crcHex + '</div>';
      if (profile && profile.crcType === 'CRC8') {
        html += '<div class="crc-binary">Binary: ' + CRC.bin8(crcVal) + '</div>';
      } else if (profile && profile.crcType === 'CRC16') {
        html += '<div class="crc-binary">Binary: ' + CRC.bin16(crcVal) + '</div>';
      } else {
        html += '<div class="crc-binary">Binary: ' + CRC.bin32(crcVal) + '</div>';
      }
      html += '</div>';
      html += '</div>';

      // Step-by-step computation
      html += '<div class="card">';
      html += '<div class="card-header"><h3>Step-by-Step Computation</h3></div>';
      html += '<div class="card-body">';
      html += '<div class="crc-steps">';

      // CRC input bytes
      var crcInputBytes = E2EEngine._buildCrcInput(profile, dataBytes, 0, 0);
      html += '<div class="crc-step crc-step-init">';
      html += '<span class="step-label">CRC Input Bytes:</span>';
      html += '<span class="step-val">' + (crcInputBytes.length > 0 ? E2EEngine.toHex(crcInputBytes) : '(empty)') + '</span>';
      html += '</div>';

      var steps = result.steps;
      var maxSteps = Math.min(steps.length, 30);
      for (var s = 0; s < maxSteps; s++) {
        var step = steps[s];
        var crcDisplay;
        if (profile && profile.crcType === 'CRC8') {
          crcDisplay = '0x' + CRC.hex8(step.crc);
        } else if (profile && profile.crcType === 'CRC16') {
          crcDisplay = '0x' + CRC.hex16(step.crc);
        } else {
          crcDisplay = '0x' + CRC.hex32(step.crc);
        }
        var stepClass = 'crc-step-' + step.phase;
        html += '<div class="crc-step ' + stepClass + '">';
        html += '<span class="step-label">' + this.escape(step.label) + '</span>';
        html += '<span class="step-val">CRC = ' + crcDisplay + '</span>';
        html += '</div>';
      }
      if (steps.length > maxSteps) {
        html += '<div class="crc-step crc-step-more">... and ' + (steps.length - maxSteps) + ' more steps</div>';
      }

      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    return html;
  },

  afterRenderCrcCalc: function () {
    var self = this;
    var profileSel = document.getElementById('crcProfile');
    if (profileSel) {
      profileSel.addEventListener('change', function () {
        self.crcProfile = profileSel.value;
        self.renderView();
      });
    }
    var input = document.getElementById('crcInput');
    if (input) {
      input.addEventListener('input', function () {
        self.crcInput = input.value;
        var parsed = E2EEngine.parseHex(input.value);
        if (parsed === null) {
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
        self.renderView();
      });
    }
  },

  // ---- View 4: Counter Simulator ----

  renderCounterSim: function () {
    var profile = E2EEngine.getProfile(this.activeProfile);
    var html = '<h2 class="view-title">Counter Simulator</h2>';
    html += '<p class="view-desc">Simulate the E2E alive counter behavior. The counter increments on each TX message and the receiver checks the delta against MaxDelta.</p>';

    // Profile selector
    html += '<div class="designer-controls">';
    html += '<div class="form-group">';
    html += '<label>Profile</label>';
    html += '<select id="counterProfile">';
    var ids = E2EEngine.getProfileIds();
    for (var i = 0; i < ids.length; i++) {
      var sel = (ids[i] === this.activeProfile) ? ' selected' : '';
      html += '<option value="' + ids[i] + '"' + sel + '>' + ids[i] + ' (' + E2EEngine.getProfile(ids[i]).counterBits + 'b counter)</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>Max Delta (allowed message loss)</label>';
    html += '<input type="number" id="counterMaxDelta" value="' + this.counterMaxDelta + '" min="1" max="15" />';
    html += '</div>';
    html += '</div>';

    if (profile) {
      // Counter display
      html += '<div class="counter-display-row">';
      html += '<div class="counter-card counter-tx">';
      html += '<div class="counter-card-header">TX Side</div>';
      html += '<div class="counter-value-big">' + this.counterTx + '</div>';
      html += '<div class="counter-range">Range: 0 \u2013 ' + profile.counterMax + ' (' + profile.counterBits + ' bits)</div>';
      html += '<div class="counter-actions">';
      html += '<button class="btn" id="txSendBtn">Send Message \u2192</button>';
      html += '</div>';
      html += '</div>';

      html += '<div class="counter-card counter-rx">';
      html += '<div class="counter-card-header">RX Side</div>';
      html += '<div class="counter-value-big">' + this.counterRx + '</div>';
      html += '<div class="counter-range">Last received</div>';
      html += '<div class="counter-actions">';
      html += '<button class="btn" id="rxReceiveBtn">Receive</button>';
      html += '<button class="btn btn-warning" id="injectLossBtn">Inject Loss</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

      // Status
      var check = E2EEngine.checkCounterDelta(this.activeProfile, this.counterRx, this.counterTx);
      var statusClass = check.ok ? 'status-ok' : 'status-error';
      var statusIcon = check.ok ? '\u2705' : '\u274C';
      html += '<div class="card counter-status-card">';
      html += '<div class="card-header"><h3>Verification Status</h3></div>';
      html += '<div class="card-body">';
      html += '<div class="counter-status ' + statusClass + '">';
      html += '<span class="status-icon">' + statusIcon + '</span>';
      html += '<div>';
      html += '<div class="status-main">' + this.escape(check.reason) + '</div>';
      html += '<div class="status-detail">TX: ' + this.counterTx + ' \u2192 RX: ' + this.counterRx + ' (delta: ' + check.delta + ', max: ' + this.counterMaxDelta + ')</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

      // History
      html += '<div class="card">';
      html += '<div class="card-header"><h3>Message History</h3>';
      html += '<button class="btn btn-sm" id="resetHistoryBtn">Reset</button></div>';
      html += '<div class="card-body">';

      if (this.counterHistory.length === 0) {
        html += '<div class="empty-state">No messages sent yet. Click "Send Message" to start.</div>';
      } else {
        html += '<table class="data-table">';
        html += '<tr><th>#</th><th>TX Counter</th><th>RX Counter</th><th>Delta</th><th>Status</th></tr>';
        for (var h = 0; h < this.counterHistory.length; h++) {
          var entry = this.counterHistory[h];
          var entryCheck = E2EEngine.checkCounterDelta(this.activeProfile, entry.rx, entry.tx);
          var entryStatus = entryCheck.ok ? '\u2705 OK' : '\u274C ' + entryCheck.reason;
          html += '<tr>';
          html += '<td>' + (h + 1) + '</td>';
          html += '<td>' + entry.tx + '</td>';
          html += '<td>' + (entry.received ? entry.rx : '\u2014') + '</td>';
          html += '<td>' + (entry.received ? entryCheck.delta : '\u2014') + '</td>';
          html += '<td>' + entryStatus + '</td>';
          html += '</tr>';
        }
        html += '</table>';
      }
      html += '</div>';
      html += '</div>';
    }

    return html;
  },

  afterRenderCounterSim: function () {
    var self = this;
    var profileSel = document.getElementById('counterProfile');
    if (profileSel) {
      profileSel.addEventListener('change', function () {
        self.activeProfile = profileSel.value;
        var p = E2EEngine.getProfile(self.activeProfile);
        self.counterTx = self.counterTx % (p.counterMax + 1);
        self.counterRx = self.counterRx % (p.counterMax + 1);
        self.renderView();
      });
    }
    var maxDeltaInput = document.getElementById('counterMaxDelta');
    if (maxDeltaInput) {
      maxDeltaInput.addEventListener('change', function () {
        var val = parseInt(maxDeltaInput.value, 10);
        if (!isNaN(val) && val >= 1) {
          self.counterMaxDelta = val;
          self.renderView();
        }
      });
    }
    var txBtn = document.getElementById('txSendBtn');
    if (txBtn) {
      txBtn.addEventListener('click', function () {
        var p = E2EEngine.getProfile(self.activeProfile);
        self.counterTx = E2EEngine.nextCounter(self.activeProfile, self.counterTx);
        self.counterHistory.push({ tx: self.counterTx, rx: self.counterTx, received: true });
        if (self.counterHistory.length > 20) self.counterHistory.shift();
        self.renderView();
      });
    }
    var rxBtn = document.getElementById('rxReceiveBtn');
    if (rxBtn) {
      rxBtn.addEventListener('click', function () {
        self.counterRx = self.counterTx;
        self.renderView();
      });
    }
    var lossBtn = document.getElementById('injectLossBtn');
    if (lossBtn) {
      lossBtn.addEventListener('click', function () {
        var p = E2EEngine.getProfile(self.activeProfile);
        // Skip one TX message (simulate loss)
        self.counterTx = E2EEngine.nextCounter(self.activeProfile, self.counterTx);
        self.counterRx = self.counterTx;
        // But mark the previous as lost
        if (self.counterHistory.length > 0) {
          self.counterHistory[self.counterHistory.length - 1].received = false;
        }
        self.counterHistory.push({ tx: self.counterTx, rx: self.counterTx, received: true });
        if (self.counterHistory.length > 20) self.counterHistory.shift();
        self.renderView();
      });
    }
    var resetBtn = document.getElementById('resetHistoryBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        self.counterTx = 0;
        self.counterRx = 0;
        self.counterHistory = [];
        self.renderView();
      });
    }
  },

  // ---- View 5: Verifier ----

  renderVerifier: function () {
    var html = '<h2 class="view-title">E2E PDU Verifier</h2>';
    html += '<p class="view-desc">Paste a raw E2E-protected PDU (hex bytes) and verify its CRC, counter, and data integrity. The verifier parses the PDU according to the selected profile.</p>';

    // Controls
    html += '<div class="designer-controls">';
    html += '<div class="form-group">';
    html += '<label>Profile</label>';
    html += '<select id="verifyProfile">';
    var ids = E2EEngine.getProfileIds();
    for (var i = 0; i < ids.length; i++) {
      var sel = (ids[i] === this.verifyProfile) ? ' selected' : '';
      html += '<option value="' + ids[i] + '"' + sel + '>' + ids[i] + ' (' + E2EEngine.getProfile(ids[i]).name + ')</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group form-group-wide">';
    html += '<label>PDU Hex Bytes</label>';
    html += '<input type="text" id="verifyPduHex" value="' + this.escape(this.verifyPduHex) + '" placeholder="2A 15 10 20 30 40 50 60" />';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>Expected Data ID (hex)</label>';
    html += '<input type="text" id="verifyDataId" value="0x' + this.verifyDataId.toString(16).toUpperCase() + '" />';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>Last RX Counter (optional)</label>';
    html += '<input type="number" id="verifyLastCounter" value="" placeholder="e.g. 4" />';
    html += '</div>';
    html += '</div>';

    // Verify
    var pduBytes = E2EEngine.parseHex(this.verifyPduHex);
    var dataIdNum = this.parseIntSafe(this.verifyDataId) || 0;
    var lastRx = null;
    if (this.verifyLastCounter !== null && this.verifyLastCounter !== '') {
      var parsed = parseInt(this.verifyLastCounter, 10);
      if (!isNaN(parsed)) lastRx = parsed;
    }

    if (!pduBytes) {
      html += '<div class="card"><div class="card-body"><div class="empty-state error">Invalid hex input. Please enter space-separated hex bytes (e.g., 2A 15 10 20).</div></div></div>';
      return html;
    }

    var result = E2EEngine.verifyPdu(this.verifyProfile, pduBytes, dataIdNum, lastRx);

    if (result.error) {
      html += '<div class="card"><div class="card-body"><div class="empty-state error">' + this.escape(result.error) + '</div></div></div>';
      return html;
    }

    // Verification results
    html += '<div class="verify-results">';

    // CRC check
    var crcPassClass = result.crcOk ? 'verify-pass' : 'verify-fail';
    var crcPassIcon = result.crcOk ? '\u2705' : '\u274C';
    var crcReceivedHex, crcComputedHex;
    if (result.profile.crcType === 'CRC8') {
      crcReceivedHex = '0x' + CRC.hex8(result.receivedCrc);
      crcComputedHex = '0x' + CRC.hex8(result.computedCrc);
    } else if (result.profile.crcType === 'CRC16') {
      crcReceivedHex = '0x' + CRC.hex16(result.receivedCrc);
      crcComputedHex = '0x' + CRC.hex16(result.computedCrc);
    } else {
      crcReceivedHex = '0x' + CRC.hex32(result.receivedCrc);
      crcComputedHex = '0x' + CRC.hex32(result.computedCrc);
    }

    html += '<div class="verify-card ' + crcPassClass + '">';
    html += '<div class="verify-card-header"><span class="verify-icon">' + crcPassIcon + '</span><span>CRC Check</span></div>';
    html += '<div class="verify-card-body">';
    html += '<div class="verify-row"><span>Received CRC:</span><span class="mono">' + crcReceivedHex + '</span></div>';
    html += '<div class="verify-row"><span>Computed CRC:</span><span class="mono">' + crcComputedHex + '</span></div>';
    html += '<div class="verify-row"><span>Result:</span><span>' + (result.crcOk ? 'MATCH' : 'MISMATCH') + '</span></div>';
    html += '</div>';
    html += '</div>';

    // Counter check
    var counterPassClass = result.counterOk ? 'verify-pass' : 'verify-fail';
    var counterPassIcon = result.counterOk ? '\u2705' : '\u274C';
    html += '<div class="verify-card ' + counterPassClass + '">';
    html += '<div class="verify-card-header"><span class="verify-icon">' + counterPassIcon + '</span><span>Counter Check</span></div>';
    html += '<div class="verify-card-body">';
    html += '<div class="verify-row"><span>Counter Value:</span><span class="mono">' + result.counter + '</span></div>';
    if (lastRx !== null && lastRx !== undefined) {
      html += '<div class="verify-row"><span>Last RX Counter:</span><span class="mono">' + lastRx + '</span></div>';
      html += '<div class="verify-row"><span>Delta:</span><span class="mono">' + result.delta + ' (max: ' + result.profile.maxDelta + ')</span></div>';
    } else {
      html += '<div class="verify-row"><span>Delta:</span><span class="mono">N/A (no previous counter)</span></div>';
    }
    html += '<div class="verify-row"><span>Result:</span><span>' + (result.counterOk ? 'OK' : 'FAILED') + '</span></div>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // verify-results

    // Decoded fields
    html += '<div class="card">';
    html += '<div class="card-header"><h3>Decoded PDU Fields</h3></div>';
    html += '<div class="card-body">';
    html += '<table class="data-table">';
    html += '<tr><th>Field</th><th>Bytes</th><th>Value</th></tr>';

    if (result.profile.crcType === 'CRC8') {
      html += '<tr><td class="field-crc">CRC</td><td>0</td><td>0x' + CRC.hex8(result.receivedCrc) + '</td></tr>';
    } else if (result.profile.crcType === 'CRC16') {
      html += '<tr><td class="field-crc">CRC</td><td>0-1</td><td>0x' + CRC.hex16(result.receivedCrc) + '</td></tr>';
    } else {
      html += '<tr><td class="field-crc">CRC</td><td>0-3</td><td>0x' + CRC.hex32(result.receivedCrc) + '</td></tr>';
    }

    if (result.profile.layoutType === 1) {
      html += '<tr><td class="field-counter">Counter</td><td>1 (bits 0-3)</td><td>' + result.counter + '</td></tr>';
      html += '<tr><td class="field-reserved">Reserved/ID nibble</td><td>1 (bits 4-7)</td><td>0x' + result.dataIdNibble.toString(16).toUpperCase() + '</td></tr>';
    } else if (result.profile.layoutType === 2) {
      html += '<tr><td class="field-counter">Counter</td><td>2</td><td>' + result.counter + '</td></tr>';
      html += '<tr><td class="field-reserved">Reserved</td><td>3</td><td>0x' + CRC.hex8(pduBytes[3]) + '</td></tr>';
    } else if (result.profile.layoutType === 3) {
      html += '<tr><td class="field-counter">Counter</td><td>4-5</td><td>' + result.counter + '</td></tr>';
      html += '<tr><td class="field-reserved">Reserved</td><td>6-7</td><td>0x' + CRC.hex8(pduBytes[6]) + ' ' + CRC.hex8(pduBytes[7]) + '</td></tr>';
    }

    var dataHexArr = result.data.map(function (b) { return CRC.hex8(b); });
    html += '<tr><td class="field-data">Data</td><td>' + result.profile.overheadBytes + '+' + result.data.length + 'B</td><td class="mono">' + dataHexArr.join(' ') + '</td></tr>';
    html += '</table>';
    html += '</div>';
    html += '</div>';

    return html;
  },

  afterRenderVerifier: function () {
    var self = this;
    var profileSel = document.getElementById('verifyProfile');
    if (profileSel) {
      profileSel.addEventListener('change', function () {
        self.verifyProfile = profileSel.value;
        self.renderView();
      });
    }
    var hexInput = document.getElementById('verifyPduHex');
    if (hexInput) {
      hexInput.addEventListener('input', function () {
        self.verifyPduHex = hexInput.value;
        var parsed = E2EEngine.parseHex(hexInput.value);
        if (parsed === null) {
          hexInput.classList.add('error');
        } else {
          hexInput.classList.remove('error');
        }
        self.renderView();
      });
    }
    var dataIdInput = document.getElementById('verifyDataId');
    if (dataIdInput) {
      dataIdInput.addEventListener('input', function () {
        var val = self.parseIntSafe(dataIdInput.value);
        if (val !== null) {
          self.verifyDataId = val;
          self.renderView();
        }
      });
    }
    var lastCounterInput = document.getElementById('verifyLastCounter');
    if (lastCounterInput) {
      lastCounterInput.addEventListener('input', function () {
        self.verifyLastCounter = lastCounterInput.value;
        self.renderView();
      });
    }
  },

  // ---- Helpers ----

  renderDetailRow: function (label, value) {
    return '<div class="detail-row"><span class="detail-label">' + this.escape(label) + '</span><span class="detail-value">' + this.escape(String(value)) + '</span></div>';
  },

  renderHexDump: function (bytes) {
    var html = '<div class="hex-dump-grid">';
    for (var i = 0; i < bytes.length; i++) {
      if (i > 0 && i % 8 === 0) html += '<br>';
      html += '<span class="hex-byte">' + CRC.hex8(bytes[i]) + '</span>';
    }
    html += '</div>';
    return html;
  },

  parseIntSafe: function (str) {
    if (typeof str === 'number') return str;
    if (!str) return null;
    var cleaned = String(str).replace(/0x/gi, '').trim();
    var val = parseInt(cleaned, 16);
    return isNaN(val) ? null : val;
  },

  toggleTheme: function () {
    var current = Store.getTheme();
    var newTheme = current === 'dark' ? 'light' : 'dark';
    Store.setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '\u{2600}\u{FE0F}' : '\u{1F319}';
    this.renderView();
  },

  toast: function (msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<span>\u2705 ' + this.escape(msg) + '</span>';
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = '300ms';
      setTimeout(function () { t.remove(); }, 300);
    }, 2500);
  },

  copyToClipboard: function (text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
  },

  escape: function (s) {
    var d = document.createElement('div');
    d.textContent = String(s != null ? s : '');
    return d.innerHTML;
  },
};

window.App = App;
