import Link from 'next/link';

export default function Home() {
   return (
    <main>
      <p>Create a pay link that accepts USDC on Sepolia.</p>
      <div style={{ marginTop: 12 }}>
        <Link href="/pay/new">➕ Create a new PayLink</Link>
      </div>
    </main>
  );
}
