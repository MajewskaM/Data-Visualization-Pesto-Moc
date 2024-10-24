import pandas as pd

# Load the CSV file
file_path = 'co-emissions-per-capita.csv'
data = pd.read_csv(file_path)

# List of continents to filter out
continents = ['Africa', 'Asia', 'Europe', 'Asia (excl. China and India)', 'North America', 'South America', 'Oceania', 'Antarctica']

# Separate rows where the Entity is a continent
continents_data = data[data['Entity'].isin(continents)]

# Create a new dataset without continents
countries_data = data[~data['Entity'].isin(continents)]

# Save the filtered data to new CSV files
continents_file_path = 'continents_data.csv'  # Path for the continents file
countries_file_path = 'countries_data.csv'    # Path for the countries file

# Write the datasets to the new CSV files
continents_data.to_csv(continents_file_path, index=False)
countries_data.to_csv(countries_file_path, index=False)

print(f"Continents data saved to {continents_file_path}")
print(f"Countries data saved to {countries_file_path}")