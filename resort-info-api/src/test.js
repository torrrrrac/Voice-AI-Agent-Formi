const axios = require('axios');

// Base URL for the API
const API_URL = 'http://localhost:3000';

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
    console.log('First Item:', response.data.data[0]);
    
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
    const response = await axios.get(`${API_URL}/api/schema/Sterling_Holidays/activities`);
    
    console.log('Status:', response.status);
    console.log('Primary Name:', response.data.primary_name);
    console.log('Source:', response.data.source);
    console.log('Columns:', response.data.columns);
  } catch (error) {
    console.error('Error testing schema API:', error.response ? error.response.data : error.message);
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
    
    // Finally test the main filtering functionality
    await testFilterAPI();
    
    console.log('\n=== All Tests Completed ===');
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

// Run the tests
runAllTests();