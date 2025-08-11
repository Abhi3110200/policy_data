import { google, drive_v3 } from "googleapis";
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Recreate __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// OAuth2 credentials
const client_id = process.env.GOOGLE_DRIVE_CLIENT_ID!;
const client_secret = process.env.GOOGLE_DRIVE_SECRET_KEY!;
const redirect_uri = process.env.GOOGLE_DRIVE_REDIRECT_URL!;
const refresh_token = process.env.GOOGLE_DRIVE_REFRESH_TOKEN!;

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
oauth2Client.setCredentials({ refresh_token });

// Create Google Drive API client
const drive: drive_v3.Drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/**
 * Create a folder in Google Drive (if it doesn't exist)
 */
async function getOrCreateFolder(folderName: string): Promise<string> {
  try {
    // Check if folder already exists
    const searchRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: "files(id, name)",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      console.log(`📁 Folder "${folderName}" already exists.`);
      return searchRes.data.files[0].id!;
    }

    // Create folder if not found
    const createRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    console.log(`✅ Folder "${folderName}" created.`);
    return createRes.data.id!;
  } catch (error) {
    console.error('Error in getOrCreateFolder:', error);
    throw error;
  }
}

/**
 * Upload a file to Google Drive
 */
async function uploadFileToDrive(file: File, folderId: string): Promise<{
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}> {
  try {
    const fileMetadata: drive_v3.Schema$File = {
      name: file.name,
      parents: [folderId],
    };

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const media = {
      mimeType: file.type,
      body: Readable.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      supportsAllDrives: true,
      fields: 'id, name, webViewLink, webContentLink',
    });

    // Make the file publicly accessible
    if (response.data.id) {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    }

    return {
      id: response.data.id || '',
      name: response.data.name || file.name,
      webViewLink: response.data.webViewLink || '',
      webContentLink: response.data.webContentLink || '',
    };
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    throw error;
  }
}

/**
 * Handle POST request to upload files
 */
export async function POST(request: Request) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No file provided',
          message: 'Please provide a file to upload' 
        }, 
        { status: 400 }
      );
    }

    // Validate file type (only allow PDFs)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid file type',
          message: 'Only PDF files are allowed' 
        },
        { status: 400 }
      );
    }

    // Get or create the target folder
    const folderName = 'Policy Data';
    const folderId = await getOrCreateFolder(folderName);

    // Upload the file
    const result = await uploadFileToDrive(file, folderId);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      webViewLink: result.webViewLink,
      file: {
        id: result.id,
        name: result.name,
        downloadLink: result.webContentLink
      }
    });
    
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process file upload',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request to list files in the folder
 */
export async function GET() {
  try {
    const folderName = 'Policy Data';
    const folder = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (!folder.data.files || folder.data.files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files found',
        files: [],
      });
    }

    const folderId = folder.data.files[0].id;
    
    // List all files in the folder
    const files = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink, webContentLink, mimeType, size, createdTime, modifiedTime)',
    });

    return NextResponse.json({
      success: true,
      folder: {
        id: folderId,
        name: folderName,
      },
      files: files.data.files || [],
    });
    
  } catch (error: unknown) {
    console.error('Error listing files:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to list files', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
