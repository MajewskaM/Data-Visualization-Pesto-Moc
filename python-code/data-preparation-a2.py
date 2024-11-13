### CHECKING THE VALIDITY OF EMISSIONS DATA: 
### RESULTS: NO DUPLICATES, NO MISSING DATA
# emissions_missing = emissions_data.isnull().sum()

# print("Missing Values for Emissions Dataset:\n", emissions_missing)
# # no missing values!

# # number of records before removing duplicates
# print("Number of records before removing duplicates:")
# print("Emissions:", len(emissions_data))
# print("Population:", len(population_data))


# emissions_data.drop_duplicates(inplace=True)

# # number of records after removing duplicates
# print("Number of records after removing duplicates:")
# print("Emissions:", len(emissions_data))

# print("emissions_data Description:\n", emissions_data.describe())

import pandas as pd

emissions_data = pd.read_csv('dataset/2/co2-fossil-plus-land-use_countries_data_with_continents_countries_data_final.csv', encoding='utf-8')

# emissions_data = emissions_data[emissions_data['Year'] >= 2000].copy()

# Rename 'Annual CO₂ emissions' column to simplify the name
emissions_data.rename(columns={'Annual CO₂ emissions': 'Annual_CO2_emissions'}, inplace=True)

# Define the specific years to process
selected_years = [2000, 2005, 2010, 2015, 2020, 2022]

# Filter the data to only include these years
emissions_data = emissions_data[emissions_data['Year'].isin(selected_years)]

def calculate_top5_emissions_per_continent(df, year):
    result = []
    continents = df['Continent'].unique()

    for continent in continents:
        # Get continent data
        continent_data = df[df['Continent'] == continent].copy()

        # Top 5 countries by CO₂ emissions
        top_5 = continent_data.nlargest(5, 'Annual_CO2_emissions')
        result.append(top_5)

    return pd.concat(result, ignore_index=True)


# Calculate top 5 countries per continent and save separate files for each selected year
for year in selected_years:
    # Get data for the specific year
    year_data = emissions_data[emissions_data['Year'] == year]
    
    # Calculate emissions per continent
    processed_data = calculate_top5_emissions_per_continent(year_data, year)
    
    # Save to CSV file for each year
    output_path = f'dataset/2/continent_emissions_top5_{year}.csv'
    processed_data.to_csv(output_path, index=False)



# # Process data for each year and compile results
# processed_data_all_years = []
# for year in emissions_data['Year'].unique():
#     year_data = emissions_data[emissions_data['Year'] == year]
#     processed_data = calculate_top5_emissions_per_continent(year_data, year)
#     processed_data_all_years.append(processed_data)

# # Combine all years into a single DataFrame
# final_result = pd.concat(processed_data_all_years, ignore_index=True)

# # Save the result to CSV if desired
# final_result.to_csv('continent_emissions_2000_onward.csv', index=False)
