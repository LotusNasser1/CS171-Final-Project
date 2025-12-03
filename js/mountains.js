/**
 * mountains.js - Mountain Peaks Visualization: The Fading American Dream
 * 
 * This module creates an interactive visualization showing how economic mobility
 * has declined over generations. Users drag mountain peak points to predict
 * the percentage of children who out-earned their parents across birth years,
 * then reveal the actual data showing the dramatic decline.
 * 
 * Dependencies:
 *   - PapaParse library for CSV parsing
 *   - DOM canvas element: mountainCanvas
 *   - DOM elements: reveal-mountains-btn, reset-mountains-btn, etc.
 * 
 * Data Source: mobility_baseline.csv with columns:
 *   - cohort: Birth year
 *   - mobility_p50: Median mobility rate (0-1 scale)
 */

const MountainViz = {
    // Canvas and rendering context
    canvas: null,
    ctx: null,
    
    // Data arrays
    data: [],          // Raw data from CSV
    userPeaks: [],     // User's draggable prediction points
    actualPeaks: [],   // Actual data points to reveal
    
    // Interaction state
    isDragging: false,
    dragIndex: -1,
    revealed: false,
    hoveredPeakIndex: -1,
    
    // Canvas dimensions
    canvasWidth: 0,
    canvasHeight: 0,
    peakSpacing: 0,
    baseY: 0,
    
    // Tooltip element reference
    tooltipDiv: null,
    
    // Color configuration for mountain lines and fills
    mountainColors: {
        userFill: 'rgba(52, 152, 219, 0.4)',
        userStroke: '#2980b9',
        userLine: '#2980b9',
        guessFill: 'rgba(52, 152, 219, 0.2)',
        guessStroke: '#2980b9',
        guessLine: '#2980b9',
        actualFill: 'rgba(231, 76, 60, 0.7)',
        actualStroke: '#c0392b',
        actualLine: '#c0392b'
    },
    
    /**
     * Initializes the mountain visualization.
     * Sets up canvas, creates tooltip, loads data, and binds event listeners.
     * 
     * @async
     */
    init: async function() {
        this.canvas = document.getElementById('mountainCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.createTooltip();
        
        await this.loadData();
        this.setupEventListeners();
        this.draw();
    },

    /**
     * Configures canvas dimensions based on container size.
     * Sets the base Y position for the ground level.
     */
    setupCanvas: function() {
        const container = this.canvas.parentElement;
        this.canvasWidth = Math.min(container.clientWidth - 40, 1200);
        this.canvasHeight = 550;
        
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.baseY = this.canvasHeight - 100;
    },

    /**
     * Creates the floating tooltip element for hover information.
     * Removes any existing tooltip before creating a new one.
     */
    createTooltip: function() {
        const existing = document.getElementById('mountain-tooltip');
        if (existing) existing.remove();

        this.tooltipDiv = document.createElement('div');
        this.tooltipDiv.id = 'mountain-tooltip';
        this.tooltipDiv.className = 'mountain-tooltip';
        this.tooltipDiv.style.display = 'none';
        document.body.appendChild(this.tooltipDiv);
    },

    /**
     * Loads mobility data from CSV and initializes peak positions.
     * User peaks start at 70% (middle height) for prediction.
     * Actual peaks are positioned based on real data.
     * 
     * @async
     */
    loadData: async function() {
        try {
            const response = await fetch('data/mobility_baseline.csv');
            const text = await response.text();
            const rows = Papa.parse(text, { header: true }).data;
            
            // Parse and filter valid data rows
            this.data = rows
                .filter(row => row.cohort && row.mobility_p50)
                .map(row => ({
                    year: parseInt(row.cohort),
                    mobility: parseFloat(row.mobility_p50) * 100
                }));

            // Calculate layout dimensions
            const leftMargin = 140;
            const rightMargin = 140;
            const usableWidth = this.canvasWidth - leftMargin - rightMargin;
            this.peakSpacing = usableWidth / (this.data.length - 1);
            
            // Initialize user peaks at 70% (middle prediction height)
            this.userPeaks = this.data.map((d, i) => ({
                x: leftMargin + (i * this.peakSpacing),
                y: this.baseY - 250,
                year: d.year,
                mobility: 70
            }));
            
            // Store actual peaks from data
            this.actualPeaks = this.data.map((d, i) => ({
                x: leftMargin + (i * this.peakSpacing),
                y: this.baseY - (d.mobility * 3.2),
                mobility: d.mobility,
                year: d.year
            }));

        } catch (error) {
            console.error('Error loading mountain data:', error);
        }
    },

    /**
     * Sets up all mouse and touch event listeners for interaction.
     * Also handles window resize to maintain responsive layout.
     */
    setupEventListeners: function() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleMouseUp.bind(this));

        // Responsive resize handling
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.loadData().then(() => this.draw());
        });
    },

    /**
     * Handles mouse down events for starting peak drag.
     * Disabled after reveal.
     * 
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown: function(e) {
        if (this.revealed) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.checkPeakClick(x, y);
    },

    /**
     * Handles touch start events for mobile peak drag.
     * 
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart: function(e) {
        if (this.revealed) return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.checkPeakClick(x, y);
    },

    /**
     * Checks if click/touch is near a peak and initiates dragging.
     * 
     * @param {number} x - X coordinate relative to canvas
     * @param {number} y - Y coordinate relative to canvas
     */
    checkPeakClick: function(x, y) {
        for (let i = 0; i < this.userPeaks.length; i++) {
            const peak = this.userPeaks[i];
            const distance = Math.sqrt(Math.pow(x - peak.x, 2) + Math.pow(y - peak.y, 2));
            
            if (distance < 35) {
                this.isDragging = true;
                this.dragIndex = i;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }
    },

    /**
     * Handles mouse move for dragging and hover detection.
     * 
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging && !this.revealed) {
            this.updatePeakPosition(y);
        } else {
            this.checkPeakHover(x, y, e.clientX, e.clientY);
        }
    },

    /**
     * Checks if mouse is hovering over a peak and shows tooltip.
     * 
     * @param {number} canvasX - X coordinate on canvas
     * @param {number} canvasY - Y coordinate on canvas
     * @param {number} screenX - X coordinate on screen (for tooltip)
     * @param {number} screenY - Y coordinate on screen (for tooltip)
     */
    checkPeakHover: function(canvasX, canvasY, screenX, screenY) {
        let foundHover = false;
        const peaks = this.revealed ? this.actualPeaks : this.userPeaks;

        for (let i = 0; i < peaks.length; i++) {
            const peak = peaks[i];
            const distance = Math.sqrt(
                Math.pow(canvasX - peak.x, 2) + 
                Math.pow(canvasY - peak.y, 2)
            );
            
            if (distance < 30) {
                this.hoveredPeakIndex = i;
                foundHover = true;
                this.showTooltip(peak, screenX, screenY);
                this.canvas.style.cursor = this.revealed ? 'pointer' : 'grab';
                this.draw();
                break;
            }
        }

        if (!foundHover && this.hoveredPeakIndex !== -1) {
            this.hoveredPeakIndex = -1;
            this.hideTooltip();
            this.canvas.style.cursor = this.revealed ? 'default' : 'grab';
            this.draw();
        }
    },

    /**
     * Displays tooltip with peak information at screen position.
     * 
     * @param {Object} peak - Peak object with year and mobility
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     */
    showTooltip: function(peak, x, y) {
        if (!this.tooltipDiv) return;

        const mobilityValue = peak.mobility || ((this.baseY - peak.y) / 3.2);

        this.tooltipDiv.innerHTML = `
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">
                Born in ${peak.year}
            </div>
            <div style="font-size: 13px;">
                <strong>${Math.round(mobilityValue)}%</strong> earned more than parents
            </div>
        `;

        this.tooltipDiv.style.display = 'block';
        this.tooltipDiv.style.left = (x + 15) + 'px';
        this.tooltipDiv.style.top = (y - 60) + 'px';
    },

    /**
     * Hides the tooltip element.
     */
    hideTooltip: function() {
        if (this.tooltipDiv) {
            this.tooltipDiv.style.display = 'none';
        }
    },

    /**
     * Handles touch move events for mobile dragging.
     * 
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove: function(e) {
        if (!this.isDragging || this.revealed) return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const y = touch.clientY - rect.top;
        
        this.updatePeakPosition(y);
    },

    /**
     * Updates the Y position of the currently dragged peak.
     * Clamps to valid range and recalculates mobility value.
     * 
     * @param {number} y - New Y position
     */
    updatePeakPosition: function(y) {
        const minY = 60;
        const maxY = this.baseY - 30;
        const clampedY = Math.max(minY, Math.min(maxY, y));
        
        this.userPeaks[this.dragIndex].y = clampedY;
        this.userPeaks[this.dragIndex].mobility = (this.baseY - clampedY) / 3.2;
        
        this.draw();
    },

    /**
     * Ends drag operation and resets cursor.
     */
    handleMouseUp: function() {
        this.isDragging = false;
        this.dragIndex = -1;
        if (!this.revealed) {
            this.canvas.style.cursor = 'grab';
        }
    },

    /**
     * Handles mouse leaving the canvas area.
     */
    handleMouseLeave: function() {
        this.handleMouseUp();
        this.hideTooltip();
        this.hoveredPeakIndex = -1;
        this.draw();
    },

    /**
     * Main draw function that renders the entire visualization.
     * Includes gradient background, axis labels, mountain lines, and legend.
     */
    draw: function() {
        if (!this.ctx) return;

        // Clear and draw gradient background
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#f0e5dc');
        gradient.addColorStop(1, '#e8d8cc');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw ground line
        this.ctx.strokeStyle = '#4d1f2f';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(100, this.baseY);
        this.ctx.lineTo(this.canvasWidth - 100, this.baseY);
        this.ctx.stroke();

        // Draw Y-axis label
        this.drawAxisLabels();

        // Draw user's prediction line
        if (!this.revealed) {
            this.drawConnectedLine(
                this.userPeaks,
                this.mountainColors.userLine,
                this.mountainColors.userFill,
                false
            );
        } else {
            // After reveal: show user's guess as dashed, actual as solid
            this.drawConnectedLine(
                this.userPeaks,
                this.mountainColors.guessLine,
                this.mountainColors.guessFill,
                true
            );
            this.drawConnectedLine(
                this.actualPeaks,
                this.mountainColors.actualLine,
                this.mountainColors.actualFill,
                false
            );
        }

        // Draw labels and legend
        this.drawLabels();
        this.drawLegend();
    },

    /**
     * Draws the Y-axis label (rotated text).
     */
    drawAxisLabels: function() {
        this.ctx.save();
        this.ctx.translate(30, this.canvasHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.font = '11px "Press Start 2P"';
        this.ctx.fillStyle = '#4d1f2f';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('% WHO OUT-EARN PARENTS', 0, 0);
        this.ctx.restore();
        
        this.ctx.textAlign = 'left';
    },

    /**
     * Draws connected mountain line with bezier curves between peaks.
     * 
     * @param {Array} peaks - Array of peak points
     * @param {string} lineColor - Stroke color for the line
     * @param {string} fillColor - Fill color for the area under the line
     * @param {boolean} isDashed - Whether to draw dashed line
     */
    drawConnectedLine: function(peaks, lineColor, fillColor, isDashed) {
        if (peaks.length === 0) return;
        
        // Draw filled area under the mountain
        this.ctx.beginPath();
        this.ctx.moveTo(peaks[0].x, this.baseY);
        this.ctx.lineTo(peaks[0].x, peaks[0].y);
        
        // Draw bezier curves between peaks for smooth mountains
        for (let i = 0; i < peaks.length - 1; i++) {
            const current = peaks[i];
            const next = peaks[i + 1];
            
            const cpX = (current.x + next.x) / 2;
            const cpY1 = current.y;
            const cpY2 = next.y;
            
            this.ctx.bezierCurveTo(cpX, cpY1, cpX, cpY2, next.x, next.y);
        }
        
        this.ctx.lineTo(peaks[peaks.length - 1].x, this.baseY);
        this.ctx.closePath();
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        
        // Draw the line stroke
        this.ctx.beginPath();
        this.ctx.moveTo(peaks[0].x, peaks[0].y);
        
        for (let i = 0; i < peaks.length - 1; i++) {
            const current = peaks[i];
            const next = peaks[i + 1];
            
            const cpX = (current.x + next.x) / 2;
            const cpY1 = current.y;
            const cpY2 = next.y;
            
            this.ctx.bezierCurveTo(cpX, cpY1, cpX, cpY2, next.x, next.y);
        }
        
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = isDashed ? 3 : 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (isDashed) {
            this.ctx.setLineDash([10, 8]);
        } else {
            this.ctx.setLineDash([]);
        }
        
        this.ctx.stroke();
        
        // Draw peak points (every 3rd point and last point)
        peaks.forEach((peak, index) => {
            if (index % 3 === 0 || index === peaks.length - 1) {
                const isHovered = index === this.hoveredPeakIndex;
                const radius = isHovered ? 10 : 6;
                
                this.ctx.fillStyle = lineColor;
                this.ctx.beginPath();
                this.ctx.arc(peak.x, peak.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = isHovered ? 3 : 2;
                this.ctx.setLineDash([]);
                this.ctx.stroke();
                
                // Glow effect on hover
                if (isHovered) {
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.lineWidth = 5;
                    this.ctx.beginPath();
                    this.ctx.arc(peak.x, peak.y, radius + 3, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        });
        
        this.ctx.setLineDash([]);
    },

    /**
     * Draws X-axis labels (birth years).
     */
    drawLabels: function() {
        this.ctx.fillStyle = '#4d1f2f';
        this.ctx.font = 'bold 11px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        
        // Draw year labels for every 3rd peak
        this.userPeaks.forEach((peak, index) => {
            if (index % 3 === 0 || index === this.userPeaks.length - 1) {
                this.ctx.fillText(peak.year, peak.x, this.baseY + 35);
            }
        });
        
        // Draw X-axis title
        this.ctx.font = '11px "Press Start 2P"';
        this.ctx.fillText('BIRTH YEAR', this.canvasWidth / 2, this.baseY + 65);
        
        this.ctx.textAlign = 'left';
    },

    /**
     * Draws the legend (only visible after reveal).
     */
    drawLegend: function() {
        if (!this.revealed) return;
        
        const legendX = this.canvasWidth - 250;
        const legendY = 80;
        
        // User's guess line sample
        this.ctx.strokeStyle = this.mountainColors.guessLine;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY);
        this.ctx.lineTo(legendX + 40, legendY);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#4d1f2f';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Your Guess', legendX + 50, legendY + 4);
        
        // Actual data line sample
        this.ctx.strokeStyle = this.mountainColors.actualLine;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY + 25);
        this.ctx.lineTo(legendX + 40, legendY + 25);
        this.ctx.stroke();
        
        this.ctx.fillText('Actual Data', legendX + 50, legendY + 29);
    },

    /**
     * Initiates the reveal animation to show actual data.
     */
    revealActual: function() {
        this.revealed = true;
        this.animateReveal();
    },

    /**
     * Animates the reveal transition.
     */
    animateReveal: function() {
        const duration = 1500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.displayResults();
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Displays the results message after reveal animation completes.
     * Shows the decline in American Dream mobility over generations.
     */
    displayResults: function() {
        const statsDiv = document.getElementById('mountain-stats');
        const messageDiv = document.getElementById('mountain-message');
        
        // Get first and last actual values for comparison
        const firstMobility = Math.round(this.actualPeaks[0].mobility);
        const lastMobility = Math.round(this.actualPeaks[this.actualPeaks.length - 1].mobility);
        const firstYear = this.actualPeaks[0].year;
        const lastYear = this.actualPeaks[this.actualPeaks.length - 1].year;
        
        const message = `
            <div style="margin-bottom: 20px;">
                <strong style="font-size: 16px; color: #c0392b;">The American Dream Collapsed</strong>
            </div>
            <div style="line-height: 2; font-size: 13px;">
                In <strong>${firstYear}</strong>, <strong style="color: #c0392b;">${firstMobility}%</strong> of children earned more than their parents.<br>
                By <strong>${lastYear}</strong>, only <strong style="color: #c0392b;">${lastMobility}%</strong> did - <strong>less than half</strong>.<br><br>
                This dramatic decline happened over just <strong>${lastYear - firstYear} years</strong>.<br>
                Each generation had <strong>less opportunity</strong> than the one before.
            </div>
        `;
        
        if (messageDiv) {
            messageDiv.innerHTML = message;
        }
        
        if (statsDiv) {
            statsDiv.style.display = 'block';
            // Add animation class after brief delay
            setTimeout(() => {
                statsDiv.classList.add('visible');
            }, 100);
        }
        
        // Show continue button
        const nextBtn = document.getElementById('next-screen-btn');
        if (nextBtn) nextBtn.style.display = 'inline-block';
    },

    /**
     * Resets the visualization to initial state for trying again.
     */
    reset: function() {
        this.revealed = false;
        this.hoveredPeakIndex = -1;
        this.hideTooltip();
        
        // Reset user peaks to middle position (70%)
        this.userPeaks = this.data.map((d, i) => ({
            x: 140 + (i * this.peakSpacing),
            y: this.baseY - 250,
            year: d.year,
            mobility: 70
        }));
        
        // Hide results
        const statsDiv = document.getElementById('mountain-stats');
        const messageDiv = document.getElementById('mountain-message');
        
        if (statsDiv) {
            statsDiv.style.display = 'none';
            statsDiv.classList.remove('visible');
        }
        
        if (messageDiv) {
            messageDiv.innerHTML = '';
        }
        
        // Hide continue button
        const nextBtn = document.getElementById('next-screen-btn');
        if (nextBtn) nextBtn.style.display = 'none';
        
        this.draw();
    }
};
