
        const transitionDuration = 800;
        const windowWidth = window.innerWidth;
        const margin1 = { top: 100, right: 100, bottom: 50, left: 110};
        const width1 = windowWidth - margin1.left - margin1.right;
        const height1 = window.innerHeight * 0.7 - margin1.top - margin1.bottom;
        
        const margin2 = { top: 100, right: 100, bottom: 120, left: 220};
        const width2 = windowWidth - margin2.left - margin2.right;
        const height2 = window.innerHeight * 0.7 - margin2.top - margin2.bottom;

        

        const legendWidth1 = width1/2;
        const legendHeight1 = 20;
        const svgHeight = height1 + legendHeight1 + 70;
        const numberBars = 7;

        
        const legendWidth2 = width2 - 50;
        const legendHeight2 = 20;
        const legendPadding = 40;
        const legendX = 0;
        const legendY = height2 + 40;

        // svgs for both charts
        const svg1 = d3.select("#chart_1")
        .attr("width", width1 + margin1.left + margin1.right)
        .attr("height", svgHeight + margin1.top + margin1.bottom)
        .append("g")
        .attr("transform", `translate(${margin1.left},${margin1.top})`);



        const svg2 = d3.select("#chart_2")
        .attr("width", width2 + margin2.left + margin2.right)
        .attr("height", height2 + (numberBars*(legendPadding+legendHeight2) + 5) + margin2.top + margin2.bottom - 30)
        .append("g")
        .attr("transform", `translate(${margin2.left},${margin2.top})`);


        const tooltip_2 = d3.select(".tooltip2");
        loadDataFromFile("2022", "#chart_1");
        loadDataFromFile("2022", "#chart_2");

        // Attach event listeners to inputs
        d3.select("#yearInput1").on("input", handleInputChange("#chart_1"));
        d3.select("#yearInput2").on("input", handleInputChange("#chart_2"));

        // Refactor the handleInputChange function
        function handleInputChange(chart) {
            return function() {
                let selectedYear;
                if (chart === "#chart_1") {
                    selectedYear = d3.select("#yearInput1").property("value");
                } else {
                    selectedYear = d3.select("#yearInput2").property("value");
                }
                console.log(selectedYear)
                loadDataFromFile(selectedYear, chart);
            };
        }

        document.querySelectorAll("#continentFilters1 input[type=checkbox]").forEach(checkbox => {
            checkbox.addEventListener("change", handleInputChange("#chart_1"));

        });

        document.querySelectorAll("#continentFilters2 input[type=checkbox]").forEach(checkbox => {
            checkbox.addEventListener("change", handleInputChange("#chart_2"));

        });

        const otherColorSchemes = {
            "Others": d3.scaleLinear()
                .range([d3.hsl(218, 0.1, 0.9), d3.hsl(218,0.1,0.5)]),
            "Total": d3.scaleLinear()
                .range([d3.hsl(0, 0, 0.7), d3.hsl(0, 0, 0.2)])
        }
        
        const othersGreyColor = "#A9A9A9";

        function loadDataFromFile(selectedYear, chart){
            let filePath;
            if (selectedYear === "2000") {
                filePath = "dataset/1_2/continent_emissions_2000.csv";
            } else if (selectedYear === "2010") {
                filePath = "dataset/1_2/continent_emissions_2010.csv";
            } else if (selectedYear === "2015") {
                filePath = "dataset/1_2/continent_emissions_2015.csv";
            } else if (selectedYear === "2020") {
                filePath = "dataset/1_2/continent_emissions_2020.csv";
            } else if (selectedYear === "2022") {
                filePath = "dataset/1_2/continent_emissions_2022.csv";
            }
            d3.csv(filePath).then(data => {
                data.forEach(d => {
                    d.Annual_CO2_emissions_per_capita = +d.Annual_CO2_emissions_per_capita;
                    d.Population = +d.Population;
                });

                if(chart === "#chart_1"){
                    updateChart1(data, selectedYear, chart);
                }
                else{
                    updateChart2(data, selectedYear, chart);
                }

            });
   
        }
        
        function formatNumber(number) {
            if (number >= 1e9) {
                return (number / 1e9).toFixed(2) + 'B';
            } else if (number >= 1e6) {
                return (number / 1e6).toFixed(2) + 'M';
            } else if (number >= 1e3) {
                return (number / 1e3).toFixed(2) + 'K';
            } else {
                return number.toLocaleString();
            }
        }

        function updateChart1(data, selectedYear, chart) {

            //console.log(selectedYear)
            svg1.selectAll("*").remove();

            const selectedContinents = Array.from(document.querySelectorAll("#continentFilters1 input[type=checkbox]:checked"))
                .map(input => input.value);
            
            const processedData = data
                .filter(d => selectedContinents.includes(d.Continent) && !["Total Emissions"].includes(d.Entity));
            
        
            const continentData = d3.rollup(processedData, 
                countries => {
                    const totalEmissions = d3.sum(countries, d => d.Annual_CO2_emissions_per_capita);
                    return {
                        countries,
                        totalEmissions
                    };
                }, 
                d => d.Continent
            );
            const continentEntries = Array.from(continentData.entries())
                .sort(([continentA, dataA], [continentB, dataB]) => {
                    const totalEmissionsA = dataA.totalEmissions;
                    const totalEmissionsB = dataB.totalEmissions;
                    return totalEmissionsB - totalEmissionsA;
                });

            const countriesEmissions = processedData.filter(d => d.Entity !== "Others" && d.Entity !== "Total Emissions");
            const maxEmission = d3.max(countriesEmissions, d => d.Annual_CO2_emissions_per_capita);

            const colorScale = d3.scaleThreshold()
                .domain([maxEmission * 0.2, maxEmission * 0.4, maxEmission * 0.6, maxEmission * 0.8, maxEmission])
                .range(['#c4b2dc', '#ae8fc5', '#986eaf', '#824c99', '#6b2983']);

            const xScale = d3.scaleLinear()
                .domain([0, d3.max(continentEntries, ([_, { totalEmissions }]) => totalEmissions+15)])
                .range([0, width1]);

            const yScale = d3.scaleBand()
                .domain(continentEntries.map(d => d[0]))
                .range([0, height1])
                .padding(0.1);

            const lineIntervals = d3.range(20, xScale.domain()[1], 20);
                svg1.selectAll(".grid-line")
                    .data(lineIntervals)
                    .enter()
                    .append("line")
                    .attr("class", "grid-line")
                    .attr("y1", 0)
                    .attr("y2", height1)
                    .attr("x1", d => xScale(d))
                    .attr("x2", d => xScale(d))
                    .attr("stroke", "gray")
                    .attr("stroke-width", 1)
                    .style("stroke-dasharray", "4 4")
                    .attr("opacity", 0)
                    .transition().duration(400)
                    .attr("opacity", 0.5);

            
            svg1.selectAll(".bar-group")
                .data(continentEntries)
                .enter().append("g")
                .attr("transform", d => `translate(0, ${yScale(d[0])})`)
                .each(function([continent, {countries}]) {
                    const group = d3.select(this);
                    let xOffset = 0;
                    
                    countries.forEach(v => {
                        const isOther = v.Entity === "Others";
                        const barWidth = xScale(v.Annual_CO2_emissions_per_capita);
                        const bar = group.append("rect")
                            .attr("class", "bar")
                            .attr("x", xOffset)
                            .attr("y", 0)
                            .attr("height", yScale.bandwidth())
                            .attr("width", xScale(v.Annual_CO2_emissions_per_capita))
                            .attr("fill", isOther? colorScale(v.Annual_CO2_emissions_per_capita) : colorScale(v.Annual_CO2_emissions_per_capita))
                            .attr("opacity", 1)
                            .on("mouseover", (event) => {
                                svg1.selectAll(".bar").attr("opacity", 0.3);
                                d3.select(event.target).attr("opacity", 1);
                                
                                const emissions = (+v.Annual_CO2_emissions_per_capita).toFixed(2);
                                const population = formatNumber(v.Population);
                                const annualEmission = formatNumber((+v.Population)*(+v.Annual_CO2_emissions_per_capita));
                                tooltip_2.transition().duration(200).style("opacity", .9);
                                let desc  = `<strong>${v.Entity}</strong>: ${emissions} t CO₂ per capita<br>Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
                                if (isOther){
                                    desc = `<strong>Other countries</strong>: ${emissions} t CO₂ per capita (weighted average)<br>Total Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
                                }
                                tooltip_2.html(desc)
                                    .style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 20) + "px");
                            })
                            .on("mousemove", (event) => {
                                tooltip_2.style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 20) + "px");
                            })
                            .on("mouseout", () => {
                                svg1.selectAll(".bar").attr("opacity", 1);
                                tooltip_2.transition().duration(200).style("opacity", 0);
                            });
                        xOffset += barWidth + 2;
                    });

                });

            svg1.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0, ${height1})`)
                .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => d));

            svg1.append("text")
                .attr("class", "x-axis-description")
                .attr("x", width1 / 2)
                .attr("y", height1 + 40)
                .attr("text-anchor", "middle")
                .attr("font-size", "13px")
                .style("font-family", "Fira Sans")
                .text("Annual emissions of CO₂ Emissions per Capita (tons)");

            svg1.append("g")
                .attr("class", "axis")
                .style("font-size", "13px")
                .style("font-family", "Fira Sans")
                .call(d3.axisLeft(yScale));

            svg1.selectAll("text.title").remove();
            svg1.append("text")
                .attr("class", "title")
                .attr("x", width1 / 2)
                .attr("y", -50)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .text(`ASIA'S DOMINANCE IN CO₂ EMISSIONS PER CAPITA`);


            svg1.append("text")
            .attr("class", "subtitle")
            .attr("x", width1 / 2) 
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .style("font-family", "Fira Sans")
            .style("font-weight", "normal")
            .text(`Annual CO₂ Emissions Per Capita in ${selectedYear} - Top 5 Countries across different Continents`); // Set the subtitle content
                
            const legend = svg1.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${0}, ${height1 + 90})`);

            const scaleValues = [0, maxEmission * 0.2, maxEmission * 0.4, maxEmission * 0.6, maxEmission * 0.8]; // Adjust ranges as needed

            legend.selectAll("rect")
                .data(scaleValues)
                .enter()
                .append("rect")
                .attr("x", (d, i) => i * 100)
                .attr("y", 0)
                .attr("width", 100)
                .attr("height", legendHeight1)
                .attr("fill", (d, i) => colorScale(d));

            const legendValues = [0, maxEmission * 0.2, maxEmission * 0.4, maxEmission * 0.6, maxEmission * 0.8, maxEmission]; // Adjust ranges as needed

            legend.selectAll("text")
                .data(legendValues)
                .enter()
                .append("text")
                .attr("x", (d, i) => i * 100)
                .attr("y", 35)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text(d => formatNumber(d));

            legend.append("text")
                .text("[tons CO₂]")
                .attr("x", 520)
                .attr("y", 35)
                .style("font-size", "14px");

            legend.append("text")
                .text("Country CO₂ Emissions per Capita")
                .attr("x", 0)
                .attr("y", legendHeight1 - 30)
                .style("font-size", "14px")
                .style("font-weight", "bold");

        }

        // updating data shown on chart, depending on given year and number of top countries
        // drawing the new chart
        function updateChart2(data, selectedYear, chart) {
            svg2.selectAll("*").remove();
            const selectedContinents = Array.from(document.querySelectorAll("#continentFilters2 input[type=checkbox]:checked"))
                .map(input => input.value);

            const processedData = data
                .filter(d => selectedContinents.includes(d.Continent));
            
        
            const continentData = d3.rollup(processedData, 
                countries => {
                    const totalEmissions = d3.sum(countries, d => d.Annual_CO2_emissions_per_capita);
                    return {
                        countries,
                        totalEmissions
                    };
                }, 
                d => d.Continent
            );
            console.log(continentData);
            const continentEntries = Array.from(continentData.entries())
                .sort(([continentA, dataA], [continentB, dataB]) => {
                    const totalEmissionsA = dataA.totalEmissions;
                    const totalEmissionsB = dataB.totalEmissions;
                    return totalEmissionsB - totalEmissionsA;
                });


            const emissionsStatsPerIndex = [];
            const colorSchemes = {
                "Asia": d3.scaleThreshold().range(['#b3a2c7', '#9c7ab0', '#845299','#6b2983']),
                "North America": d3.scaleThreshold().range(['#f2b5c6', '#e1899b', '#ce5a73', '#b7214c']),
                "Europe": d3.scaleThreshold().range(['#70b4ce', '#5089ad', '#2f608d', '#003a6d']),
                "Oceania": d3.scaleThreshold().range(['#c3cbae', '#90b37b', '#599a49', '#008010']),
                "South America": d3.scaleThreshold().range(['#f8c5a9', '#eca075', '#db7b41', '#c75500']),
                "Africa": d3.scaleThreshold().range(['#cce0ea', '#9dc3de', '#68a7d3', '#008bc7']),
            };

            for (let i = 0; i < numberBars; i++) {
                const emissionsArray = [];
                for (const [continent, data] of continentData.entries()) {

                    const countries = data.countries;
                    
                    if (countries[i]) {
                        emissionsArray.push(countries[i].Annual_CO2_emissions_per_capita);
                    }
                    
                }

                const maxEmission = Math.max(...emissionsArray);
                const minEmission = Math.min(...emissionsArray);

                emissionsStatsPerIndex[i] = {
                    max: maxEmission,
                    min: minEmission
                };
            }

            
            console.log(emissionsStatsPerIndex)
            
            const addOffset = 10;
            const xAxisWidth = emissionsStatsPerIndex.reduce((sum, stats) => sum + stats.max, 0);
            console.log(xAxisWidth)
            

            // Calculate max and min emissions per capita for each continent
            const continentEmissionRanges = d3.rollup(processedData,
                countries => {
                    const emissions = countries.map(d => d.Annual_CO2_emissions_per_capita);
                    return {
                        maxEmission: Math.max(...emissions),
                        minEmission: Math.min(...emissions),
                    };
                },
                d => d.Continent
            );
             

            // Configure color scales using colorSchemes and ranges
            const colorScales = new Map();
            continentEmissionRanges.forEach((range, continent) => {
                if (colorSchemes[continent]) {
                    colorScales.set(
                        continent,
                        colorSchemes[continent].domain([range.maxEmission * 0.25, range.maxEmission * 0.5, range.maxEmission * 0.75, range.maxEmission])
                    );
                }
            });

            

            const xScale = d3.scaleLinear()
                .domain([0, xAxisWidth+addOffset+200])
                .range([0, width2]);

            const yScale = d3.scaleBand()
                .domain(continentEntries.map(d => d[0]))
                .range([0, height2])
                .padding(0.1);

            const maxOfAllMaxes = emissionsStatsPerIndex.reduce((max, stats) => Math.max(max, stats.max), -Infinity);
            console.log(maxOfAllMaxes)
            const barsDistance = xScale(maxOfAllMaxes) + addOffset;
            let xOffset = 0;
            let xOffsets = [];

            for (let i = 0; i < numberBars; i++) {

                 xOffsets.push(xOffset);
                 xOffset = xOffset + barsDistance;
            }
            console.log(xOffsets)
                svg2.selectAll(".bar-group")
                    .data(continentEntries)
                    .enter().append("g")
                    .attr("transform", d => `translate(0, ${yScale(d[0])})`)
                    .each(function([continent, {countries}]) {
                        const group = d3.select(this);
                        let i = 0;
                        countries.forEach(v => {
                            const isOther = v.Entity === "Others";
                            const isTotal = v.Entity === "Total Emissions"
                            const barWidth = xScale(v.Annual_CO2_emissions_per_capita);
                            const bar = group.append("rect")
                                .attr("class", "bar")
                                .attr("x", xOffsets[i])
                                .attr("y", 0)
                                .attr("height", yScale.bandwidth())
                                .attr("width", xScale(v.Annual_CO2_emissions_per_capita))
                                .attr("fill", colorScales.get(continent)(v.Annual_CO2_emissions_per_capita))
                                .attr("opacity", 1)
                                .on("mouseover", (event) => {
                                    svg2.selectAll(".bar").attr("opacity", 0.3);
                                    d3.select(event.target).attr("opacity", 1);
                                    
                                    const emissions = (+v.Annual_CO2_emissions_per_capita).toFixed(2);
                                    const population = formatNumber(v.Population);
                                    const annualEmission = formatNumber((+v.Population)*(+v.Annual_CO2_emissions_per_capita));
                                    tooltip_2.transition().duration(200).style("opacity", .9);
                                    let desc  = `<strong>${v.Entity}</strong>: ${emissions} t CO₂ per capita<br>Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
                                    if (isOther){
                                        desc = `<strong>Others</strong>: ${emissions} t CO₂ per capita (weighted average)<br>Total Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
                                    }
                                    if (isTotal){
                                        desc = `<strong>Total Emissions</strong>: ${emissions} t CO₂ per capita (weighted average)<br>Total Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
                                    }
                                    tooltip_2.html(desc)
                                        .style("left", (event.pageX + 10) + "px")
                                        .style("top", (event.pageY - 20) + "px");
                                })
                                .on("mousemove", (event) => {
                                    tooltip_2.style("left", (event.pageX + 10) + "px")
                                        .style("top", (event.pageY - 20) + "px");
                                })
                                .on("mouseout", () => {
                                    svg2.selectAll(".bar").attr("opacity", 1);
                                    tooltip_2.transition().duration(200).style("opacity", 0);
                                });
                            i++;
                        });

                    });
            
            svg2.append("text")
                .attr("class", "others-label")
                .attr("x", xOffsets[xOffsets.length - 2])
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text("Others");
            
            svg2.append("text")
                .attr("class", "total-label")
                .attr("x", xOffsets[xOffsets.length - 1])
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text("Total");
            
            for (let i = 0; i < xOffsets.length - 2; i++) {
                svg2.append("text")
                .attr("class", "others-label")
                .attr("x", xOffsets[i])
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text(i==0? "TOP: 1st" : (i==1?"2nd": (i>2? `${i+1}th`: "3rd")));
            }    

            xOffsets.forEach(value => {
                svg2.append("line")
                    .attr("x1", value)
                    .attr("x2", value)
                    .attr("y1", 0)
                    .attr("y2", height2)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
            });

            svg2.append("g")
                .attr("class", "axis")
                .style("font-size", "13px")
                .style("font-family", "Fira Sans")
                .call(d3.axisLeft(yScale));

            svg2.selectAll("text.title").remove();
            svg2.append("text")
                .attr("class", "title")
                .attr("x", width2 / 2)
                .attr("y", -70)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .text(`GROWING POPULATION, GROWING AWARENESS - LOWER EMISSIONS`);

            svg2.append("text")
            .attr("class", "subtitle")
            .attr("x", width2 / 2) 
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .style("font-family", "Fira Sans")
            .style("font-weight", "normal")
            .text(`CO₂ Emissions Per Capita in ${selectedYear} - Top 5 emitting Countries Across Continents`);

            

            const legend = svg2.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${legendX}, ${legendY})`);

                legend.append("text")
                .attr("x", legendWidth2 / 2)
                .attr("y", -5)
                .attr("font-size", "14px")
                .attr("text-anchor", "middle")
                .style("font-weight", "bold")
                .text(`Distribution of CO₂ Emissions Per Capita in Countries Within Each Continent`);

            const maxEmissionRange = Math.max(
                ...Array.from(continentEmissionRanges.values()).map(
                    range => range.maxEmission - range.minEmission
                )
            );
            let legendYOffset = 0;
            continentEntries.forEach(([continent]) => {
                if (colorScales.has(continent)) {
                    const colorScale = colorScales.get(continent);

                    const legendGroup = legend.append("g")
                        .attr("transform", `translate(0, ${legendYOffset})`);

                    legendGroup.append("text")
                        .text(`${continent}`)
                        .attr("x", 0)
                        .attr("y", 5)
                        .style("font-size", "13px")
                        .style("font-weight", "bold");

                    const gradientWidth = windowWidth*0.7;
                    const gradientHeight = 20;
                    const legendValues = colorScale.domain();
                    legendValues.unshift(0);
                    const numSteps = legendValues.length - 1;
                    const emissionRange = continentEmissionRanges.get(continent).maxEmission 
                            - continentEmissionRanges.get(continent).minEmission;

                    // Create the gradient rectangles
                    legendGroup.selectAll("rect")
                        .data(legendValues)
                        .enter().append("rect")
                        .attr("x", (d, i) => {
                            const currentRange = legendValues[i + 1] 
                                ? legendValues[i + 1] - legendValues[i] 
                                : 0; // Handle the last step
                            return i === 0 ? 0 : d3.sum(legendValues.slice(0, i), (v, j) => {
                                const range = legendValues[j + 1] ? legendValues[j + 1] - v : 0;
                                return (range / maxEmissionRange) * gradientWidth;
                            });
                        })
                        .attr("y", 10)
                        .attr("width", (d, i) => {
                            const range = legendValues[i + 1] ? legendValues[i + 1] - d : 0;
                            return (range / maxEmissionRange) * gradientWidth; // Scale width proportionally
                        })
                        .attr("height", gradientHeight)
                        .attr("fill", (d, i) => colorScale(legendValues[i]));

                    let previousWidths = 0;
                    legendValues.forEach((value, i) => {
                        legendGroup.append("text")
                            .attr("x", () => {
                                previousWidths = d3.sum(legendValues.slice(0, i), (v, j) => {
                                    const range = legendValues[j + 1] ? legendValues[j + 1] - v : 0;
                                    return (range / maxEmissionRange) * gradientWidth;
                                });
                                return previousWidths; // Center of the current segment
                            })
                            .attr("y", 42) // Adjust vertical position for clarity
                            .attr("text-anchor", "middle") // Center-align the text
                            .style("font-size", "12px")
                            .text(`${value.toFixed(2)}t`); // Append CO₂ unit
                        });

                        legendGroup.append("text")
                            .attr("x", previousWidths +20)
                            .attr("y", 41) // Adjust vertical position for clarity
                            .attr("text-anchor", "left") // Center-align the text
                            .style("font-size", "12px")
                            .text(`[CO₂]`); // Append CO₂ unit
                        

                    legendYOffset += 60; // Adjust for the next continent
                }
            });

            // Create the rounded "C" shape arrow using a path element
            const arrowPath = svg2.append("path")
            .attr("d", "M -90,190 C -180,250, -120,450, -110,460") // The 'C' shape curve
            .attr("fill", "transparent") // No fill, just the outline
            .attr("stroke", "#595959") // Color of the arrow
            .attr("stroke-width", 3); // Line width

            // Add the arrowhead (triangle) at the end of the curved line
            svg2.append("polygon")
            .attr("points", "-110,470 -100,430 -140,440")  // Coordinates for the arrowhead
            .attr("fill", "#595959");

            svg2.append("rect")
                .attr("x", -200)  // X position of the rectangle
                .attr("y", 500)  // Y position of the rectangle
                .attr("width", 155)  // Width of the rectangle
                .attr("height", 115)  // Height of the rectangle
                .attr("rx", 30)  // Rounded corners radius
                .attr("ry", 30)  // Rounded corners radius
                .attr("fill", "#f2f2f2")  // Light grey background color
                .attr("stroke", "#595959")  // Border color of the rectangle
                .attr("stroke-width", 1);  // Border thickness

            // Add comment text to explain the arrow
            svg2.append("text")
            .attr("x", -153)  // Position the text close to the arrow
            .attr("y", 520)  // Adjust vertical position for clarity
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2b2b2b")
            .text("See how");

            svg2.append("text")
            .attr("x", -170)  // Position the text close to the arrow
            .attr("y", 540)  // Adjust vertical position for clarity
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2b2b2b")
            .text("maximum CO₂");

            svg2.append("text")
            .attr("x", -190)  // Position the text close to the arrow
            .attr("y", 560)  // Adjust vertical position for clarity
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2b2b2b")
            .text("emissions per capita");

            svg2.append("text")
            .attr("x", -168)  // Position the text close to the arrow
            .attr("y", 580)  // Adjust vertical position for clarity
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2b2b2b")
            .text("vary between");

            svg2.append("text")
            .attr("x", -162)  // Position the text close to the arrow
            .attr("y", 600)  // Adjust vertical position for clarity
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#2b2b2b")
            .text("continents!");


            svg2.append("rect")
                .attr("x", width2/2 - 400)  // X position of the rectangle
                .attr("y", 800)  // Y position of the rectangle
                .attr("width", 700)  // Width of the rectangle
                .attr("height", 50)  // Height of the rectangle
                .attr("rx", 20)  // Rounded corners radius
                .attr("ry", 20)  // Rounded corners radius
                .attr("fill", "#f2f2f2")  // Light grey background color
                .attr("stroke", "#595959")  // Border color of the rectangle
                .attr("stroke-width", 1);  // Border thickness

            // Add comment text to explain the arrow
            svg2.append("text")
            .attr("x", width2/2 - 370)  // Position the text close to the arrow
            .attr("y", 830)  // Adjust400rtical position for clarity
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#2b2b2b")
            .text("Can you see the trend of decreasing emissions? Check the data for another year!");

        }