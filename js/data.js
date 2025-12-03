/**
 * data.js - Data Loading and Case Generation Module
 * 
 * This module handles loading census tract data from the Opportunity Atlas CSV
 * and generating random case profiles for the economic mobility prediction game.
 * 
 * Dependencies:
 *   - PapaParse library for CSV parsing
 * 
 * Exports (Global Functions):
 *   - loadAtlasData(): Loads and parses the atlas CSV data
 *   - getAvatarImage(gender, race): Returns avatar image filename
 *   - pickRandomCase(atlasData): Generates a random case profile
 *   - debugCaseProfile(): Debug utility for localStorage inspection
 */

/**
 * Loads the Opportunity Atlas CSV data and makes it available for use.
 * 
 * @async
 * @returns {Promise<Array>} Array of census tract objects, filtered for valid entries
 */
async function loadAtlasData() {
    try {
        const response = await fetch("data/atlas.csv");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const rows = Papa.parse(text, { header: true }).data;

        // Filter out empty rows - only keep rows with valid tract names
        return rows.filter(row => row.tract_name && row.tract_name.trim() !== '');
    } catch (error) {
        console.error("Error loading atlas data:", error);
        return [];
    }
}

/**
 * Maps gender and race combination to the corresponding avatar image filename.
 * 
 * @param {string} gender - "Male" or "Female"
 * @param {string} race - "White", "Black", "Hispanic", "Asian", or "Native American"
 * @returns {string} Avatar image filename (e.g., "avatar_male_white.png")
 */
function getAvatarImage(gender, race) {
    const avatarMap = {
        "Male_White": "avatar_male_white.png",
        "Male_Black": "avatar_male_black.png",
        "Male_Hispanic": "avatar_male_hispanic.png",
        "Male_Asian": "avatar_male_asian.png",
        "Male_Native American": "avatar_male_native.png",

        "Female_White": "avatar_female_white.png",
        "Female_Black": "avatar_female_black.png",
        "Female_Hispanic": "avatar_female_hispanic.png",
        "Female_Asian": "avatar_female_asian.png",
        "Female_Native American": "avatar_female_native.png"
    };

    const key = `${gender}_${race}`;
    return avatarMap[key] || "pixel_character.png";
}

/**
 * Generates a random case profile from the atlas data.
 * Picks a random census tract and assigns random demographics,
 * then calculates the mobility outcome based on available data.
 * 
 * @param {Array} atlasData - Array of census tract objects from loadAtlasData()
 * @returns {Object|null} Case profile object with all relevant fields, or null on error
 * 
 * Case Profile Structure:
 *   - county: County/commuting zone name
 *   - stateFIPS: State FIPS code
 *   - countyFIPS: County FIPS code
 *   - race: Selected race
 *   - gender: Selected gender
 *   - mobilityOutcome: Mobility percentile (0-100)
 *   - avatarImage: Avatar image filename
 *   - areaType: "Urban", "Suburban", or "Rural"
 *   - parentIncomeLevel: "Low Income", "Middle Income", or "High Income"
 *   - parentIncomeBracket: Income bracket description
 *   - parentEducation: "High School", "Some College", or "College Degree"
 *   - collegeRate: College attendance rate as percentage string
 *   - povertyRate: Poverty rate as percentage string
 *   - locationContext: Descriptive text about location
 *   - familyContext: Descriptive text about family economics
 *   - communityContext: Descriptive text about community education
 *   - popDensity: Population density value
 *   - medianIncome: Formatted median income string
 */
function pickRandomCase(atlasData) {
    if (!atlasData || atlasData.length === 0) {
        console.error("No atlas data available");
        return null;
    }

    // Pick a random census tract
    const caseRow = atlasData[Math.floor(Math.random() * atlasData.length)];
    console.log("Selected census tract:", caseRow.tract_name);

    // Define demographic options and randomly select
    const races = ["White", "Black", "Hispanic", "Asian", "Native American"];
    const genders = ["Male", "Female"];

    const race = races[Math.floor(Math.random() * races.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];

    // Map race to column key format used in the CSV
    const raceKeyMap = {
        "White": "white",
        "Black": "black",
        "Hispanic": "hisp",
        "Asian": "asian",
        "Native American": "natam"
    };
    
    const genderKey = gender.toLowerCase();
    const raceKey = raceKeyMap[race];
    
    // Build the correct column name for mobility data: kfr_{race}_{gender}_p25
    const mobilityColumn = `kfr_${raceKey}_${genderKey}_p25`;
    console.log(`Looking for column: ${mobilityColumn} for ${race} ${gender}`);

    // Extract raw mobility value (already 0-100 percentile)
    let mobilityValue = parseFloat(caseRow[mobilityColumn]);

    // Fallback hierarchy if specific race/gender combo is missing
    if (isNaN(mobilityValue) || mobilityValue === 0) {
        // Try pooled gender for this race
        const pooledRaceColumn = `kfr_${raceKey}_pooled_p25`;
        mobilityValue = parseFloat(caseRow[pooledRaceColumn]);
        console.log(`Fallback to pooled race: ${pooledRaceColumn} = ${mobilityValue}`);
    }
    
    if (isNaN(mobilityValue) || mobilityValue === 0) {
        // Final fallback: overall pooled
        mobilityValue = parseFloat(caseRow["kfr_pooled_pooled_p25"]);
        console.log(`Final fallback to pooled_pooled: ${mobilityValue}`);
    }
    
    if (isNaN(mobilityValue)) {
        mobilityValue = 35; // Safe default if all else fails
        console.error("Could not find valid mobility data, using default: 35");
    }

    // Ensure value is in valid range
    mobilityValue = Math.max(0, Math.min(100, mobilityValue));
    console.log(`Final mobility value: ${mobilityValue.toFixed(1)}`);

    // Extract contextual data from census tract
    const popDensity = parseFloat(caseRow["popdensity2010"]) || 0;
    const collegeRate = parseFloat(caseRow["frac_coll_plus2010"]) || 0;
    const povertyRate = parseFloat(caseRow["poor_share2010"]) || 0;
    const medianIncome = parseFloat(caseRow["med_hhinc2016"]) || 0;
    
    // Determine area type based on population density
    let areaType = "Rural";
    if (popDensity > 3000) {
        areaType = "Urban";
    } else if (popDensity > 500) {
        areaType = "Suburban";
    }
    
    // Determine parent income level based on median household income
    let parentIncomeLevel = "Low Income";
    let parentIncomeBracket = "bottom 25%";
    if (medianIncome > 60000) {
        parentIncomeLevel = "High Income";
        parentIncomeBracket = "top 25%";
    } else if (medianIncome > 40000) {
        parentIncomeLevel = "Middle Income";
        parentIncomeBracket = "middle 50%";
    }
    
    // Determine parent education estimate based on college rate
    let parentEducation = "High School";
    if (collegeRate > 0.35) {
        parentEducation = "College Degree";
    } else if (collegeRate > 0.20) {
        parentEducation = "Some College";
    }
    
    // Create contextual insight strings
    const locationContext = popDensity > 3000 
        ? "Grew up in a densely populated urban area with more job opportunities but higher competition."
        : popDensity > 500
        ? "Raised in a suburban area with moderate access to resources and opportunities."
        : "From a rural area where opportunities may be limited but community ties are strong.";
    
    const familyContext = medianIncome > 60000
        ? "Parents had stable income, providing access to better schools and resources."
        : medianIncome > 40000
        ? "Middle-income household with moderate resources for education and activities."
        : "Lower-income family facing economic constraints that may limit opportunities.";
    
    const communityContext = collegeRate > 0.30
        ? "Neighborhood with high college attendance, creating a culture of educational achievement."
        : collegeRate > 0.15
        ? "Mixed educational outcomes in the community, with some attending college."
        : "Few residents attend college, potentially limiting exposure to higher education pathways.";

    // Assemble the complete case profile object
    const caseProfile = {
        county: caseRow["czname"] || caseRow["tract_name"] || "Unknown County",
        stateFIPS: caseRow["state"] || "00",
        countyFIPS: caseRow["county"] || "000",
        race,
        gender,
        mobilityOutcome: mobilityValue,
        avatarImage: getAvatarImage(gender, race),
        
        // Contextual fields
        areaType,
        parentIncomeLevel,
        parentIncomeBracket,
        parentEducation,
        collegeRate: (collegeRate * 100).toFixed(0) + "%",
        povertyRate: (povertyRate * 100).toFixed(0) + "%",
        locationContext,
        familyContext,
        communityContext,
        popDensity: popDensity.toFixed(0),
        medianIncome: "$" + Math.round(medianIncome).toLocaleString()
    };

    console.log("Generated case profile:", caseProfile);
    console.log("Mobility outcome type:", typeof caseProfile.mobilityOutcome);
    console.log("Mobility outcome value:", caseProfile.mobilityOutcome);
    
    return caseProfile;
}

/**
 * Debug utility function to inspect the current case profile stored in localStorage.
 * Call this from browser console to diagnose data storage issues.
 */
function debugCaseProfile() {
    console.log("=== DEBUG CASE PROFILE ===");
    const stored = localStorage.getItem('currentCase');
    console.log("Raw stored data:", stored);
    
    if (stored) {
        const parsed = JSON.parse(stored);
        console.log("Parsed data:", parsed);
        console.log("mobilityOutcome:", parsed.mobilityOutcome);
        console.log("Type:", typeof parsed.mobilityOutcome);
    } else {
        console.log("Nothing in localStorage!");
    }
}
