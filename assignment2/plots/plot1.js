const margin1 = { top: 100, right: 50, bottom: 50, left: 50 };

function getPlotDimensions() {
  const width1 = window.innerWidth - 220 - margin1.left - margin1.right;
  const height1 = window.innerHeight - 50 - margin1.top - margin1.bottom; 
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
    const fossilColor = "#ff4d4d"; 
    const landColor = "#4daf4a";
    const continentColorMap = {
      "Africa": "#ff7f0e",
      "Asia": "#f803fc",
      "Europe": "#1f77b4",
      "North America": "#f0fc03",
      "Oceania": "#e377c2",
      "South America": "#7f7f7f"
    };

    function updatePlotForYear(year) {
      svg.selectAll("*").remove();

      d3.csv(`./dataset/continent_emissions_top5_${year}.csv`).then(data => {
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
          .nodeWidth(40)
          .nodePadding(10)
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
            if (d.name.includes("Total - Fossil")) return fossilColor;
            if (d.name.includes("Total - Land")) return landColor;
            return continentColorMap[d.name] || d3.schemeCategory10[0];})
          .attr("stroke", "#333");

        svg.append("g")
          .selectAll("text")
          .data(graph.nodes)
          .enter().append("text")
          .attr("x", d => d.name.includes("World Total") ? d.x0 - 35 : d.x1 + 10)
          .attr("y", d => (d.y0 + d.y1) / 2)
          .attr("dy", 4)
          .style("text-anchor", "left")
          .style("font-size", "12px")
          .text(d => d.name)
          .attr("fill", "#000");
        

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
        links.attr("stroke-opacity", 0.2);
        nodes.attr("opacity", 0.2);
      
        d3.select(event.target).attr("opacity", 1);
      
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
        } else if (countryNodes.has(d.name)){
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
      
      //     nodes.on("mouseover", (event, d) => {
      //   links.attr("stroke-opacity", 0.2);
      //   nodes.attr("opacity", 0.2);
      //   const relatedLinks = graph.links.filter(link => 
      //     graph.nodes[link.source].name === d.name || graph.nodes[link.target].name === d.name
      //   );

      //   let inflowValue = 0;
      //   let outflowValue = 0;
      //   relatedLinks.forEach(link => {
      //     if (graph.nodes[link.target].name === d.name) inflowValue += link.value;
      //     if (graph.nodes[link.source].name === d.name) outflowValue += link.value;
      //   });


      //   d3.select(event.target).attr("opacity", 1);
      //   tooltip_alluvial.transition().duration(200).style("opacity", .9);
      //   tooltip_alluvial.style("opacity", 1)
      //     .html(`
      //       <strong>${d.name}</strong><br>
      //       Total Inflows: ${inflowValue > 0 ? inflowValue.toFixed(2) + " tons" : "No inflows"}<br>
      //       Total Outflows: ${outflowValue > 0 ? outflowValue.toFixed(2) + " tons" : "No outflows"}
      //     `)
      //     .style("left", (event.pageX + 10) + "px")
      //     .style("top", (event.pageY - 28) + "px");
      // });

      nodes.on("mousemove", (event) => {
        tooltip_alluvial.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
      });

      nodes.on("mouseout", () => {
        links.attr("stroke-opacity", 0.6);
        nodes.attr("opacity", 1);
        tooltip_alluvial.transition().duration(200).style("opacity", 0);
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
