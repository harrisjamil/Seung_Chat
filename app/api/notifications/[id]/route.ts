import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireApiUser, isErrorResponse } from '@/lib/api-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (isErrorResponse(auth)) return auth;

  const { id } = await context.params;

  const notification = await db.notification.findFirst({
    where: { id, userId: auth.id },
  });

  if (!notification) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  await db.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
