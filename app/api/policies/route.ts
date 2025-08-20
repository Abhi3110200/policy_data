import { NextResponse } from 'next/server';
import { getAllSheetData } from '@/lib/googleSheet';

function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try different date formats
  const formats = [
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd',
    'MM-dd-yyyy',
    'dd-MM-yyyy'
  ];
  
  for (const format of formats) {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

export async function GET() {
  try {
    let data = await getAllSheetData();
    
    // Find date column (case-insensitive check for common date column names)
    const dateColumn = data[0] ? 
      Object.keys(data[0]).find(key => 
        ['date', 'policy date', 'start date', 'policy start date', 'date of issue']
          .some(term => key.toLowerCase().includes(term))
      ) : null;
    
    if (dateColumn) {
      data = [...data].sort((a, b) => {
        const dateA = parseDate(a[dateColumn]?.toString() || '');
        const dateB = parseDate(b[dateColumn]?.toString() || '');
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return -1; // Put invalid/missing dates at the end
        if (!dateB) return 1; // Put invalid/missing dates at the end
        
        // Sort in descending order (newest first)
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}
