const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class SheetsLogger {
  constructor(credentialsPath, spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.sheetName = 'Conversation Logs';
    this.auth = null;
    this.sheets = null;
    this.credentialsPath = credentialsPath;
    this.initialized = false;
  }

  // Initialize the Google Sheets connection
  async initialize() {
    try {
      // Load credentials
      const content = fs.readFileSync(this.credentialsPath);
      const credentials = JSON.parse(content);
      
      // Create JWT client
      const { client_email, private_key } = credentials;
      const jwtClient = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      // Authorize
      await jwtClient.authorize();
      this.auth = jwtClient;
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.initialized = true;
      
      console.log('Google Sheets logger initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      return false;
    }
  }

  // Log conversation data to the spreadsheet
  async logConversation(conversationData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Format the data for the sheet
      const values = [
        [
          conversationData.callTime || new Date().toISOString(),
          conversationData.phoneNumber || 'N/A',
          conversationData.callOutcome || 'MISC.',
          conversationData.customerName || 'N/A',
          conversationData.roomName || 'N/A',
          conversationData.checkInDate || 'N/A',
          conversationData.checkOutDate || 'N/A',
          conversationData.numberOfGuests || 'N/A',
          conversationData.callSummary || 'N/A'
        ]
      ];

      // Append the data to the sheet
      const result = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:I`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values
        }
      });

      console.log(`${result.data.updates.updatedCells} cells updated in Google Sheets`);
      return {
        success: true,
        updatedCells: result.data.updates.updatedCells
      };
    } catch (error) {
      console.error('Error logging to Google Sheets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if sheet exists, create it if it doesn't
  async ensureSheetExists() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get existing sheets
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      // Check if our sheet exists
      const sheetExists = response.data.sheets.some(
        sheet => sheet.properties.title === this.sheetName
      );

      if (!sheetExists) {
        // Create the sheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: this.sheetName
                  }
                }
              }
            ]
          }
        });

        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1:I1`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              'Call Time', 
              'Phone Number', 
              'Call Outcome', 
              'Customer Name', 
              'Room Name', 
              'Check In Date', 
              'Check Out Date', 
              'Number of Guests', 
              'Call Summary'
            ]]
          }
        });

        console.log(`Sheet "${this.sheetName}" created with headers`);
      }

      return true;
    } catch (error) {
      console.error('Error ensuring sheet exists:', error);
      return false;
    }
  }
}

module.exports = SheetsLogger;