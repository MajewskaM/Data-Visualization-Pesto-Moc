const margin1 = { top: 100, right: 50, bottom: 50, left: 50 };
const width1 = window.innerWidth - 220 - margin1.left - margin1.right;
const height1 = window.innerHeight + 100 - margin1.top - margin1.bottom;

document.addEventListener("DOMContentLoaded", () => {
  const svg = d3.select("#alluvial-plot")
    .attr("width", width1 + margin1.left + margin1.right)
    .attr("height", height1 + margin1.top + margin1.bottom);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  const fossilColor = "#ff4d4d";  // Color for fossil emissions
  const landColor = "#4daf4a";   // Color for land emissions
  const continentColorMap = {
    "Africa": "#FF6347",
    "Asia": "#20B2AA",
    "Europe": "#1E90FF",
    "North America": "#FFD700",
    "Oceania": "#8A2BE2",
    "South America": "#FF4500"
  };

  // Load the dataset
  d3.csv("./dataset/continent_emissions_top5_2022.csv").then(data => {
    let continentGroups = d3.group(data, d => d["Continent"]);

    const processData = (selectedContinents) => {
      const formattedData = Array.from(continentGroups, ([continent, countries]) => {
        if (!selectedContinents.has(continent)) return [];

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

      return formattedData;
    };

    let selectedContinents = new Set(["Asia", "Europe", "Africa", "North America", "South America", "Oceania"]);

    const drawSankey = (formattedData) => {
      const sankey = d3.sankey()
        .nodeWidth(40)
        .nodePadding(15)
        .size([width1, height1])
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
          color: continentColorMap[d.continent] || colorScale(d.continent),
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

      continentNodes.forEach(continent => {
        const fossilContinentTotal = `${continent} Total - Fossil`;
        const landContinentTotal = `${continent} Total - Land`;
        graph.nodes.push({ name: fossilContinentTotal });
        graph.nodes.push({ name: landContinentTotal });

        graph.links.push({
          source: fossilContinentTotal,
          target: fossilTotalNode,
          value: d3.sum(formattedData.filter(d => d.continent === continent), d => d.fossil),
          type: "fossil"
        });

        graph.links.push({
          source: landContinentTotal,
          target: landTotalNode,
          value: d3.sum(formattedData.filter(d => d.continent === continent), d => d.land),
          type: "land"
        });
      });

      formattedData.forEach(d => {
        const fossilContinentTotal = `${d.continent} Total - Fossil`;
        const landContinentTotal = `${d.continent} Total - Land`;

        graph.links.push({
          source: d.country,
          target: fossilContinentTotal,
          value: d.fossil,
          type: "fossil"
        });

        graph.links.push({
          source: d.country,
          target: landContinentTotal,
          value: d.land,
          type: "land"
        });
      });

      graph.links.forEach(link => {
        link.source = graph.nodes.findIndex(node => node.name === link.source);
        link.target = graph.nodes.findIndex(node => node.name === link.target);

        if (link.source === -1 || link.target === -1) {
          console.warn("Invalid link with missing node:", link);
          link.invalid = true;
        }
      });

      graph.links = graph.links.filter(link => !link.invalid);

      sankey(graph);

      svg.selectAll("*").remove();

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
        .attr("fill", "none")
        .style("transition", "stroke-opacity 0.3s");

      const nodes = svg.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .enter().append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => {
          if (d.name.includes("Total - Fossil")) return fossilColor;
          if (d.name.includes("Total - Land")) return landColor;
          return continentColorMap[d.name] || d3.schemeCategory10[0];
        })
        .attr("stroke", "#333")
        .style("transition", "opacity 0.3s");

      svg.append("g")
        .selectAll("text")
        .data(graph.nodes)
        .enter().append("text")
        .attr("x", d => d.name.includes("World Total") ? d.x0 - 35 : d.x1 + 10)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", 4)
        .style("text-anchor", "left")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#000")
        .text(d => d.name);

      const tooltip_alluvial = d3.select("#tooltip_alluvial");

      nodes.on("mouseover", (event, d) => {
        links.attr("stroke-opacity", 0.2);
        nodes.attr("opacity", 0.2);

        d3.select(event.target).attr("opacity", 1);
        tooltip_alluvial.transition().duration(200).style("opacity", 1);

        let fossilValue = 0;
        let landValue = 0;
        let totalValue = 0;

        if (d.name.includes("Total - Fossil") || d.name.includes("Total - Land")) {
          const continent = d.name.split(" ")[0];
          fossilValue = d3.sum(formattedData.filter(f => f.continent === continent), f => f.fossil);
          landValue = d3.sum(formattedData.filter(f => f.continent === continent), f => f.land);
          totalValue = fossilValue + landValue;
        } else {
          const countryData = formattedData.find(f => f.country === d.name);
          if (countryData) {
            fossilValue = countryData.fossil;
            landValue = countryData.land;
            totalValue = fossilValue + landValue;
          }
        }

        tooltip_alluvial.html(`
            <strong>${d.name}</strong><br>
            Total Emissions: ${totalValue.toFixed(2)} tons<br>
            Fossil Emissions: ${fossilValue.toFixed(2)} tons<br>
            Land Emissions: ${landValue.toFixed(2)} tons
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      });

      nodes.on("mousemove", (event) => {
        tooltip_alluvial.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      });

      nodes.on("mouseout", () => {
        links.attr("stroke-opacity", 0.6);
        nodes.attr("opacity", 1);
        tooltip_alluvial.transition().duration(200).style("opacity", 0);
      });
    };

    drawSankey(processData(selectedContinents));

    document.querySelectorAll("#controls input[type='checkbox']").forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedContinents.add(checkbox.value);
        } else {
          selectedContinents.delete(checkbox.value);
        }

        drawSankey(processData(selectedContinents));
      });
    });
  });
});
