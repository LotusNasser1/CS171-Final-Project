// ============================================
// COORDINATED DASHBOARD CONTROLLER
// ============================================

const CoordinatedDashboard = {
    atlasData: [],
    housingData: {}, // Changed to object: { stateName: [{date, price}, ...] }
    selectedState: null,
    stateAverages: {},
    colorScale: null,
    mapProjection: null,
    mapPath: null,
    incomeData: {},
    
    // State FIPS to Name mapping
    stateNames: {
        '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas',
        '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware',
        '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii',
        '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa',
        '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine',
        '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
        '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska',
        '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico',
        '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio',
        '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island',
        '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas',
        '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington',
        '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
    },
    
    init: async function() {
        console.log('🚀 Initializing Coordinated Dashboard...');
        
        try {
            await this.loadAllData();
            this.processStateAverages();
            this.renderMap();
            
            // NEW: If user came from prediction, highlight their state
            const currentCase = JSON.parse(localStorage.getItem('currentCase') || '{}');
            if (currentCase.stateFIPS) {
                setTimeout(() => {
                    this.highlightPredictedState(currentCase.stateFIPS);
                }, 500);
            }
        
            
            console.log('✅ Dashboard ready!');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
        }
    },

    
    highlightPredictedState: function(stateFIPS) {
        // Add a special highlight to the state from prediction
        const paddedFIPS = String(stateFIPS).padStart(2, '0');
        const stateElement = document.querySelector(`[data-state-fips="${parseInt(stateFIPS)}"]`);
        
        if (stateElement) {
            // Add pulsing animation
            stateElement.style.animation = 'pulse-highlight 2s ease-in-out 3';
            
            // Optionally auto-select it after a moment
            setTimeout(() => {
                const stateData = this.stateAverages[paddedFIPS];
                if (stateData) {
                    this.onStateSelect(stateData, stateElement);
                }
            }, 2000);
        }
    },
    
    loadAllData: async function() {
        // Load atlas data
        this.atlasData = await loadAtlasData();
        console.log(`📊 Loaded ${this.atlasData.length} census tracts`);
        
        // Load housing data
        const housingResponse = await fetch('data/housing_prices_by_states.csv');
        const housingText = await housingResponse.text();
        const parsed = Papa.parse(housingText, { 
            header: true,
            dynamicTyping: true 
        });
        this.housingData = this.transformHousingData(parsed.data);
        
        // Load per capita income data
        const incomeResponse = await fetch('data/state_income_2024.csv');
        const incomeText = await incomeResponse.text();
        
        // Skip the first 3 header rows
        const incomeLines = incomeText.split('\n').slice(3).join('\n');
        
        const incomeParsed = Papa.parse(incomeLines, { 
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        this.incomeData = this.processIncomeData(incomeParsed.data);
        
        console.log(`🏠 Loaded housing data for ${Object.keys(this.housingData).length} states`);
        console.log(`💰 Loaded income data for ${Object.keys(this.incomeData).length} states`);
    },
    
    processIncomeData: function(data) {
        const incomeMap = {};
        
        data.forEach(row => {
            let stateName = row.GeoName;
            const income = parseFloat(row['2024']);
            
            if (stateName && !isNaN(income) && stateName !== 'United States') {
                // Clean state name: remove asterisks and trim whitespace
                stateName = stateName.replace(/\s*\*\s*/g, '').trim();
                incomeMap[stateName] = income;
            }
        });
        
        console.log('Processed income data for states:', Object.keys(incomeMap));
        return incomeMap;
    },
    
    transformHousingData: function(data) {
        const transformed = {};
        
        data.forEach(row => {
            const stateName = row.RegionName;
            if (!stateName) return;
            
            const stateData = [];
            
            // Loop through all date columns
            Object.keys(row).forEach(key => {
                // Skip non-date columns
                if (['RegionID', 'SizeRank', 'RegionName', 'RegionType', 'StateName'].includes(key)) {
                    return;
                }
                
                const price = parseFloat(row[key]);
                if (!isNaN(price) && price > 0) {
                    stateData.push({
                        date: new Date(key),
                        price: price
                    });
                }
            });
            
            // Sort by date
            stateData.sort((a, b) => a.date - b.date);
            transformed[stateName] = stateData;
        });
        
        return transformed;
    },
    
    processStateAverages: function() {
        console.log('📈 Processing state averages...');
        
        const stateGroups = d3.group(this.atlasData, d => d.state);
        
        stateGroups.forEach((tracts, stateFIPS) => {
            const validTracts = tracts.filter(t => 
                t.kfr_pooled_pooled_p25 && 
                !isNaN(parseFloat(t.kfr_pooled_pooled_p25))
            );
            
            if (validTracts.length === 0) return;
            
            this.stateAverages[stateFIPS] = {
                stateFIPS: stateFIPS,
                stateName: this.stateNames[stateFIPS] || stateFIPS,
                count: validTracts.length,
                
                // Mobility averages
                mobility_overall: d3.mean(validTracts, d => parseFloat(d.kfr_pooled_pooled_p25)),
                mobility_white: d3.mean(validTracts, d => parseFloat(d.kfr_white_pooled_p25)),
                mobility_black: d3.mean(validTracts, d => parseFloat(d.kfr_black_pooled_p25)),
                mobility_hispanic: d3.mean(validTracts, d => parseFloat(d.kfr_hisp_pooled_p25)),
                mobility_asian: d3.mean(validTracts, d => parseFloat(d.kfr_asian_pooled_p25)),
                
                // Environmental
                pm25_2010: d3.mean(validTracts, d => parseFloat(d.pm25_2010)),
                pm25_2000: d3.mean(validTracts, d => parseFloat(d.pm25_2000)),
                pm25_1990: d3.mean(validTracts, d => parseFloat(d.pm25_1990)),
                pm25_1982: d3.mean(validTracts, d => parseFloat(d.pm25_1982)),
                
                // Socioeconomic
                college_rate: d3.mean(validTracts, d => parseFloat(d.frac_coll_plus2010)),
                poverty_rate: d3.mean(validTracts, d => parseFloat(d.poor_share2010)),
                median_income: d3.mean(validTracts, d => parseFloat(d.med_hhinc2016)),
                singleparent_rate: d3.mean(validTracts, d => parseFloat(d.singleparent_share2010)),
                job_density: d3.mean(validTracts, d => parseFloat(d.job_density_2013))
            };
        });
        
        console.log(`✅ Processed ${Object.keys(this.stateAverages).length} states`);
    },
    
    renderMap: async function() {
        const svg = d3.select('#dashboard-map-svg');
        svg.selectAll('*').remove();
        
        // Get actual container dimensions
        const container = svg.node().parentElement;
        const width = container ? container.clientWidth - 70 : 700;
        const height = 500;
        
        // Set SVG dimensions explicitly
        svg.attr('width', width).attr('height', height);
        
        // Load US TopoJSON
        const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        const states = topojson.feature(us, us.objects.states);
        
        this.mapProjection = d3.geoAlbersUsa()
            .fitSize([width, height], states);
        
        this.mapPath = d3.geoPath(this.mapProjection);
        
        // Color scale based on mobility
        const mobilityValues = Object.values(this.stateAverages)
            .map(d => d.mobility_overall)
            .filter(d => !isNaN(d));
        
        this.colorScale = d3.scaleSequential()
            .domain([d3.min(mobilityValues), d3.max(mobilityValues)])
            .interpolator(d3.interpolateRdYlGn);
        
        // Draw states
        const self = this;
        svg.selectAll('path')
            .data(states.features)
            .enter()
            .append('path')
            .attr('class', 'dashboard-state')
            .attr('d', this.mapPath)
            .attr('fill', d => {
                const stateFIPS = String(d.id).padStart(2, '0');
                const stateData = this.stateAverages[stateFIPS];
                return stateData ? this.colorScale(stateData.mobility_overall) : '#ccc';
            })
            .attr('data-state-fips', d => d.id)
            .on('click', function(event, d) {
                const stateFIPS = String(d.id).padStart(2, '0');
                const stateData = self.stateAverages[stateFIPS];
                
                if (stateData) {
                    self.onStateSelect(stateData, this);
                }
            })
            .on('mouseover', function(event, d) {
                const stateFIPS = String(d.id).padStart(2, '0');
                const stateData = self.stateAverages[stateFIPS];
                
                if (stateData && !d3.select(this).classed('selected')) {
                    d3.select(this).style('opacity', 0.7);
                }
            })
            .on('mouseout', function() {
                if (!d3.select(this).classed('selected')) {
                    d3.select(this).style('opacity', 1);
                }
            });
        
        // Add legend
        this.addMapLegend(svg, width, height);
    },
    
    
    onStateSelect: function(stateData, element) {
        console.log('🎯 Selected state:', stateData.stateName);
        
        this.selectedState = stateData;
        
        // Update map selection
        d3.selectAll('.dashboard-state').classed('selected', false);
        d3.select(element).classed('selected', true);
        
        // Shift layout
        const grid = document.getElementById('dashboard-grid');
        const panel = document.getElementById('insights-panel');
        const placeholder = document.getElementById('placeholder-message');
        const cardsContainer = document.getElementById('insights-cards-container');
        
        if (grid) grid.classList.add('has-selection');
        if (panel) panel.classList.add('visible');
        if (placeholder) placeholder.style.display = 'none';
        if (cardsContainer) cardsContainer.style.display = 'block';
        
        // Update all visualizations
        this.updateHousingChart(stateData);
        // REMOVED: this.updateMobilityBreakdown(stateData);
        // REMOVED: this.updateFactorsGrid(stateData);
    },
    
    updateHousingChart: function(stateData) {
        const container = d3.select('#housing-chart');
        container.selectAll('*').remove();
        
        // Get housing data for this specific state
        const housingTimeSeries = this.housingData[stateData.stateName];
        
        if (!housingTimeSeries || housingTimeSeries.length === 0) {
            container.append('div')
                .style('text-align', 'center')
                .style('padding', '40px')
                .style('color', '#6c3a4d')
                .style('font-family', 'Press Start 2P')
                .style('font-size', '10px')
                .text('No housing data available for this state');
            return;
        }
        
        const margin = { top: 30, right: 30, bottom: 50, left: 70 };
        const width = container.node().clientWidth - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;
        
        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(housingTimeSeries, d => d.date))
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(housingTimeSeries, d => d.price) * 1.1])
            .range([height, 0]);
        
        // Line generator
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.price))
            .curve(d3.curveMonotoneX);
        
        // Add gradient
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'housing-gradient-' + stateData.stateFIPS)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#d75b87')
            .attr('stop-opacity', 0.6);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#d75b87')
            .attr('stop-opacity', 0.1);
        
        // Area under curve
        const area = d3.area()
            .x(d => x(d.date))
            .y0(height)
            .y1(d => y(d.price))
            .curve(d3.curveMonotoneX);
        
        svg.append('path')
            .datum(housingTimeSeries)
            .attr('fill', `url(#housing-gradient-${stateData.stateFIPS})`)
            .attr('d', area);
        
        // Line
        svg.append('path')
            .datum(housingTimeSeries)
            .attr('fill', 'none')
            .attr('stroke', '#d75b87')
            .attr('stroke-width', 3)
            .attr('d', line);
        
        // X Axis with white text
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(8))
            .style('font-family', 'Press Start 2P')
            .style('font-size', '8px')
            .selectAll('text')
            .style('fill', '#4d1f2f');  // Dark color for visibility
        
        svg.selectAll('.domain, .tick line')
            .style('stroke', '#4d1f2f');
        
        // Y Axis with white text
        svg.append('g')
            .call(d3.axisLeft(y).ticks(6).tickFormat(d => `$${(d/1000).toFixed(0)}K`))
            .style('font-family', 'Press Start 2P')
            .style('font-size', '8px')
            .selectAll('text')
            .style('fill', '#4d1f2f');  // Dark color for visibility
        
        svg.selectAll('.domain, .tick line')
            .style('stroke', '#4d1f2f');
        
        // Calculate affordability with REAL state income
        const latestPrice = housingTimeSeries[housingTimeSeries.length - 1].price;
        const earliestPrice = housingTimeSeries[0].price;
        const priceIncrease = ((latestPrice - earliestPrice) / earliestPrice * 100).toFixed(1);
        
        // Get per capita income for this state (2024 data)
        console.log('Looking up income for state:', stateData.stateName);
        console.log('Available income data keys:', Object.keys(this.incomeData));
        const perCapitaIncome = this.incomeData[stateData.stateName] || 65000;
        console.log('Per capita income found:', perCapitaIncome);
        const affordabilityRatio = (latestPrice / perCapitaIncome).toFixed(1);
        
        // Determine affordability status
        let affordabilityStatus, affordabilityIcon;
        if (affordabilityRatio > 8) {
            affordabilityStatus = 'Extremely unaffordable';
            affordabilityIcon = '';
        } else if (affordabilityRatio > 6) {
            affordabilityStatus = 'Severely unaffordable';
            affordabilityIcon = '';
        } else if (affordabilityRatio > 4) {
            affordabilityStatus = 'Moderately unaffordable';
            affordabilityIcon = '';
        } else if (affordabilityRatio > 3) {
            affordabilityStatus = 'Challenging affordability';
            affordabilityIcon = '';
        } else {
            affordabilityStatus = 'Relatively affordable';
            affordabilityIcon = '';
        }
        
        // Add annotation with restructured layout
        d3.select('#housing-annotation').html(`
            <div class="state-info-badge">${stateData.stateName}</div>
            
            <div class="income-comparison">
                <div class="comparison-row">
                    <div class="comparison-label">Per Capita Income (2024):</div>
                    <div class="comparison-value">$${Math.round(perCapitaIncome).toLocaleString()}</div>
                </div>
                <div class="comparison-row">
                    <div class="comparison-label">Median Home Price (2025):</div>
                    <div class="comparison-value">$${Math.round(latestPrice).toLocaleString()}</div>
                </div>
                <div class="comparison-divider"></div>
                <div class="comparison-row highlight">
                    <div class="comparison-label">Average home price vs. per capital income:</div>
                    <div class="comparison-value">${affordabilityRatio}x</div>
                </div>
                <div class="comparison-row highlight">
                    <div class="comparison-label">${affordabilityIcon} Status:</div>
                    <div class="comparison-value">${affordabilityStatus}</div>
                </div>
            </div>
            
            <div class="chart-annotation">
                <strong>Price Growth:</strong> <span style="background: #d75b87; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 700;">${priceIncrease}%</span> increase over 25 years<br>
                <strong>Context:</strong> The typical ${stateData.stateName} resident would need to spend 
                <span style="background: #d75b87; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 700;">${affordabilityRatio} years</span> of their entire income to buy a median-priced home.
            </div>
        `);
    },
    
    updateMobilityBreakdown: function(stateData) {
        const races = [
            { label: 'White', value: stateData.mobility_white, color: '#9b7373' },
            { label: 'Black', value: stateData.mobility_black, color: '#8b4560' },
            { label: 'Hispanic', value: stateData.mobility_hispanic, color: '#d75b87' },
            { label: 'Asian', value: stateData.mobility_asian, color: '#b08080' }
        ].filter(d => d.value && !isNaN(d.value));
        
        const container = d3.select('#mobility-bars');
        container.selectAll('*').remove();
        
        races.forEach(race => {
            const item = container.append('div')
                .attr('class', 'mobility-bar-item');
            
            item.append('div')
                .attr('class', 'bar-label')
                .text(race.label);
            
            const track = item.append('div')
                .attr('class', 'bar-track');
            
            const fill = track.append('div')
                .attr('class', 'bar-fill')
                .style('width', '0%')
                .style('background', `linear-gradient(90deg, ${race.color}, #d75b87)`);
            
            fill.append('span')
                .attr('class', 'bar-value')
                .text(Math.round(race.value));
            
            // Animate
            setTimeout(() => {
                fill.style('width', `${race.value}%`);
            }, 100);
        });
    },
    
    
    updateFactorsGrid: function(stateData) {
        const factors = [
            {
                label: 'College Rate',
                value: `${Math.round(stateData.college_rate * 100)}%`,
                context: stateData.college_rate > 0.3 ? 'High education access' : 'Limited college access'
            },
            {
                label: 'Job Density',
                value: stateData.job_density ? Math.round(stateData.job_density).toLocaleString() : 'N/A',
                context: 'Jobs per sq mile'
            },
            {
                label: 'Poverty Rate',
                value: `${Math.round(stateData.poverty_rate * 100)}%`,
                context: stateData.poverty_rate > 0.2 ? 'High poverty' : 'Moderate poverty'
            },
            {
                label: 'Single Parents',
                value: `${Math.round(stateData.singleparent_rate * 100)}%`,
                context: 'Of households'
            }
        ];
        
        const container = d3.select('#factors-grid');
        container.selectAll('*').remove();
        
        factors.forEach(factor => {
            const box = container.append('div')
                .attr('class', 'factor-box')
                .style('opacity', 0)
                .style('transform', 'scale(0.8)');
            
            box.append('div')
                .attr('class', 'factor-label')
                .text(factor.label);
            
            box.append('div')
                .attr('class', 'factor-value')
                .text(factor.value);
            
            box.append('div')
                .attr('class', 'factor-context')
                .text(factor.context);
            
            // Animate in
            setTimeout(() => {
                box.transition()
                    .duration(400)
                    .style('opacity', 1)
                    .style('transform', 'scale(1)');
            }, 100);
        });
    },
    
    switchFactorsView: function(view) {
        const factorsTabs = document.querySelectorAll('.factors-tab');
        factorsTabs.forEach(tab => {
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        if (view === 'factors') {
            document.getElementById('factors-grid').style.display = 'grid';
            document.getElementById('correlations-grid').style.display = 'none';
        } else {
            document.getElementById('factors-grid').style.display = 'none';
            document.getElementById('correlations-grid').style.display = 'grid';
            this.updateCorrelationsGrid();
        }
    },
    
    updateCorrelationsGrid: function() {
        const correlations = [
            {
                icon: '📉',
                title: 'Single-Parent Rate',
                value: 'r = -0.59',
                desc: 'Shows <span class="correlation-strength negative">strong negative</span> correlation with mobility',
                strength: 'negative'
            },
            {
                icon: '💰',
                title: 'Median Income',
                value: 'r = +0.59',
                desc: 'Shows <span class="correlation-strength positive">strong positive</span> correlation with mobility',
                strength: 'positive'
            },
            {
                icon: '📚',
                title: 'College Rate',
                value: 'r = +0.50',
                desc: 'Shows <span class="correlation-strength positive">strong positive</span> correlation with mobility',
                strength: 'positive'
            },
            {
                icon: '🏚️',
                title: 'Poverty Rate',
                value: 'r = -0.53',
                desc: 'Shows <span class="correlation-strength negative">strong negative</span> correlation with mobility',
                strength: 'negative'
            }
        ];
        
        const container = d3.select('#correlations-grid');
        container.selectAll('*').remove();
        
        correlations.forEach((corr, i) => {
            const card = container.append('div')
                .attr('class', 'correlation-card')
                .style('opacity', 0)
                .style('transform', 'scale(0.8)');
            
            const header = card.append('div')
                .attr('class', 'correlation-header');
            
            header.append('div')
                .attr('class', 'correlation-icon')
                .text(corr.icon);
            
            header.append('div')
                .attr('class', 'correlation-title')
                .text(corr.title);
            
            card.append('div')
                .attr('class', 'correlation-value')
                .text(corr.value);
            
            card.append('div')
                .attr('class', 'correlation-desc')
                .html(corr.desc);
            
            // Animate in
            setTimeout(() => {
                card.transition()
                    .duration(400)
                    .style('opacity', 1)
                    .style('transform', 'scale(1)');
            }, 100 + (i * 50));
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard-map-svg')) {
        CoordinatedDashboard.init();
    }
});