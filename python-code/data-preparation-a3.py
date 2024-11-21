import pandas as pd

# Load the datasets
emissions_data = pd.read_csv('assignment3/dataset/co2-fossil-plus-land-use_countries_data_with_continents_countries_data_final.csv', encoding='utf-8')
# population_data = pd.read_csv('assignment3/dataset/world_population.csv', encoding='utf-8')

# Rename columns for consistency
emissions_data.rename(columns={
    'Annual CO₂ emissions': 'Total_CO2_emissions'
}, inplace=True)

# Reshape population data to long format
# population_long = population_data.melt(
#     id_vars=['Country/Territory', 'Continent'],
#     value_vars=['2022 Population', '2020 Population', '2015 Population', '2010 Population', '2000 Population'],
#     var_name='Year', value_name='Population'
# )
# population_long['Year'] = population_long['Year'].str.extract('(\d+)').astype(int)

# # Merge emissions data with population data
# data = emissions_data.merge(population_long, left_on=['Entity', 'Year'], right_on=['Country/Territory', 'Year'], how='left')
# data.drop(columns=['Country/Territory', 'Continent_y', 'Code'], inplace=True)
# data.rename(columns={'Continent_x': 'Continent'}, inplace=True)

# Filter for selected years
selected_years = [2022, 2020, 2015, 2010, 2000]
#data = emissions_data[emissions_data['Year'].isin(selected_years)]

# Countries to exclude due to lack of data
# countries_to_exclude = [
#     "Cote d'Ivoire",
#     "Bonaire Sint Eustatius and Saba",
#     "Saint Helena",
#     "Kosovo"
# ]
#data = data[~data['Entity'].isin(countries_to_exclude)]

# data.drop(columns=['Country/Territory', 'Continent_y', 'Code'], inplace=True)

# Function to calculate total emissions for each country and save by year
def calculate_total_emissions_by_country(df, years):
    for year in years:
        year_data = df[df['Year'] == year].copy()
        
        # Calculate total emissions for each country
        year_data['Total_CO2_emissions'] = year_data['Total_CO2_emissions']  # Already present in the dataset
        year_data = year_data[['Entity', 'Year', 'Total_CO2_emissions', 'Continent']]
        
        # Save to a CSV file
        year_data.to_csv(f'assignment3/dataset/country_total_emissions_{year}.csv', index=False)

calculate_total_emissions_by_country(emissions_data, selected_years)

