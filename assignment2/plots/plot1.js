document.addEventListener("DOMContentLoaded", () => {
  const svg = d3.select("#alluvial-plot");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  const fossilColor = "#ff4d4d";
  const landColor = "#4daf4a";

  d3.csv("./dataset/continent_emissions_top5_2022.csv").then(data => {
    // Group by continent and sort each continent's countries by emissions
    const continentGroups = d3.group(data, d => d["Continent"]);
    const formattedData = Array.from(continentGroups, ([continent, countries]) => {
      return countries.sort((a, b) => 
        (+b["Annual_CO2_emissions"] + +b["Annual CO₂ emissions from land-use change"]) - 
        (+a["Annual_CO2_emissions"] + +a["Annual CO₂ emissions from land-use change"])
      ).slice(0, 3).map(d => ({
        continent,
        country: d["Entity"],
        fossil: +d["Annual_CO2_emissions"],
        land: +d["Annual CO₂ emissions from land-use change"]
      }));
    }).flat();

    // Initialize Sankey layout
    const sankey = d3.sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .size([width, height])
      .nodeAlign(d3.sankeyCenter);

    const graph = { nodes: [], links: [] };
    const continentNodes = new Set();
    const countryNodes = new Set();

    // Add links and collect nodes for each continent and country
    formattedData.forEach(d => {
      continentNodes.add(d.continent);
      countryNodes.add(d.country);

      graph.links.push({
        source: d.continent,
        target: d.country,
        value: (d.fossil + d.land),
        color: colorScale(d.continent),
        fossil: d.fossil,
        land: d.land
      });
    });

    // Add continent and country nodes to the graph
    continentNodes.forEach(continent => graph.nodes.push({ name: continent }));
    countryNodes.forEach(country => graph.nodes.push({ name: country }));

    // Define world total nodes for fossil and land
    const fossilTotalNode = "World Total - Fossil";
    const landTotalNode = "World Total - Land";
    graph.nodes.push({ name: fossilTotalNode });
    graph.nodes.push({ name: landTotalNode });

    // Add links from countries to world total nodes for fossil and land
    formattedData.forEach(d => {
      graph.links.push({
        source: d.country,
        target: fossilTotalNode,
        value: d.fossil,
        type: "fossil" 
      });
      graph.links.push({
        source: d.country,
        target: landTotalNode,
        value: d.land,
        type: "land"
      });
    });

    // Map link sources and targets to node indices, with validation
    graph.links.forEach(link => {
      link.source = graph.nodes.findIndex(node => node.name === link.source);
      link.target = graph.nodes.findIndex(node => node.name === link.target);

      // Skip invalid links
      if (link.source === -1 || link.target === -1) {
        console.warn("Invalid link with missing node:", link);
        link.invalid = true;  // Mark invalid links to skip in the rendering step
      }
    });

    // Remove invalid links
    graph.links = graph.links.filter(link => !link.invalid);

    // Apply the Sankey layout to the graph
    sankey(graph);

    // Draw links
    const links = svg.append("g")
      .selectAll("path")
      .data(graph.links)
      .enter().append("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke", d => {
        if (d.type === "fossil") return fossilColor;
        if (d.type === "land") return landColor;
        return d.color;
      })
      .attr("stroke-opacity", 0.6)
      .attr("fill", "none");

    // Draw nodes
    const nodes = svg.append("g")
      .selectAll("rect")
      .data(graph.nodes)
      .enter().append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", d => {
        if (d.name === fossilTotalNode) return fossilColor;
        if (d.name === landTotalNode) return landColor;
        return colorScale(d.name.split("_")[0]);
      })
      .attr("stroke", "#333");

    // Add labels for nodes
    svg.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .enter().append("text")
      .attr("x", d => {
        if (d.name === "World Total - Fossil" || d.name === "World Total - Land") {
          return d.x0 - 35; 
        }
        return d.x1 + 30;
      })
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", 4)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => d.name)
      .attr("fill", "#000");

    // Tooltip for displaying link information
    const tooltip_alluvial = d3.select("#tooltip_alluvial");

    links.on("mouseover", (event, d) => {

      links.attr("stroke-opacity", 0.2);
      nodes.attr("opacity", 0.2);

      // Highlight hovered link
      d3.select(event.target).attr("stroke-opacity", 1);
      tooltip_alluvial.transition().duration(200).style("opacity", .9);
      // Safely access source and target names
      let sourceCountry = graph.nodes[d.source]?.name || "Unknown";
      let targetCountry = graph.nodes[d.target]?.name || "Unknown";

      let emissionsType = d.type ? d.type : 'total';
      let fossilValue = d.fossil;
      let landValue = d.land;
      let totalValue = fossilValue + landValue;

      // Display tooltip
      tooltip_alluvial.style("opacity", 1)
        .html(`
          <strong>${sourceCountry} → ${targetCountry}</strong><br>
          Total Emissions: ${totalValue.toFixed(2)} tons<br>
          Fossil Emissions: ${fossilValue.toFixed(2)} tons<br>
          Land Emissions: ${landValue.toFixed(2)} tons
        `);

      tooltip_alluvial.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    });

    links.on("mousemove", (event) => {
      tooltip_alluvial.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");

    links.on("mouseout", function() {
      // Reset link and node opacity
      links.attr("stroke-opacity", 0.6);
      nodes.attr("opacity", 1);
      tooltip_alluvial.transition().duration(200).style("opacity", 0);
    });
  });
});
});
