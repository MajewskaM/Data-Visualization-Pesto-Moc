const width2 = window.innerWidth * 0.4, // Smaller width (e.g., 45% of window width)
  height3 = window.innerHeight * 0.75; // Increased height to avoid cutting

const projections3 = {
  Mercator: d3.geoMercator()
    .scale(100)  // Adjust scale to fit the map within the width
    .translate([width2 / 2, height3 / 2])  // Keep the map centered
};

const svg3 = d3.select("#choropleth-map-3")
  .attr("width", width2)
  .attr("height", height3);

// Load data: GeoJSON and emissions CSV
Promise.all([ 
  d3.json("./dataset/world.geo.json"), // GeoJSON file
  d3.csv("./dataset/country_total_emissions_2022.csv") // Emissions CSV
]).then(([geojson, csvData]) => {
  // Parse CSV data to calculate per capita emissions
  const emissions = {};
  const populations = {};  // Store population data

  csvData.forEach(d => {
    if (d.Population && +d.Population > 0) {
      const perCapitaEmissions = +d.Total_CO2_emissions / +d.Population;
      emissions[d.Entity] = perCapitaEmissions;
      populations[d.Entity] = +d.Population;  // Store population
    } else {
      emissions[d.Entity] = null; // No data or invalid population
      populations[d.Entity] = null;
    }
  });

  geojson.features.forEach(feature => {
    const countryName = feature.properties.name; // GeoJSON country name
    feature.properties.perCapitaEmissions = emissions[countryName] || null; // Match and assign per capita emissions
    feature.properties.population = populations[countryName] || null; // Assign population
  });

  // Calculate maximum per capita emissions
  const maxEmissions = d3.max(geojson.features, d => d.properties.perCapitaEmissions);
  console.log(formatNumber(maxEmissions));

  // Define the new color scale with logical thresholds
  const colorScale = d3.scaleThreshold()
    .domain([0, 2, 4, 6, 8, 10, 37])  // Adjusted thresholds
    .range(["#ffffff", "#ffcccc", "#ff9999", "#ff6666", "#ff3333", "#800000", "#330000"]); // Keeping dark red and adding a more distinct color for the highest emissions

  const path = d3.geoPath().projection(d3.geoMercator().scale(160).translate([width2 / 2, height3 / 2]));

  let xOffset = 0;
  Object.entries(projections3).forEach(([name, projection]) => {
    const path = d3.geoPath().projection(projection);

    const group = svg3.append("g").attr("transform", `translate(${xOffset}, 0)`);
    xOffset += width2 / 2;

    group.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const emission = d.properties.perCapitaEmissions;
        return emission ? colorScale(emission) : "#ccc"; // Use per capita emissions for color
      })
      .attr("stroke", "#333")
      .on("mouseover", function (event, d) {
        const country = d.properties.name;
        const emission = d.properties.perCapitaEmissions;
        const population = d.properties.population;

        // Highlight the hovered country
        d3.select(this).style("opacity", 1).style("stroke-width", "2px");

        // Dim all other countries
        group.selectAll("path")
          .filter(pathData => pathData !== d)
          .style("opacity", 0.3);

        // Show the tooltip
        tooltip_map3.transition().duration(200).style("opacity", 0.9);
        tooltip_map3
          .html(` 
            <b>Country:</b> ${country}<br>
            <b>Per Capita Emissions:</b> ${emission ? formatNumber(emission) : "No data"}<br>
            <b>Population:</b> ${population ? formatNumber(population) : "No data"} 
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mousemove", function (event) {
        tooltip_map3
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        // Reset opacity for all countries
        group.selectAll("path")
          .style("opacity", 1)
          .style("stroke-width", "1px");

        // Hide the tooltip after mouseout
        tooltip_map3.transition().duration(200).style("opacity", 0);
      });
  });
}).catch(err => console.error("Error loading data:", err));
