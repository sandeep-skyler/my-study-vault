---
name: File upload UX
description: Files are NOT auto-uploaded to Google Drive; user pastes a Drive shareable link manually
---

## Rule
The file "upload" flow does NOT use any Drive API or auto-upload. When the user "uploads" a file:
1. A dialog appears explaining they need to upload to Google Drive first
2. User pastes the shareable link
3. Frontend calls `useUploadFile` with JSON body: `{ title, driveFileId: "manual", driveShareableLink, originalName, mimeType, fileType, folderId? }`
4. The link is stored in `files.drive_shareable_link`; file cards use it as the "open" action target

**Why:** The user dismissed the Google Drive Replit integration. The Drive integration can be reconnected later if needed.

**How to apply:** If adding Drive auto-upload later, change the dialog to auto-fill `driveFileId` with the real Drive file ID and `driveShareableLink` with the Drive API response URL. The DB schema already supports both manual and auto modes.
