import pandas as pd

file_path = 'co-emissions-per-capita.csv'
data = pd.read_csv(file_path)

continents = ['Africa', 'Asia', 'Europe', 'Asia (excl. China and India)', 'North America', 'South America', 'Oceania', 'Antarctica']

continents_data = data[data['Entity'].isin(continents)]
countries_data = data[~data['Entity'].isin(continents)]

continents_file_path = 'continents_data.csv'
countries_file_path = 'countries_data.csv'

continents_data.to_csv(continents_file_path, index=False)
countries_data.to_csv(countries_file_path, index=False)

print(f"Continents data saved to {continents_file_path}")
print(f"Countries data saved to {countries_file_path}")