const margin2 = { top: 40, right: 30, bottom: 20, left: 110 },
    width2 = 960 - margin2.left - margin2.right,
    height2 = 1500 - margin2.top - margin2.bottom;

const svg2 = d3.select("#Ridgeline")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

const x2 = d3.scaleLinear().range([0, width2]); 
const y2 = d3.scaleBand().range([height2, 0]).padding(0.2); 

const color = d3.scaleOrdinal().range(["#1f77b4", "#ff7f0e"]);

const selectedYears = ["2023", "2018", "2013", "2008", "2003", "1998", "1993", "1988", "1983", "1978"];

d3.csv("./dataset/new_york_1978-2023_min.csv").then(minData => {
    d3.csv("./dataset/new_york_1978-2023_max.csv").then(maxData => {

        const data = d3.merge([minData, maxData]);

        const filteredData = data.filter(d => selectedYears.includes(d.Date.slice(0, 4)));

        y2.domain(selectedYears);

        const minValue = d3.min(filteredData, d => d.Value);
        const maxValue = d3.max(filteredData, d => d.Value);
        x2.domain([Math.min(minValue, -20), Math.max(maxValue, 100)]); 

        svg2.selectAll("*").remove(); 

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

        const kde = kernelDensityEstimator(kernelEpanechnikov(1), x2.ticks(40));

        selectedYears.forEach(year => {
            const minYearData = minData.filter(d => d.Date.startsWith(year)).map(d => +d.Value);
            const maxYearData = maxData.filter(d => d.Date.startsWith(year)).map(d => +d.Value);

            const minDensity = kde(minYearData);
            const maxDensity = kde(maxYearData);

            const scaleFactor = 10; 
            const scaledMinDensity = minDensity.map(d => [d[0], d[1] * scaleFactor]);
            const scaledMaxDensity = maxDensity.map(d => [d[0], d[1] * scaleFactor]);

            svg2.append("path")
                .datum(scaledMinDensity)
                .attr("class", "densityPath") 
                .attr("fill", color(0))
                .attr("opacity", 0.8)
                .attr("stroke", "#000")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x2(d[0])) 
                    .y(d => y2(year) + y2.bandwidth() / 2 - y2.bandwidth() * d[1] / 2));

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

    });
});

function kernelDensityEstimator(kernel, X) {
    return function (V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}

function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
