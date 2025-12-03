/**
 * dashboard.js - Coordinated Dashboard Controller
 * 
 * This module manages the interactive dashboard that displays state-level
 * economic mobility data with coordinated visualizations. Users can click
 * on states to see detailed mobility breakdowns, housing price trends,
 * and related socioeconomic factors.
 * 
 * Dependencies:
 *   - D3.js v7 for data visualization and mapping
 *   - PapaParse library for CSV parsing
 *   - TopoJSON for US map data
 *   - data.js: loadAtlasData() function
 * 
 * Data Sources:
 *   - atlas.csv: Census tract level mobility data
 *   - housing_prices_by_states.csv: Historical housing price data
 *   - state_income_2024.csv: Per capita income by state
 */

const CoordinatedDashboard = {
    // Data storage
    atlasData: [],
    housingData: {},      // Object: { stateName: [{date, price}, ...] }
    stateAverages: {},    // Aggregated state-level statistics
    incomeData: {},       // Per capita income by state
    
    // Selection state
    selectedState: null,
    
    // D3 visualization elements
    colorScale: null,
    mapProjection: null,
    mapPath: null,
    
    /**
     * State FIPS code to name mapping.
     * Used for displaying human-readable state names.
     */
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
    
    /**
     * Initializes the coordinated dashboard.
     * Loads all data sources, processes state averages, and renders the map.
     * 
     * @async
     */
    init: async function() {
        console.log('Initializing Coordinated Dashboard...');
        
        try {
            await this.loadAllData();
            this.processStateAverages();
            this.renderMap();
            
            // Highlight state from prediction if coming from that flow
            const currentCase = JSON.parse(localStorage.getItem('currentCase') || '{}');
            if (currentCase.stateFIPS) {
                setTimeout(() => {
                    this.highlightPredictedState(currentCase.stateFIPS);
                }, 500);
            }
            
            console.log('Dashboard ready!');
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
        }
    },

    /**
     * Highlights the state from the user's prediction with a pulsing animation.
     * Auto-selects the state after the animation.
     * 
     * @param {string} stateFIPS - FIPS code of the state to highlight
     */
    highlightPredictedState: function(stateFIPS) {
        const paddedFIPS = String(stateFIPS).padStart(2, '0');
        const stateElement = document.querySelector(`[data-state-fips="${parseInt(stateFIPS)}"]`);
        
        if (stateElement) {
            stateElement.style.animation = 'pulse-highlight 2s ease-in-out 3';
            
            // Auto-select after animation
            setTimeout(() => {
                const stateData = this.stateAverages[paddedFIPS];
                if (stateData) {
                    this.onStateSelect(stateData, stateElement);
                }
            }, 2000);
        }
    },
    
    /**
     * Loads all required data sources: atlas, housing, and income data.
     * 
     * @async
     */
    loadAllData: async function() {
        // Load atlas data using shared function
        this.atlasData = await loadAtlasData();
        console.log(`Loaded ${this.atlasData.length} census tracts`);
        
        // Load housing price data
        const housingResponse = await fetch('data/housing_prices_by_states.csv');
        const housingText = await housingResponse.text();
        const housingParsed = Papa.parse(housingText, { 
            header: true,
            dynamicTyping: true 
        });
        this.housingData = this.transformHousingData(housingParsed.data);
        
        // Load per capita income data (skip header rows)
        const incomeResponse = await fetch('data/state_income_2024.csv');
        const incomeText = await incomeResponse.text();
        const incomeLines = incomeText.split('\n').slice(3).join('\n');
        const incomeParsed = Papa.parse(incomeLines, { 
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        this.incomeData = this.processIncomeData(incomeParsed.data);
        
        console.log(`Loaded housing data for ${Object.keys(this.housingData).length} states`);
        console.log(`Loaded income data for ${Object.keys(this.incomeData).length} states`);
    },
    
    /**
     * Processes raw income data into a state-indexed object.
     * Cleans state names by removing asterisks and whitespace.
     * 
     * @param {Array} data - Raw income data rows
     * @returns {Object} Income by state name
     */
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
    
    /**
     * Transforms raw housing CSV data into time series per state.
     * 
     * @param {Array} data - Raw housing data rows
     * @returns {Object} Housing price time series by state name
     */
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
            
            // Sort by date ascending
            stateData.sort((a, b) => a.date - b.date);
            transformed[stateName] = stateData;
        });
        
        return transformed;
    },
    
    /**
     * Aggregates census tract data into state-level averages.
     * Calculates mobility rates by race and various socioeconomic indicators.
     */
    processStateAverages: function() {
        console.log('Processing state averages...');
        
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
                
                // Mobility averages by demographic
                mobility_overall: d3.mean(validTracts, d => parseFloat(d.kfr_pooled_pooled_p25)),
                mobility_white: d3.mean(validTracts, d => parseFloat(d.kfr_white_pooled_p25)),
                mobility_black: d3.mean(validTracts, d => parseFloat(d.kfr_black_pooled_p25)),
                mobility_hispanic: d3.mean(validTracts, d => parseFloat(d.kfr_hisp_pooled_p25)),
                mobility_asian: d3.mean(validTracts, d => parseFloat(d.kfr_asian_pooled_p25)),
                
                // Environmental indicators (PM2.5 pollution over time)
                pm25_2010: d3.mean(validTracts, d => parseFloat(d.pm25_2010)),
                pm25_2000: d3.mean(validTracts, d => parseFloat(d.pm25_2000)),
                pm25_1990: d3.mean(validTracts, d => parseFloat(d.pm25_1990)),
                pm25_1982: d3.mean(validTracts, d => parseFloat(d.pm25_1982)),
                
                // Socioeconomic indicators
                college_rate: d3.mean(validTracts, d => parseFloat(d.frac_coll_plus2010)),
                poverty_rate: d3.mean(validTracts, d => parseFloat(d.poor_share2010)),
                median_income: d3.mean(validTracts, d => parseFloat(d.med_hhinc2016)),
                singleparent_rate: d3.mean(validTracts, d => parseFloat(d.singleparent_share2010)),
                job_density: d3.mean(validTracts, d => parseFloat(d.job_density_2013))
            };
        });
        
        console.log(`Processed ${Object.keys(this.stateAverages).length} states`);
    },
    
    /**
     * Renders the interactive US map using D3.js and TopoJSON.
     * Sets up color scale, hover interactions, and click handlers.
     * 
     * @async
     */
    renderMap: async function() {
        const svg = d3.select('#dashboard-map-svg');
        svg.selectAll('*').remove();
        
        const width = 960;
        const height = 600;
        
        svg.attr('viewBox', `0 0 ${width} ${height}`);
        
        // Load US states topology
        const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        
        // Create projection and path generator
        this.mapProjection = d3.geoAlbersUsa()
            .scale(1300)
            .translate([width / 2, height / 2]);
        
        this.mapPath = d3.geoPath().projection(this.mapProjection);
        
        // Create color scale for mobility values
        const mobilityValues = Object.values(this.stateAverages)
            .map(s => s.mobility_overall)
            .filter(v => v && !isNaN(v));
        
        this.colorScale = d3.scaleSequential()
            .domain([d3.min(mobilityValues), d3.max(mobilityValues)])
            .interpolator(d3.interpolateRdYlGn);
        
        // Draw states
        const states = topojson.feature(us, us.objects.states);
        
        svg.selectAll('path')
            .data(states.features)
            .join('path')
            .attr('d', this.mapPath)
            .attr('fill', d => {
                const stateData = this.stateAverages[String(d.id).padStart(2, '0')];
                return stateData ? this.colorScale(stateData.mobility_overall) : '#ccc';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('data-state-fips', d => d.id)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('stroke', '#4d1f2f')
                    .attr('stroke-width', 2);
            })
            .on('mouseout', (event, d) => {
                if (this.selectedState !== d.id) {
                    d3.select(event.target)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1);
                }
            })
            .on('click', (event, d) => {
                const fips = String(d.id).padStart(2, '0');
                const stateData = this.stateAverages[fips];
                if (stateData) {
                    this.onStateSelect(stateData, event.target);
                }
            });
        
        // Add legend
        this.addMapLegend(svg, width);
    },
    
    /**
     * Adds a color scale legend to the map.
     * 
     * @param {Object} svg - D3 SVG selection
     * @param {number} width - SVG width
     */
    addMapLegend: function(svg, width) {
        const legendWidth = 200;
        const legendHeight = 15;
        const legendX = width - legendWidth - 40;
        const legendY = 30;
        
        const legend = svg.append('g')
            .attr('transform', `translate(${legendX}, ${legendY})`);
        
        // Create gradient
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'mobility-gradient');
        
        gradient.selectAll('stop')
            .data(d3.range(0, 1.1, 0.1))
            .join('stop')
            .attr('offset', d => d * 100 + '%')
            .attr('stop-color', d => this.colorScale(
                this.colorScale.domain()[0] + d * (this.colorScale.domain()[1] - this.colorScale.domain()[0])
            ));
        
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#mobility-gradient)');
        
        legend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .style('font-size', '12px')
            .text('Lower Mobility');
        
        legend.append('text')
            .attr('x', legendWidth)
            .attr('y', -5)
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .text('Higher Mobility');
    },
    
    /**
     * Handles state selection from map click.
     * Updates all dashboard panels with selected state's data.
     * 
     * @param {Object} stateData - Aggregated state data object
     * @param {Element} element - Clicked DOM element
     */
    onStateSelect: function(stateData, element) {
        // Update selection state
        this.selectedState = stateData.stateFIPS;
        
        // Reset all state strokes
        d3.selectAll('#dashboard-map-svg path')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        
        // Highlight selected state
        d3.select(element)
            .attr('stroke', '#4d1f2f')
            .attr('stroke-width', 3);
        
        // Update all panels
        this.updateStateHeader(stateData);
        this.updateHousingChart(stateData);
        this.updateMobilityBreakdown(stateData);
        this.updateFactorsGrid(stateData);
    },
    
    /**
     * Updates the state header panel with selected state info.
     * 
     * @param {Object} stateData - Aggregated state data object
     */
    updateStateHeader: function(stateData) {
        const header = d3.select('#state-header');
        
        header.html(`
            <div class="state-header-content">
                <h2 class="state-name">${stateData.stateName}</h2>
                <div class="state-mobility-score">
                    <span class="mobility-value">${Math.round(stateData.mobility_overall)}</span>
                    <span class="mobility-label">Mobility Score</span>
                </div>
            </div>
        `);
    },
    
    /**
     * Updates the housing price chart with state-specific time series.
     * 
     * @param {Object} stateData - Aggregated state data object
     */
    updateHousingChart: function(stateData) {
        const container = d3.select('#housing-chart');
        container.selectAll('*').remove();
        
        const housingTimeSeries = this.housingData[stateData.stateName];
        if (!housingTimeSeries || housingTimeSeries.length === 0) {
            container.html('<div class="no-data">Housing data not available</div>');
            return;
        }
        
        // Calculate affordability metrics
        const perCapitaIncome = this.incomeData[stateData.stateName] || 35000;
        const latestPrice = housingTimeSeries[housingTimeSeries.length - 1].price;
        const earliestPrice = housingTimeSeries[0].price;
        const priceIncrease = Math.round(((latestPrice - earliestPrice) / earliestPrice) * 100);
        const affordabilityRatio = (latestPrice / perCapitaIncome).toFixed(1);
        
        // Create SVG chart
        const margin = {top: 20, right: 30, bottom: 40, left: 60};
        const width = 500 - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;
        
        const svg = container.append('svg')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create scales
        const x = d3.scaleTime()
            .domain(d3.extent(housingTimeSeries, d => d.date))
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(housingTimeSeries, d => d.price) * 1.1])
            .range([height, 0]);
        
        // Add area fill
        svg.append('path')
            .datum(housingTimeSeries)
            .attr('fill', 'rgba(215, 91, 135, 0.2)')
            .attr('d', d3.area()
                .x(d => x(d.date))
                .y0(height)
                .y1(d => y(d.price))
            );
        
        // Add line
        svg.append('path')
            .datum(housingTimeSeries)
            .attr('fill', 'none')
            .attr('stroke', '#d75b87')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
                .x(d => x(d.date))
                .y(d => y(d.price))
            );
        
        // Add axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5));
        
        svg.append('g')
            .call(d3.axisLeft(y).tickFormat(d => '$' + (d/1000) + 'k'));
        
        // Add annotation
        container.append('div')
            .attr('class', 'chart-annotation')
            .html(`
                <div class="annotation-row">
                    <strong>Price Growth:</strong> 
                    <span class="highlight-badge">${priceIncrease}%</span> increase over 25 years
                </div>
                <div class="annotation-row">
                    <strong>Context:</strong> The typical ${stateData.stateName} resident would need to spend 
                    <span class="highlight-badge">${affordabilityRatio} years</span> of their entire income to buy a median-priced home.
                </div>
            `);
    },
    
    /**
     * Updates the mobility breakdown bars by race.
     * 
     * @param {Object} stateData - Aggregated state data object
     */
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
            
            // Animate bar fill
            setTimeout(() => {
                fill.style('width', `${race.value}%`);
            }, 100);
        });
    },
    
    /**
     * Updates the factors grid with socioeconomic indicators.
     * 
     * @param {Object} stateData - Aggregated state data object
     */
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
    
    /**
     * Switches between factors view and correlations view.
     * 
     * @param {string} view - Either 'factors' or 'correlations'
     */
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
    
    /**
     * Updates the correlations grid showing statistical relationships.
     */
    updateCorrelationsGrid: function() {
        const correlations = [
            {
                icon: 'down',
                title: 'Single-Parent Rate',
                value: 'r = -0.59',
                desc: 'Shows <span class="correlation-strength negative">strong negative</span> correlation with mobility',
                strength: 'negative'
            },
            {
                icon: 'up',
                title: 'Median Income',
                value: 'r = +0.59',
                desc: 'Shows <span class="correlation-strength positive">strong positive</span> correlation with mobility',
                strength: 'positive'
            },
            {
                icon: 'up',
                title: 'College Rate',
                value: 'r = +0.50',
                desc: 'Shows <span class="correlation-strength positive">strong positive</span> correlation with mobility',
                strength: 'positive'
            },
            {
                icon: 'down',
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
                .text(corr.icon === 'up' ? '+' : '-');
            
            header.append('div')
                .attr('class', 'correlation-title')
                .text(corr.title);
            
            card.append('div')
                .attr('class', 'correlation-value')
                .text(corr.value);
            
            card.append('div')
                .attr('class', 'correlation-desc')
                .html(corr.desc);
            
            // Animate in with stagger
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
