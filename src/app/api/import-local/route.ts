import { NextResponse } from 'next/server';

// Temporary server-side in-memory cache for double-clicked files
const tempStorage = new Map<string, any>();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = Math.random().toString(36).substring(2, 15);
    tempStorage.set(id, data);
    
    // Automatically cleanup after 2 minutes to prevent memory leaks
    setTimeout(() => {
      tempStorage.delete(id);
    }, 120000);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !tempStorage.has(id)) {
    return NextResponse.json({ success: false, error: 'Document not found or expired' }, { status: 404 });
  }

  const data = tempStorage.get(id);

  return NextResponse.json({ success: true, data });
}
