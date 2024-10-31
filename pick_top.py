import pandas as pd

# Load the data
file_path = 'co2-fossil-plus-land-use_countries_data_with_continents_countries_data_final.csv'
data = pd.read_csv(file_path)

# Top 10 countries in 2022
data_2022 = data[data['Year'] == 2022]
top_10_2022 = data_2022.nlargest(10, 'Annual CO2 emissions')

# Save to CSV
top_10_2022.to_csv('top_10_countries_2022.csv', index=False)

# Top 10 countries over the past decade (2013-2022)
data_decade = data[(data['Year'] >= 2013) & (data['Year'] <= 2022)]
average_emissions = data_decade.groupby('Entity').agg({
    'Annual CO2 emissions including land-use change': 'mean',
    'Annual CO2 emissions from land-use change': 'mean',
    'Annual CO2 emissions': 'mean',
    'Continent': 'first'
}).reset_index()

top_10_decade = average_emissions.nlargest(10, 'Annual CO2 emissions')

# Save to CSV
top_10_decade.to_csv('top_10_countries_decade.csv', index=False)

print("Files created: 'top_10_countries_2022.csv' and 'top_10_countries_decade.csv'")
