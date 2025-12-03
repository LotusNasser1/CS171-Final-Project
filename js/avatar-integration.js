// avatar-integration.js - Integrates avatar builder into main flow

const AvatarIntegration = {
    avatar: { name: '', state: null, city: null, cityLabel: null, gender: 'male', race: null, education: null, income: null },
    currentStep: 0,
    mapState: { svg: null, g: null, path: null, projection: null, zoom: null, statesFeatures: null },
    FIPS: null,
    USPS_ABBR: null,
    STATES: null,
    STATE_BY_FIPS: null,
    CITIES_BY_STATE: {},
    CITY_COORDINATES: null, // NEW: City coordinates database
    
    // Mobility rates from your friend's code
    mobilityRates: {
        'low-white-hs':5.2,'low-white-college':12.8,'low-white-graduate':18.5,
        'low-black-hs':3.1,'low-black-college':8.9,'low-black-graduate':14.2,
        'low-asian-hs':8.5,'low-asian-college':18.3,'low-asian-graduate':25.7,
        'low-hispanic-hs':4.2,'low-hispanic-college':10.5,'low-hispanic-graduate':16.8,
        'middle-white-hs':15.5,'middle-white-college':28.3,'middle-white-graduate':35.2,
        'middle-black-hs':9.8,'middle-black-college':19.5,'middle-black-graduate':26.8,
        'middle-asian-hs':22.5,'middle-asian-college':35.8,'middle-asian-graduate':42.5,
        'middle-hispanic-hs':12.3,'middle-hispanic-college':22.7,'middle-hispanic-graduate':30.5,
        'high-white-hs':35.5,'high-white-college':52.8,'high-white-graduate':65.2,
        'high-black-hs':22.5,'high-black-college':38.9,'high-black-graduate':48.5,
        'high-asian-hs':45.2,'high-asian-college':62.5,'high-asian-graduate':72.8,
        'high-hispanic-hs':28.5,'high-hispanic-college':45.2,'high-hispanic-graduate':56.8
    },
    
    // Render avatar builder as screen5
    renderAvatarBuilder: function() {
        const screen5 = document.getElementById('screen5');
        if (!screen5) return;

        // Setup constants
        this.setupConstants();

        screen5.innerHTML = `
            <div class="container" style="max-width: 1600px; background: #fff; border-radius: 0; border: 4px solid #4d1f2f; box-shadow: 8px 8px 0 rgba(77, 31, 47, 0.4); overflow: hidden; image-rendering: pixelated;">
                <div class="header" style="background: #d75b87; color: #fff; padding: 2rem; text-align: center; border-bottom: 4px solid #4d1f2f; box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.2);">
                    <h1 style="font-family: 'Press Start 2P', monospace; font-size: 1.5rem; margin-bottom: 0.75rem; text-shadow: 3px 3px 0 rgba(77, 31, 47, 0.5);">BUILD YOUR OWN AVATAR</h1>
                    <p style="font-family: 'Press Start 2P', monospace; font-size: 0.7rem; opacity: 0.95;">Create different scenarios and compare outcomes</p>
                </div>

                <div class="main-content" style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 0; min-height: 640px;">
                    <!-- LEFT: Map + Avatar (Vertical Stack) -->
                    <div class="avatar-section" style="background: #B0B8A1; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; position: relative; border-right: 4px solid #4d1f2f; gap: 1rem;">
                        <!-- Map Container - Top Half -->
                        <div class="avatar-container" style="position: relative; width: 100%; max-width: 600px; flex: 1; max-height: 50%; border-radius: 0; border: 4px solid #4d1f2f; background: #fff; box-shadow: 6px 6px 0 rgba(77, 31, 47, 0.3), inset -2px -2px 0 rgba(0, 0, 0, 0.1), inset 2px 2px 0 rgba(255, 255, 255, 0.3);">
                            <svg id="miniMap" viewBox="0 0 960 600" style="width: 100%; height: 100%;" aria-label="USA map"></svg>
                            <div class="map-zoom-ui" style="position: absolute; right: .75rem; top: .75rem; display: grid; gap: .5rem; z-index: 5;">
                                <button class="map-btn" id="zoomIn" title="Zoom in">+</button>
                                <button class="map-btn" id="zoomOut" title="Zoom out">−</button>
                                <button class="map-btn" id="zoomReset" title="Reset">⟲</button>
                            </div>
                        </div>
                        <!-- Avatar Display - Bottom Half -->
                        <div class="avatar-display" style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; max-height: 45%;">
                            <canvas id="avatarCanvas" width="180" height="180" style="width: 180px; height: 180px; image-rendering: pixelated; box-shadow: 6px 6px 0 rgba(77, 31, 47, 0.5), inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.3); border-radius: 0; border: 4px solid #4d1f2f; background: #fff; display: none;"></canvas>
                            <div class="avatar-label" style="margin-top: 0.75rem; font-family: 'Press Start 2P', monospace; font-size: 0.65rem; color: #4d1f2f; font-weight: bold; display: none;" id="avatarLabel"><span id="avatarLabelText">Your Avatar</span></div>
                        </div>
                        <div class="avatar-note" id="avatarNote" style="position: absolute; left: 50%; top: 8%; transform: translateX(-50%); padding: 1rem 1.5rem; background: #d75b87; color: #fff; border-radius: 0; border: 3px solid #8b4560; font: 700 0.7rem 'Press Start 2P', monospace; display: none; text-align: center; box-shadow: 4px 4px 0 rgba(139, 69, 96, 0.5), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.2); max-width: 280px; line-height: 1.6; z-index: 100;">
                            Your avatar is ready! Wanna enter your mobility guess?
                        </div>
                    </div>

                    <!-- RIGHT: Controls -->
                    <div class="controls-section" id="avatarControls" style="padding: 2.5rem; background: #fff; overflow-y: auto; display: flex; flex-direction: column; justify-content: space-between;">
                        <div class="steps-container" style="min-height: 400px;">
                                                        <div class="step active" id="avatarStep0">
                                <div class="step-label" style="font-family: 'Press Start 2P', monospace; font-size: 0.75rem; font-weight: 400; color: #4d1f2f; margin-bottom: 1rem; display: flex; align-items: center; letter-spacing: 0.5px;">
                                    <span class="step-number" style="width: 32px; height: 32px; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; display: inline-grid; place-items: center; margin-right: .75rem; font-family: 'Press Start 2P', monospace; font-size: .8rem; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.3);">0</span> 
                                    Name Your Avatar (Optional)
                                </div>
                                <input 
                                    type="text" 
                                    id="avatarNameInput" 
                                    placeholder="Enter a name..." 
                                    maxlength="20"
                                    style="width: 100%; padding: .85rem; border: 3px solid #4d1f2f; border-radius: 0; font-family: 'Press Start 2P', monospace; font-size: 0.7rem; background: #fff; color: #4d1f2f; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.1); cursor: text;"
                                 oninput="AvatarIntegration.updateAvatarName()" / />
                                <p style="font-size: 0.5rem; color: #7A5C5C; margin-top: 0.5rem; font-family: 'Press Start 2P', monospace;">Max 20 characters. Optional - press Next to skip.</p>
                            </div>

<div class="step" id="avatarStep1">
                                <div class="step-label" style="font-family: 'Press Start 2P', monospace; font-size: 0.75rem; font-weight: 400; color: #4d1f2f; margin-bottom: 1rem; display: flex; align-items: center; letter-spacing: 0.5px;">
                                    <span class="step-number" style="width: 32px; height: 32px; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; display: inline-grid; place-items: center; margin-right: .75rem; font-family: 'Press Start 2P', monospace; font-size: .8rem; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.3);">1</span> 
                                    Select State
                                </div>
                                <select id="stateSelect" style="width: 100%; padding: .85rem; border: 3px solid #4d1f2f; border-radius: 0; font-family: 'Press Start 2P', monospace; font-size: 0.7rem; background: #fff; color: #4d1f2f; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.1); cursor: pointer;">
                                    <option value="">Choose a state...</option>
                                </select>
                            </div>

                            <div class="step" id="avatarStep2">
                                <div class="step-label" style="font-family: 'Press Start 2P', monospace; font-size: 0.75rem; font-weight: 400; color: #4d1f2f; margin-bottom: 1rem; display: flex; align-items: center; letter-spacing: 0.5px;">
                                    <span class="step-number" style="width: 32px; height: 32px; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; display: inline-grid; place-items: center; margin-right: .75rem; font-family: 'Press Start 2P', monospace; font-size: .8rem; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.3);">2</span> 
                                    Select City
                                </div>
                                <select id="citySelect" style="width: 100%; padding: .85rem; border: 3px solid #4d1f2f; border-radius: 0; font-family: 'Press Start 2P', monospace; font-size: 0.7rem; background: #fff; color: #4d1f2f; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.1); cursor: pointer;">
                                    <option value="">Choose a city...</option>
                                </select>
                            </div>

                            <div class="step" id="avatarStep3">
                                <div class="step-label" style="font-family: 'Press Start 2P', monospace; font-size: 0.75rem; font-weight: 400; color: #4d1f2f; margin-bottom: 1rem; display: flex; align-items: center; letter-spacing: 0.5px;">
                                    <span class="step-number" style="width: 32px; height: 32px; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; display: inline-grid; place-items: center; margin-right: .75rem; font-family: 'Press Start 2P', monospace; font-size: .8rem; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.3);">3</span> 
                                    Select Gender
                                </div>
                                <div class="button-group" style="display: flex; flex-wrap: wrap; gap: .75rem;">
                                    <button class="option-button selected" data-value="male" data-field="gender">Male</button>
                                    <button class="option-button" data-value="female" data-field="gender">Female</button>
                                </div>
                            </div>

                            <div class="step" id="avatarStep4">
                                <div class="step-label" style="font-family: 'Press Start 2P', monospace; font-size: 0.75rem; font-weight: 400; color: #4d1f2f; margin-bottom: 1rem; display: flex; align-items: center; letter-spacing: 0.5px;">
                                    <span class="step-number" style="width: 32px; height: 32px; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; display: inline-grid; place-items: center; margin-right: .75rem; font-family: 'Press Start 2P', monospace; font-size: .8rem; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.3);">4</span> 
                                    Select Race
                                </div>
                                <div class="button-group" style="display: flex; flex-wrap: wrap; gap: .75rem;">
                                    <button class="option-button" data-value="white" data-field="race">White</button>
                                    <button class="option-button" data-value="black" data-field="race">Black</button>
                                    <button class="option-button" data-value="asian" data-field="race">Asian</button>
                                    <button class="option-button" data-value="hispanic" data-field="race">Hispanic</button>
                                </div>
                            </div>

                            <div class="step" id="avatarStep5">
                                <div class="step-label" style="font-family: 'Press Start 2P', monospace; font-size: 0.75rem; font-weight: 400; color: #4d1f2f; margin-bottom: 1rem; display: flex; align-items: center; letter-spacing: 0.5px;">
                                    <span class="step-number" style="width: 32px; height: 32px; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; display: inline-grid; place-items: center; margin-right: .75rem; font-family: 'Press Start 2P', monospace; font-size: .8rem; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.3);">5</span> 
                                    Select Education
                                </div>
                                <div class="button-group" style="display: flex; flex-wrap: wrap; gap: .75rem;">
                                    <button class="option-button" data-value="hs" data-field="education">High School</button>
                                    <button class="option-button" data-value="college" data-field="education">College</button>
                                    <button class="option-button" data-value="graduate" data-field="education">Graduate</button>
                                </div>
                            </div>

                            <div class="step" id="avatarStep6">
                                <div class="step-label" style="font-family: 'Press Start 2P', monospace; font-size: 0.75rem; font-weight: 400; color: #4d1f2f; margin-bottom: 1rem; display: flex; align-items: center; letter-spacing: 0.5px;">
                                    <span class="step-number" style="width: 32px; height: 32px; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; display: inline-grid; place-items: center; margin-right: .75rem; font-family: 'Press Start 2P', monospace; font-size: .8rem; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.3);">6</span> 
                                    Select Income
                                </div>
                                <div class="button-group" style="display: flex; flex-wrap: wrap; gap: .75rem;">
                                    <button class="option-button" data-value="low" data-field="income">Low Income</button>
                                    <button class="option-button" data-value="middle" data-field="income">Middle Income</button>
                                    <button class="option-button" data-value="high" data-field="income">High Income</button>
                                </div>
                            </div>
                        </div>

                        <div class="navigation-buttons" style="display: flex; gap: 1rem; margin-top: 2rem;">
                            <button class="nav-button" id="avatarBackButton">← Back</button>
                            <button class="nav-button primary" id="avatarNextButton">Next →</button>
                        </div>

                        <div class="progress-dots" style="display: flex; justify-content: center; gap: 1rem; padding: 2rem 0; margin-top: 2rem; border-top: 3px solid #B0B8A1;">
                            <div class="dot active" data-step="1"></div>
                            <div class="dot" data-step="2"></div>
                            <div class="dot" data-step="3"></div>
                            <div class="dot" data-step="4"></div>
                            <div class="dot" data-step="5"></div>
                            <div class="dot" data-step="6"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Prediction Modal -->
            <div class="modal" id="avatarPredictionModal" style="display: none; position: fixed; inset: 0; background: rgba(77, 31, 47, 0.75); z-index: 1000; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: #fff; padding: 2.5rem; border-radius: 0; border: 4px solid #4d1f2f; max-width: 560px; text-align: center; box-shadow: 8px 8px 0 rgba(77, 31, 47, 0.5), inset -2px -2px 0 rgba(0, 0, 0, 0.1), inset 2px 2px 0 rgba(255, 255, 255, 0.3);">
                    <h2 style="color: #4d1f2f; margin-bottom: 1rem; font-family: 'Press Start 2P', monospace; font-size: 1rem;">Enter Your Mobility Guess</h2>
                    <p style="font-family: 'Press Start 2P', monospace; font-size: 0.7rem; line-height: 1.6; color: #4d1f2f;">What % chance does your avatar have of reaching the top 20% of earners?</p>
                    <div class="slider-container" style="margin: 2rem 0;">
                        <input type="range" min="0" max="100" value="50" id="avatarPredictionSlider" style="width: 100%; height: 12px; border-radius: 0; background: #B0B8A1; outline: none; -webkit-appearance: none; border: 2px solid #4d1f2f; box-shadow: inset 0 2px 0 rgba(0, 0, 0, 0.2);"/>
                        <div class="prediction-value" id="avatarPredictionValue" style="font-size: 2.5rem; font-weight: 800; color: #d75b87; margin: 1rem 0; font-family: 'Press Start 2P', monospace; text-shadow: 3px 3px 0 rgba(77, 31, 47, 0.2);">50%</div>
                    </div>
                    <button class="cta-button" onclick="AvatarIntegration.submitGuess()" style="padding: 0.9rem 2rem; background: #d75b87; color: #fff; border: 3px solid #8b4560; border-radius: 0; font-size: 0.8rem; cursor: pointer; font-family: 'Press Start 2P', monospace; font-weight: 400; margin-top: 0.75rem; box-shadow: 4px 4px 0 rgba(139, 69, 96, 0.5), inset -1px -1px 0 rgba(0, 0, 0, 0.2), inset 1px 1px 0 rgba(255, 255, 255, 0.2); transition: all 0.15s ease;">Submit Guess</button>
                </div>
            </div>

            <!-- Result Modal -->
            <div class="modal" id="avatarResultModal" style="display: none; position: fixed; inset: 0; background: rgba(77, 31, 47, 0.75); z-index: 1000; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: #fff; padding: 2.5rem; border-radius: 0; border: 4px solid #4d1f2f; max-width: 560px; text-align: center; box-shadow: 8px 8px 0 rgba(77, 31, 47, 0.5), inset -2px -2px 0 rgba(0, 0, 0, 0.1), inset 2px 2px 0 rgba(255, 255, 255, 0.3);">
                    <!-- Hourglass animation -->
                    <div class="hourglass" id="avatarHourglass" style="width: 100px; height: 140px; margin: 1rem auto; display: none;">
                        <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M20,12 Q60,12 100,12 Q110,12 110,22 L110,38 Q110,52 90,68 L72,84 Q60,94 60,100 Q60,106 72,116 L90,132 Q110,148 110,162 L110,178 Q110,188 100,188 Q60,188 20,188 Q10,188 10,178 L10,162 Q10,148 30,132 L48,116 Q60,106 60,100 Q60,94 48,84 L30,68 Q10,52 10,38 L10,22 Q10,12 20,12 Z" fill="none" stroke="#d75b87" stroke-width="4" transform="translate(0,-20)"/>
                            <path d="M24,30 h72 v8 l-15,18 h-42 l-15,-18 z" class="sand" transform="translate(0,-20)" fill="#d75b87"/>
                            <path d="M24,170 h72 v-8 l-15,-18 h-42 l-15,18 z" class="sand" opacity="0.35" transform="translate(0,-20)" fill="#d75b87"/>
                        </svg>
                    </div>
                    
                    <div id="avatarResultContent" style="display: none;">
                        <h2 style="color: #4d1f2f; margin-bottom: 1.5rem; font-family: 'Press Start 2P', monospace; font-size: 1rem;">The Reality</h2>
                        <div class="result-comparison" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                            <div class="result-box" style="padding: 1.5rem; border-radius: 0; border: 3px solid #4d1f2f; background: #B0B8A1; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3);">
                                <h3 style="color: #4d1f2f; margin-bottom: 0.75rem; font-family: 'Press Start 2P', monospace; font-size: 0.6rem;">Your Guess</h3>
                                <div class="result-value" id="avatarUserGuess" style="font-size: 2rem; font-weight: 800; color: #4d1f2f; font-family: 'Press Start 2P', monospace;">50%</div>
                            </div>
                            <div class="result-box" style="padding: 1.5rem; border-radius: 0; border: 3px solid #4d1f2f; background: #d75b87; box-shadow: 3px 3px 0 rgba(77, 31, 47, 0.3);">
                                <h3 style="color: #fff; margin-bottom: 0.75rem; font-family: 'Press Start 2P', monospace; font-size: 0.6rem;">Actual Probability</h3>
                                <div class="result-value" id="avatarActualValue" style="font-size: 2rem; font-weight: 800; color: #fff; font-family: 'Press Start 2P', monospace;">--</div>
                            </div>
                        </div>
                        <p id="avatarResultMessage" style="margin-top: 1rem; font-family: 'Press Start 2P', monospace; font-size: 0.65rem; line-height: 1.6; color: #4d1f2f;"></p>
                        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
                            <button class="cta-button" onclick="AvatarIntegration.openMountainClimb()" style="padding: 0.85rem 1.5rem; background: #d75b87; color: #fff; border: 3px solid #8b4560; border-radius: 0; font-family: 'Press Start 2P', monospace; font-size: 0.65rem; font-weight: 400; cursor: pointer; box-shadow: 4px 4px 0 rgba(139, 69, 96, 0.5); transition: all 0.15s ease;">🏔️ Mountain Climb</button>
                            <button class="cta-button" onclick="AvatarIntegration.resetAvatar()" style="padding: 0.85rem 1.5rem; background: #B0B8A1; color: #4d1f2f; border: 3px solid #4d1f2f; border-radius: 0; font-family: 'Press Start 2P', monospace; font-size: 0.65rem; font-weight: 400; cursor: pointer; box-shadow: 4px 4px 0 rgba(77, 31, 47, 0.3); transition: all 0.15s ease;">Build Another Avatar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize the avatar builder after rendering (guarded to log runtime errors)
        setTimeout(() => {
            try {
                this.initAvatarBuilder();
            } catch (err) {
                console.error('initAvatarBuilder error:', err);
            }
        }, 100);
    },

    setupConstants: function() {
        this.FIPS = {'alabama':1,'alaska':2,'arizona':4,'arkansas':5,'california':6,'colorado':8,'connecticut':9,'delaware':10,'district-of-columbia':11,'florida':12,'georgia':13,'hawaii':15,'idaho':16,'illinois':17,'indiana':18,'iowa':19,'kansas':20,'kentucky':21,'louisiana':22,'maine':23,'maryland':24,'massachusetts':25,'michigan':26,'minnesota':27,'mississippi':28,'missouri':29,'montana':30,'nebraska':31,'nevada':32,'new-hampshire':33,'new-jersey':34,'new-mexico':35,'new-york':36,'north-carolina':37,'north-dakota':38,'ohio':39,'oklahoma':40,'oregon':41,'pennsylvania':42,'rhode-island':44,'south-carolina':45,'south-dakota':46,'tennessee':47,'texas':48,'utah':49,'vermont':50,'virginia':51,'washington':53,'west-virginia':54,'wisconsin':55,'wyoming':56};
        
        this.USPS_ABBR = {1:'AL',2:'AK',4:'AZ',5:'AR',6:'CA',8:'CO',9:'CT',10:'DE',11:'DC',12:'FL',13:'GA',15:'HI',16:'ID',17:'IL',18:'IN',19:'IA',20:'KS',21:'KY',22:'LA',23:'ME',24:'MD',25:'MA',26:'MI',27:'MN',28:'MS',29:'MO',30:'MT',31:'NE',32:'NV',33:'NH',34:'NJ',35:'NM',36:'NY',37:'NC',38:'ND',39:'OH',40:'OK',41:'OR',42:'PA',44:'RI',45:'SC',46:'SD',47:'TN',48:'TX',49:'UT',50:'VT',51:'VA',53:'WA',54:'WV',55:'WI',56:'WY'};
        
        this.STATES = [
            ['alabama','Alabama',1],['alaska','Alaska',2],['arizona','Arizona',4],['arkansas','Arkansas',5],
            ['california','California',6],['colorado','Colorado',8],['connecticut','Connecticut',9],
            ['delaware','Delaware',10],['district-of-columbia','District of Columbia',11],['florida','Florida',12],
            ['georgia','Georgia',13],['hawaii','Hawaii',15],['idaho','Idaho',16],['illinois','Illinois',17],
            ['indiana','Indiana',18],['iowa','Iowa',19],['kansas','Kansas',20],['kentucky','Kentucky',21],
            ['louisiana','Louisiana',22],['maine','Maine',23],['maryland','Maryland',24],
            ['massachusetts','Massachusetts',25],['michigan','Michigan',26],['minnesota','Minnesota',27],
            ['mississippi','Mississippi',28],['missouri','Missouri',29],['montana','Montana',30],
            ['nebraska','Nebraska',31],['nevada','Nevada',32],['new-hampshire','New Hampshire',33],
            ['new-jersey','New Jersey',34],['new-mexico','New Mexico',35],['new-york','New York',36],
            ['north-carolina','North Carolina',37],['north-dakota','North Dakota',38],['ohio','Ohio',39],
            ['oklahoma','Oklahoma',40],['oregon','Oregon',41],['pennsylvania','Pennsylvania',42],
            ['rhode-island','Rhode Island',44],['south-carolina','South Carolina',45],['south-dakota','South Dakota',46],
            ['tennessee','Tennessee',47],['texas','Texas',48],['utah','Utah',49],['vermont','Vermont',50],
            ['virginia','Virginia',51],['washington','Washington',53],['west-virginia','West Virginia',54],
            ['wisconsin','Wisconsin',55],['wyoming','Wyoming',56]
        ];
        
        this.STATE_BY_FIPS = Object.fromEntries(this.STATES.map(([slug,name,f])=>[String(f),{slug,name}]));
    },

    initAvatarBuilder: async function() {
        await this.loadCityCoordinates(); // NEW: Load city coordinates first
        await this.loadCities();
        await this.drawUSAMap();
        this.populateStates();
        this.setupControls();
        this.setupModals();
    },

    // NEW FUNCTION: Load city coordinates from database
    loadCityCoordinates: async function() {
        try {
            const rows = await d3.csv('data/us_cities_coordinates.csv');
            this.CITY_COORDINATES = {};
            rows.forEach(r => {
                const cityName = r.city.trim().toLowerCase();
                const stateAbbr = (r.state || '').trim().toUpperCase();
                const key = `${cityName}|${stateAbbr}`;
                this.CITY_COORDINATES[key] = {
                    lat: parseFloat(r.lat),
                    lng: parseFloat(r.lng),
                    name: r.city.trim()
                };
            });
            console.log('Loaded', Object.keys(this.CITY_COORDINATES).length, 'city coordinates');
        } catch (error) {
            console.error('Error loading city coordinates:', error);
            this.CITY_COORDINATES = {};
        }
    },

    loadCities: async function() {
        try {
            const rows = await d3.csv('data/atlas.csv');
            const byFips = new Map();
            
            rows.forEach(r => {
                const f = String(parseInt(r.state, 10));
                const cz = (r.czname || '').trim();
                if (!f || !cz) return;
                if (!byFips.has(f)) byFips.set(f, new Set());
                byFips.get(f).add(cz);
            });
            
            this.CITIES_BY_STATE = {};
            byFips.forEach((set, fipsStr) => {
                const meta = this.STATE_BY_FIPS[fipsStr];
                if (!meta) return;
                this.CITIES_BY_STATE[meta.slug] = Array.from(set).sort((a,b) => a.localeCompare(b));
            });
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    },

    updateAvatarName: function() {
        const nameInput = document.getElementById('avatarNameInput');
        if (nameInput && this.currentStep === 0) {
            this.avatar.name = nameInput.value.trim();
        }
    },


    drawUSAMap: async function() {
        const svg = d3.select('#miniMap'); 
        svg.selectAll('*').remove();
        
        const {width, height} = svg.node().viewBox.baseVal;
        const g = svg.append('g').attr('class', 'map-layer');
        
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [width, height]])
            .on('zoom', e => g.attr('transform', e.transform));
        
        svg.call(zoom);
        
        const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        const states = topojson.feature(us, us.objects.states);
        const projection = d3.geoAlbersUsa().fitSize([width, height], states);
        const path = d3.geoPath(projection);
        
        const self = this;
        g.selectAll('path.state')
            .data(states.features)
            .enter()
            .append('path')
            .attr('class', 'state')
            .attr('data-id', d => d.id)
            .attr('d', path)
            .attr('fill', '#E7D9D9')
            .attr('stroke', '#9B7373')
            .attr('stroke-width', 0.35) // FIXED: Reduced from 0.5 to 0.35 for even thinner borders
            .on('click', function(event, d) {
                const rec = self.STATE_BY_FIPS[String(d.id)];
                if (rec) {
                    document.getElementById('stateSelect').value = rec.slug;
                    self.handleStateChange(rec.slug);
                }
            });
        
        g.append('path')
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr('fill', 'none')
            .attr('stroke', '#9B7373')
            .attr('stroke-width', 0.5) // FIXED: Reduced from 0.8 to 0.5
            .attr('d', path);
        
        // CRITICAL: Add state labels AFTER mesh so they're on the very top layer
        // Using manual iteration to ensure every label is created
        console.log('Creating state labels...', states.features.length, 'states');
        console.log('USPS_ABBR available:', !!self.USPS_ABBR);
        
        states.features.forEach((feature, index) => {
            const centroid = path.centroid(feature);
            const stateId = feature.id;
            let x = centroid[0];
            let y = centroid[1];
            
            // Adjust positions for specific states
            if (stateId === 44) { x += 4; y -= 3; } // Rhode Island
            else if (stateId === 9) { x += 3; y -= 1; } // Connecticut
            else if (stateId === 10) { x += 2; y += 3; } // Delaware
            else if (stateId === 24) { x -= 3; } // Maryland
            else if (stateId === 50) { x -= 2; } // Vermont
            else if (stateId === 34) { y += 4; } // New Jersey
            else if (stateId === 33) { y -= 2; } // New Hampshire
            
            // Get state abbreviation
            const abbr = self.USPS_ABBR[stateId];
            if (!abbr) {
                console.warn('No abbreviation for state ID:', stateId);
                return;
            }
            
            // Determine font size
            let fontSize = '13px';
            if ([44, 10, 9, 33].includes(stateId)) fontSize = '10px'; // Tiny
            else if ([34, 24, 25, 50].includes(stateId)) fontSize = '11px'; // Small
            
            // Create label element
            const label = g.append('text')
                .attr('class', 'state-label')
                .attr('x', x)
                .attr('y', y)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .attr('font-family', 'Arial, Helvetica, sans-serif')
                .attr('font-size', fontSize)
                .attr('font-weight', 'bold')
                .attr('fill', '#000000')
                .attr('stroke', '#ffffff')
                .attr('stroke-width', '4px')
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('paint-order', 'stroke fill')
                .style('pointer-events', 'none')
                .style('user-select', 'none')
                .text(abbr);
            
            console.log(`Created label ${index + 1}: ${abbr} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
        });
        
        console.log('All state labels created successfully!');
        
        this.mapState = {svg, g, path, projection, zoom, width, height, statesFeatures: states.features};
        
        // Zoom controls (guarded)
        const zIn = document.getElementById('zoomIn');
        const zOut = document.getElementById('zoomOut');
        const zReset = document.getElementById('zoomReset');
        if (zIn) zIn.onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1.25);
        if (zOut) zOut.onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 0.8);
        if (zReset) zReset.onclick = () => svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    },

    populateStates: function() {
        const sel = document.getElementById('stateSelect');
        sel.innerHTML = '<option value="">Choose a state...</option>';
        this.STATES.forEach(([slug, name]) => {
            const opt = document.createElement('option');
            opt.value = slug;
            opt.textContent = name;
            sel.appendChild(opt);
        });
    },

    setupModals: function() {
        // Prediction slider
        const slider = document.getElementById('avatarPredictionSlider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                document.getElementById('avatarPredictionValue').textContent = e.target.value + '%';
            });
        }

        // Add CSS for range slider thumb
        const style = document.createElement('style');
        style.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #9B7373;
                cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #9B7373;
                cursor: pointer;
                border: none;
            }
            .modal.show {
                display: flex !important;
            }
            .hourglass.show {
                display: block !important;
                animation: hourglassFlip 2s ease-in-out;
            }
            @keyframes hourglassFlip {
                0%, 100% { transform: rotate(0); }
                50% { transform: rotate(180deg); }
            }
            .sand {
                animation: sandFall 2s ease-in-out;
            }
            @keyframes sandFall {
                0% { transform: translateY(0); }
                50% { transform: translateY(40px); }
                100% { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    },

    setupControls: function() {
        const self = this;
        const controlsRoot = document.getElementById('avatarControls');
        if (!controlsRoot) {
            console.warn('setupControls: avatarControls not found');
            return;
        }

        // State select
        const stateSel = controlsRoot.querySelector('#stateSelect');
        if (stateSel) stateSel.addEventListener('change', e => { self.handleStateChange(e.target.value); });
        
        // City select
        const citySel = controlsRoot.querySelector('#citySelect');
        if (citySel) citySel.addEventListener('change', e => {
            self.avatar.city = e.target.value;
            const label = e.target.options[e.target.selectedIndex]?.text || '';
            self.avatar.cityLabel = label;
            if (self.avatar.city) {
                self.placeCityPin(self.avatar.state, label);
                self.updateNextButton(true);
                if (self.currentStep >= 3) {
                    const c = document.getElementById('avatarCanvas'); if (c) c.style.display = 'block';
                    self.drawAvatar();
                }
            }
        });

        // Option buttons
        controlsRoot.querySelectorAll('.option-button').forEach(btn => {
            btn.addEventListener('click', function() {
                const field = this.getAttribute('data-field');
                const value = this.getAttribute('data-value');
                
                this.closest('.button-group').querySelectorAll('.option-button').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                
                self.avatar[field] = value;
                self.updateNextButton(true);
                
                if (self.currentStep >= 3 && self.avatar.city) {
                    const c = document.getElementById('avatarCanvas'); if (c) c.style.display = 'block';
                    self.drawAvatar();
                }
            });
        });

        // Navigation
        const backBtn = controlsRoot.querySelector('#avatarBackButton');
        const nextBtn = controlsRoot.querySelector('#avatarNextButton');
        if (backBtn) backBtn.addEventListener('click', () => self.goBack());
        if (nextBtn) nextBtn.addEventListener('click', () => self.goNext());

        // Progress dots
        controlsRoot.querySelectorAll('.dot').forEach((dot, i) => {
            dot.addEventListener('click', () => {
                const target = i + 1;
                if (target < self.currentStep || dot.classList.contains('completed')) {
                    self.jumpToStep(target);
                }
            });
        });
    },

    handleStateChange: function(stateKey) {
        this.avatar.state = stateKey;
        const citySel = document.getElementById('citySelect');
        citySel.innerHTML = '<option value="">Choose a city...</option>';
        
        (this.CITIES_BY_STATE[this.avatar.state] || []).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name.toLowerCase().replace(/\s+/g, '-');
            opt.textContent = name;
            citySel.appendChild(opt);
        });
        
        this.updateNextButton(!!this.avatar.state);
        this.highlightStateByKey(this.avatar.state);
        this.zoomToState(this.avatar.state);
        
        if (this.currentStep < 3) {
            const canvas = document.getElementById('avatarCanvas');
            const label = document.getElementById('avatarLabel');
            if (canvas) canvas.style.display = 'none';
            if (label) label.style.display = 'none';
        }
    },

    highlightStateByKey: function(stateKey) {
        if (!this.mapState.g) return;
        const id = this.FIPS[stateKey];
        this.mapState.g.selectAll('path.state').classed('selected', false);
        this.mapState.g.select(`path.state[data-id="${id}"]`).classed('selected', true);
    },

    zoomToState: function(stateKey) {
        if (!this.mapState.path) return;
        const id = this.FIPS[stateKey];
        const f = this.mapState.statesFeatures.find(d => +d.id === +id);
        if (!f) return;
        
        const [[x0, y0], [x1, y1]] = this.mapState.path.bounds(f);
        const {width, height} = this.mapState;
        const k = Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height));
        const tx = (width - k * (x0 + x1)) / 2;
        const ty = (height - k * (y0 + y1)) / 2;
        
        this.mapState.svg.transition().duration(700)
            .call(this.mapState.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    },

    // FIXED: Place city pin with actual coordinates
    placeCityPin: function(stateKey, cityName) {
        if (!this.mapState.g || !this.mapState.projection) return;
        const id = this.FIPS[stateKey];
        const stateAbbr = this.USPS_ABBR[id];
        
        // Try to find actual city coordinates
        const cityKey = `${cityName.toLowerCase()}|${stateAbbr}`;
        let x, y;
        
        if (this.CITY_COORDINATES && this.CITY_COORDINATES[cityKey]) {
            // Use actual coordinates
            const coords = this.CITY_COORDINATES[cityKey];
            const projected = this.mapState.projection([coords.lng, coords.lat]);
            if (projected) {
                [x, y] = projected;
            } else {
                // Fallback to state centroid if projection fails
                const f = this.mapState.statesFeatures.find(d => +d.id === +id);
                if (f) [x, y] = this.mapState.path.centroid(f);
            }
        } else {
            // Fallback to state centroid if no coordinates found
            const f = this.mapState.statesFeatures.find(d => +d.id === +id);
            if (f) [x, y] = this.mapState.path.centroid(f);
        }
        
        if (!x || !y) return;
        
        // FIXED: New pin design - smaller and more elegant
        const r = 3; // Reduced from 4 to 3
        const pinHeight = 1.5 * r; // Height of pin stem
        
        this.mapState.g.selectAll('g.city-pin, text.city-label').remove();
        const pin = this.mapState.g.append('g').attr('class', 'city-pin');
        
        // Pin drop shape - more refined
        const pinPath = `M ${x},${y} L ${x - r * 0.7},${y - pinHeight} 
                         A ${r * 0.7} ${r * 0.7} 0 1 1 ${x + r * 0.7},${y - pinHeight} Z`;
        
        pin.append('path')
            .attr('d', pinPath)
            .attr('fill', '#d75b87') // Changed to match theme color
            .attr('stroke', '#4d1f2f') // Darker outline
            .attr('stroke-width', 0.8); // Thinner stroke
        
        // Add small white dot at top
        pin.append('circle')
            .attr('cx', x)
            .attr('cy', y - pinHeight)
            .attr('r', 1)
            .attr('fill', '#fff');
        
        // Add city label if provided
        if (cityName) {
            this.mapState.g.append('text')
                .attr('class', 'city-label')
                .attr('x', x + 6) // Offset to the right of pin
                .attr('y', y - 4)
                .attr('font-family', 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial')
                .attr('font-size', '9px') // Slightly larger for readability
                .attr('font-weight', '600')
                .attr('fill', '#4d1f2f')
                .attr('stroke', '#fff')
                .attr('stroke-width', '0.3px')
                .attr('paint-order', 'stroke')
                .attr('pointer-events', 'none')
                .text(cityName);
        }
    },

    drawAvatar: function() {
        const canvas = document.getElementById('avatarCanvas');
        const label = document.getElementById('avatarLabel');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!this.avatar.city) {
            canvas.style.display = 'none';
            if (label) label.style.display = 'none';
            return;
        }
        
        // Show canvas and label
        canvas.style.display = 'block';
        const avatarLabel = document.getElementById('avatarLabelText');
        if (avatarLabel && this.avatar.name) {
            avatarLabel.textContent = this.avatar.name;
        } else if (avatarLabel) {
            avatarLabel.textContent = 'Your Avatar';
        }
        if (label) label.style.display = 'block';
        
        const skinColors = {'white': '#F5D7B8', 'black': '#8B5A3C', 'asian': '#E5C4A1', 'hispanic': '#D4A574'};
        const hairColors = {'white': '#8B4513', 'black': '#2C1810', 'asian': '#1A0F08', 'hispanic': '#3D2817'};
        const skin = skinColors[this.avatar.race || 'white'] || '#F5D7B8';
        const hair = hairColors[this.avatar.race || 'white'] || '#8B4513';
        const shirt = this.avatar.gender === 'female' ? '#FFB6C1' : '#87CEEB';
        
        // Scale factor for 180x180 canvas (original design was 160x160, so 180/160 = 1.125)
        const scale = 1.125;
        
        // Graduation gown
        if (this.avatar.education === 'graduate') {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(45 * scale, 93 * scale, 70 * scale, 65 * scale);
            ctx.fillRect(50 * scale, 93 * scale, 60 * scale, 10 * scale);
        }
        
        // Shirt
        ctx.fillStyle = shirt;
        ctx.fillRect(58 * scale, 98 * scale, 44 * scale, 55 * scale);
        
        // Head
        ctx.fillStyle = skin;
        ctx.fillRect(63 * scale, 58 * scale, 34 * scale, 34 * scale);
        
        // Hair
        ctx.fillStyle = hair;
        if (this.avatar.gender === 'female') {
            ctx.fillRect(63 * scale, 53 * scale, 34 * scale, 12 * scale);
            ctx.fillRect(58 * scale, 63 * scale, 12 * scale, 28 * scale);
            ctx.fillRect(90 * scale, 63 * scale, 12 * scale, 28 * scale);
        } else {
            ctx.fillRect(63 * scale, 53 * scale, 34 * scale, 14 * scale);
        }
        
        // Eyes and mouth
        ctx.fillStyle = '#000';
        ctx.fillRect(71 * scale, 68 * scale, 5 * scale, 5 * scale);
        ctx.fillRect(84 * scale, 68 * scale, 5 * scale, 5 * scale);
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(74 * scale, 80 * scale, 12 * scale, 4 * scale);
        
        // Mortarboard (college+)
        if (this.avatar.education === 'college' || this.avatar.education === 'graduate') {
            ctx.fillStyle = '#000';
            ctx.fillRect(57 * scale, 46 * scale, 46 * scale, 8 * scale);
            ctx.fillRect(70 * scale, 39 * scale, 20 * scale, 7 * scale);
        }
        
        // Tassel (graduate only)
        if (this.avatar.education === 'graduate') {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(100 * scale, 44 * scale, 4 * scale, 16 * scale);
            ctx.fillRect(96 * scale, 58 * scale, 12 * scale, 4 * scale);
        }
        
        // Income symbols
        if (this.avatar.income) {
            ctx.save();
            ctx.font = 'bold ' + Math.floor(20 * scale) + 'px system-ui';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#1a7f2e';
            const money = this.avatar.income === 'low' ? '$' : (this.avatar.income === 'middle' ? '$$' : '$$$');
            ctx.fillText(money, canvas.width - 8, 8);
            ctx.restore();
        }
    },

        updateNextButton: function(enabled) {
        const btn = document.getElementById('avatarNextButton');
        if (btn) {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.5';
            btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
    },

    updateBackButton: function() {
        const btn = document.getElementById('avatarBackButton');
        if (btn) btn.disabled = this.currentStep === 1;
    },

    goNext: function() {
        // Handle Step 0 (naming) - ALWAYS allow proceeding
        if (this.currentStep === 0) {
            const nameInput = document.getElementById('avatarNameInput');
            if (nameInput) {
                this.avatar.name = nameInput.value.trim();
            }
            this.currentStep = 1;
            document.getElementById('avatarStep0').classList.remove('active');
            document.getElementById('avatarStep1').classList.add('active');
            this.updateNavigationState();
            return;
        }
        

        if (this.currentStep < 6) {
            let ok = false;
            if (this.currentStep === 1 && this.avatar.state) ok = true;
            if (this.currentStep === 2 && this.avatar.city) ok = true;
            if (this.currentStep === 3 && this.avatar.gender) ok = true;
            if (this.currentStep === 4 && this.avatar.race) ok = true;
            if (this.currentStep === 5 && this.avatar.education) ok = true;
            if (this.currentStep === 6 && this.avatar.income) ok = true;
            
            if (!ok) return;
            
            document.getElementById(`avatarStep${this.currentStep}`).classList.remove('active');
            document.querySelectorAll('#avatarControls .dot')[this.currentStep - 1].classList.remove('active');
            document.querySelectorAll('#avatarControls .dot')[this.currentStep - 1].classList.add('completed');
            
            this.currentStep++;
            document.getElementById(`avatarStep${this.currentStep}`).classList.add('active');
            document.querySelectorAll('#avatarControls .dot')[this.currentStep - 1].classList.add('active');
            
            if (this.currentStep >= 3 && this.avatar.city) {
                document.getElementById('avatarCanvas').style.display = 'block';
                this.drawAvatar();
            }
            
            this.updateNextButton(false);
        } else {
            // All steps complete
            if (this.avatar.state && this.avatar.city && this.avatar.gender && 
                this.avatar.race && this.avatar.education && this.avatar.income) {
                this.completeAvatar();
            }
        }
        this.updateBackButton();
    },

    goBack: function() {
        if (this.currentStep > 1) {
            document.getElementById(`avatarStep${this.currentStep}`).classList.remove('active');
            document.querySelectorAll('#avatarControls .dot')[this.currentStep - 1].classList.remove('active');
            
            this.currentStep--;
            document.getElementById(`avatarStep${this.currentStep}`).classList.add('active');
            document.querySelectorAll('#avatarControls .dot')[this.currentStep - 1].classList.add('active');
            
            let has = false;
            if (this.currentStep === 1 && this.avatar.state) has = true;
            if (this.currentStep === 2 && this.avatar.city) has = true;
            if (this.currentStep === 3 && this.avatar.gender) has = true;
            if (this.currentStep === 4 && this.avatar.race) has = true;
            if (this.currentStep === 5 && this.avatar.education) has = true;
            if (this.currentStep === 6 && this.avatar.income) has = true;
            
            this.updateNextButton(has);
            
            if (this.currentStep < 3) {
                const canvas = document.getElementById('avatarCanvas');
                const label = document.getElementById('avatarLabel');
                if (canvas) canvas.style.display = 'none';
                if (label) label.style.display = 'none';
            }
        }
        this.updateBackButton();
    },

    jumpToStep: function(target) {
        document.getElementById(`avatarStep${this.currentStep}`).classList.remove('active');
        document.querySelectorAll('#avatarControls .dot')[this.currentStep - 1].classList.remove('active');
        
        this.currentStep = target;
        document.getElementById(`avatarStep${this.currentStep}`).classList.add('active');
        document.querySelectorAll('#avatarControls .dot')[this.currentStep - 1].classList.add('active');
        
        let hasSel = false;
        if (this.currentStep === 1 && this.avatar.state) hasSel = true;
        if (this.currentStep === 2 && this.avatar.city) hasSel = true;
        if (this.currentStep === 3 && this.avatar.gender) hasSel = true;
        if (this.currentStep === 4 && this.avatar.race) hasSel = true;
        if (this.currentStep === 5 && this.avatar.education) hasSel = true;
        if (this.currentStep === 6 && this.avatar.income) hasSel = true;
        
        this.updateNextButton(hasSel);
        this.updateBackButton();
        
        if (this.currentStep < 3) {
            const canvas = document.getElementById('avatarCanvas');
            const label = document.getElementById('avatarLabel');
            if (canvas) canvas.style.display = 'none';
            if (label) label.style.display = 'none';
        }
    },

    completeAvatar: function() {
        const noteDiv = document.getElementById('avatarNote');
        if (noteDiv) {
            noteDiv.style.display = 'block';
        }
        
        // Auto-open prediction modal after a short delay
        setTimeout(() => {
            this.openPredictionModal();
        }, 800);
    },

    openPredictionModal: function() {
        const modal = document.getElementById('avatarPredictionModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        } else {
            console.warn('openPredictionModal: modal not found');
        }
    },

    submitGuess: function() {
        const sliderEl = document.getElementById('avatarPredictionSlider');
        const userGuessVal = sliderEl ? parseInt(sliderEl.value, 10) : 50;
        
        // Close prediction modal (guarded)
        const predModal = document.getElementById('avatarPredictionModal');
        if (predModal) {
            predModal.classList.remove('show');
            predModal.style.display = 'none';
        }
        
        // Open result modal with hourglass
        const resultModal = document.getElementById('avatarResultModal');
        const hourglass = document.getElementById('avatarHourglass');
        const resultContent = document.getElementById('avatarResultContent');
        
        if (resultModal) {
            resultModal.classList.add('show');
            resultModal.style.display = 'flex';
        }
        
        if (hourglass) {
            hourglass.classList.add('show');
            hourglass.style.display = 'block';
        }
        
        if (resultContent) {
            resultContent.style.display = 'none';
        }
        
        // Calculate actual mobility
        const key = `${this.avatar.income}-${this.avatar.race}-${this.avatar.education}`;
        const actualValue = this.mobilityRates[key] || 15.5;
        
        // Update displays (guarded)
        const userGuessEl = document.getElementById('avatarUserGuess');
        const actualEl = document.getElementById('avatarActualValue');
        if (userGuessEl) userGuessEl.textContent = userGuessVal + '%';
        if (actualEl) actualEl.textContent = actualValue.toFixed(1) + '%';
        
        // Calculate feedback message
        const diff = Math.abs(userGuessVal - actualValue);
        let msg = diff < 5 ? '🎯 Incredible! You were very close to the actual data.'
                : diff < 15 ? '👍 Good estimate! The reality is somewhat different.'
                : '😮 The gap between perception and reality is significant!';
        
        const msgEl = document.getElementById('avatarResultMessage');
        if (msgEl) msgEl.innerHTML = `<p style="margin-top:.75rem;font-size:1.05rem;">${msg}</p>`;
        
        // Show results after hourglass animation
        setTimeout(() => {
            if (hourglass) {
                hourglass.classList.remove('show');
                hourglass.style.display = 'none';
            }
            if (resultContent) {
                resultContent.style.display = 'block';
            }
        }, 1600);
    },

    openMountainClimb: function() {
        // Hide avatar builder screen
        const s5 = document.getElementById('screen5');
        if (s5) s5.style.display = 'none';

        // Show mountain climb screen
        const screen9 = document.getElementById('screen9');
        if (screen9) {
            screen9.style.display = 'block';
            // Initialize mountain climb with avatar data (guarded)
            if (typeof MountainClimb !== 'undefined' && MountainClimb && typeof MountainClimb.init === 'function') {
                MountainClimb.init(this.avatar);
            } else {
                console.warn('openMountainClimb: MountainClimb not available');
            }
            // Scroll to mountain climb
            if (screen9.scrollIntoView) screen9.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.warn('openMountainClimb: screen9 not found');
        }
    },

    resetAvatar: function() {
        // Close result modal
        const resultModal = document.getElementById('avatarResultModal');
        if (resultModal) {
            resultModal.classList.remove('show');
            resultModal.style.display = 'none';
        }
        
        // Reset avatar data
        this.avatar = { state: null, city: null, cityLabel: null, gender: 'male', race: null, education: null, income: null };
        
        // Reset UI (guarded)
        const stateSel = document.getElementById('stateSelect'); if (stateSel) stateSel.value = '';
        const citySel = document.getElementById('citySelect'); if (citySel) citySel.innerHTML = '<option value="">Choose a city...</option>';
        const avatarNote = document.getElementById('avatarNote'); if (avatarNote) avatarNote.style.display = 'none';
        
        // Reset steps
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById('avatarStep1').classList.add('active');
        
        document.querySelectorAll('#avatarControls .dot').forEach((d, i) => {
            d.classList.remove('active', 'completed');
            if (i === 0) d.classList.add('active');
        });
        
        // Reset gender button to male (guarded)
        document.querySelectorAll('#avatarStep3 .option-button').forEach(b => b.classList.remove('selected'));
        const maleBtn = document.querySelector('#avatarStep3 .option-button[data-value="male"]'); if (maleBtn) maleBtn.classList.add('selected');
        
        // Reset other buttons
        document.querySelectorAll('#avatarStep4 .option-button, #avatarStep5 .option-button, #avatarStep6 .option-button').forEach(b => b.classList.remove('selected'));
        
        // Reset slider
        const slider = document.getElementById('avatarPredictionSlider'); if (slider) slider.value = 50;
        const sliderVal = document.getElementById('avatarPredictionValue'); if (sliderVal) sliderVal.textContent = '50%';
        
        // Clear canvas and map
        const canvas = document.getElementById('avatarCanvas');
        const label = document.getElementById('avatarLabel');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
        if (label) {
            label.style.display = 'none';
        }
        
        // Reset map
        if (this.mapState.g) {
            this.mapState.g.selectAll('path.state').classed('selected', false);
            this.mapState.g.selectAll('g.city-pin, text.city-label').remove();
        }
        
        // Reset to step 1
        this.avatar.name = '';
        const nameInput = document.getElementById('avatarNameInput');
        if (nameInput) nameInput.value = '';
        this.currentStep = 0;
        this.updateNextButton(true);  // Enable Next for Step 0 (naming is optional)
        this.updateBackButton();
        
        // Reset zoom
        if (this.mapState.svg && this.mapState.zoom) {
            this.mapState.svg.transition().duration(300).call(this.mapState.zoom.transform, d3.zoomIdentity);
        }
    }
};
// ============================================
// MOUNTAIN CLIMB CODE (COMBINED)
// ============================================

// FINAL VERSION - WITH MAXIMUM DEBUGGING

console.log('🔵 mountain-climb.js loading...');