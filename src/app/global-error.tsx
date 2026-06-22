'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: 'monospace', padding: '2rem', background: '#0a0b10', color: '#fff' }}>
        <h2 style={{ color: '#f87171' }}>Application Error</h2>
        <pre style={{ background: '#1e2030', padding: '1rem', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {error?.message || 'Unknown error'}
          {'\n\n'}
          {error?.stack || ''}
          {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#575afd', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
