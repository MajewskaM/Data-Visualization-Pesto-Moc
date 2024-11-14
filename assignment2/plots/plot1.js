document.addEventListener("DOMContentLoaded", () => {
  const svg = d3.select("#alluvial-plot");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const continentColorMap = {
    "Africa": "#ff7f0e",
    "Asia": "#f803fc",
    "Europe": "#1f77b4",
    "North America": "#f0fc03",
    "Oceania": "#e377c2",
    "South America": "#7f7f7f"
  };

  const fossilColor = "#ff4d4d";
  const landColor = "#4daf4a";

  d3.csv("./dataset/continent_emissions_top5_2022.csv").then(data => {
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
      .nodeWidth(20)
      .nodePadding(10)
      .size([width, height])
      .nodeAlign(d3.sankeyCenter);

    const graph = { nodes: [], links: [] };
    const continentNodes = new Set();
    const countryNodes = new Set();

    formattedData.forEach(d => {
      continentNodes.add(d.continent);
      countryNodes.add(d.country);

      graph.links.push({
        source: d.continent,
        target: d.country,
        value: (d.fossil + d.land),
        color: continentColorMap[d.continent] || d3.schemeCategory10[0],
        fossil: d.fossil,
        land: d.land
      });
    });

    continentNodes.forEach(continent => graph.nodes.push({ name: continent }));
    countryNodes.forEach(country => graph.nodes.push({ name: country }));

    const fossilTotalNode = "World Total - Fossil";
    const landTotalNode = "World Total - Land";
    graph.nodes.push({ name: fossilTotalNode });
    graph.nodes.push({ name: landTotalNode });

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

    graph.links.forEach(link => {
      link.source = graph.nodes.findIndex(node => node.name === link.source);
      link.target = graph.nodes.findIndex(node => node.name === link.target);
    });

    sankey(graph);

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
        return continentColorMap[d.name] || d3.schemeCategory10[0];
      })
      .attr("stroke", "#333");

    svg.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .enter().append("text")
      .attr("x", d => {
        if (d.name === "Fossil fuels" || d.name === "Land use") {
          return d.x0 - 10;
        }
        return d.x1 + 30;
      })
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", 4) 
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => d.name)
      .attr("fill", "#000");

    const tooltip_alluvial = d3.select("#tooltip_alluvial");

    links.on("mouseover", function(event, d) {
      links.attr("stroke-opacity", 0.2);
      nodes.attr("opacity", 0.2);

      d3.select(this).attr("stroke-opacity", 1);

      let sourceCountry = graph.nodes[d.source].name;
      let targetCountry = graph.nodes[d.target].name;

      let emissionsType = d.type ? d.type : 'total';
      let fossilValue = d.fossil;
      let landValue = d.land;
      let totalValue = fossilValue + landValue;

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

    links.on("mouseout", function() {
      links.attr("stroke-opacity", 0.6);
      nodes.attr("opacity", 1); 

      tooltip_alluvial.style("opacity", 0); 
    });
  });
});
