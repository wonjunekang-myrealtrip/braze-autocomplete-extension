// API Configuration
export const API_CONFIG = {
  // Google Sheets API
  GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY || 'AIzaSyBUZh6hu264vtDfcVkGA0HO9txuN6fFuyE',
  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID || '1W5mZhAFws47z3gvOs9Gttm3setCpE_yK4YCAk7FIukE',
  GOOGLE_SHEETS_RANGE: process.env.GOOGLE_SHEETS_RANGE || 'Custom%20Attributes!A1:K1000',
  
  // MyRealTrip APIs
  MRT_API_BASE: 'https://api3.myrealtrip.com',
  MRT_SEARCH_API: 'https://www.myrealtrip.com',
};

export const getGoogleSheetsUrl = () => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.GOOGLE_SHEETS_ID}/values/${API_CONFIG.GOOGLE_SHEETS_RANGE}?key=${API_CONFIG.GOOGLE_SHEETS_API_KEY}`;
};
