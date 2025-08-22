'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactQRCode from 'react-qr-code';
import { erc20Abi } from '@/lib/erc20';
import { ENV } from '@/lib/env';
import { microsToDisplay } from '@/lib/format';
import {
    useAccount,
    usePublicClient,
    useWriteContract,
    useConnect,
    useDisconnect,
    useSwitchChain,
    useChainId,
} from 'wagmi';

type Paylink = {
    id: string;
    to: `0x${string}`;
    tokenAddress: `0x${string}`;
    chainId: number;
    amountMicros: string; // BigInt serialized
    status: 'PENDING' | 'PAID';
    txHash: `0x${string}` | null;
};

export default function PayPage() {
    const { id } = useParams<{ id: string }>();
    const [paylink, setPaylink] = useState<Paylink | null>(null);
    const [loading, setLoading] = useState(true);
    const [watching, setWatching] = useState(false);

    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    // --- wallet/connect bits ---
    const { address, isConnected } = useAccount();
    const { connectAsync, connectors, status: connectStatus } = useConnect();
    const { disconnect } = useDisconnect();
    const currentChainId = useChainId();
    const { switchChainAsync } = useSwitchChain();

    async function ensureWalletReady() {
        // connect
        if (!isConnected) {
            // pick the injected (MetaMask) connector from our Providers config
            const metaMask = connectors.find((c) => c.id === 'injected') ?? connectors[0];
            await connectAsync({ connector: metaMask });
        }
        // switch chain if needed
        if (currentChainId !== ENV.CHAIN_ID) {
            await switchChainAsync({ chainId: ENV.CHAIN_ID });
        }
    }

    // --- data load ---
    async function load() {
        const res = await fetch(`/api/paylinks/${id}`, { cache: 'no-store' });
        if (!res.ok) {
            const text = await res.text();
            setLoading(false);
            alert(`Failed to load link (${res.status}): ${text.slice(0, 160)}`);
            return;
        }
        const json = await res.json();
        setPaylink(json);
        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const amountAtomic = useMemo(() => {
        if (!paylink) return BigInt(0);
        return BigInt(paylink.amountMicros);
    }, [paylink]);

    // EIP-681 QR
    const qrValue = useMemo(() => {
        if (!paylink) return '';
        return `ethereum:${paylink.tokenAddress}/transfer?address=${paylink.to}&uint256=${amountAtomic.toString()}`;
    }, [paylink, amountAtomic]);

    // Watch Transfer(to == expected, value == amount)
    useEffect(() => {
        if (!publicClient || !paylink || paylink.status === 'PAID') return;

        setWatching(true);
        const unwatch = publicClient.watchContractEvent({
            address: paylink.tokenAddress,
            abi: erc20Abi,
            eventName: 'Transfer',
            args: { to: paylink.to },
            onLogs: async (logs) => {
                const match = logs.find((l) => l.args?.value === amountAtomic);
                if (match) {
                    await fetch(`/api/paylinks/${paylink.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'PAID', txHash: match.transactionHash }),
                    });
                    load();
                    unwatch?.();
                }
            },
            onError: (e) => console.error('watchContractEvent error', e),
            poll: true,
        });

        return () => {
            unwatch?.();
            setWatching(false);
        };
    }, [publicClient, paylink, amountAtomic]);

    if (loading || !paylink) return <p>Loading…</p>;

    async function onPayClick() {
        if (!paylink) {
            alert('Pay link not loaded yet.');
            return;
        }
        if (!publicClient) {
            alert('Public client not ready.');
            return;
        }
        const p = paylink;

        try {
            await ensureWalletReady(); // connect + switch chain if needed

            const txHash = await writeContractAsync({
                address: p.tokenAddress,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [p.to, BigInt(p.amountMicros)], // amountAtomic also fine if you prefer
            });

            const rec = await publicClient.waitForTransactionReceipt({ hash: txHash });

            await fetch(`/api/paylinks/${p.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID', txHash: rec.transactionHash }),
            });

            load(); // refresh the page data
        } catch (e: any) {
            alert(e?.shortMessage || e?.message || 'Transaction failed');
        }
    }

    const paid = paylink.status === 'PAID';

    return (
        <main style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Pay Link</h2>

            <div>Status: <b>{paylink.status}</b></div>
            <div>Recipient: <code>{paylink.to}</code></div>
            <div>
                Token:{' '}
                <a href={`${ENV.EXPLORER_BASE}/token/${paylink.tokenAddress}`} target="_blank" rel="noreferrer">
                    {paylink.tokenAddress}
                </a>
            </div>
            <div>Amount: <b>{microsToDisplay(BigInt(paylink.amountMicros))} USDC</b></div>

            {/* simple wallet status / connect UI */}
            <div style={{ marginTop: 8, fontSize: 14 }}>
                {isConnected ? (
                    <div>
                        Connected: <code>{address}</code>{' '}
                        <button onClick={() => disconnect()} style={{ marginLeft: 8, padding: '4px 8px' }}>
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button onClick={ensureWalletReady} style={{ padding: '6px 10px' }}>
                        Connect Wallet
                    </button>
                )}
                {connectStatus === 'pending' && <span> (connecting…)</span>}
            </div>

            <div style={{ marginTop: 8 }}>
                <div style={{ background: 'white', padding: 10, display: 'inline-block' }}>
                    <ReactQRCode value={qrValue} />
                </div>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                    Scan in a mobile wallet that supports EIP-681 to prefill an ERC-20 transfer.
                </div>
            </div>

            <button onClick={onPayClick} disabled={paid} style={{ width: 220 }}>
                {paid ? 'Already Paid' : 'Pay with Wallet'}
            </button>

            <div style={{ fontSize: 12, opacity: 0.8 }}>
                Watching <code>Transfer(to, value)</code>… {watching ? 'on' : 'off'}
            </div>

            <hr />

            <div>
                <button onClick={() => alert('CCTP flow coming soon — stub only.')} style={{ padding: '6px 10px' }}>
                    Pay from another chain (CCTP)
                </button>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                    This will link to a native Circle CCTP flow later.
                </div>
            </div>
        </main>
    );
}
