import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ maxWidth: '44ch' }}>
      <h1 className="display" style={{ fontSize: 'var(--step-4)' }}>
        Not here.
      </h1>
      <p style={{ marginTop: 14, color: 'var(--text-secondary)' }}>
        That page does not exist. It may have moved when the site was rebuilt.
      </p>
      <Link
        href="/works"
        style={{
          display: 'inline-block',
          marginTop: 24,
          padding: '10px 18px',
          borderRadius: 12,
          background: 'var(--pill-rest)',
          fontWeight: 500,
        }}
      >
        All works ↗
      </Link>
    </div>
  )
}
