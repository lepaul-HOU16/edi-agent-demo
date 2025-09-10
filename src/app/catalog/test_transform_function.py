# Test script for the transform_to_tabular function
import json

# Sample input data
sample_data = [
    {
        'data': {
            'NameAliases': [{'AliasName': 'SNK-02'}, {'AliasName': '2749'}],
            'FacilityName': 'SNK-02'
        },
        'kind': 'osdu:wks:master-data--Well:1.0.0',
        'id': 'osdu:master-data--Well:2749'
    },
    {
        'data': {
            'NameAliases': [{'AliasName': 'HGW-01'}, {'AliasName': '3063'}],
            'FacilityName': 'HGW-01'
        },
        'kind': 'osdu:wks:master-data--Well:1.0.0',
        'id': 'osdu:master-data--Well:3063'
    },
    {
        'data': {
            'NameAliases': [{'AliasName': 'MSV-01'}, {'AliasName': '3692'}],
            'FacilityName': 'MSV-01'
        },
        'kind': 'osdu:wks:master-data--Well:1.0.0',
        'id': 'osdu:master-data--Well:3692'
    }
]

# Import the function from OsduSearchLambda.py
from OsduSearchLambda import transform_to_tabular

# Transform the data
tabular_data = transform_to_tabular(sample_data)

# Print the result
print("Transformed data:")
print(json.dumps(tabular_data, indent=2))

# Expected output structure
expected_structure = {
    'columns': [
        {'field': 'id', 'label': 'ID'},
        {'field': 'kind', 'label': 'Data Type'},
        {'field': 'data.NameAliases.AliasName', 'label': 'Well Name'},
        {'field': 'data.FacilityName', 'label': 'Facility Name'},
    ],
    'data': [
        {
            'id': 'osdu:master-data--Well:2749',
            'kind': 'osdu:wks:master-data--Well:1.0.0',
            'data.NameAliases.AliasName': 'SNK-02, 2749',
            'data.FacilityName': 'SNK-02',
        },
        {
            'id': 'osdu:master-data--Well:3063',
            'kind': 'osdu:wks:master-data--Well:1.0.0',
            'data.NameAliases.AliasName': 'HGW-01, 3063',
            'data.FacilityName': 'HGW-01',
        },
        {
            'id': 'osdu:master-data--Well:3692',
            'kind': 'osdu:wks:master-data--Well:1.0.0',
            'data.NameAliases.AliasName': 'MSV-01, 3692',
            'data.FacilityName': 'MSV-01',
        }
    ],
}

# Verify the structure matches
import json
print("\nVerification:")
print(f"Columns match: {tabular_data['columns'] == expected_structure['columns']}")
print(f"Data structure matches: {len(tabular_data['data']) == len(expected_structure['data'])}")

# Check each item in the data array
all_items_match = True
for i, (actual, expected) in enumerate(zip(tabular_data['data'], expected_structure['data'])):
    if actual != expected:
        all_items_match = False
        print(f"Item {i} doesn't match:")
        print(f"  Actual: {actual}")
        print(f"  Expected: {expected}")

print(f"All items match: {all_items_match}")
