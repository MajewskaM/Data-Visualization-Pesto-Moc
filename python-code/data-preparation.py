import pandas as pd


# loading the datasets
emissions_data = pd.read_csv('dataset/2/countries_data_with_continents.csv', encoding='utf-8')
population_data = pd.read_csv('dataset/2/world_population.csv', encoding='utf-8')  # Assuming a population dataset with columns 'Country', 'Year', 'Population'

emissions_data.rename(columns={'Annual CO₂ emissions (per capita)': 'Annual_CO2_emissions_per_capita'}, inplace=True)

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

# print("population_data Description:\n", population_data.describe())


# filtering for non-zero emissions
emissions_data = emissions_data[emissions_data['Annual_CO2_emissions_per_capita'] > 0]

# Renaming specific countries in processed_data
emissions_data['Entity'] = emissions_data['Entity'].replace({
    'Micronesia (country)': 'Micronesia',
    'Sint Maarten (Dutch part)': 'Sint Maarten',
    'Czechia' : 'Czech Republic'
})

# we need to reshape population data to a long format
population_long = population_data.melt(
    id_vars=['Country/Territory', 'Continent'],
    value_vars=['2022 Population', '2020 Population', '2015 Population', '2010 Population', '2000 Population'],
    var_name='Year', value_name='Population'
)

# transforming Year population
population_long['Year'] = population_long['Year'].str.extract('(\d+)').astype(int)

# merge population data with emissions data on 'Country' and 'Year' columns
data = emissions_data.merge(population_long, left_on=['Entity', 'Year'], right_on=['Country/Territory', 'Year'], how='left')
data.drop(columns=['Country/Territory', 'Continent_y', 'Code'], inplace=True)
data.rename(columns={'Continent_x': 'Continent'}, inplace=True)

selected_years = [2022, 2020, 2015, 2010, 2000]
data = data[data['Year'].isin(selected_years)]

# calculate top 5 countries per continent, plus 'Others' and 'Total Emissions'
def calculate_emissions_per_continent(df, year):
    result = []
    continents = df['Continent'].unique()

    for continent in continents:
        continent_data = df[df['Continent'] == continent].copy()

        top_5 = continent_data.nlargest(5, 'Annual_CO2_emissions_per_capita')
        result.append(top_5)

        # Total emissions and population for the entire continent
        total_population = continent_data['Population'].sum()
        total_emissions_weighted_avg = (continent_data['Annual_CO2_emissions_per_capita'] * continent_data['Population']).sum() / total_population
        
        # weighted average emissions for 'Others'
        others_data = continent_data[~continent_data['Entity'].isin(top_5['Entity'])]
        total_population_others = others_data['Population'].sum()
        others_emissions_weighted_avg = (others_data['Annual_CO2_emissions_per_capita'] * others_data['Population']).sum() / total_population_others if total_population_others > 0 else 0

        others_row = {
            'Entity': 'Others',
            'Year': year,
            'Annual_CO2_emissions_per_capita': others_emissions_weighted_avg,
            'Continent': continent,
            'Population': total_population_others
        }
        result.append(pd.DataFrame([others_row]))

        total_row = {
            'Entity': 'Total Emissions',
            'Year': year,
            'Annual_CO2_emissions_per_capita': total_emissions_weighted_avg,
            'Continent': continent,
            'Population': total_population
        }
        result.append(pd.DataFrame([total_row]))

    return pd.concat(result, ignore_index=True)

countries_to_exclude = [
    "Cote d'Ivoire", 
    "Bonaire Sint Eustatius and Saba", 
    "Saint Helena", 
    "Kosovo"
]

data = data[~data['Entity'].isin(countries_to_exclude)]

for year in selected_years:
    year_data = data[data['Year'] == year]
    processed_data = calculate_emissions_per_continent(year_data, year) 
    processed_data.to_csv(f'dataset/2/continent_emissions_{year}.csv', index=False)


# countries with no population information
# countries_with_zero_population = data[data['Population'].isnull()]
# print(countries_with_zero_population)

### CHANGES IN world_population.csv


# Republic of the Congo -> Congo
# DR Congo - > Democratic Republic of Congo
# Timor-Leste - > East Timor
# Macau -> Macao

### CHANGES TO BE INTRODUCED IN processed_data
# Micronesia (country) - > rename to Micronesia
# Sint Maarten (Dutch part) -> rename Sint Maarten
# Czechia - > rename to Czech Republic

# United States - ',' removed from capital name

# Cote d'Ivoire, Bonaire Sint Eustatius and Saba - excluded due to lack of population data
# Saint Helena - excluded due to no data to an island
# Kosovo - excluded no data Kosovo declared its independence from Serbia on February 17, 2008