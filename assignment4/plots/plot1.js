const width = window.innerWidth, height = window.innerHeight*0.9;

function formatNumber(num) {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(2) + "Bt";
  } else if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(2) + " Mt";
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(2) + " Kt";
  } else {
    return num.toFixed(2) + "t"; 
  }
}

const svg = d3.select("#choropleth-map")
  .attr("width", width) 
  .attr("height", height);

let mapWidth = width / 2;
let xOffset = 0; 

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
      d3.json("./dataset/world.geo.json"), 
      d3.csv("./dataset/country_total_emissions_2022.csv")
    ]).then(([geojson, csvData]) => {
      const emissions = {};
      csvData.forEach(d => {
        emissions[d.Entity] = +d.Total_CO2_emissions;
      });

      geojson.features.forEach(feature => {
        const countryName = feature.properties.name; 
        feature.properties.emissions = emissions[countryName];
      });

  
      const maxEmissions = d3.max(geojson.features, d => d.properties.emissions);
      console.log(formatNumber(maxEmissions*0.1))
      console.log(formatNumber(maxEmissions*0.001))
      const colorScale = d3.scaleThreshold()
        .domain([0, maxEmissions * 0.001, maxEmissions * 0.01, maxEmissions * 0.05, maxEmissions * 0.1, maxEmissions])
        .range(["#ffffff", "#ffe5e5", "#ff9999", "#ff4d4d", "#cc0000", "#800000"]);

   
      let xOffset = 0;
  Object.entries(projections).forEach(([name, projection]) => {
    const path = d3.geoPath().projection(projection);

  const group = svg.append("g")
        .attr("transform", `translate(${xOffset}, 0)`);
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
      console.log("Mouseover on:", d.properties.name); 
      const country = d.properties.name;
      const emission = d.properties.emissions;
  
      d3.select(this).style("opacity", 1).style("stroke-width", "2px");
  
      group.selectAll("path")
        .filter(pathData => pathData !== d)
        .style("opacity", 0.3);
  
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

      group.selectAll("path")
        .style("opacity", 1)
        .style("stroke-width", "1px");
  

      tooltip_map.transition().duration(200).style("opacity", 0);
    });


  const legend = svg.append("g").attr("transform", `translate(${width - 600}, ${height - 200})`);
  const legendSections = colorScale.domain();

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


  });

