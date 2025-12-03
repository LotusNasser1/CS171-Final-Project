document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Loading atlas data...");
        const atlasData = await loadAtlasData();
        
        if (!atlasData || atlasData.length === 0) {
            alert("Failed to load data. Please check that atlas.csv is in the data folder.");
            return;
        }
        
        console.log(`Loaded ${atlasData.length} records`);

        // Generate a random case profile using updated logic
        const caseProfile = pickRandomCase(atlasData);

        if (!caseProfile) {
            alert("Failed to generate case profile");
            return;
        }

        // Save in browser memory for next page
        localStorage.setItem("currentCase", JSON.stringify(caseProfile));

        // Convert State FIPS → State Name
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

        // Set avatar image
        const avatarPhoto = document.getElementById("avatar-photo");
        if (avatarPhoto) {
            avatarPhoto.style.backgroundImage = `url('../asset/${caseProfile.avatarImage}')`;
            avatarPhoto.style.backgroundSize = 'cover';
            avatarPhoto.style.backgroundPosition = 'center';
        }

        // Fill UI fields
        document.getElementById("county-name").textContent = caseProfile.county;
        document.getElementById("state-name").textContent =
            stateNames[String(caseProfile.stateFIPS).padStart(2, "0")] || caseProfile.stateFIPS;

        document.getElementById("race").textContent = caseProfile.race;
        document.getElementById("gender").textContent = caseProfile.gender;
        document.getElementById("education").textContent = caseProfile.education;
        document.getElementById("income").textContent = caseProfile.parentalIncome;
        document.getElementById("single-parent").textContent =
            caseProfile.singleParent ? "Yes" : "No";
            
        console.log("Case profile loaded successfully:", caseProfile);
    } catch (error) {
        console.error("Error in meet-case.js:", error);
        alert("An error occurred while loading the case. Check the console for details.");
    }
});
