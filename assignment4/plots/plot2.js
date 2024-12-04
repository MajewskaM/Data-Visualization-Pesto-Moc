// Fetch and parse the CSV file
fetch('../assignment4/dataset/new_york_12months_prepared.csv')
    .then(response => response.text())
    .then(csvData => {
        Papa.parse(csvData, {
            complete: function (results) {
                const data = results.data;
                processData(data);
            },
            header: true, // Ensure we can access columns by their names
            skipEmptyLines: true
        });
    });

function processData(data) {
    const yearlyData = {};
    const allYears = new Set();

    // Process the CSV rows into structured format
    data.forEach(row => {
        const year = parseInt(row['Year']);
        const month = parseInt(row['Month']) - 1; // Adjust month index to 0-based
        const value = parseFloat(row['Value']);

        if (!yearlyData[year]) {
            yearlyData[year] = Array(12).fill(0); // Initialize an array for 12 months
        }
        yearlyData[year][month] = value; // Assign the temperature value to the correct month
        allYears.add(year); // Add the year to the set
    });

    // Convert the set of all years into a sorted array and populate the checkboxes
    populateYearCheckboxes(Array.from(allYears).sort(), yearlyData);
}

function populateYearCheckboxes(years, yearlyData) {
    const checkboxContainer = document.getElementById('yearCheckboxContainer');
    checkboxContainer.innerHTML = ''; // Clear existing content if any

    // Generate checkboxes for each year
    years.forEach(year => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = year;
        checkbox.id = `year-${year}`;
        checkbox.checked = years.slice(0, 3).includes(year); // Pre-check the first 3 years
        checkbox.addEventListener('change', () => updateSelectedYears(yearlyData));

        const label = document.createElement('label');
        label.htmlFor = `year-${year}`;
        label.textContent = year;

        const wrapper = document.createElement('div');
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        checkboxContainer.appendChild(wrapper);
    });

    // Initialize chart with the first 3 years selected by default
    updateSelectedYears(yearlyData);
}

function updateSelectedYears(yearlyData) {
    const checkboxes = document.querySelectorAll('#yearCheckboxContainer input[type="checkbox"]');
    const selectedYears = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => parseInt(checkbox.value));

    updateChart(selectedYears, yearlyData);
}

function updateChart(selectedYears, yearlyData) {
    const fixedColors = [
        "hsl(0, 70%, 60%)",    // Red
        "hsl(120, 70%, 60%)",  // Green
        "hsl(240, 70%, 60%)",  // Blue
        "hsl(60, 70%, 60%)",   // Yellow
        "hsl(300, 70%, 60%)",  // Purple
        "hsl(180, 70%, 60%)"   // Cyan
    ];

    const datasets = [];
    selectedYears.forEach((year, index) => {
        const temps = yearlyData[year];
        datasets.push({
            label: `Year ${year}`,
            data: temps,
            borderColor: fixedColors[index % fixedColors.length], // Assign a color from the fixed list
            backgroundColor: "rgba(0, 0, 0, 0)", // Transparent background
            fill: false
        });
    });

    // Generate or update the radar chart
    generateRadarChart(datasets);
}

function generateRadarChart(datasets) {
    const ctx = document.getElementById('temperatureRadar').getContext('2d');
    if (window.temperatureRadarChart) {
        // Update the existing chart
        window.temperatureRadarChart.data.datasets = datasets;
        window.temperatureRadarChart.update();
    } else {
        // Create a new chart
        window.temperatureRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // Months
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                layout: {
                    padding: {
                        top: 20,
                        bottom: 20,
                        left: 20,
                        right: 20
                    }
                },
                scales: {
                    r: {
                        ticks: {
                            beginAtZero: true
                        },
                        pointLabels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }
}
