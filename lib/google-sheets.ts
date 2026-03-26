import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let sheetsAPI: any = null;

export async function initGoogleSheets() {
  if (sheetsAPI) return sheetsAPI;

  try {
    let keyFile;

    // 優先讀取環境變數（用於 Vercel）
    if (process.env.GOOGLE_SERVICE_KEY) {
      keyFile = JSON.parse(process.env.GOOGLE_SERVICE_KEY);
    } else {
      // 本地開發環境讀取檔案
      const keyFilePath = path.resolve(process.cwd(), '..', 'mapserch-483507-71e31311e1cf.json');
      keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));
    }

    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: SCOPES,
    });

    sheetsAPI = google.sheets({ version: 'v4', auth });
    return sheetsAPI;
  } catch (error) {
    console.error('Failed to init Google Sheets:', error);
    throw error;
  }
}

export async function getSheetData(spreadsheetId: string, range: string) {
  const sheets = await initGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values || [];
}

export async function appendSheetData(
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  const sheets = await initGoogleSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

export async function updateSheetData(
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  const sheets = await initGoogleSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

export async function batchUpdateSheetData(
  spreadsheetId: string,
  updates: { range: string; values: any[][] }[]
) {
  if (updates.length === 0) return
  const sheets = await initGoogleSheets()
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates.map(u => ({ range: u.range, values: u.values })),
    },
  })
}

export async function clearSheet(spreadsheetId: string, range: string) {
  const sheets = await initGoogleSheets();
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });
}

export async function batchHideUnhideRows(
  spreadsheetId: string,
  sheetId: number,
  operations: { rowIndex: number; hide: boolean }[]
) {
  if (operations.length === 0) return
  const sheets = await initGoogleSheets()
  const requests: any[] = []

  // 凍結第一列（標題列）
  requests.push({
    updateSheetProperties: {
      properties: {
        sheetId,
        gridProperties: { frozenRowCount: 1 },
      },
      fields: 'gridProperties.frozenRowCount',
    },
  })

  // 隱藏/取消隱藏列（永遠不動第一列）
  for (const { rowIndex, hide } of operations) {
    if (rowIndex <= 1) continue // 保護標題列
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex - 1, // 0-based
          endIndex: rowIndex,
        },
        properties: { hiddenByUser: hide },
        fields: 'hiddenByUser',
      },
    })
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  })
}

export async function ensureSheetExists(spreadsheetId: string, sheetName: string) {
  const sheets = await initGoogleSheets();
  try {
    // Try to get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Check if sheet already exists
    const existingSheet = metadata.data.sheets?.find(
      (s: any) => s.properties.title === sheetName
    );

    if (existingSheet) {
      return existingSheet.properties.sheetId;
    }

    // Create new sheet
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    return response.data.replies?.[0]?.addSheet?.properties?.sheetId;
  } catch (error) {
    console.error('Error ensuring sheet exists:', error);
    throw error;
  }
}
