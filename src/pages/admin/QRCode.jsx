import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const DEFAULT_URL = typeof window !== 'undefined' ? window.location.origin : ''

export default function QRCodePage() {
  const [url, setUrl] = useState(DEFAULT_URL)
  const [label, setLabel] = useState('Scan to place your bets!')

  function handlePrint() {
    window.print()
  }

  return (
    <div>
      <h1>QR Code</h1>
      <p style={{ color: 'var(--cream-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Print this and place it on each dinner table. Guests scan to enter the casino.
      </p>

      {/* Settings */}
      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '480px' }}>
        <div className="form-group">
          <label>Site URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-site.vercel.app"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Label text</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Scan to place your bets!"
          />
        </div>
      </div>

      <button onClick={handlePrint} className="btn btn-primary" style={{ marginBottom: '2rem' }}>
        🖨 Print / Save as PDF
      </button>

      {/* Print preview */}
      <div className="qr-preview-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="qr-card">
            <div className="qr-monogram">J &amp; E</div>
            <div className="qr-title">Betting on the Wedding</div>
            <div className="qr-date">May 16th, 2026</div>
            <div className="qr-divider">— ♦ —</div>
            <div className="qr-code-wrap">
              <QRCodeSVG
                value={url || 'https://example.com'}
                size={160}
                bgColor="#0d2418"
                fgColor="#c9a84c"
                level="M"
              />
            </div>
            <div className="qr-label">{label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .qr-preview-grid, .qr-preview-grid * { visibility: visible; }
          .qr-preview-grid {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 0 !important;
            padding: 0 !important;
          }
          .qr-card {
            border: 1px solid #999 !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }

        .qr-preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          max-width: 680px;
        }

        .qr-card {
          background: #0d2418;
          border: 2px solid #c9a84c;
          border-radius: 12px;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          text-align: center;
        }

        .qr-monogram {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-style: italic;
          color: #c9a84c;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .qr-title {
          font-family: 'Playfair Display', serif;
          font-size: 0.85rem;
          color: #f5f0e8;
          letter-spacing: 0.5px;
        }

        .qr-date {
          font-size: 0.72rem;
          color: #c9a84c;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .qr-divider {
          color: #8b7030;
          font-size: 0.75rem;
          margin: 0.25rem 0;
        }

        .qr-code-wrap {
          padding: 0.75rem;
          background: #0d2418;
          border: 1px solid #8b7030;
          border-radius: 8px;
          margin: 0.25rem 0;
        }

        .qr-label {
          font-size: 0.75rem;
          color: #c8bfad;
          font-style: italic;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  )
}
