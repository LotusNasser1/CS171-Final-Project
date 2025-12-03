// Mountain Peaks Visualization - The Fading American Dream
const MountainViz = {
    canvas: null,
    ctx: null,
    data: [],
    userPeaks: [],
    actualPeaks: [],
    isDragging: false,
    dragIndex: -1,
    revealed: false,
    canvasWidth: 0,
    canvasHeight: 0,
    peakSpacing: 0,
    baseY: 0,
    hoveredPeakIndex: -1,
    tooltipDiv: null,
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

    setupCanvas: function() {
        const container = this.canvas.parentElement;
        this.canvasWidth = Math.min(container.clientWidth - 40, 1200);
        this.canvasHeight = 550;
        
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.baseY = this.canvasHeight - 100;
    },

    createTooltip: function() {
        const existing = document.getElementById('mountain-tooltip');
        if (existing) existing.remove();

        this.tooltipDiv = document.createElement('div');
        this.tooltipDiv.id = 'mountain-tooltip';
        this.tooltipDiv.className = 'mountain-tooltip';
        this.tooltipDiv.style.display = 'none';
        document.body.appendChild(this.tooltipDiv);
    },

    loadData: async function() {
        try {
            const response = await fetch('data/mobility_baseline.csv');
            const text = await response.text();
            const rows = Papa.parse(text, { header: true }).data;
            
            this.data = rows
                .filter(row => row.cohort && row.mobility_p50)
                .map(row => ({
                    year: parseInt(row.cohort),
                    mobility: parseFloat(row.mobility_p50) * 100
                }));

            const leftMargin = 140;
            const rightMargin = 140;
                
            const usableWidth = this.canvasWidth - leftMargin - rightMargin;
            this.peakSpacing = usableWidth / (this.data.length - 1);
            
            // Initialize user peaks at 70% (middle height)
            this.userPeaks = this.data.map((d, i) => ({
                x: leftMargin + (i * this.peakSpacing),
                y: this.baseY - 250,
                year: d.year,
                mobility: 70
            }));
            
            // Store actual peaks
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

    setupEventListeners: function() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleMouseUp.bind(this));

        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.loadData().then(() => this.draw());
        });
    },

    handleMouseDown: function(e) {
        if (this.revealed) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.checkPeakClick(x, y);
    },

    handleTouchStart: function(e) {
        if (this.revealed) return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.checkPeakClick(x, y);
    },

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

    showTooltip: function(peak, x, y) {
        if (!this.tooltipDiv) return;

        const mobilityValue = peak.mobility || 
            ((this.baseY - peak.y) / 3.2);

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

    hideTooltip: function() {
        if (this.tooltipDiv) {
            this.tooltipDiv.style.display = 'none';
        }
    },

    handleTouchMove: function(e) {
        if (!this.isDragging || this.revealed) return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const y = touch.clientY - rect.top;
        
        this.updatePeakPosition(y);
    },

    updatePeakPosition: function(y) {
        const minY = 60;
        const maxY = this.baseY - 30;
        const clampedY = Math.max(minY, Math.min(maxY, y));
        
        this.userPeaks[this.dragIndex].y = clampedY;
        this.userPeaks[this.dragIndex].mobility = (this.baseY - clampedY) / 3.2;
        this.draw();
    },

    handleMouseUp: function() {
        this.isDragging = false;
        this.dragIndex = -1;
        if (!this.revealed) {
            this.canvas.style.cursor = 'grab';
        }
    },

    handleMouseLeave: function() {
        this.handleMouseUp();
        this.hoveredPeakIndex = -1;
        this.hideTooltip();
        this.draw();
    },

    draw: function() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.drawGrid();
        
        if (this.revealed) {
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
        } else {
            this.drawConnectedLine(
                this.userPeaks, 
                this.mountainColors.userLine,
                this.mountainColors.userFill,
                false
            );
        }
        
        this.drawLabels();
        this.drawLegend();
    },

    drawGrid: function() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const y = 60 + (i * (this.baseY - 60) / 10);
            this.ctx.beginPath();
            this.ctx.moveTo(100, y);
            this.ctx.lineTo(this.canvasWidth - 100, y);
            this.ctx.stroke();
            
            const value = 100 - (i * 10);
            this.ctx.fillStyle = '#4d1f2f';
            this.ctx.font = 'bold 12px "Press Start 2P"';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(value + '%', 85, y + 5);
        }
        
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

    drawConnectedLine: function(peaks, lineColor, fillColor, isDashed) {
        if (peaks.length === 0) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(peaks[0].x, this.baseY);
        this.ctx.lineTo(peaks[0].x, peaks[0].y);
        
        for (let i = 0; i < peaks.length - 1; i++) {
            const current = peaks[i];
            const next = peaks[i + 1];
            
            const cpX = (current.x + next.x) / 2;
            const cpY1 = current.y;
            const cpY2 = next.y;
            
            this.ctx.bezierCurveTo(
                cpX, cpY1,
                cpX, cpY2,
                next.x, next.y
            );
        }
        
        this.ctx.lineTo(peaks[peaks.length - 1].x, this.baseY);
        this.ctx.closePath();
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(peaks[0].x, peaks[0].y);
        
        for (let i = 0; i < peaks.length - 1; i++) {
            const current = peaks[i];
            const next = peaks[i + 1];
            
            const cpX = (current.x + next.x) / 2;
            const cpY1 = current.y;
            const cpY2 = next.y;
            
            this.ctx.bezierCurveTo(
                cpX, cpY1,
                cpX, cpY2,
                next.x, next.y
            );
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

    drawLabels: function() {
        this.ctx.fillStyle = '#4d1f2f';
        this.ctx.font = 'bold 11px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        
        this.userPeaks.forEach((peak, index) => {
            if (index % 3 === 0 || index === this.userPeaks.length - 1) {
                this.ctx.fillText(peak.year, peak.x, this.baseY + 35);
            }
        });
        
        this.ctx.font = '11px "Press Start 2P"';
        this.ctx.fillText('BIRTH YEAR', this.canvasWidth / 2, this.baseY + 65);
        
        this.ctx.textAlign = 'left';
    },

    drawLegend: function() {
        if (!this.revealed) return;
        
        const legendX = this.canvasWidth - 250;
        const legendY = 80;
        
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
        
        this.ctx.strokeStyle = this.mountainColors.actualLine;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(legendX, legendY + 25);
        this.ctx.lineTo(legendX + 40, legendY + 25);
        this.ctx.stroke();
        
        this.ctx.fillText('Actual Data', legendX + 50, legendY + 29);
    },

    revealActual: function() {
        this.revealed = true;
        this.animateReveal();
    },

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

    displayResults: function() {
        const statsDiv = document.getElementById('mountain-stats');
        const messageDiv = document.getElementById('mountain-message');
        
        // Get first and last actual values
        const firstMobility = Math.round(this.actualPeaks[0].mobility);
        const lastMobility = Math.round(this.actualPeaks[this.actualPeaks.length - 1].mobility);
        const firstYear = this.actualPeaks[0].year;
        const lastYear = this.actualPeaks[this.actualPeaks.length - 1].year;
        
        const message = `
            <div style="margin-bottom: 20px;">
                <strong style="font-size: 16px; color: #c0392b;"> The American Dream Collapsed</strong>
            </div>
            <div style="line-height: 2; font-size: 13px;">
                In <strong>${firstYear}</strong>, <strong style="color: #c0392b;">${firstMobility}%</strong> of children earned more than their parents.<br>
                By <strong>${lastYear}</strong>, only <strong style="color: #c0392b;">${lastMobility}%</strong> did — <strong>less than half</strong>.<br><br>
                This dramatic decline happened over just <strong>${lastYear - firstYear} years</strong>.<br>
                Each generation had <strong>less opportunity</strong> than the one before.
            </div>
        `;
        
        if (messageDiv) {
            messageDiv.innerHTML = message;
        }
        
        if (statsDiv) {
            statsDiv.style.display = 'block';
            // Add animation class
            setTimeout(() => {
                statsDiv.classList.add('visible');
            }, 100);
        }
        
        const nextBtn = document.getElementById('next-screen-btn');
        if (nextBtn) nextBtn.style.display = 'inline-block';
    },
    reset: function() {
        this.revealed = false;
        this.hoveredPeakIndex = -1;
        this.hideTooltip();
        
        this.userPeaks = this.data.map((d, i) => ({
            x: 140 + (i * this.peakSpacing),
            y: this.baseY - 250,
            year: d.year,
            mobility: 70
        }));
        
        const statsDiv = document.getElementById('mountain-stats');
        const messageDiv = document.getElementById('mountain-message');
        
        if (statsDiv) {
            statsDiv.style.display = 'none';
            statsDiv.classList.remove('visible');
        }
        
        if (messageDiv) {
            messageDiv.innerHTML = '';
        }
        
        const nextBtn = document.getElementById('next-screen-btn');
        if (nextBtn) nextBtn.style.display = 'none';
        
        this.draw();
    }
};