const width = window.innerWidth, height = window.innerHeight;

    // Create SVG container
    const svg = d3.select("#map-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Projections
    const projections = {
      Mercator: d3.geoMercator().scale(200).translate([width / 2, height / 2]),
      //EqualEarth: d3.geoEqualEarth().scale(200).translate([width / 2, height / 2])
    };

    // Color scale
    const colorScale = d3.scaleThreshold()
      .domain([1000000, 10000000, 50000000, 100000000, 500000000])
      .range(["#ffffff", "#ffe5e5", "#ff9999", "#ff4d4d", "#800000"]);


    const tooltip = d3.select(".tooltip");
    // https://geojson-maps.kyd.au/


    // Load data: GeoJSON and emissions CSV
    Promise.all([
      d3.json("./dataset/world_2.geo.json"), // Replace with your GeoJSON file path
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

      // Draw two maps (Mercator and Equal Earth)
      let xOffset = 0;
  Object.entries(projections).forEach(([name, projection]) => {
    const path = d3.geoPath().projection(projection);

    const group = svg.append("g").attr("transform", `translate(${xOffset}, 0)`);
    xOffset += width / 2;

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

    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip
      .html(`<b>Country:</b> ${country}<br><b>Emissions:</b> ${emission ? emission.toLocaleString() : "No data"}`)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 20) + "px");
  })
  .on("mousemove", function (event) {
    tooltip
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 20) + "px");
  })
  .on("mouseout", function () {
    tooltip.transition().duration(200).style("opacity", 0);
  });


    // Add projection title
    group.append("text")
      .attr("x", width / 4)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(name + " Projection");
  });

  // Add legend
  const legend = svg.append("g").attr("transform", `translate(${width - 200}, ${height - 150})`);
  const legendScale = d3.scaleLinear()
    .domain([0, 500000000])
    .range([0, 150]);

  legend.selectAll("rect")
    .data(colorScale.range().map((color, i) => {
      const domain = colorScale.domain();
      return [domain[i - 1] || 0, domain[i] || 500000000];
    }))
    .enter()
    .append("rect")
    .attr("x", d => legendScale(d[0]))
    .attr("y", 0)
    .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
    .attr("height", 10)
    .attr("fill", (d, i) => colorScale(d[0]));

  legend.append("text").text("Legend (CO₂)").attr("x", 0).attr("y", -10);
}).catch(err => console.error("Error loading data:", err));