// Smooth scroll
function scrollToScreen(screenId) {
    // Handle both number and string inputs
    let targetScreen;
    
    if (typeof screenId === 'number') {
        targetScreen = document.getElementById(`screen${screenId}`);
    } else {
        targetScreen = document.getElementById(screenId);
    }
    
    if (targetScreen) {
        targetScreen.scrollIntoView({ behavior: "smooth" });
    }
}
function shareResults() {
  if (navigator.share) {
    navigator.share({
      title: "Economic Mobility Explorer",
      text: "I just explored economic mobility data!",
      url: window.location.href,
    });
  } else {
    alert("Share this link:\n" + window.location.href);
  }
}

const MeetCase = {
  contextData: null,
  stateName: null,
  
  showNode: function(type, caseProfile, stateName) {
      this.contextData = caseProfile;
      this.stateName = stateName;
      
      const row = document.getElementById(`row-${type}`);
      if (!row) return;
      
      const rect = row.getBoundingClientRect();
      const cardRect = document.getElementById('case-card').getBoundingClientRect();
      
      // Create node
      const node = document.createElement('div');
      node.className = 'context-node';
      node.id = `node-${type}`;
      node.textContent = this.getNodeIcon(type);
      
      // Position relative to card
      node.style.left = (rect.right - cardRect.left + 20) + 'px';
      node.style.top = (rect.top - cardRect.top + rect.height / 2 - 20) + 'px';
      
      document.getElementById('case-card').appendChild(node);
      
      // Animate in
      setTimeout(() => node.classList.add('active'), 50);
      
      // Create connecting line
      setTimeout(() => this.createLine(row, node), 300);
      
      // Add click handler
      node.addEventListener('click', () => this.showContext(type));
  },
  
  getNodeIcon: function(type) {
      const icons = {
          location: '📍',
          demographics: '👤',
          family: '💰',
          education: '🎓'
      };
      return icons[type] || '•';
  },
  
  createLine: function(fromElement, toElement) {
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();
      const cardRect = document.getElementById('case-card').getBoundingClientRect();
      
      const line = document.createElement('div');
      line.className = 'context-line';
      
      const startX = fromRect.right - cardRect.left;
      const startY = fromRect.top - cardRect.top + fromRect.height / 2;
      const endX = toRect.left - cardRect.left;
      const endY = toRect.top - cardRect.top + toRect.height / 2;
      
      const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
      
      line.style.left = startX + 'px';
      line.style.top = startY + 'px';
      line.style.width = length + 'px';
      line.style.transform = `rotate(${angle}deg)`;
      
      document.getElementById('case-card').appendChild(line);
  },
  
  showContext: function(type) {
      const panel = document.getElementById('contextPanel');
      const icon = document.getElementById('panelIcon');
      const title = document.getElementById('panelTitle');
      const content = document.getElementById('panelContent');
      
      if (!panel || !this.contextData) return;
      
      // Update panel content
      icon.textContent = this.getNodeIcon(type);
      title.textContent = this.getContextTitle(type);
      content.innerHTML = this.getContextContent(type);
      
      // Show panel
      panel.classList.add('visible');
      
      // Highlight active node
      document.querySelectorAll('.context-node').forEach(n => {
          n.style.background = '#ffb6c9';
      });
      const activeNode = document.getElementById(`node-${type}`);
      if (activeNode) {
          activeNode.style.background = '#ff92b6';
      }
  },
  
  getContextTitle: function(type) {
      const titles = {
          location: 'Geographic Context',
          demographics: 'Demographic Background',
          family: 'Family Economic Status',
          education: 'Educational Environment'
      };
      return titles[type] || 'Context';
  },
  
  getContextContent: function(type) {
      const data = this.contextData;
      
      const contexts = {
          location: `
              <div class="context-insight-box">
                  <strong style="color: #d75b87;">Where You Grow Up Matters</strong><br><br>
                  ${data.locationContext}
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">AREA TYPE</div>
                  <div class="context-data-value">${data.areaType}</div>
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">POPULATION DENSITY</div>
                  <div class="context-data-value">${data.popDensity} people/sq mi</div>
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">LOCATION</div>
                  <div class="context-data-value">${data.county}, ${this.stateName}</div>
              </div>
          `,
          demographics: `
              <div class="context-insight-box">
                  <strong style="color: #d75b87;">Race & Gender Impact Mobility</strong><br><br>
                  Even with similar starting points, systemic barriers and opportunities differ significantly by race and gender. Research shows these factors independently affect economic outcomes.
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">RACE</div>
                  <div class="context-data-value">${data.race}</div>
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">GENDER</div>
                  <div class="context-data-value">${data.gender}</div>
              </div>
          `,
          family: `
              <div class="context-insight-box">
                  <strong style="color: #d75b87;">Starting Point Shapes Trajectory</strong><br><br>
                  ${data.familyContext}
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">PARENT INCOME LEVEL</div>
                  <div class="context-data-value">${data.parentIncomeLevel}</div>
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">INCOME BRACKET</div>
                  <div class="context-data-value">${data.parentIncomeBracket}</div>
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">MEDIAN HOUSEHOLD INCOME</div>
                  <div class="context-data-value">${data.medianIncome}</div>
              </div>
          `,
          education: `
              <div class="context-insight-box">
                  <strong style="color: #d75b87;">Education Creates Pathways</strong><br><br>
                  ${data.communityContext}
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">PARENT EDUCATION</div>
                  <div class="context-data-value">${data.parentEducation}</div>
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">COLLEGE ATTENDANCE RATE</div>
                  <div class="context-data-value">${data.collegeRate}</div>
              </div>
              <div class="context-data-point">
                  <div class="context-data-label">POVERTY RATE</div>
                  <div class="context-data-value">${data.povertyRate}</div>
              </div>
          `
      };
      
      return contexts[type] || 'No context available';
  },
  
  closePanel: function() {
      const panel = document.getElementById('contextPanel');
      if (panel) {
          panel.classList.remove('visible');
      }
      
      // Reset node colors
      document.querySelectorAll('.context-node').forEach(n => {
          n.style.background = '#ffb6c9';
      });
  }
};

const App = {
    init: function () {
        this.renderLandingScreen();              // 1
        this.renderIntroStory();                
        this.renderWhatIsScreen();               // 2
        this.renderMountainIntro();              
        this.renderMountainScreen();             // 3
        this.renderCaseIntro();                  
        this.renderInstructionScreen();          // 4
        this.renderMeetCaseScreen();             // 5
        this.renderPredictionScreen();           // 6
        // Dashboard is in HTML
        this.renderForcesIntro();                
        AvatarIntegration.renderAvatarBuilder(); // 7
        this.renderClosingReflection();          
        this.setupProgressBar();
        this.setupIntersectionObserver();
    },
    
  // ⭐ SCREEN 1 — LANDING
  renderLandingScreen: function () {
    const screen1 = document.getElementById("screen1");
    if (!screen1) return;

    const title = "ECONOMIC STORIES BEHIND EVERY PIXEL";

    const animatedHTML = title
      .split("")
      .map((letter, i) =>
        letter === " "
          ? `<span style="margin:12px"></span>`
          : `<span style="--i:${i}">${letter}</span>`
      )
      .join("");

    screen1.innerHTML = `
        <div class="landing-overlay"></div>
        <div class="landing-content">
            <h1 class="animated-letter-title">${animatedHTML}</h1>
            <button class="pixel-button" onclick="scrollToScreen('intro-story')">
                <span class="pixel-button-text">Start Exploring</span>
                <span class="pixel-button-corners"></span>
            </button>
        </div>
    `;
  },


  renderWhatIsScreen: function () {
    const screen = document.getElementById("screen1-5");
    if (!screen) return;

    screen.innerHTML = `
        <div style="width: 95%; max-width: 1600px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 8px solid #8b4560;">
            <!-- Header -->
            <div style="background: #9B7373; color: #fff; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 4px solid #8b4560;">
                <span style="font-family: 'Press Start 2P'; font-size: 18px;">WHAT IS ECONOMIC MOBILITY?</span>
            </div>
            
            <!-- Body -->
            <div style="padding: 50px 60px; background: #fff; border-radius: 0 0 12px 12px;">
                <!-- Definition Section -->
                <div class="fade-in-section" style="animation-delay: 0.2s; margin-bottom: 40px;">
                    <p class="mobility-definition-text">
                        Economic mobility measures whether children earn more than their parents.
                    </p>
                    
                    <p class="mobility-example-text">
                        <strong>Example:</strong> If your parents were in the bottom 25% of earners, 
                        what are <span class="highlight">YOUR CHANCES</span> of reaching the 
                        <span class="highlight">TOP 20%</span> of earners in your lifetime?
                    </p>
                </div>

                <!-- Factors Title -->
                <div style="width: 100%; text-align: center; margin-bottom: 40px;" class="fade-in-section" style="animation-delay: 0.35s;">
                    <h3 class="factors-section-title">FACTORS WE'LL EXPLORE</h3>
                </div>

                <!-- Factors Cards -->
                <div class="fade-in-section" style="animation-delay: 0.4s; width: 100%; display: flex; justify-content: center; margin-bottom: 50px;">
                    <div class="factor-cards-horizontal">
                        <!-- 1. Income -->
                        <div class="factor-card-h" style="animation-delay: 0.5s;">
                            <svg class="factor-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="35" fill="#8b4560" stroke="#6c3a4d" stroke-width="3"/>
                                <text x="50" y="63" font-family="Press Start 2P" font-size="28" fill="#fff5e1" text-anchor="middle">$</text>
                            </svg>
                            <div class="factor-title-h">Income</div>
                            <div class="factor-desc-h">Parent and individual income levels</div>
                        </div>
                        
                        <!-- 2. Time Period -->
                        <div class="factor-card-h" style="animation-delay: 0.6s;">
                            <svg class="factor-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="30" fill="none" stroke="#8b4560" stroke-width="4"/>
                                <line x1="50" y1="50" x2="50" y2="30" stroke="#d75b87" stroke-width="4"/>
                                <line x1="50" y1="50" x2="65" y2="55" stroke="#d75b87" stroke-width="4"/>
                                <circle cx="50" cy="50" r="5" fill="#6c3a4d"/>
                            </svg>
                            <div class="factor-title-h">Time Period</div>
                            <div class="factor-desc-h">Mobility has changed over decades</div>
                        </div>
                        
                        <!-- 3. Housing -->
                        <div class="factor-card-h" style="animation-delay: 0.7s;">
                            <svg class="factor-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <rect x="25" y="45" width="50" height="40" fill="#8b4560"/>
                                <polygon points="50,15 15,45 85,45" fill="#d75b87"/>
                                <rect x="42" y="60" width="16" height="25" fill="#6c3a4d"/>
                                <rect x="32" y="52" width="10" height="10" fill="#fff5e1"/>
                                <rect x="58" y="52" width="10" height="10" fill="#fff5e1"/>
                            </svg>
                            <div class="factor-title-h">Housing</div>
                            <div class="factor-desc-h">Rent and buying price affect mobility</div>
                        </div>
                        
                        <!-- 4. Geography -->
                        <div class="factor-card-h" style="animation-delay: 0.8s;">
                            <svg class="factor-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <rect x="20" y="60" width="20" height="30" fill="#8b4560"/>
                                <rect x="45" y="45" width="20" height="45" fill="#8b4560"/>
                                <rect x="70" y="30" width="20" height="60" fill="#d75b87"/>
                                <rect x="15" y="35" width="15" height="20" fill="#6c3a4d"/>
                                <rect x="40" y="25" width="15" height="15" fill="#6c3a4d"/>
                            </svg>
                            <div class="factor-title-h">Geography</div>
                            <div class="factor-desc-h">Where you grow up shapes opportunities</div>
                        </div>
                        
                        <!-- 5. Race -->
                        <div class="factor-card-h" style="animation-delay: 0.9s;">
                            <svg class="factor-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="35" cy="30" r="12" fill="#8b4560"/>
                                <path d="M 35 45 L 25 70 L 35 70 L 35 90 L 25 90 M 35 45 L 45 70 L 35 70" stroke="#8b4560" stroke-width="4" fill="none"/>
                                <circle cx="65" cy="30" r="12" fill="#d75b87"/>
                                <path d="M 65 45 L 55 70 L 65 70 L 65 90 L 55 90 M 65 45 L 75 70 L 65 70" stroke="#d75b87" stroke-width="4" fill="none"/>
                            </svg>
                            <div class="factor-title-h">Race</div>
                            <div class="factor-desc-h">Systemic barriers affect mobility</div>
                        </div>
                        
                        <!-- 6. Education -->
                        <div class="factor-card-h" style="animation-delay: 1s;">
                            <svg class="factor-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <rect x="30" y="50" width="40" height="35" fill="#8b4560"/>
                                <polygon points="50,20 20,50 80,50" fill="#d75b87"/>
                                <rect x="45" y="60" width="10" height="15" fill="#6c3a4d"/>
                                <circle cx="50" cy="40" r="6" fill="#fff"/>
                            </svg>
                            <div class="factor-title-h">Education</div>
                            <div class="factor-desc-h">Higher education increases chances</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
},

  // ⭐ SCREEN 2 — PIXEL GAME INSTRUCTIONS
  renderInstructionScreen: function () {
    const screen2 = document.getElementById("screen2");
    if (!screen2) return;

    screen2.innerHTML = `
        <div class="pixel-game-frame">
            <div class="pixel-frame-header">
                <span>WHAT YOU'LL DO</span>
            </div>
            <div class="pixel-frame-inner">
                <!-- Progress Bar -->
                <div class="instruction-progress-container">
                    <div class="instruction-progress-bar" id="instructionProgressBar"></div>
                    <div class="progress-label" id="progressLabel">Step 1 of 5</div>
                </div>

                <!-- Mission Overview (Step 0) -->
                <div class="instruction-slide active" id="slide-0">
                    <div class="mission-content">
                        <h3 class="mission-title">YOUR MISSION</h3>
                        <p class="mission-text">
                            You'll predict someone's economic future based on their background. 
                            Then, you'll discover the <strong style="color: #d75b87;">REAL DATA</strong> 
                            and see how close you were!
                        </p>
                    </div>
                </div>

                <!-- Step 1 -->
                <div class="instruction-slide" id="slide-1">
                    <div class="slide-content">
                        <div class="slide-visual">
                            <img src="asset/avatar_female_asian.png" class="step-icon-large"/>
                        </div>
                        <h3 class="slide-title">Meet a Person</h3>
                        <p class="slide-description">
                            You'll see someone's background: their <strong>race, location, 
                            education level, and family income</strong>. Take a moment to 
                            understand their starting point.
                        </p>
                    </div>
                </div>

                <!-- Step 2 -->
                <div class="instruction-slide" id="slide-2">
                    <div class="slide-content">
                        <div class="slide-visual">
                            <svg class="step-icon-large" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="35" fill="none" stroke="#8b4560" stroke-width="4"/>
                                <path d="M 50 50 L 50 25" stroke="#d75b87" stroke-width="5" stroke-linecap="round"/>
                                <circle cx="50" cy="50" r="6" fill="#6c3a4d"/>
                            </svg>
                        </div>
                        <h3 class="slide-title">Make Your Prediction</h3>
                        <p class="slide-description">
                            Use the dial to guess: <strong>What % chance</strong> does 
                            this person have of reaching the <strong style="color: #d75b87;">top 20% of earners</strong> 
                            (making $100K+ per year)?
                        </p>
                    </div>
                </div>

                <!-- Step 3 -->
                <div class="instruction-slide" id="slide-3">
                    <div class="slide-content">
                        <div class="slide-visual">
                            <svg class="step-icon-large" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <rect x="20" y="60" width="15" height="30" fill="#8b4560" rx="2"/>
                                <rect x="42.5" y="45" width="15" height="45" fill="#d75b87" rx="2"/>
                                <rect x="65" y="30" width="15" height="60" fill="#6c3a4d" rx="2"/>
                            </svg>
                        </div>
                        <h3 class="slide-title">Discover Reality</h3>
                        <p class="slide-description">
                            See the <strong>actual data</strong> and compare it to your guess. 
                            Were you surprised? You'll learn how factors like geography 
                            and race affect economic outcomes.
                        </p>
                    </div>
                </div>

                <!-- Step 4 -->
                <div class="instruction-slide" id="slide-4">
                    <div class="slide-content">
                        <div class="slide-visual">
                            <svg class="step-icon-large" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="30" r="15" fill="#8b4560"/>
                                <path d="M 50 48 L 35 85 L 50 85 L 50 95" stroke="#8b4560" stroke-width="5" fill="none"/>
                                <path d="M 50 48 L 65 85 L 50 85" stroke="#8b4560" stroke-width="5" fill="none"/>
                            </svg>
                        </div>
                        <h3 class="slide-title">Build Your Avatar</h3>
                        <p class="slide-description">
                            Create your own scenario by choosing <strong>location, race, 
                            education, and income</strong>. See how different combinations 
                            affect economic mobility.
                        </p>
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="instruction-nav">
                    <button class="nav-btn back-btn" id="instructionBackBtn" disabled>
                        ← BACK
                    </button>
                    <button class="nav-btn next-btn" id="instructionNextBtn">
                        NEXT →
                    </button>
                    <button class="nav-btn start-btn" id="instructionStartBtn" style="display: none;">
                        START THE JOURNEY ▶
                    </button>
                </div>
            </div>
        </div>
    `;

    // Initialize instruction navigation
    this.initInstructionNavigation();
  },

// Navigation Logic for Instructions
initInstructionNavigation: function() {
  let currentSlide = 0;
  const totalSlides = 5; // 0 (mission) + 4 steps
  
  const backBtn = document.getElementById('instructionBackBtn');
  const nextBtn = document.getElementById('instructionNextBtn');
  const startBtn = document.getElementById('instructionStartBtn');
  const progressBar = document.getElementById('instructionProgressBar');
  const progressLabel = document.getElementById('progressLabel');

  const updateSlide = () => {
      // Hide all slides
      document.querySelectorAll('.instruction-slide').forEach(slide => {
          slide.classList.remove('active');
      });
      
      // Show current slide with animation
      const currentSlideEl = document.getElementById(`slide-${currentSlide}`);
      currentSlideEl.classList.add('active');
      
      // Update progress bar
      const progress = (currentSlide / (totalSlides - 1)) * 100;
      progressBar.style.width = progress + '%';
      
      // Update progress label
      if (currentSlide === 0) {
          progressLabel.textContent = 'Introduction';
      } else {
          progressLabel.textContent = `Step ${currentSlide} of 4`;
      }
      
      // Update button states
      backBtn.disabled = currentSlide === 0;
      
      if (currentSlide === totalSlides - 1) {
          nextBtn.style.display = 'none';
          startBtn.style.display = 'inline-block';
      } else {
          nextBtn.style.display = 'inline-block';
          startBtn.style.display = 'none';
      }
  };

  // Back button
  backBtn.addEventListener('click', () => {
      if (currentSlide > 0) {
          currentSlide--;
          updateSlide();
      }
  });

  // Next button
  nextBtn.addEventListener('click', () => {
      if (currentSlide < totalSlides - 1) {
          currentSlide++;
          updateSlide();
      }
  });

  // Start button
  startBtn.addEventListener('click', () => {
      scrollToScreen(3);
  });

  // Initialize
  updateSlide();
},


  // SCREEN 3 — MEET CASE
// In renderMeetCaseScreen, after generating the case:

renderMeetCaseScreen: async function () {
  const screen3 = document.getElementById("screen3");
  if (!screen3) {
      console.error("❌ Screen3 element not found!");
      return;
  }

  try {
      console.log("🚀 Loading atlas data for Screen 3...");
      const atlasData = await loadAtlasData();

      if (!atlasData || atlasData.length === 0) {
          console.error("❌ No atlas data loaded");
          screen3.innerHTML = `<p style="text-align:center; color: #d75b87;">Failed to load data. Please refresh the page.</p>`;
          return;
      }

      console.log(`✅ Loaded ${atlasData.length} records for Screen 3`);
      
      // Generate case profile
      const caseProfile = pickRandomCase(atlasData);

      if (!caseProfile) {
          console.error("❌ Failed to generate case profile");
          screen3.innerHTML = `<p style="text-align:center; color: #d75b87;">Failed to generate case profile. Please refresh the page.</p>`;
          return;
      }

      console.log("✅ Case profile generated:", caseProfile);
      console.log("📊 mobilityOutcome:", caseProfile.mobilityOutcome, "Type:", typeof caseProfile.mobilityOutcome);

      // ✅ CRITICAL: Store as JSON string
      const caseJSON = JSON.stringify(caseProfile);
      localStorage.setItem("currentCase", caseJSON);
      
      // ✅ Verify storage immediately
      const verifyStored = localStorage.getItem("currentCase");
      const verifyParsed = JSON.parse(verifyStored);
      
      console.log("=== STORAGE VERIFICATION ===");
      console.log("Original mobilityOutcome:", caseProfile.mobilityOutcome);
      console.log("Stored and retrieved:", verifyParsed.mobilityOutcome);
      console.log("Type after storage:", typeof verifyParsed.mobilityOutcome);
      
      if (isNaN(verifyParsed.mobilityOutcome)) {
          console.error("❌ CRITICAL: mobilityOutcome is NaN after storage!");
      } else {
          console.log("✅ Storage verification passed!");
      }

      // State names mapping
      const stateNames = {
          "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
          "06": "California", "08": "Colorado", "09": "Connecticut",
          "10": "Delaware", "11": "District of Columbia", "12": "Florida",
          "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
          "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky",
          "22": "Louisiana", "23": "Maine", "24": "Maryland", "25": "Massachusetts",
          "26": "Michigan", "27": "Minnesota", "28": "Mississippi",
          "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada",
          "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
          "36": "New York", "37": "North Carolina", "38": "North Dakota",
          "39": "Ohio", "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania",
          "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota",
          "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont",
          "51": "Virginia", "53": "Washington", "54": "West Virginia",
          "55": "Wisconsin", "56": "Wyoming"
      };

      const stateName = stateNames[caseProfile.stateFIPS] || caseProfile.stateFIPS;

      screen3.innerHTML = `
          <div class="pixel-id-card simple" id="case-card">
              <div class="pixel-id-header">
                  <span class="pixel-id-title">MEET YOUR CASE</span>
              </div>

              <div class="context-prompt" id="contextPrompt">
                  <div class="context-prompt-text">
                      CLICK TO<br>EXPLORE<br>CONTEXT
                  </div>
              </div>

              <div class="pixel-id-body simple">
                  <div class="pixel-id-photo large" id="avatarPhoto"
                      style="background-image: url('asset/${caseProfile.avatarImage}');
                              background-size: cover;
                              background-position: center;"></div>

                  <div class="pixel-id-fields minimal">
                      <div class="pixel-row large" id="row-location">
                          <b>Location:</b> ${caseProfile.county}, ${stateName}
                      </div>
                      <div class="pixel-row large" id="row-demographics">
                          <b>Demographics:</b> ${caseProfile.race} ${caseProfile.gender}
                      </div>
                      <div class="pixel-row large" id="row-family">
                          <b>Family Income:</b> ${caseProfile.parentIncomeLevel}
                      </div>
                      <div class="pixel-row large" id="row-education">
                          <b>Parent Education:</b> ${caseProfile.parentEducation}
                      </div>
                  </div>
              </div>

              <div class="case-button-group">
                <button onclick="App.generateNewCase()" class="pixel-id-button-large secondary-button">
                    ↻ Generate New Case
                </button>
                <button onclick="scrollToScreen(4)" class="pixel-id-button-large">
                    Make Your Prediction →
                </button>
</div>
          </div>

          <div class="context-panel" id="contextPanel">
              <div class="context-panel-header">
                  <div class="context-panel-title">
                      <span id="panelIcon"></span>
                      <span id="panelTitle">Context</span>
                  </div>
                  <div class="close-panel" onclick="MeetCase.closePanel()">×</div>
              </div>
              <div class="context-panel-content" id="panelContent">
                  Click on a node to learn more
              </div>
          </div>
      `;

      this.initContextExploration(caseProfile, stateName);
      console.log("✅ Screen 3 rendered successfully");
  } catch (error) {
      console.error("❌ Error rendering Screen 3:", error);
      screen3.innerHTML = `<div class="pixel-id-card"><h2 style="text-align:center; color:#d75b87;">Error Loading Case</h2><p style="text-align:center;">Please refresh the page and try again.</p></div>`;
  }
},


generateNewCase: async function() {
    console.log('🔄 Generating new case...');
    
    try {
        // Load atlas data
        const atlasData = await loadAtlasData();
        
        if (!atlasData || atlasData.length === 0) {
            alert('Failed to load data. Please refresh the page.');
            return;
        }
        
        // Generate new case profile
        const caseProfile = pickRandomCase(atlasData);
        
        if (!caseProfile) {
            alert('Failed to generate case profile. Please try again.');
            return;
        }
        
        console.log('✅ New case generated:', caseProfile);
        console.log('📊 mobilityOutcome:', caseProfile.mobilityOutcome);
        
        // Store new case
        const caseJSON = JSON.stringify(caseProfile);
        localStorage.setItem("currentCase", caseJSON);
        
        // Verify storage
        const verifyStored = localStorage.getItem("currentCase");
        const verifyParsed = JSON.parse(verifyStored);
        console.log('✅ Storage verified:', verifyParsed.mobilityOutcome);
        
        // State names mapping
        const stateNames = {
            "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
            "06": "California", "08": "Colorado", "09": "Connecticut",
            "10": "Delaware", "11": "District of Columbia", "12": "Florida",
            "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
            "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky",
            "22": "Louisiana", "23": "Maine", "24": "Maryland", "25": "Massachusetts",
            "26": "Michigan", "27": "Minnesota", "28": "Mississippi",
            "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada",
            "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
            "36": "New York", "37": "North Carolina", "38": "North Dakota",
            "39": "Ohio", "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania",
            "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota",
            "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont",
            "51": "Virginia", "53": "Washington", "54": "West Virginia",
            "55": "Wisconsin", "56": "Wyoming"
        };
        
        const stateName = stateNames[caseProfile.stateFIPS] || caseProfile.stateFIPS;
        
        // Update the UI with fade animation
        const card = document.getElementById('case-card');
        const photo = document.getElementById('avatarPhoto');
        const contextPrompt = document.getElementById('contextPrompt');
        
        // Fade out
        if (card) card.style.opacity = '0';
        if (contextPrompt) contextPrompt.style.display = 'none';
        
        setTimeout(() => {
            // Update avatar
            if (photo) {
                photo.style.backgroundImage = `url('asset/${caseProfile.avatarImage}')`;
            }
            
            // Update text fields
            const locationRow = document.getElementById('row-location');
            const demographicsRow = document.getElementById('row-demographics');
            const familyRow = document.getElementById('row-family');
            const educationRow = document.getElementById('row-education');
            
            if (locationRow) {
                locationRow.innerHTML = `<b>Location:</b> ${caseProfile.county}, ${stateName}`;
            }
            if (demographicsRow) {
                demographicsRow.innerHTML = `<b>Demographics:</b> ${caseProfile.race} ${caseProfile.gender}`;
            }
            if (familyRow) {
                familyRow.innerHTML = `<b>Family Income:</b> ${caseProfile.parentIncomeLevel}`;
            }
            if (educationRow) {
                educationRow.innerHTML = `<b>Parent Education:</b> ${caseProfile.parentEducation}`;
            }
            
            // Re-initialize context exploration
            this.initContextExploration(caseProfile, stateName);
            
            // Fade in
            if (card) card.style.opacity = '1';
            
            console.log('✅ UI updated successfully');
        }, 300);
        
    } catch (error) {
        console.error('❌ Error generating new case:', error);
        alert('An error occurred. Please try again.');
    }
},


revealImprovedResult: function(guessValue) {
  console.log("=== REVEAL START ===");
  
  const storedData = localStorage.getItem('currentCase');
  if (!storedData) {
      alert("Error: No case data found");
      return;
  }
  
  const caseProfile = JSON.parse(storedData);
  const actualValue = parseFloat(caseProfile.mobilityOutcome);
  
  if (isNaN(actualValue)) {
      alert("Error: Invalid mobility data");
      return;
  }
  
  const difference = Math.abs(guessValue - actualValue);
  
  // Update title
  const title = document.getElementById('prediction-title');
  if (title) title.textContent = 'THE REALITY';
  
  // Show guess marker
  const guessMarker = document.getElementById('guess-marker');
  if (guessMarker) {
      const guessAngle = (guessValue / 100) * 180 - 90;
      guessMarker.setAttribute('transform', `rotate(${guessAngle} 250 250)`);
      guessMarker.setAttribute('opacity', '0.6');
  }
  
  // Switch views
  setTimeout(() => {
      document.getElementById('prediction-only-view')?.classList.remove('active');
      document.getElementById('comparison-view')?.classList.add('active');
      
      const finalGuess = document.getElementById('final-guess-value');
      const actualDisplay = document.getElementById('actual-value');
      
      if (finalGuess) finalGuess.textContent = Math.round(guessValue);
      if (actualDisplay) actualDisplay.textContent = Math.round(actualValue);
      
      this.animateNeedleToActual(guessValue, actualValue);
      
      setTimeout(() => {
          const badge = document.getElementById('difference-badge');
          if (badge) {
              const diffText = difference < 5 ? 'Very close!' : 
                              difference < 15 ? 'Pretty close!' :
                              difference < 30 ? 'Some gap' : 'Big difference';
              badge.textContent = `${diffText} — ${Math.round(difference)} points apart`;
          }
      }, 1500);
      
      setTimeout(() => this.showImprovedFeedback(difference, guessValue, actualValue), 2000);
      setTimeout(() => document.getElementById('post-reveal-buttons')?.classList.add('visible'), 2500);
  }, 300);
},

animateNeedleToActual: function(startValue, endValue) {
  const needle = document.getElementById('speedometer-needle');
  const actualDisplay = document.getElementById('actual-value');
  
  if (!needle) return;
  
  const valueToAngle = (value) => (value / 100) * 180 - 90;
  const startAngle = valueToAngle(startValue);
  const endAngle = valueToAngle(endValue);
  const duration = 2000;
  const startTime = performance.now();
  
  let needleColor = "#e74c3c";
  if (endValue >= 25 && endValue < 60) needleColor = "#f39c12";
  else if (endValue >= 60) needleColor = "#2ecc71";
  
  needle.querySelector('line')?.setAttribute('stroke', needleColor);
  needle.querySelector('polygon')?.setAttribute('fill', needleColor);
  
  const easeOutElastic = (x) => {
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 :
          Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  };
  
  const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutElastic(progress);
      
      const currentAngle = startAngle + (endAngle - startAngle) * easedProgress;
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      
      needle.setAttribute('transform', `rotate(${currentAngle} 250 250)`);
      if (actualDisplay) actualDisplay.textContent = Math.round(currentValue);
      
      if (progress < 1) {
          requestAnimationFrame(animate);
      }
  };
  
  requestAnimationFrame(animate);
},

showImprovedFeedback: function(difference, guessValue, actualValue) {
  const feedbackSection = document.getElementById('feedback-section');
  const message = document.getElementById('feedback-message');
  const explanation = document.getElementById('feedback-explanation');
  
  if (!feedbackSection || !message || !explanation) {
      console.error("Feedback elements not found");
      return;
  }
  
  let messageText, explanationText;
  
  if (difference <= 5) {
      messageText = 'Incredibly accurate prediction!';
      explanationText = `You predicted ${Math.round(guessValue)} and actual is ${Math.round(actualValue)}. Strong grasp of mobility!`;
  } else if (difference <= 15) {
      messageText = 'Great prediction!';
      explanationText = `Close! You guessed ${Math.round(guessValue)}, reality is ${Math.round(actualValue)}.`;
  } else if (difference <= 30) {
      messageText = 'Reality differs from prediction';
      const direction = actualValue > guessValue ? 'higher' : 'lower';
      explanationText = `Actual (${Math.round(actualValue)}) is ${direction} than your guess (${Math.round(guessValue)}).`;
  } else {
      messageText = 'Significant gap!';
      const direction = actualValue > guessValue ? 'much higher' : 'much lower';
      explanationText = `Reality (${Math.round(actualValue)}) is ${direction} than predicted (${Math.round(guessValue)}).`;
  }
  
  message.textContent = messageText;
  explanation.textContent = explanationText;
  feedbackSection.classList.add('visible');
},

// Replace showImprovedFeedback with this:
showImprovedFeedback: function(difference, guessValue, actualValue) {
  console.log("=== SHOW FEEDBACK START ===");
  console.log("Difference:", difference);
  console.log("Guess:", guessValue);
  console.log("Actual:", actualValue);
  
  const feedbackSection = document.getElementById('feedback-section');
  const message = document.getElementById('feedback-message');
  const explanation = document.getElementById('feedback-explanation');
  
  if (!feedbackSection || !message || !explanation) {
      console.error("❌ Feedback elements not found!");
      console.log("feedbackSection:", feedbackSection);
      console.log("message:", message);
      console.log("explanation:", explanation);
      return;
  }
  
  let messageText, explanationText;
  
  if (difference <= 5) {
      messageText = 'Incredibly accurate prediction!';
      explanationText = `You predicted ${Math.round(guessValue)} and the actual data shows ${Math.round(actualValue)}. You have a strong grasp of how these factors affect economic mobility.`;
  } else if (difference <= 15) {
      messageText = 'Great prediction!';
      explanationText = `You were close! You predicted ${Math.round(guessValue)}, and the reality is ${Math.round(actualValue)}. Small gaps like this show how complex mobility factors can be.`;
  } else if (difference <= 30) {
      messageText = 'Reality differs from your prediction';
      const direction = actualValue > guessValue ? 'higher' : 'lower';
      explanationText = `The actual mobility (${Math.round(actualValue)}) is ${direction} than your prediction (${Math.round(guessValue)}). Geography, race, and family resources interact in surprising ways.`;
  } else {
      messageText = 'Significant gap between prediction and reality';
      const direction = actualValue > guessValue ? 'much higher' : 'much lower';
      explanationText = `The actual outcome (${Math.round(actualValue)}) is ${direction} than you predicted (${Math.round(guessValue)}). This reveals how systemic factors create bigger barriers or advantages than we often expect.`;
  }
  
  console.log("Setting message:", messageText);
  console.log("Setting explanation:", explanationText);
  
  try {
      message.textContent = messageText;
      explanation.textContent = explanationText;
      feedbackSection.classList.add('visible');
      console.log("✅ Feedback displayed successfully");
  } catch (e) {
      console.error("❌ Error setting feedback text:", e);
  }
},

initContextExploration: function(caseProfile, stateName) {
    const contextPrompt = document.getElementById('contextPrompt');
    const card = document.getElementById('case-card');
    
    if (!contextPrompt || !card) return;

    contextPrompt.addEventListener('click', function() {
        // Hide prompt with fade out
        contextPrompt.style.opacity = '0';
        contextPrompt.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            contextPrompt.style.display = 'none';
        }, 300);
        
        // Add exploration mode
        card.classList.add('exploration-mode');
        
        // Show context nodes with delays
        setTimeout(() => MeetCase.showNode('location', caseProfile, stateName), 200);
        setTimeout(() => MeetCase.showNode('demographics', caseProfile, stateName), 400);
        setTimeout(() => MeetCase.showNode('family', caseProfile, stateName), 600);
        setTimeout(() => MeetCase.showNode('education', caseProfile, stateName), 800);
    });
},



  // SCREEN 4 — SPEEDOMETER PREDICTION + REVEAL (COMBINED)
  renderPredictionScreen: function () {
    const screen4 = document.getElementById("screen4");
    if (!screen4) return;

    screen4.innerHTML = `
        <div class="prediction-unified-container">
            <div class="prediction-card">
                <div class="prediction-header">
                    <span class="prediction-title" id="prediction-title">MAKE YOUR PREDICTION</span>
                </div>

                <div class="prediction-content">
                    <div class="prediction-left-panel">
                        <!-- Simplified question with inline help -->
                        <div class="prediction-question-box simplified">
                            <div class="question-badge">ECONOMIC MOBILITY</div>
                            <h3 class="question-title concise">
                                Where will this person end up on the income ladder?
                            </h3>
                            
                            <!-- Inline help button -->
                            <button class="inline-help-button" id="help-button">
                                <span class="help-text">Click here for more context</span>
                            </button>
                        </div>

                        <!-- Value display -->
                        <div class="value-display-area" id="value-display-area">
                            <div id="prediction-only-view" class="value-view active">
                                <div class="current-prediction">
                                    <div class="value-label">YOUR PREDICTION</div>
                                    <div class="value-display-wrapper">
                                        <div class="value-number" id="speedometer-display">50</div>
                                        <div class="value-context">
                                            <div class="percentile-label">Percentile</div>
                                            <div id="mobility-descriptor" class="mobility-descriptor">Middle Class</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div id="comparison-view" class="value-view">
                                <div class="comparison-layout">
                                    <div class="comparison-box guess-box">
                                        <div class="comparison-label">YOUR GUESS</div>
                                        <div class="comparison-number" id="final-guess-value">50</div>
                                        <div class="comparison-sublabel">percentile</div>
                                    </div>
                                    
                                    <div class="comparison-arrow">→</div>
                                    
                                    <div class="comparison-box reality-box">
                                        <div class="comparison-label">ACTUAL DATA</div>
                                        <div class="comparison-number" id="actual-value">0</div>
                                        <div class="comparison-sublabel">percentile</div>
                                    </div>
                                </div>
                                
                                <div class="difference-badge" id="difference-badge"></div>

                                <!-- Enhanced context explanation -->
                                <div class="result-context-box" id="result-context" style="display: none;">
                                    <div class="context-header">
                                        <span class="context-icon">💡</span>
                                        <span>Why This Result?</span>
                                    </div>
                                    <div class="context-text" id="context-explanation"></div>
                                    <div class="context-factors" id="context-factors"></div>
                                </div>
                            </div>
                        </div>

                        <div id="feedback-section" class="feedback-section">
                            <div class="feedback-message" id="feedback-message"></div>
                            <div class="feedback-explanation" id="feedback-explanation"></div>
                        </div>

                        <div class="action-buttons">
                            <button id="reveal-btn" class="prediction-action-btn primary">
                                REVEAL ACTUAL DATA →
                            </button>
                            
                            <div id="post-reveal-buttons" class="post-reveal-buttons">
                                <button onclick="location.reload()" class="prediction-action-btn tertiary">
                                    Try Another Case
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Speedometer -->
                    <div class="prediction-right-panel">
                        <div class="speedometer-section">
                            <div class="interaction-header">
                                <div class="interaction-title">SET YOUR PREDICTION</div>
                                <div class="interaction-subtitle">Drag the needle or click anywhere on the dial</div>
                            </div>
                            
                            <div class="speedometer-container" id="speedometer-container">
                                <svg id="speedometer-svg" viewBox="0 0 500 300">
                                    <defs>
                                        <filter id="pixel-shadow">
                                            <feDropShadow dx="4" dy="4" stdDeviation="0" flood-color="#000000" flood-opacity="0.3"/>
                                        </filter>
                                    </defs>
                                    
                                    <!-- Arc segments -->
                                    <path d="M 100,250 A 150,150 0 0,1 190,110" 
                                        fill="none" stroke="#e74c3c" stroke-width="35" stroke-linecap="butt"/>
                                    <path d="M 190,110 A 150,150 0 0,1 310,110" 
                                        fill="none" stroke="#f39c12" stroke-width="35" stroke-linecap="butt"/>
                                    <path d="M 310,110 A 150,150 0 0,1 400,250" 
                                        fill="none" stroke="#2ecc71" stroke-width="35" stroke-linecap="butt"/>
                                    
                                    <!-- Tick marks -->
                                    <g stroke="#4d1f2f" stroke-width="3">
                                        <line x1="100" y1="250" x2="115" y2="245"/>
                                        <line x1="145" y1="145" x2="157" y2="155"/>
                                        <line x1="250" y1="100" x2="250" y2="115"/>
                                        <line x1="355" y1="145" x2="343" y2="155"/>
                                        <line x1="400" y1="250" x2="385" y2="245"/>
                                    </g>
                                    
                                    <!-- Numbers -->
                                    <text x="75" y="265" font-family="Press Start 2P" font-size="18" fill="#4d1f2f" font-weight="bold">0</text>
                                    <text x="125" y="135" font-family="Press Start 2P" font-size="16" fill="#4d1f2f" font-weight="bold">25</text>
                                    <text x="225" y="85" font-family="Press Start 2P" font-size="18" fill="#4d1f2f" font-weight="bold">50</text>
                                    <text x="340" y="135" font-family="Press Start 2P" font-size="16" fill="#4d1f2f" font-weight="bold">75</text>
                                    <text x="375" y="265" font-family="Press Start 2P" font-size="18" fill="#4d1f2f" font-weight="bold">100</text>
                                    
                                    <!-- Labels -->
                                    <text x="95" y="285" font-family="Press Start 2P" font-size="10" fill="#e74c3c" font-weight="bold">LOW</text>
                                    <text x="210" y="68" font-family="Press Start 2P" font-size="10" fill="#f39c12" font-weight="bold">MIDDLE</text>
                                    <text x="350" y="285" font-family="Press Start 2P" font-size="10" fill="#2ecc71" font-weight="bold">HIGH</text>
                                    
                                    <!-- Guess marker (hidden initially) -->
                                    <g id="guess-marker" transform="rotate(-90 250 250)" opacity="0">
                                        <line x1="250" y1="250" x2="250" y2="130" 
                                            stroke="#d75b87" stroke-width="5" 
                                            stroke-linecap="round" stroke-dasharray="8,4"/>
                                        <circle cx="250" cy="130" r="7" fill="#d75b87"/>
                                    </g>
                                    
                                    <!-- Center circle -->
                                    <circle cx="250" cy="250" r="18" fill="#8b4560" stroke="#4d1f2f" stroke-width="4"/>
                                    
                                    <!-- Needle -->
                                    <g id="speedometer-needle" transform="rotate(-90 250 250)" style="cursor: grab;">
                                        <line x1="250" y1="250" x2="250" y2="125" 
                                            stroke="#d75b87" stroke-width="7" 
                                            stroke-linecap="round" filter="url(#pixel-shadow)"/>
                                        <polygon points="250,120 245,135 255,135" fill="#d75b87"/>
                                        <circle cx="250" cy="250" r="14" fill="#ffb6c9" stroke="#8b4560" stroke-width="3"/>
                                    </g>
                                </svg>
                            </div>

                            <div class="scale-explanation">
                                <div class="scale-row">
                                    <div class="scale-color" style="background: #e74c3c;"></div>
                                    <div class="scale-text"><strong>0-25:</strong> Still low income</div>
                                </div>
                                <div class="scale-row">
                                    <div class="scale-color" style="background: #f39c12;"></div>
                                    <div class="scale-text"><strong>25-75:</strong> Middle class</div>
                                </div>
                                <div class="scale-row">
                                    <div class="scale-color" style="background: #2ecc71;"></div>
                                    <div class="scale-text"><strong>75-100:</strong> High income / Top 20%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Info Panel (slides from right) -->
            <div class="info-overlay" id="info-overlay"></div>
            <div class="info-panel" id="info-panel">
                <div class="info-panel-header">
                    <div class="info-panel-title">HOW TO PREDICT</div>
                    <div class="close-info" id="close-info">×</div>
                </div>

                <div class="info-section">
                    <div class="info-label">THE STARTING POINT</div>
                    <div class="info-content">
                        This person grew up in a <strong>low-income family</strong> (parents earned less than 75% of Americans)
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-label">YOUR TASK</div>
                    <div class="info-content">
                        Guess where they ended up as an adult on the income ladder:
                        <div class="info-highlight">
                            <strong>0-25:</strong> Bottom quarter (still low income)<br>
                            <strong>26-50:</strong> Lower-middle income<br>
                            <strong>51-75:</strong> Upper-middle income<br>
                            <strong>76-100:</strong> Top quarter (high income)
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-label">UNDERSTANDING THE SCALE</div>
                    <div class="info-content">
                        Think of 100 people lined up by income:
                        <div class="info-example">
                            <strong>25</strong> = They earn more than 25 people, less than 75<br>
                            <strong>50</strong> = Right in the middle (median income)<br>
                            <strong>75</strong> = They earn more than 75 people (top 25%)
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-label">EXAMPLE</div>
                    <div class="info-content">
                        If you predict <strong style="color: #d75b87;">60</strong>:
                        <div class="info-example">
                            You're saying they ended up earning more than <strong>60% of Americans</strong> — a significant jump from their low-income starting point!
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-label">HOW TO USE</div>
                    <div class="info-content">
                        <strong>Drag the needle</strong> or <strong>click anywhere</strong> on the dial to set your prediction
                    </div>
                </div>
            </div>
        </div>
    `;

    this.initImprovedSpeedometer();
    this.initHelpPanel();
},

// Initialize help panel
initHelpPanel: function() {
  const helpBtn = document.getElementById('help-button');
  const infoPanel = document.getElementById('info-panel');
  const infoOverlay = document.getElementById('info-overlay');
  const closeBtn = document.getElementById('close-info');

  if (!helpBtn || !infoPanel || !infoOverlay) return;

  const openPanel = () => {
      infoPanel.classList.add('visible');
      infoOverlay.classList.add('visible');
      // Stop pulsing once opened
      helpBtn.style.animation = 'none';
  };

  const closePanel = () => {
      infoPanel.classList.remove('visible');
      infoOverlay.classList.remove('visible');
  };

  helpBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  infoOverlay.addEventListener('click', closePanel);
},

// Enhanced reveal with contextual explanation
revealImprovedResult: function(guessValue) {
  const storedData = localStorage.getItem('currentCase');
  if (!storedData) {
      alert("Error: No case data found");
      return;
  }
  
  const caseProfile = JSON.parse(storedData);
  const actualValue = parseFloat(caseProfile.mobilityOutcome);
  
  if (isNaN(actualValue)) {
      alert("Error: Invalid mobility data");
      return;
  }
  
  const difference = Math.abs(guessValue - actualValue);
  
  // Update title
  document.getElementById('prediction-title').textContent = 'THE REALITY';
  
  // Show comparison
  document.getElementById('prediction-only-view')?.classList.remove('active');
  document.getElementById('comparison-view')?.classList.add('active');
  
  document.getElementById('final-guess-value').textContent = Math.round(guessValue);
  document.getElementById('actual-value').textContent = Math.round(actualValue);
  
  this.animateNeedleToActual(guessValue, actualValue);
  
  // Show difference
  setTimeout(() => {
      const badge = document.getElementById('difference-badge');
      const diffText = difference < 5 ? 'Very close!' : 
                      difference < 15 ? 'Pretty close!' :
                      difference < 30 ? 'Some gap' : 'Big difference';
      badge.textContent = `${diffText} — ${Math.round(difference)} points apart`;
  }, 1500);
  
  // Show contextual explanation
  setTimeout(() => {
      this.showContextualExplanation(caseProfile, actualValue, guessValue, difference);
      this.showImprovedFeedback(difference, guessValue, actualValue);
  }, 2000);
  
  setTimeout(() => {
      document.getElementById('post-reveal-buttons')?.classList.add('visible');
  }, 2500);
},

// NEW: Show rich contextual explanation
showContextualExplanation: function(caseProfile, actualValue, guessValue, difference) {
  const contextBox = document.getElementById('result-context');
  const explanation = document.getElementById('context-explanation');
  const factors = document.getElementById('context-factors');
  
  if (!contextBox || !explanation || !factors) return;

  // Generate explanation based on the gap
  let explanationText = '';
  
  if (actualValue < 25) {
      explanationText = `This person stayed in the bottom 25% — meaning they didn't move up much from where they started. Why? Often it's not about effort, but about the place they grew up. Some communities make climbing nearly impossible.
      
➜ Scroll down to see which factors — like location, education access, and family structure — create these barriers.`;
  } else if (actualValue >= 25 && actualValue < 60) {
      explanationText = `Starting from the bottom 25%, this person climbed to the ${Math.round(actualValue)}th percentile — moving from low-income to middle-class. That's real progress, but here's the reality: moving up is hard, and moving to the very top is even harder.
      
➜ Keep scrolling to explore WHY some places help people climb faster than others — and what factors make the biggest difference.`;
  } else {
      explanationText = `Wow! Starting from the bottom 25%, this person reached the ${Math.round(actualValue)}th percentile — that's exceptional mobility. These success stories are rare, but they show what's possible when location, education, and opportunity align.
      
➜ Keep exploring below to discover what makes certain places mobility hotspots — and what holds others back.`;
  }

  explanation.textContent = explanationText;

  // Show key factors from case profile
  factors.innerHTML = `
      <div class="factor-item">
          <div class="factor-label">LOCATION</div>
          <div class="factor-value">${caseProfile.county || 'Unknown County'}</div>
      </div>
      <div class="factor-item">
          <div class="factor-label">DEMOGRAPHIC</div>
          <div class="factor-value">${caseProfile.race} ${caseProfile.gender}</div>
      </div>
      <div class="factor-item">
          <div class="factor-label">PARENT EDUCATION</div>
          <div class="factor-value">${caseProfile.parentEducation || 'Unknown'}</div>
      </div>
      <div class="factor-item">
          <div class="factor-label">AREA TYPE</div>
          <div class="factor-value">${caseProfile.areaType || 'Unknown'}</div>
      </div>
  `;

  contextBox.style.display = 'block';
},

  initImprovedSpeedometer: function() {
    const needle = document.getElementById('speedometer-needle');
    const display = document.getElementById('speedometer-display');
    const descriptor = document.getElementById('mobility-descriptor');
    const revealBtn = document.getElementById('reveal-btn');
    const container = document.getElementById('speedometer-container');
    
    if (!needle || !display || !revealBtn || !container) {
        console.error("Missing speedometer elements");
        return;
    }
    
    let isDragging = false;
    let currentValue = 50;
    let hasRevealed = false;
    
    const valueToAngle = (value) => ((value / 100) * 180) - 90;
    
    const angleToValue = (angle) => {
        // Normalize angle from -90 to +90 degrees to 0-100 value
        const normalized = ((angle + 90) / 180) * 100;
        return Math.max(0, Math.min(100, Math.round(normalized)));
    };
    
    // Update descriptor text based on value
    const updateDescriptor = (value) => {
        if (!descriptor) return;
        
        let text, color;
        if (value <= 25) {
            text = "Still Low Income";
            color = "#e74c3c";
        } else if (value <= 40) {
            text = "Lower-Middle Class";
            color = "#e67e22";
        } else if (value <= 60) {
            text = "Middle Class";
            color = "#f39c12";
        } else if (value <= 80) {
            text = "Upper-Middle Class";
            color = "#27ae60";
        } else {
            text = "High Income / Top 20%";
            color = "#2ecc71";
        }
        
        descriptor.textContent = text;
        descriptor.style.color = color;
        
        // Update needle color
        const needleLine = needle.querySelector('line');
        const needlePolygon = needle.querySelector('polygon');
        if (needleLine) needleLine.setAttribute('stroke', color);
        if (needlePolygon) needlePolygon.setAttribute('fill', color);
    };
    
    const updateNeedle = (angle) => {
        needle.setAttribute('transform', `rotate(${angle} 250 250)`);
    };
    
    const getAngleFromEvent = (event) => {
        const svg = document.getElementById('speedometer-svg');
        if (!svg) return 0;
        
        const rect = svg.getBoundingClientRect();
        
        // SVG center point - gauge is positioned at 250,250 in viewBox
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + (rect.height * 0.833); // Gauge pivot is lower
        
        const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
        const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;
        
        if (clientX === 0 && clientY === 0) return currentValue; // Invalid touch
        
        const dx = clientX - cx;
        const dy = clientY - cy;
        
        // Calculate angle in radians, convert to degrees
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Clamp to gauge range: -90° to +90°
        if (angle < -90) angle = -90;
        if (angle > 90) angle = 90;
        
        return angle;
    };
    
    const updateValue = (angle) => {
        const value = angleToValue(angle);
        currentValue = value;
        updateNeedle(angle);
        if (display) display.textContent = value;
        updateDescriptor(value);
    };
    
    const handleDrag = (event) => {
        if (!isDragging || hasRevealed) return;
        event.preventDefault();
        
        const angle = getAngleFromEvent(event);
        updateValue(angle);
    };
    
    const startDrag = (event) => {
        if (hasRevealed) return;
        isDragging = true;
        needle.style.cursor = 'grabbing';
        container.style.cursor = 'grabbing';
        event.preventDefault();
        
        // Update immediately on start
        const angle = getAngleFromEvent(event);
        updateValue(angle);
    };
    
    const stopDrag = () => {
        if (!hasRevealed) {
            isDragging = false;
            needle.style.cursor = 'grab';
            container.style.cursor = 'crosshair';
        }
    };
    
    // Mouse events
    needle.addEventListener('mousedown', startDrag);
    container.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events
    needle.addEventListener('touchstart', startDrag, { passive: false });
    container.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
    
    // Click anywhere to set
    container.addEventListener('click', (event) => {
        if (hasRevealed) return;
        const angle = getAngleFromEvent(event);
        updateValue(angle);
    });
    
    revealBtn.addEventListener('click', () => {
        if (hasRevealed) return;
        
        hasRevealed = true;
        localStorage.setItem('userGuess', currentValue);
        
        needle.style.cursor = 'default';
        needle.style.pointerEvents = 'none';
        container.style.cursor = 'default';
        container.style.pointerEvents = 'none'; // Disable all interaction
        revealBtn.disabled = true;
        
        this.revealImprovedResult(currentValue);
    });
    
    // Initialize at 50
    updateNeedle(valueToAngle(50));
    updateDescriptor(50);
},



animateNeedleToActual: function(startValue, endValue) {
    const needle = document.getElementById('speedometer-needle');
    const actualDisplay = document.getElementById('actual-value');
    
    if (!needle) {
        console.error("❌ Needle element not found");
        return;
    }
    
    console.log(`🎬 Animating from ${startValue} to ${endValue}`);
    
    const valueToAngle = (value) => (value / 100) * 180 - 90;
    
    const startAngle = valueToAngle(startValue);
    const endAngle = valueToAngle(endValue);
    const duration = 2000;
    const startTime = performance.now();
    
    // Color based on final value
    let needleColor = "#e74c3c";
    if (endValue >= 25 && endValue < 60) needleColor = "#f39c12";
    else if (endValue >= 60) needleColor = "#2ecc71";
    
    const needleLine = needle.querySelector('line');
    const needlePolygon = needle.querySelector('polygon');
    
    if (needleLine) needleLine.setAttribute('stroke', needleColor);
    if (needlePolygon) needlePolygon.setAttribute('fill', needleColor);
    
    const easeOutElastic = (x) => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 :
            Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    };
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutElastic(progress);
        
        const currentAngle = startAngle + (endAngle - startAngle) * easedProgress;
        const currentDisplayValue = startValue + (endValue - startValue) * easedProgress;
        
        needle.setAttribute('transform', `rotate(${currentAngle} 250 250)`);
        
        if (actualDisplay) {
            actualDisplay.textContent = Math.round(currentDisplayValue);
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Ensure final values are exact
            needle.setAttribute('transform', `rotate(${endAngle} 250 250)`);
            if (actualDisplay) {
                actualDisplay.textContent = Math.round(endValue);
            }
            console.log("✅ Animation complete");
        }
    };
    
    requestAnimationFrame(animate);
},

showImprovedFeedback: function(difference, guessValue, actualValue) {
    const feedbackSection = document.getElementById('feedback-section');
    const message = document.getElementById('feedback-message');
    const explanation = document.getElementById('feedback-explanation');
    
    if (!feedbackSection || !message || !explanation) {
        console.error("❌ Feedback elements not found");
        return;
    }
    
    let messageText, explanationText;
    
    if (difference <= 5) {
        messageText = 'Incredibly accurate prediction!';
        explanationText = `You predicted ${Math.round(guessValue)} and the actual data shows ${Math.round(actualValue)}. You have a strong grasp of how these factors affect economic mobility.`;
    } else if (difference <= 15) {
        messageText = 'Great prediction!';
        explanationText = `You were close! You predicted ${Math.round(guessValue)}, and the reality is ${Math.round(actualValue)}. Small gaps like this show how complex mobility factors can be.`;
    } else if (difference <= 30) {
        messageText = 'Reality differs from your prediction';
        const direction = actualValue > guessValue ? 'higher' : 'lower';
        explanationText = `The actual mobility (${Math.round(actualValue)}) is ${direction} than your prediction (${Math.round(guessValue)}). Geography, race, and family resources interact in surprising ways.`;
    } else {
        messageText = 'Significant gap between prediction and reality';
        const direction = actualValue > guessValue ? 'much higher' : 'much lower';
        explanationText = `The actual outcome (${Math.round(actualValue)}) is ${direction} than you predicted (${Math.round(guessValue)}). This reveals how systemic factors create bigger barriers or advantages than we often expect.`;
    }
    
    message.textContent = messageText;
    explanation.textContent = explanationText;
    
    feedbackSection.classList.add('visible');
    console.log("✅ Feedback displayed");
},



animateNeedleToActual: function(startValue, endValue) {
  const needle = document.getElementById('speedometer-needle');
  const actualDisplay = document.getElementById('actual-value');
  
  if (!needle || !actualDisplay) return;
  
  const valueToAngle = (value) => (value / 100) * 180 - 90;
  
  const startAngle = valueToAngle(startValue);
  const endAngle = valueToAngle(endValue);
  const duration = 2000;
  const startTime = performance.now();
  
  // Determine needle color based on final value
  let needleColor = "#e74c3c";
  if (endValue >= 25 && endValue < 60) needleColor = "#f39c12";
  else if (endValue >= 60) needleColor = "#2ecc71";
  
  needle.querySelector('line').setAttribute('stroke', needleColor);
  needle.querySelector('polygon').setAttribute('fill', needleColor);
  
  const easeOutElastic = (x) => {
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 :
          Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  };
  
  const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutElastic(progress);
      
      const currentAngle = startAngle + (endAngle - startAngle) * easedProgress;
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      
      needle.setAttribute('transform', `rotate(${currentAngle} 250 250)`);
      actualDisplay.textContent = currentValue.toFixed(0);
      
      if (progress < 1) {
          requestAnimationFrame(animate);
      } else {
          needle.setAttribute('transform', `rotate(${endAngle} 250 250)`);
          actualDisplay.textContent = parseFloat(endValue).toFixed(0);
      }
  };
  
  requestAnimationFrame(animate);
},

showImprovedFeedback: function(difference, guessValue, actualValue) {
  const feedbackSection = document.getElementById('feedback-section');
  const message = document.getElementById('feedback-message');
  const explanation = document.getElementById('feedback-explanation');
  
  let messageText, explanationText;
  
  if (difference <= 5) {
      messageText = 'Incredibly accurate prediction!';
      explanationText = `You predicted ${guessValue.toFixed(0)} and the actual data shows ${actualValue.toFixed(0)}. You have a strong grasp of how these factors affect economic mobility.`;
  } else if (difference <= 15) {
      messageText = 'Great prediction!';
      explanationText = `You were close! You predicted ${guessValue.toFixed(0)}, and the reality is ${actualValue.toFixed(0)}. Small gaps like this show how complex mobility factors can be.`;
  } else if (difference <= 30) {
      messageText = 'Reality differs from your prediction';
      const direction = actualValue > guessValue ? 'higher' : 'lower';
      explanationText = `The actual mobility (${actualValue.toFixed(0)}) is ${direction} than your prediction (${guessValue.toFixed(0)}). Geography, race, and family resources interact in surprising ways.`;
  } else {
      messageText = 'Significant gap between prediction and reality';
      const direction = actualValue > guessValue ? 'much higher' : 'much lower';
      explanationText = `The actual outcome (${actualValue.toFixed(0)}) is ${direction} than you predicted (${guessValue.toFixed(0)}). This reveals how systemic factors create bigger barriers or advantages than we often expect.`;
  }
  
  message.textContent = messageText;
  explanation.textContent = explanationText;
  
  feedbackSection.classList.add('visible');
},



showImprovedFeedback: function(difference) {
  const feedbackSection = document.getElementById('feedback-section');
  const message = document.getElementById('feedback-message');
  const explanation = document.getElementById('feedback-explanation');
  
  let messageText, explanationText;
  
  if (difference <= 5) {
      messageText = 'INCREDIBLE! Almost perfect!';
      explanationText = 'You have a strong understanding of how economic mobility works!';
  } else if (difference <= 15) {
      messageText = 'Great prediction!';
      explanationText = "You're close! Small gaps like this show how complex these factors are.";
  } else if (difference <= 30) {
      messageText = 'Not bad!';
      explanationText = "There's more at play than meets the eye. Geography, race, and family income all interact in surprising ways.";
  } else {
      messageText = 'Reality is quite different';
      explanationText = 'This gap shows how our perceptions differ from reality. Systemic factors create bigger barriers or advantages than many expect.';
  }
  
  message.textContent = messageText;
  explanation.textContent = explanationText;
  
  feedbackSection.classList.add('visible');
},


showImprovedFeedback: function(difference) {
  const feedbackSection = document.getElementById('feedback-section');
  const emoji = document.getElementById('feedback-emoji');
  const message = document.getElementById('feedback-message');
  const explanation = document.getElementById('feedback-explanation');
  
  let emojiText, messageText, explanationText;
  
  if (difference <= 5) {
      emojiText = '🎯';
      messageText = 'INCREDIBLE! Almost perfect!';
      explanationText = 'You have a strong understanding of how economic mobility works!';
  } else if (difference <= 15) {
      emojiText = '👏';
      messageText = 'Great prediction!';
      explanationText = "You're close! Small gaps like this show how complex these factors are.";
  } else if (difference <= 30) {
      emojiText = '🤔';
      messageText = 'Not bad!';
      explanationText = "There's more at play than meets the eye. Geography, race, and family income all interact in surprising ways.";
  } else {
      emojiText = '😮';
      messageText = 'Reality is quite different';
      explanationText = 'This gap shows how our perceptions differ from reality. Systemic factors create bigger barriers (or advantages) than many expect.';
  }
  
  emoji.textContent = emojiText;
  message.textContent = messageText;
  explanation.textContent = explanationText;
  
  feedbackSection.classList.add('visible');
},

renderMountainScreen: function () {
    const screen6 = document.getElementById("screen6");
    if (!screen6) return;

    screen6.innerHTML = `
        <div class="mountain-container">
            <div class="mountain-header">
                <div class="mountain-title">THE FADING AMERICAN DREAM</div>
                <div class="mountain-instruction">
                    <div class="instruction-box">
                        <div class="instruction-section task-section">
                            <div class="section-label">NEW TASK</div>
                            <div class="section-content">Predict Economic Mobility Over Time</div>
                        </div>
                        
                        <div class="instruction-section metric-section">
                            <div class="section-label">WHAT THIS MEASURES</div>
                            <div class="section-content">
                                The % of children who earned more than their parents<br>
                                <span class="sub-text">(comparing children from median-income families)</span>
                            </div>
                        </div>
                        
                        <div class="instruction-section interaction-section">
                            <div class="section-label">HOW TO INTERACT</div>
                            <div class="section-content">
                                Drag each point up or down to show your prediction for each birth year
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mountain-canvas-wrapper">
                <canvas id="mountainCanvas"></canvas>
            </div>

            <div class="mountain-stats" id="mountain-stats" style="display: none;">
                <div class="mountain-message" id="mountain-message"></div>
            </div>

            <div class="mountain-buttons">
                <button id="reveal-mountains-btn" class="mountain-button">
                    REVEAL ACTUAL TREND
                </button>
                <button id="reset-mountains-btn" class="mountain-button secondary">
                    TRY AGAIN
                </button>
                <button id="next-screen-btn" class="mountain-button" style="display: none;" onclick="scrollToScreen(9)">
                    Continue Exploring →
                </button>
            </div>
        </div>
    `;

    setTimeout(() => {
        MountainViz.init();

        const revealBtn = document.getElementById("reveal-mountains-btn");
        const resetBtn = document.getElementById("reset-mountains-btn");

        if (revealBtn) {
            revealBtn.addEventListener("click", () => {
                MountainViz.revealActual();
                revealBtn.disabled = true;
                revealBtn.style.opacity = "0.5";
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                MountainViz.reset();
                if (revealBtn) {
                    revealBtn.disabled = false;
                    revealBtn.style.opacity = "1";
                }
            });
        }
    }, 100);
},

// Add these functions to your App object in main.js:

renderIntroStory: function() {
    const screen = document.getElementById('intro-story');
    if (!screen) return;
    
    screen.innerHTML = `
        <div class="pixel-grid-bg"></div>
        <div class="floating-pixels">
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
        </div>
        
        <div class="transition-content">
            <h1 class="transition-title">
                Every pixel represents a story
            </h1>
            
            <div class="story-visual">
                <div class="pixel-person-icon"></div>
                <div class="pixel-person-icon"></div>
                <div class="pixel-person-icon"></div>
                <div class="pixel-person-icon"></div>
                <div class="pixel-person-icon"></div>
            </div>
            
            <p class="transition-subtitle">
                Each child growing up in America has a unique background, a unique path, 
                and a future shaped by forces they can't always control. 
                Let's explore how economic mobility shapes lives across America.
            </p>
            
            <button class="transition-continue" onclick="scrollToScreen('screen1-5')">
                Begin the Journey →
            </button>
        </div>
    `;
},

renderMountainIntro: function() {
    const screen = document.getElementById('mountain-intro');
    if (!screen) return;
    
    screen.innerHTML = `
        <div class="pixel-grid-bg"></div>
        <div class="floating-pixels">
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
        </div>
        
        <div class="transition-content">
            <h1 class="transition-title">
                The American Dream is fading
            </h1>
            
            <div class="dream-visual">
                <div class="generation-bar gen1">
                    <span class="gen-label">Parents</span>
                </div>
                <div class="generation-bar gen2">
                    <span class="gen-label">Their Kids</span>
                </div>
                <div class="generation-bar gen3">
                    <span class="gen-label">Today?</span>
                </div>
                <div class="question-mark">?</div>
            </div>
            
            <p class="transition-subtitle">
                For generations, Americans believed each new generation would be better off. 
                But that promise is slipping away. Before you see the data, 
                what do you think has happened over time?
            </p>
            
            <button class="transition-continue" onclick="scrollToScreen(6)">
                Make Your Prediction →
            </button>
        </div>
    `;
},

renderCaseIntro: function() {
    const screen = document.getElementById('case-intro');
    if (!screen) return;
    
    screen.innerHTML = `
        <div class="pixel-grid-bg"></div>
        <div class="floating-pixels">
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
        </div>
        
        <div class="transition-content">
            <h1 class="transition-title">
                Now let's follow one person's story
            </h1>
            
            
            
            <p class="transition-subtitle">
                You'll meet someone and learn about their background. 
                Then predict where they ended up on the economic ladder.
            </p>

            <!-- Animated journey path -->
            <div class="journey-path">
            <div class="journey-stage stage-1">
                <div class="pixel-avatar"></div>
                <div class="stage-label">Childhood</div>
            </div>
            
            <div class="journey-arrow">→</div>
            
            <div class="journey-stage stage-2">
                <div class="pixel-building"></div>
                <div class="stage-label">Growing Up</div>
            </div>
            
            <div class="journey-arrow">→</div>
            
            <div class="journey-stage stage-3">
                <div class="pixel-question">?</div>
                <div class="stage-label">Your Prediction</div>
            </div>
        </div>
            
            <button class="transition-continue" onclick="scrollToScreen(2)">
                What You'll Do →
            </button>
        </div>
    `;
},

renderForcesIntro: function() {
    const screen = document.getElementById('forces-intro');
    if (!screen) return;
    
    screen.innerHTML = `
        <div class="pixel-grid-bg"></div>
        <div class="floating-pixels">
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
        </div>
        
        <div class="transition-content">
            <h1 class="transition-title">
                Opportunity is shaped by many forces
            </h1>
            
            <p class="transition-subtitle" style="margin-bottom: 80px;">
                Economic mobility isn't random — it's influenced by specific factors 
                that compound over a lifetime.
            </p>
            
            <div class="forces-list">
                <div class="force-item-clean">
                    <div class="force-number">01</div>
                    <div class="force-content">
                        <h3 class="force-title-clean">Education Access</h3>
                        <p class="force-description">
                            Children in areas with better schools are <strong>2x more likely</strong> 
                            to reach higher income levels. College attendance rates vary by 
                            <strong>40+ percentage points</strong> across neighborhoods.
                        </p>
                    </div>
                </div>
                
                <div class="force-item-clean">
                    <div class="force-number">02</div>
                    <div class="force-content">
                        <h3 class="force-title-clean">Housing Costs</h3>
                        <p class="force-description">
                            In some cities, housing costs consume over <strong>50% of income</strong>, 
                            leaving little for savings or education. High costs push families to 
                            areas with fewer opportunities.
                        </p>
                    </div>
                </div>
                
                <div class="force-item-clean">
                    <div class="force-number">03</div>
                    <div class="force-content">
                        <h3 class="force-title-clean">Job Availability</h3>
                        <p class="force-description">
                            Job density varies <strong>100-fold</strong> across the US. 
                            Communities with diverse employers create more pathways to 
                            middle-class careers.
                        </p>
                    </div>
                </div>
                
                <div class="force-item-clean">
                    <div class="force-number">04</div>
                    <div class="force-content">
                        <h3 class="force-title-clean">Race & Identity</h3>
                        <p class="force-description">
                            Even with identical starting income, Black and Hispanic children 
                            face <strong>20-30 point gaps</strong> in mobility rates due to 
                            systemic barriers and discrimination.
                        </p>
                    </div>
                </div>
                
                <div class="force-item-clean">
                    <div class="force-number">05</div>
                    <div class="force-content">
                        <h3 class="force-title-clean">Geography</h3>
                        <p class="force-description">
                            Your ZIP code matters. Children in high-mobility areas have 
                            <strong>10-15% higher earnings</strong> as adults, even when 
                            controlling for family income.
                        </p>
                    </div>
                </div>
                
                <div class="force-item-clean">
                    <div class="force-number">06</div>
                    <div class="force-content">
                        <h3 class="force-title-clean">Family Structure</h3>
                        <p class="force-description">
                            Two-parent households, parental education, and social networks 
                            create stability. Single-parent families face <strong>time and 
                            resource constraints</strong> that limit opportunities.
                        </p>
                    </div>
                </div>
            </div>
            
            <p class="transition-subtitle" style="margin-top: 80px; margin-bottom: 40px;">
                Now create your own scenario and see how different combinations affect mobility.
            </p>
            
            <button class="transition-continue" onclick="scrollToScreen(5)">
                Build Your Avatar →
            </button>
        </div>
    `;
},

renderClosingReflection: function() {
    const screen = document.getElementById('closing-reflection');
    if (!screen) return;
    
    screen.innerHTML = `
        <div class="pixel-grid-bg"></div>
        <div class="floating-pixels">
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
            <div class="floating-pixel"></div>
        </div>
        
        <div class="transition-content reflection-content">
            <h1 class="transition-title">
                What you can do next
            </h1>
            
            <p class="transition-subtitle" style="margin-bottom: 80px;">
                Economic mobility isn't just data — it's about real people and real opportunities. 
                Here's how you can take action.
            </p>
            
            <div class="action-list">
                <div class="action-item-clean">
                    <div class="action-number">01</div>
                    <div class="action-content">
                        <h3 class="action-title-clean">Learn More</h3>
                        <p class="action-description">
                            Explore the research from <strong>Opportunity Insights</strong> that powers 
                            this project. Dive deeper into the data on how place, race, and family 
                            background shape economic outcomes across America.
                        </p>
                        <a href="https://opportunityinsights.org" target="_blank" class="action-link">
                            Visit Opportunity Insights →
                        </a>
                    </div>
                </div>
                
                <div class="action-item-clean">
                    <div class="action-number">02</div>
                    <div class="action-content">
                        <h3 class="action-title-clean">Explore Your Community</h3>
                        <p class="action-description">
                            Use the <strong>Opportunity Atlas</strong> to see mobility data for your 
                            neighborhood. Discover which areas create pathways to prosperity and 
                            which face barriers.
                        </p>
                        <a href="https://www.opportunityatlas.org" target="_blank" class="action-link">
                            Explore the Atlas →
                        </a>
                    </div>
                </div>
                
                <div class="action-item-clean">
                    <div class="action-number">03</div>
                    <div class="action-content">
                        <h3 class="action-title-clean">Share This Experience</h3>
                        <p class="action-description">
                            Start conversations about mobility in your community. Share what you learned 
                            and discuss the factors that matter most. Small conversations create 
                            <strong>big awareness</strong>.
                        </p>
                        <button class="action-link action-share" onclick="navigator.share ? navigator.share({title: 'Economic Mobility Explorer', text: 'I just explored economic mobility data!', url: window.location.href}) : alert('Share this link:\\n' + window.location.href)">
                            Share This Project →
                        </button>
                    </div>
                </div>
                
                <div class="action-item-clean">
                    <div class="action-number">04</div>
                    <div class="action-content">
                        <h3 class="action-title-clean">Start Again</h3>
                        <p class="action-description">
                            Explore different scenarios and deepen your understanding. Try creating 
                            avatars with different backgrounds and see how outcomes change. Each 
                            scenario reveals new insights.
                        </p>
                        <button class="action-link action-restart" onclick="scrollToScreen(1)">
                            Return to Beginning →
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="closing-message">
                <p>Thank you for exploring economic mobility with us.</p>
                <p class="closing-note">Every story matters. Every opportunity counts.</p>
            </div>
        </div>
    `;
},
  // Initialize speedometer dragging
  initSpeedometer: function () {
    const needle = document.getElementById("speedometer-needle");
    const display = document.getElementById("speedometer-display");
    const submitBtn = document.getElementById("submit-speedometer-btn");

    if (!needle || !display || !submitBtn) return;

    let isDragging = false;
    let currentValue = 50;
    let hasRevealed = false;

    const valueToAngle = (value) => (value / 100) * 180 - 90;

    const angleToValue = (angle) => {
      // angle -90 → 0, angle +90 → 100
      return Math.round(((angle + 90) / 180) * 100);
    };

    const updateNeedle = (angle) => {
      needle.setAttribute("transform", `rotate(${angle} 250 250)`);
    };

    const getAngleFromEvent = (event) => {
      const svg = document.getElementById("speedometer-svg");
      const rect = svg.getBoundingClientRect();

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.78;
      // Gauge center isn't actual SVG center — your dial sits lower

      const mouseX = event.clientX || event.touches[0].clientX;
      const mouseY = event.clientY || event.touches[0].clientY;

      const dx = mouseX - cx;
      const dy = mouseY - cy;

      // atan2 gives -180 to 180 degrees
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Clamp to the 180° gauge arc: -90° (0) to +90° (100)
      if (angle < -90) angle = -90;
      if (angle > 90) angle = 90;

      return angle;
    };

    const startDrag = (event) => {
      if (hasRevealed) return;
      isDragging = true;
      needle.style.cursor = "grabbing";
      event.preventDefault();
    };

    const drag = (event) => {
      if (!isDragging || hasRevealed) return;

      const angle = getAngleFromEvent(event);
      const value = angleToValue(angle);

      currentValue = value;

      updateNeedle(angle);
      display.textContent = value;
    };

    const stopDrag = () => {
      isDragging = false;
      if (!hasRevealed) needle.style.cursor = "grab";
    };

    needle.addEventListener("mousedown", startDrag);
    needle.addEventListener("touchstart", startDrag);
    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchend", stopDrag);

    submitBtn.addEventListener("click", () => {
      if (hasRevealed) return;

      hasRevealed = true;
      localStorage.setItem("userGuess", currentValue);

      needle.style.cursor = "default";
      needle.style.pointerEvents = "none";

      submitBtn.style.transform = "scale(0.95)";
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.5";

      setTimeout(() => {
        this.revealActualValue(currentValue);
      }, 300);
    });

    updateNeedle(valueToAngle(50));
  },

  // Reveal the actual value with animation
  revealActualValue: function (guessValue) {
    const caseProfile = JSON.parse(localStorage.getItem("currentCase"));
    if (!caseProfile) return;

    const actualValue = caseProfile.mobilityOutcome;
    const difference = Math.abs(guessValue - actualValue).toFixed(1);

    const title = document.getElementById("screen4-title");
    const instructionText = document.getElementById("instruction-text");
    if (title) title.innerHTML = "THE REALITY";
    if (instructionText)
      instructionText.textContent =
        "Watch the needle spin to the actual outcome...";

    const guessMarker = document.getElementById("guess-marker");
    const guessAngle = (guessValue / 100) * 180 - 90;
    if (guessMarker) {
      guessMarker.setAttribute("transform", `rotate(${guessAngle} 250 250)`);
      guessMarker.setAttribute("opacity", "0.6");
    }

    const guessOnlyDisplay = document.getElementById("guess-only-display");
    const comparisonDisplay = document.getElementById("comparison-display");
    const finalGuessDisplay = document.getElementById("final-guess-display");

    if (guessOnlyDisplay) guessOnlyDisplay.style.display = "none";
    if (comparisonDisplay) comparisonDisplay.style.display = "flex";
    if (finalGuessDisplay)
      finalGuessDisplay.textContent = guessValue.toFixed(1);

    this.animateNeedleToActual(guessValue, actualValue);

    setTimeout(() => {
      this.showFeedback(difference);
      const nextButtons = document.getElementById("next-buttons");
      if (nextButtons) nextButtons.style.display = "block";
    }, 2500);
  },

  // Animate needle
  animateNeedleToActual: function (startValue, endValue) {
    const needle = document.getElementById("speedometer-needle");
    const actualDisplay = document.getElementById("actual-reveal");

    if (!needle || !actualDisplay) return;

    const valueToAngle = (value) => (value / 100) * 180 - 90;

    const startAngle = valueToAngle(startValue);
    const endAngle = valueToAngle(endValue);
    const duration = 2000;
    const startTime = performance.now();

    let needleColor = "#e74c3c";
    if (endValue >= 33 && endValue < 67) needleColor = "#f39c12";
    else if (endValue >= 67) needleColor = "#2ecc71";

    needle.querySelector("line").setAttribute("stroke", needleColor);
    needle.querySelector("polygon").setAttribute("fill", needleColor);

    const easeOutElastic = (x) => {
      const c4 = (2 * Math.PI) / 3;
      return x === 0
        ? 0
        : x === 1
        ? 1
        : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    };

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutElastic(progress);

      const currentAngle = startAngle + (endAngle - startAngle) * easedProgress;
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      needle.setAttribute("transform", `rotate(${currentAngle} 250 250)`);
      actualDisplay.textContent = currentValue.toFixed(1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        needle.setAttribute("transform", `rotate(${endAngle} 250 250)`);
        actualDisplay.textContent = parseFloat(endValue).toFixed(1);
        setTimeout(() => this.createParticles(), 100);
      }
    };

    requestAnimationFrame(animate);
  },

  // Show feedback
  showFeedback: function (difference) {
    const feedbackBox = document.getElementById("feedback-box");
    const feedbackEmoji = document.getElementById("feedback-emoji");
    const feedbackMessage = document.getElementById("feedback-message");
    const feedbackDiff = document.getElementById("feedback-diff");
    const feedbackExplanation = document.getElementById("feedback-explanation");

    if (!feedbackBox) return;

    let accuracyMessage = "";
    let accuracyEmoji = "";
    let explanation = "";

    if (difference <= 5) {
        accuracyMessage = "INCREDIBLE! Almost perfect!";
        accuracyEmoji = "🎯";
        explanation = "You have a strong understanding of economic mobility factors!";
    } else if (difference <= 15) {
        accuracyMessage = "Great prediction!";
        accuracyEmoji = "👏";
        explanation = "You're close! Small gaps like this show how complex these factors are.";
    } else if (difference <= 30) {
        accuracyMessage = "Not bad!";
        accuracyEmoji = "👍";
        explanation = "There's more at play than meets the eye. Geography, race, and family income all interact in surprising ways.";
    } else {
        accuracyMessage = "Reality is quite different";
        accuracyEmoji = "😮";
        explanation = "This gap shows how our perceptions differ from reality. Systemic factors create bigger barriers (or advantages) than many expect.";
    }

    feedbackEmoji.textContent = accuracyEmoji;
    feedbackMessage.textContent = accuracyMessage;
    feedbackDiff.textContent = `Difference: ${difference} points`;
    feedbackExplanation.textContent = explanation;

    feedbackBox.style.display = "block";
},

  // Create particles
  createParticles: function () {
    const container = document.getElementById("particle-container");
    if (!container) return;

    const colors = ["#2ecc71", "#27ae60", "#ffb6c9", "#f39c12", "#e74c3c"];

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = "50%";
      particle.style.top = "30%";
      particle.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];

      const angle = Math.random() * 360 * (Math.PI / 180);
      const velocity = 50 + Math.random() * 100;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      particle.style.setProperty("--tx", tx + "px");
      particle.style.setProperty("--ty", ty + "px");

      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  },

  // SCREEN 9 — INSIGHTS
  renderInsightsScreen: function () {
    const screen9 = document.getElementById("screen9");
    if (!screen9) return;

    screen9.innerHTML = `
            <h2>Key Insights</h2>
            <p>Here's what the data reveals about mobility in America.</p>
            <div class="insights-container">
                <div class="insight-card"><h3>10x</h3><p>Geography changes opportunity dramatically.</p></div>
                <div class="insight-card"><h3>50%</h3><p>Half of kids born poor stay poor.</p></div>
                <div class="insight-card"><h3>2x</h3><p>Race impacts mobility even with equal income.</p></div>
            </div>
            <button class="cta-button" onclick="scrollToScreen(6)">Explore Time Trends →</button>
        `;
  },

  setupProgressBar: function () {
    window.addEventListener("scroll", () => {
      const windowHeight = window.innerHeight;
      const documentHeight =
        document.documentElement.scrollHeight - windowHeight;
      const progress = (window.scrollY / documentHeight) * 100;
      const bar = document.getElementById("progressBar");
      if (bar) bar.style.width = progress + "%";
    });
  },

  setupIntersectionObserver: function () {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id === "screen7") {
          // Handle screen 7 if needed
        }
      });
    });

    document
      .querySelectorAll(".screen")
      .forEach((screen) => observer.observe(screen));
  },
};

// Instruction steps
function initInstructionSteps() {
  const steps = [
    "Step 1: Meet a person and explore their background.",
    "Step 2: Make your prediction about their economic future.",
    "Step 3: Discover what really happened.",
    "Step 4: Dive deeper into the data and insights.",
  ];

  let currentStep = 0;
  const instructionBox = document.getElementById("instructionText");
  const nextButton = document.getElementById("nextInstructionButton");
  const pixelBar = document.getElementById("pixelProgressBar");

  if (!instructionBox || !nextButton || !pixelBar) return;

  const updateProgressBar = (step) => {
    pixelBar.style.width = ((step + 1) / steps.length) * 100 + "%";
  };

  const showStep = (stepIndex) => {
    instructionBox.classList.remove("fade-in");
    void instructionBox.offsetWidth;
    instructionBox.innerHTML = steps[stepIndex];
    instructionBox.classList.add("fade-in");
    updateProgressBar(stepIndex);

    if (stepIndex === steps.length - 1) {
      nextButton.textContent = "CONTINUE ▶";
    }
  };

  nextButton.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      scrollToScreen(3);
    }
  });

  showStep(0);
}

// ... all your existing code above ...

// Pixel runners and floating elements
function spawnPixelRunners() {
  const container = document.getElementById("pixelBackground");
  // Target multiple screens for pixel runners
  const targetScreens = [
    document.getElementById("screen2"),    // Instructions
    document.getElementById("screen3"),    // Meet Case
    document.getElementById("screen4"),    // Prediction
    document.getElementById("screen5"),    // Avatar Builder
    document.getElementById("screen8"),    // Dashboard
  ];

  if (!container) return;

  let intervalId = null;

  const startRunners = () => {
    if (intervalId !== null) return;

    intervalId = setInterval(() => {
      const elementType = Math.random();
      
      // 60% chance for character, 40% chance for shape
      if (elementType < 0.6) {
        // Character runner
        const runner = document.createElement("div");
        runner.className = "pixel-runner";

        const sprites = [
          "./asset/pixel_character.png",
          "./asset/pixel_runner_1.png",
          "./asset/avatar_female_white.png",
          "./asset/avatar_female_black.png",
          "./asset/avatar_female_asian.png",
          "./asset/avatar_female_hispanic.png",
        ];
        runner.style.backgroundImage = `url('${
          sprites[Math.floor(Math.random() * sprites.length)]
        }')`;
        runner.style.top = Math.random() * (window.innerHeight - 80) + "px";

        const duration = 8 + Math.random() * 6;
        runner.style.animationDuration = duration + "s";

        container.appendChild(runner);
        setTimeout(() => runner.remove(), duration * 1000);
      } else {
        // Floating shape
        const shape = document.createElement("div");
        shape.className = "floating-shape";
        
        const shapes = ['●', '■', '▲', '◆', '★', '♥'];
        const colors = ['#d75b87', '#8b4560', '#B0B8A1', '#4d1f2f', '#FCEADF'];
        
        shape.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        shape.style.color = colors[Math.floor(Math.random() * colors.length)];
        shape.style.fontSize = (20 + Math.random() * 30) + 'px';
        shape.style.left = Math.random() * 100 + 'vw';
        shape.style.top = -50 + 'px';
        shape.style.opacity = 0.3 + Math.random() * 0.4;
        
        const duration = 8 + Math.random() * 8;
        shape.style.animationDuration = duration + 's';
        
        container.appendChild(shape);
        setTimeout(() => shape.remove(), duration * 1000);
      }
    }, 3500); // Spawn every 3.5 seconds
  };

  const stopRunners = () => {
    clearInterval(intervalId);
    intervalId = null;
    container.innerHTML = "";
  };

  // Observe all target screens
  targetScreens.forEach(screen => {
    if (screen) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startRunners();
            } else {
              stopRunners();
            }
          });
        },
        { threshold: 0.4 }
      );
      observer.observe(screen);
    }
  });
}

// Replace the initScrollIndicator function with this:
function initScrollIndicator() {
    const scrollIndicator = document.getElementById("scroll-indicator");
    if (!scrollIndicator) {
        console.log("Scroll indicator not found");
        return;
    }

    const dots = scrollIndicator.querySelectorAll(".scroll-dot");
    console.log("Found", dots.length, "dots");

    const screens = [
        document.getElementById("screen1"),
        document.getElementById("intro-story"),
        document.getElementById("screen1-5"),
        document.getElementById("mountain-intro"),
        document.getElementById("screen6"),
        document.getElementById("case-intro"),
        document.getElementById("screen2"),
        document.getElementById("screen3"),
        document.getElementById("screen4"),
        document.getElementById("screen8"),
        document.getElementById("forces-intro"),
        document.getElementById("screen5"),
        document.getElementById("closing-reflection")
    ];

    console.log("Found", screens.filter(s => s).length, "screens");

    // Make dots clickable
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            const screen = screens[index];
            if (screen) {
                console.log("Clicking dot", index, "scrolling to", screen.id);
                screen.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // Update active dot based on scroll position
    function updateActiveDot() {
        // Get the middle of the viewport
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        let activeIndex = 0;
        let minDistance = Infinity;

        screens.forEach((screen, index) => {
            if (!screen) return;

            const screenTop = screen.offsetTop;
            const screenMiddle = screenTop + (screen.offsetHeight / 2);
            const distance = Math.abs(scrollPosition - screenMiddle);

            if (distance < minDistance) {
                minDistance = distance;
                activeIndex = index;
            }
        });

        // Update active state
        dots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });

        console.log("Active screen index:", activeIndex);
    }

    // Debounced scroll handler for better performance
    let scrollTimer = null;
    window.addEventListener("scroll", () => {
        if (scrollTimer !== null) {
            clearTimeout(scrollTimer);
        }
        scrollTimer = setTimeout(() => {
            updateActiveDot();
        }, 50);
    }, { passive: true });

    // Also update on resize
    window.addEventListener("resize", () => {
        updateActiveDot();
    });

    // Initial update after a delay to ensure screens are rendered
    setTimeout(() => {
        updateActiveDot();
        console.log("Initial dot update complete");
    }, 500);
}

/* =========================================================
   SCREEN 8 — ECONOMIC MOBILITY EXPLORER (PIXEL EDITION)
   ========================================================= */
async function renderEconomicMobilityExplorer() {
  const screen8 = document.getElementById("screen8");
  if (!screen8) return;

  const pastelGreen = "#B2B8A3";
  const accentPink = "#D4A5A5";

  // Load CSV
  const data = await new Promise((resolve) => {
    Papa.parse("data/atlas.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (err) => {
        console.error("❌ CSV load error:", err);
        resolve([]);
      },
    });
  });

  const colPrefix = "kir";
  const groups = ["white", "black", "hisp", "asian"];
  const genders = ["male", "female"];
  const averages = {};

  groups.forEach((race) => {
    averages[race] = {};
    genders.forEach((gender) => {
      const kirCol = `${colPrefix}_${race}_${gender}_p25`;
      const subset = data.filter((d) => d[kirCol]);
      const avg = (key) => d3.mean(subset, (d) => +d[key] || 0) || 0;
      averages[race][gender] = {
        kir: avg(kirCol),
        par_mean: avg("par_mean"),
        college: avg("college"),
        popdensity: avg("popdensity"),
        med_hhinc: avg("med_hhinc"),
      };
    });
  });

  let selectedMetric = "kir";
  let selectedRace = "white";
  let selectedGender = "male";

  const container = d3.select("#screen8").style("background", pastelGreen);

  const caption = container
    .append("div")
    .attr("id", "mobility-caption")
    .style("font-family", "'Press Start 2P'")
    .style("color", "#4d1f2f")
    .style("font-size", "10px")
    .style("text-align", "center")
    .style("margin-top", "8px");

  // Toggle buttons
  const toggleWrap = container
    .append("div")
    .style("text-align", "center")
    .style("margin", "20px 0");

  toggleWrap
    .append("button")
    .text("Child's Income Percentile ↑")
    .style("margin-right", "8px")
    .style("padding", "8px 12px")
    .style("font-family", "'Press Start 2P'")
    .style("font-size", "9px")
    .style("cursor", "pointer")
    .style("background", accentPink)
    .style("border", "none")
    .style("color", "white")
    .on("click", () => {
      selectedMetric = "kir";
      updateViz();
    });

  toggleWrap
    .append("button")
    .text("Parent's Avg Income ($)")
    .style("padding", "8px 12px")
    .style("font-family", "'Press Start 2P'")
    .style("font-size", "9px")
    .style("cursor", "pointer")
    .style("background", "#7A5C5C")
    .style("border", "none")
    .style("color", "white")
    .on("click", () => {
      selectedMetric = "par_mean";
      updateViz();
    });

  // Dropdowns
  const filterDiv = container
    .append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "12px")
    .style("margin", "12px 0");

  const raceSelect = filterDiv
    .append("select")
    .style("padding", "8px")
    .style("font-family", "'Press Start 2P'")
    .style("font-size", "9px")
    .on("change", function () {
      selectedRace = this.value;
      updateViz();
    });
  raceSelect
    .selectAll("option")
    .data(groups)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d.charAt(0).toUpperCase() + d.slice(1));

  const genderSelect = filterDiv
    .append("select")
    .style("padding", "8px")
    .style("font-family", "'Press Start 2P'")
    .style("font-size", "9px")
    .on("change", function () {
      selectedGender = this.value;
      updateViz();
    });
  genderSelect
    .selectAll("option")
    .data(genders)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d.charAt(0).toUpperCase() + d.slice(1));

  const grid = container
    .append("div")
    .attr("class", "pixel-grid")
    .style("display", "grid")
    .style("grid-template-columns", "repeat(10, 1fr)")
    .style("gap", "6px")
    .style("justify-items", "center")
    .style("max-width", "600px")
    .style("margin", "24px auto");

  grid
    .selectAll(".pixel-person")
    .data(d3.range(100))
    .enter()
    .append("div")
    .attr("class", "pixel-person")
    .style("width", "40px")
    .style("height", "40px")
    .style("background", accentPink)
    .style("opacity", 0)
    .transition()
    .delay((d) => d * 10)
    .duration(400)
    .style("opacity", 1);

  const insights = container
    .append("div")
    .attr("class", "insight-panel")
    .style("max-width", "700px")
    .style("margin", "32px auto")
    .style("background", "#f4f2ef")
    .style("border-radius", "16px")
    .style("padding", "20px")
    .style("box-shadow", "0 4px 10px rgba(0,0,0,0.2)");

  insights
    .append("h3")
    .text("Why the differences?")
    .style("font-family", "'Press Start 2P'")
    .style("font-size", "12px")
    .style("color", "#4d1f2f")
    .style("margin-bottom", "10px");

  insights
    .append("p")
    .attr("id", "insight-text")
    .style("font-size", "12px")
    .style("line-height", "1.5")
    .style("color", "#4d1f2f");

  insights.append("div").attr("id", "mini-bar").style("margin-top", "16px");

  function updateViz() {
    const info = averages[selectedRace]?.[selectedGender] || {
      kir: 0,
      par_mean: 0,
      college: 0,
      popdensity: 0,
      med_hhinc: 0,
    };
    const metricVal = info[selectedMetric];

    caption.text(
      selectedMetric === "kir"
        ? "Average adult income percentile for children born to low-income parents (↑ = greater mobility)"
        : "Average parent household income — higher values indicate wealthier origins."
    );

    const scale =
      selectedMetric === "kir"
        ? d3.scaleSequential([20, 70], d3.interpolateYlGnBu)
        : d3.scaleSequential([30000, 80000], d3.interpolateOrRd);

    d3.selectAll(".pixel-person")
      .transition()
      .duration(800)
      .style("background", () => scale(metricVal + (Math.random() - 0.5) * 10));

    const insight =
      info.college > 0.25
        ? "Higher education levels are linked to greater mobility."
        : "Lower college attainment and higher poverty rates limit upward movement.";

    d3.select("#insight-text").text(
      `${selectedRace.toUpperCase()} ${selectedGender.toUpperCase()}: ${insight}`
    );

    renderMiniBar(info);
  }

  function renderMiniBar(info) {
    const vars = [
      { key: "college", label: "College Rate", value: info.college },
      { key: "popdensity", label: "Pop Density", value: info.popdensity },
      { key: "med_hhinc", label: "Median HH Income", value: info.med_hhinc },
    ];

    const w = 300,
      h = 120;
    const svg = d3
      .select("#mini-bar")
      .html("")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    const x = d3
      .scaleBand()
      .domain(vars.map((d) => d.label))
      .range([0, w])
      .padding(0.3);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(vars, (d) => d.value)])
      .range([h - 20, 0]);

    svg
      .selectAll("rect")
      .data(vars)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.label))
      .attr("y", h - 20)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", accentPink)
      .transition()
      .delay((d, i) => i * 150)
      .duration(700)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => h - 20 - y(d.value));

    svg
      .selectAll("text")
      .data(vars)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", h - 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#4d1f2f")
      .attr("font-size", "10px")
      .text((d) => d.label);
  }

  updateViz();
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    App.init();
    
    // Initialize scroll indicator AFTER screens are rendered
    setTimeout(() => {
        initScrollIndicator();
        console.log("Scroll indicator initialized");
    }, 1000);
    
    spawnPixelRunners();
  });