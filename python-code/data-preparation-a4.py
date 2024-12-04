import pandas as pd


def preprocess_file(file_path, value_column_name):
    data = pd.read_csv(file_path)
    data['Year'] = data['Date'].astype(str).str[:4].astype(int)
    data['Month'] = data['Date'].astype(str).str[4:].astype(int)
    return data[['Year', 'Month', 'Value']].rename(columns={'Value': value_column_name})


min_temp_file = "assignment4/dataset/new_york_1978-2023_min.csv"
max_temp_file = "assignment4/dataset/new_york_1978-2023_max.csv"
avg_temp_file = "assignment4/dataset/new_york_1978-2023_avg.csv"


min_temp_data = preprocess_file(min_temp_file, "Min Temp")
max_temp_data = preprocess_file(max_temp_file, "Max Temp")
avg_temp_data = preprocess_file(avg_temp_file, "Avg Temp")

merged_data = pd.merge(min_temp_data, max_temp_data, on=["Year", "Month"])
merged_data = pd.merge(merged_data, avg_temp_data, on=["Year", "Month"])

selected_years = [2023, 2018, 2013, 2008, 2003, 1998, 1993, 1988, 1983, 1978]

for year in selected_years:
    year_data = merged_data[merged_data['Year'] == year]
    output_file = f"assignment4/dataset/temperature_data_{year}.csv"
    year_data.to_csv(output_file, index=False)
