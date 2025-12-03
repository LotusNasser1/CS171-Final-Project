// ============================================
// MOBILITY EXPLORER - Integrated Tab View
// Final Version with All UI/UX Improvements
// ============================================

const MobilityExplorer = {
  selectedState: "Massachusetts",
  compareState: "California",
  currentTab: "overview",
  selectedRace: "white", // "white", "black", "hispanic", or "asian"
  ruralToggle: "rural", // "rural" or "urban"
  atlasData: null,
  stateData: null,
  nationalData: null,
  initialized: false,

  STATE_NAMES: {
    '1':'Alabama','2':'Alaska','4':'Arizona','5':'Arkansas','6':'California',
    '8':'Colorado','9':'Connecticut','10':'Delaware','11':'District of Columbia',
    '12':'Florida','13':'Georgia','15':'Hawaii','16':'Idaho','17':'Illinois',
    '18':'Indiana','19':'Iowa','20':'Kansas','21':'Kentucky','22':'Louisiana',
    '23':'Maine','24':'Maryland','25':'Massachusetts','26':'Michigan','27':'Minnesota',
    '28':'Mississippi','29':'Missouri','30':'Montana','31':'Nebraska','32':'Nevada',
    '33':'New Hampshire','34':'New Jersey','35':'New Mexico','36':'New York',
    '37':'North Carolina','38':'North Dakota','39':'Ohio','40':'Oklahoma','41':'Oregon',
    '42':'Pennsylvania','44':'Rhode Island','45':'South Carolina','46':'South Dakota',
    '47':'Tennessee','48':'Texas','49':'Utah','50':'Vermont','51':'Virginia',
    '53':'Washington','54':'West Virginia','55':'Wisconsin','56':'Wyoming'
  },

  // Beginner-friendly tooltips
  TOOLTIPS: {
    percentile: "Percentiles rank how this place compares to others nationally. 100 = best in U.S., 1 = lowest. 46th percentile means it's better than 46% of other states.",
    mobility: "This is a measure of upward economic mobility — how far kids from low-income families tend to rise in adulthood. Higher numbers = better outcomes.",
    singleParent: "This is the % of families with children led by one parent. Higher numbers can mean more economic challenges for families.",
    collegeRate: "The % of adults (age 25+) who have earned a bachelor's degree or higher. Higher = more educated population.",
    medianIncome: "The middle household income — half of households earn more, half earn less. Higher = wealthier area on average.",
    povertyRate: "The % of people living below the federal poverty line. Lower numbers are better.",
    ruralUrban: "These are Opportunity Atlas mobility scores. Higher scores mean better upward income mobility for children raised in that environment.",
    gap: "The difference in mobility outcomes between two groups. A +11.2 point gap means one group's mobility score is 11.2 points higher than the other.",
    mathScore: "Average 3rd grade math test scores. Score of 3.0 = performing at grade level. Higher = students are ahead academically.",
    aboveNational: "This value is higher than the national average — generally a positive sign.",
    belowNational: "This value is lower than the national average."
  },

  TABS: [
    { id: 'overview', label: 'Overview', icon: '■', question: 'How does your state compare to the national average?' },
    { id: 'race', label: 'Race', icon: '●', question: 'How do mobility outcomes differ by race?' },
    { id: 'family', label: 'Family', icon: '▲', question: 'Does family structure affect economic mobility?' },
    { id: 'education', label: 'Education', icon: '◆', question: 'How does education impact opportunities?' },
    { id: 'explore', label: 'Compare', icon: '⬌', question: 'Compare states and discover key insights' }
  ],

  // Tooltip helper function
  tip(key) {
    const text = this.TOOLTIPS[key] || '';
    return `<span class="info-tip" data-tooltip="${text}">ⓘ</span>`;
  },

  // Arrow helper for above/below national average
  arrow(stateVal, nationalVal, lowerBetter = false) {
    if (stateVal == null || nationalVal == null) return '';
    const isAbove = lowerBetter ? stateVal < nationalVal : stateVal > nationalVal;
    if (isAbove) {
      return `<span class="arrow-indicator up" data-tooltip="${this.TOOLTIPS.aboveNational}">↑</span>`;
    } else {
      return `<span class="arrow-indicator down" data-tooltip="${this.TOOLTIPS.belowNational}">↓</span>`;
    }
  },

  init() {
    if (this.initialized) {
      this.renderTab();
      return;
    }
    
    const container = document.getElementById("explorerContainer");
    if (!container) return;
    
    container.innerHTML = this.getHTML();
    this.bindEvents();
    this.loadData();
  },

  loadData() {
    if (window.CoordinatedDashboard?.atlasData?.length > 0) {
      this.atlasData = CoordinatedDashboard.atlasData;
      this.processStateData();
    } else {
      this.loadDataDirectly();
    }
  },

  async loadDataDirectly() {
    try {
      const res = await fetch("data/atlas.csv");
      this.atlasData = Papa.parse(await res.text(), { header: true }).data.filter(r => r.tract_name?.trim());
      this.processStateData();
    } catch (e) { console.error("Data load failed:", e); }
  },

  processStateData() {
    const groups = d3.group(this.atlasData, d => d.state);
    this.stateData = {};
    
    // Calculate national averages
    const allValid = this.atlasData.filter(t => t.kfr_pooled_pooled_p25 && !isNaN(parseFloat(t.kfr_pooled_pooled_p25)));
    const natMean = (f) => {
      const v = allValid.map(t => parseFloat(t[f])).filter(x => !isNaN(x) && x > 0);
      return v.length > 100 ? d3.mean(v) : null;
    };
    
    this.nationalData = {
      mobility: natMean('kfr_pooled_pooled_p25'),
      mobility_white: natMean('kfr_white_pooled_p25'),
      mobility_black: natMean('kfr_black_pooled_p25'),
      mobility_hispanic: natMean('kfr_hisp_pooled_p25'),
      mobility_asian: natMean('kfr_asian_pooled_p25'),
      singleparent: natMean('singleparent_share2010'),
      poverty: natMean('poor_share2010'),
      income: natMean('med_hhinc2016'),
      college: natMean('frac_coll_plus2010')
    };
    
    groups.forEach((tracts, fips) => {
      const name = this.STATE_NAMES[String(fips)];
      if (!name) return;
      const valid = tracts.filter(t => t.kfr_pooled_pooled_p25 && !isNaN(parseFloat(t.kfr_pooled_pooled_p25)));
      if (valid.length < 50) return;
      
      const mean = (f, m = 10) => {
        const v = valid.map(t => parseFloat(t[f])).filter(x => !isNaN(x) && x > 0);
        return v.length >= m ? d3.mean(v) : null;
      };
      
      this.stateData[fips] = {
        fips, name, count: valid.length,
        mobility: mean('kfr_pooled_pooled_p25', 50),
        mobility_white: mean('kfr_white_pooled_p25'),
        mobility_black: mean('kfr_black_pooled_p25'),
        mobility_hispanic: mean('kfr_hisp_pooled_p25'),
        mobility_asian: mean('kfr_asian_pooled_p25'),
        singleparent: mean('singleparent_share2010'),
        poverty: mean('poor_share2010'),
        income: mean('med_hhinc2016'),
        math: mean('gsmn_math_g3_2013'),
        college: mean('frac_coll_plus2010'),
        density: mean('popdensity2000')
      };
    });
    
    this.initialized = true;
    this.populateDropdowns();
    this.renderTab();
  },

  populateDropdowns() {
    const opts = Object.values(this.stateData).map(s => s.name).sort().map(s => `<option value="${s}">${s}</option>`).join('');
    // Main state selector
    const mainSel = document.getElementById('mainStateSelector');
    if (mainSel) { mainSel.innerHTML = opts; mainSel.value = this.selectedState; }
    // Compare tab dropdowns
    const s1 = document.getElementById('exploreState1');
    const s2 = document.getElementById('exploreState2');
    if (s1) { s1.innerHTML = opts; s1.value = this.selectedState; }
    if (s2) { s2.innerHTML = opts; s2.value = this.compareState; }
  },

  selectState(name) {
    this.selectedState = name;
    const mainSel = document.getElementById('mainStateSelector');
    if (mainSel) mainSel.value = name;
    this.renderTab();
  },

  selectRace(race) {
    this.selectedRace = race;
    this.renderTab();
  },

  switchTab(id) {
    this.currentTab = id;
    document.querySelectorAll('.explorer-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    this.renderTab();
  },

  renderTab() {
    const el = document.getElementById("explorerContent");
    if (!el || !this.stateData) return;
    const tab = this.TABS.find(t => t.id === this.currentTab);
    el.innerHTML = `<div class="explorer-question">${tab.icon} ${tab.question}</div>` + this['render_' + this.currentTab]();
    this.bindCompareDropdowns();
    setTimeout(() => this.drawScatters(), 100);
  },

  bindCompareDropdowns() {
    const s1 = document.getElementById('exploreState1');
    const s2 = document.getElementById('exploreState2');
    if (s1) {
      s1.value = this.selectedState;
      s1.onchange = (e) => { this.selectedState = e.target.value; this.renderTab(); };
    }
    if (s2) {
      s2.value = this.compareState;
      s2.onchange = (e) => { this.compareState = e.target.value; this.renderTab(); };
    }
  },

  getState(n) { return Object.values(this.stateData).find(s => s.name === n); },
  getTracts(n) { const s = this.getState(n); return s ? this.atlasData.filter(t => String(t.state) === s.fips) : []; },
  getRank(f, desc = true) {
    const arr = Object.values(this.stateData).filter(s => s[f] != null).map(s => ({ n: s.name, v: s[f] })).sort((a, b) => desc ? b.v - a.v : a.v - b.v);
    const i = arr.findIndex(s => s.n === this.selectedState);
    return { rank: i >= 0 ? i + 1 : null, total: arr.length, arr };
  },

  toggleInfoPopup() {
    const modal = document.getElementById('info-popup-modal');
    if (modal) {
      if (modal.style.display === 'none') {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
      } else {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
      }
    }
  },

  bindEvents() {
    const mainSel = document.getElementById('mainStateSelector');
    if (mainSel) {
      mainSel.addEventListener('change', e => this.selectState(e.target.value));
    }
    document.querySelectorAll('.explorer-tab').forEach(b => b.addEventListener('click', () => this.switchTab(b.dataset.tab)));
  },

  // National Race Breakdown Component - REDESIGNED with smaller cards
  nationalRaceBreakdown() {
    const n = this.nationalData;
    return `
      <div class="national-race-cards">
        <div class="nat-race-card" style="border-top: 4px solid #7B6BA8">
          <div class="nat-race-value">${n.mobility_white?.toFixed(0) || '—'}</div>
          <div class="nat-race-label">percentile mobility</div>
          <div class="nat-race-name">White</div>
        </div>
        <div class="nat-race-card" style="border-top: 4px solid #D68050">
          <div class="nat-race-value">${n.mobility_black?.toFixed(0) || '—'}</div>
          <div class="nat-race-label">percentile mobility</div>
          <div class="nat-race-name">Black</div>
        </div>
        <div class="nat-race-card" style="border-top: 4px solid #4AA890">
          <div class="nat-race-value">${n.mobility_hispanic?.toFixed(0) || '—'}</div>
          <div class="nat-race-label">percentile mobility</div>
          <div class="nat-race-name">Hispanic</div>
        </div>
        <div class="nat-race-card" style="border-top: 4px solid #D64B7B">
          <div class="nat-race-value">${n.mobility_asian?.toFixed(0) || '—'}</div>
          <div class="nat-race-label">percentile mobility</div>
          <div class="nat-race-name">Asian</div>
        </div>
      </div>
    `;
  },

  // ===== OVERVIEW TAB =====
  render_overview() {
    const st = this.getState(this.selectedState);
    if (!st) return '<div class="explorer-empty">Select a state to begin</div>';
    const r = this.getRank('mobility');
    const n = this.nationalData;
    
    return `
      <div class="explorer-grid two-col">
        <div class="explorer-card hero-card">
          <div class="state-badge">${this.selectedState}</div>
          <div class="hero-score">
            <span class="score-number">${st.mobility?.toFixed(0) || '—'}</span>
            <div class="score-details">
              <span class="score-unit">Percentile ${this.tip('percentile')}</span>
              <span class="score-label">Economic Mobility ${this.tip('mobility')}</span>
            </div>
          </div>
          <div class="rank-info">Ranked <strong>#${r.rank}</strong> of ${r.total} states</div>
          <p class="explain-text">Children from low-income families in ${this.selectedState} reach the <strong>${st.mobility?.toFixed(0)}th percentile</strong> of national income as adults on average.</p>
        </div>
        
        <div class="explorer-card">
          <h3 class="card-title">Key Opportunity Factors</h3>
          <div class="factors-grid-small">
            ${this.factorCard('MEDIAN INCOME', st.income ? '$' + Math.round(st.income).toLocaleString() : '—', st.income > 58900 ? 'Above average' : 'Below average', 'medianIncome')}
            ${this.factorCard('COLLEGE RATE', st.college ? (st.college * 100).toFixed(0) + '%' : '—', st.college > 0.27 ? 'High education' : 'Lower education', 'collegeRate')}
            ${this.factorCard('SINGLE PARENTS', st.singleparent ? (st.singleparent * 100).toFixed(0) + '%' : '—', st.singleparent < 0.33 ? 'More two-parent' : 'More single-parent', 'singleParent')}
            ${this.factorCard('POVERTY RATE', st.poverty ? (st.poverty * 100).toFixed(0) + '%' : '—', st.poverty < 0.15 ? 'Low poverty' : 'Higher poverty', 'povertyRate')}
          </div>
        </div>
      </div>
      
      <div class="explorer-card">
        <h3 class="card-title">■ ${this.selectedState} vs. National Average</h3>
        <div class="race-bars-container">
          ${this.metricBar('Mobility', st.mobility, n.mobility, 'percentile', '#7B6BA8', false)}
          ${this.metricBar('Income', st.income, n.income, 'currency', '#4AA890', false)}
          ${this.metricBar('College Rate', st.college ? st.college * 100 : null, n.college ? n.college * 100 : null, 'percent', '#D68050', false)}
          ${this.metricBar('Single-Parent', st.singleparent ? st.singleparent * 100 : null, n.singleparent ? n.singleparent * 100 : null, 'percent', '#D64B7B', true)}
        </div>
      </div>
      
      <div class="explorer-card rankings-card-wrapper">
        <div class="clickable-overlay">
          <div class="clickable-badge">» STATES ARE CLICKABLE<br><span>Click to explore state data</span></div>
        </div>
        <h3 class="card-title">★ State Rankings (Overall Mobility)</h3>
        <div class="rankings-container">
          <div class="rank-column">
            <div class="rank-header good">TOP 5 STATES</div>
            ${r.arr.slice(0, 5).map((s, i) => `
              <div class="rank-item ${s.n === this.selectedState ? 'highlight' : ''}" onclick="MobilityExplorer.selectState('${s.n}')">
                <span class="rank-pos">#${i + 1}</span>
                <span class="rank-name">${s.n}</span>
                <span class="rank-value">${s.v.toFixed(0)}th percentile</span>
              </div>
            `).join('')}
          </div>
          <div class="rank-column">
            <div class="rank-header bad">BOTTOM 5 STATES</div>
            ${r.arr.slice(-5).reverse().map((s, i) => `
              <div class="rank-item ${s.n === this.selectedState ? 'highlight' : ''}" onclick="MobilityExplorer.selectState('${s.n}')">
                <span class="rank-pos">#${r.total - 4 + i}</span>
                <span class="rank-name">${s.n}</span>
                <span class="rank-value">${s.v.toFixed(0)}th percentile</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  factorCard(label, value, desc, tipKey) {
    return `<div class="factor-item"><div class="factor-label">${label} ${tipKey ? this.tip(tipKey) : ''}</div><div class="factor-value">${value}</div><div class="factor-desc">${desc}</div></div>`;
  },

  raceBar(label, stateVal, nationalVal, color) {
    if (stateVal == null && nationalVal == null) {
      return `<div class="race-bar-group"><span class="race-label">${label}</span><span class="no-data-text">Insufficient data</span></div>`;
    }
    
    // Randomly add pixel character to some bars (approx 50% chance)
    const hasCharacter = Math.random() > 0.5;
    const characterPosition = stateVal != null ? Math.min(stateVal, 95) : Math.min(nationalVal, 95);
    
    return `
      <div class="race-bar-group" style="position: relative;">
        ${hasCharacter ? `
          <div class="race-bar-pixel-character" style="position: absolute; left: ${characterPosition + 10}%; top: 50%; transform: translateY(-50%); z-index: 0; opacity: 0.4; pointer-events: none;">
            <img src="./asset/pixel_character.png" style="width: 40px; height: 40px; image-rendering: pixelated;" />
          </div>
        ` : ''}
        <span class="race-label">${label}</span>
        <div class="race-bars-stack" style="position: relative; z-index: 1;">
          ${stateVal != null ? `
            <div class="race-bar-row state-bar">
              <div class="race-bar-track">
                <div class="race-bar-fill" style="width:${stateVal}%;background:${color}">
                  <span class="race-bar-value">${Math.round(stateVal)}th percentile</span>
                </div>
              </div>
            </div>
          ` : ''}
          ${nationalVal != null ? `
            <div class="race-bar-row national-bar">
              <div class="race-bar-track">
                <div class="race-bar-fill national-fill" style="width:${nationalVal}%">
                  <span class="race-bar-value national-value">National: ${Math.round(nationalVal)}th percentile</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  metricBar(label, stateVal, nationalVal, type, color, lowerIsBetter = false) {
    // Handle null values
    if (stateVal == null && nationalVal == null) {
      return `<div class="race-bar-group"><span class="race-label">${label}</span><span class="no-data-text">Insufficient data</span></div>`;
    }
    
    // Format values based on type
    const formatValue = (val, type) => {
      if (val == null) return '—';
      switch(type) {
        case 'percentile':
          return `${Math.round(val)}th percentile`;
        case 'currency':
          return `$${Math.round(val / 1000)}K`;
        case 'percent':
          return `${Math.round(val)}%`;
        default:
          return Math.round(val);
      }
    };
    
    // Calculate bar widths (normalize to 0-100 scale)
    const getBarWidth = (val, type) => {
      if (val == null) return 0;
      switch(type) {
        case 'percentile':
          return val; // Already 0-100
        case 'currency':
          return Math.min((val / 150000) * 100, 100); // Scale to $150K max
        case 'percent':
          return Math.min(val, 100); // Already 0-100
        default:
          return Math.min(val, 100);
      }
    };
    
    const stateWidth = getBarWidth(stateVal, type);
    const nationalWidth = getBarWidth(nationalVal, type);
    const stateFormatted = formatValue(stateVal, type);
    const nationalFormatted = formatValue(nationalVal, type);
    
    return `
      <div class="race-bar-group">
        <span class="race-label">${label}</span>
        <div class="race-bars-stack">
          ${stateVal != null ? `
            <div class="race-bar-row state-bar">
              <div class="race-bar-track">
                <div class="race-bar-fill" style="width:${stateWidth}%;background:${color}">
                  <span class="race-bar-value">${stateFormatted}</span>
                </div>
              </div>
            </div>
          ` : ''}
          ${nationalVal != null ? `
            <div class="race-bar-row national-bar">
              <div class="race-bar-track">
                <div class="race-bar-fill national-fill" style="width:${nationalWidth}%">
                  <span class="race-bar-value national-value">National: ${nationalFormatted}</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // ===== RACE TAB =====
  render_race() {
    const st = this.getState(this.selectedState);
    if (!st) return '<div class="explorer-empty">Select a state</div>';
    const n = this.nationalData;
    
    const races = [
      { key: 'white', label: 'White', val: st.mobility_white, color: '#7B6BA8' },
      { key: 'black', label: 'Black', val: st.mobility_black, color: '#D68050' },
      { key: 'hispanic', label: 'Hispanic', val: st.mobility_hispanic, color: '#4AA890' },
      { key: 'asian', label: 'Asian', val: st.mobility_asian, color: '#D64B7B' }
    ];

    return `
      <div class="explorer-card">
        <h3 class="card-title">Mobility Outcomes by Race in ${this.selectedState} ${this.tip('mobility')}</h3>
        <div class="race-bars-container">
          ${this.raceBar('White', st.mobility_white, n.mobility_white, '#7B6BA8')}
          ${this.raceBar('Black', st.mobility_black, n.mobility_black, '#D68050')}
          ${this.raceBar('Hispanic', st.mobility_hispanic, n.mobility_hispanic, '#4AA890')}
          ${this.raceBar('Asian', st.mobility_asian, n.mobility_asian, '#D64B7B')}
        </div>
        ${st.mobility_white && st.mobility_black ? `
          <p class="insight-callout">
            ⚠ White-Black gap in ${this.selectedState}: <strong>${(st.mobility_white - st.mobility_black).toFixed(1)} percentile points</strong>
            <br>
            <span style="font-size: 0.9em; opacity: 0.9;">National White-Black gap: <strong>12.3 points</strong></span>
            ${this.tip('gap')}
          </p>
        ` : ''}
      </div>
      
      <div class="explorer-card rankings-card-wrapper">
        <div class="clickable-overlay">
          <div class="clickable-badge">» STATES ARE CLICKABLE<br><span>Click to explore state data</span></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 class="card-title" style="margin: 0;">★ Rankings by Race</h3>
          <select id="race-selector" onchange="MobilityExplorer.selectRace(this.value)" style="padding: 8px 12px; border-radius: 8px; border: 2px solid #7B6BA8; background: white; color: #4A2040; font-weight: 600; font-size: 0.95rem; cursor: pointer;">
            <option value="white" ${this.selectedRace === 'white' ? 'selected' : ''}>White Mobility</option>
            <option value="black" ${this.selectedRace === 'black' ? 'selected' : ''}>Black Mobility</option>
            <option value="hispanic" ${this.selectedRace === 'hispanic' ? 'selected' : ''}>Hispanic Mobility</option>
            <option value="asian" ${this.selectedRace === 'asian' ? 'selected' : ''}>Asian Mobility</option>
          </select>
        </div>
        <div class="rankings-container">
          <div class="rank-column">
            <div class="rank-header good">TOP 5</div>
            ${this.getRank('mobility_' + this.selectedRace).arr.slice(0, 5).map((s, i) => `
              <div class="rank-item ${s.n === this.selectedState ? 'highlight' : ''}" onclick="MobilityExplorer.selectState('${s.n}')">
                <span class="rank-pos">#${i + 1}</span><span class="rank-name">${s.n}</span><span class="rank-value">${Math.round(s.v)}th percentile</span>
              </div>
            `).join('')}
          </div>
          <div class="rank-column">
            <div class="rank-header bad">BOTTOM 5</div>
            ${this.getRank('mobility_' + this.selectedRace).arr.slice(-5).reverse().map((s, i) => `
              <div class="rank-item ${s.n === this.selectedState ? 'highlight' : ''}" onclick="MobilityExplorer.selectState('${s.n}')">
                <span class="rank-pos">#${this.getRank('mobility_' + this.selectedRace).total - 4 + i}</span><span class="rank-name">${s.n}</span><span class="rank-value">${Math.round(s.v)}th percentile</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ===== FAMILY TAB =====
  render_family() {
    const st = this.getState(this.selectedState);
    if (!st) return '<div class="explorer-empty">Select a state</div>';
    const singlePct = (st.singleparent || 0) * 100;
    const natSinglePct = (this.nationalData.singleparent || 0) * 100;

    return `
      <div class="explorer-grid two-col">
        <div class="explorer-card">
          <h3 class="card-title">Household Structure in ${this.selectedState} ${this.tip('singleParent')}</h3>
          <div class="donut-container">
            <div class="donut-chart" style="background:conic-gradient(#B54545 0deg ${singlePct*3.6}deg, #4A8B5C ${singlePct*3.6}deg)">
              <div class="donut-center"><span class="donut-value">${singlePct.toFixed(0)}%</span><span class="donut-label">Single-Parent</span></div>
            </div>
          </div>
          <div class="legend-row">
            <span class="legend-item"><i style="background:#B54545"></i>Single-Parent (${singlePct.toFixed(0)}%)</span>
            <span class="legend-item"><i style="background:#4A8B5C"></i>Two-Parent (${(100-singlePct).toFixed(0)}%)</span>
          </div>
        </div>
        
        <div class="explorer-card">
          <h3 class="card-title">▸ Key Insight Nationally</h3>
          <div class="insight-box" style="padding: 24px;">
            <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
              <li style="padding: 12px 0; font-size: 1.05rem;">
                <strong style="color: #B54545;">Single-parent rate</strong> has the strongest negative correlation (<strong>r = -0.59</strong>) with economic mobility of any factor measured.
              </li>
              <li style="padding: 12px 0; border-top: 1px solid #E8D8E0;">
                ■ <strong>National Average:</strong> ${natSinglePct.toFixed(0)}% single-parent households
              </li>
              <li style="padding: 12px 0; border-top: 1px solid #E8D8E0;">
                ▲ <strong>${this.selectedState}:</strong> ${singlePct.toFixed(0)}% single-parent households
                ${singlePct < natSinglePct ? 
                  `<span style="color: #4A8B5C; font-weight: 600;"> (${(natSinglePct - singlePct).toFixed(1)}% below national)</span>` : 
                  `<span style="color: #B54545; font-weight: 600;"> (${(singlePct - natSinglePct).toFixed(1)}% above national)</span>`}
              </li>
              <li style="padding: 12px 0; border-top: 1px solid #E8D8E0;">
                ✓ <strong>Impact:</strong> Areas with more two-parent households consistently show higher mobility outcomes.
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="explorer-card">
        <h3 class="card-title">Single-Parent Rate vs Mobility</h3>
        <div class="scatter-wrapper" id="familyScatter" data-x="singleparent_share2010" data-y="kfr_pooled_pooled_p25" data-xl="Single-Parent Rate (%)" data-xm="100"></div>
        <p class="scatter-caption">Each dot = one census tract. <strong>Higher single-parent rates correlate with lower mobility.</strong></p>
      </div>
    `;
  },

  // ===== EDUCATION TAB =====
  render_education() {
    const st = this.getState(this.selectedState);
    if (!st) return '<div class="explorer-empty">Select a state</div>';
    const tracts = this.getTracts(this.selectedState);
    const hasData = tracts.filter(t => t.gsmn_math_g3_2013 && !isNaN(parseFloat(t.gsmn_math_g3_2013))).length > 30;
    const n = this.nationalData;

    return `
      <div class="explorer-grid two-col">
        <div class="explorer-card">
          <h3 class="card-title">Education Metrics in ${this.selectedState}</h3>
          ${hasData ? `
            <div class="factors-grid-small">
              ${this.factorCard('3RD GRADE MATH', st.math?.toFixed(2) || '—', 'Avg standardized score (3.0 = grade level)', 'mathScore')}
              ${this.factorCard('COLLEGE RATE', st.college ? (st.college * 100).toFixed(0) + '%' : '—', 'Adults with Bachelor\'s degree+', 'collegeRate')}
            </div>
          ` : `<div class="no-data-box">■ Insufficient education data available for ${this.selectedState}</div>`}
        </div>
        
        <div class="explorer-card">
          <h3 class="card-title">▸ Key Insight Nationally</h3>
          <div class="insight-box" style="padding: 24px;">
            <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
              <li style="padding: 12px 0; font-size: 1.05rem;">
                <strong style="color: #7B6BA8;">Education</strong> shows strong positive correlation with mobility. Areas with college rates above 40% have <strong>9.5 percentile points</strong> higher mobility than areas below 15%.
              </li>
              <li style="padding: 12px 0; border-top: 1px solid #E8D8E0;">
                ◆ <strong>Early Education:</strong> 3rd grade math scores are a strong predictor of future economic outcomes.
              </li>
              <li style="padding: 12px 0; border-top: 1px solid #E8D8E0;">
                ■ <strong>National Average:</strong> ${(n.college * 100).toFixed(0)}% college rate
              </li>
              <li style="padding: 12px 0; border-top: 1px solid #E8D8E0;">
                ◆ <strong>${this.selectedState}:</strong> ${st.college ? (st.college * 100).toFixed(0) + '%' : 'N/A'} college rate
                ${st.college ? (st.college * 100 < n.college * 100 ? 
                  `<span style="color: #B54545; font-weight: 600;"> (${(n.college * 100 - st.college * 100).toFixed(1)}% below national)</span>` : 
                  `<span style="color: #4A8B5C; font-weight: 600;"> (${(st.college * 100 - n.college * 100).toFixed(1)}% above national)</span>`) : ''}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="explorer-card">
        <h3 class="card-title">Math Score vs Mobility ${this.tip('mathScore')}</h3>
        ${hasData ? `
          <div class="scatter-wrapper tall" id="eduScatter" data-x="gsmn_math_g3_2013" data-y="kfr_pooled_pooled_p25" data-xl="3rd Grade Math Score" data-xm="1"></div>
          <p class="scatter-caption">Each dot = one census tract. <strong>Higher math scores correlate with higher mobility.</strong></p>
        ` : `<div class="no-data-box tall">■ Insufficient data for ${this.selectedState}</div>`}
      </div>
    `;
  },

  // ===== EXPLORE/COMPARE TAB =====
  showDetailedMetrics: false,

  render_explore() {
    const st1 = this.getState(this.selectedState);
    const st2 = this.getState(this.compareState);
    const opts = Object.values(this.stateData).map(s => s.name).sort().map(s => `<option value="${s}">${s}</option>`).join('');
    
    // Determine winner (with threshold for tie detection to handle floating point precision)
    const TIE_THRESHOLD = 0.5; // Within 0.5 points is considered a tie
    const winner = st1 && st2 ? 
      (Math.abs(st1.mobility - st2.mobility) < TIE_THRESHOLD ? 0 : 
       (st1.mobility > st2.mobility ? 1 : 2)) : 0;
    const isExpanded = this.showDetailedMetrics;

    return `
      <div class="explorer-card">
        <h3 class="card-title">⬌ State vs State: Mobility Showdown</h3>
        <p class="compare-helper">Pick two states to see which one gives children from low-income families a better chance at success.</p>
        <div class="compare-selector-row">
          <div class="compare-picker">
            <label>Challenger 1</label>
            <select id="exploreState1" class="styled-select compare-dropdown">${opts}</select>
          </div>
          <div class="vs-badge">VS</div>
          <div class="compare-picker">
            <label>Challenger 2</label>
            <select id="exploreState2" class="styled-select compare-dropdown">${opts}</select>
          </div>
        </div>
      </div>
      
      ${st1 && st2 ? `
        <div class="competition-arena ${isExpanded ? 'expanded' : ''}">
          <!-- State 1 -->
          <div class="competitor-card ${winner === 1 ? 'winner' : ''} ${winner === 0 ? 'tie' : ''} ${isExpanded ? 'compact' : ''}">
            ${winner === 1 ? '<div class="crown">👑</div>' : ''}
            ${winner === 0 ? '<div class="tie-badge">🤝</div>' : ''}
            <div class="state-silhouette" style="background-color: #8B4560;">
              <span class="state-abbrev">${this.getStateAbbrev(st1.name)}</span>
            </div>
            <div class="competitor-name">${st1.name}</div>
            <div class="competitor-score">${st1.mobility?.toFixed(0) || '—'}</div>
            <div class="competitor-label">Economic Mobility Score</div>
            ${winner === 1 ? '<div class="winner-tag">🏆 WINNER</div>' : ''}
            ${winner === 0 ? '<div class="tie-tag">🤝 TIE</div>' : ''}
          </div>
          
          <!-- Center Section - Scale OR Detailed Metrics -->
          <div class="arena-center ${isExpanded ? 'expanded' : ''}">
            ${!isExpanded ? `
              <div class="arena-vs">${winner === 0 ? '=' : 'VS'}</div>
              <div class="arena-metric">Overall Economic Mobility</div>
              <div class="arena-scale">
                <span>1</span>
                <div class="scale-bar"></div>
                <span>100</span>
              </div>
              <div class="arena-scale-label">Percentile (higher = better)</div>
              <button class="see-why-btn-inline" onclick="MobilityExplorer.toggleDetailedMetrics()">
                ▼ See Why
              </button>
            ` : `
              <div class="detailed-metrics-inline">
                <div class="metrics-title">${winner === 0 ? "It's a Tie!" : 'Why ' + (winner === 1 ? st1.name : st2.name) + ' Wins'}</div>
                <div class="metrics-grid">
                  ${this.compareMetricCompact('Mobility', st1.mobility, st2.mobility, 'pctl', false, false)}
                  ${this.compareMetricCompact('Income', st1.income, st2.income, '$', true, false)}
                  ${this.compareMetricCompact('College', st1.college ? st1.college * 100 : null, st2.college ? st2.college * 100 : null, '%', false, false)}
                  ${this.compareMetricCompact('Single Parent', st1.singleparent ? st1.singleparent * 100 : null, st2.singleparent ? st2.singleparent * 100 : null, '%', false, true)}
                  ${this.compareMetricCompact('White Mobility', st1.mobility_white, st2.mobility_white, 'pctl', false, false)}
                  ${this.compareMetricCompact('Black Mobility', st1.mobility_black, st2.mobility_black, 'pctl', false, false)}
                </div>
                <div class="metrics-legend-inline">
                  <span>🟢 = Better value</span>
                  <span>Lower single-parent rate is better</span>
                </div>
                <button class="see-why-btn-inline" onclick="MobilityExplorer.toggleDetailedMetrics()">
                  ▲ Hide Details
                </button>
              </div>
            `}
          </div>
          
          <!-- State 2 -->
          <div class="competitor-card alt ${winner === 2 ? 'winner' : ''} ${winner === 0 ? 'tie' : ''} ${isExpanded ? 'compact' : ''}">
            ${winner === 2 ? '<div class="crown">👑</div>' : ''}
            ${winner === 0 ? '<div class="tie-badge">🤝</div>' : ''}
            <div class="state-silhouette" style="background-color: #7B6BA8;">
              <span class="state-abbrev">${this.getStateAbbrev(st2.name)}</span>
            </div>
            <div class="competitor-name">${st2.name}</div>
            <div class="competitor-score">${st2.mobility?.toFixed(0) || '—'}</div>
            <div class="competitor-label">Economic Mobility Score</div>
            ${winner === 2 ? '<div class="winner-tag">🏆 WINNER</div>' : ''}
            ${winner === 0 ? '<div class="tie-tag">🤝 TIE</div>' : ''}
          </div>
        </div>
        
        <div class="explorer-card" style="margin-top: 30px;">
          <h3 class="card-title">▸ Discovery Questions</h3>
          <p class="discovery-intro">Click a question below to reveal insights from the data:</p>
          <div class="discovery-cards">
            <div class="discovery-card" onclick="MobilityExplorer.showDiscovery('poverty')">
              <div class="disc-icon">▲</div>
              <div class="disc-title">Best States for Low-Income Families</div>
              <div class="disc-desc">Where do children from poor families have the best chance at upward mobility?</div>
            </div>
            <div class="discovery-card" onclick="MobilityExplorer.showDiscovery('rural')">
              <div class="disc-icon">◇</div>
              <div class="disc-title">Rural vs Urban Gap</div>
              <div class="disc-desc">Which states show the biggest mobility differences between rural and urban areas?</div>
            </div>
            <div class="discovery-card" onclick="MobilityExplorer.showDiscovery('equity')">
              <div class="disc-icon">⬌</div>
              <div class="disc-title">Racial Equity Leaders</div>
              <div class="disc-desc">Which states have the smallest racial gaps in economic mobility?</div>
            </div>
          </div>
          <div id="discoveryResults"></div>
        </div>
      ` : '<div class="explorer-empty">Select two states to compare</div>'}
    `;
  },

  getStateAbbrev(name) {
    const abbrevs = {
      'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
      'Colorado':'CO','Connecticut':'CT','Delaware':'DE','District of Columbia':'DC',
      'Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID','Illinois':'IL',
      'Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA',
      'Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
      'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV',
      'New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
      'North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR',
      'Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
      'Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
      'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
    };
    return abbrevs[name] || name.substring(0,2).toUpperCase();
  },

  toggleDetailedMetrics() {
    this.showDetailedMetrics = !this.showDetailedMetrics;
    this.renderTab();
  },

  showCompareHelp() {
    const box = document.getElementById('compareHelpBox');
    if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
  },

  compareMetric(label, v1, v2, unit, isMoney = false, lowerBetter = false) {
    const fmt = v => {
      if (v == null) return '—';
      if (isMoney) return '$' + Math.round(v).toLocaleString();
      if (unit === 'percentile') return v.toFixed(0) + 'th ' + unit;
      return v.toFixed(0) + ' ' + unit;
    };
    const w1 = v1 != null && v2 != null ? (lowerBetter ? v1 < v2 : v1 > v2) : false;
    const w2 = v1 != null && v2 != null ? (lowerBetter ? v2 < v1 : v2 > v1) : false;
    return `<div class="compare-row"><span class="cmp-val ${w1?'winner':''}">${fmt(v1)}</span><span class="cmp-label">${label}</span><span class="cmp-val ${w2?'winner':''}">${fmt(v2)}</span></div>`;
  },

  compareMetricCompact(label, v1, v2, unit, isMoney = false, lowerBetter = false) {
    const fmt = v => {
      if (v == null) return '—';
      if (isMoney) return '$' + Math.round(v/1000) + 'K';
      return v.toFixed(0) + unit;
    };
    const w1 = v1 != null && v2 != null ? (lowerBetter ? v1 < v2 : v1 > v2) : false;
    const w2 = v1 != null && v2 != null ? (lowerBetter ? v2 < v1 : v2 > v1) : false;
    return `
      <div class="metric-row-compact">
        <span class="metric-val ${w1?'better':''}">${fmt(v1)}</span>
        <span class="metric-name">${label}</span>
        <span class="metric-val ${w2?'better':''}">${fmt(v2)}</span>
      </div>
    `;
  },

  toggleRuralUrban(type) {
    this.ruralToggle = type;
    this.showDiscovery('rural');
  },

  showDiscovery(type) {
    const el = document.getElementById('discoveryResults');
    if (!el) return;
    
    const insights = {
      poverty: {
        title: '★ Best States for High-Poverty Areas',
        subtitle: 'In areas with >20% poverty rate, these states achieve the highest mobility scores:',
        items: [
          { state: 'Utah', value: '43.4', unit: 'mobility score', note: 'Strong community institutions' },
          { state: 'Montana', value: '42.0', unit: 'mobility score', note: 'Lower inequality levels' },
          { state: 'Iowa', value: '41.5', unit: 'mobility score', note: 'Strong public schools' },
          { state: 'Minnesota', value: '41.2', unit: 'mobility score', note: 'Robust safety net' },
          { state: 'Washington', value: '41.1', unit: 'mobility score', note: 'Economic diversity' }
        ],
        insight: 'These states achieve high mobility even in poor areas through strong social institutions, lower inequality, and quality public services.'
      },
      rural: {
        title: this.ruralToggle === 'rural' ? '◇ States Where Rural Areas Outperform Cities' : '■ States Where Urban Areas Outperform Rural',
        subtitle: this.ruralToggle === 'rural' 
          ? 'Rural advantage = how much rural mobility exceeds urban mobility:' 
          : 'Urban advantage = how much urban mobility exceeds rural mobility:',
        toggle: true,
        items: this.ruralToggle === 'rural' ? [
          { state: 'Minnesota', value: '+11.2', unit: 'points', note: 'Rural: 50.4 (mobility) / Urban: 39.2 (mobility)' },
          { state: 'Wisconsin', value: '+11.1', unit: 'points', note: 'Rural: 47.5 (mobility) / Urban: 36.4 (mobility)' },
          { state: 'Connecticut', value: '+10.0', unit: 'points', note: 'Rural: 47.7 (mobility) / Urban: 37.7 (mobility)' },
          { state: 'Michigan', value: '+9.5', unit: 'points', note: 'Rural: 42.5 (mobility) / Urban: 33.0 (mobility)' },
          { state: 'Ohio', value: '+8.7', unit: 'points', note: 'Rural: 42.6 (mobility) / Urban: 33.9 (mobility)' }
        ] : [
          { state: 'Nevada', value: '+4.2', unit: 'points', note: 'Urban: 38.1 (mobility) / Rural: 33.9 (mobility)' },
          { state: 'New Mexico', value: '+3.8', unit: 'points', note: 'Urban: 37.2 (mobility) / Rural: 33.4 (mobility)' },
          { state: 'Arizona', value: '+2.9', unit: 'points', note: 'Urban: 40.1 (mobility) / Rural: 37.2 (mobility)' },
          { state: 'Colorado', value: '+2.1', unit: 'points', note: 'Urban: 45.6 (mobility) / Rural: 43.5 (mobility)' },
          { state: 'Texas', value: '+1.8', unit: 'points', note: 'Urban: 39.8 (mobility) / Rural: 38.0 (mobility)' }
        ],
        insight: this.ruralToggle === 'rural' 
          ? 'In these Midwest states, small-town communities significantly outperform big cities. Strong community ties and lower costs of living may contribute to this rural advantage.'
          : 'In these Western/Sun Belt states, cities provide better mobility outcomes. Urban job markets and diverse economies may benefit low-income families more.'
      },
      equity: {
        title: '⬌ States with Smallest White-Black Mobility Gaps',
        subtitle: 'These states show the most equitable outcomes between White and Black residents:',
        items: [
          { state: 'Rhode Island', value: '6.5', unit: 'point gap', note: 'White: 42.6 / Black: 36.1' },
          { state: 'Massachusetts', value: '7.4', unit: 'point gap', note: 'White: 46.6 / Black: 39.1' },
          { state: 'Kentucky', value: '7.5', unit: 'point gap', note: 'White: 40.3 / Black: 32.9' },
          { state: 'Delaware', value: '7.9', unit: 'point gap', note: 'White: 42.5 / Black: 34.5' },
          { state: 'Indiana', value: '7.9', unit: 'point gap', note: 'White: 40.9 / Black: 32.9' }
        ],
        insight: 'While racial gaps exist everywhere, these states show more equitable outcomes. Note: smaller gaps don\'t always mean higher overall mobility—some states have smaller gaps because both groups have lower mobility.'
      }
    };
    
    const d = insights[type];
    el.innerHTML = `
      <div class="discovery-result compact">
        <div class="discovery-header-row">
          <h4>${d.title}</h4>
          <div class="scale-key-small">
            <span class="scale-key-label">📊 Scale:</span>
            <span class="scale-key-range">1━100</span>
          </div>
        </div>
        
        ${d.toggle ? `
          <div class="rural-urban-toggle compact">
            <button class="toggle-btn ${this.ruralToggle === 'rural' ? 'active' : ''}" onclick="MobilityExplorer.toggleRuralUrban('rural')">◇ Rural Outperforms</button>
            <button class="toggle-btn ${this.ruralToggle === 'urban' ? 'active' : ''}" onclick="MobilityExplorer.toggleRuralUrban('urban')">■ Urban Outperforms</button>
          </div>
        ` : ''}
        <p class="result-subtitle compact">${d.subtitle}</p>
        <div class="result-list compact">
          ${d.items.map((item, i) => `
            <div class="result-item compact">
              <span class="result-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'}</span>
              <span class="result-state"><strong>${item.state}</strong></span>
              <span class="result-value-box">${item.value}</span>
              <span class="result-note">${item.note}</span>
            </div>
          `).join('')}
        </div>
        <div class="result-footer">
          <span class="mobility-note-inline">ⓘ Mobility scores: Opportunity Atlas 1-100 scale. Higher = better outcomes.</span>
          <span class="result-insight-inline">▸ ${d.insight}</span>
        </div>
      </div>
    `;
  },

  // Glance bar WITH ARROWS for above/below national
  glanceBarWithArrows() {
    const st = this.getState(this.selectedState);
    const n = this.nationalData;
    if (!st || !n) return '';
    
    return `
      <div class="glance-bar">
        <div class="glance-title">▸ ${this.selectedState} at a Glance</div>
        <div class="glance-stats">
          <div class="glance-stat">
            <span class="gs-label">Mobility ${this.tip('mobility')}</span>
            <span class="gs-value">${st.mobility?.toFixed(0) || '—'} ${this.arrow(st.mobility, n.mobility)}</span>
            <span class="gs-unit">percentile</span>
          </div>
          <div class="glance-stat">
            <span class="gs-label">Income ${this.tip('medianIncome')}</span>
            <span class="gs-value">$${st.income ? Math.round(st.income/1000) + 'K' : '—'} ${this.arrow(st.income, n.income)}</span>
            <span class="gs-unit">median</span>
          </div>
          <div class="glance-stat">
            <span class="gs-label">College ${this.tip('collegeRate')}</span>
            <span class="gs-value">${st.college ? (st.college*100).toFixed(0) + '%' : '—'} ${this.arrow(st.college, n.college)}</span>
            <span class="gs-unit">rate</span>
          </div>
          <div class="glance-stat">
            <span class="gs-label">Single-Parent ${this.tip('singleParent')}</span>
            <span class="gs-value">${st.singleparent ? (st.singleparent*100).toFixed(0) + '%' : '—'} ${this.arrow(st.singleparent, n.singleparent, true)}</span>
            <span class="gs-unit">rate</span>
          </div>
        </div>
      </div>
    `;
  },

  nationalGlanceBar() {
    const n = this.nationalData;
    if (!n) return '';
    return `
      <div class="glance-bar national">
        <div class="glance-title">■ National Average at a Glance</div>
        <div class="glance-stats">
          <div class="glance-stat"><span class="gs-label">Mobility</span><span class="gs-value">${n.mobility?.toFixed(0) || '—'}</span><span class="gs-unit">percentile</span></div>
          <div class="glance-stat"><span class="gs-label">Income</span><span class="gs-value">$${n.income ? Math.round(n.income/1000) + 'K' : '—'}</span><span class="gs-unit">median</span></div>
          <div class="glance-stat"><span class="gs-label">College</span><span class="gs-value">${n.college ? (n.college*100).toFixed(0) + '%' : '—'}</span><span class="gs-unit">rate</span></div>
          <div class="glance-stat"><span class="gs-label">Single-Parent</span><span class="gs-value">${n.singleparent ? (n.singleparent*100).toFixed(0) + '%' : '—'}</span><span class="gs-unit">rate</span></div>
        </div>
      </div>
    `;
  },

  drawScatters() {
    document.querySelectorAll('.scatter-wrapper').forEach(el => {
      const x = el.dataset.x, y = el.dataset.y, xl = el.dataset.xl, xm = parseFloat(el.dataset.xm) || 1;
      if (x && y) this.drawScatter(el.id, x, y, xl, xm);
    });
  },

  drawScatter(id, xF, yF, xL, xM = 1) {
    const el = document.getElementById(id);
    if (!el) return;
    const tracts = this.getTracts(this.selectedState);
    const data = tracts.map(t => ({ x: parseFloat(t[xF]) * xM, y: parseFloat(t[yF]) })).filter(d => !isNaN(d.x) && !isNaN(d.y) && d.x >= 0 && d.y > 0 && d.y <= 100);
    if (data.length < 30) { el.innerHTML = '<div class="no-data-box">■ Insufficient data</div>'; return; }
    
    el.innerHTML = '';
    const w = 550, h = el.classList.contains('tall') ? 280 : 220, m = { t: 20, r: 20, b: 50, l: 55 };
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('preserveAspectRatio', 'xMidYMid meet');
    const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);
    const iw = w - m.l - m.r, ih = h - m.t - m.b;
    const x = d3.scaleLinear().domain([0, d3.quantile(data.map(d => d.x).sort(d3.ascending), 0.95)]).range([0, iw]);
    const y = d3.scaleLinear().domain([0, 100]).range([ih, 0]);
    
    g.selectAll('circle').data(data).enter().append('circle')
      .attr('cx', d => Math.min(iw, x(d.x))).attr('cy', d => y(d.y)).attr('r', 4)
      .attr('fill', '#D687A6').attr('opacity', 0.6).attr('stroke', '#8B4560').attr('stroke-width', 0.5);
    
    const n = data.length, sx = d3.sum(data, d => d.x), sy = d3.sum(data, d => d.y);
    const sxy = d3.sum(data, d => d.x * d.y), sx2 = d3.sum(data, d => d.x * d.x);
    const sl = (n * sxy - sx * sy) / (n * sx2 - sx * sx), int = (sy - sl * sx) / n;
    const [x1, x2] = d3.extent(data, d => d.x);
    g.append('line').attr('x1', x(x1)).attr('y1', y(sl * x1 + int)).attr('x2', x(x2)).attr('y2', y(sl * x2 + int))
      .attr('stroke', '#8B4560').attr('stroke-width', 2).attr('stroke-dasharray', '6,4');
    
    g.append('g').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(5)).selectAll('text').style('font-size', '11px');
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').style('font-size', '11px');
    g.append('text').attr('x', iw / 2).attr('y', ih + 40).attr('text-anchor', 'middle').style('font-size', '12px').text(xL);
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -ih / 2).attr('y', -42).attr('text-anchor', 'middle').style('font-size', '12px').text('Mobility (percentile)');
  },

  getHTML() {
    return `
      <style>
        /* Explorer Container */
        .explorer-container { padding: 20px; }
        
        /* Intro Copy */
        .explorer-intro {
          background: linear-gradient(135deg, #FFF5EE, #FCEADF);
          border: 3px solid #E8C8D8; border-radius: 16px; padding: 20px 24px;
          margin-bottom: 20px; line-height: 1.7; font-size: 0.95rem; color: #4A3A3A;
        }
        .explorer-intro strong { color: #8B4560; }
        
        /* Tooltip System */
        .info-tip {
          display: inline-flex; align-items: center; justify-content: center;
          width: 16px; height: 16px; background: #9A8A9A; color: #fff;
          border-radius: 50%; font-size: 10px; cursor: help;
          margin-left: 4px; position: relative; font-style: normal;
        }
        .info-tip:hover::after {
          content: attr(data-tooltip);
          position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
          background: #4A2040; color: #fff; padding: 12px 16px; border-radius: 8px;
          font-size: 12px; width: 260px; z-index: 1000; line-height: 1.5;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2); margin-bottom: 8px;
        }
        .info-tip:hover::before {
          content: ''; position: absolute; bottom: 100%; left: 50%;
          transform: translateX(-50%); border: 6px solid transparent;
          border-top-color: #4A2040; margin-bottom: -4px;
        }
        
        /* Arrow Indicators */
        .arrow-indicator {
          display: inline-block; font-weight: 700; margin-left: 4px;
          cursor: help; position: relative;
        }
        .arrow-indicator.up { color: #2E7D32; }
        .arrow-indicator.down { color: #C62828; }
        .arrow-indicator:hover::after {
          content: attr(data-tooltip);
          position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
          background: #4A2040; color: #fff; padding: 8px 12px; border-radius: 6px;
          font-size: 11px; width: 180px; z-index: 1000; white-space: normal;
          margin-bottom: 6px; font-weight: 400;
        }
        
        /* Nav with State Dropdown */
        .explorer-nav {
          display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
          align-items: center; justify-content: space-between;
          background: #FFF5EE; padding: 14px 18px; border-radius: 12px;
          border: 2px solid #E8C8D8;
        }
        .explorer-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .explorer-tab {
          padding: 12px 20px; border: none; background: transparent;
          cursor: pointer; font-size: 14px; border-radius: 8px;
          color: #6A4A5A; font-weight: 500; transition: all 0.15s;
          font-family: 'Press Start 2P', monospace; font-size: 9px;
        }
        .explorer-tab:hover { background: #FCEADF; }
        .explorer-tab.active { background: #8B4560; color: #fff; }
        
        .state-selector-wrapper {
          display: flex; align-items: center; gap: 10px;
        }
        .state-selector-label {
          font-size: 0.85rem; color: #6A4A5A; font-weight: 500;
        }
        .explorer-state-sel, .styled-select {
          padding: 10px 16px; border: 2px solid #8B4560; border-radius: 8px;
          background: #fff; font-size: 14px; min-width: 180px;
          font-family: 'Press Start 2P', monospace; font-size: 9px;
          color: #4A2040;
        }
        
        .explorer-content { min-height: 500px; }
        
        .explorer-question {
          background: linear-gradient(135deg, #8B4560, #7B6BA8);
          color: #fff; padding: 16px 20px; border-radius: 12px;
          font-size: 1rem; margin-bottom: 20px;
          font-family: 'Press Start 2P', monospace; font-size: 11px;
          line-height: 1.6;
        }
        
        .explorer-grid { display: grid; gap: 20px; margin-bottom: 20px; }
        .explorer-grid.two-col { grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px) { .explorer-grid.two-col { grid-template-columns: 1fr; } }
        
        .explorer-card {
          background: #FFF5EE; border-radius: 16px; padding: 24px;
          border: 3px solid #E8C8D8; margin-bottom: 20px;
        }
        .explorer-card:last-child { margin-bottom: 0; }
        .card-title {
          font-family: 'Press Start 2P', monospace; font-size: 11px;
          color: #8B4560; margin: 0 0 16px; line-height: 1.4;
        }
        
        /* Hero Card */
        .hero-card { text-align: center; border-color: #8B4560; }
        .state-badge {
          display: inline-block; background: #8B4560; color: #fff;
          padding: 10px 28px; border-radius: 24px; font-weight: 600;
          margin-bottom: 20px; font-size: 1rem;
        }
        .hero-score { display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 16px; }
        .score-number { font-family: 'Press Start 2P', monospace; font-size: 3.5rem; color: #B8973A; }
        .score-details { text-align: left; }
        .score-unit { display: block; font-size: 1.1rem; font-weight: 600; color: #4A2040; }
        .score-label { display: block; font-size: 0.85rem; color: #8A6A7A; }
        .rank-info { font-size: 1rem; color: #6A4A5A; margin-bottom: 16px; }
        .explain-text {
          font-size: 0.95rem; color: #6A4A5A; line-height: 1.6;
          padding-top: 16px; border-top: 2px solid #E8C8D8; margin: 0;
        }
        
        /* Factors Grid */
        .factors-grid-small { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .factor-item {
          background: #FCEADF; border-radius: 12px; padding: 16px; text-align: center;
          border: 2px solid #E8C8D8;
        }
        .factor-label { font-size: 0.7rem; color: #8A6A7A; margin-bottom: 6px; letter-spacing: 0.5px; }
        .factor-value { font-size: 1.4rem; font-weight: 700; color: #4A2040; margin-bottom: 4px; }
        .factor-desc { font-size: 0.75rem; color: #8A6A7A; }
        
        /* Race Bars */
        .race-bars-container { display: flex; flex-direction: column; gap: 20px; }
        .race-bar-group { display: flex; align-items: flex-start; gap: 12px; }
        .race-bars-stack { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .race-bar-row { display: flex; align-items: center; }
        .race-label { width: 70px; font-size: 0.95rem; color: #4A2040; font-weight: 500; padding-top: 4px; }
        
        .state-bar .race-bar-track { height: 32px; background: #F5E8E0; border-radius: 8px; overflow: hidden; }
        .national-bar .race-bar-track { height: 24px; background: #F5F5F5; border-radius: 6px; overflow: hidden; }
        
        .race-bar-track { flex: 1; }
        .race-bar-fill {
          height: 100%; display: flex; align-items: center; justify-content: flex-end;
          padding-right: 12px; border-radius: 8px; transition: width 0.5s ease; min-width: 100px;
        }
        .national-fill {
          background: #B0B0B0 !important;
          min-width: 80px;
        }
        .race-bar-value { color: #fff; font-weight: 700; font-size: 0.85rem; white-space: nowrap; }
        .national-value { 
          font-size: 0.75rem; 
          font-weight: 600;
          color: #fff;
        }
        .no-data-text { color: #AAA; font-style: italic; font-size: 0.9rem; }
        
        .insight-callout {
          margin: 20px 0 0; padding: 14px; background: #FCEADF; border-radius: 10px;
          font-size: 1rem; border-left: 4px solid #D68050;
        }
        
        /* National Race Cards - REDESIGNED smaller cards */
        .national-race-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
        .nat-race-card {
          background: #fff; border-radius: 10px; padding: 12px 8px; text-align: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .nat-race-value { font-size: 1.5rem; font-weight: 700; color: #4A2040; }
        .nat-race-label { font-size: 0.65rem; color: #8A6A7A; margin-bottom: 4px; }
        .nat-race-name { font-size: 0.75rem; color: #6A4A5A; font-weight: 500; margin-top: 4px; }
        .insight-gap-note { margin-top: 16px; padding-top: 12px; border-top: 1px solid #E8C8D8; }
        
        /* Race Cards for state */
        .race-cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        @media (max-width: 600px) { .race-cards-grid { grid-template-columns: repeat(2, 1fr); } }
        .race-stat-card {
          background: #FCEADF; border-radius: 12px; padding: 16px 12px; text-align: center;
          border: 2px solid #E8C8D8;
        }
        .race-stat-value { font-size: 2rem; font-weight: 700; color: #4A2040; }
        .race-stat-unit { font-size: 0.7rem; color: #8A6A7A; margin-bottom: 4px; }
        .race-stat-label { font-size: 0.85rem; color: #6A4A5A; font-weight: 500; }
        
        .gap-callout {
          background: #FCEADF; padding: 16px; border-radius: 10px;
          text-align: center; font-size: 1rem; border-left: 4px solid #8B4560;
        }
        
        .insight-box { background: #FCEADF; border-radius: 12px; padding: 18px; }
        .insight-box p { font-size: 0.95rem; line-height: 1.6; margin: 0 0 12px; color: #4A3A3A; }
        .insight-box p:last-child { margin: 0; }
        
        .national-stat-mini { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #E8C8D8; }
        .mini-donut { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .mini-donut-center { width: 40px; height: 40px; background: #FCEADF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: #8B4560; }
        .nat-edu-stat { margin-top: 16px; padding: 12px; background: #fff; border-radius: 8px; text-align: center; }
        
        /* Donut Chart */
        .donut-container { display: flex; justify-content: center; margin: 24px 0; }
        .donut-chart {
          width: 160px; height: 160px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .donut-center {
          width: 105px; height: 105px; background: #FFF5EE; border-radius: 50%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .donut-value { font-size: 1.6rem; font-weight: 700; color: #8B4560; }
        .donut-label { font-size: 0.7rem; color: #6A4A5A; }
        .legend-row { display: flex; justify-content: center; gap: 24px; font-size: 0.9rem; }
        .legend-item i {
          display: inline-block; width: 14px; height: 14px; border-radius: 50%;
          margin-right: 6px; vertical-align: middle;
        }
        
        /* Scatter Plots */
        .scatter-wrapper { width: 100%; max-width: 600px; margin: 0 auto; min-height: 220px; }
        .scatter-wrapper.tall { min-height: 280px; }
        .scatter-wrapper svg { width: 100%; height: auto; }
        .scatter-caption { text-align: center; font-size: 0.9rem; color: #6A4A5A; margin-top: 12px; }
        
        .no-data-box {
          background: #FCEADF; border-radius: 12px; padding: 40px; text-align: center;
          color: #8A6A7A; font-size: 1rem;
        }
        .no-data-box.tall { min-height: 200px; display: flex; align-items: center; justify-content: center; }
        
        /* Glance Bars */
        .glance-bar {
          background: #FFF5EE; border-radius: 16px; padding: 20px 24px;
          border: 3px solid #8B4560; display: flex; align-items: center;
          gap: 24px; flex-wrap: wrap; margin: 20px 0;
        }
        .glance-bar.national { border-color: #7B6BA8; }
        .glance-bar.national .glance-title { color: #7B6BA8; }
        .glance-title { font-size: 1rem; font-weight: 600; color: #8B4560; min-width: 200px; }
        .glance-stats { display: flex; gap: 12px; flex-wrap: wrap; }
        .glance-stat {
          background: #FCEADF; padding: 12px 16px; border-radius: 12px;
          text-align: center; min-width: 100px;
        }
        .gs-label { display: block; font-size: 0.65rem; color: #8A6A7A; margin-bottom: 4px; }
        .gs-value { display: block; font-size: 1.3rem; font-weight: 700; color: #4A2040; }
        .gs-unit { display: block; font-size: 0.65rem; color: #8A6A7A; }
        
        /* Rankings with Clickable Overlay */
        .rankings-card-wrapper { position: relative; }
        .clickable-overlay {
          position: absolute; top: -20px; right: -40px; z-index: 10;
        }
        .clickable-badge {
          background: #8B4560; color: #fff; padding: 14px 18px;
          border-radius: 50%; width: 100px; height: 100px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; font-family: 'Press Start 2P', monospace; font-size: 8px;
          line-height: 1.4; box-shadow: 0 4px 16px rgba(139,69,96,0.4);
          border: 4px solid #FFF5EE;
        }
        .clickable-badge span { font-family: inherit; font-size: 6px; opacity: 0.85; margin-top: 4px; }
        
        .rankings-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 600px) { .rankings-container { grid-template-columns: 1fr; } }
        .rank-column {}
        .rank-header {
          font-size: 0.85rem; font-weight: 600; padding: 12px 14px;
          border-radius: 10px 10px 0 0; letter-spacing: 0.5px;
        }
        .rank-header.good { background: #E8F5E9; color: #2E7D32; }
        .rank-header.bad { background: #FFEBEE; color: #C62828; }
        .rank-item {
          display: flex; align-items: center; padding: 14px 16px;
          border-bottom: 1px solid #F0E0E0; cursor: pointer;
          font-size: 0.95rem; transition: all 0.15s;
        }
        .rank-item:hover { background: #FCEADF; }
        .rank-item.highlight { background: #FCE4EC; border-left: 4px solid #8B4560; }
        .rank-pos { width: 40px; font-weight: 600; color: #8A6A7A; }
        .rank-name { flex: 1; color: #4A2040; }
        .rank-value { font-weight: 500; color: #6A4A5A; font-size: 0.85rem; }
        
        /* Compare Section */
        .compare-helper { font-size: 0.9rem; color: #6A4A5A; margin-bottom: 16px; }
        .compare-selector-row {
          display: flex; justify-content: center; align-items: center;
          gap: 24px; flex-wrap: wrap; padding: 16px 0;
        }
        .compare-picker { text-align: center; }
        .compare-picker label { display: block; font-size: 0.85rem; color: #6A4A5A; margin-bottom: 8px; font-weight: 600; }
        .compare-dropdown { min-width: 180px; }
        .vs-badge {
          width: 50px; height: 50px; background: #8B4560; color: #fff;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 1rem;
        }
        
        /* Competition Arena */
        .competition-arena {
          display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px;
          margin: 30px 0; align-items: center;
          transition: all 0.3s ease;
        }
        .competition-arena.expanded {
          grid-template-columns: 180px 1fr 180px;
        }
        @media (max-width: 800px) { 
          .competition-arena { grid-template-columns: 1fr; }
          .competition-arena.expanded { grid-template-columns: 1fr; }
        }
        
        .competitor-card {
          background: #FFF5EE; border-radius: 20px; padding: 30px 24px;
          text-align: center; border: 4px solid #E8C8D8; position: relative;
          transition: all 0.3s ease;
        }
        .competitor-card.compact {
          padding: 16px 12px;
        }
        .competitor-card.compact .state-silhouette {
          width: 60px; height: 50px;
        }
        .competitor-card.compact .state-abbrev {
          font-size: 1rem;
        }
        .competitor-card.compact .competitor-name {
          font-size: 0.9rem; margin-bottom: 8px;
        }
        .competitor-card.compact .competitor-score {
          font-size: 2rem;
        }
        .competitor-card.compact .competitor-label {
          font-size: 0.7rem;
        }
        .competitor-card.compact .winner-tag {
          font-size: 0.7rem; padding: 6px 12px; margin-top: 10px;
        }
        .competitor-card.winner { border-color: #FFD700; box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); }
        .competitor-card.alt { border-color: #C8B8E8; }
        .competitor-card.alt.winner { border-color: #FFD700; }
        
        .crown {
          position: absolute; top: -25px; left: 50%; transform: translateX(-50%);
          font-size: 2.5rem; animation: bounce 1s infinite;
        }
        .competitor-card.compact .crown {
          font-size: 1.8rem; top: -18px;
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
        
        .state-silhouette {
          width: 100px; height: 80px; margin: 0 auto 16px;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
        }
        .state-abbrev {
          font-family: 'Press Start 2P', monospace; font-size: 1.5rem; color: #fff;
        }
        
        .competitor-name {
          font-size: 1.1rem; font-weight: 600; color: #4A2040; margin-bottom: 12px;
        }
        .competitor-score {
          font-family: 'Press Start 2P', monospace; font-size: 3rem; color: #B8973A;
        }
        .competitor-label {
          font-size: 0.8rem; color: #8A6A7A; margin-top: 8px;
        }
        .winner-tag {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #4A2040; padding: 8px 16px; border-radius: 20px;
          font-weight: 700; font-size: 0.85rem; margin-top: 16px;
          display: inline-block;
        }
        .tie-badge {
          position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
          font-size: 1.8rem;
        }
        .tie-tag {
          background: linear-gradient(135deg, #90CAF9, #64B5F6);
          color: #1565C0; padding: 8px 16px; border-radius: 20px;
          font-weight: 700; font-size: 0.85rem; margin-top: 16px;
          display: inline-block;
        }
        .competitor-card.tie { border-color: #64B5F6; box-shadow: 0 0 20px rgba(100, 181, 246, 0.3); }
        
        .arena-center {
          text-align: center; padding: 20px;
          transition: all 0.3s ease;
        }
        .arena-center.expanded {
          background: #FFF5EE; border-radius: 16px; padding: 20px;
          border: 3px solid #E8C8D8;
        }
        .arena-vs {
          font-family: 'Press Start 2P', monospace; font-size: 1.5rem;
          color: #8B4560; margin-bottom: 16px;
        }
        .arena-metric {
          font-size: 0.9rem; color: #6A4A5A; font-weight: 600; margin-bottom: 12px;
        }
        .arena-scale {
          display: flex; align-items: center; gap: 8px; justify-content: center;
          font-size: 0.8rem; color: #8A6A7A;
        }
        .scale-bar {
          width: 80px; height: 8px;
          background: linear-gradient(to right, #FFCDD2, #C8E6C9);
          border-radius: 4px;
        }
        .arena-scale-label {
          font-size: 0.75rem; color: #5A4A5A; margin-top: 6px; font-weight: 500;
        }
        
        /* See Why Button Inline */
        .see-why-btn-inline {
          background: linear-gradient(135deg, #8B4560, #7B6BA8);
          color: #fff; border: none; padding: 10px 24px;
          border-radius: 10px; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s; margin-top: 16px;
        }
        .see-why-btn-inline:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 69, 96, 0.3);
        }
        
        /* Detailed Metrics Inline */
        .detailed-metrics-inline {
          width: 100%;
        }
        .metrics-title {
          font-family: 'Press Start 2P', monospace; font-size: 10px;
          color: #8B4560; margin-bottom: 16px;
        }
        .metrics-grid {
          display: flex; flex-direction: column; gap: 6px;
        }
        .metric-row-compact {
          display: grid; grid-template-columns: 70px 1fr 70px;
          background: #FCEADF; padding: 8px 12px; border-radius: 8px;
          font-size: 0.85rem; align-items: center;
        }
        .metric-val { font-weight: 600; text-align: center; }
        .metric-val:first-child { color: #8B4560; }
        .metric-val:last-child { color: #7B6BA8; }
        .metric-val.better { background: #C8E6C9; border-radius: 4px; padding: 2px 4px; }
        .metric-name { text-align: center; color: #6A4A5A; font-size: 0.75rem; }
        .metrics-legend-inline {
          display: flex; justify-content: center; gap: 16px; margin-top: 12px;
          font-size: 0.7rem; color: #8A6A7A;
        }
        
        /* Discovery Section - Original Style */
        .discovery-intro { font-size: 0.95rem; color: #6A4A5A; margin-bottom: 20px; }
        .discovery-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        @media (max-width: 700px) { .discovery-cards { grid-template-columns: 1fr; } }
        .discovery-card {
          background: #FCEADF; border-radius: 14px; padding: 24px 20px; text-align: center;
          cursor: pointer; border: 3px solid transparent; transition: all 0.2s;
          min-height: 160px; display: flex; flex-direction: column; justify-content: center;
        }
        .discovery-card:hover { border-color: #8B4560; transform: translateY(-4px); box-shadow: 0 6px 20px rgba(139,69,96,0.15); }
        .disc-icon { font-size: 2.5rem; margin-bottom: 14px; }
        .disc-title { font-weight: 600; margin-bottom: 10px; color: #4A2040; font-size: 1rem; line-height: 1.3; }
        .disc-desc { font-size: 0.85rem; color: #6A4A5A; line-height: 1.5; }
        
        /* Rural/Urban Toggle - Original */
        .rural-urban-toggle {
          display: flex; justify-content: center; gap: 8px; margin-bottom: 12px;
        }
        .rural-urban-toggle.compact { margin-bottom: 8px; }
        .toggle-btn {
          padding: 8px 16px; border: 2px solid #8B4560; border-radius: 8px;
          background: #FFF5EE; cursor: pointer; font-size: 0.8rem;
          transition: all 0.15s;
        }
        .toggle-btn:hover { background: #FCEADF; }
        .toggle-btn.active { background: #8B4560; color: #fff; }
        
        /* Small Scale Key */
        .scale-key-small {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff; border: 1px solid #E8C8D8; border-radius: 4px;
          padding: 4px 8px; font-size: 0.7rem; color: #6A4A5A;
        }
        .scale-key-label { font-weight: 600; }
        .scale-key-range { color: #8A6A7A; }
        
        .discovery-result {
          background: #FFF5EE; border-radius: 12px; padding: 16px 20px;
          border-left: 4px solid #8B4560; margin-top: 16px;
        }
        .discovery-result.compact { padding: 14px 18px; }
        .discovery-header-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px; flex-wrap: wrap; gap: 8px;
        }
        .discovery-result h4 { margin: 0; color: #4A2040; font-size: 1.05rem; }
        .result-subtitle { color: #6A4A5A; margin-bottom: 10px; font-size: 0.85rem; line-height: 1.4; text-align: center; }
        .result-subtitle.compact { margin-bottom: 8px; font-size: 0.8rem; text-align: center; }
        .result-list { display: flex; flex-direction: column; gap: 6px; }
        .result-list.compact { gap: 4px; }
        .result-item {
          display: grid; grid-template-columns: 32px 100px 70px 1fr;
          padding: 10px 14px; background: #FCEADF; border-radius: 8px;
          font-size: 0.85rem; align-items: center; gap: 6px;
        }
        .result-item.compact {
          padding: 8px 12px; font-size: 0.8rem;
          grid-template-columns: 28px 90px 60px 1fr;
        }
        @media (max-width: 700px) { 
          .result-item { grid-template-columns: 32px 1fr; } 
          .result-value-box, .result-note { grid-column: 2; } 
        }
        .result-rank { font-weight: 700; color: #8B4560; font-size: 1rem; }
        .result-state { color: #4A2040; }
        .result-value-box { 
          background: #fff; padding: 4px 8px; border-radius: 4px;
          color: #B8973A; font-weight: 700; text-align: center; font-size: 0.8rem;
        }
        .result-note { color: #8A6A7A; font-size: 0.75rem; }
        
        .result-footer {
          display: flex; flex-direction: column; gap: 6px; margin-top: 10px;
          padding-top: 10px; border-top: 1px solid #E8C8D8;
        }
        .mobility-note-inline {
          font-size: 0.7rem; color: #8A6A7A; font-style: italic;
        }
        .result-insight-inline {
          font-size: 0.8rem; color: #4A3A3A; line-height: 1.4;
        }
        
        .explorer-empty { text-align: center; padding: 60px 20px; color: #8A6A7A; font-size: 1.1rem; }
      </style>
      
      <div class="explorer-container">
        
        <!-- Info Popup Modal -->
        <div id="info-popup-modal" class="info-popup-modal" style="display: none;">
          <div class="info-popup-overlay" onclick="MobilityExplorer.toggleInfoPopup()"></div>
          <div class="info-popup-content">
            <button class="popup-close" onclick="MobilityExplorer.toggleInfoPopup()">✕</button>
            <h3>📖 Complete Explorer Guide</h3>
            
            <div class="popup-section">
              <h4>What You're Exploring</h4>
              <p>Economic mobility measures how likely children from low-income families (bottom 25%) are to climb the income ladder as adults. The data tracks real outcomes for millions of Americans born in the 1980s.</p>
            </div>
            
            <div class="popup-section">
              <h4>How to Use This Tool</h4>
              <ul>
                <li><strong>Select a state</strong> from the dropdown menu</li>
                <li><strong>Click the tabs</strong> (Overview, Race, Family, Education, Compare) to explore different factors</li>
                <li><strong>Click any state</strong> in the rankings to instantly jump to its data</li>
                <li><strong>Compare states</strong> side-by-side using the Compare tab</li>
              </ul>
            </div>
            
            <div class="popup-section">
              <h4>Understanding the Numbers</h4>
              <p><strong>Mobility Score (Percentile):</strong> If a state has a 46th percentile mobility score, it means children from low-income families in that state typically reach the 46th percentile of national income as adults.</p>
              <p><strong>Higher = Better:</strong> Higher percentiles mean better opportunities for upward mobility.</p>
            </div>
            
            <div class="popup-section">
              <h4>What Each Tab Shows</h4>
              <ul>
                <li><strong>Overview:</strong> Overall mobility score and key factors</li>
                <li><strong>Race:</strong> How mobility differs across racial groups</li>
                <li><strong>Family:</strong> Impact of household structure on mobility</li>
                <li><strong>Education:</strong> Role of education in economic mobility</li>
                <li><strong>Compare:</strong> Side-by-side state comparisons</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="explorer-nav">
          <div class="explorer-tabs">
            ${this.TABS.map(t => `<button class="explorer-tab ${t.id === this.currentTab ? 'active' : ''}" data-tab="${t.id}">${t.icon} ${t.label}</button>`).join('')}
          </div>
          <div class="state-selector-wrapper">
            <span class="state-selector-label">Select State:</span>
            <select id="mainStateSelector" class="explorer-state-sel"></select>
          </div>
        </div>
        <div class="explorer-content" id="explorerContent"></div>
      </div>
    `;
  }
};

// Auto-initialize when document is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("■ Mobility Explorer module loaded");
});