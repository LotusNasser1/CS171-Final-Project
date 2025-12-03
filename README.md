# Economic Mobility Explorer

An interactive data visualization project exploring economic mobility in the United States through engaging storytelling and data-driven insights.

## Project Overview

This project visualizes economic mobility data from the Opportunity Atlas, allowing users to explore how factors like education, housing costs, geography, race, and family structure affect upward economic mobility across different communities in the United States.

## How to Run

### Option 1: Simple HTTP Server (Recommended)

**Using Python 3:**
```bash
python3 -m http.server 8000
```

**Using Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

Then open your browser and navigate to:
```
http://localhost:8000
```

### Option 2: Live Server (VS Code)

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Opening

Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge recommended).

**Note:** Some features may require running from a server due to CORS policies for loading CSV files.

## Libraries & Dependencies

### Core Libraries

All libraries are loaded via CDN - no installation required!

1. **D3.js v7** - Data visualization and DOM manipulation
   - Used for: Geographic visualizations, mountain charts, interactive maps
   - CDN: `https://d3js.org/d3.v7.min.js`

2. **TopoJSON v3** - Geographic data format
   - Used for: US map rendering
   - CDN: `https://d3js.org/topojson.v3.min.js`

3. **Plotly.js 2.27.0** - Interactive charting library
   - Used for: Dashboard visualizations, interactive charts
   - CDN: `https://cdn.plot.ly/plotly-2.27.0.min.js`

4. **PapaParse 5.4.1** - CSV parsing library
   - Used for: Loading and parsing CSV data files
   - CDN: `https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js`

5. **Google Fonts - Press Start 2P** - Retro pixel-style font
   - Used for: Typography throughout the project
   - CDN: Google Fonts API

## Project Structure

```
economic-mobility-project/
│
├── index.html                 # Main HTML file
│
├── README.md                  # This file
├── DATA_DICTIONARY.md         # Comprehensive data documentation
│
├── css/                       # Stylesheets
│   ├── base.css              # Base styles and variables
│   ├── transitions.css       # Transition screen styles
│   ├── avatar-builder.css    # Avatar builder interface
│   ├── dashboard.css         # Dashboard visualization styles
│   ├── mountains.css         # Mountain visualization styles
│   ├── instructions.css      # Instruction screen styles
│   ├── intro-screen.css      # Introduction screen styles
│   ├── landing.css           # Landing page styles
│   ├── card.css              # Card component styles
│   ├── components.css        # Reusable components
│   ├── speedometer.css       # Speedometer visualization
│   ├── vizlab.css            # Visualization lab styles
│   ├── factors.css           # Factors display styles
│   ├── styles.css            # Global styles
│   └── deep-insight.css      # Deep insight section styles
│
├── js/                        # JavaScript files
│   ├── main.js               # Main application logic and navigation
│   ├── avatar-integration.js # Avatar builder functionality
│   ├── dashboard.js          # Dashboard visualizations
│   ├── mountains.js          # Mountain chart visualization
│   ├── mountain-climb.js     # Mountain climbing animation
│   ├── mobility-explorer.js  # Interactive mobility explorer
│   ├── data.js               # Data loading and processing
│   ├── prediction.js         # Mobility prediction algorithms
│   ├── meet-case.js          # Case study functionality
│   ├── instruction.js        # Instructions handling
│   └── viz-loader.js         # Visualization loader utilities
│
├── data/                      # Data files (see DATA_DICTIONARY.md)
│   ├── atlas.csv             # Opportunity Atlas main dataset (~51MB)
│   ├── state_income_2024.csv # State income data
│   ├── housing_prices_by_states.csv # Housing price data
│   ├── mobility_baseline.csv # Mobility baseline metrics
│   ├── state_label_positions.csv # Map label positions
│   └── us_cities_coordinates.csv # City coordinate data
│
├── asset/                     # Images and visual assets
│   ├── avatar_*.png          # Avatar images (various demographics)
│   ├── background_img.png    # Background image
│   └── pixel_*.png           # Pixel art characters
│
└── pages/                     # Additional HTML pages
    ├── builder.html          # Avatar builder page
    ├── deep-dive.html        # Deep dive analysis
    ├── how-it-works.html     # Methodology explanation
    ├── insights.html         # Key insights page
    └── meet-case.html        # Case study page
```

## Features

### Interactive Visualizations
- **Mountain Visualization**: Represents economic mobility as a mountain climb metaphor
- **Geographic Explorer**: Interactive US map showing mobility rates by location
- **Avatar Builder**: Create custom scenarios to explore mobility outcomes
- **Dashboard**: Comprehensive data visualizations with multiple perspectives

### User Journey (13 Pages)
1. **Landing Screen**: Introduction to economic mobility concept
2. **Intro Story**: Every pixel represents a story
3. **What is Mobility**: Educational content explaining economic mobility
4. **Mountain Intro**: The American Dream is fading
5. **Mountains**: Interactive prediction visualization
6. **Case Intro**: Transition to case studies
7. **Instructions**: How to use the interactive tools
8. **Meet Case**: Real-world examples and scenarios
9. **Prediction Tool**: Explore how different factors affect outcomes
10. **Dashboard**: Deep dive into data visualizations
11. **Forces Intro**: Opportunity is shaped by many forces
12. **Avatar Builder**: Create and compare custom scenarios
13. **Closing Reflection**: What you can do next

### Navigation
- **Scroll-based Navigation**: Smooth scrolling between sections (optimized for performance)
- **Dot Navigator**: Visual indicator showing progress through the experience (13 dots)
- **Clickable Dots**: Jump to any section by clicking the navigation dots

## Data Sources

This project uses data from the **Opportunity Atlas** (Opportunity Insights, Harvard University):
- Website: https://opportunityatlas.org
- Research: Chetty, Raj, et al. "The Opportunity Atlas: Mapping the Childhood Roots of Social Mobility"

Additional data sources:
- US Census Bureau (housing prices, income data)
- Bureau of Labor Statistics (employment data)
- Zillow (housing price indices)

**See `DATA_DICTIONARY.md` for detailed field descriptions.**

## Design Philosophy

The project uses a **retro pixel-art aesthetic** with:
- Press Start 2P font (8-bit style)
- Muted earth tone color palette (#B0B8A1, #4d1f2f, #d75b87)
- Smooth animations and transitions
- Responsive design for various screen sizes
- GPU-accelerated animations for optimal performance


## ⚡ Performance Optimizations

The project includes several performance enhancements:
- **GPU Acceleration**: CSS transforms and `will-change` properties for smooth animations
- **RequestAnimationFrame**: Scroll event handling optimized with RAF
- **Debounced Events**: Scroll listeners use debouncing to reduce computation
- **Lazy Loading**: Sections render as needed
- **Optimized Images**: Pixel art assets are lightweight

## 🐛 Known Issues & Troubleshooting

### Issue: CSV files not loading
**Solution:** Run the project from a local server (see "How to Run" section above) rather than opening the HTML file directly.

### Issue: Visualizations not rendering
**Solution:** Ensure you have a stable internet connection to load CDN resources. Check browser console for errors.

### Issue: Slow performance on initial load
**Solution:** The project loads a large dataset (atlas.csv is ~51MB). Initial load may take a few seconds on slower connections. Subsequent interactions will be faster.

### Issue: Scrolling feels laggy
**Solution:** The latest version includes performance optimizations. If issues persist, try:
- Closing other browser tabs
- Disabling browser extensions temporarily
- Using a Chromium-based browser for best performance


## Key Features Explained

### Geographic Data
- Includes data for all **50 US states plus the District of Columbia** (51 total)
- Tract-level granularity for detailed neighborhood analysis
- State-level aggregations for overview comparisons

### Mobility Metrics
- **kfr (Kids' Family Rank)**: Household income percentile for children from p25 families
- Measured separately by race, gender, and geography
- Values range from 0-100 percentile

### Interactive Elements
- Drag-and-drop predictions on mountain visualization
- State selection on map visualizations
- Custom avatar builder with multiple factor combinations
- Real-time chart updates based on user selections

## Credits

**Data Source:** Opportunity Atlas, Opportunity Insights at Harvard University

**Development:**
- Data Visualization: D3.js, Plotly.js
- Design: Custom pixel-art aesthetic
- Typography: Press Start 2P (Google Fonts)

**Citation:**
```
Chetty, Raj, John N. Friedman, Nathaniel Hendren, Maggie R. Jones, and Sonya R. Porter. 
"The Opportunity Atlas: Mapping the Childhood Roots of Social Mobility." 
NBER Working Paper No. 25147, October 2018.
```

## 📄 License

This project is for educational purposes. Data used is publicly available from the Opportunity Atlas.

## Support

For questions about the data, see `DATA_DICTIONARY.md`.

For technical issues, check the browser console for error messages.

---

**Last Updated:** December 2025  
**Course:** CS171 - Data Visualization  
**Institution:** Harvard University  
**Student:** Nikki (Class of 2026)