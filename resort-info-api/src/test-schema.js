// Create a new file 'test-schema.js' with this content
const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Get the list of sources first to pick a valid one
async function testSchema() {
  try {
    // First get sources
    console.log('Getting sources...');
    const sourcesResponse = await axios.get(`${API_URL}/api/sources/Sterling_Holidays`);
    const sources = sourcesResponse.data.available_sources;
    console.log('Available sources:', sources);
    
    if (sources.length > 0) {
      // Try the first available source
      const source = sources[0];
      console.log(`Testing schema for source: ${source}`);
      
      const response = await axios.get(
        `${API_URL}/api/schema/Sterling_Holidays/${source}`,
        { timeout: 20000 }
      );
      
      console.log('Schema test succeeded!');
      console.log('Columns:', response.data.columns);
    } else {
      console.log('No sources available to test schema');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSchema();