
        const transitionDuration = 800;
        const windowWidth = window.innerWidth - 220 - 100;
        const margin1 = { top: 100, right: 50, bottom: 50, left: 100};
        const width1 = windowWidth - margin1.left - margin1.right;
        const height1 = window.innerHeight * 0.7 - margin1.top - margin1.bottom;
        
        const margin2 = { top: 150, right: 50, bottom: 40, left: 100};
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
            const minEmission = d3.min(countriesEmissions, d => d.Annual_CO2_emissions_per_capita);

            const otherCountriesEmissions = processedData.filter(d => d.Entity === "Others"); 
            const maxEmissionOthers = d3.max(otherCountriesEmissions, d => d.Annual_CO2_emissions_per_capita);
            const minEmissionOthers = d3.min(otherCountriesEmissions, d => d.Annual_CO2_emissions_per_capita);

            //d3.interpolateHslLong("#e3c57f", "#eb4034")
            const colorScale = d3.scaleSequential(d3.interpolateHslLong("#a55dd9", "#dbb265")) 
                .domain([minEmission, maxEmission]);

            //d3.interpolateHslLong("#e3c57f", "#eb4034")
            const colorScaleOther = d3.scaleSequential(d3.interpolateHslLong("#c4c4c4", "#575757")) 
                    .domain([minEmissionOthers, maxEmissionOthers]);

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
                            .attr("fill", isOther? colorScaleOther(v.Annual_CO2_emissions_per_capita) : colorScale(v.Annual_CO2_emissions_per_capita))
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
                                    desc = `Others: ${emissions} t CO₂ per capita (weighted average)<br>Total Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
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
            .text(`Annual CO₂ Emissions Per Capita in ${selectedYear} - Top 5 Countries across different Continents`); // Set the subtitle content

            const legend = svg1.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${margin1.left * (-0.5)}, ${height1 + 90})`);
            
            legend.append("defs")
                .append("linearGradient")
                .attr("id", "color-gradient")
                .selectAll("stop")
                .data(d3.range(0, 1.05, 0.05))
                .enter().append("stop")
                .attr("offset", d => `${d * 100}%`)
                .attr("stop-color", d => colorScale(d * maxEmission));
                
            legend.append("rect")
                .attr("width", legendWidth1)
                .attr("height", legendHeight1)
                .style("fill", "url(#color-gradient)");

                const legendIntervals = 5;
                const emissionStep = (maxEmission - minEmission) / legendIntervals;

                for (let i = 0; i <= legendIntervals; i++) {
                    const emissionValue = minEmission + i * emissionStep;
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
                        .text(`${formatNumber(emissionValue)}t`);
                }
            
            
                legend.append("text")
                    .attr("class", "legend-title")
                    .attr("x", legendWidth1 / 2)
                    .attr("y", legendHeight1 -40)
                    .style("font-size", "14px")
                    .style("text-anchor", "middle")
                    .style("font-weight", "bold")
                    .text("Country CO₂ Emissions per Capita");
                
                const othersLegend = svg1.append("g")
                    .attr("class", "legend")
                    .attr("transform", `translate(${legendWidth1 + 30}, ${height1 + 90})`);
                
                othersLegend.append("defs")
                    .append("linearGradient")
                    .attr("id", "color-gradient-grey")
                    .selectAll("stop")
                    .data(d3.range(0, 1.05, 0.05))
                    .enter().append("stop")
                    .attr("offset", d => `${d * 100}%`)
                    .attr("stop-color", d => colorScaleOther(d * maxEmissionOthers));
                    
                othersLegend.append("rect")
                    .attr("width", legendWidth1)
                    .attr("height", legendHeight1)
                    .style("fill", "url(#color-gradient-grey)");


                const emissionStepOthers = (maxEmissionOthers - minEmissionOthers) / legendIntervals;

                    for (let i = 0; i <= legendIntervals; i++) {
                        const emissionValue = minEmissionOthers + i * emissionStepOthers;
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
                            .text(`${formatNumber(emissionValue)}t`);
                    }
            
            
                    othersLegend.append("text")
                    .attr("class", "legend-title")
                    .attr("x", legendWidth1 / 2)
                    .attr("y", legendHeight1 -40)
                    .style("font-size", "14px")
                    .style("text-anchor", "middle")
                    .style("font-weight", "bold")
                    .text("Other Countries CO₂ Emissions per Capita (weighted average)");

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

            
            console.log(emissionsStatsPerIndex)
            
            const addOffset = 10;
            const xAxisWidth = emissionsStatsPerIndex.reduce((sum, stats) => sum + stats.max, 0);
            console.log(xAxisWidth)
            

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
                                .attr("fill", colorsScalesPopulations[i].colorScale(v.Population))
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
                                        desc = `Others: ${emissions} t CO₂ per capita (weighted average)<br>Total Population: ${population}<br>Total Annual Emission: ${annualEmission}`;
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
                .text(`RISING POPULATIONS, RISING AWARENESS, STABILIZING EMISSIONS: CO₂ Impact Across Continents (2000-2022)`);

            svg2.append("text")
            .attr("class", "subtitle")
            .attr("x", width1 / 2) 
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .style("font-family", "Fira Sans")
            .style("font-weight", "normal")
            .text(`CO₂ Emissions Per Capita in ${selectedYear} - Top 5 Countries across different Continents`);

            const slicedData = colorsScalesPopulations.slice(0, -2);
            console.log(slicedData)
            const maxPopulationRange = Math.max(...slicedData.map(d => d.max - d.min));

            const legend = svg2.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${legendX}, ${legendY})`);

            legend.append("text")
            .attr("x", legendWidth2 / 2)
            .attr("y", -5)
            .attr("font-size", "14px")
            .attr("text-anchor", "middle")
            .style("font-weight", "bold")
            .text(`Total Populations of TOP5 Emitting Countries`);

            const countriesData = (colorsScalesPopulations).slice(0,-2);
            countriesData.forEach((scaleData, index) => {

                const populationRange = scaleData.max - scaleData.min;
                const barWidth = (populationRange / maxPopulationRange) * legendWidth2;


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

                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", 20+index * (legendHeight2 + legendPadding))
                    .attr("width", barWidth)
                    .attr("height", legendHeight2)
                    .style("fill", `url(#gradient${index})`);

                legend.append("line")
                    .attr("x1", 0)
                    .attr("y1", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 5)
                    .attr("x2", 0)
                    .attr("y2", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 35)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

                legend.append("text")
                    .attr("x", barWidth/2 + 7)
                    .attr("y", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "end")
                    .style("font-weight", "bold")
                    .text(index==0? "1st" : (index==1?"2nd": (index>2? `${index+1}th`: "3rd")));

                legend.append("text")
                    .attr("x", -10)
                    .attr("y", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 25)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "end")
                    .text(formatNumber(scaleData.min));

                legend.append("text")
                    .attr("x", barWidth + 10)
                    .attr("y", index * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 25)
                    .attr("font-size", "12px")
                    .attr("text-anchor", "start")
                    .text(formatNumber(scaleData.max));
            });

            legend.append("text")
            .attr("x", legendWidth2 / 2)
            .attr("y", 45+4 * (legendHeight2 + legendPadding) + legendHeight2 / 2)
            .attr("font-size", "14px")
            .attr("text-anchor", "middle")
            .style("font-weight", "bold")
            .text(`Total Population "Others" Countries`);

        const gradientOthers = legend.append("defs")
            .append("linearGradient")
            .attr("id", `gradient${5}`)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
        
            const otherSlice = colorsScalesPopulations[5];
            gradientOthers.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", otherSlice.colorScale(otherSlice.min));

            gradientOthers.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", otherSlice.colorScale(otherSlice.max));

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 10+5 * (legendHeight2 + legendPadding))
            .attr("width", legendWidth2)
            .attr("height", legendHeight2)
            .style("fill", `url(#gradient${5})`);

        legend.append("text")
            .attr("x", -10)
            .attr("y", 10+5 * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
            .attr("font-size", "12px")
            .attr("text-anchor", "end")
            .text(formatNumber(otherSlice.min));

        legend.append("text")
            .attr("x", legendWidth2 + 10)
            .attr("y", 10+5 * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(formatNumber(otherSlice.max));

        legend.append("line")
            .attr("x1", 0)
            .attr("y1", 5*(legendHeight2 + legendPadding) + legendHeight2 / 2 - 5)
            .attr("x2", 0)
            .attr("y2", 5*(legendHeight2 + legendPadding) + legendHeight2 / 2 + 25)
            .attr("stroke", "black")
            
            .attr("stroke-width", 1);

            legend.append("text")
            .attr("x", legendWidth2 / 2)
            .attr("y", 45+5 * (legendHeight2 + legendPadding) + legendHeight2 / 2)
            .attr("font-size", "14px")
            .attr("text-anchor", "middle")
            .style("font-weight", "bold")
            .text(`Total Population of All Continents`);
            
        const totalSlice = colorsScalesPopulations[6];
        const gradientTotal = legend.append("defs")
            .append("linearGradient")
            .attr("id", `gradient${6}`)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

            gradientTotal.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", totalSlice.colorScale(totalSlice.min));

            gradientTotal.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", totalSlice.colorScale(totalSlice.max));

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 10+6 * (legendHeight2 + legendPadding))
            .attr("width", legendWidth2)
            .attr("height", legendHeight2)
            .style("fill", `url(#gradient${6})`);

        legend.append("text")
            .attr("x", -10)
            .attr("y", 10+6 * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
            .attr("font-size", "12px")
            .attr("text-anchor", "end")
            .text(formatNumber(totalSlice.min));

        legend.append("text")
            .attr("x", legendWidth2 + 10)
            .attr("y", 10+6 * (legendHeight2 + legendPadding) + legendHeight2 / 2 + 4)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(formatNumber(totalSlice.max));

        legend.append("line")
            .attr("x1", 0)
            .attr("y1", 6*(legendHeight2 + legendPadding) + legendHeight2 / 2 - 5)
            .attr("x2", 0)
            .attr("y2", 6*(legendHeight2 + legendPadding) + legendHeight2 / 2 + 20+5)
            .attr("stroke", "black")
            .attr("stroke-width", 1);


        }