const width = window.innerWidth, height = window.innerHeight*0.9;

function formatNumber(num) {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(2) + "Bt"; // Billions
  } else if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(2) + " Mt"; // Millions
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(2) + " Kt"; // Thousands
  } else {
    return num.toFixed(2) + "t"; // Less than a thousand
  }
}

const svg = d3.select("#choropleth-map")
  .attr("width", width) // Full width to fit both maps side by side
  .attr("height", height);

let mapWidth = width / 2; // Each map takes half the width
let xOffset = 0; // Horizontal offset for maps

// Projections
const projections = {
  Mercator: d3.geoMercator().scale(110).translate([mapWidth / 2, 350]),
  EqualEarth: d3.geoEqualEarth().scale(130).translate([mapWidth/2 - 50, 200])
};
    

    // Color scale
    // const colorScale = d3.scaleThreshold()
    //   .domain([1000000, 10000000, 50000000, 100000000, 500000000])
    //   .range(["#ffffff", "#ffe5e5", "#ff9999", "#ff4d4d", "#800000"]);


    //const tooltip = d3.select(".tooltip");
    // https://geojson-maps.kyd.au/
    // Tooltip
    const tooltip_map = d3.select("#tooltip_map");

    // Load data: GeoJSON and emissions CSV
    Promise.all([
      d3.json("./dataset/world.geo.json"), // Replace with your GeoJSON file path
      d3.csv("./dataset/country_total_emissions_2022.csv")
    ]).then(([geojson, csvData]) => {
      // Parse CSV data
      const emissions = {};
      csvData.forEach(d => {
        emissions[d.Entity] = +d.Total_CO2_emissions;
      });

      geojson.features.forEach(feature => {
        const countryName = feature.properties.name; // GeoJSON country name
        feature.properties.emissions = emissions[countryName] || null; // Match and assign emissions
      });

      // Calculate maximum emissions and define color scale
      // const maxEmissions = d3.max(geojson.features, d => d.properties.emissions) || 500000000;
      const maxEmissions = d3.max(geojson.features, d => d.properties.emissions);
      console.log(formatNumber(maxEmissions*0.1))
      console.log(formatNumber(maxEmissions*0.001))
      const colorScale = d3.scaleThreshold()
        .domain([0, maxEmissions * 0.001, maxEmissions * 0.01, maxEmissions * 0.05, maxEmissions * 0.1, maxEmissions])
        .range(["#ffffff", "#ffe5e5", "#ff9999", "#ff4d4d", "#cc0000", "#800000"]);

      
      // const colorScale = d3.scaleThreshold()
      //   .range(["#ffffff", "#ffe5e5", "#ff9999", "#ff4d4d", "#cc0000", "#800000"]) // Gradient from yellow to red
      //   .domain([0, Math.log(maxEmissions)]); // Logarithmic domain for better contrast

      //const path = d3.geoPath().projection(d3.geoMercator().scale(200).translate([width / 2, height / 2]));
      

      // Draw two maps (Mercator and Equal Earth)
      let xOffset = 0;
  Object.entries(projections).forEach(([name, projection]) => {
    const path = d3.geoPath().projection(projection);

     // Create a group for each map
  const group = svg.append("g")
        .attr("transform", `translate(${xOffset}, 0)`); // Offset for side-by-side maps
    xOffset += mapWidth;

    group.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const emission = d.properties.emissions;
      return emission ? colorScale(emission) : "#ccc";
    })
    .attr("stroke", "#333")
    .on("mouseover", function (event, d) {
      console.log("Mouseover on:", d.properties.name); // Debugging line
      const country = d.properties.name;
      const emission = d.properties.emissions;
  
      // Highlight the hovered country
      d3.select(this).style("opacity", 1).style("stroke-width", "2px");
  
      // Dim all other countries
      group.selectAll("path")
        .filter(pathData => pathData !== d)
        .style("opacity", 0.3);
  
      // Show the tooltip
      tooltip_map.transition().duration(200).style("opacity", 0.9);
      tooltip_map
        .html(`<b>Country:</b> ${country}<br><b>Total Emissions:</b> ${emission ? formatNumber(emission) : "No data"}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mousemove", function (event) {
      tooltip_map
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function () {
      // Reset opacity for all countries
      group.selectAll("path")
        .style("opacity", 1)
        .style("stroke-width", "1px");
  
      // Hide the tooltip_map
      tooltip_map.transition().duration(200).style("opacity", 0);
    });

    // Add the updated legend
  const legend = svg.append("g").attr("transform", `translate(${width - 600}, ${height - 200})`);
  const legendSections = colorScale.domain();

  // const legend = svg.append("g").attr("transform", `translate(${width - 200}, ${height - 150})`);
  // const legendScale = d3.scaleLinear()
  //   .domain([0, 500000000])
  //   .range([0, 150]);

  // legend.selectAll("rect")
  //   .data(colorScale.range().map((color, i) => {
  //     const domain = colorScale.domain();
  //     return [domain[i - 1] || 0, domain[i] || 500000000];
  //   }))
  //   .enter()
  //   .append("rect")
  //   .attr("x", d => legendScale(d[0]))
  //   .attr("y", 0)
  //   .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
  //   .attr("height", 10)
  //   .attr("fill", (d, i) => colorScale(d[0]));

  // legend.append("text").text("Legend (CO₂)").attr("x", 0).attr("y", -10);

    // Add enhanced legend
  //const legend = svg.append("g").attr("transform", `translate(${width - 220}, ${height - 150})`);

  // Create discrete ranges for the legend, using log-transformed values
  const legendValues = [0, maxEmissions * 0.001, maxEmissions * 0.01, maxEmissions * 0.05, maxEmissions * 0.1, maxEmissions]; // Adjust ranges as needed

  legend.selectAll("rect")
    .data(legendValues)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * 60)
    .attr("y", 0)
    .attr("width", 60)
    .attr("height", 20)
    .attr("fill", (d, i) => colorScale(d));


  legend.selectAll("text")
    .data(legendValues)
    .enter()
    .append("text")
    .attr("x", (d, i) => i == legendValues.length - 1 ? i * 60 + 60 : i * 60)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .text(d => formatNumber(d) + "t");

  legend.append("text")
    .text("Total Emissions [tons of CO₂]")
    .attr("x", 0)
    .attr("y", -10)
    .style("font-size", "12px")
    .style("font-weight", "bold");
}).catch(err => console.error("Error loading data:", err));

    // // Add projection title
    // group.append("text")
    //   .attr("x", width / 4)
    //   .attr("y", 30)
    //   .attr("text-anchor", "middle")
    //   .style("font-size", "16px")
    //   .text(name + " Projection");
  });

  // Add legend
