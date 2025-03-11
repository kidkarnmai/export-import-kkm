# Strapi Export/Import KKM

## Overview
This plugin is designed for Strapi 5 and helps manage the export and import of collection types within the content manager. 

## Features
- Export collection types to an Excel file
- Import collection types from an Excel file

## Installation
To install this plugin, run the following command in your Strapi project:

````
npm install export-import-kkm
````

## Usage
1. Navigate to the content manager in your Strapi admin panel.
2. Use the export/import options available for collection types.

## Compatibility
Tested and developed with @strapi/strapi version ^5.10.3 and above.

## Note
1. For exporting data that includes components, the data can be extracted, and the information in that column will be in JSON format.
2. For importing data that includes components, if you do not import the data within the components, there will be no issues. However, if you do import, ensure that the JSON structure in those columns is correct and matches the structure when exported to function properly.
3. For export, related data can be exported.
4. For import, related data is not supported, and if present, it will not affect any modifications.


## License
This project is licensed under the MIT License.

## Disclaimer
Developed by Kidkarnmai Studio Co., Ltd. This plugin is provided "as is" without any warranty of any kind. Use it at your own risk. For any inquiries, please contact nathawut@kidkarnmai.com.
