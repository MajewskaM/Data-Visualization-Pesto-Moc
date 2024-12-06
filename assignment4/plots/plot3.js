const margin2 = {top: 40, right: 30, bottom: 20, left: 110},
    width2 = 960 - margin2.left - margin2.right,
    height2 = 600 - margin2.top - margin2.bottom;

const svg2 = d3.select("#Ridgeline")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

// Expanded x-axis range
const x2 = d3.scaleLinear().domain([13, 31]).range([0, width2]); // Updated domain for Celsius
const y2 = d3.scaleBand().range([height2, 0]).padding(0.1);

const color = d3.scaleOrdinal().range(["#1f77b4", "#ff7f0e"]);

d3.csv("./dataset/min_florida.csv").then(minData => {
    d3.csv("./dataset/max_florida.csv").then(maxData => {
        // Convert Fahrenheit to Celsius
        minData.forEach(d => d.Value = (d.Value - 32) * 5 / 9);
        maxData.forEach(d => d.Value = (d.Value - 32) * 5 / 9);

        const data = d3.merge([minData, maxData]);

        const years = Array.from(new Set(data.map(d => d.Date.slice(0, 4))));
        y2.domain(years);

        const xAxis = svg2.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0,${height2})`)
            .call(d3.axisBottom(x2).ticks(5))
            .append("text")
            .attr("class", "label")
            .attr("x", width2)
            .attr("y", -6)
            .attr("text-anchor", "end")
            .text("°C");

        const yAxis = svg2.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y2));

        yAxis.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", -10)
            .attr("dy", ".71em")
            .attr("text-anchor", "end")
            .text("Year");

        const kde = kernelDensityEstimator(kernelEpanechnikov(1), x2.ticks(40)); // Smaller bandwidth

        years.forEach(year => {
            const minYearData = minData.filter(d => d.Date.startsWith(year)).map(d => +d.Value);
            const maxYearData = maxData.filter(d => d.Date.startsWith(year)).map(d => +d.Value);

            const minDensity = kde(minYearData);
            const maxDensity = kde(maxYearData);

            // Scale the density values to make the Gaussians higher
            const scaleFactor = 2; // Adjust this factor to control the height
            const scaledMinDensity = minDensity.map(d => [d[0], d[1] * scaleFactor]);
            const scaledMaxDensity = maxDensity.map(d => [d[0], d[1] * scaleFactor]);

            // Drawing the Gaussian for minData
            svg2.append("path")
                .datum(scaledMinDensity)
                .attr("fill", color(0))
                .attr("opacity", 0.8) // Increase opacity for better visibility
                .attr("stroke", "#000")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x2(d[0]))
                    .y(d => y2(year) + y2.bandwidth() / 2 - y2.bandwidth() * d[1] / 2));

            // Drawing the Gaussian for maxData
            svg2.append("path")
                .datum(scaledMaxDensity)
                .attr("fill", color(1))
                .attr("opacity", 0.8)
                .attr("stroke", "#000")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x2(d[0]))
                    .y(d => y2(year) + y2.bandwidth() / 2 - y2.bandwidth() * d[1] / 2));
        });
    });
});

function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}

function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
