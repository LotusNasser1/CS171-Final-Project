// Mountain Climb Race - Improved Climbing Visualization
// - Linked state/city selects (state first, then city)
// - Defaults to avatar's city/state
// - Mountain fully connected on the right side
// - Sun on the left, clouds, nicer scene
// - Winner popup with mobility bars for ALL racers (no extra text)

const MountainClimb = {
    canvas: null,
    ctx: null,
    userAvatar: null,
    racers: [],
    obstacles: [],
    mountainPath: [],
    isRacing: false,
    animationFrame: null,
    raceSpeed: 1,
    lastTime: 0,
    raceStartTime: 0,
    opponentsActive: [true, false, false],
    winnerOverlayShown: false,
    avatarCity: '',
    avatarState: '',

    // Approximate upward mobility rates by race / education / gender.
    // Keys: `${race}-${education}-${gender}`
    MOBILITY_RATES: {
        'white-hs-male': 38, 'white-hs-female': 32,
        'white-college-male': 53, 'white-college-female': 47,
        'white-graduate-male': 68, 'white-graduate-female': 62,

        'black-hs-male': 28, 'black-hs-female': 22,
        'black-college-male': 41, 'black-college-female': 35,
        'black-graduate-male': 51, 'black-graduate-female': 45,

        'asian-hs-male': 48, 'asian-hs-female': 42,
        'asian-college-male': 65, 'asian-college-female': 59,
        'asian-graduate-male': 75, 'asian-graduate-female': 69,

        'hispanic-hs-male': 33, 'hispanic-hs-female': 28,
        'hispanic-college-male': 47, 'hispanic-college-female': 42,
        'hispanic-graduate-male': 58, 'hispanic-graduate-female': 52
    },

    RACE_COLORS: {
        white: '#E8D4C4',
        black: '#8B5A2B',
        asian: '#FFD700',
        hispanic: '#FF8C00'
    },

    // All states (labels & values are the same to keep it simple)
    STATE_OPTIONS: [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
        'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
        'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
        'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
        'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
        'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
        'District of Columbia'
    ],

    // A few example cities per state – this just controls the dropdown.
    CITIES_BY_STATE: {
        'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Safford'],
        'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
        'New York': ['New York', 'Buffalo', 'Rochester', 'Albany'],
        'Illinois': ['Chicago', 'Springfield', 'Peoria'],
        'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
        'Georgia': ['Atlanta', 'Savannah', 'Augusta'],
        'Washington': ['Seattle', 'Spokane', 'Tacoma'],
        'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
        'Minnesota': ['Minneapolis', 'St. Paul', 'Duluth'],
        'Massachusetts': ['Boston', 'Cambridge', 'Springfield'],
        'District of Columbia': ['Washington, DC']
        // other states will just show no city suggestions unless you add them here
    },

    init(avatarData) {
        console.log('🏁 Mountain Climb init (improved version)');
        this.userAvatar = avatarData;

        const container = document.getElementById('mountainClimbContainer');
        if (!container) {
            console.warn('mountainClimbContainer not found');
            return;
        }

        const avatarCity = avatarData.cityLabel || avatarData.city || 'Hometown';
        const avatarState = avatarData.state || '';

        this.avatarCity = avatarCity;
        this.avatarState = avatarState;

        container.innerHTML = this.getHTML(avatarData);

        this.setOpponentDefaults(avatarData);
        this.setupLocationSelects(1);
        this.setupLocationSelects(2);
        this.setupLocationSelects(3);

        // Canvas setup
        this.canvas = document.getElementById('raceCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.buildMountainPath();
        this.drawMountain();
    },

    getHTML(avatar) {
        const name = avatar.name || 'Your Avatar';
        const race = avatar.race || 'white';
        const gender = avatar.gender || 'male';
        const education = avatar.education || 'college';
        const city = avatar.cityLabel || avatar.city || 'Hometown';
        const state = avatar.state || '';

        const eduLabel =
            education === 'hs' ? 'High School' :
                education === 'graduate' ? 'College graduate' :
                    'College';

        const avatarEmoji =
            race === 'black' ? '🧑🏿‍🦱' :
                race === 'asian' ? '🧑🏻‍💻' :
                    race === 'hispanic' ? '🧑🏽‍🦱' :
                        '🧑🏼';

        return `
            <style>
                .race-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: Arial, sans-serif;
                    color: #4d1f2f;
                    font-size: 16px;
                }

                .race-header {
                    background: #d75b87;
                    color: white;
                    padding: 1.9rem 2.1rem;
                    border: 4px solid #4d1f2f;
                    margin-bottom: 1.75rem;
                    box-shadow: 6px 6px 0 rgba(0,0,0,0.15);
                    display: grid;
                    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
                    gap: 1.6rem;
                    align-items: center;
                }

                .race-header-title {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 1.15rem;
                    margin-bottom: 0.9rem;
                }

                .race-header-subtitle {
                    font-size: 0.95rem;
                    line-height: 1.5;
                }

                .avatar-display {
                    background: rgba(255,255,255,0.15);
                    border-radius: 12px;
                    padding: 1.1rem 1.4rem;
                    display: flex;
                    gap: 1.1rem;
                    align-items: center;
                }

                .avatar-icon {
                    font-size: 3rem;
                    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.3));
                }

                .avatar-meta {
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .avatar-meta-title {
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                    font-size: 1rem;
                }

                .avatar-meta-tagline {
                    font-size: 0.8rem;
                    opacity: 0.9;
                }

                .layout-two-column {
                    display: grid;
                    grid-template-columns: minmax(0, 2.2fr) minmax(0, 3fr);
                    gap: 1.6rem;
                    margin-bottom: 1.6rem;
                    font-size: 0.95rem;
                }

                .opponents-panel,
                .canvas-wrapper {
                    background: white;
                    padding: 1.6rem 1.9rem;
                    border: 4px solid #4d1f2f;
                    box-shadow: 6px 6px 0 rgba(0,0,0,0.12);
                }

                .opponents-panel h2,
                .canvas-title {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 1.05rem;
                    margin: 0 0 1.1rem 0;
                    color: #4d1f2f;
                }

                .opponents-description {
                    font-size: 0.9rem;
                    margin-bottom: 1.1rem;
                    color: #555;
                }

                .opponent-box {
                    background: #FFF9E6;
                    padding: 1.1rem 1.3rem;
                    border: 3px solid #4d1f2f;
                    margin-bottom: 1rem;
                }

                .opponent-box:last-child {
                    margin-bottom: 0;
                }

                .opponent-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.8rem;
                    gap: 0.5rem;
                }

                .opponent-header h3 {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 0.8rem;
                    margin: 0;
                    color: #4d1f2f;
                }

                .toggle-btn {
                    background: #d75b87;
                    color: white;
                    border: 3px solid #4d1f2f;
                    border-radius: 999px;
                    padding: 0.4rem 1rem;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 0.7rem;
                    cursor: pointer;
                    box-shadow: 3px 3px 0 rgba(77,31,47,0.4);
                }

                .toggle-btn.inactive {
                    background: #999;
                    box-shadow: 0 0 0 rgba(0,0,0,0.1);
                }

                .opponent-settings {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.9rem 1.1rem;
                    font-size: 0.9rem;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    font-size: 0.85rem;
                }

                .input-group label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                }

                .input-group input,
                .input-group select {
                    padding: 0.45rem 0.6rem;
                    border: 2px solid #4d1f2f;
                    font-size: 0.85rem;
                    border-radius: 4px;
                }

                .controls-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 0.6rem;
                    margin-bottom: 0.85rem;
                }

                .btn {
                    background: #d75b87;
                    color: white;
                    border: 3px solid #4d1f2f;
                    border-radius: 999px;
                    padding: 0.65rem 1.5rem;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 0.75rem;
                    cursor: pointer;
                    box-shadow: 4px 4px 0 rgba(77,31,47,0.4);
                    transition: transform 0.05s ease, box-shadow 0.05s ease;
                }

                .btn:hover {
                    transform: translate(2px, 2px);
                    box-shadow: 2px 2px 0 rgba(77,31,47,0.4);
                }

                .btn-secondary {
                    background: white;
                    color: #4d1f2f;
                }

                .canvas-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 0.9rem;
                    font-size: 0.95rem;
                }

                .canvas-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 0.5rem;
                }

                .canvas-subtitle {
                    font-size: 0.9rem;
                    color: #555;
                }

                #raceCanvas {
                    width: 100%;
                    border: 4px solid #4d1f2f;
                    display: block;
                    background: #E0F6FF;
                }

                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.9rem;
                    font-size: 0.9rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .legend-color {
                    width: 16px;
                    height: 16px;
                    border-radius: 3px;
                    border: 2px solid #4d1f2f;
                }

                /* Winner popup overlay */
                .winner-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }

                .winner-card {
                    background: #FFFDF7;
                    border: 5px solid #4d1f2f;
                    padding: 1.9rem 2.1rem;
                    max-width: 480px;
                    width: 90%;
                    box-shadow: 10px 10px 0 rgba(0,0,0,0.35);
                    text-align: center;
                    animation: winnerPop 0.25s ease-out;
                    font-size: 0.95rem;
                }

                .winner-title {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 1.05rem;
                    margin-bottom: 1rem;
                    color: #4d1f2f;
                }

                .winner-name {
                    font-size: 1.6rem;
                    font-weight: 800;
                    margin-bottom: 0.6rem;
                    color: #d75b87;
                }

                /* --- WINNER BARS (clean + readable) --- */
                .winner-bars {
                    margin-top: 1rem;
                    margin-bottom: 1.4rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                    text-align: left;
                }

                .winner-bar-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.95rem;
                }

                .winner-bar-row-label {
                    min-width: 160px;          /* room for the name */
                    text-align: right;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .winner-bar-row-winner .winner-bar-row-label {
                    font-weight: 700;
                }

                .winner-bar-bg {
                    position: relative;
                    flex: 1;
                    max-width: 320px;          /* bar not too wide */
                    height: 22px;
                    border-radius: 999px;
                    border: 2px solid #4d1f2f;
                    background: #FFE5F1;
                    overflow: hidden;
                }

                .winner-bar-row-winner .winner-bar-bg {
                    background: #FFD3E6;
                }

                .winner-bar-fill {
                    height: 100%;
                    background: #d75b87;
                }

                .winner-bar-pct {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #4d1f2f;
                }




                .winner-card .btn {
                    width: 100%;
                }

                @keyframes winnerPop {
                    from {
                        transform: scale(0.8) translateY(10px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }

                @media (max-width: 900px) {
                    .race-header {
                        grid-template-columns: 1fr;
                    }
                    .layout-two-column {
                        grid-template-columns: 1fr;
                    }
                }
            </style>

            <div class="race-container">
                <div class="race-header">
                    <div>
                        <div class="race-header-title">LEVEL 3 · CLIMB THE MOUNTAIN</div>
                        <div class="race-header-subtitle">
                            Every climber is trying to reach the same summit, but their route is shaped by
                            race, gender, education, and where they grew up. Watch how quickly each avatar
                            can scramble up the exact same path.
                        </div>
                    </div>
                    <div class="avatar-display">
                        <div class="avatar-icon">${avatarEmoji}</div>
                        <div class="avatar-meta">
                            <div class="avatar-meta-title">${name}</div>
                            <div>${race.charAt(0).toUpperCase() + race.slice(1)} • ${gender} • ${eduLabel}</div>
                            <div>${city}${state ? ', ' + state : ''}</div>
                            <div class="avatar-meta-tagline">
                                Your path to the top is based on real upward mobility data.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="layout-two-column">
                    <div class="opponents-panel">
                        <h2>Choose your opponents</h2>
                        <div class="opponents-description">
                            Turn opponents on or off and change their background traits.
                            Everyone runs on the <strong>same mountain route</strong>, but some
                            start the race with more momentum.
                        </div>

                        <div class="opponent-box" id="opponent1Box">
                            <div class="opponent-header">
                                <h3>🔴 Opponent 1</h3>
                                <button class="toggle-btn"
                                        id="toggle1"
                                        onclick="MountainClimb.toggleOpponent(1)">
                                    Active
                                </button>
                            </div>
                            <div id="opponent1Settings" class="opponent-settings">
                                <div class="input-group">
                                    <label>Name</label>
                                    <input type="text" id="opp1Name" value="Opponent 1">
                                </div>
                                <div class="input-group">
                                    <label>Race</label>
                                    <select id="opp1Race">
                                        <option value="white">White</option>
                                        <option value="black">Black</option>
                                        <option value="asian">Asian</option>
                                        <option value="hispanic">Hispanic</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Gender</label>
                                    <select id="opp1Gender">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Education</label>
                                    <select id="opp1Education">
                                        <option value="hs">High School</option>
                                        <option value="college">College</option>
                                        <option value="graduate">Graduate</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>City</label>
                                    <select id="opp1City"></select>
                                </div>
                                <div class="input-group">
                                    <label>State</label>
                                    <select id="opp1State"></select>
                                </div>
                            </div>
                        </div>

                        <div class="opponent-box" id="opponent2Box">
                            <div class="opponent-header">
                                <h3>🟡 Opponent 2</h3>
                                <button class="toggle-btn inactive"
                                        id="toggle2"
                                        onclick="MountainClimb.toggleOpponent(2)">
                                    Inactive
                                </button>
                            </div>
                            <div id="opponent2Settings" class="opponent-settings" style="display:none;">
                                <div class="input-group">
                                    <label>Name</label>
                                    <input type="text" id="opp2Name" value="Opponent 2">
                                </div>
                                <div class="input-group">
                                    <label>Race</label>
                                    <select id="opp2Race">
                                        <option value="white">White</option>
                                        <option value="black">Black</option>
                                        <option value="asian">Asian</option>
                                        <option value="hispanic">Hispanic</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Gender</label>
                                    <select id="opp2Gender">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Education</label>
                                    <select id="opp2Education">
                                        <option value="hs">High School</option>
                                        <option value="college">College</option>
                                        <option value="graduate">Graduate</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>City</label>
                                    <select id="opp2City"></select>
                                </div>
                                <div class="input-group">
                                    <label>State</label>
                                    <select id="opp2State"></select>
                                </div>
                            </div>
                        </div>

                        <div class="opponent-box" id="opponent3Box">
                            <div class="opponent-header">
                                <h3>🟢 Opponent 3</h3>
                                <button class="toggle-btn inactive"
                                        id="toggle3"
                                        onclick="MountainClimb.toggleOpponent(3)">
                                    Inactive
                                </button>
                            </div>
                            <div id="opponent3Settings" class="opponent-settings" style="display:none;">
                                <div class="input-group">
                                    <label>Name</label>
                                    <input type="text" id="opp3Name" value="Opponent 3">
                                </div>
                                <div class="input-group">
                                    <label>Race</label>
                                    <select id="opp3Race">
                                        <option value="white">White</option>
                                        <option value="black">Black</option>
                                        <option value="asian">Asian</option>
                                        <option value="hispanic">Hispanic</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Gender</label>
                                    <select id="opp3Gender">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Education</label>
                                    <select id="opp3Education">
                                        <option value="hs">High School</option>
                                        <option value="college">College</option>
                                        <option value="graduate">Graduate</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>City</label>
                                    <select id="opp3City"></select>
                                </div>
                                <div class="input-group">
                                    <label>State</label>
                                    <select id="opp3State"></select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="canvas-wrapper">
                        <div class="canvas-title-row">
                            <div>
                                <div class="canvas-title">Run the mountain race</div>
                            </div>
                            <div class="controls-row">
                                <button class="btn" onclick="MountainClimb.startRace()">🏁 Start Race</button>
                                <button class="btn btn-secondary" onclick="MountainClimb.reset()">↻ Reset</button>
                                <button class="btn btn-secondary" onclick="MountainClimb.toggleSpeed()">⚡ <span id="speedLabel">1x</span></button>
                            </div>
                        </div>

                        <canvas id="raceCanvas" width="960" height="600"></canvas>

                        <div class="legend">
                            <div class="legend-item">
                                <div class="legend-color" style="background:#FFFFFF;"></div>
                                <span>Mountain path (everyone follows this line)</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color" style="background:#444;"></div>
                                <span>Rocks &amp; barriers (trigger jumps)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Winner popup overlay -->
                <div class="winner-overlay" id="winnerOverlay">
                    <div class="winner-card">
                        <div class="winner-title">🏆 Winner is...</div>
                        <div class="winner-name" id="winnerName">Winner Name</div>
                        <div class="winner-bars" id="winnerBars"></div>
                        <button class="btn" onclick="MountainClimb.closeWinnerOverlay()">Play again</button>
                    </div>
                </div>
            </div>
        `;
    },

    setOpponentDefaults(avatar) {
        const race = avatar.race || 'white';
        const gender = avatar.gender || 'male';
        const education = avatar.education || 'college';

        // Opponent 1: same as user (already active)
        document.getElementById('opp1Race').value = race;
        document.getElementById('opp1Gender').value = gender;
        document.getElementById('opp1Education').value = education;

        // Opponent 2: slightly advantaged
        document.getElementById('opp2Race').value = 'white';
        document.getElementById('opp2Gender').value = 'male';
        document.getElementById('opp2Education').value = 'graduate';

        // Opponent 3: more disadvantaged
        document.getElementById('opp3Race').value = 'black';
        document.getElementById('opp3Gender').value = 'female';
        document.getElementById('opp3Education').value = 'hs';
    },

    setupLocationSelects(index) {
        const stateSelect = document.getElementById(`opp${index}State`);
        const citySelect = document.getElementById(`opp${index}City`);
        if (!stateSelect || !citySelect) return;

        const avatarCity = this.avatarCity;
        const avatarState = this.avatarState;
        const avatarStateLower = (avatarState || '').toLowerCase();

        // Build state options
        stateSelect.innerHTML = '';
        let avatarStateFound = false;

        this.STATE_OPTIONS.forEach(st => {
            const opt = document.createElement('option');
            opt.value = st;
            opt.textContent = st;
            if (avatarState && st.toLowerCase() === avatarStateLower) {
                opt.selected = true;
                avatarStateFound = true;
            }
            stateSelect.appendChild(opt);
        });

        // If avatar's state isn't in the standard list, add it at the top
        if (avatarState && !avatarStateFound) {
            const opt = document.createElement('option');
            opt.value = avatarState;
            opt.textContent = avatarState;
            opt.selected = true;
            stateSelect.insertBefore(opt, stateSelect.firstChild);
        }

        const updateCities = () => {
            const chosenState = stateSelect.value;
            citySelect.innerHTML = '';

            const cities = this.CITIES_BY_STATE[chosenState] || [];

            // If current state matches avatar's state, put avatar's city first
            if (avatarCity && chosenState && chosenState.toLowerCase() === avatarStateLower) {
                const opt = document.createElement('option');
                opt.value = avatarCity;
                opt.textContent = avatarCity;
                citySelect.appendChild(opt);
            }

            cities.forEach(city => {
                if (city === avatarCity &&
                    chosenState.toLowerCase() === avatarStateLower) return; // already added
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });

            // If nothing is there, at least show avatar city text
            if (!citySelect.options.length && avatarCity) {
                const opt = document.createElement('option');
                opt.value = avatarCity;
                opt.textContent = avatarCity;
                citySelect.appendChild(opt);
            }

            if (citySelect.options.length) {
                citySelect.selectedIndex = 0;
            }
        };

        updateCities();
        stateSelect.addEventListener('change', updateCities);
    },

    buildMountainPath() {
        if (!this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.mountainPath = [];
        const steps = 220;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps; // 0 → 1 along the path
            // Span almost the full width to reach the right side
            const x = w * 0.08 + t * w * 0.84;
            const base = h * 0.85 - t * h * 0.7;
            const wave = Math.sin(t * Math.PI * 3.2) * h * 0.05;
            const y = base + wave;
            this.mountainPath.push({ x, y });
        }
    },

    getPointOnPath(t) {
        if (!this.mountainPath.length) return { x: 0, y: 0 };
        t = Math.max(0, Math.min(1, t));
        const idx = t * (this.mountainPath.length - 1);
        const i0 = Math.floor(idx);
        const i1 = Math.min(this.mountainPath.length - 1, i0 + 1);
        const f = idx - i0;
        const p0 = this.mountainPath[i0];
        const p1 = this.mountainPath[i1];
        return {
            x: p0.x + (p1.x - p0.x) * f,
            y: p0.y + (p1.y - p0.y) * f
        };
    },

    drawCloud(x, y, scale) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';

        ctx.beginPath();
        ctx.ellipse(-20, 0, 18, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(0, -6, 20, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(20, 0, 16, 11, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    },

    drawMountain() {
        if (!this.ctx || !this.canvas) return;
        if (!this.mountainPath.length) this.buildMountainPath();

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky background
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#7EC8F5');
        sky.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Sun on the left
        const sunX = w * 0.18;
        const sunY = 95;
        const sunR = 46;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR);
        sunGrad.addColorStop(0, '#FFE66D');
        sunGrad.addColorStop(1, '#FFB347');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();

        // Clouds
        this.drawCloud(w * 0.45, 80, 1.0);
        this.drawCloud(w * 0.70, 110, 1.1);
        this.drawCloud(w * 0.55, 55, 0.9);

        // Mountain body based on the path – fully connected to right side
        ctx.fillStyle = '#8B7D6B';
        ctx.beginPath();
        const first = this.mountainPath[0];
        const last = this.mountainPath[this.mountainPath.length - 1];

        // From bottom-left, up to start of path
        ctx.moveTo(0, h);
        ctx.lineTo(first.x, first.y);

        // Along the ridge/path
        this.mountainPath.forEach(p => ctx.lineTo(p.x, p.y));

        // From last path point down to bottom-right corner
        ctx.lineTo(w, h);

        ctx.closePath();
        ctx.fill();

        // Snow cap near the top ridge
        ctx.fillStyle = '#F7F7F7';
        ctx.beginPath();
        const capIndex = Math.floor(this.mountainPath.length * 0.7);
        ctx.moveTo(this.mountainPath[capIndex].x, this.mountainPath[capIndex].y);
        for (let i = capIndex; i < this.mountainPath.length; i++) {
            const p = this.mountainPath[i];
            ctx.lineTo(p.x, p.y - 12);
        }
        ctx.lineTo(last.x, last.y + 40);
        ctx.closePath();
        ctx.fill();

        // Path line everyone follows
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        this.mountainPath.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Finish flag at the top of the path
        ctx.fillStyle = '#d75b87';
        const finish = last;
        ctx.fillRect(finish.x + 5, finish.y - 40, 26, 20);
        ctx.strokeStyle = '#4d1f2f';
        ctx.lineWidth = 3;
        ctx.strokeRect(finish.x + 5, finish.y - 40, 26, 20);
        ctx.beginPath();
        ctx.moveTo(finish.x + 5, finish.y - 40);
        ctx.lineTo(finish.x + 5, finish.y);
        ctx.stroke();

        // Start banner at the bottom
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#4d1f2f';
        ctx.lineWidth = 3;
        const start = first;
        ctx.fillRect(start.x - 40, start.y + 30, 120, 26);
        ctx.strokeRect(start.x - 40, start.y + 30, 120, 26);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#4d1f2f';
        ctx.textAlign = 'center';
        ctx.fillText('START', start.x + 20, start.y + 48);
    },

    drawObstacles() {
        if (!this.ctx) return;
        const ctx = this.ctx;

        this.obstacles.forEach(o => {
            ctx.save();
            ctx.translate(o.x, o.y);

            if (o.type === 'rock') {
                ctx.fillStyle = '#4A3B32';
                ctx.beginPath();
                ctx.moveTo(-o.size, 0);
                ctx.lineTo(-o.size * 0.2, -o.size * 1.1);
                ctx.lineTo(o.size * 0.9, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = '#3C3C3C';
                ctx.fillRect(-o.size * 0.2, -o.size * 1.4, o.size * 0.4, o.size * 1.4);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(-o.size * 0.15, -o.size * 1.2);
                ctx.lineTo(-o.size * 0.15, -2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.restore();
        });
    },

    toggleOpponent(index) {
        const idx = index - 1;
        this.opponentsActive[idx] = !this.opponentsActive[idx];

        const btn = document.getElementById(`toggle${index}`);
        const settings = document.getElementById(`opponent${index}Settings`);
        if (!btn || !settings) return;

        if (this.opponentsActive[idx]) {
            btn.classList.remove('inactive');
            btn.textContent = 'Active';
            settings.style.display = 'grid';
        } else {
            btn.classList.add('inactive');
            btn.textContent = 'Inactive';
            settings.style.display = 'none';
        }
    },

    toggleSpeed() {
        // Cycle 1x → 2x → 3x → back to 1x
        if (this.raceSpeed === 1) this.raceSpeed = 2;
        else if (this.raceSpeed === 2) this.raceSpeed = 3;
        else this.raceSpeed = 1;

        const label = document.getElementById('speedLabel');
        if (label) label.textContent = `${this.raceSpeed}x`;
    },

    reset() {
        this.isRacing = false;
        this.racers = [];
        this.obstacles = [];
        this.winnerOverlayShown = false;
        cancelAnimationFrame(this.animationFrame);

        this.closeWinnerOverlay();

        this.buildMountainPath();
        this.drawMountain();
    },

    startRace() {
        if (!this.canvas || !this.ctx) return;

        this.racers = [];
        this.obstacles = [];
        this.winnerOverlayShown = false;

        this.closeWinnerOverlay();

        this.buildMountainPath();

        const avatar = this.userAvatar || {};
        const userKey = `${avatar.race || 'white'}-${avatar.education || 'college'}-${avatar.gender || 'male'}`;
        const userRate = this.MOBILITY_RATES[userKey] || 45;

        const avatarCity = this.avatarCity || 'Hometown';
        const avatarState = this.avatarState || '';

        // User racer
        this.racers.push(new Racer(
            avatar.name || 'You',
            avatar.race || 'white',
            avatar.education || 'college',
            avatar.gender || 'male',
            `${avatarCity}${avatarState ? ', ' + avatarState : ''}`,
            userRate,
            true,
            '#FFD700'
        ));

        // Opponents
        for (let i = 1; i <= 3; i++) {
            if (!this.opponentsActive[i - 1]) continue;

            const name = document.getElementById(`opp${i}Name`).value || `Opponent ${i}`;
            const race = document.getElementById(`opp${i}Race`).value;
            const gender = document.getElementById(`opp${i}Gender`).value;
            const edu = document.getElementById(`opp${i}Education`).value;

            let cityVal = document.getElementById(`opp${i}City`).value || avatarCity;
            let stateVal = document.getElementById(`opp${i}State`).value || avatarState;

            const location = `${cityVal}${stateVal ? ', ' + stateVal : ''}`;

            const key = `${race}-${edu}-${gender}`;
            const rate = this.MOBILITY_RATES[key] || 40;

            this.racers.push(new Racer(
                name,
                race,
                edu,
                gender,
                location,
                rate,
                false,
                this.RACE_COLORS[race] || '#ffffff'
            ));
        }

        // Obstacles placed directly on the mountain path
        this.obstacles = [];
        const obstacleCount = 8;
        for (let i = 0; i < obstacleCount; i++) {
            const t = 0.12 + Math.random() * 0.76; // avoid very start & end
            const pt = this.getPointOnPath(t);
            const size = 18 + Math.random() * 16;
            this.obstacles.push({
                t,
                x: pt.x,
                y: pt.y,
                size,
                type: Math.random() > 0.5 ? 'rock' : 'barrier'
            });
        }

        this.isRacing = true;
        this.raceStartTime = performance.now();
        this.lastTime = this.raceStartTime;
        this.animate();
    },

    animate() {
        if (!this.isRacing) return;

        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        this.drawMountain();
        this.drawObstacles();

        this.racers.forEach(r => {
            r.update(delta, this.raceSpeed, this.obstacles);
            r.draw(this.ctx);
        });

        // When everyone finishes, show the popup with winner + bars
        if (this.racers.every(r => r.progress >= 1)) {
            this.isRacing = false;
            if (!this.winnerOverlayShown) {
                const sorted = [...this.racers].sort((a, b) => a.finishTime - b.finishTime);
                const winner = sorted[0];
                this.showWinnerOverlay(winner, sorted);
                this.winnerOverlayShown = true;
            }
            return;
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    },

    showWinnerOverlay(winner, sortedRacers) {
        const overlay = document.getElementById('winnerOverlay');
        const nameEl = document.getElementById('winnerName');
        const barsEl = document.getElementById('winnerBars');

        if (!overlay) return;

        if (nameEl) {
            nameEl.textContent = winner.name;
        }

        if (barsEl) {
            let html = '';
            sortedRacers.forEach((r, idx) => {
                const rank = idx + 1;
                const pct = Math.max(0, Math.min(100, r.mobilityRate || 0));
                const youTag = r.isUser ? ' (you)' : '';
        const labelPrefix = r === winner ? '🏆 ' : '';
        const youTagText = r.isUser ? ' (you)' : '';
        const lineLabel = `${labelPrefix}${r.name}${youTagText}`;

        html += `
            <div class="winner-bar-row ${r === winner ? 'winner-bar-row-winner' : ''}">
                <div class="winner-bar-row-label">
                    ${lineLabel}
                </div>
                <div class="winner-bar-bg">
                    <div class="winner-bar-fill" style="width:${pct}%"></div>
                    <div class="winner-bar-pct">${pct}% mobility</div>
                </div>
            </div>
        `;

            });
            barsEl.innerHTML = html;
        }

        overlay.style.display = 'flex';
    },

    closeWinnerOverlay() {
        const overlay = document.getElementById('winnerOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
};

// Racer class ---------------------------------------------------------------

class Racer {
    constructor(name, race, education, gender, location, mobilityRate, isUser, color) {
        this.name = name;
        this.race = race;
        this.education = education;
        this.gender = gender;
        this.location = location;
        this.mobilityRate = mobilityRate;
        this.isUser = isUser;
        this.color = color;

        this.progress = 0;
        this.speed = 0.18 + (mobilityRate / 100) * 0.32; // higher rate → faster
        this.finishTime = null;

        this.isJumping = false;
        this.jumpTime = 0;
        this.jumpDuration = 420;
        this.jumpHeight = 26;

        this.trail = [];
        this.maxTrail = 40;

        this.x = 0;
        this.y = 0;
    }

    update(deltaTime, globalSpeed, obstacles) {
        if (this.finishTime) return;

        let moveSpeed = this.speed * globalSpeed * deltaTime / 3000;

        // Base position along the shared mountain path
        const futureProgress = Math.min(1, this.progress + moveSpeed);
        const basePos = MountainClimb.getPointOnPath(futureProgress);

        // Check for obstacles near the new position
        obstacles.forEach(obs => {
            const dx = basePos.x - obs.x;
            const dy = basePos.y - obs.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < obs.size * 1.2) {
                // Lower mobility racers are slowed more by obstacles
                if (this.mobilityRate < 45) {
                    moveSpeed *= 0.6;
                } else {
                    moveSpeed *= 0.85;
                }

                if (!this.isJumping) {
                    this.isJumping = true;
                    this.jumpTime = 0;
                }
            }
        });

        this.progress += moveSpeed;
        if (this.progress >= 1) {
            this.progress = 1;
            if (!this.finishTime) this.finishTime = performance.now();
        }

        // Ease the progress so movement feels more organic
        const t = this.progress;
        const eased = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const pos = MountainClimb.getPointOnPath(eased);
        let yOffset = 0;

        if (this.isJumping) {
            this.jumpTime += deltaTime;
            const jt = Math.min(1, this.jumpTime / this.jumpDuration);
            yOffset = -Math.sin(jt * Math.PI) * this.jumpHeight;

            if (jt >= 1) {
                this.isJumping = false;
                this.jumpTime = 0;
            }
        }

        this.x = pos.x;
        this.y = pos.y + yOffset;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        // Trail
        if (this.trail.length > 1) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            this.trail.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#4d1f2f';
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-10, -24, 20, 26, 6);
        } else {
            ctx.moveTo(-10, -24);
            ctx.lineTo(10, -24);
            ctx.lineTo(10, 2);
            ctx.lineTo(-10, 2);
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.fillStyle = '#F9D7B5';
        if (this.race === 'black') ctx.fillStyle = '#8B5A2B';
        if (this.race === 'asian') ctx.fillStyle = '#F6C88F';
        if (this.race === 'hispanic') ctx.fillStyle = '#D08B5B';
        ctx.beginPath();
        ctx.arc(0, -34, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -36, 1.3, 0, Math.PI * 2);
        ctx.arc(3, -36, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Flag for user
        if (this.isUser) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-14, -42);
            ctx.lineTo(-14, -20);
            ctx.stroke();

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-14, -42);
            ctx.lineTo(-4, -38);
            ctx.lineTo(-14, -34);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // Name label
        ctx.save();
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(this.name, this.x, this.y - 46);
        ctx.restore();
    }
}

console.log('🏁 Mountain Climb loaded (winner bars only)');
