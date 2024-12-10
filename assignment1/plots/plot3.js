
function formatNumber(value) {
    const absValue = Math.abs(value);

    if (absValue >= 1e12) {
        return (absValue / 1e12).toFixed(2) + "T"; // Trillion
    } else if (absValue >= 1e9) {
        return (absValue / 1e9).toFixed(2) + "B"; // Billion
    } else if (absValue >= 1e6) {
        return (absValue / 1e6).toFixed(2) + "M"; // Million
    } else if (absValue >= 1e3) {
        return (absValue / 1e3).toFixed(2) + "K"; // Thousand
    } else {
        return absValue.toFixed(2); 
    }
}

const margin3 = { top: 60, right: 220, bottom: 60, left: 400 },
    width3 = 1500 - margin3.left - margin3.right,
    height3 = 600 - margin3.top - margin3.bottom;

const svg4 = d3.select("#heatmap")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom)
    .append("g")
    .attr("transform", `translate(${margin3.left},${margin3.top})`);

function loadData(year) {
    const fileName = `dataset/1_3/top_10_countries_${year}.csv`;
    
    d3.csv(fileName).then(data => {
        const countries = Array.from(new Set(data.map(d => d.Entity)));
        const types = [
            "Annual CO2 emissions including land-use change",
            "Annual CO2 emissions from land-use change",
            "Annual CO2 emissions"
        ];

        const longData = [];
        data.forEach(d => {
            types.forEach(type => {
                longData.push({
                    Entity: d.Entity,
                    type: type,
                    value: +d[type]
                });
            });
        });

        svg4.selectAll("*").remove();


        const x = d3.scaleBand()
            .range([0, width3])
            .domain(countries)
            .padding(0.05);
        svg4.append("g")
            .style("font-size", 14)
            .style("font-weight", "bold")
            .attr("transform", `translate(0,${height3})`)
            .call(d3.axisBottom(x).tickSize(0))
            .select(".domain").remove();

        const y = d3.scaleBand()
            .range([height3, 0])
            .domain(types)
            .padding(0.05);
        svg4.append("g")
            .style("font-size", 14)
            .style("font-weight", "bold")
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove();

        const colorScale = d3.scaleLinear()
            .domain([d3.min(longData, d => d.value), 0, d3.max(longData, d => d.value)])
            .range(["green", "white", "red"]);  

        const tooltip3 = d3.select("body").append("div")
            .style("opacity", 0)
            .attr("class", "tooltip3");

        const mouseover = function (event, d) {
            rects.style("opacity", 0.5);
            d3.select(this).style("opacity", 1);
            tooltip3.style("opacity", 1);
        };

        const mousemove = function (event, d) {
            tooltip3
                .html(`Country: ${d.Entity}<br>Type: ${d.type}<br>Value: ${formatNumber(d.value)} million tons`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        };

        const mouseleave = function (event, d) {
            rects.style("opacity", 0.8);
            tooltip3.style("opacity", 0);
        };

        const rects = svg4.selectAll()
            .data(longData, function (d) { return d.Entity + ':' + d.type; })
            .enter()
            .append("rect")
            .attr("x", d => x(d.Entity))
            .attr("y", d => y(d.type))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale(d.value))
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        svg4.selectAll("text")
            .data(longData, function (d) { return d.Entity + ':' + d.type; })
            .enter()
            .append("text")
            .attr("x", d => x(d.Entity) + x.bandwidth() / 2)  
            .attr("y", d => y(d.type) + y.bandwidth() / 2)    
            .attr("dy", ".35em")  
            .attr("text-anchor", "middle")  
            .text(d => {
                return d.value ? formatNumber(d.value) : "";
            })
            .style("fill", "black")  
            .style("font-size", "12px")  
            .style("font-weight", "bold"); 

        const legendWidth = 10;  
        const legendHeight = 200; 

        const legend = svg4.append("g")
            .attr("transform", `translate(${width3 + 10}, 0)`); 

        const legendScale = d3.scaleLinear()
            .domain([d3.max(longData, d => d.value), d3.min(longData, d => d.value)]) 
            .range([legendHeight, 0]);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#gradient)");

        const gradient = svg4.append("defs").append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "red");  
        gradient.append("stop").attr("offset", "50%").attr("stop-color", "white");  
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "green");  

        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", 10)
            .text("Positive Emissions")  
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", legendHeight / 2)
            .text("Zero Emissions")  
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", legendHeight - 10)
            .text("Negative Emissions")  
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        svg4.append("text")
        .attr("x", width3 / 2)  
        .attr("y", height3 + 40)  
        .attr("text-anchor", "middle")  
        .style("font-size", "14px")  
        .style("font-weight", "bold")  
        .text("Unit: Tons");

    });
}

loadData(2022);

document.getElementById("load-data").addEventListener("click", () => {
    const selectedYear = document.getElementById("year-select3").value;
    loadData(selectedYear);
    
});
