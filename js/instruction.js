/**
 * instruction.js - Step-by-Step Instruction Navigation
 * 
 * This module handles the instruction carousel that guides users through
 * the economic mobility prediction game steps. It displays one step at a time
 * with fade animations and transitions to the next page on completion.
 * 
 * Dependencies:
 *   - DOM elements: instructionText, nextButton
 * 
 * Note: This is a standalone page module. The main app uses a different
 * instruction system embedded in main.js.
 */

/**
 * Array of instruction step messages displayed to the user.
 * Each step explains a part of the economic mobility exploration process.
 */
const steps = [
    "Step 1: Meet a person and explore their background.",
    "Step 2: Make your prediction about their economic future.",
    "Step 3: Discover what really happened.",
    "Step 4: Dive deeper into the data and insights."
];

/**
 * Current step index (0-based)
 * @type {number}
 */
let currentStep = 0;

// DOM element references
const instructionBox = document.getElementById("instructionText");
const nextButton = document.getElementById("nextButton");

/**
 * Displays the specified step with a fade-in animation.
 * Updates the button text to "CONTINUE" on the final step.
 * 
 * @param {number} stepIndex - The index of the step to display (0-based)
 */
function showStep(stepIndex) {
    // Remove and re-add class to restart CSS animation
    instructionBox.classList.remove("fade-in");
    void instructionBox.offsetWidth; // Force reflow to restart animation
    instructionBox.innerHTML = steps[stepIndex];
    instructionBox.classList.add("fade-in");

    // Change button text on last step
    if (stepIndex === steps.length - 1) {
        nextButton.textContent = "CONTINUE";
    }
}

// Event listener for the next/continue button
nextButton.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
    } else {
        // Navigate to the case meeting page after final step
        window.location.href = "meet-case.html";
    }
});

// Initialize with the first step
showStep(0);
