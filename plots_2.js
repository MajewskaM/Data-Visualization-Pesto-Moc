
        const transitionDuration = 800;

        const margin2 = {top: 100, right: 100, bottom: 40, left: 100},
            width2 =  window.innerWidth*0.80 - margin2.left - margin2.right,
            height2 = 550 - margin2.top - margin2.bottom;
        const margin1 = {top: 80, right: 100, bottom: 40, left: 100},
            width1 =  window.innerWidth*0.80 - margin2.left - margin2.right,
            height1 = 550 - margin2.top - margin2.bottom;

        const legendWidth1 = width1/2;
        const legendHeight1 = 20;
        const svgHeight = height1 + legendHeight1 + 180;
        const numberBars = 7;

        
        const legendWidth2 = width2;
        const legendHeight2 = 20;
        const legendPadding = 40;
        const legendX = 0; // X position of the legend
        const legendY = height2 + 40; // Initial Y position of the legend

        // svgs for both charts
        const svg1 = d3.select("#chart_1")
        .attr("width", width1 + margin1.left + margin1.right)
        .attr("height", svgHeight + margin1.top + margin1.bottom)
        .append("g")
        .attr("transform", `translate(${margin1.left},${margin1.top})`);



        const svg2 = d3.select("#chart_2")
        .attr("width", width2 + margin2.left + margin2.right)
        .attr("height", height2 + (numberBars*(legendPadding+legendHeight2)) + margin2.top + margin2.bottom)
        .append("g")
        .attr("transform", `translate(${margin2.left},${margin2.top})`);


        const tooltip_2 = d3.select(".tooltip2");
        loadDataFromFile("2022", "#chart_1");
        loadDataFromFile("2022", "#chart_2");

        // Attach event listeners to inputs
        d3.select("#yearInput1").on("input", handleInputChange("chart_1"));
        d3.select("#yearInput2").on("input", handleInputChange("chart_2"));

        // Refactor the handleInputChange function
        function handleInputChange(chart) {
            return function() {
                let selectedYear;
                if (chart === "chart_1") {
                    selectedYear = d3.select("#yearInput1").property("value");
                } else {
                    selectedYear = d3.select("#yearInput2").property("value");
                }
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
                filePath = "dataset/2/continent_emissions_2000.csv";
            } else if (selectedYear === "2010") {
                filePath = "dataset/2/continent_emissions_2010.csv";
            } else if (selectedYear === "2015") {
                filePath = "dataset/2/continent_emissions_2015.csv";
            } else if (selectedYear === "2020") {
                filePath = "dataset/2/continent_emissions_2020.csv";
            } else if (selectedYear === "2022") {
                filePath = "dataset/2/continent_emissions_2022.csv";
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
                    return totalEmissionsB - totalEmissionsA; // Sort by total emissions
                });


            
            const countriesEmissions = processedData.filter(d => d.Entity !== "Others" && d.Entity !== "Total Emissions");
            const maxPopulation = d3.max(countriesEmissions, d => d.Population);
            const minPopulation = d3.min(countriesEmissions, d => d.Population);

            const otherCountriesEmissions = processedData.filter(d => d.Entity === "Others"); 
            const maxPopulationOthers = d3.max(otherCountriesEmissions, d => d.Population);
            const minPopulationOthers = d3.min(otherCountriesEmissions, d => d.Population);

            //d3.interpolateHslLong("#e3c57f", "#eb4034")
            const colorScale = d3.scaleSequential(d3.interpolateHslLong("#a55dd9", "#dbb265")) 
                .domain([minPopulation, maxPopulation]);

            //d3.interpolateHslLong("#e3c57f", "#eb4034")
            const colorScaleOther = d3.scaleSequential(d3.interpolateHslLong("#c4c4c4", "#575757")) 
                    .domain([minPopulationOthers, maxPopulationOthers]);

            const xScale = d3.scaleLinear()
                .domain([0, d3.max(continentEntries, ([_, { totalEmissions }]) => totalEmissions)])
                .range([0, width1]);

            const yScale = d3.scaleBand()
                .domain(continentEntries.map(d => d[0]))
                .range([0, height1])
                .padding(0.1);

            const lineIntervals = d3.range(20, xScale.domain()[1], 20);
            lineIntervals.forEach(value => {
                svg1.append("line")
                    .attr("x1", xScale(value))
                    .attr("x2", xScale(value))
                    .attr("y1", 0)
                    .attr("y2", height1)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 1)
                    .style("stroke-dasharray", "4 4")
                    .attr("opacity", 0.5);
            });

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
                            .attr("fill", isOther? colorScaleOther(v.Population) : colorScale(v.Population))
                            .attr("opacity", 1)
                            .on("mouseover", (event) => {
                                svg1.selectAll(".bar").attr("opacity", 0.3);
                                d3.select(event.target).attr("opacity", 1);
                                
                                const emissions = (+v.Annual_CO2_emissions_per_capita).toFixed(2);
                                const population = formatNumber(v.Population);
                                const annualEmission = formatNumber((+v.Population)*(+v.Annual_CO2_emissions_per_capita));
                                tooltip_2.transition().duration(200).style("opacity", .9);
                                let desc  = `${v.Entity}: ${emissions} t CO₂ per capita<br>Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
                                if (isOther){
                                    desc = `Others: ${emissions} t CO₂ per capita (weighted average)<br>Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
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

            // Add x-axis description
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
            .text(`CO₂ Emissions Per Capita in ${selectedYear} - Top 5 Countries Comparing to other Continents`); // Set the subtitle content

            const legend = svg1.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${0}, ${height1 + 90})`);
            
            legend.append("defs")
                .append("linearGradient")
                .attr("id", "color-gradient")
                .selectAll("stop")
                .data(d3.range(0, 1.05, 0.05))
                .enter().append("stop")
                .attr("offset", d => `${d * 100}%`)
                .attr("stop-color", d => colorScale(d * maxPopulation));
                
            legend.append("rect")
                .attr("width", legendWidth1)
                .attr("height", legendHeight1)
                .style("fill", "url(#color-gradient)");

                const legendIntervals = 5;
                const populationStep = (maxPopulation - minPopulation) / legendIntervals;

                for (let i = 0; i <= legendIntervals; i++) {
                    const populationValue = minPopulation + i * populationStep;
                    const xPosition = (legendWidth1 / legendIntervals) * i;
                    
                    legend.append("line")
                    .attr("x1", xPosition)
                    .attr("y1", -5)
                    .attr("x2", xPosition)
                    .attr("y2", legendHeight1 + 5)
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "4, 4")
                    .attr("stroke-width", 1);

                    legend.append("text")
                        .attr("class", "legend-label")
                        .attr("x", xPosition)
                        .attr("y", legendHeight1 + 20)
                        .style("font-size", "12px")
                        .style("text-anchor", "middle")
                        .text(formatNumber(populationValue));
                }
            
            
                legend.append("text")
                    .attr("class", "legend-title")
                    .attr("x", legendWidth1 / 2)
                    .attr("y", legendHeight1 -40)
                    .style("font-size", "14px")
                    .style("text-anchor", "middle")
                    .style("font-weight", "bold")
                    .text("Country Population");
                
                const othersLegend = svg1.append("g")
                    .attr("class", "legend")
                    .attr("transform", `translate(${0}, ${height1 + 200})`);
                
                othersLegend.append("defs")
                    .append("linearGradient")
                    .attr("id", "color-gradient-grey")
                    .selectAll("stop")
                    .data(d3.range(0, 1.05, 0.05))
                    .enter().append("stop")
                    .attr("offset", d => `${d * 100}%`)
                    .attr("stop-color", d => colorScaleOther(d * maxPopulationOthers));
                    
                othersLegend.append("rect")
                    .attr("width", legendWidth1)
                    .attr("height", legendHeight1)
                    .style("fill", "url(#color-gradient-grey)");


                const populationStepOthers = (maxPopulationOthers - minPopulationOthers) / legendIntervals;

                    for (let i = 0; i <= legendIntervals; i++) {
                        const populationValue = minPopulationOthers + i * populationStepOthers;
                        const xPosition = (legendWidth1 / legendIntervals) * i;
                        
                        othersLegend.append("line")
                        .attr("x1", xPosition)
                        .attr("y1", -5)
                        .attr("x2", xPosition)
                        .attr("y2", legendHeight1 + 5)
                        .attr("stroke", "black")
                        .attr("stroke-dasharray", "4, 4")
                        .attr("stroke-width", 1);

                        othersLegend.append("text")
                            .attr("class", "legend-label")
                            .attr("x", xPosition)
                            .attr("y", legendHeight1 + 20)
                            .style("font-size", "12px")
                            .style("text-anchor", "middle")
                            .text(formatNumber(populationValue));
                    }
            
            
                    othersLegend.append("text")
                    .attr("class", "legend-title")
                    .attr("x", legendWidth1 / 2)
                    .attr("y", legendHeight1 -40)
                    .style("font-size", "14px")
                    .style("text-anchor", "middle")
                    .style("font-weight", "bold")
                    .text("Other countries (CO₂ emissions per capita as a weighted average)");
            
                // const othersLegend = svg1.append("g")
                //     .attr("class", "others-legend")
                //     .attr("transform", `translate(${0}, ${height1 + 160})`);

                // othersLegend.append("rect")
                // .attr("width", 20)
                // .attr("height", 20)
                // .style("fill",othersGreyColor);

                // othersLegend.append("text")
                // .attr("x", 30)
                // .attr("y", 12)
                // .text("Other countries (CO₂ emissions per capita as a weighted average)")
                // .style("font-size", "15px")
                // .style("alignment-baseline", "middle");

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
                    return totalEmissionsB - totalEmissionsA; // Sort by total emissions
                });


            const emissionsStatsPerIndex = [];
            const colorSchemes = {
                0: d3.scaleSequential(d3.interpolateHslLong("#e0c8c8", "#eb2421")),
                1: d3.scaleSequential(d3.interpolateHslLong("#ebd3c3", "#eb7221")),
                2: d3.scaleSequential(d3.interpolateHslLong("#c8e6c1", "#57e835")),
                3: d3.scaleSequential(d3.interpolateHslLong("#c5d9e3", "#1d95d1")),
                4: d3.scaleSequential(d3.interpolateHslLong("#c7bae3", "#6430db")),
                5: d3.scaleSequential(d3.interpolateHslLong("#ebbedb", "#d92b9c")),
                6: d3.scaleSequential(d3.interpolateHslLong("#c7d4c8", "#1d9123"))
            };

            const colorsScalesPopulations = [];

            for (let i = 0; i < numberBars; i++) {
                const emissionsArray = [];
                const populationArray = [];


                for (const [continent, data] of continentData.entries()) {

                    const countries = data.countries;
                    
                    if (countries[i]) {
                        emissionsArray.push(countries[i].Annual_CO2_emissions_per_capita);
                        populationArray.push(countries[i].Population);

                    }
                    
                }

                const maxEmission = Math.max(...emissionsArray);
                const minEmission = Math.min(...emissionsArray);

                const maxPopulation = Math.max(...populationArray);
                const minPopulation = Math.min(...populationArray);

                emissionsStatsPerIndex[i] = {
                    max: maxEmission,
                    min: minEmission
                };
                colorsScalesPopulations[i] = {
                    colorScale: colorSchemes[i].domain([minPopulation, maxPopulation]),
                    max: maxPopulation,
                    min: minPopulation
                }
            }

            console.log(colorsScalesPopulations)
            
            const addOffset = 120;
            const xDistancesBars = addOffset*numberBars;
            const xAxisWidth = emissionsStatsPerIndex.reduce((sum, stats) => sum + stats.max, 0);
            console.log(xAxisWidth)

            const xScale = d3.scaleLinear()
                .domain([0, xAxisWidth+addOffset])
                .range([0, width2]);

            const yScale = d3.scaleBand()
                .domain(continentEntries.map(d => d[0]))
                .range([0, height2])
                .padding(0.1);

            const maxOfAllMaxes = emissionsStatsPerIndex.reduce((max, stats) => Math.max(max, stats.max), -Infinity);
            const barsDistance = maxOfAllMaxes + addOffset;
            let xOffset = 0;
            let xOffsets = [];

            for (let i = 0; i < numberBars; i++) {

                 xOffsets.push(xOffset);
                 xOffset = xOffset + barsDistance;
            }
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
                                .attr("fill", colorsScalesPopulations[i].colorScale(v.Population))
                                .attr("opacity", 1)
                                .on("mouseover", (event) => {
                                    svg2.selectAll(".bar").attr("opacity", 0.3);
                                    d3.select(event.target).attr("opacity", 1);
                                    
                                    const emissions = (+v.Annual_CO2_emissions_per_capita).toFixed(2);
                                    const population = formatNumber(v.Population);
                                    const annualEmission = formatNumber((+v.Population)*(+v.Annual_CO2_emissions_per_capita));
                                    tooltip_2.transition().duration(200).style("opacity", .9);
                                    let desc  = `${v.Entity}: ${emissions} t CO₂ per capita<br>Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
                                    if (isOther){
                                        desc = `Others: ${emissions} t CO₂ per capita (weighted average)<br>Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
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
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text("Others");
            
            svg2.append("text")
                .attr("class", "total-label")
                .attr("x", xOffsets[xOffsets.length - 1])
                .attr("y", -15)
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
                .text(`CO2 Emissions Per Capita in ${selectedYear} - Top 5 Countries Comparing to other Regions`);

            svg2.append("text")
            .attr("class", "subtitle")
            .attr("x", width1 / 2) 
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .style("font-family", "Fira Sans")
            .style("font-weight", "normal")
            .text(`CO₂ Emissions Per Capita in ${selectedYear} - Top 5 Countries Comparing to other Continents`); // Set the subtitle content

            // TO DO subtitle: CO₂ Emissions per Capita by Region in 2022", top emitters Asia leading in CO2 emissionsjaki 

            // Exclude the last two entries in colorsScalesPopulations for calculating the maximum range

            const slicedData = colorsScalesPopulations.slice(0, -2);
            console.log(slicedData)
            const maxPopulationRange = Math.max(...slicedData.map(d => d.max - d.min));



            const legend = svg2.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${legendX}, ${legendY})`);

            
            // Label for the rank
            legend.append("text")
            .attr("x", legendWidth2 / 2)
            .attr("y", -15)
            .attr("font-size", "14px")
            .attr("text-anchor", "middle")
            .style("font-weight", "bold")
            .text(`Populations among top emitters`);

            // Loop through color scales and create each legend item with proportional width
            colorsScalesPopulations.forEach((scaleData, index) => {
                // Calculate the width of the bar based on its population range
                const populationRange = scaleData.max - scaleData.min;
                const barWidth = (populationRange / maxPopulationRange) * legendWidth2;

                // Create a gradient for the color scale
                const gradient = legend.append("defs")
                    .append("linearGradient")
                    .attr("id", `gradient${index}`)
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "0%");

                gradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", scaleData.colorScale(scaleData.min));

                gradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", scaleData.colorScale(scaleData.max));

                // Draw the gradient bar with proportional width
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", index * (legendHeight2 + legendPadding))
                    .attr("width", barWidth)
                    .attr("height", legendHeight2)
                    .style("fill", `url(#gradient${index})`);

                // Add text labels for min and max population with consistent positioning
                legend.append("text")
                    .attr("x", -10) // Positioning left of the bar
                    .attr("y", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "end")
                    .text(d3.format(",")(scaleData.min));

                legend.append("text")
                    .attr("x", barWidth + 10) // Positioning right of the bar
                    .attr("y", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "start")
                    .text(d3.format(",")(scaleData.max));

                // Optionally, add rank labels on the left side of each bar
                legend.append("text")
                    .attr("x", -40) // Positioning far left as rank label
                    .attr("y", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "end")
                    .style("font-weight", "bold")
                    .text(`Rank ${index + 1}`);
            });
        }