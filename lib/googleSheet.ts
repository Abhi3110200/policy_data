import { google } from "googleapis";

interface SheetRowData {
  [key: string]: string | number | boolean | null | undefined;
}

export async function addRowToSheet(rowData: SheetRowData) {
  try {
    if (!rowData || typeof rowData !== "object" || Object.keys(rowData).length === 0) {
      throw new Error("rowData is empty or invalid");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Convert escaped \n to real newlines
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is missing in env");

    const sheetName = "Sheet1";

    // 1️⃣ Get existing headers from first row
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    let headers: string[] = headerRes.data.values?.[0] || [];

    // 2️⃣ If no headers exist, create them and add the first row immediately
    if (headers.length === 0) {
      const keys = Object.keys(rowData);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: "RAW",
        requestBody: { values: [keys] },
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [keys.map(k => rowData[k] ?? "")] },
      });

      console.log("✅ Created headers and inserted first row");
      return { success: true };
    }

    // 3️⃣ Normalize headers (trim spaces to avoid mismatch issues)
    headers = headers.map(h => h.trim());

    // 4️⃣ Map rowData to header order; fill in blanks for missing columns
    const rowValues = headers.map(header => rowData[header] ?? "");

    // 5️⃣ Check if row has at least one non-empty value
    if (rowValues.every(value => value === "")) {
      throw new Error("All values are empty — not appending blank row");
    }

    // 6️⃣ Prepare the row with formulas for hyperlinks
    const rowWithFormulas = rowValues.map((value, index) => {
      const header = headers[index];
      // If this is the PDF Link column and it's not empty, create a hyperlink formula
      if ((header === 'PDF Link' || header === 'pdf_link' || header === 'PDF_Link') && value && value !== 'No PDF attached') {
        return `=HYPERLINK("${value}", "View PDF")`;
      }
      return value;
    });

    // 7️⃣ Append the row with formulas
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: "USER_ENTERED", // Use USER_ENTERED to interpret formulas
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [rowWithFormulas] },
    });

    // 8️⃣ Get the range of the newly added row
    const updatedRange = appendResponse.data.updates?.updatedRange;
    
    if (updatedRange) {
      // 9️⃣ Apply blue color and underline to the PDF Link cell
      const pdfLinkIndex = headers.findIndex(header => 
        ['PDF Link', 'pdf_link', 'PDF_Link'].includes(header.trim())
      );

      if (pdfLinkIndex >= 0) {
        const columnLetter = String.fromCharCode(65 + pdfLinkIndex); // Convert index to column letter (A, B, C, ...)
        const rowNumber = updatedRange.split('!')[1].match(/\d+/)?.[0]; // Extract row number from range
        
        if (rowNumber) {
          const cellRange = `${sheetName}!${columnLetter}${rowNumber}`;
          
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  repeatCell: {
                    range: {
                      sheetId: 0, // Assuming first sheet
                      startRowIndex: parseInt(rowNumber) - 1,
                      endRowIndex: parseInt(rowNumber),
                      startColumnIndex: pdfLinkIndex,
                      endColumnIndex: pdfLinkIndex + 1,
                    },
                    cell: {
                      userEnteredFormat: {
                        textFormat: {
                          foregroundColor: { red: 0.066, green: 0.333, blue: 0.8 }, // Blue color
                          underline: true,
                        },
                      },
                    },
                    fields: 'userEnteredFormat.textFormat(foregroundColor,underline)',
                  },
                },
              ],
            },
          });
        }
      }
    }

    console.log("✅ Row appended to Google Sheet with formatted hyperlink");
    return { success: true };
  } catch (error) {
    console.error("❌ Error adding row to Google Sheet:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
