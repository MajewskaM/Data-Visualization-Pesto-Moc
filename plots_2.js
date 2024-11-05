
        const transitionDuration = 800;
        
        const margin2 = {top: 80, right: 100, bottom: 40, left: 100},
              width2 =  window.innerWidth*0.80 - margin2.left - margin2.right,
              height2 = 550 - margin2.top - margin2.bottom;
        const margin1 = {top: 80, right: 100, bottom: 40, left: 100},
               width1 =  window.innerWidth*0.80 - margin2.left - margin2.right,
            height1 = 550 - margin2.top - margin2.bottom;

        // Create SVGs for both charts
        const svg1 = d3.select("#chart_1")
        .attr("width", width1 + margin1.left + margin1.right)
        .attr("height", height1 + margin1.top + margin1.bottom)
        .append("g")
        .attr("transform", `translate(${margin1.left},${margin1.top})`);

        const svg2 = d3.select("#chart_2")
        .attr("width", width2 + margin2.left + margin2.right)
        .attr("height", height2 + margin2.top + margin2.bottom)
        .append("g")
        .attr("transform", `translate(${margin2.left},${margin2.top})`);


        const tooltip_2 = d3.select(".tooltip2");
        let allData = []; 

        d3.csv("dataset/all_emitters_2022.csv").then(data => {
            allData = data;
            updateChart1("2022", 5);
            updateChart2("2022", 5);
        });

        d3.select("#yearInput1").on("input", () => {
            const selectedYear = d3.select("#yearInput1").property("value");
            const topCountriesCount = d3.select("#topCountries1").property("value");
            updateChart1(selectedYear, topCountriesCount);
        });

        d3.select("#topCountries1").on("input", () => {
            const selectedYear = d3.select("#yearInput1").property("value");
            const topCountriesCount = d3.select("#topCountries1").property("value");
            updateChart1(selectedYear, topCountriesCount);
        });

        document.querySelectorAll("#continentFilters1 input[type=checkbox]").forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                const selectedYear = d3.select("#yearInput1").property("value");
                const topCountriesCount = d3.select("#topCountries1").property("value");
                updateChart1(selectedYear, topCountriesCount);
            });
        });

        d3.select("#yearInput2").on("input", () => {
            const selectedYear = d3.select("#yearInput2").property("value");
            const topCountriesCount = d3.select("#topCountries2").property("value");
            updateChart2(selectedYear, topCountriesCount);
        });

        d3.select("#topCountries2").on("input", () => {
            const selectedYear = d3.select("#yearInput2").property("value");
            const topCountriesCount = d3.select("#topCountries2").property("value");
            updateChart2(selectedYear, topCountriesCount);
        });

        document.querySelectorAll("#continentFilters2 input[type=checkbox]").forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                const selectedYear = d3.select("#yearInput2").property("value");
                const topCountriesCount = d3.select("#topCountries2").property("value");
                updateChart2(selectedYear, topCountriesCount);
            });
        });

        const otherColorSchemes = {
            "Others": d3.scaleLinear()
                .range([d3.hsl(218, 0.1, 0.9), d3.hsl(218,0.1,0.5)]),
            "Total": d3.scaleLinear()
                .range([d3.hsl(0, 0, 0.7), d3.hsl(0, 0, 0.2)])
        }
        
        const colorSchemes = {
            1: d3.scaleLinear()
                .range([d3.hsl(218, 0.5, 0.76), d3.hsl(218, 1, 0.45)]), 

            2: d3.scaleLinear()
                .range([d3.hsl(50, 0.5, 0.8), d3.hsl(50, 1, 0.60)]), 

            3: d3.scaleLinear()
                .range([d3.hsl(295, 0.5, 0.8), d3.hsl(295, 1, 0.41)]), 

            4: d3.scaleLinear()
                .range([d3.hsl(125, 0.5, 0.75), d3.hsl(128, 1, 0.4)]), 

            5: d3.scaleLinear()
                .range([d3.hsl(355, 0.5, 0.7), d3.hsl(355, 1, 0.6)]),

            6: d3.scaleLinear()
                 .range([d3.hsl(29, 0.5, 0.85), d3.hsl(29, 1, 0.49)]) 
        };

        function calculateMaxPerIndex(maxEmissions) {
            // Initialize an array to hold maximum values for each index
            const maxPerIndex = [];
            
            // Iterate over each continent's emissions
            for (const continent in maxEmissions) {
                const emissions = maxEmissions[continent];
                
                // Iterate over each emission value
                for (let i = 0; i < emissions.length; i++) {
                    // If maxPerIndex doesn't have a value at this index, initialize it
                    if (maxPerIndex[i] === undefined) {
                        maxPerIndex[i] = emissions[i];
                    } else {
                        // Update maxPerIndex[i] if the current emission is greater
                        maxPerIndex[i] = Math.max(maxPerIndex[i], emissions[i]);
                    }
                }
            }
            
            return maxPerIndex;
        }

        function updateChart1(selectedYear, topCountriesCount) {

            const selectedContinents = Array.from(document.querySelectorAll("#continentFilters1 input[type=checkbox]:checked"))
                .map(input => input.value);

            const filteredData = allData
                .filter(d => d.Year === selectedYear && selectedContinents.includes(d.Continent));

            const continents = d3.groups(filteredData, d => d.Continent);
            const maxEmissions = [];
            const othersGrayColor = "#e3e3e3"; 
            let emissionsContinentsMap = [];

            // Modify the part of the code that processes the data for each continent
            const processedData = continents.map(([continent, countries]) => {
                // Sort by emissions in descending order
                const sorted = countries.sort((a, b) => b.Annual_CO2_emissions_per_capita - a.Annual_CO2_emissions_per_capita);
                // Take top N and calculate "Others"
                const topN = sorted.slice(0, topCountriesCount);
                const othersCountries = sorted.slice(topCountriesCount);
                // Store "Others" country names as a comma-separated list
                const othersCountryNames = othersCountries.map(d => d.Entity).join(", \n");
                const othersSum = d3.sum(sorted.slice(topCountriesCount), d => d.Annual_CO2_emissions_per_capita);
                
                // Add "Others" entry but do not change the order of topN
                topN.push({Entity: "Others", Annual_CO2_emissions_per_capita: othersSum, Continent: continent, countriesList: othersCountryNames});
                for (let i = 0; i < topN.length; i++) {
                    if (!maxEmissions[continent]) {
                        maxEmissions[continent] = [];
                    }
                    maxEmissions[continent][i] = topN[i].Annual_CO2_emissions_per_capita;
                }

                
                for (let i = 0; i < topN.length; i++) {
                    if (!emissionsContinentsMap[continent]) {
                        emissionsContinentsMap[continent] = [];
                    }
                    emissionsContinentsMap[continent][i] = topN[i].Annual_CO2_emissions_per_capita;
                    //console.log(emissionsContinentsMap);
                }

                // Calculate total emissions for sorting continents
                const totalEmissions = d3.sum(topN, d => d.Annual_CO2_emissions_per_capita);
                return { continent: continent, values: topN, totalEmissions: totalEmissions};
            });

            const emissionsStatsPerIndex = {};
            let emissionsArray = [];

            for (let i = 0; i < topCountriesCount + 1; i++) {
                emissionsArray = [];
                for (const continent in emissionsContinentsMap){
                    emissionsArray.push(emissionsContinentsMap[continent][i]);
                }
                //const emissionsArray = emissionsContinentsMap[continent].slice(0, -2); // Exclude last two entries
                emissionsStatsPerIndex[i] = {
                max: Math.max(...emissionsArray),
                min: Math.min(...emissionsArray)
                };
            }


            const maxPerIndex = calculateMaxPerIndex(maxEmissions);
            console.log(maxPerIndex); 

            // const colorSchemes = {
            //     "Asia": d3.interpolateHsl("#b7bcbd", "#0071e3"),
            //     "Europe": d3.interpolateHsl("#e0e0dc", "#f5e42c"),
            //     "North America": d3.interpolateHsl("lightgrey", "purple"),
            //     "Oceania": d3.interpolateHsl("lightgrey", "green"),
            //     "Africa": d3.interpolateHsl("lightgrey", "red"),
            //     "South America": d3.interpolateHsl("#e3e3e3", "orange")
            // };

            // Clear existing chart
            svg1.selectAll("*").remove();

            // Sort continents by total emissions, from highest to lowest
            processedData.sort((a, b) => b.totalEmissions - a.totalEmissions);

            // Scales for x-axis and y-axis
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(processedData, d => d3.sum(d.values, v => v.Annual_CO2_emissions_per_capita))])
                .range([0, width1]);

            const yScale = d3.scaleBand()
                .domain(processedData.map(d => d.continent))
                .range([0, height1])
                .padding(0.1);
            // Define intervals for the grid lines (50, 100, etc.) TO DO RESIZABLE
            const lineIntervals = d3.range(50, xScale.domain()[1], 50);  // Generate 50, 100, 150, ... up to max domain value

            // Add dotted lines to the plot
            lineIntervals.forEach(value => {
                svg1.append("line")
                    .attr("x1", xScale(value))
                    .attr("x2", xScale(value))
                    .attr("y1", 0)
                    .attr("y2", height1)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 1)
                    .style("stroke-dasharray", "4 4")  // Make the line dotted
                    .attr("opacity", 0.5);  // Adjust opacity if needed for visibility
            });

            // Draw stacked bars for each continent
            svg1.selectAll(".bar-group")
                .data(processedData)
                .enter().append("g")
                .attr("transform", d => `translate(0, ${yScale(d.continent)})`)
                .each(function(d) {
                    const group = d3.select(this);
                    let xOffset = 0;
                    let i =0;
                    // Define color scale for each continent based on emissions, from 0 to max emission value
                    const continentColor = colorSchemes[d.continent];
                    const emissionMax = d3.max(d.values.filter(v => v.Entity !== "Others"), v => v.Annual_CO2_emissions_per_capita);
                    //const colorScale = d3.scaleSequential(continentColor).domain([0, emissionMax]);
                    //const othersGrayColorHovered = "#A9A9A9";
                    // Draw each country's bar
                    
                    d.values.filter(v => v.Entity !== "Others").forEach(v => {
                        let id = (i%(topCountriesCount));
                        i++;
                            let colorScale = colorSchemes[0];
                            if (id < topCountriesCount){
                                colorScale = colorSchemes[id+1]
                                .interpolate(d3.interpolateHsl)
                                .domain([emissionsStatsPerIndex[id].min, emissionsStatsPerIndex[id].max])
                            }
                            // else{
                            //     colorScale = otherColorSchemes[isOthers? "Others":"Total"]
                            //     .interpolate(d3.interpolateHsl)
                            //     .domain([emissionsStatsPerIndex[id].min, emissionsStatsPerIndex[id].max])

                            // }
                            
                        const bar = group.append("rect")
                            .attr("class", "bar")
                            .attr("x", xOffset)
                            .attr("y", 0)
                            .attr("height", yScale.bandwidth())
                            .attr("width", xScale(v.Annual_CO2_emissions_per_capita))
                            .attr("fill", colorScale(v.Annual_CO2_emissions_per_capita))
                            .attr("opacity", 1)
                            .on("mouseover", (event) => {
                                svg1.selectAll(".bar, .others-bar").attr("opacity", 0.3);
                                d3.select(event.target).attr("opacity", 1);
                                    // Tooltip showing "Others" emissions and country list
                                const emissions = (+v.Annual_CO2_emissions_per_capita).toFixed(2);
                                tooltip_2.transition().duration(200).style("opacity", .9);

                                tooltip_2.html(`${v.Entity}: ${emissions} t CO₂`)
                                    .style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 20) + "px");
                            })
                            .on("mousemove", (event) => {
                                tooltip_2.style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 20) + "px");
                            })
                            .on("mouseout", () => {
                                svg1.selectAll(".bar, .others-bar").attr("opacity", 1);
                                tooltip_2.transition().duration(200).style("opacity", 0);
                            });
                        xOffset += xScale(v.Annual_CO2_emissions_per_capita) + 2;
                    });

                    // Draw "Others" bar
                    const others = d.values.find(v => v.Entity === "Others");
                    if (others) {
                        group.append("rect")
                            .attr("class", "others-bar")
                            .attr("x", xOffset)
                            .attr("y", 0)
                            .attr("height", yScale.bandwidth())
                            .attr("width", xScale(others.Annual_CO2_emissions_per_capita) + 10)
                            .attr("fill", othersGrayColor)
                            .attr("opacity", 1)
                            .on("mouseover", (event) => {
                                svg1.selectAll(".bar, .others-bar").attr("opacity", 0.3);
                                
                                d3.select(event.target).attr("opacity", 1);
                                
                                // Tooltip showing "Others" emissions and country list
                                const emissions = (+others.Annual_CO2_emissions_per_capita).toFixed(2);
                                tooltip_2.transition().duration(200).style("opacity", .9);

                                tooltip_2.html(`Others: ${emissions} t CO₂`)
                                    .style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 20) + "px");
                            })
                            .on("mousemove", (event) => {
                                tooltip_2.style("left", (event.pageX + 10) + "px")
                                    .style("top", (event.pageY - 20) + "px");
                            })
                            .on("mouseout", () => {
                                svg1.selectAll(".bar, .others-bar").attr("opacity", 1);
                                d3.select(event.target).attr("fill", othersGrayColor);
                                tooltip_2.transition().duration(200).style("opacity", 0);
                            });
                    }
                });

            // Add axes
            svg1.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0, ${height1})`)
                .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => d));

            svg1.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));

            // Update title with the selected year and top countries
            svg1.selectAll("text.title").remove(); // Clear previous title
            svg1.append("text")
                .attr("class", "title")
                .attr("x", width1 / 2)
                .attr("y", -50)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .text(`CO2 Emissions Per Capita in ${selectedYear} - Top ${topCountriesCount} Countries Comparing to other Regions`);
                
            
        }

        // updating data shown on chart, depending on given year and number of top countries
        // drawing the new chart
        function updateChart2(selectedYear, topCountriesCount) {
            const selectedContinents = Array.from(document.querySelectorAll("#continentFilters2 input[type=checkbox]:checked"))
                .map(input => input.value);

            const filteredData = allData
                .filter(d => d.Year === selectedYear && selectedContinents.includes(d.Continent));

            const continents = d3.groups(filteredData, d => d.Continent);

            let emissionsContinentsMap = [];
            let topCountries = [];
            let maxOther = 0;
            let maxTotal = 0;
            let offsetBar = 0;
            // maping continents with sorted top countries, adding category others
            const processedData = continents.map(([continent, countries]) => {

                const sorted = countries.sort((a, b) => b.Annual_CO2_emissions_per_capita - a.Annual_CO2_emissions_per_capita);
                const topN = sorted.slice(0, topCountriesCount);
                const othersSum = d3.sum(sorted.slice(topCountriesCount), d => d.Annual_CO2_emissions_per_capita);

                topCountries.push(topN[0].Annual_CO2_emissions_per_capita);

                // adding "other" and "total" category for each continent
                topN.push({Entity: "Others", Annual_CO2_emissions_per_capita: othersSum, Continent: continent});
                const totalEmissions = d3.sum(topN, d => d.Annual_CO2_emissions_per_capita);
                topN.push({Entity: "Total Emissions", Annual_CO2_emissions_per_capita: totalEmissions, Continent: continent});
                if (maxOther<othersSum)
                    maxOther = othersSum;
                if (maxTotal<totalEmissions)
                    maxTotal = totalEmissions;

                for (let i = 0; i < topN.length; i++) {
                    if (!emissionsContinentsMap[continent]) {
                        emissionsContinentsMap[continent] = [];
                    }
                    emissionsContinentsMap[continent][i] = topN[i].Annual_CO2_emissions_per_capita;
                    //console.log(emissionsContinentsMap);
                }
                
                return { continent: continent, values: topN, totalEmissions: totalEmissions};
            });

            offsetBar = Math.max(...topCountries) + 30;
            const emissionsStatsPerIndex = {};
            let emissionsArray = [];

            for (let i = 0; i < topCountriesCount + 2; i++) {
                emissionsArray = [];
                for (const continent in emissionsContinentsMap){
                    emissionsArray.push(emissionsContinentsMap[continent][i]);
                }
                //const emissionsArray = emissionsContinentsMap[continent].slice(0, -2); // Exclude last two entries
                emissionsStatsPerIndex[i] = {
                max: Math.max(...emissionsArray),
                min: Math.min(...emissionsArray)
                };
            }

            // sorting continents by total emissions, from highest to lowest
            processedData.sort((a, b) => b.totalEmissions - a.totalEmissions);

            // remove existing chart
            svg2.selectAll("*").remove();

            const xScale = d3.scaleLinear()
                .domain([0, d3.max(processedData, d => d3.sum(d.values, v => v.Annual_CO2_emissions_per_capita * 1.2))])
                .range([0, width2]);

            const yScale = d3.scaleBand()
                .domain(processedData.map(d => d.continent))
                .range([0, height2])
                .padding(0.1); // spaces between continents

            
            let xOffsets = [];
            // placement of first elements on the x axis
            xOffsets.push(0);
            // calculating exact placements of each segment on x-axis
            // -1 because we force first solution to be 0
            for (let i = 0; i < (topCountriesCount); i++) {
                xOffsets.push(xOffsets[i] + offsetBar);
            }

            // offset for totals
            xOffsets.push(xOffsets[xOffsets.length - 1] + xScale(maxOther) + 30)

            svg2.selectAll(".bar-group")
            .data(processedData, d => d.continent)
            .join(
                enter => {
                    const group = enter.append("g")
                        .attr("class", "bar-group")
                        .attr("transform", d => `translate(0, ${yScale(d.continent)})`)
                        .attr("opacity", 0)
                        .transition()
                        .duration(transitionDuration)
                        .attr("opacity", 1);

                    group.each(function(d) {
                        
                        const barGroup = d3.select(this);
                        d.values.forEach((v, index) => {
                            const isOthers = v.Entity === "Others";

                            const xOffset = xOffsets[index];
                            isOthers ? xOffsets[xOffsets.length - 2] : (xOffsets[xOffsets.length - 1]);
                            let id = (index%(topCountriesCount+2));
                            let colorScale = colorSchemes[0];
                            if (id < topCountriesCount){
                                colorScale = colorSchemes[id+1]
                                .interpolate(d3.interpolateHsl)
                                .domain([emissionsStatsPerIndex[id].min, emissionsStatsPerIndex[id].max])
                            }
                            else{
                                colorScale = otherColorSchemes[isOthers? "Others":"Total"]
                                .interpolate(d3.interpolateHsl)
                                .domain([emissionsStatsPerIndex[id].min, emissionsStatsPerIndex[id].max])

                            }
                            

                            barGroup.append("rect")
                                .attr("class", "bar")
                                .attr("x", xOffset)
                                .attr("y", 0)
                                .attr("height", yScale.bandwidth())
                                .attr("width", xScale(v.Annual_CO2_emissions_per_capita))
                                .attr("fill", colorScale(v.Annual_CO2_emissions_per_capita))
                                .on("mouseover", (event) => {
                                svg2.selectAll(".bar").attr("opacity", 0.3);

                                d3.select(event.target).attr("opacity", 1);

                                // convert emissions to numbers
                                const emissions = (+v.Annual_CO2_emissions_per_capita).toFixed(2);
                                tooltip_2.transition().duration(200).style("opacity", .9);

                                tooltip_2.html(`${v.Entity}: ${emissions} t CO₂`)
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
                            })
                                .attr("width", 0) 
                                .transition()
                                .duration(transitionDuration)
                                .attr("width", xScale(v.Annual_CO2_emissions_per_capita));
                        });
                    });
                },
                update => update
                    .transition() 
                    .duration(transitionDuration)
                    .attr("transform", d => `translate(0, ${yScale(d.continent)})`),
                exit => exit
                    .transition()
                    .duration(transitionDuration)
                    .attr("opacity", 0)
                    .remove()
            );
            
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
                .call(d3.axisLeft(yScale));

            svg2.selectAll("text.title").remove();
            svg2.append("text")
                .attr("class", "title")
                .attr("x", width2 / 2)
                .attr("y", -50)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .text(`CO2 Emissions Per Capita in ${selectedYear} - Top ${topCountriesCount} Countries Comparing to other Regions`);

            // TO DO subtitle: CO₂ Emissions per Capita by Region in 2022", top emitters Asia leading in CO2 emissionsjaki 
            
        }