import pandas as pd

# Load datasets
emissions_data = pd.read_csv('assignment1/dataset/1_2/countries_data_with_continents.csv', encoding='utf-8')
population_data = pd.read_csv('assignment1/dataset/1_2/world_population.csv', encoding='utf-8')

# Rename columns for consistency
emissions_data.rename(columns={'Annual CO₂ emissions (per capita)': 'Annual_CO2_emissions_per_capita'}, inplace=True)

# Rename specific country names for consistency
emissions_data['Entity'] = emissions_data['Entity'].replace({
    'Micronesia (country)': 'Micronesia',
    'Sint Maarten (Dutch part)': 'Sint Maarten',
    'Czechia': 'Czech Republic'

})

# Reshape population data to long format
population_long = population_data.melt(
    id_vars=['Country/Territory', 'Continent'],
    value_vars=['2022 Population', '2020 Population', '2015 Population', '2010 Population', '2000 Population'],
    var_name='Year', value_name='Population'
)

# Use a raw string (recommended)
population_long['Year'] = population_long['Year'].str.extract(r'(\d+)').astype(int)



# Merge emissions data with population data
data = emissions_data.merge(population_long, left_on=['Entity', 'Year'], right_on=['Country/Territory', 'Year'], how='left')
data.drop(columns=['Country/Territory', 'Continent_y', 'Code'], inplace=True)
data.rename(columns={'Continent_x': 'Continent'}, inplace=True)

# Filter data for selected years
selected_years = [2022, 2020, 2015, 2010, 2000]
data = data[data['Year'].isin(selected_years)]

# Calculate total emissions column
data['Total_CO2_emissions'] = data['Population'] * data['Annual_CO2_emissions_per_capita']


import pandas as pd

# fitting to geo json data
data['Entity'] = data['Entity'].replace({
    'Dominican Republic': 'Dominican Rep.',
    'United States': 'United States of America',
    'East Timor':'Timor-Leste',
    'Northern Cyprus':'N. Cyprus',
    'Falkland Islands':'Falkland Is.',
    'South Sudan': 'S. Sudan',
    'Western Sahara':'W. Sahara',
    'Democratic Republic of Congo': 'Dem. Rep. Congo',
    'Central African Republic': 'Central African Rep.',
    'Eswatini': 'eSwatini',
    'Equatorial Guinea': 'Eq. Guinea',
    'Czech Republic': 'Czechia',
    'Bosnia and Herzegovina': 'Bosnia and Herz.',
    'Solomon Islands': 'Solomon Is.',
    'Antarctica': 'Antarctica',  # No data, can remain as-is
    'Fr. S. Antarctic Lands': 'French Southern and Antarctic Lands'
})


# no data for those countries
countries_to_exclude = [
    "Cote d'Ivoire", 
    "Bonaire Sint Eustatius and Saba", 
    "Saint Helena", 
    "Kosovo"
]

data = data[~data['Entity'].isin(countries_to_exclude)]

# Function to save data for each year
def calculate_total_emissions_by_country(df, years):
    for year in years:
        year_data = df[df['Year'] == year].copy()
        year_data = year_data[['Entity', 'Year', 'Total_CO2_emissions', 'Continent', 'Population']]
        # Save to a CSV file
        year_data.to_csv(f'assignment3/dataset/country_total_emissions_{year}.csv', index=False)

# Save results for each year
calculate_total_emissions_by_country(data, selected_years)
