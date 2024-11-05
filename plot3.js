<<<<<<< HEAD
function formatNumber(value) {
    const absValue = Math.abs(value); // Get the absolute value

    if (absValue >= 1e12) {
        return (absValue / 1e12).toFixed(2) + "T"; // Trillion
    } else if (absValue >= 1e9) {
        return (absValue / 1e9).toFixed(2) + "B"; // Billion
    } else if (absValue >= 1e6) {
        return (absValue / 1e6).toFixed(2) + "M"; // Million
    } else if (absValue >= 1e3) {
        return (absValue / 1e3).toFixed(2) + "K"; // Thousand
    } else {
        return absValue.toFixed(2); // No formatting needed for smaller numbers
    }
}

// Set the dimensions and margins of the graph
const margin3 = { top: 60, right: 220, bottom: 60, left: 400 },
    width3 = 1500 - margin3.left - margin3.right,
    height3 = 600 - margin3.top - margin3.bottom;

// Append the svg object to the body of the page
const svg4 = d3.select("#heatmap")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom)
    .append("g")
    .attr("transform", `translate(${margin3.left},${margin3.top})`);

// Function to load and render the data
function loadData(year) {
    // Load the data for the selected year
    const fileName = `dataset/top_10_countries_${year}.csv`;
    
    d3.csv(fileName).then(data => {
        // Process the data
        const countries = Array.from(new Set(data.map(d => d.Entity)));
        const types = [
            "Annual CO2 emissions including land-use change",
            "Annual CO2 emissions from land-use change",
            "Annual CO2 emissions"
        ];

        // Transform data to long format
        const longData = [];
        data.forEach(d => {
            types.forEach(type => {
                longData.push({
                    Entity: d.Entity,
                    type: type,
                    value: +d[type]
                });
            });
        });

        // Clear any existing heatmap content
        svg4.selectAll("*").remove();

        // Build X scales and axis
        const x = d3.scaleBand()
            .range([0, width3])
            .domain(countries)
            .padding(0.05);
        svg4.append("g")
            .style("font-size", 14)
            .style("font-weight", "bold")
            .attr("transform", `translate(0,${height3})`)
            .call(d3.axisBottom(x).tickSize(0))
            .select(".domain").remove();

        // Build Y scales and axis
        const y = d3.scaleBand()
            .range([height3, 0])
            .domain(types)
            .padding(0.05);
        svg4.append("g")
            .style("font-size", 14)
            .style("font-weight", "bold")
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove();

        // Define color scale with green, white, and red
        const colorScale = d3.scaleLinear()
            .domain([d3.min(longData, d => d.value), 0, d3.max(longData, d => d.value)])
            .range(["green", "white", "red"]);  // Green for negative, white for zero, red for positive

        // Create a tooltip3
        const tooltip3 = d3.select("body").append("div")
            .style("opacity", 0)
            .attr("class", "tooltip3");

        // Mouse events for tooltip
        const mouseover = function (event, d) {
            rects.style("opacity", 0.5);
            d3.select(this).style("opacity", 1);
            tooltip3.style("opacity", 1);
        };

        const mousemove = function (event, d) {
            tooltip3
                .html(`Country: ${d.Entity}<br>Type: ${d.type}<br>Value: ${formatNumber(d.value)} million tons`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        };

        const mouseleave = function (event, d) {
            rects.style("opacity", 0.8);
            tooltip3.style("opacity", 0);
        };

        // Add the squares (rectangles)
        const rects = svg4.selectAll()
            .data(longData, function (d) { return d.Entity + ':' + d.type; })
            .enter()
            .append("rect")
            .attr("x", d => x(d.Entity))
            .attr("y", d => y(d.type))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale(d.value))
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Add text inside each rectangle (centered text)
        svg4.selectAll("text")
            .data(longData, function (d) { return d.Entity + ':' + d.type; })
            .enter()
            .append("text")
            .attr("x", d => x(d.Entity) + x.bandwidth() / 2)  // Center horizontally
            .attr("y", d => y(d.type) + y.bandwidth() / 2)    // Center vertically
            .attr("dy", ".35em")  // Adjust vertical alignment to center text
            .attr("text-anchor", "middle")  // Center the text horizontally
            .text(d => {
                // Only display formatted value if it's a valid number
                return d.value ? formatNumber(d.value) : "";
            })
            .style("fill", "black")  // Set text color
            .style("font-size", "12px")  // Adjust text size if necessary
            .style("font-weight", "bold"); // Make text bold for visibility

        // Set legend dimensions
        const legendWidth = 10;  
        const legendHeight = 200; 

        // Append a group for the legend
        const legend = svg4.append("g")
            .attr("transform", `translate(${width3 + 10}, 0)`); // Position next to the heatmap

        // Create a scale for the legend including negative values
        const legendScale = d3.scaleLinear()
            .domain([d3.min(longData, d => d.value), d3.max(longData, d => d.value)])
            .range([legendHeight, 0]);

        // Create the gradient rectangle for the legend
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#gradient)");

        // Create a gradient for the legend with green, white, and red
        const gradient = svg4.append("defs").append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        // Define color stops for the gradient (Green -> White -> Red)
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "green");
        gradient.append("stop").attr("offset", "50%").attr("stop-color", "white");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "red");

        // Append labels for the legend
        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", 10)
            .text("Negative Emissions")
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", legendHeight / 2)
            .text("Zero Emissions")
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", legendHeight - 10)
            .text("Positive Emissions")
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        // Find the minimum and maximum values
        const minValue = d3.min(longData, d => d.value);
        const maxValue = d3.max(longData, d => d.value);

        // Print min and max values to the console
        console.log(`Minimum Value: ${formatNumber(minValue)} million tons`);
        console.log(`Maximum Value: ${formatNumber(maxValue)} million tons`);
    });
}

// Initial load with the default year (2022)
loadData(2022);

// Add event listener for the year selection dropdown and the "Load Data" button
document.getElementById("load-data").addEventListener("click", () => {
    const selectedYear = document.getElementById("year-select").value;
    loadData(selectedYear);
});
=======
function formatNumber(value) {
    const absValue = Math.abs(value); // Get the absolute value

    if (absValue >= 1e12) {
        return (absValue / 1e12).toFixed(2) + "T"; // Trillion
    } else if (absValue >= 1e9) {
        return (absValue / 1e9).toFixed(2) + "B"; // Billion
    } else if (absValue >= 1e6) {
        return (absValue / 1e6).toFixed(2) + "M"; // Million
    } else if (absValue >= 1e3) {
        return (absValue / 1e3).toFixed(2) + "K"; // Thousand
    } else {
        return absValue.toFixed(2); // No formatting needed for smaller numbers
    }
}

// Set the dimensions and margins of the graph
const margin3 = { top: 60, right: 220, bottom: 60, left: 400 },
    width3 = 1500 - margin3.left - margin3.right,
    height3 = 600 - margin3.top - margin3.bottom;

// Append the svg object to the body of the page
const svg4 = d3.select("#heatmap")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom)
    .append("g")
    .attr("transform", `translate(${margin3.left},${margin3.top})`);

// Function to load and render the data
function loadData(year) {
    // Load the data for the selected year
    const fileName = `dataset/top_10_countries_${year}.csv`;

    d3.csv(fileName).then(data => {
        // Process the data
        const countries = Array.from(new Set(data.map(d => d.Entity)));
        const types = [
            "Annual CO2 emissions including land-use change",
            "Annual CO2 emissions from land-use change",
            "Annual CO2 emissions"
        ];

        // Transform data to long format
        const longData = [];
        data.forEach(d => {
            types.forEach(type => {
                longData.push({
                    Entity: d.Entity,
                    type: type,
                    value: +d[type]
                });
            });
        });

        // Clear any existing heatmap content
        svg4.selectAll("*").remove();

        // Build X scales and axis
        const x = d3.scaleBand()
            .range([0, width3])
            .domain(countries)
            .padding(0.05);
        svg4.append("g")
            .style("font-size", 14)
            .style("font-weight", "bold")
            .attr("transform", `translate(0,${height3})`)
            .call(d3.axisBottom(x).tickSize(0))
            .select(".domain").remove();

        // Build Y scales and axis
        const y = d3.scaleBand()
            .range([height3, 0])
            .domain(types)
            .padding(0.05);
        svg4.append("g")
            .style("font-size", 14)
            .style("font-weight", "bold")
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove();

        // Define color scale with green, white, and red
        const colorScale = d3.scaleLinear()
            .domain([d3.min(longData, d => d.value), 0, d3.max(longData, d => d.value)])
            .range(["green", "white", "red"]);  // Green for negative, white for zero, red for positive

        // Create a tooltip3 (Make sure it's initially visible and on top of everything)
        const tooltip3 = d3.select("body").append("div")
            .style("opacity", 0)  // Start with 0 opacity, will show on hover
            .attr("class", "tooltip3")
            .style("position", "absolute")  // Position the tooltip absolute
            .style("background-color", "rgba(255, 255, 255, 0.8)")  // Semi-transparent background
            .style("border", "1px solid #ccc")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")  // Prevent the tooltip from interfering with mouse events
            .style("z-index", 1000);  // Ensure the tooltip is on top of other elements

        // Mouse events for tooltip
        const mouseover = function(event, d) {
            rects.style("opacity", 0.5);  // Reduce opacity of all other cells
            d3.select(this).style("opacity", 1);  // Highlight the hovered cell
            tooltip3.style("opacity", 1);  // Show the tooltip
        };

        const mousemove = function(event, d) {
            const [xPos, yPos] = d3.pointer(event);  // Get mouse position relative to the SVG element

            // Adjust tooltip position based on mouse location
            tooltip3
                .html(`Country: ${d.Entity}<br>Type: ${d.type}<br>Value: ${formatNumber(d.value)} million tons`)
                .style("left", (xPos + 10) + "px")  // Offset the tooltip slightly to avoid overlap
                .style("top", (yPos - 10) + "px");  // Offset vertically
        };

        const mouseleave = function(event, d) {
            rects.style("opacity", 0.8);  // Restore opacity of all cells
            tooltip3.style("opacity", 0);  // Hide the tooltip
        };

        // Add the squares (rectangles) for the heatmap
        const rects = svg4.selectAll()
            .data(longData, function(d) { return d.Entity + ':' + d.type; })
            .enter()
            .append("rect")
            .attr("x", d => x(d.Entity))
            .attr("y", d => y(d.type))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale(d.value))
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Add text inside each rectangle (centered text)
        svg4.selectAll("text")
            .data(longData, function(d) { return d.Entity + ':' + d.type; })
            .enter()
            .append("text")
            .attr("x", d => x(d.Entity) + x.bandwidth() / 2)  // Center horizontally
            .attr("y", d => y(d.type) + y.bandwidth() / 2)    // Center vertically
            .attr("dy", ".35em")  // Adjust vertical alignment to center text
            .attr("text-anchor", "middle")  // Center the text horizontally
            .text(d => {
                // Only display formatted value if it's a valid number
                return d.value ? formatNumber(d.value) : "";
            })
            .style("fill", "black")  // Set text color
            .style("font-size", "12px")  // Adjust text size if necessary
            .style("font-weight", "bold"); // Make text bold for visibility

        // Set legend dimensions
        const legendWidth = 10;  
        const legendHeight = 200; 

        // Append a group for the legend
        const legend = svg4.append("g")
            .attr("transform", `translate(${width3 + 10}, 0)`); // Position next to the heatmap

        // Create a scale for the legend including negative values
        const legendScale = d3.scaleLinear()
            .domain([d3.min(longData, d => d.value), d3.max(longData, d => d.value)])
            .range([legendHeight, 0]);

        // Create the gradient rectangle for the legend
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#gradient)");

        // Create a gradient for the legend with green, white, and red
        const gradient = svg4.append("defs").append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        // Define color stops for the gradient (Green -> White -> Red)
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "green");
        gradient.append("stop").attr("offset", "50%").attr("stop-color", "white");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "red");

        // Append labels for the legend
        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", 10)
            .text("Negative Emissions")
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", legendHeight / 2)
            .text("Zero Emissions")
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", legendHeight - 10)
            .text("Positive Emissions")
            .style("font-size", "12px")
            .style("dominant-baseline", "middle");

        // Find the minimum and maximum values
        const minValue = d3.min(longData, d => d.value);
        const maxValue = d3.max(longData, d => d.value);

        // Print min and max values to the console
        console.log(`Minimum Value: ${formatNumber(minValue)} million tons`);
        console.log(`Maximum Value: ${formatNumber(maxValue)} million tons`);
    });
}

// Initial load with the default year (2022)
loadData(2022);

// Add event listener for the year selection dropdown and the "Load Data" button
document.getElementById("load-data").addEventListener("click", () => {
    const selectedYear = document.getElementById("year-select").value;
    loadData(selectedYear);
});
>>>>>>> 65868a6f2427019c055780fbd1a3703a98c6cc1b
