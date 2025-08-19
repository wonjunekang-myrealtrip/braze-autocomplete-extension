// Vite 환경 변수 타입 선언
declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_SHEETS_API_KEY?: string;
    readonly VITE_GOOGLE_SHEETS_ID?: string;
    readonly VITE_GOOGLE_SHEETS_RANGE?: string;
    readonly VITE_GOOGLE_SHEETS_EVENTS_RANGE?: string;
    // NHN Cloud (FriendTalk)
    readonly VITE_NHN_CLOUD_URL?: string;
    readonly VITE_NHN_CLOUD_APP_KEY?: string;
    readonly VITE_NHN_CLOUD_SECRET_KEY?: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// API Configuration
// Chrome Extension에서는 빌드 시점에 환경 변수를 주입해야 함
export const API_CONFIG = {
  // Google Sheets API - import.meta.env를 통해 Vite 환경 변수 접근
  GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '',
  GOOGLE_SHEETS_ID: import.meta.env.VITE_GOOGLE_SHEETS_ID || '',
  GOOGLE_SHEETS_RANGE: import.meta.env.VITE_GOOGLE_SHEETS_RANGE || '',
  GOOGLE_SHEETS_EVENTS_RANGE: import.meta.env.VITE_GOOGLE_SHEETS_EVENTS_RANGE || '',
  
  // MyRealTrip APIs
  MRT_API_BASE: 'https://api3.myrealtrip.com',
  MRT_SEARCH_API: 'https://www.myrealtrip.com',

  // NHN Cloud (FriendTalk)
  NHN_CLOUD_URL: import.meta.env.VITE_NHN_CLOUD_URL || '',
  NHN_CLOUD_APP_KEY: import.meta.env.VITE_NHN_CLOUD_APP_KEY || '',
  NHN_CLOUD_SECRET_KEY: import.meta.env.VITE_NHN_CLOUD_SECRET_KEY || ''
};

export const getGoogleSheetsUrl = () => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.GOOGLE_SHEETS_ID}/values/${API_CONFIG.GOOGLE_SHEETS_RANGE}?key=${API_CONFIG.GOOGLE_SHEETS_API_KEY}`;
};

export const getGoogleSheetsEventsUrl = () => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.GOOGLE_SHEETS_ID}/values/${API_CONFIG.GOOGLE_SHEETS_EVENTS_RANGE}?key=${API_CONFIG.GOOGLE_SHEETS_API_KEY}`;
};
