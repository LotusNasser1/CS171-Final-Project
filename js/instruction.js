const steps = [
    "Step 1: Meet a person and explore their background.",
    "Step 2: Make your prediction about their economic future.",
    "Step 3: Discover what really happened.",
    "Step 4: Dive deeper into the data and insights."
];

let currentStep = 0;

const instructionBox = document.getElementById("instructionText");
const nextButton = document.getElementById("nextButton");

function showStep(stepIndex) {
    instructionBox.classList.remove("fade-in");
    void instructionBox.offsetWidth; // Restart CSS animation
    instructionBox.innerHTML = steps[stepIndex];
    instructionBox.classList.add("fade-in");

    // Last step turns NEXT → CONTINUE
    if (stepIndex === steps.length - 1) {
        nextButton.textContent = "CONTINUE ▶";
    }
}

nextButton.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
    } else {
        window.location.href = "meet-case.html"; // go to the next page
    }
});

// Initialize first step
showStep(0);
