import pandas as pd

# Read the CSV file with proper delimiter
file_path = "assignment4/dataset/new_york_12months.csv"  # Replace with your file path
data = pd.read_csv(file_path, skiprows=4)  # Skip metadata rows

print(data)

data['Year'] = data['Date'].astype(str).str[:4].astype(int)  # Extract the first 4 characters as Year
data['Month'] = data['Date'].astype(str).str[4:6].astype(int)

# Drop the original 'Date' column
data = data[['Year', 'Month', 'Value', 'Anomaly']]

# Display the cleaned data
print(data)

output_file_path = "assignment4/dataset/new_york_12months_prepared.csv"  # Specify the desired output file name
data.to_csv(output_file_path, index=False)

print(f"Data successfully saved to {output_file_path}")