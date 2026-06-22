import { NextResponse } from 'next/server';
import { respondToLoginAlert } from '@/lib/login-alert';
import { getAppBaseUrl } from '@/lib/app-url';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  const action = url.searchParams.get('action')?.trim();
  const baseUrl = getAppBaseUrl(request);

  if (!token || (action !== 'confirm' && action !== 'deny')) {
    return NextResponse.redirect(
      new URL('/login-confirmation?result=invalid', baseUrl)
    );
  }

  const result = await respondToLoginAlert(token, action);

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/login-confirmation?result=${result.error}`, baseUrl)
    );
  }

  if (result.status === 'confirmed' || result.status === 'already_confirmed') {
    return NextResponse.redirect(
      new URL('/login-confirmation?result=approved', baseUrl)
    );
  }

  return NextResponse.redirect(
    new URL('/login-confirmation?result=denied', baseUrl)
  );
}
