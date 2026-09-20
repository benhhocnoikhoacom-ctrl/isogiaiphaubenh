import { GoogleAuth } from 'google-auth-library';
import { ISO_DRIVE_FOLDER_ID } from '@/types/iso';

function getCredentials() {
  const serviceAccountBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('GOOGLE_CREDENTIALS_BASE64 is not set.');
  }
  const buffer = Buffer.from(serviceAccountBase64, 'base64');
  return JSON.parse(buffer.toString('utf-8'));
}

export async function uploadFileToDrive(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<{ fileId: string; webViewLink: string }> {
  const creds = getCredentials();
  const auth = new GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  if (!token) {
    throw new Error('Failed to obtain Google Drive access token');
  }

  // 1. Upload file metadata and content using multipart upload
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [ISO_DRIVE_FOLDER_ID],
    mimeType: mimeType || 'application/octet-stream'
  };

  const multipartRequestBody = Buffer.concat([
    Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType || 'application/octet-stream'}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n'
    ),
    Buffer.from(fileBuffer.toString('base64')),
    Buffer.from(closeDelimiter)
  ]);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    console.error('Google Drive Upload Error:', uploadData);
    throw new Error(uploadData?.error?.message || 'Google Drive API error');
  }

  const fileId = uploadData.id;
  let webViewLink = uploadData.webViewLink;

  // 2. Set file permission to 'anyone with the link can view'
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (err) {
    console.warn('Could not set public permission on uploaded file:', err);
  }

  if (!webViewLink) {
    webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  return {
    fileId,
    webViewLink
  };
}
