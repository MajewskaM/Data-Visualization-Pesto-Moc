let temperatureRadarChart = null;

        function initializeYearSelector() {
            const yearCheckboxContainer = document.getElementById('yearCheckboxContainer');
            const availableYears = [];
            for (let year = 1978; year <= 2023; year += 5) {
                availableYears.push(year);
            }

            const sortedYears = availableYears.sort((a, b) => b - a);

            sortedYears.forEach(year => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = year;
                checkbox.id = `year-${year}`;
                checkbox.checked = (year === 2023);
                checkbox.addEventListener('change', () => updateSelectedYears());

                const label = document.createElement('label');
                label.htmlFor = `year-${year}`;
                label.textContent = year;

                const wrapper = document.createElement('div');
                wrapper.appendChild(checkbox);
                wrapper.appendChild(label);

                yearCheckboxContainer.appendChild(wrapper);
            });

            updateSelectedYears();
        }

        function fetchYearData(year) {
            return fetch(`./dataset/temperature_data_${year}.csv`)
                .then(response => response.text())
                .then(csvData => {
                    return new Promise((resolve, reject) => {
                        Papa.parse(csvData, {
                            header: true,
                            skipEmptyLines: true,
                            complete: function (results) {
                                const monthlyData = Array(12).fill(0);
                                results.data.forEach(row => {
                                    const month = parseInt(row['Month']) - 1;
                                    const value = parseFloat(row['Avg Temp']);
                                    monthlyData[month] = value;
                                });
                                resolve({ year, data: monthlyData });
                            },
                            error: function (error) {
                                reject(error);
                            }
                        });
                    });
                });
        }

        function updateSelectedYears() {
            const checkboxes = document.querySelectorAll('#yearCheckboxContainer input[type="checkbox"]');
            const selectedYears = Array.from(checkboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => parseInt(checkbox.value));

            

            const promises = selectedYears.map(fetchYearData);

            Promise.all(promises)
                .then(results => {
                    const datasets = results.map((result, index) => {
                        const fixedColors = [
                            "hsl(0, 70%, 60%)",    // Red
                            "hsl(120, 70%, 60%)",  // Green
                            "hsl(240, 70%, 60%)",  // Blue
                            "hsl(60, 70%, 60%)",   // Yellow
                            "hsl(300, 70%, 60%)",  // Purple
                            "hsl(180, 70%, 60%)",  // Cyan
                            "hsl(30, 70%, 60%)",   // Orange
                            "hsl(330, 70%, 60%)",  // Pink
                            "hsl(75, 70%, 60%)",   // Lime Green
                            "hsl(165, 70%, 60%)"   // Turquoise
                        ];
                        return {
                            label: `Year ${result.year}`,
                            data: result.data,
                            borderColor: fixedColors[index % fixedColors.length],
                            backgroundColor: "rgba(0, 0, 0, 0)",
                            fill: false
                        };
                    });

                    generateRadarChart(datasets); // Update the chart
                })
                .catch(error => console.error('Error loading year data:', error));
        }

    
        function generateRadarChart(datasets) {
            const ctx = document.getElementById('temperatureRadar').getContext('2d');
            if (temperatureRadarChart) {
                temperatureRadarChart.data.datasets = datasets;
                temperatureRadarChart.update();
            } else {
                temperatureRadarChart = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 
                        datasets: datasets.length ? datasets : [{ 
                            data: Array(12).fill(null),
                            borderColor: "rgba(0, 0, 0, 0)",
                            backgroundColor: "rgba(0, 0, 0, 0)",
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Monthly Average Temperature (°F)',  // Title text
                                font: {
                                    size: 18,  // Customize the font size
                                    weight: 'bold'  // Set the font weight
                                },
                                padding: {
                                    top: 20,
                                    bottom: 20
                                }
                            },
                            legend: {
                                display: true,
                                position: 'right'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(tooltipItem) {
                                        const datasetIndex = tooltipItem.datasetIndex;
                                        const year = tooltipItem.chart.data.datasets[datasetIndex].label.split(' ')[1];
                                        
                                        const value = tooltipItem.raw;
                                        return `Year ${year}: ${value} F`;
                                    }
                                }
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

        window.onload = () => {
            initializeYearSelector();
        };