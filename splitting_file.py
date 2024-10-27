import pandas as pd

file_path = 'co-emissions-per-capita.csv'
data = pd.read_csv(file_path)

continents = ['Africa', 'Asia', 'Europe', 'Asia (excl. China and India)', 'North America', 'South America', 'Oceania', 'Antarctica', 'North America (excl. USA)', 'Europe (excl. EU-27)','Europe (excl. EU-28)', 'European Union (27)','European Union (28)']

income = ['High-income countries', 'Low-income countries', 'Lower-middle-income countries','Upper-middle-income countries']
world = ['World']

not_country = continents + income + world 
continents_data = data[data['Entity'].isin(continents)]
countries_data = data[~data['Entity'].isin(not_country)]

income_of_country = data[data['Entity'].isin(income)]
world_emissions = data[data['Entity'].isin(world)]

continents_file_path = 'continents_data.csv'
countries_file_path = 'countries_data.csv'
income_of_country_file_path = 'due_to_income_data.csv'
world_emission_file_path = 'world_data.csv'

continents_data.to_csv(continents_file_path, index=False, mode = 'w')
countries_data.to_csv(countries_file_path, index=False, mode = 'w')

income_of_country.to_csv(income_of_country_file_path, index=False, mode = 'w')
world_emissions.to_csv(world_emission_file_path, index=False, mode = 'w')

print(f"Continents data saved to {continents_file_path}")
print(f"Countries data saved to {countries_file_path}")
print(f"Income data saved to {income_of_country_file_path}")
print(f"World data saved to {world_emission_file_path}")