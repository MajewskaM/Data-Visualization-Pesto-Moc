document.addEventListener("DOMContentLoaded", () => {
  const svg = d3.select("#alluvial-plot");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  const fossilColor = "#ff4d4d"; // Red for fossil emissions
  const landColor = "#4daf4a";   // Green for land-use emissions

  d3.csv("./dataset/continent_emissions_top5_2022.csv").then(data => {
    // Parse and filter data: top 3 countries by emission for each continent
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

    const sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, height]);

    const graph = { nodes: [], links: [] };
    const continentNodes = new Set();
    const countryNodes = new Set();

    formattedData.forEach(d => {
      continentNodes.add(d.continent);
      countryNodes.add(d.country);

      // Add link from continent to country with continent-specific color
      graph.links.push({
        source: d.continent,
        target: d.country,
        value: (d.fossil + d.land) / 2,
        color: colorScale(d.continent) // Assign color based on continent
      });
    });

    continentNodes.forEach(continent => graph.nodes.push({ name: continent }));
    countryNodes.forEach(country => graph.nodes.push({ name: country }));

    // Add two separate "World Total" nodes for fossil and land emissions
    const fossilTotalNode = "World Total - Fossil";
    const landTotalNode = "World Total - Land";
    graph.nodes.push({ name: fossilTotalNode });
    graph.nodes.push({ name: landTotalNode });

    // Create separate links for fossil and land emissions to respective "World Total" nodes
    formattedData.forEach(d => {
      graph.links.push({
        source: d.country,
        target: fossilTotalNode,
        value: d.fossil,
        type: "fossil"  // Indicate this link is for fossil emissions
      });
      graph.links.push({
        source: d.country,
        target: landTotalNode,
        value: d.land,
        type: "land"    // Indicate this link is for land emissions
      });
    });

    // Assign node indices
    graph.nodes = Array.from(new Set(graph.nodes.map(d => d.name))).map(name => ({ name }));
    graph.links.forEach(link => {
      link.source = graph.nodes.findIndex(node => node.name === link.source);
      link.target = graph.nodes.findIndex(node => node.name === link.target);
    });

    // Run the sankey generator
    sankey(graph);

    // Draw links with different colors for fossil and land emissions
    svg.append("g")
      .selectAll("path")
      .data(graph.links)
      .enter().append("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke", d => {
        if (d.type === "fossil") return fossilColor;
        if (d.type === "land") return landColor;
        return d.color; // Use continent color for continent-to-country links
      })
      .attr("stroke-opacity", 0.6)
      .attr("fill", "none");

    // Draw nodes with distinct colors
    svg.append("g")
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

    // Add node labels
    svg.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .enter().append("text")
      .attr("x", d => d.x0 - 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("font-family", "Arial")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(d => d.name)
      .filter(d => d.x0 < width / 2)
      .attr("x", d => d.x1 + 6)
      .attr("text-anchor", "start");

  })
});
