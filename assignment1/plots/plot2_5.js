const margin5 = { top: 40, right: 30, bottom: 40, left: 90 };
const width5 = 800 - margin5.left - margin5.right;
const height5 = 500 - margin5.top - margin5.bottom;

const svg6 = d3.select('#perc') 
  .attr('width', width5 + margin5.left + margin5.right)
  .attr('height', height5 + margin5.top + margin5.bottom)
  .append('g')
  .attr('transform', `translate(${margin5.left},${margin5.top})`);

const continentColors = {
  'Europe': '#0085C7',   
  'Asia': '#F1C72C',
  'Africa': '#BBBBBB',   
  'Oceania': '#009639',  
  'North America': '#B22234', 
  'South America': '#B22200'  
};

let selectedYear = 2022;
let selectedTop = 5;  

const tooltip6 = d3.select('body').append('div')
  .attr('class', 'tooltip6');

function updateChart(year, topCount) {
  console.log(`Updating chart for year: ${year} and topCount: ${topCount}`);

  svg6.selectAll('*').remove();

  d3.csv(`dataset/1_2/continent_emissions_${year}.csv`).then(function(data) {
    console.log(`Loaded data for ${year}`, data);  

    data.forEach(function(d) {
      d.Annual_CO2_emissions_per_capita = +d.Annual_CO2_emissions_per_capita; 
      if (isNaN(d.Annual_CO2_emissions_per_capita)) {
        console.error(`Invalid CO2 emissions per capita value for ${d.Entity}: ${d.Annual_CO2_emissions_per_capita}`);
      }
    });

    const continentData = Array.from(d3.group(data, d => d.Continent), ([key, values]) => ({
      key: key,
      countries: values
    }));

    const y = d3.scaleBand()
      .domain(continentData.map(d => d.key))
      .range([0, height5])
      .padding(0.1);

    svg6.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y).tickSize(0)) 
      .selectAll('.tick text')
      .style('font-size', '12px');

    continentData.forEach(function(continent) {
      const sortedCountries = continent.countries.sort((a, b) => b.Annual_CO2_emissions_per_capita - a.Annual_CO2_emissions_per_capita);
      const topCountries = sortedCountries.slice(0, topCount);

      const others = sortedCountries.slice(topCount)
        .reduce((sum, d) => sum + d.Annual_CO2_emissions_per_capita, 0);

      if (others > 0) {
        topCountries.push({ Entity: 'Others', Annual_CO2_emissions_per_capita: others });
      }

      const totalEmission = d3.sum(topCountries, d => d.Annual_CO2_emissions_per_capita);

      topCountries.forEach(d => {
        d.percentage = (d.Annual_CO2_emissions_per_capita / totalEmission) * 100;
      });

      const x = d3.scaleLinear()
        .domain([0, d3.sum(topCountries, d => d.percentage)]) 
        .range([0, width5]);

      const g = svg6.append('g')
        .attr('transform', `translate(0, ${y(continent.key)})`);

      g.selectAll('.segment')
        .data(topCountries)
        .enter().append('rect')
        .attr('class', 'segment')
        .attr('x', d => {
          const previousTotalPercentage = d3.sum(topCountries.slice(0, topCountries.indexOf(d)), d => d.percentage);
          return x(previousTotalPercentage);
        })
        .attr('y', 0)
        .attr('width', d => x(d.percentage)) 
        .attr('height', y.bandwidth())
        .style('fill', (d, i) => {
          const continentColor = continentColors[continent.key] || '#000000'; 

          let color = d3.hsl(continentColor);
          
          const saturationAdjustment = 0.8 - (i * 0.1); 
          const lightnessAdjustment = 0.6 + (i * 0.05); 

          color.s = Math.max(0.4, saturationAdjustment); 
          color.l = Math.min(0.9, lightnessAdjustment); 

          return color.toString(); 
        })
        .on('mouseover', function(event, d) {
          tooltip6.transition().duration(200).style('opacity', 1);
          tooltip6.html(
            `<strong>Country:</strong> ${d.Entity}<br>
             <strong>Emissions per Capita:</strong> ${d.Annual_CO2_emissions_per_capita.toFixed(2)} billion tons<br>
             <strong>Percentage of Total:</strong> ${d.percentage.toFixed(2)}%`
          )
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 25) + 'px');
        })
        .on('mouseout', function() {
          tooltip6.transition().duration(200).style('opacity', 0);
        })
        .append('title')
        .text(d => `${d.Entity}: ${d.percentage.toFixed(2)}%`);  
    });

    svg6.append('text')
      .attr('x', width5 / 2)
      .attr('y', height5 + margin5.bottom - 10)
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Percentage of Total CO2 Emissions (Billion t)');

    svg6.append('text')
      .attr('x', -height5 / 2)
      .attr('y', -margin5.left + 15)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr('class', 'axis-label')
      .text('Continent');

    svg6.append('text')
      .attr('x', width5 / 2)
      .attr('y', -margin5.top / 2)
      .attr("text-anchor", "middle")
      .attr('class', 'chart-title')
      .attr("font-size", "20px")
      .style("font-weight", "bold")
      .text('CO₂ EMISSIONS BY CONTINENT AND COUNTRY (Percentage)');
  }).catch(error => {
    console.error(`Failed to load CSV for year ${year}:`, error);
  });
}

document.getElementById('year-select2_5').addEventListener('change', function() {
  selectedYear = this.value;
  updateChart(selectedYear, selectedTop);
});

document.getElementById('top-country-select').addEventListener('change', function() {
  selectedTop = parseInt(this.value);
  updateChart(selectedYear, selectedTop);
});

updateChart(selectedYear, selectedTop);
