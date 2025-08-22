'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ENV } from '@/lib/env';

export default function NewPayLinkPage() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/paylinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          amount,
          tokenAddress: ENV.TOKEN_ADDRESS,
          chainId: ENV.CHAIN_ID,
        }),
      });
      const pl = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(pl));
      router.push(`/pay/${pl.id}`);
    } catch (err) {
      alert('Failed to create: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Create PayLink</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <label>Recipient address</label>
        <input value={to} onChange={(e) => setTo(e.target.value)} required placeholder="0x..." />

        <label>Amount (USDC)</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="12.34" />

        <button disabled={loading} type="submit" style={{ width: 160 }}>
          {loading ? 'Creating…' : 'Create link'}
        </button>
      </form>
    </main>
  );
}
