import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
]

let driveAPI: any = null

async function initDrive() {
  if (driveAPI) return driveAPI
  let keyFile
  if (process.env.GOOGLE_SERVICE_KEY) {
    keyFile = JSON.parse(process.env.GOOGLE_SERVICE_KEY)
  } else {
    const keyFilePath = path.resolve(process.cwd(), '..', 'mapserch-483507-71e31311e1cf.json')
    keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'))
  }
  const auth = new google.auth.GoogleAuth({ credentials: keyFile, scopes: SCOPES })
  driveAPI = google.drive({ version: 'v3', auth })
  return driveAPI
}

const OWNER_EMAIL = process.env.GOOGLE_OWNER_EMAIL || ''

async function transferOwnership(fileId: string) {
  if (!OWNER_EMAIL) return
  const drive = await initDrive()
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'owner', type: 'user', emailAddress: OWNER_EMAIL },
      transferOwnership: true,
      sendNotificationEmail: false,
    })
  } catch { /* 轉移失敗不中斷流程 */ }
}

// 建立或取得資料夾（只建不刪）
export async function ensureDriveFolder(parentId: string, folderName: string): Promise<string> {
  const drive = await initDrive()
  const res = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })
  if (res.data.files?.length > 0) return res.data.files[0].id

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })
  await transferOwnership(folder.data.id)
  return folder.data.id
}

// 建立或取得 Google 文件（物件介紹）
export async function ensurePropertyDoc(folderId: string, docName: string): Promise<string> {
  const drive = await initDrive()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id, name)',
  })
  if (res.data.files?.length > 0) return res.data.files[0].id

  const doc = await drive.files.create({
    requestBody: {
      name: docName,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    },
    fields: 'id',
  })
  await transferOwnership(doc.data.id)
  return doc.data.id
}

// 取得資料夾內所有圖片（封面優先，其餘任意命名的 jpg/png/webp 都抓）
export async function getFolderImages(folderId: string): Promise<{ id: string; name: string; isCover: boolean }[]> {
  const drive = await initDrive()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/webp' or mimeType='image/gif') and trashed=false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  })
  const files = (res.data.files || []) as { id: string; name: string }[]
  return files
    .map(f => ({ id: f.id, name: f.name, isCover: f.name.startsWith('封面') }))
    .sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0))
}

// 讀取 Google 文件內容（純文字）
export async function getDocText(folderId: string): Promise<string> {
  const drive = await initDrive()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id)',
  })
  if (!res.data.files?.length) return ''

  const docId = res.data.files[0].id
  const exported = await drive.files.export({
    fileId: docId,
    mimeType: 'text/plain',
  }, { responseType: 'text' })
  return (exported.data as string).trim()
}

// 取得圖片資料（用於代理給 LIFF 顯示）
export async function getDriveImageBuffer(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const drive = await initDrive()
  // 先取得 MIME type
  const meta = await drive.files.get({ fileId, fields: 'mimeType' })
  const mimeType = meta.data.mimeType || 'image/jpeg'
  // 下載內容
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(res.data as ArrayBuffer)
  return { buffer, mimeType }
}
