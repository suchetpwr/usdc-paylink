// src/app/api/paylinks/[id]/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function serializeBigInts<T extends Record<string, any>>(obj: T) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

type Params = { id: string };

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;        // <— works even if ctx.params is a plain object
  const pl = await prisma.paylink.findUnique({ where: { id } });
  if (!pl) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(serializeBigInts(pl));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;        // <— same here
  const { status, txHash } = await req.json();

  const data: any = {};
  if (status === 'PAID') {
    data.status = 'PAID';
    data.txHash = txHash ?? null;
    data.paidAt = new Date();
  }

  const pl = await prisma.paylink.update({ where: { id }, data });
  return NextResponse.json(serializeBigInts(pl));
}
