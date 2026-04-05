import { NextRequest, NextResponse } from 'next/server';
import { swaggerSpecV1, swaggerSpecV2 } from '@/lib/swagger';

export async function GET(request: NextRequest) {
  const version = request.nextUrl.searchParams.get('version') || 'v1';

  let spec;
  switch (version) {
    case 'v2':
      spec = swaggerSpecV2;
      break;
    case 'v1':
    default:
      spec = swaggerSpecV1;
      break;
  }

  return NextResponse.json(spec);
}
