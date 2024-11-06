const margin = { top: 50, right: 20, bottom: 100, left: 80 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        const tooltip = d3.select("#tooltip");

        function createOrUpdateBarChart(svgContainer, data, title) {
            d3.select(svgContainer).select("svg").remove(); // Remove existing SVG to avoid duplicates

            const svg = d3.select(svgContainer)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleBand()
                .domain(data.map(d => d.Entity))
                .range([0, width])
                .padding(0.1);

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d["CO2 emissions"])]).nice()
                .range([height, 0]);

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y).ticks(10));

            const yAxis = svg.append("g").call(d3.axisLeft(y).ticks(10));
            svg.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")    
                .attr("x", -height / 2)              
                .attr("y", -margin.left + 35)        
                .attr("dy", "1em")
                .style("font-size", "10px")
                .style("text-anchor", "middle")
                .text("[ tonnes per person ]");
            
            // Chart title
            const titleLines = title.split("\n");
            svg.append("text")
                .attr("class", "title")
                .attr("x", width / 2)
                .attr("y", -20)
                .style("text-anchor", "middle")
                .selectAll("tspan")
                .data(titleLines)
                .enter()
                .append("tspan")
                .attr("x", width / 2)
                .attr("dy", (d, i) => i * 20)
                .text(d => d);

            const bars = svg.selectAll(".bar").data(data, d => d.Entity);

            bars.enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.Entity))
                .attr("width", x.bandwidth())
                .attr("y", height)
                .attr("height", 0)
                .on("mouseover", function(event, d) {
                    d3.selectAll(`${svgContainer} .bar`)
                        .filter(b => b.Entity !== d.Entity)
                        .attr("class", "bar un_hoover");

                    d3.select(this).attr("class", "bar hoover");

                    tooltip.style("visibility", "visible")
                        .html(`Country: ${d.Entity}<br>CO₂ Emissions: ${d["CO2 emissions"].toFixed(2)}`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.selectAll(`${svgContainer} .bar`)
                        .attr("class", "bar");

                    tooltip.style("visibility", "hidden");
                })
                .transition()
                .duration(750)
                .attr("y", d => y(d["CO2 emissions"]))
                .attr("height", d => height - y(d["CO2 emissions"]));

            bars.transition()
                .duration(750)
                .attr("x", d => x(d.Entity))
                .attr("y", d => y(d["CO2 emissions"]))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d["CO2 emissions"]));

            bars.exit()
                .transition()
                .duration(750)
                .attr("height", 0)
                .attr("y", height)
                .remove();
        }

        function loadAndDrawChart(timeRange) {
            let filePath, title;
            if (timeRange === "5years") {
                filePath = "dataset/countries_emissions_5.csv";
                title = "Avg of annual CO₂ emissions in the past 5 years (2018-2022)\nTop 10 Countries";
            } else if (timeRange === "10years") {
                filePath = "dataset/countries_emissions_10.csv";
                title = "Avg of annual CO₂ emissions in the past decade (2013-2022)\nTop 10 Countries";
            } else if (timeRange === "20years") {
                filePath = "dataset/countries_emissions_20.csv";
                title = "Avg of annual CO₂ emissions in the past 2 decades(2003-2022)\nTop 10 Countries";
            }

            d3.csv(filePath, d => ({
                Entity: d.Entity,
                "CO2 emissions": +d["Annual CO₂ emissions (per capita)"]
            })).then(data => {
                const top10 = data.slice(0, 10);
                createOrUpdateBarChart("#decade-chart", top10, title);
            }).catch(error => console.error("Error loading CSV:", error));
        }

        d3.csv("dataset/countries_data.csv", d => ({
            Entity: d.Entity,
            Year: +d.Year,
            "CO2 emissions": +d["Annual CO₂ emissions (per capita)"]
        })).then(data => {
            const top10_2022 = data.filter(d => d.Year === 2022).sort((a, b) => b["CO2 emissions"] - a["CO2 emissions"]).slice(0, 10);
            createOrUpdateBarChart("#chart_2022", top10_2022, "Top 10 CO₂ Emissions per Capita in 2022");
        });

        loadAndDrawChart("10years");

        d3.select("#timeRange").on("change", function() {
            loadAndDrawChart(d3.select(this).property("value"));
        });

        const openModalButtons = document.querySelectorAll(".openExplWindow");
        const closeButtons = document.querySelectorAll(".close-btn");

        openModalButtons.forEach(button => {
            button.onclick = function() {
                const windowId = this.getAttribute("data-modal");
                const window = document.getElementById(windowId);
                window.style.display = "block";
            }
        });

        closeButtons.forEach(button => {
            button.onclick = function() {
                const window = this.closest(".additional_window");
                window.style.display = "none";
            }
        });