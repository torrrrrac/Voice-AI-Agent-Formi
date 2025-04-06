const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

require('dotenv').config(); // Load .env file

const app = express();
const PORT = process.env.PORT || 3000;

const SheetsLogger = require('./sheets');
const credentialsPath = path.join(__dirname, '..', 'credentials.json');
// Using environment variable for spreadsheet ID
const sheetsLogger = new SheetsLogger(credentialsPath);

// Initialize the sheets logger when the server starts
sheetsLogger.ensureSheetExists().catch(err => {
  console.error('Failed to initialize Google Sheets:', err);
});

// Add this new endpoint to log conversations
app.post('/api/log-conversation', async (req, res) => {
  try {
    const conversationData = req.body;
    
    // Validate required fields
    if (!conversationData) {
      return res.status(400).json({ error: 'Conversation data is required' });
    }
    
    // Log to Google Sheets
    const result = await sheetsLogger.logConversation(conversationData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Conversation logged successfully',
        details: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to log conversation',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error logging conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Function to chunk data to fit token limit
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

// Main filtering endpoint
app.post('/api/filter-information', async (req, res) => {
  try {
    // Extract parameters from request
    const { primary_name, source, additional_filters } = req.body.args;
    
    // Input validation
    if (!primary_name || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields: primary_name and source are required' 
      });
    }
    
    // Construct file path
    const filePath = path.join(__dirname, '..', 'public', primary_name, `${source}.csv`);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ 
        error: `File not found: ${source}.csv` 
      });
    }
    
    // Read and process the CSV file
    const results = [];
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Apply additional filters if provided
        let filteredData = results;
        if (additional_filters && additional_filters.length > 0) {
          filteredData = results.filter(row => {
            // Check if the row matches all additional filters
            return additional_filters.every(filter => {
              return row[filter.column_name] === filter.value;
            });
          });
        }
        
        // Check token size (approximation)
        const responseText = JSON.stringify(filteredData);
        const tokenCount = Math.ceil(responseText.length / 4);
        
        if (tokenCount > 800) {
          // Chunk the data to fit token limit
          const chunks = chunkDataToFitTokenLimit(filteredData);
          
          res.json({
            data: chunks[0], // Send only the first chunk
            metadata: {
              total_count: filteredData.length,
              chunked: true,
              total_chunks: chunks.length,
              current_chunk: 1,
              estimated_token_count: Math.ceil(JSON.stringify(chunks[0]).length / 4)
            }
          });
        } else {
          res.json({
            data: filteredData,
            metadata: {
              total_count: filteredData.length,
              chunked: false,
              estimated_token_count: tokenCount
            }
          });
        }
      });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get specific chunks
app.post('/api/get-chunk', async (req, res) => {
  try {
    const { primary_name, source, additional_filters, chunk_number } = req.body.args;
    
    // Input validation
    if (!primary_name || !source || !chunk_number) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }
    
    // Get the data (reusing the same logic)
    const filePath = path.join(__dirname, '..', 'public', primary_name, `${source}.csv`);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: `File not found: ${source}.csv` });
    }
    
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Filter the data
        let filteredData = results;
        if (additional_filters && additional_filters.length > 0) {
          filteredData = results.filter(row => {
            return additional_filters.every(filter => {
              return row[filter.column_name] === filter.value;
            });
          });
        }
        
        // Chunk the data
        const chunks = chunkDataToFitTokenLimit(filteredData);
        
        // Validate chunk number
        if (chunk_number < 1 || chunk_number > chunks.length) {
          return res.status(400).json({ error: 'Invalid chunk number' });
        }
        
        // Return the requested chunk
        res.json({
          data: chunks[chunk_number - 1],
          metadata: {
            total_count: filteredData.length,
            chunked: true,
            total_chunks: chunks.length,
            current_chunk: chunk_number,
            estimated_token_count: Math.ceil(JSON.stringify(chunks[chunk_number - 1]).length / 4)
          }
        });
      });
  } catch (error) {
    console.error('Error processing chunk request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add an endpoint to get all available sources
// Add an endpoint to get column information for a source
app.get('/api/schema/:primary_name/:source', async (req, res) => {
    try {
      const { primary_name, source } = req.params;
      
      if (!primary_name || !source) {
        return res.status(400).json({ error: 'Primary name and source are required' });
      }
      
      // Try with different naming conventions
      let filePath = path.join(__dirname, '..', 'public', primary_name, `${source}.csv`);
      
      console.log(`Looking for file at: ${filePath}`);
      
      if (!await fs.pathExists(filePath)) {
        console.log(`File not found at: ${filePath}, trying alternative paths...`);
        
        // Try with hyphen instead of underscore
        const hyphenSource = source.replace(/_/g, '-');
        filePath = path.join(__dirname, '..', 'public', primary_name, `${hyphenSource}.csv`);
        
        if (!await fs.pathExists(filePath)) {
          return res.status(404).json({ error: `File not found: ${source}.csv` });
        }
      }
      
      // Use fs.readFile instead of streaming for more predictable behavior
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      // Get the first line for headers
      const lines = fileContent.split('\n');
      if (lines.length === 0) {
        return res.status(400).json({ error: 'Empty CSV file' });
      }
      
      const headerLine = lines[0].trim();
      const headers = headerLine.split(',').map(header => header.trim().replace(/^"|"$/g, ''));
      
      res.json({
        primary_name,
        source,
        columns: headers
      });
    } catch (error) {
      console.error('Error getting schema:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export for testing