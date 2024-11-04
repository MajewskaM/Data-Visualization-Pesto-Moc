
        const transitionDuration = 800;
        const margin2 = {top: 80, right: 100, bottom: 40, left: 100},
              width2 =  window.innerWidth*0.80 - margin2.left - margin2.right,
              height2 = 550 - margin2.top - margin2.bottom;

        const svg = d3.select("#chart_2")
            .attr("width", width2 + margin2.left + margin2.right)
            .attr("height", height2 + margin2.top + margin2.bottom)
            .append("g")
            .attr("transform", `translate(${margin2.left},${margin2.top})`);

        const tooltip_2 = d3.select(".tooltip2");
        let allData = []; 

        d3.csv("dataset/all_emitters_2022.csv").then(data => {
            allData = data;
            updateChart("2022", 5);
        });

        d3.select("#yearInput").on("input", () => {
            const selectedYear = d3.select("#yearInput").property("value");
            const topCountriesCount = d3.select("#topCountries").property("value");
            updateChart(selectedYear, topCountriesCount);
        });

        d3.select("#topCountries").on("input", () => {
            const selectedYear = d3.select("#yearInput").property("value");
            const topCountriesCount = d3.select("#topCountries").property("value");
            updateChart(selectedYear, topCountriesCount);
        });

        document.querySelectorAll("#continentFilters input[type=checkbox]").forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                const selectedYear = d3.select("#yearInput").property("value");
                const topCountriesCount = d3.select("#topCountries").property("value");
                updateChart(selectedYear, topCountriesCount);
            });
        });

        // updating data shown on chart, depending on given year and number of top countries
        // drawing the new chart
        function updateChart(selectedYear, topCountriesCount) {
            const selectedContinents = Array.from(document.querySelectorAll("#continentFilters input[type=checkbox]:checked"))
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

            //console.log(emissionsStatsPerIndex);

            // remove existing chart
            svg.selectAll("*").remove();
            // sorting continents by total emissions, from highest to lowest
            processedData.sort((a, b) => b.totalEmissions - a.totalEmissions);

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
            //console.log(xOffsets);

            svg.selectAll(".bar-group")
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
                                .range([d3.hsl(355, 0.5, 0.7), d3.hsl(355, 1, 0.6)])

                            // 6: d3.scaleLinear()
                            //     .range([d3.hsl(29, 0.5, 0.85), d3.hsl(29, 1, 0.49)]) 
                        };
                        
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
                                svg.selectAll(".bar").attr("opacity", 0.3);

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
                                svg.selectAll(".bar").attr("opacity", 1);
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
            
            //console.log(maxOther)
            svg.append("text")
                .attr("class", "others-label")
                .attr("x", xOffsets[xOffsets.length - 2])
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text("Others");
            
            //console.log(xScale(maxTotal));
            svg.append("text")
                .attr("class", "total-label")
                .attr("x", xOffsets[xOffsets.length - 1])
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text("Total");
            

            for (let i = 0; i < xOffsets.length - 2; i++) {
                svg.append("text")
                .attr("class", "others-label")
                .attr("x", xOffsets[i])
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .style("font-size", "12px")
                .text(i==0? "TOP: 1st" : (i==1?"2nd": (i>2? `${i+1}th`: "3rd")));
            }    


            xOffsets.forEach(value => {
                svg.append("line")
                    .attr("x1", value)
                    .attr("x2", value)
                    .attr("y1", 0)
                    .attr("y2", height2)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
            });

            svg.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));

            svg.selectAll("text.title").remove();
            svg.append("text")
                .attr("class", "title")
                .attr("x", width2 / 2)
                .attr("y", -50)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .text(`CO2 Emissions Per Capita in ${selectedYear} - Top ${topCountriesCount} Countries Comparing to other Regions`);

            // TO DO subtitle: CO₂ Emissions per Capita by Region in 2022", top emitters Asia leading in CO2 emissionsjaki 
            
        }

        d3.select("#updateButton").on("click", () => {
            const selectedYear = d3.select("#yearInput").property("value");
            const topCountriesCount = d3.select("#topCountries").property("value");
            updateChart(selectedYear, topCountriesCount);
        });