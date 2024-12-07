const margin2 = { top: 40, right: 30, bottom: 20, left: 110 },
    width2 = 960 - margin2.left - margin2.right,
    height2 = 600 - margin2.top - margin2.bottom;

const svg2 = d3.select("#Ridgeline")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

// Initial scale setup
const x2 = d3.scaleLinear().range([0, width2]); // X scale for Celsius, domain will be dynamic
const y2 = d3.scaleBand().range([height2, 0]).padding(0.1);

const color = d3.scaleOrdinal().range(["#1f77b4", "#ff7f0e"]);

// Load data and populate the dropdown
d3.csv("./dataset/min_all_states.csv").then(minData => {
    d3.csv("./dataset/max_all_states.csv").then(maxData => {
        // Get all unique states
        const states = Array.from(new Set(minData.map(d => d.State)));

        // Populate the dropdown with states
        const dropdown = d3.select("#stateDropdown");
        dropdown.selectAll("option")
            .data(states)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        // Set initial state selection and update chart
        const initialState = states[0];
        updateChart(initialState);

        // Add event listener to update chart when the state is changed
        dropdown.on("change", function () {
            updateChart(this.value);
        });

        // Function to update chart based on selected state
        function updateChart(selectedState) {
            console.log("Updating chart for state:", selectedState); // Debugging line to check which state is selected

            // Filter data for the selected state
            const minStateData = minData.filter(d => d.State === selectedState);
            const maxStateData = maxData.filter(d => d.State === selectedState);

            // Convert Fahrenheit to Celsius
            minStateData.forEach(d => d.Value = (d.Value - 32) * 5 / 9);
            maxStateData.forEach(d => d.Value = (d.Value - 32) * 5 / 9);

            const data = d3.merge([minStateData, maxStateData]);

            // Extract unique years and sort them in descending order
            const years = Array.from(new Set(data.map(d => d.Date.slice(0, 4)))).sort((a, b) => b - a);

            // Limit to the most recent 10 years
            const limitedYears = years.slice(0, 10);

            // Reinitialize the y2 domain
            y2.domain(limitedYears);

            // Calculate the x2 domain dynamically based on the data for the selected state
            const minValue = d3.min(data, d => d.Value);
            const maxValue = d3.max(data, d => d.Value);
            x2.domain([Math.min(minValue, -20), Math.max(maxValue, 70)]); // Ensure it always stays within the -20 to 70 range

            // Remove any existing chart elements, including previous axes and paths
            svg2.selectAll("*").remove(); // This removes all elements inside svg2, including axes and paths
            console.log("Removed previous chart elements"); // Debugging line to confirm cleanup

            // Create x and y axes
            svg2.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", `translate(0,${height2})`)
                .call(d3.axisBottom(x2).ticks(5))
                .append("text")
                .attr("class", "label")
                .attr("x", width2)
                .attr("y", -6)
                .attr("text-anchor", "end")
                .text("°C");

            svg2.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y2));

            svg2.select(".axis--y")
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", -10)
                .attr("dy", ".71em")
                .attr("text-anchor", "end")
                .text("Year");

            // Create KDE function for density estimation
            const kde = kernelDensityEstimator(kernelEpanechnikov(1), x2.ticks(40));

            // Draw the density plots for each year
            limitedYears.forEach(year => {
                const minYearData = minStateData.filter(d => d.Date.startsWith(year)).map(d => +d.Value);
                const maxYearData = maxStateData.filter(d => d.Date.startsWith(year)).map(d => +d.Value);

                const minDensity = kde(minYearData);
                const maxDensity = kde(maxYearData);

                // Scale the density values to make the Gaussians higher
                const scaleFactor = 2; // Adjust this factor to control the height
                const scaledMinDensity = minDensity.map(d => [d[0], d[1] * scaleFactor]);
                const scaledMaxDensity = maxDensity.map(d => [d[0], d[1] * scaleFactor]);

                // Debugging the drawing of each density path
                console.log("Drawing density paths for year:", year);

                // Drawing the Gaussian for minData
                svg2.append("path")
                    .datum(scaledMinDensity)
                    .attr("class", "densityPath") // Assign a class to the path for easy removal
                    .attr("fill", color(0))
                    .attr("opacity", 0.8) // Increase opacity for better visibility
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => x2(d[0])) // Map x value to x2 scale
                        .y(d => y2(year) + y2.bandwidth() / 2 - y2.bandwidth() * d[1] / 2));

                // Drawing the Gaussian for maxData
                svg2.append("path")
                    .datum(scaledMaxDensity)
                    .attr("class", "densityPath")
                    .attr("fill", color(1))
                    .attr("opacity", 0.8)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => x2(d[0])) // Map x value to x2 scale
                        .y(d => y2(year) + y2.bandwidth() / 2 - y2.bandwidth() * d[1] / 2));
            });

            // Debugging line to show how many paths are drawn
            console.log("Number of density paths drawn:", limitedYears.length * 2); // Each year has 2 paths (min/max)
        }
    });
});

// Kernel density estimator function
function kernelDensityEstimator(kernel, X) {
    return function (V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}

// Kernel function: Epanechnikov
function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
