# Resort Information API

A robust API system for delivering information in manageable chunks for a Voice AI application, with conversation logging capabilities.

## Overview

This project solves a critical limitation in Voice AI applications where responses are limited to 800 tokens. It provides:

1. **Information Chunking System**: Breaks down large datasets into smaller chunks under 800 tokens
2. **Context Management**: Maintains query context across multiple API calls
3. **Conversation Logging**: Records call details to Google Sheets for tracking and analysis

## Table of Contents

- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Directory Structure](#directory-structure)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Google Sheets Integration](#google-sheets-integration)
- [Testing](#testing)
- [Technical Implementation](#technical-implementation)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/resort-info-api.git
cd resort-info-api

# Install dependencies
npm install
```

## Environment Setup

Create a `.env` file in the root directory with:

```
PORT=3000
SPREADSHEET_ID=your_google_spreadsheet_id
```

Create or download your Google Service Account credentials file and save it as `credentials.json` in the project root.

## Directory Structure

```
resort-info-api/
├── node_modules/
├── public/
│   └── Sterling_Holidays/  # Data directory
│       ├── activities.csv
│       ├── buffet.csv
│       ├── corporate-team-building.csv
│       ├── destinations.csv
│       ├── halls.csv
│       ├── nearby-cities.csv
│       ├── restaurant.csv
│       ├── rooms-available.csv
│       ├── delivery-rules.csv
│       └── seasonality-and-weather.csv
├── src/
│   ├── index.js  # Main API server
│   ├── sheets.js # Google Sheets integration
│   └── test.js   # Test script
├── credentials.json  # Google Service Account credentials
├── .env  # Environment variables
└── package.json
```

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check and API information |
| `/api/filter-information` | POST | Main endpoint to retrieve filtered information |
| `/api/get-chunk` | POST | Get a specific chunk of large responses |
| `/api/sources/:primary_name` | GET | List all available data sources |
| `/api/schema/:primary_name/:source` | GET | Get column information for a specific data source |
| `/api/log-conversation` | POST | Log conversation details to Google Sheets |

### Detailed Endpoint Specifications

#### `POST /api/filter-information`

Retrieves filtered data from a specific source, automatically chunking responses that exceed 800 tokens.

**Request Body:**
```json
{
  "args": {
    "primary_name": "Sterling_Holidays",
    "source": "activities",
    "additional_filters": [
      {
        "column_name": "primary_name",
        "value": "Sterling Kodai Lake"
      },
      {
        "column_name": "Type",
        "value": "Indoor"
      }
    ]
  }
}
```

**Response:**
```json
{
  "data": [ /* Array of matching items */ ],
  "metadata": {
    "total_count": 20,
    "chunked": true,
    "total_chunks": 3,
    "current_chunk": 1,
    "estimated_token_count": 750
  }
}
```

#### `POST /api/get-chunk`

Retrieves a specific chunk of a large response.

**Request Body:**
```json
{
  "args": {
    "primary_name": "Sterling_Holidays",
    "source": "activities",
    "additional_filters": [
      {
        "column_name": "primary_name",
        "value": "Sterling Kodai Lake"
      },
      {
        "column_name": "Type",
        "value": "Indoor"
      }
    ],
    "chunk_number": 2
  }
}
```

**Response:**
Same format as `/api/filter-information` but returns the specified chunk.

#### `GET /api/sources/Sterling_Holidays`

Lists all available data sources for the specified primary name.

**Response:**
```json
{
  "primary_name": "Sterling_Holidays",
  "available_sources": [
    "activities",
    "buffet",
    "corporate-team-building",
    "destinations",
    "halls",
    "nearby-cities",
    "restaurant",
    "rooms-available",
    "seasonality-and-weather"
  ]
}
```

#### `GET /api/schema/Sterling_Holidays/activities`

Returns the column structure for a specific data source.

**Response:**
```json
{
  "primary_name": "Sterling_Holidays",
  "source": "activities",
  "columns": [
    "primary_name",
    "Type",
    "GAMES",
    "CHARGESPERPERSON",
    "DURATION",
    "ANYOutdoorINFORMATION",
    "MINMAXCAPONNUMBEROFGUESTS"
  ]
}
```

#### `POST /api/log-conversation`

Logs conversation details to Google Sheets.

**Request Body:**
```json
{
  "callTime": "2025-04-07T14:22:30Z",
  "phoneNumber": "9833620578",
  "callOutcome": "ROOM_AVAILABILITY",
  "customerName": "Jane Smith",
  "roomName": "Executive Room",
  "checkInDate": "2025-04-10",
  "checkOutDate": "2025-04-12",
  "numberOfGuests": "2",
  "callSummary": "The customer inquired about room availability and pricing for a weekend stay."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation logged successfully",
  "details": {
    "updatedCells": 9
  }
}
```

## Usage Examples

### Retrieving Indoor Activities at Sterling Kodai Lake

```javascript
const axios = require('axios');

async function getIndoorActivities() {
  try {
    const response = await axios.post('http://localhost:3000/api/filter-information', {
      args: {
        primary_name: "Sterling_Holidays",
        source: "activities",
        additional_filters: [
          {
            column_name: "primary_name",
            value: "Sterling Kodai Lake"
          },
          {
            column_name": "Type",
            "value": "Indoor"
          }
        ]
      }
    });
    
    console.log(`Found ${response.data.metadata.total_count} activities`);
    console.log(response.data.data);
    
    // If data is chunked, retrieve additional chunks if needed
    if (response.data.metadata.chunked && response.data.metadata.total_chunks > 1) {
      console.log(`Additional chunks available: ${response.data.metadata.total_chunks}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getIndoorActivities();
```

### Logging a Conversation

```javascript
const axios = require('axios');

async function logCustomerCall() {
  try {
    await axios.post('http://localhost:3000/api/log-conversation', {
      callTime: new Date().toISOString(),
      phoneNumber: '9876543210',
      callOutcome: 'ENQUIRY',
      customerName: 'John Doe',
      roomName: 'Deluxe Suite',
      checkInDate: '2025-05-15',
      checkOutDate: '2025-05-17',
      numberOfGuests: '3',
      callSummary: 'Customer inquired about amenities and availability for a family weekend.'
    });
    
    console.log('Call logged successfully');
  } catch (error) {
    console.error('Logging failed:', error.message);
  }
}

logCustomerCall();
```

## Google Sheets Integration

This system integrates with Google Sheets to log conversation details. Each conversation is recorded with:

- Call Time
- Phone Number
- Call Outcome (ENQUIRY, ROOM_AVAILABILITY, POST-BOOKING, MISC)
- Customer Name
- Room Name
- Check-in Date
- Check-out Date
- Number of Guests
- Call Summary

### Setup Requirements

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create a service account
4. Generate JSON credentials
5. Share your Google Sheet with the service account email
6. Add your Spreadsheet ID to the .env file

## Testing

Run the API server:
```bash
node src/index.js
```

In a separate terminal, run the test script:
```bash
node src/test.js
```

The test script checks all endpoints and verifies that the system correctly:
- Chunks large responses
- Filters data properly
- Logs conversations to Google Sheets

## Technical Implementation

### Token Chunking

The system estimates token count based on character length (approximately 4 characters per token) and chunks data to ensure each response is under 800 tokens.

```javascript
function chunkDataToFitTokenLimit(data, maxTokens = 800) {
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;
  
  for (const item of data) {
    // Estimate item token size
    const itemSize = Math.ceil(JSON.stringify(item).length / 4);
    
    // If adding this item would exceed the limit, start a new chunk
    if (currentSize + itemSize > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }
    
    // Add item to current chunk
    currentChunk.push(item);
    currentSize += itemSize;
  }
  
  // Add the last chunk if it has items
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
```

### Google Sheets Integration

The system uses the Google Sheets API to log conversation data, automatically creating the necessary sheet if it doesn't exist:

```javascript
async function logConversation(conversationData) {
  // Authentication and sheet setup
  
  // Format the data
  const values = [
    [
      conversationData.callTime,
      conversationData.phoneNumber,
      // ...other fields
    ]
  ];

  // Append to Google Sheet
  const result = await this.sheets.spreadsheets.values.append({
    spreadsheetId: this.spreadsheetId,
    range: `${this.sheetName}!A:I`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values }
  });
  
  return {
    success: true,
    updatedCells: result.data.updates.updatedCells
  };
}
```

## Troubleshooting

### Common Issues

1. **File not found errors**
   - Ensure CSV files are in the correct location (public/Sterling_Holidays/)
   - Check file naming (case-sensitive)

2. **Schema API timing out**
   - Large CSV files may cause timeouts. Consider optimizing the schema endpoint.

3. **Google Sheets authentication failing**
   - Verify credentials.json is correctly formatted
   - Confirm the spreadsheet is shared with the service account email

### Debugging Tips

1. Add console logs to pinpoint issues
2. Check file paths and permissions
3. Verify CSV file formatting
4. Test endpoints individually with Postman or similar tools

## License

This project is licensed under the MIT License.
