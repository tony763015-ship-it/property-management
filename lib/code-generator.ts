import { getSheetData, updateSheetData } from './google-sheets';
import { extractRoomCount } from './excel-parser';

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || '';

interface DistrictCodeMap {
  [city: string]: {
    [district: string]: string;
  };
}

interface SequenceMap {
  [key: string]: number;
}

let districtCodeMap: DistrictCodeMap = {};
let sequenceMap: SequenceMap = {};
let nextCityIndex: { [city: string]: number } = {};

export async function initializeCodeGenerator() {
  try {
    // Load district codes from Google Sheet
    const districtData = await getSheetData(SHEET_ID, '地區編碼對照!A:D');
    districtCodeMap = {};
    nextCityIndex = {};

    // Parse district codes
    // Expected format: City | District | CityCode | DistrictCode
    for (let i = 1; i < districtData.length; i++) {
      const row = districtData[i];
      if (row.length >= 4) {
        const city = row[0]?.toString().trim();
        const district = row[1]?.toString().trim();
        const cityCode = row[2]?.toString().trim();
        const districtCode = row[3]?.toString().trim();

        if (city && district && cityCode && districtCode) {
          if (!districtCodeMap[city]) {
            districtCodeMap[city] = {};
          }
          districtCodeMap[city][district] = districtCode;

          // Track next index for each city
          if (!nextCityIndex[city]) {
            nextCityIndex[city] = 0;
          }
          const nextIdx = districtCode.charCodeAt(0) - 64; // A=1, B=2...
          nextCityIndex[city] = Math.max(nextCityIndex[city], nextIdx);
        }
      }
    }

    // Load sequence numbers from Google Sheet
    const seqData = await getSheetData(SHEET_ID, '序號記錄!A:B');
    sequenceMap = {};

    // Parse sequences
    // Expected format: SeqKey | LastNumber
    for (let i = 1; i < seqData.length; i++) {
      const row = seqData[i];
      if (row.length >= 2) {
        const seqKey = row[0]?.toString().trim();
        const lastNum = parseInt(row[1]?.toString() || '0');
        if (seqKey) {
          sequenceMap[seqKey] = lastNum;
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize code generator:', error);
  }
}

export async function generateCode(
  city: string,
  district: string,
  roomType: string
): Promise<string> {
  // Ensure initialized
  if (Object.keys(districtCodeMap).length === 0) {
    await initializeCodeGenerator();
  }

  // Get city code (A, B, C... based on city)
  const cityCode = getCityCode(city);

  // Get or create district code
  const districtCode = await getOrCreateDistrictCode(city, district, cityCode);

  // Get room code (1, 2, 3... based on room count)
  const roomCount = extractRoomCount(roomType);
  const roomCode = roomCount.toString();

  // Get next sequence number
  const seqKey = cityCode + districtCode + roomCode;
  const nextSeq = await getNextSequence(seqKey);

  return `${seqKey}${String(nextSeq).padStart(3, '0')}`;
}

function getCityCode(city: string): string {
  // 正規化城市名稱（處理繁簡字差異）
  const normalizedCity = city
    .replace(/臺/g, '台')
    .trim();

  // Fixed mapping for cities
  const cityMap: { [key: string]: string } = {
    '台北市': 'A',
    '新北市': 'B',
    '台中市': 'C',
    '台南市': 'D',
    '高雄市': 'E',
    '桃園市': 'F',
    '新竹市': 'G',
    '新竹縣': 'H',
    '苗栗縣': 'I',
    '彰化縣': 'J',
    '南投縣': 'K',
    '雲林縣': 'L',
    '嘉義市': 'M',
    '嘉義縣': 'N',
    '屏東縣': 'O',
    '宜蘭縣': 'P',
    '花蓮縣': 'Q',
    '台東縣': 'R',
    '澎湖縣': 'S',
    '金門縣': 'T',
    '馬祖縣': 'U',
  };

  return cityMap[normalizedCity] || 'Z';
}

async function getOrCreateDistrictCode(
  city: string,
  district: string,
  cityCode: string
): Promise<string> {
  if (!districtCodeMap[city]) {
    districtCodeMap[city] = {};
  }

  if (districtCodeMap[city][district]) {
    return districtCodeMap[city][district];
  }

  // Create new district code
  if (!nextCityIndex[city]) {
    nextCityIndex[city] = 0;
  }
  nextCityIndex[city]++;

  const districtCode = String.fromCharCode(64 + nextCityIndex[city]); // 1->A, 2->B...
  districtCodeMap[city][district] = districtCode;

  // Save to Google Sheet
  try {
    await updateSheetData(SHEET_ID, '地區編碼對照!A1', [
      ['城市', '行政區', '城市代碼', '地區代碼'],
    ]);

    const newRows = [];
    for (const [c, districts] of Object.entries(districtCodeMap)) {
      const cCode = getCityCode(c);
      for (const [d, dCode] of Object.entries(districts)) {
        newRows.push([c, d, cCode, dCode]);
      }
    }

    if (newRows.length > 0) {
      await updateSheetData(SHEET_ID, '地區編碼對照!A2', newRows);
    }
  } catch (error) {
    console.error('Failed to save district code:', error);
  }

  return districtCode;
}

async function getNextSequence(seqKey: string): Promise<number> {
  const current = sequenceMap[seqKey] || 0;
  const next = current + 1;
  sequenceMap[seqKey] = next;

  // Update Google Sheet
  try {
    const allSeqs = Object.entries(sequenceMap).map(([key, num]) => [key, num]);
    if (allSeqs.length > 0) {
      await updateSheetData(SHEET_ID, '序號記錄!A1', [
        ['序號代碼', '最大序號'],
        ...allSeqs,
      ]);
    }
  } catch (error) {
    console.error('Failed to save sequence:', error);
  }

  return next;
}
