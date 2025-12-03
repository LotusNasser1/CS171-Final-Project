/**
 * viz-loader.js - Plotly Visualization Loader
 * 
 * This module loads census tract data and generates advanced Plotly
 * visualizations including Sankey diagrams, correlation heatmaps,
 * and treemaps to explore economic mobility patterns.
 * 
 * Dependencies:
 *   - PapaParse for CSV parsing
 *   - Plotly.js for visualization rendering
 * 
 * Visualizations:
 *   1. Sankey Diagram: Shows mobility flow through poverty->race->education
 *   2. Correlation Heatmap: Shows relationships between socioeconomic factors
 *   3. Treemap: Hierarchical view of population segments by income and education
 * 
 * Key Functions:
 *   - initializeVisualizations(): Entry point, loads data and creates all charts
 *   - loadCSVAndCreateVisualizations(): Main data loading and processing
 *   - createSankeyVisualization(): Builds flow diagram
 *   - createHeatmapVisualization(): Builds correlation matrix
 *   - createTreemapVisualization(): Builds hierarchical chart
 * 
 * Helper Functions:
 *   - categorizePoverty(poorShare): Classifies poverty level
 *   - categorizeRace(row): Determines dominant race in tract
 *   - categorizeEducation(fracColl): Classifies education level
 *   - createSegment(poverty, education): Creates segment label
 *   - calculateCorrelation(x, y): Computes Pearson correlation
 *   - getMobilityColor(mobility): Returns color based on mobility score
 * 
 * Color Scheme:
 *   - Low mobility: Red/crimson tones
 *   - Medium mobility: Orange/amber tones
 *   - High mobility: Green tones
 * 
 * @author Economic Mobility Project Team
 * @version 1.0.0
 */

 * viz-loader.js
 * Loads CSV data and generates Plotly visualizations dynamically
 * This replaces the iframe approach with data-driven visualizations
 */

// Path to your large CSV file - CHANGE THIS to your actual CSV path
const CSV_DATA_PATH = 'data/atlas.csv';

// Global data store
let mobilityData = null;
let visualizationsLoaded = false;

// Function to initialize visualizations (called when Tab 3 is activated)
function initializeVisualizations() {
  if (!visualizationsLoaded) {
    console.log('Initializing Tab 3 visualizations...');
    loadCSVAndCreateVisualizations();
    visualizationsLoaded = true;
  }
}

// Also try to load on DOM ready (in case Tab 3 is default)
document.addEventListener('DOMContentLoaded', function() {
  // Check if Tab 3 is already active
  const tab3Active = document.getElementById('trends-view')?.classList.contains('active');
  if (tab3Active) {
    initializeVisualizations();
  }
});

/**
 * Main function to load CSV and create all visualizations
 */
function loadCSVAndCreateVisualizations() {
  console.log('🔄 Loading CSV data from:', CSV_DATA_PATH);
  
  // Check if containers exist
  const sankeyContainer = document.getElementById('sankey-viz-container');
  const heatmapContainer = document.getElementById('heatmap-viz-container');
  const treemapContainer = document.getElementById('treemap-viz-container');
  
  if (!sankeyContainer || !heatmapContainer || !treemapContainer) {
    console.error('❌ Visualization containers not found! Tab 3 content may not be loaded.');
    return;
  }
  
  // Check if Papa Parse is available
  if (typeof Papa === 'undefined') {
    console.error('❌ PapaParse library not loaded!');
    showError('PapaParse library failed to load. Check your internet connection.');
    return;
  }
  
  // Check if Plotly is available
  if (typeof Plotly === 'undefined') {
    console.error('❌ Plotly library not loaded!');
    showError('Plotly library failed to load. Check your internet connection.');
    return;
  }
  
  console.log('✓ All libraries loaded, starting CSV parse...');
  
  Papa.parse(CSV_DATA_PATH, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      console.log(`✓ Loaded ${results.data.length} rows from CSV`);
      mobilityData = results.data;
      
      // Create all three visualizations
      createSankeyVisualization();
      createHeatmapVisualization();
      createTreemapVisualization();
    },
    error: function(error) {
      console.error('Error loading CSV:', error);
      showError('Failed to load data. Please check the CSV path.');
    }
  });
}

/**
 * VISUALIZATION 1: SANKEY DIAGRAM
 * Shows mobility outcomes through poverty → race → education pathways
 */
function createSankeyVisualization() {
  const container = document.getElementById('sankey-viz-container');
  if (!container) return;

  // Filter valid data with mobility outcomes
  const validData = mobilityData.filter(row => 
    row.poor_share2010 != null && 
    row.kfr_pooled_pooled_p25 != null && // Mobility outcome for kids from 25th percentile
    (row.share_white2010 != null || row.share_black2010 != null || 
     row.share_hisp2010 != null || row.share_asian2010 != null) &&
    row.frac_coll_plus2010 != null
  );

  // Categorize data with mobility scores
  const processedData = validData.map(row => ({
    poverty: categorizePoverty(row.poor_share2010),
    race: categorizeRace(row),
    education: categorizeEducation(row.frac_coll_plus2010),
    mobility: row.kfr_pooled_pooled_p25, // Adult income rank for kids born at 25th percentile
    population: row.popdensity2010 || 1, // Weight by population density
    avgIncome: row.hhinc_mean2000 || 40000
  })).filter(row => row.poverty && row.race && row.education);

  if (processedData.length === 0) {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: #A86B5A;">No valid data for Sankey diagram.</div>';
    return;
  }

  // Build Sankey structure
  const povertyCats = ['Low Poverty\n(<10%)', 'Medium Poverty\n(10-25%)', 'High Poverty\n(>25%)'];
  const raceCats = ['White', 'Black', 'Hispanic', 'Asian'];
  const educationCats = ['Low College\n(<15%)', 'Medium College\n(15-35%)', 'High College\n(>35%)'];
  
  const nodeLabels = [...povertyCats, ...raceCats, ...educationCats];
  const nodeDict = {};
  nodeLabels.forEach((label, idx) => nodeDict[label] = idx);

  // Enhanced node colors - more distinct and vibrant for better tracking
  const nodeColors = [
    "#8B4513", "#CD853F", "#DEB887",  // Poverty levels (brown shades - distinct)
    "#4682B4", "#2F4F4F", "#FF8C00", "#9370DB",  // Race (blue, red, orange, purple - very distinct)
    "#228B22", "#32CD32", "#90EE90"  // Education (green gradient - lighter to darker)
  ];

  // Build links with MOBILITY METRICS instead of just counts
  const linkMap = new Map();
  
  processedData.forEach(row => {
    // Poverty to Race
    const key1 = `${row.poverty}->${row.race}`;
    if (!linkMap.has(key1)) {
      linkMap.set(key1, {
        count: 0,
        totalMobility: 0,
        totalIncome: 0,
        populations: []
      });
    }
    const link1 = linkMap.get(key1);
    link1.count++;
    link1.totalMobility += row.mobility;
    link1.totalIncome += row.avgIncome;
    link1.populations.push(row.population);
    
    // Race to Education
    const key2 = `${row.race}->${row.education}`;
    if (!linkMap.has(key2)) {
      linkMap.set(key2, {
        count: 0,
        totalMobility: 0,
        totalIncome: 0,
        populations: []
      });
    }
    const link2 = linkMap.get(key2);
    link2.count++;
    link2.totalMobility += row.mobility;
    link2.totalIncome += row.avgIncome;
    link2.populations.push(row.population);
  });

  const links = [];
  const linkColors = [];

  linkMap.forEach((data, key) => {
    const [source, target] = key.split('->');
    if (nodeDict[source] !== undefined && nodeDict[target] !== undefined) {
      const avgMobility = data.totalMobility / data.count;
      const avgIncome = data.totalIncome / data.count;
      const weightedValue = data.populations.reduce((a, b) => a + b, 0);
      
      links.push({
        source: nodeDict[source],
        target: nodeDict[target],
        value: weightedValue, // Use population-weighted flow
        mobility: avgMobility,
        income: avgIncome,
        tractCount: data.count
      });
      
      // Color by mobility outcome (low mobility = terracotta, high = eucalyptus)
      const mobilityColor = getMobilityColor(avgMobility);
      linkColors.push(mobilityColor);
    }
  });

  // Create Sankey with enhanced tooltips
  const trace = {
    type: "sankey",
    orientation: "h",
    node: {
      pad: 20,
      thickness: 25,
      line: { color: "#EDE8E3", width: 2 },
      label: nodeLabels,
      color: nodeColors,
      customdata: nodeLabels.map((label, idx) => {
        // Calculate average mobility for each node
        const nodeLinks = links.filter(l => l.source === idx || l.target === idx);
        const avgMobility = nodeLinks.length > 0 
          ? nodeLinks.reduce((sum, l) => sum + l.mobility, 0) / nodeLinks.length
          : 0;
        return avgMobility;
      }),
      hovertemplate: '<b>%{label}</b><br>Avg mobility: %{customdata:.1f} percentile<extra></extra>'
    },
    link: {
      source: links.map(l => l.source),
      target: links.map(l => l.target),
      value: links.map(l => l.value),
      color: linkColors,
      customdata: links.map(l => ({
        mobility: l.mobility,
        income: l.income,
        tracts: l.tractCount
      })),
      hovertemplate: 
        '<b>Flow:</b> %{customdata.tracts} census tracts<br>' +
        '<b>Avg Mobility:</b> %{customdata.mobility:.1f} income percentile<br>' +
        '<b>Avg Income:</b> $%{customdata.income:.0f}<br>' +
        '<extra></extra>'
    }
  };

  const layout = {
    font: { size: 12, family: 'Segoe UI', color: '#4d1f2f' },
    height: 950,
    margin: { l: 50, r: 50, t: 100, b: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    annotations: [{
      text: '<b>Flow thickness = population | Flow color = mobility outcome</b><br>' +
            'Red = low mobility | Orange = medium | Green = high mobility',
      xref: 'paper',
      yref: 'paper',
      x: 0.5,
      y: 1.01,
      xanchor: 'center',
      yanchor: 'bottom',
      showarrow: false,
      font: { size: 11, color: '#4d1f2f' }
    }]
  };

  Plotly.newPlot(container, [trace], layout, {responsive: true, displayModeBar: false});
  console.log('✓ Enhanced Sankey created:', processedData.length, 'tracts with mobility data');
  
  // Add data summary below
  addDataSummary(processedData, 'sankey');
}

/**
 * VISUALIZATION 2: HEATMAP
 * Shows correlations between socioeconomic factors
 */
function createHeatmapVisualization() {
  const container = document.getElementById('heatmap-viz-container');
  if (!container) return;

  // Select columns for correlation
  const columns = {
    'hhinc_mean2000': 'Household Income',
    'frac_coll_plus2010': 'College Education',
    'homeownership2010': 'Home Ownership',
    'poor_share2010': 'Poverty Rate',
    'emp2000': 'Employment',
    'mean_commutetime2000': 'Commute Time',
    'popdensity2010': 'Population Density',
    'pm25_2010': 'Air Pollution',
    'vegetation': 'Vegetation',
    'job_density_2013': 'Job Density',
    'jobs_highpay_5mi_2015': 'High-Pay Jobs',
    'singleparent_share2010': 'Single Parent',
    'rent_twobed2015': 'Rent',
    'med_hhinc2016': 'Median Income',
    'share_white2010': 'White Share'
  };

  // Clean data
  const cleanData = mobilityData.map(row => {
    const cleanRow = {};
    let hasAll = true;
    for (let col of Object.keys(columns)) {
      const val = row[col];
      if (val == null || isNaN(val)) {
        hasAll = false;
        break;
      }
      cleanRow[col] = val;
    }
    return hasAll ? cleanRow : null;
  }).filter(row => row !== null);

  if (cleanData.length < 3) {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: #A86B5A;">Not enough valid data for correlation analysis.</div>';
    return;
  }

  // Calculate correlations
  const colKeys = Object.keys(columns);
  const labels = colKeys.map(k => columns[k]);
  const n = colKeys.length;
  const corrMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
  const corrText = Array(n).fill(0).map(() => Array(n).fill(''));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        corrMatrix[i][j] = 1;
        corrText[i][j] = '1.00'; // Show 1.00 on diagonal
      } else {
        const x = cleanData.map(row => row[colKeys[i]]);
        const y = cleanData.map(row => row[colKeys[j]]);
        const corr = calculateCorrelation(x, y);
        corrMatrix[i][j] = corr;
        corrText[i][j] = corr.toFixed(2);
      }
    }
  }

  const trace = {
    type: 'heatmap',
    z: corrMatrix,
    x: labels,
    y: labels,
    colorscale: [
      [0, '#8B5A4A'],      // Dark terracotta (same as treemap)
      [0.25, '#A86B5A'],   // Terracotta (same as treemap)
      [0.5, '#C8A882'],    // Warm tan (same as treemap)
      [0.75, '#D4C4A8'],   // Light cream (same as treemap)
      [1, '#B5C4B8']       // Eucalyptus (same as treemap)
    ],
    zmid: 0,
    zmin: -1,
    zmax: 1,
    text: corrText,
    texttemplate: '%{text}',
    textfont: { 
      color: '#1a1410',  // Much darker brown for better contrast
      size: 11,
      family: 'Segoe UI, sans-serif',
      weight: 700  // Bold
    },
    hovertemplate: '<b style="color: #000000;">%{y}</b> vs <b style="color: #000000;">%{x}</b><br><span style="color: #000000;">Correlation: %{z:.3f}</span><extra></extra>',
    hoverlabel: {
      bgcolor: 'rgba(255, 255, 255, 0.95)',  // Keep the white background - this was perfect!
      bordercolor: '#4d1f2f',
      font: { 
        color: '#000000',  // Black text for readability
        size: 13,
        family: 'Segoe UI'
      }
    },
    colorbar: {
      title: { 
        text: 'Correlation',
        font: { color: '#4d1f2f', size: 13, weight: 600 }
      },
      tickfont: { color: '#4d1f2f', size: 11, weight: 600 },
      len: 0.7,
      thickness: 20,
      tickvals: [-1, -0.5, 0, 0.5, 1],
      ticktext: ['-1.0', '-0.5', '0', '+0.5', '+1.0']
    }
  };

  const layout = {
    xaxis: {
      side: 'bottom',
      tickfont: { color: '#4d1f2f', size: 12, weight: 600 },
      tickangle: -45,
      tickmode: 'linear'
    },
    yaxis: {
      autorange: 'reversed',
      tickfont: { color: '#4d1f2f', size: 12, weight: 600 },
      tickmode: 'linear'
    },
    font: { family: 'Segoe UI', color: '#4d1f2f' },
    height: 750,
    margin: { l: 180, r: 150, t: 30, b: 180 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent'
  };

  Plotly.newPlot(container, [trace], layout, {responsive: true, displayModeBar: false});
  console.log('✓ Heatmap created with', cleanData.length, 'valid rows');
  
  // Add correlation insights
  addCorrelationSummary(corrMatrix, labels, 'heatmap');
}

/**
 * VISUALIZATION 3: TREEMAP
 * Shows population distribution across mobility segments
 */
function createTreemapVisualization() {
  const container = document.getElementById('treemap-viz-container');
  if (!container) return;

  // Categorize and segment
  const processedData = mobilityData.map(row => ({
    poverty: categorizePoverty(row.poor_share2010),
    education: categorizeEducation(row.frac_coll_plus2010),
    income: row.hhinc_mean2000,
    mobility: row.kfr_pooled_pooled_p25
  })).map(row => ({
    ...row,
    segment: createSegment(row.poverty, row.education)
  })).filter(row => row.segment && row.income != null && !isNaN(row.income));

  if (processedData.length === 0) {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: #A86B5A;">No valid data for treemap.</div>';
    return;
  }

  // Aggregate by segment
  const segmentMap = new Map();
  processedData.forEach(row => {
    if (!segmentMap.has(row.segment)) {
      segmentMap.set(row.segment, { 
        count: 0, 
        totalIncome: 0,
        totalMobility: 0,
        mobilityCount: 0
      });
    }
    const seg = segmentMap.get(row.segment);
    seg.count++;
    seg.totalIncome += row.income;
    if (row.mobility != null && !isNaN(row.mobility)) {
      seg.totalMobility += row.mobility;
      seg.mobilityCount++;
    }
  });

  const segments = Array.from(segmentMap.keys());
  const values = segments.map(seg => segmentMap.get(seg).count);
  const avgIncomes = segments.map(seg => 
    segmentMap.get(seg).totalIncome / segmentMap.get(seg).count / 1000
  );
  const avgMobility = segments.map(seg => {
    const data = segmentMap.get(seg);
    return data.mobilityCount > 0 ? data.totalMobility / data.mobilityCount : null;
  });

  // Create text labels with income values
  const textLabels = segments.map((seg, idx) => {
    const data = segmentMap.get(seg);
    const income = avgIncomes[idx];
    
    // Format segment name for display - removing this since it's double-labeled
    const displayName = seg
      .replace('HighPov-', 'High Poverty<br>')
      .replace('Middle-', 'Middle Income<br>')
      .replace('Affluent-', 'Affluent<br>')
      .replace('LowEd', 'Low Education')
      .replace('MedEd', 'Medium Education')
      .replace('Educated', 'High Education');
    
    // Show income and tract count with semi-bold styling
    return `<b style="font-size: 16px; font-weight: 700;">$${income.toFixed(0)}k</b><br>` +
           `<span style="font-weight: 400;">${data.count.toLocaleString()} tracts</span>`;
  });

  const trace = {
    type: 'treemap',
    labels: segments.map(seg => {
      // Format the labels properly for display
      return seg
        .replace('HighPov-', 'High Poverty<br>')
        .replace('Middle-', 'Middle Income<br>')
        .replace('Affluent-', 'Affluent<br>')
        .replace('LowEd', 'Low Education')
        .replace('MedEd', 'Medium Education')
        .replace('Educated', 'High Education');
    }),
    parents: Array(segments.length).fill(''),
    values: values,
    text: textLabels,
    textposition: 'middle center',
    textfont: { 
      size: 14, 
      family: 'Segoe UI, sans-serif', 
      color: '#FFFFFF'  
    },
    marker: {
      colors: avgIncomes,
      colorscale: [
        [0, '#8B5A4A'],      // Dark terracotta (low income) - EXACT SAME
        [0.25, '#A86B5A'],   // Terracotta - EXACT SAME
        [0.5, '#C8A882'],    // Warm tan - EXACT SAME
        [0.75, '#D4C4A8'],   // Light cream - EXACT SAME
        [1, '#B5C4B8']       // Eucalyptus (high income) - EXACT SAME
      ],
      line: { 
        color: '#EDE8E3', 
        width: 3 
      },
      colorbar: {
        title: { 
          text: 'Avg Income ($1000s)',
          font: { color: '#4d1f2f', size: 14 }
        },
        tickfont: { color: '#4d1f2f', size: 10 },
        len: 0.5,
        thickness: 15,
        ticksuffix: 'k',
        tickformat: '.0f',
        x: 1.0,
        xanchor: 'left'
      },
      pad: { t: 40, b: 40, l: 10, r: 10 }
    },
    hovertemplate: 
      '<b>%{label}</b><br>' +
      '<b>Tracts:</b> %{value:,}<br>' +
      '<b>Avg Income:</b> $%{color:.0f}k<br>' +
      '<b>Mobility:</b> %{customdata:.1f} percentile<br>' +
      '<extra></extra>',
    hoverlabel: {
      bgcolor: 'rgba(255, 255, 255, 0.95)',
      bordercolor: '#4d1f2f',
      font: { 
        color: '#000000',
        size: 13,
        family: 'Segoe UI'
      }
    },
    customdata: avgMobility
  };

  const layout = {
    font: { family: 'Segoe UI', color: '#4d1f2f' },
    height: 700,
    margin: { l: 10, r: 10, t: 40, b: 10 },
    paper_bgcolor: 'transparent',
    annotations: [{
      text: '<b>Box size = census tracts | Color = average income</b><br>' +
            'Darker = lower income | Lighter = higher income',
      xref: 'paper',
      yref: 'paper',
      x: 0.5,
      y: 1.01,
      xanchor: 'center',
      yanchor: 'bottom',
      showarrow: false,
      font: { size: 11, color: '#4d1f2f' }
    }]
  };

  Plotly.newPlot(container, [trace], layout, {responsive: true, displayModeBar: false});
  console.log('✓ Treemap created with', processedData.length, 'tracts');
  
  // Add segment breakdown
  addSegmentBreakdown(segmentMap, avgIncomes, avgMobility, 'treemap');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper: Get color based on mobility score - more vibrant colors
 */
function getMobilityColor(mobility) {
  // mobility ranges from ~25 (low) to ~50+ (high) percentile
  // Normalize to 0-1 scale
  const normalized = Math.max(0, Math.min(1, (mobility - 25) / 30));
  
  if (normalized < 0.33) {
    // Low mobility - vibrant red/crimson with better opacity
    return `rgba(220, 20, 60, ${0.45 + normalized * 0.3})`;
  } else if (normalized < 0.67) {
    // Medium mobility - golden/amber
    return `rgba(255, 165, 0, ${0.45 + normalized * 0.3})`;
  } else {
    // High mobility - vibrant green
    return `rgba(50, 205, 50, ${0.45 + normalized * 0.3})`;
  }
}

/**
 * Add data summary card below visualization
 */
function addDataSummary(data, vizType) {
  const summaryHTML = `
    <div class="data-summary">
      <div class="summary-stat">
        <div class="stat-value">${data.length.toLocaleString()}</div>
        <div class="stat-label">Census Tracts</div>
      </div>
      <div class="summary-stat">
        <div class="stat-value">${(data.reduce((sum, d) => sum + d.mobility, 0) / data.length).toFixed(1)}</div>
        <div class="stat-label">Avg Mobility Percentile</div>
      </div>
      <div class="summary-stat">
        <div class="stat-value">$${(data.reduce((sum, d) => sum + d.avgIncome, 0) / data.length / 1000).toFixed(0)}k</div>
        <div class="stat-label">Avg Household Income</div>
      </div>
    </div>
  `;
  
  const container = document.getElementById(`${vizType}-viz-container`);
  if (container && !container.nextElementSibling?.classList.contains('data-summary')) {
    container.insertAdjacentHTML('afterend', summaryHTML);
  }
}

/**
 * Add correlation insights summary
 */
function addCorrelationSummary(matrix, labels, vizType) {
  // Find strongest correlations (excluding diagonal)
  const correlations = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      correlations.push({
        var1: labels[i],
        var2: labels[j],
        value: matrix[i][j]
      });
    }
  }
  
  // Sort by absolute value
  correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  const topPositive = correlations.filter(c => c.value > 0).slice(0, 3);
  const topNegative = correlations.filter(c => c.value < 0).slice(0, 3);
  
  const summaryHTML = `
    <div class="correlation-summary">
      <div class="correlation-column">
        <h4 style="color: #228B22; margin: 0 0 10px 0;">Strongest Positive Correlations</h4>
        ${topPositive.map(c => `
          <div class="correlation-item">
            <span class="corr-vars">${c.var1} ↔ ${c.var2}</span>
            <span class="corr-value positive">+${c.value.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <div class="correlation-column">
        <h4 style="color: #DC143C; margin: 0 0 10px 0;">Strongest Negative Correlations</h4>
        ${topNegative.map(c => `
          <div class="correlation-item">
            <span class="corr-vars">${c.var1} ↔ ${c.var2}</span>
            <span class="corr-value negative">${c.value.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  const container = document.getElementById(`${vizType}-viz-container`);
  if (container && !container.nextElementSibling?.classList.contains('correlation-summary')) {
    container.insertAdjacentHTML('afterend', summaryHTML);
  }
}

/**
 * Add segment breakdown table
 */
function addSegmentBreakdown(segmentMap, avgIncomes, avgMobility, vizType) {
  const segments = Array.from(segmentMap.keys());
  
  // Sort by count (descending)
  const sortedData = segments.map((seg, idx) => ({
    segment: seg,
    count: segmentMap.get(seg).count,
    income: avgIncomes[idx],
    mobility: avgMobility[idx]
  })).sort((a, b) => b.count - a.count);
  
  const summaryHTML = `
    <div class="segment-breakdown">
      <h4 style="color: #4d1f2f; margin: 0 0 15px 0; font-size: 16px; font-family: 'Segoe UI', sans-serif;">Segment Breakdown</h4>
      <div class="segment-table">
        <div class="segment-row segment-header">
          <div class="segment-cell">Segment</div>
          <div class="segment-cell">Tracts</div>
          <div class="segment-cell">Avg Income</div>
          <div class="segment-cell">Mobility</div>
        </div>
        ${sortedData.map(d => `
          <div class="segment-row">
            <div class="segment-cell segment-name">${formatSegmentName(d.segment)}</div>
            <div class="segment-cell">${d.count.toLocaleString()}</div>
            <div class="segment-cell">$${d.income.toFixed(0)}k</div>
            <div class="segment-cell">${d.mobility ? d.mobility.toFixed(1) : 'N/A'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  const container = document.getElementById(`${vizType}-viz-container`);
  if (container && !container.nextElementSibling?.classList.contains('segment-breakdown')) {
    container.insertAdjacentHTML('afterend', summaryHTML);
  }
}

/**
 * Format segment name for display
 */
function formatSegmentName(segment) {
  return segment
    .replace('HighPov-', 'High Poverty, ')
    .replace('Middle-', 'Middle Income, ')
    .replace('Affluent-', 'Affluent, ')
    .replace('LowEd', 'Low Education')
    .replace('MedEd', 'Medium Education')
    .replace('Educated', 'High Education');
}

// Categorization helpers
function categorizePoverty(poorShare) {
  if (poorShare == null || isNaN(poorShare)) return null;
  if (poorShare < 0.10) return 'Low Poverty\n(<10%)';
  if (poorShare < 0.25) return 'Medium Poverty\n(10-25%)';
  return 'High Poverty\n(>25%)';
}

function categorizeRace(row) {
  const shares = {
    'White': row.share_white2010,
    'Black': row.share_black2010,
    'Hispanic': row.share_hisp2010,
    'Asian': row.share_asian2010
  };
  let maxRace = null;
  let maxShare = -1;
  for (let [race, share] of Object.entries(shares)) {
    if (share != null && !isNaN(share) && share > maxShare) {
      maxShare = share;
      maxRace = race;
    }
  }
  return maxRace;
}

function categorizeEducation(fracColl) {
  if (fracColl == null || isNaN(fracColl)) return null;
  if (fracColl < 0.15) return 'Low College\n(<15%)';
  if (fracColl < 0.35) return 'Medium College\n(15-35%)';
  return 'High College\n(>35%)';
}

function createSegment(poverty, education) {
  if (!poverty || !education) return null;
  const pov = poverty.includes('High') ? 'High' : poverty.includes('Medium') ? 'Medium' : 'Low';
  const edu = education.includes('Low') ? 'LowEd' : education.includes('Medium') ? 'MedEd' : 'Educated';
  
  if (pov === 'High') return edu === 'LowEd' ? 'HighPov-LowEd' : 'HighPov-MedEd';
  if (pov === 'Medium') return edu === 'LowEd' ? 'Middle-LowEd' : 'Middle-Educated';
  return edu === 'LowEd' ? 'Affluent-LowEd' : 'Affluent-Educated';
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function showError(message) {
  ['sankey-viz-container', 'heatmap-viz-container', 'treemap-viz-container'].forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `<div style="padding: 40px; text-align: center; color: #4d1f2f;">${message}</div>`;
    }
  });
}