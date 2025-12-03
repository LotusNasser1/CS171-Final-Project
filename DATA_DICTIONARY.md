# Data Dictionary

This document describes all data files used in the Economic Mobility Explorer project.

##Data Files Overview

| File Name | Size | Source | Description |
|-----------|------|--------|-------------|
| `atlas.csv` | ~51MB | Opportunity Atlas | Main dataset with tract-level mobility metrics |
| `housing_prices_by_states.csv` | ~288KB | Zillow/US Census | Historical housing prices by state (2000-2025) |
| `state_income_2024.csv` | ~2KB | Bureau of Economic Analysis | State-level income data for 2024 |
| `mobility_baseline.csv` | ~512B | Opportunity Atlas | Baseline mobility metrics by cohort |
| `state_label_positions.csv` | ~1.5KB | Custom | State label coordinates for map visualization |
| `us_cities_coordinates.csv` | ~11KB | US Geological Survey | Major US cities with coordinates |

---

## 1. atlas.csv

**Source:** Opportunity Atlas (Opportunity Insights, Harvard University)  
**URL:** https://opportunityatlas.org  
**Description:** Comprehensive tract-level data on economic mobility and neighborhood characteristics across the United States.

### Key Fields:

#### Geographic Identifiers
- `state` (string): Two-letter state abbreviation (e.g., "MA", "CA")
- `county` (string): County FIPS code
- `tract` (string): Census tract identifier
- `tract_name` (string): Human-readable tract name
- `cz` (string): Commuting zone identifier
- `czname` (string): Commuting zone name

#### Economic Mobility Metrics (kfr = Kids' Family Rank)
**Format:** `kfr_[race]_[gender]_p[percentile]`
- Race categories: `pooled`, `natam` (Native American), `asian`, `black`, `hisp` (Hispanic), `white`
- Gender: `pooled`, `female`, `male`
- Percentile: `p25` (starting at 25th percentile of parent income)

**Examples:**
- `kfr_pooled_pooled_p25` (float): Average household income rank for children from 25th percentile families (all races/genders)
- `kfr_white_pooled_p25` (float): Economic rank for white children from p25 families
- `kfr_black_pooled_p25` (float): Economic rank for Black children from p25 families
- `kfr_hisp_pooled_p25` (float): Economic rank for Hispanic children from p25 families
- `kfr_asian_pooled_p25` (float): Economic rank for Asian children from p25 families

**Value Range:** 0-100 (percentile rank in national income distribution)

**Interpretation:** A value of 45 means that children from families at the 25th percentile of income (low income) reach the 45th percentile as adults on average.

#### Individual Income Rank (kir)
**Format:** `kir_[race]_[gender]_p25`
- Similar structure to kfr but measures individual (not household) income
- Used for gender-specific mobility analysis

**Examples:**
- `kir_pooled_female_p25` (float): Income rank for women from p25 families
- `kir_pooled_male_p25` (float): Income rank for men from p25 families
- `kir_white_female_p25` (float): Income rank for white women from p25 families
- `kir_black_male_p25` (float): Income rank for Black men from p25 families

#### Incarceration Rates (jail)
**Format:** `jail_[race]_[gender]_p25`
- Proportion incarcerated on April 1, 2010 (Census day)
- Measured for children who grew up in the tract

**Examples:**
- `jail_pooled_pooled_p25` (float): Overall incarceration rate (0-1 scale, where 0.02 = 2%)
- `jail_black_male_p25` (float): Incarceration rate for Black males from p25 families
- `jail_white_female_p25` (float): Incarceration rate for white females from p25 families

#### Environmental Factors
- `pm25_1982` (float): Particulate matter (PM2.5) pollution level in 1982 (μg/m³)
- `pm25_1990` (float): PM2.5 level in 1990
- `pm25_2000` (float): PM2.5 level in 2000
- `pm25_2010` (float): PM2.5 level in 2010
- `vegetation` (float): Vegetation coverage index (0-1 scale, where 1 = fully vegetated)
- `extreme_heat` (float): Extreme heat exposure index (higher = more heat exposure)
- `developed` (float): Proportion of developed land (0-1 scale)

#### Housing & Economic Characteristics
- `homeownership2010` (float): Homeownership rate in 2010 (0-1 scale)
- `hhinc_mean2000` (float): Mean household income in 2000 (dollars)
- `med_hhinc1990` (float): Median household income in 1990 (dollars)
- `med_hhinc2016` (float): Median household income in 2016 (dollars)
- `rent_twobed2015` (float): Median rent for 2-bedroom apartment in 2015 (dollars/month)

#### Education
- `frac_coll_plus2000` (float): Fraction with college degree or higher in 2000 (0-1 scale)
- `frac_coll_plus2010` (float): Fraction with college degree or higher in 2010 (0-1 scale)
- `gsmn_math_g3_2013` (float): Average 3rd grade math test scores (2013), standardized

#### Demographics
- `popdensity2000` (float): Population density in 2000 (people per square mile)
- `popdensity2010` (float): Population density in 2010 (people per square mile)
- `poor_share1990` (float): Poverty rate in 1990 (0-1 scale)
- `poor_share2000` (float): Poverty rate in 2000 (0-1 scale)
- `poor_share2010` (float): Poverty rate in 2010 (0-1 scale)

#### Racial Composition (by year)
**Format:** `share_[race][year]`
- Race: `white`, `black`, `hisp`, `asian`
- Years: 1990, 2000, 2010
- Values: 0-1 (proportion of total population)

**Examples:**
- `share_white2010` (float): White population share in 2010 (0.65 = 65%)
- `share_black2010` (float): Black population share in 2010
- `share_hisp2010` (float): Hispanic population share in 2010
- `share_asian2010` (float): Asian population share in 2010

#### Family Structure
- `singleparent_share1990` (float): Single-parent household rate in 1990 (0-1 scale)
- `singleparent_share2000` (float): Single-parent household rate in 2000
- `singleparent_share2010` (float): Single-parent household rate in 2010

#### Employment & Jobs
- `emp2000` (float): Employment rate in 2000 (0-1 scale)
- `jobs_total_5mi_2015` (integer): Total jobs within 5 miles in 2015
- `jobs_highpay_5mi_2015` (integer): High-paying jobs within 5 miles in 2015
- `job_density_2013` (float): Jobs per square mile in 2013
- `ann_avg_job_growth_2004_2013` (float): Average annual job growth rate 2004-2013 (0.05 = 5% growth)
- `ln_wage_growth_hs_grad` (float): Log wage growth for high school graduates

#### Commuting & Transportation
- `mean_commutetime2000` (float): Average commute time in minutes (2000)
- `traveltime15_2010` (float): Proportion with <15-min commute (2010, 0-1 scale)

#### Other
- `foreign_share2010` (float): Foreign-born population share in 2010 (0-1 scale)
- `mail_return_rate2010` (float): Census mail return rate (data quality indicator, 0-1 scale)
- `HOLC_grade` (string): Historical redlining grade (A/B/C/D or null)
  - A = "Best" (green on historical maps)
  - B = "Still Desirable" (blue)
  - C = "Definitely Declining" (yellow)
  - D = "Hazardous" (red) - areas denied mortgage access

---

## 2. housing_prices_by_states.csv

**Source:** Zillow Home Value Index (ZHVI)  
**Description:** Monthly median home values by state from January 2000 to October 2025.

### Fields:

- `RegionID` (integer): Zillow's unique region identifier
- `SizeRank` (integer): Ranking by market size (1 = largest housing market)
- `RegionName` (string): State name
- `RegionType` (string): Type of region (always "State" in this dataset)
- `StateName` (string): Full state name
- `YYYY-MM-DD` (float): Monthly median home value in USD
  - Example: `2024-01-31` = Median home value on January 31, 2024
  - 310 monthly columns from `2000-01-31` to `2025-10-31`

**Value Range:** Varies by state and time period (typically $100,000 - $800,000+)

**Usage in Project:**
- Calculating housing affordability by comparing to median income
- Analyzing housing cost trends over time
- Comparing housing costs across states
- Understanding how housing affects economic mobility

**Note:** Includes all 50 states plus District of Columbia (51 total regions)

---

## 3. state_income_2024.csv

**Source:** Bureau of Economic Analysis (BEA)  
**Description:** State-level annual personal income summary for 2024.

### Fields:

**Note:** This CSV has a complex header structure from BEA. The actual data columns are:
- Column 1: State/Region name (string)
- Column 2: Personal income (thousands of dollars)
- Column 3: Population (persons)
- Column 4: Per capita personal income (dollars)

**Data Structure:**
- Row 1: File description "SAINC1 State annual personal income summary..."
- Row 2: Data type descriptions
- Row 3: Unit descriptions  
- Row 4+: Actual state data

**Example Data:**
```
United States,23045613,334914895,68791
Alabama,256034,5074296,50453
Alaska,38954,733406,53124
...
```

**Usage in Project:**
- Baseline income comparisons between states
- State-level economic context
- Per capita income calculations
- Normalizing mobility metrics by economic base

---

## 4. mobility_baseline.csv

**Source:** Opportunity Atlas aggregated data  
**Description:** Baseline mobility metrics by birth cohort.

### Fields:

- `cohort` (string): Birth year cohort (e.g., "1978-1983")
- `mobility_p50` (float): Median mobility rate for the cohort (0-1 scale)
  - 0.50 means 50% of children earned more than their parents
  - Used to show trends over time

**Example Data:**
```
cohort,mobility_p50
1940,0.92
1950,0.79
1960,0.62
1970,0.61
1980,0.50
```

**Usage in Project:**
- Baseline comparisons for predictions in mountain visualization
- Historical mobility trends showing "Fading American Dream"
- Cohort-specific adjustments in mobility calculations

---

## 5. state_label_positions.csv

**Source:** Custom (manually curated for optimal map visualization)  
**Description:** Optimal label positions for state names on map visualizations to avoid overlaps.

### Fields:

- `state_id` (integer): Numerical state identifier (1-51)
- `state_abbr` (string): Two-letter state abbreviation (e.g., "CA", "TX")
- `state_name` (string): Full state name (e.g., "California", "Texas")
- `label_x` (float): X-coordinate for label placement (map projection coordinates)
- `label_y` (float): Y-coordinate for label placement (map projection coordinates)

**Coordinate System:** 
- Uses D3.js geoAlbersUsa() projection coordinates
- X and Y are in projected pixel space, not latitude/longitude

**Usage in Project:**
- D3.js map label positioning
- Avoiding label overlaps on choropleth maps
- Optimal text placement on geographic visualizations

**Example:**
```
state_id,state_abbr,state_name,label_x,label_y
1,AL,Alabama,780,390
2,AK,Alaska,220,480
...
```

---

## 6. us_cities_coordinates.csv

**Source:** US Geological Survey (USGS) / US Census Bureau  
**Description:** Geographic coordinates for major US cities (500+ cities included).

### Fields:

- `city` (string): City name (e.g., "Boston", "Los Angeles")
- `state_id` (string): State abbreviation (e.g., "MA", "CA")
- `state` (string): Full state name (e.g., "Massachusetts", "California")
- `lat` (float): Latitude in decimal degrees
- `lng` (float): Longitude in decimal degrees

**Coordinate Range:**
- Latitude: approximately 25°N to 49°N (continental US)
- Longitude: approximately -125°W to -66°W (continental US)
- Hawaii: ~19-22°N, ~-160 to -155°W
- Alaska: ~55-71°N, ~-180 to -130°W

**Coordinate System:** WGS84 (EPSG:4326)

**Usage in Project:**
- City marker placement on maps
- Geographic context for mobility data
- Distance calculations between locations
- Allowing users to search by city

**Example:**
```
city,state_id,state,lat,lng
Boston,MA,Massachusetts,42.3601,-71.0589
Cambridge,MA,Massachusetts,42.3736,-71.1097
Los Angeles,CA,California,34.0522,-118.2437
```

---

## Data Processing Notes

### Missing Values
- Missing values in atlas.csv may appear as empty strings, "NA", or blank cells
- Small sample sizes may result in suppressed data (shown as blank) to protect privacy
- Mobility metrics are only calculated where sufficient data exists (typically >20 observations)

### Data Quality Indicators
- `mail_return_rate2010`: Higher values (closer to 1.0) indicate better Census response rates and higher data quality
- Tracts with <20 children in target population may have suppressed mobility data
- Check for null/missing values when performing analyses

### Geographic Levels
The project primarily uses **Census Tract** level data:
- **Census Tract**: Small, relatively permanent geographic subdivisions (1,200-8,000 people)
- Provides granular neighborhood-level analysis
- Approximately 73,000 tracts in the United States
- Tracts are nested within counties and states

### Time Periods
- Mobility data reflects children born **1978-1983** and their adult outcomes measured around **2014-2015**
- Housing and demographic data span **1990-2016**
- This represents outcomes for children who grew up in the 1980s-1990s

### Privacy & Ethical Considerations
- All data is aggregated at tract level (no individual records)
- Small cell sizes are suppressed to protect privacy
- Data represents historical outcomes, not predictions for individuals
- Racial categories follow Census Bureau definitions

---

## 🔍 Common Data Questions

### Q: Why 51 states instead of 50?
**A:** The dataset includes all 50 US states plus the **District of Columbia**, which is treated as a state-equivalent region for analysis purposes.

### Q: What does "p25" mean in the mobility metrics?
**A:** "p25" refers to the 25th percentile of parent income. The mobility metrics show where children from families at the 25th percentile of income (lower-income families) end up as adults.

### Q: How is mobility calculated?
**A:** Mobility is measured by linking children to their parents using tax records, then comparing parent income rank (when child was growing up) to child's adult income rank (measured around age 30-35).

### Q: Are there data limitations?
**A:** Yes:
- Data reflects children born 1978-1983 only
- Does not capture recent changes (2015+)
- Some tracts have suppressed data due to small sample sizes
- Mobility metrics are correlational, not causal

---

## Additional Resources

### Data Sources & Documentation:
1. **Opportunity Atlas**
   - Website: https://opportunityatlas.org
   - Data Download: https://opportunityinsights.org/data/
   - Codebook: https://opportunityinsights.org/wp-content/uploads/2018/10/atlas_paper.pdf
   - Paper: Chetty et al. (2018) "The Opportunity Atlas: Mapping the Childhood Roots of Social Mobility"

2. **Zillow Housing Data**
   - Website: https://www.zillow.com/research/data/
   - Dataset: ZHVI (Zillow Home Value Index)
   - Documentation: https://www.zillow.com/research/zhvi-methodology-2019-deep-26226/

3. **Bureau of Economic Analysis**
   - Website: https://www.bea.gov/
   - Dataset: State Annual Personal Income (SAINC1)
   - API: https://apps.bea.gov/api/

### Citations:
```
Chetty, Raj, John N. Friedman, Nathaniel Hendren, Maggie R. Jones, and Sonya R. Porter. 
"The Opportunity Atlas: Mapping the Childhood Roots of Social Mobility." 
NBER Working Paper No. 25147, October 2018.
DOI: 10.3386/w25147

Zillow Research. "Zillow Home Value Index (ZHVI)." 
Retrieved from https://www.zillow.com/research/data/
```

---

**Last Updated:** December 2024 5
**Project:** Economic Mobility Explorer  
**Course:** CS171 - Data Visualization, Harvard University