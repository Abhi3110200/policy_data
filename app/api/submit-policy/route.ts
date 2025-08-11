import { NextResponse } from 'next/server';
import {addRowToSheet} from '@/lib/googleSheet';

export async function POST(request: Request) {
  console.log('Received request to /api/submit-policy');
  
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const requiredFields = ['Company Name', 'LOB Description', 'Type', 'Policy No', 'Insured Name', 'Prefix', 'Insured Name', 'Policy Start Date', 'Expiry Date', 'Sum Insured (in ₹)', 'Premium (in ₹)', 'GST (in ₹)', 'Total Premium (in ₹)'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Format date as '27th Aug 2025' with date before month
    const formatDate = (date: Date) => {
      const day = date.getDate();
      const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}${suffix} ${month} ${year}`;
    };

    // Prepare data for Google Sheets
    const dataToSave = {
      ...body,
      'PDF Link': body['PDF Link'] || 'No PDF attached',
    };
    console.log('Data to save:', JSON.stringify(dataToSave, null, 2));

    // Add data to Google Sheet
    console.log('Attempting to add row to Google Sheet...');
    const result = await addRowToSheet(dataToSave);
    console.log('Successfully added row to Google Sheet:', result);

    return NextResponse.json({
      success: true,
      message: 'Policy data saved successfully to Google Sheet',
      data: result
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save data to Google Sheet',
        details: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
