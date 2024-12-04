
const availableYears = [2023, 2018, 2013, 2008, 2003, 1998, 1993, 1988, 1983, 1978  ];

const checkboxContainer = d3.select("#checkbox-container");
availableYears.forEach(year => {

    if (year === 2023 || year === 1978) {
        checkboxContainer.append("label")
        .html(`<input type="checkbox" value="${year}" checked> ${year}`)
        .style("margin-bottom", "30px");
    }
    else{
        checkboxContainer.append("label")
        .html(`<input type="checkbox" value="${year}"> ${year}`)
        .style("margin-right", "10px");
    }
    
});


const margin = { top: 20, right: 100, bottom: 50, left: 100 };
const width = window.innerWidth*0.8 - margin.left - margin.right;
const height = window.innerHeight*0.7 - margin.top - margin.bottom;

const svg = d3.select("#line-plot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().domain([0, 11]).range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const lineMin = d3.line()
    .x(d => x(d.Month - 1))
    .y(d => y(d["Min Temp"]));

const lineMax = d3.line()
    .x(d => x(d.Month - 1))
    .y(d => y(d["Max Temp"]));

function loadData(selectedYears) {
    const promises = selectedYears.map(year => {
        const filePath = `./dataset/temperature_data_${year}.csv`;
        console.log(`Loading file: ${filePath}`);
        return d3.csv(filePath).then(data => {
            data.forEach(d => {
                d.Year = +d.Year;
                d.Month = +d.Month;

                // Convert temperatures to Celsius
                d["Min Temp"] = ((+d["Min Temp"] - 32) * 5) / 9;
                d["Max Temp"] = ((+d["Max Temp"] - 32) * 5) / 9;
                d["Avg Temp"] = ((+d["Avg Temp"] - 32) * 5) / 9;
            });

            return data;
        });
    });
    return Promise.all(promises).then(yearlyData => yearlyData.flat());
}
    

function updateChart() {
    const selectedYears = [...document.querySelectorAll("input[type='checkbox']:checked")]
        .map(cb => +cb.value);

    loadData(selectedYears).then(data => {

        y.domain([
            d3.min(data, d => d["Min Temp"]),
            d3.max(data, d => d["Max Temp"])
        ]);


        svg.selectAll("*").remove();
        const tooltip_temp = d3.select("#tooltip_temp");

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(i => d3.timeFormat("%B")(new Date(2000, i, 1))))
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "14px");


        svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "14px");

        svg.selectAll("grid-line")
        .data(y.ticks())
        .enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "black")
        .attr("opacity", 0.2)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2");
        
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("stroke", "black")
            .attr("stroke-width", 1);


        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedYears);
        

        selectedYears.forEach(year => {
            const yearData = data.filter(d => d.Year === year);


            svg.append("path")
                .datum(yearData)
                .attr("fill", "none")
                .attr("stroke", color(year))
                .attr("stroke-width", 1.5)
                .attr("d", lineMin);


            svg.append("path")
                .datum(yearData)
                .attr("fill", "none")
                .attr("stroke", d3.color(color(year)).brighter(1))
                .attr("stroke-width", 1.5)
                .attr("d", lineMax);

            svg.selectAll(`.dot-${year}`)
                .data(yearData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.Month - 1))
                .attr("cy", d => y(d["Avg Temp"]))
                .attr("r", 6)
                .attr("opacity", 0.7)
                .attr("fill", color(year))
                .attr("stroke", "white")
                .on("mouseover", function(event, d) {

                    tooltip_temp.transition().duration(200).style("opacity", 1);

                    tooltip_temp
            .html(`
                <div class="tooltip-header" style="color: ${color(year)}">
                    <strong>${year}</strong> ${d3.timeFormat("%d %b")(new Date(d.Year, d.Month - 1))}
                </div>
                <div class="tooltip-body">
                    <strong>Avg Temp:</strong> <span class="tooltip-value">${d["Avg Temp"].toFixed(1)}°C</span>
                </div>
                <div class="tooltip-body">
                    <strong>Min:</strong> <span class="tooltip-value" style="color: ${color(year)}">${d["Min Temp"].toFixed(1)}°C</span>
                </div>
                <div class="tooltip-body">
                    <strong>Max:</strong> <span class="tooltip-value" style="color: ${color(year)}">${d["Max Temp"].toFixed(1)}°C</span>
                </div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");

                    

                    console.log("tooltip")
                })
                .on("mousemove", function(event) {
                    tooltip_temp
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function(){
                    tooltip_temp.transition().duration(200).style("opacity", 0);
                });

            svg.selectAll(`.marker-min-${year}`)
            .data(yearData)
            .enter()
            .append("circle")
            .attr("class", `marker-min-${year}`)
            .attr("cx", d => x(d.Month - 1))
            .attr("cy", d => y(d["Min Temp"]))
            .attr("r", 6)
            .attr("opacity", 0.7)
            .attr("fill", color(year))
            .on("mouseover", function(event, d) {

                tooltip_temp.transition().duration(200).style("opacity", 1);

                tooltip_temp
                .html(`
                    <div class="tooltip-header" style="color: ${color(year)}">
                    <strong>${year}</strong> ${d3.timeFormat("%d %b")(new Date(d.Year, d.Month - 1))}
                </div>
                <div class="tooltip-body">
                    <strong>Min:</strong> <span class="tooltip-value" style="color: ${color(year)}">${d["Min Temp"].toFixed(1)}°C</span>
                </div>

                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");

                

                console.log("tooltip")
            })
            .on("mousemove", function(event) {
                tooltip_temp
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function(){
                tooltip_temp.transition().duration(200).style("opacity", 0);
            });


            svg.selectAll(`.marker-max-${year}`)
            .data(yearData)
            .enter()
            .append("circle")
            .attr("class", `marker-max-${year}`)
            .attr("cx", d => x(d.Month - 1))
            .attr("cy", d => y(d["Max Temp"]))
            .attr("r", 6)
            .attr("opacity", 0.7)
            .attr("fill", d3.color(color(year)).brighter(1))
            .on("mouseover", function(event, d) {

                tooltip_temp.transition().duration(200).style("opacity", 1);

                tooltip_temp
                .html(`
                    <div class="tooltip-header" style="color: ${color(year)}">
                    <strong>${year}</strong> ${d3.timeFormat("%d %b")(new Date(d.Year, d.Month - 1))}
                </div>

                <div class="tooltip-body">
                    <strong>Max:</strong> <span class="tooltip-value" style="color: ${color(year)}">${d["Max Temp"].toFixed(1)}°C</span>
                </div>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");

                

                console.log("tooltip")
            })
            .on("mousemove", function(event) {
                tooltip_temp
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function(){
                tooltip_temp.transition().duration(200).style("opacity", 0);
            });


            


            

        });
            
        const legendContainer = svg.append("g")
        .attr("transform", `translate(${width + 20}, 0)`);
        selectedYears.forEach((year, i) => {
        legendContainer.append("rect")
            .attr("x", 0)
            .attr("y", i * 25)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color(year));

        legendContainer.append("text")
            .attr("x", 25)
            .attr("y", i * 25 + 10)
            .text(year)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
        });

    });
}

d3.selectAll("input[type='checkbox']").on("change", updateChart);

updateChart();