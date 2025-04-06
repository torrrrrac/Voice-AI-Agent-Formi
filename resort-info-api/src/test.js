const axios = require('axios');
require('dotenv').config(); // Load environment variables

// Base URL for the API
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test the filter-information endpoint
async function testFilterAPI() {
  try {
    console.log('\n--- Testing Filter Information API ---');
    const response = await axios.post(`${API_URL}/api/filter-information`, {
      args: {
        primary_name: "Sterling_Holidays",
        source: "activities",
        additional_filters: [
          {
            column_name: "primary_name",
            value: "Sterling Kodai Lake"
          },
          {
            column_name: "Type",
            value: "Indoor"
          }
        ]
      }
    });
    
    console.log('Status:', response.status);
    console.log('Metadata:', response.data.metadata);
    console.log('Data Count:', response.data.data.length);
    if (response.data.data.length > 0) {
      console.log('First Item:', response.data.data[0]);
    } else {
      console.log('No data found matching the filters');
    }
    
    // If response is chunked, test the get-chunk endpoint
    if (response.data.metadata.chunked && response.data.metadata.total_chunks > 1) {
      await testGetChunk(response.data.metadata.total_chunks);
    }
  } catch (error) {
    console.error('Error testing filter API:', error.response ? error.response.data : error.message);
  }
}

// Test the get-chunk endpoint
async function testGetChunk(totalChunks) {
  try {
    console.log('\n--- Testing Get Chunk API ---');
    // Get the second chunk
    const chunkToGet = 2;
    if (chunkToGet <= totalChunks) {
      const response = await axios.post(`${API_URL}/api/get-chunk`, {
        args: {
          primary_name: "Sterling_Holidays",
          source: "activities",
          additional_filters: [
            {
              column_name: "primary_name",
              value: "Sterling Kodai Lake"
            },
            {
              column_name: "Type",
              value: "Indoor"
            }
          ],
          chunk_number: chunkToGet
        }
      });
      
      console.log('Status:', response.status);
      console.log('Metadata:', response.data.metadata);
      console.log('Data Count:', response.data.data.length);
      if (response.data.data.length > 0) {
        console.log('First Item in Chunk:', response.data.data[0]);
      } else {
        console.log('No data in this chunk');
      }
    } else {
      console.log(`Skipping chunk test: only ${totalChunks} chunks available.`);
    }
  } catch (error) {
    console.error('Error testing get chunk API:', error.response ? error.response.data : error.message);
  }
}

// Test the sources endpoint
async function testSourcesAPI() {
  try {
    console.log('\n--- Testing Sources API ---');
    const response = await axios.get(`${API_URL}/api/sources/Sterling_Holidays`);
    
    console.log('Status:', response.status);
    console.log('Primary Name:', response.data.primary_name);
    console.log('Available Sources:', response.data.available_sources);
  } catch (error) {
    console.error('Error testing sources API:', error.response ? error.response.data : error.message);
  }
}

// Test the schema endpoint
async function testSchemaAPI() {
  try {
    console.log('\n--- Testing Schema API ---');
    // Set a timeout to prevent hanging
    const response = await axios.get(`${API_URL}/api/schema/Sterling_Holidays/activities`, {
      timeout: 5000 // 5 second timeout
    });
    
    console.log('Status:', response.status);
    console.log('Primary Name:', response.data.primary_name);
    console.log('Source:', response.data.source);
    console.log('Columns:', response.data.columns);
  } catch (error) {
    console.error('Error testing schema API:', 
      error.code === 'ECONNABORTED' 
        ? 'Request timed out' 
        : (error.response ? error.response.data : error.message)
    );
    
    // Continue with next tests even if this one fails
    console.log('Skipping to next test due to error in schema API test');
  }
}

// Test the conversation logging endpoint
async function testConversationLogging() {
  try {
    console.log('\n--- Testing Conversation Logging API ---');
    const response = await axios.post(`${API_URL}/api/log-conversation`, {
      callTime: new Date().toISOString(),
      phoneNumber: '9833620578',
      callOutcome: 'ROOM_AVAILABILITY',
      customerName: 'Test User',
      roomName: 'Executive Room',
      checkInDate: '2025-04-07',
      checkOutDate: '2025-04-09',
      numberOfGuests: '2',
      callSummary: 'The user inquired about room availability and pricing for a two-night stay.'
    });
    
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    console.log('Details:', response.data.details);
  } catch (error) {
    console.error('Error testing conversation logging:', error.response ? error.response.data : error.message);
  }
}

// Test health check endpoint
async function testHealthCheck() {
  try {
    console.log('\n--- Testing Health Check API ---');
    const response = await axios.get(`${API_URL}/`);
    
    console.log('Status:', response.status);
    console.log('API Status:', response.data.status);
    console.log('Message:', response.data.message);
    console.log('Available Endpoints:', response.data.endpoints);
  } catch (error) {
    console.error('Error testing health check API:', error.response ? error.response.data : error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    console.log('=== Starting API Tests ===');
    
    // First test health check
    await testHealthCheck();
    
    // Then test sources
    await testSourcesAPI();
    
    // Then test schema
    await testSchemaAPI();
    
    // Test the main filtering functionality
    await testFilterAPI();
    
    // Finally test the conversation logging
    await testConversationLogging();
    
    console.log('\n=== All Tests Completed ===');
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

// Run the tests
runAllTests();