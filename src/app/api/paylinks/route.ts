export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ENV } from '@/lib/env';
import { toMicros } from '@/lib/format';

function serializeBigInts<T extends Record<string, unknown>>(obj: T) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const to = body.to as string;
  const amount = body.amount as string;
  const tokenAddress = (body.tokenAddress as string) ?? ENV.TOKEN_ADDRESS;
  const chainId = (body.chainId as number) ?? ENV.CHAIN_ID;

  const amountMicros = toMicros(amount);

  const pl = await prisma.paylink.create({
    data: { to, tokenAddress, chainId, amountMicros },
  });

  return NextResponse.json(serializeBigInts(pl));
}
