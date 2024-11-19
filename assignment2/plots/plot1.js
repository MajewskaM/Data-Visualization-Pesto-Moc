const margin1 = { top: 100, right: 10, bottom: 100, left: 50 };

function getPlotDimensions() {
  const width1 = window.innerWidth - margin1.left - margin1.right;
  const height1 = window.innerHeight - margin1.top - margin1.bottom; 
  return { width1, height1 };
}


document.addEventListener("DOMContentLoaded", () => {
    const svg = d3.select("#alluvial-plot");

    const { width1, height1 } = getPlotDimensions();

    svg.attr("width", width1 + margin1.left + margin1.right)
      .attr("height", height1 + margin1.top + margin1.bottom)
      .style("display", "block")
      .style("margin", "0 auto");
  

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const fossilColor = "#d92b9c"; // soft red
    const landColor = "#2a9d8f";   // soft teal

    const continentColorMap = {
      "Africa": "#fc9438",
      "Asia": "#ed3d3b",
      "Europe": "#49a6fc",
      "North America": "#69c972",
      "Oceania": "#bb4dc9",
      "South America": "#7f7f7f"
    };
    

    function updatePlotForYear(year) {
      svg.selectAll("*").remove();

      d3.csv(`./dataset/continent_emissions_top5_${year}.csv`).then(data => {

        // Compute total emissions (fossil + land) for each continent
        const continentTotals = d3.rollup(
            data,
            group => d3.sum(group, d => (+d["Annual_CO2_emissions"] + +d["Annual CO₂ emissions from land-use change"])),
            d => d["Continent"]
        );

        // Sort continents by total emissions in descending order
        const sortedContinents = Array.from(continentTotals.entries())
            .sort((a, b) => b[1] - a[1])
            .map(d => d[0]);

        // Group countries by continent and sort countries within each continent
        const continentGroups = d3.group(data, d => d["Continent"]);
        const formattedData = sortedContinents.flatMap(continent => {
        const countries = continentGroups.get(continent) || [];
        return countries
            .sort((a, b) =>
                (+b["Annual_CO2_emissions"] + +b["Annual CO₂ emissions from land-use change"]) -
                (+a["Annual_CO2_emissions"] + +a["Annual CO₂ emissions from land-use change"])
            )
            .slice(0,3).map(d => ({
                continent,
                country: d["Entity"],
                fossil: +d["Annual_CO2_emissions"],
                land: +d["Annual CO₂ emissions from land-use change"]
            }));
    });
      console.log(formattedData)

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
          countryNodes.add([d.country, d.continent]);

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
        countryNodes.forEach(([country, continent]) => graph.nodes.push({ name: country, name_c: continent }));

        console.log(countryNodes)
        //console.log(graph.links)

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
          .attr("stroke-opacity", 0.35)
          .attr("fill", "none")
          .attr("class", "link");

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
            return continentColorMap[d.name] || continentColorMap[d.name_c];})
          .attr("stroke", "#333")
          .attr("opacity", 0.9);

          svg.append("g")
          .selectAll("text")
          .data(graph.nodes)
          .enter().append("text")
          .attr("x", d => d.name.includes("World Total") ? d.x0 - 125 : d.x1 + 10)
          .attr("y", d => (d.y0 + d.y1) / 2)
          .attr("dy", 4)
          .style("text-anchor", "left")
          .style("font-size", "14px") // Increase font size
          .attr("stroke", "#333") // Dark stroke (black or dark gray)
          .attr("stroke-width", 1) // Stroke width to make the outline clearer
          .attr("fill", "#333") // Use dark gray text color
          .text(d => d.name);

        
        

      const tooltip_alluvial = d3.select("#tooltip_alluvial");


      function formatNumber(num) {
        if (num >= 1e9) {
          return (num / 1e9).toFixed(2) + " B"; // Billions
        } else if (num >= 1e6) {
          return (num / 1e6).toFixed(2) + " M"; // Millions
        } else if (num >= 1e3) {
          return (num / 1e3).toFixed(2) + " K"; // Thousands
        } else {
          return num.toFixed(2); // Less than a thousand
        }
      }
      nodes.on("mouseover", (event, d) => {
        // Slow down opacity change with transition
        //links.transition().duration(200).attr("stroke-opacity", 0.1);  // Slow opacity fade for links
        nodes.transition().duration(200).attr("opacity", 0.2);  // Slow opacity fade for nodes
        // d3.selectAll(".link")
        //   .style("stroke-opacity", 0.1);

        // Highlight links connected to the hovered node
        d3.selectAll(".link")
          .filter(link => link.source === d || link.target === d)
          .transition().duration(200)
          .style("stroke-opacity", 0.9)
   

        // Highlight the hovered node
        d3.select(event.target).transition().duration(200).attr("opacity", 1);
    
        // Display tooltip with the relevant data
        if (continentNodes.has(d.name)) {
            const totalFossil = d3.sum(
                formattedData.filter(data => data.continent === d.name),
                data => data.fossil
            );
            const totalLand = d3.sum(
                formattedData.filter(data => data.continent === d.name),
                data => data.land
            );
            const totalEmission = totalFossil + totalLand;
    
            tooltip_alluvial.transition().duration(200).style("opacity", 0.9);
            tooltip_alluvial
                .html(`
                    <strong>${d.name}</strong><br>
                    <strong>Total Emissions: ${formatNumber(totalEmission)} tons</strong>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        } else if (Array.from(countryNodes).some(([country, continent]) => country === d.name)){
            const totalFossil = d3.sum(
                formattedData.filter(data => data.country === d.name),
                data => data.fossil
            );
            const totalLand = d3.sum(
                formattedData.filter(data => data.country === d.name),
                data => data.land
            );
            const totalEmission = totalFossil + totalLand;
    
            tooltip_alluvial.transition().duration(200).style("opacity", 0.9);
            tooltip_alluvial
                .html(`
                    <strong>${d.name}</strong><br>
                    Total Fossil Emissions: ${formatNumber(totalFossil)} tons<br>
                    Total Land Emissions: ${formatNumber(totalLand)} tons<br>
                    <strong>Total Emissions: ${formatNumber(totalEmission)} tons</strong>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        } else if (d.name === "World Total - Fossil" || d.name === "World Total - Land") {
            const isFossil = d.name === "World Total - Fossil";
            const totalValue = d3.sum(
                formattedData,
                data => isFossil ? +data.fossil : +data.land
            );
    
            tooltip_alluvial.transition().duration(200).style("opacity", 0.9);
            tooltip_alluvial
                .html(`
                    <strong>${d.name}</strong><br>
                    <strong>Total ${isFossil ? "Fossil" : "Land"} Emissions: ${formatNumber(totalValue)} tons</strong>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }
        else if (d.name.includes("Total - Fossil") || d.name.includes("Total - Land")) {
            const isFossil = d.name.includes("Total - Fossil");
            const continent = d.name.split(" Total -")[0];
    
            const totalValue = d3.sum(
                formattedData.filter(data => data.continent === continent),
                data => isFossil ? data.fossil : data.land
            );
    
            tooltip_alluvial.transition().duration(200).style("opacity", 0.9);
            tooltip_alluvial
                .html(`
                    <strong>${d.name}</strong><br>
                    <strong>Total ${isFossil ? "Fossil" : "Land"} Emissions: ${formatNumber(totalValue)} tons</strong>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }
        else {
            tooltip_alluvial.transition().style("opacity", 0); // Hide tooltip for non-continent nodes
        }
    });
    
    // Smooth transition for tooltip movement
    nodes.on("mousemove", (event) => {
      tooltip_alluvial.style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 20) + "px");
    });
    
    // Reset opacity and hide tooltip on mouseout
    nodes.on("mouseout", () => {
        //links.transition().duration(200).attr("stroke-opacity", 0.35);  // Slow opacity reset for links
        nodes.transition().duration(200).attr("opacity", 0.9);  // Slow opacity reset for nodes
        tooltip_alluvial.transition().duration(200).style("opacity", 0);  // Fade out tooltip
        d3.selectAll(".link").transition().duration(200).style("stroke-opacity", 0.35)
    });

    });
  }

  updatePlotForYear(2022);

  d3.select("#year-select_alluvial").on("change", function() {
    const selectedYear = +this.value;
    console.log("Selected Year: ", selectedYear);
    updatePlotForYear(selectedYear);
  });

});
