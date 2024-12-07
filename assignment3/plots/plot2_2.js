// Adjusted width and height for smaller plot
const width3 = 950;  // Reduced width
const height4 = 900; // Reduced height

function formatNumber(num) {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(2) + " B"; // Billions
  } else if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(2) + " M"; // Millions
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(2) + " K"; // Thousands
  } else {
    return num.toFixed(2); // Less than a thousand
  }
}

const svg4 = d3.select("#choropleth-map-4")
  .attr("width", width3)
  .attr("height", height4);

// Projections
const projections4 = {
  Orthographic: d3.geoOrthographic().scale(150).translate([width3 / 2, height4 / 2]) // Reduced scale for smaller size
};

const tooltip_map4 = d3.select("#tooltip_map-3");

// Load data: GeoJSON and emissions CSV
Promise.all([ 
  d3.json("./dataset/world.geo.json"), // GeoJSON file
  d3.csv("./dataset/country_total_emissions_2022.csv") // Emissions CSV
]).then(([geojson, csvData]) => {
  // Parse CSV data to calculate per capita emissions
  const emissions = {};
  const populations = {};  // Store population data

  csvData.forEach(d => {
    // Calculate per capita emissions (divide total emissions by population)
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

  // Calculate maximum per capita emissions and define color scale
  const maxEmissions = d3.max(geojson.features, d => d.properties.perCapitaEmissions);
  console.log(formatNumber(maxEmissions));

  // Adjusted color scale thresholds to match more reasonable per capita emissions
  const colorScale = d3.scaleThreshold()
    .domain([0, 2, 4, 6, 8, 10, 37])  // Adjusted thresholds
    .range(["#ffffff", "#ffcccc", "#ff9999", "#ff6666", "#ff3333", "#800000", "#330000"]); // More distinct color for the highest emissions

  let xOffset = 0;
  Object.entries(projections4).forEach(([name, projection]) => {
    const path = d3.geoPath().projection(projection);

    const group = svg4.append("g").attr("transform", `translate(${xOffset}, 0)`);
    xOffset += width3 / 2;

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
        tooltip_map4.transition().duration(200).style("opacity", 0.9);
        tooltip_map4
          .html(` 
            <b>Country:</b> ${country}<br> 
            <b>Per Capita Emissions:</b> ${emission ? formatNumber(emission) : "No data"}<br> 
            <b>Population:</b> ${population ? formatNumber(population) : "No data"} 
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mousemove", function (event) {
        tooltip_map4
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        // Reset opacity for all countries
        group.selectAll("path")
          .style("opacity", 1)
          .style("stroke-width", "1px");

        // Hide the tooltip after mouseout
        tooltip_map4.transition().duration(200).style("opacity", 0);
      });

    // Add the updated legend
    const legend = svg4.append("g").attr("transform", `translate(${width3 - 350}, ${height4 - 180})`);
    const legendValues = [0, 2, 4, 6, 8, 10, 37];  // Adjusted legend values

    legend.selectAll("rect")
      .data(legendValues)
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * 50)
      .attr("y", 0)
      .attr("width", 50)
      .attr("height", 20)
      .attr("fill", (d, i) => colorScale(d));

    legend.selectAll("text")
      .data(legendValues)
      .enter()
      .append("text")
      .attr("x", (d, i) => i == legendValues.length - 1 ? i * 50 + 50 : i * 50)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text(d => formatNumber(d));

    legend.append("text")
      .text("Legend (Per Capita CO₂ Emissions)")
      .attr("x", 0)
      .attr("y", -10)
      .style("font-size", "12px")
      .style("font-weight", "bold");

    // Add rotation functionality
    let lastX = 0;
    let lastY = 0;
    let isDragging = false;

    svg4.on("mousedown", function(event) {
      isDragging = true;
      lastX = event.pageX;
      lastY = event.pageY;
    })
    .on("mousemove", function(event) {
      if (isDragging) {
        const deltaX = event.pageX - lastX;
        const deltaY = event.pageY - lastY;
        
        // Rotate projection based on mouse movement
        const currentRotation = projection.rotate();
        projection.rotate([currentRotation[0] + deltaX * 0.1, currentRotation[1] - deltaY * 0.1]);

        // Update path with new projection
        group.selectAll("path")
          .attr("d", path);

        lastX = event.pageX;
        lastY = event.pageY;
      }
    })
    .on("mouseup", function() {
      isDragging = false;
    });
  });
}).catch(err => console.error("Error loading data:", err));
