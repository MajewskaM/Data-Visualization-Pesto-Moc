// Set up the chart dimensions and margins
const margin = { top: 40, right: 30, bottom: 40, left: 90 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// Define the Olympic colors mapped to continents
const continentColors = {
  'Europe': '#0085C7',   // Blue
  'Asia': '#F1C72C',     // Yellow
  'Africa': '#3E3A39',   // Black
  'Oceania': '#009639',  // Green
  'North America': '#B22234', // Red for North America
  'South America': '#B22200'  // Red for South America
};

// Default settings
let selectedYear = 2022;
let selectedTop = 5;  // Default to Top 5

// Function to update the chart based on selected year and number of top countries
function updateChart(year, topCount) {
  console.log(`Updating chart for year: ${year} and topCount: ${topCount}`);

  // Clear previous chart content
  svg.selectAll('*').remove();

  // Load the data for the selected year
  d3.csv(`dataset/2/continent_emissions_${year}.csv`).then(function(data) {
    console.log(`Loaded data for ${year}`, data);  // Debug log for loaded data

    // Parse the 'Annual_CO2_emissions_per_capita' values as numbers
    data.forEach(function(d) {
      d.Annual_CO2_emissions_per_capita = +d.Annual_CO2_emissions_per_capita; // Convert to number
      if (isNaN(d.Annual_CO2_emissions_per_capita)) {
        console.error(`Invalid CO2 emissions per capita value for ${d.Entity}: ${d.Annual_CO2_emissions_per_capita}`);
      }
    });

    // Group data by continent using d3.group
    const continentData = Array.from(d3.group(data, d => d.Continent), ([key, values]) => ({
      key: key,
      countries: values
    }));

    // Set up the Y scale (one for each continent)
    const y = d3.scaleBand()
      .domain(continentData.map(d => d.key))
      .range([0, height])
      .padding(0.1);

    // Add the Y-axis
    svg.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y).tickSize(0)) // Remove axis lines
      .selectAll('.tick text')
      .style('font-size', '12px');

    // Process each continent
    continentData.forEach(function(continent) {
      // Sort the countries in each continent by CO2 emissions and select the top N based on the button clicked
      const sortedCountries = continent.countries.sort((a, b) => b.Annual_CO2_emissions_per_capita - a.Annual_CO2_emissions_per_capita);
      const topCountries = sortedCountries.slice(0, topCount);

      // Calculate the "Others" category
      const others = sortedCountries.slice(topCount)
        .reduce((sum, d) => sum + d.Annual_CO2_emissions_per_capita, 0);

      // If "Others" category has emissions, add it as a country
      if (others > 0) {
        topCountries.push({ Entity: 'Others', Annual_CO2_emissions_per_capita: others });
      }

      // Calculate the total emissions for the continent
      const totalEmission = d3.sum(topCountries, d => d.Annual_CO2_emissions_per_capita);

      // Calculate percentage for each country (or "Others")
      topCountries.forEach(d => {
        d.percentage = (d.Annual_CO2_emissions_per_capita / totalEmission) * 100;
      });

      // Create the stacked bar for the continent
      const x = d3.scaleLinear()
        .domain([0, d3.sum(topCountries, d => d.percentage)]) // Use sum of percentages for domain
        .range([0, width]);

      const g = svg.append('g')
        .attr('transform', `translate(0, ${y(continent.key)})`);

      // Create the bars for the top countries and "Others"
      g.selectAll('.segment')
        .data(topCountries)
        .enter().append('rect')
        .attr('class', 'segment')
        .attr('x', d => {
          const previousTotalPercentage = d3.sum(topCountries.slice(0, topCountries.indexOf(d)), d => d.percentage);
          return x(previousTotalPercentage);
        })
        .attr('y', 0)
        .attr('width', d => x(d.percentage)) // Set width based on percentage
        .attr('height', y.bandwidth())
        .style('fill', (d, i) => {
          // Get the appropriate Olympic color for the continent
          const continentColor = continentColors[continent.key] || '#000000'; // Default to black if continent is not found
          return d3.rgb(continentColor).darker(1 + (i * 0.2)); // Darken color for each segment
        })
        .append('title')
        .text(d => `${d.Entity}: ${d.percentage.toFixed(2)}%`);
    });

    // Add the X-axis label (percentage of total CO2 emissions)
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Percentage of Total CO2 Emissions');

    // Add the Y-axis label (continent names)
    svg.append('text')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Continent');
  }).catch(error => {
    console.error(`Failed to load CSV for year ${year}:`, error);
  });
}

// Add event listener for year dropdown menu
document.getElementById('year-select').addEventListener('change', function() {
  selectedYear = this.value;
  updateChart(selectedYear, selectedTop);
});

// Add event listeners for Top N buttons
document.querySelectorAll('.top-country-button').forEach(button => {
  button.addEventListener('click', function() {
    selectedTop = parseInt(this.getAttribute('data-top'));
    updateChart(selectedYear, selectedTop);
  });
});

// Initial chart load
updateChart(selectedYear, selectedTop);
