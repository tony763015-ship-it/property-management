import * as XLSX from 'xlsx';

export interface PropertyData {
  city: string;
  district: string;
  address: string;
  roomType: string;
  price: number;
  area?: number;
  floor?: string;
  phone?: string;
  remarks?: string;
  [key: string]: any;
}

// Excel 日期序號轉 YYYY/MM/DD
function excelDateToString(serial: number): string {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400 * 1000;
  const date = new Date(utc_value);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

export async function parseRagicExcel(
  buffer: Buffer,
  sheetName?: string
): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // 自動偵測分頁：優先用指定名稱，否則用第一個分頁
    let targetSheet = sheetName;
    if (!targetSheet || !workbook.SheetNames.includes(targetSheet)) {
      // 嘗試找包含「匯出」或「物件」的分頁
      targetSheet = workbook.SheetNames.find(name =>
        name.includes('匯出') || name.includes('物件') || name.includes('租賃')
      );

      // 如果沒找到，用第一個分頁
      if (!targetSheet) {
        targetSheet = workbook.SheetNames[0];
      }
    }

    if (!targetSheet) {
      throw new Error(`找不到任何可用的分頁。可用分頁：${workbook.SheetNames.join(', ')}`);
    }

    const worksheet = workbook.Sheets[targetSheet];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });

    // 日期欄位名稱列表
    const dateFields = ['委託時間(起)', '委託時間(迄)', '建築完成日期(民國)', '廣告到期時間']

    // 清除所有欄位名稱的前後空白，並轉換日期格式
    return rows
      .filter((row: any) => Object.values(row).some(v => v !== null && v !== undefined && v !== ''))
      .map((row: any) => {
        const cleaned: any = {};
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim();
          const val = row[key];
          // 日期欄位：把 Excel 序號轉成 YYYY/MM/DD
          if (dateFields.includes(cleanKey) && typeof val === 'number') {
            cleaned[cleanKey] = excelDateToString(val);
          } else {
            cleaned[cleanKey] = val;
          }
        }
        return cleaned;
      });
  } catch (error) {
    console.error('Error parsing Ragic Excel:', error);
    throw error;
  }
}

function normalizePropertyData(row: any): PropertyData {
  // Ragic field mapping - adjust based on actual field names
  const fieldMapping: { [key: string]: string[] } = {
    city: ['城市', 'city', '都市', '縣市'],
    district: ['行政區', '行政区', 'district', '區', '鄉鎮市區', '地區'],
    address: ['地址', 'address', '詳細地址', '完整地址'],
    roomType: ['房型', 'roomType', '房間類型', '類型', '房間', '戶型', '格局'],
    price: ['租金', '月租', 'price', '租価', '月租金'],
    area: ['坪數', 'area', '面積', '坪', '建坪'],
    floor: ['樓層', 'floor', '層數', '樓'],
    phone: ['聯絡電話', '電話', 'phone', '聯絡方式', '手機'],
    remarks: ['備註', 'remarks', '說明', '備註欄'],
  };

  const normalized: PropertyData = {
    city: '',
    district: '',
    address: '',
    roomType: '',
    price: 0,
  };

  for (const [key, possibleNames] of Object.entries(fieldMapping)) {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        if (key === 'price') {
          normalized[key] = parseInt(String(row[name]).replace(/[^\d]/g, '')) || 0;
        } else if (key === 'area') {
          normalized[key] = parseFloat(String(row[name]).replace(/[^\d.]/g, '')) || undefined;
        } else {
          normalized[key] = String(row[name]).trim();
        }
        break;
      }
    }
  }

  // Extract room count from roomType (e.g., "2房1廳" -> 2)
  const roomMatch = normalized.roomType.match(/(\d+)房/);
  if (!roomMatch) {
    throw new Error(`Invalid room type format: ${normalized.roomType}`);
  }

  return normalized;
}

export function extractRoomCount(roomType: string): number {
  if (!roomType) {
    throw new Error('房型欄位為空');
  }

  const typeStr = String(roomType).trim();

  // 嘗試包含「套房」（最優先）
  if (typeStr.includes('套房')) return 0; // 套房編碼為 0

  // 嘗試格式：「2房2廳2衛1陽1樓」、「2房」、「2房1廳」等
  const match = typeStr.match(/(\d+)\s*房/);
  if (match) {
    const roomNum = parseInt(match[1]);
    // 0房表示套房
    if (roomNum === 0) return 0;
    return roomNum;
  }

  // 嘗試純數字格式
  const numMatch = typeStr.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1]);

  // 無法解析，預設為1房
  console.warn(`房型格式可能不標準：${roomType}，預設為1房`);
  return 1;
}
