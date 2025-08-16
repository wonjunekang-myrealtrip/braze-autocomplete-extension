// API Configuration
// Chrome Extension에서는 빌드 시점에 환경 변수를 주입해야 함
export const API_CONFIG = {
  // Google Sheets API - import.meta.env를 통해 Vite 환경 변수 접근
  GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '',
  GOOGLE_SHEETS_ID: import.meta.env.VITE_GOOGLE_SHEETS_ID || '',
  GOOGLE_SHEETS_RANGE: import.meta.env.VITE_GOOGLE_SHEETS_RANGE || '',
  GOOGLE_SHEETS_EVENTS_RANGE: import.meta.env.VITE_GOOGLE_SHEETS_EVENTS_RANGE || 'Custom%20Events!A1:K1000',
  
  // MyRealTrip APIs
  MRT_API_BASE: 'https://api3.myrealtrip.com',
  MRT_SEARCH_API: 'https://www.myrealtrip.com',
};

export const getGoogleSheetsUrl = () => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.GOOGLE_SHEETS_ID}/values/${API_CONFIG.GOOGLE_SHEETS_RANGE}?key=${API_CONFIG.GOOGLE_SHEETS_API_KEY}`;
};

export const getGoogleSheetsEventsUrl = () => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.GOOGLE_SHEETS_ID}/values/${API_CONFIG.GOOGLE_SHEETS_EVENTS_RANGE}?key=${API_CONFIG.GOOGLE_SHEETS_API_KEY}`;
};
