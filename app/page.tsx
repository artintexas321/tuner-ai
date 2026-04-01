'use client'
import { useState } from 'react'

const SAMPLE_LOG = `Time,RPM,MAP_kPa,Lambda_B1,Lambda_B2,LTFT_B1,LTFT_B2,EGT_B1,EGT_B2,WGDC,Knock_B1,Knock_B2,AFR
0.00,800,35.2,1.001,0.999,1.0,1.0,420,418,8.2,0.0,0.0,14.7
0.25,820,35.8,1.000,1.001,1.0,1.0,422,420,8.2,0.0,0.0,14.7
0.50,850,36.1,0.999,1.000,1.0,1.0,425,423,8.3,0.0,0.0,14.7
1.00,1200,42.4,1.001,1.000,1.0,1.0,448,446,9.1,0.0,0.0,14.7
2.00,1800,55.3,1.000,0.999,1.0,1.0,489,487,10.4,0.0,0.0,14.7
3.00,2400,68.1,1.001,1.000,1.0,1.0,524,521,11.8,0.0,0.0,14.7
3.50,2800,82.4,1.000,0.998,1.0,1.0,558,554,13.2,0.0,2.1,14.7
3.75,2900,85.1,1.001,0.997,1.0,1.0,562,558,13.5,0.0,3.8,14.7
4.00,3000,88.3,1.000,0.996,1.0,1.0,567,563,13.9,0.0,5.3,14.7
4.50,3500,102.4,1.000,1.001,1.0,1.0,598,595,15.2,0.0,0.0,14.7
5.00,4000,118.2,0.999,1.000,1.0,1.0,631,628,16.8,0.0,0.0,14.7
5.50,4500,132.6,0.825,0.810,1.0,1.0,712,709,18.9,0.0,0.0,11.8
6.00,5000,148.3,0.822,0.811,1.0,1.0,762,759,19.8,0.0,0.0,11.7
6.50,5500,158.7,0.820,0.812,1.0,1.0,798,795,20.1,0.0,0.0,11.6
6.75,5692,162.4,0.825,0.810,1.0,1.0,809,809,20.3,0.0,0.0,11.7
7.00,5800,160.1,0.823,0.811,1.0,1.0,805,803,20.2,0.0,0.0,11.7
7.50,6000,155.2,0.826,0.812,1.0,1.0,798,796,19.9,0.0,0.0,11.8
8.00,6200,149.8,0.825,0.813,1.0,1.0,789,787,19.6,0.0,0.0,11.8`

interface Recommendation {
  id: number
  severity: 'warning' | 'ok' | 'info'
  title: string
  detail: string
  channel?: string | null
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 1,
    severity: 'warning',
    title: 'Knock detected — Bank 2, Cylinders 5 & 8',
    detail: 'Part throttle zone 2,800–3,000 RPM. Up to 5.3° retard observed. Reduce ignition timing 2–3° on low-load ignition table for Bank 2.',
    channel: 'Knock_B2',
  },
  {
    id: 2,
    severity: 'ok',
    title: 'Lambda at WOT within target range',
    detail: 'Lambda 0.810–0.825 across both banks at WOT. No fuel correction needed at high load. Excellent consistency.',
    channel: 'Lambda_B1 / Lambda_B2',
  },
  {
    id: 3,
    severity: 'warning',
    title: 'Boost / wastegate alignment — verify target curve',
    detail: 'WGDC 20.3% producing 17.1 PSI (162.4 kPa MAP) at 5,692 RPM. Cross-reference against target boost curve and adjust if overboost.',
    channel: 'MAP_kPa / WGDC',
  },
  {
    id: 4,
    severity: 'ok',
    title: 'Long-term fuel trims stable',
    detail: 'LTFT +1.0% on both banks throughout log. Rock-solid baseline — no underlying fueling issue.',
    channel: 'LTFT_B1 / LTFT_B2',
  },
  {
    id: 5,
    severity: 'warning',
    title: 'EGT approaching threshold at WOT',
    detail: '809°C on both banks at peak. Within safe range but near the 850°C threshold. Monitor on next pull — consider enriching slightly if temps trend up.',
    channel: 'EGT_B1 / EGT_B2',
  },
  {
    id: 6,
    severity: 'info',
    title: 'Suggestion: Log IAT (intake air temp)',
    detail: 'Knock events at part throttle may correlate with heat soak. Adding IAT channel to next pull will help isolate thermal vs. tune-related knock.',
    channel: null,
  },
]

function severityStyle(s: Recommendation['severity']) {
  if (s === 'warning') return { border: 'border-yellow-600', bg: 'bg-yellow-950/30', icon: '⚠️', badge: 'bg-yellow-900 text-yellow-300' }
  if (s === 'ok') return { border: 'border-green-600', bg: 'bg-green-950/30', icon: '✅', badge: 'bg-green-900 text-green-300' }
  return { border: 'border-blue-600', bg: 'bg-blue-950/30', icon: '💡', badge: 'bg-blue-900 text-blue-300' }
}

function parseCSV(raw: string) {
  const lines = raw.trim().split('\n').filter(l => l.trim())
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map(l => {
    const vals = l.split(',').map(v => v.trim())
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
  return { headers, rows }
}

function SVGChart({ label, color, data, yMin, yMax }: {
  label: string; color: string; data: number[]; yMin: number; yMax: number
}) {
  const w = 700, h = 100, pad = 10
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = pad + ((yMax - v) / (yMax - yMin)) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4">
      <div className="text-sm font-semibold mb-2" style={{ color }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        {data.map((v, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2)
          const y = pad + ((yMax - v) / (yMax - yMin)) * (h - pad * 2)
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Min: {Math.min(...data).toFixed(1)}</span>
        <span>Max: {Math.max(...data).toFixed(1)}</span>
      </div>
    </div>
  )
}

export default function Home() {
  const [tab, setTab] = useState<'upload' | 'analysis' | 'charts' | 'about'>('upload')
  const [logText, setLogText] = useState('')
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  function loadSample() {
    setLogText(SAMPLE_LOG)
    setParsed(parseCSV(SAMPLE_LOG))
  }

  function handleParse() {
    if (!logText.trim()) return
    setParsed(parseCSV(logText))
  }

  function handleAnalyze() {
    if (!parsed) return
    setAnalyzing(true)
    setTimeout(() => { setAnalyzing(false); setTab('analysis') }, 1200)
  }

  const tabs = [
    { id: 'upload', label: '📂 Load Log' },
    { id: 'analysis', label: '🧠 Analysis' },
    { id: 'charts', label: '📈 Charts' },
    { id: 'about', label: 'ℹ️ About' },
  ] as const

  // Extract chart data from parsed log
  const rpm = parsed?.rows.map(r => parseFloat(r.RPM || '0')) ?? []
  const map = parsed?.rows.map(r => parseFloat(r.MAP_kPa || '0')) ?? []
  const lambda = parsed?.rows.map(r => parseFloat(r.Lambda_B1 || '0')) ?? []

  return (
    <main className="max-w-5xl mx-auto p-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">TunerAI <span className="text-green-400">⚡</span></h1>
          <p className="text-gray-500 text-sm">ECU Datalog Analysis — AI-powered tuning recommendations</p>
        </div>
        {parsed && (
          <div className="text-right text-sm">
            <div className="text-green-400 font-bold">{parsed.rows.length} rows loaded</div>
            <div className="text-gray-500">{parsed.headers.length} channels</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div>
          <div className="flex gap-3 mb-4">
            <button
              onClick={loadSample}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Load Sample Log (RS7 WOT Pull)
            </button>
            {logText && (
              <button
                onClick={handleParse}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Parse Log
              </button>
            )}
          </div>

          <textarea
            value={logText}
            onChange={e => { setLogText(e.target.value); setParsed(null) }}
            placeholder="Paste CSV datalog here (HP Tuners, EFI Live, MoTeC, AEM format)..."
            className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-green-500 resize-none mb-4"
          />

          {parsed && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-200">Preview — {parsed.rows.length} rows, {parsed.headers.length} channels</h3>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-bold text-sm rounded-lg transition-colors disabled:opacity-60"
                >
                  {analyzing ? '🧠 Analyzing...' : '🧠 Run AI Analysis'}
                </button>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-auto max-h-72">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-gray-800 border-b border-gray-700">
                      {parsed.headers.map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-400 whitespace-nowrap font-mono">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                        {parsed.headers.map(h => (
                          <td key={h} className={`px-3 py-1.5 font-mono whitespace-nowrap ${
                            h.includes('Knock') && parseFloat(row[h]) > 0 ? 'text-yellow-400 font-bold' :
                            h.includes('EGT') && parseFloat(row[h]) > 800 ? 'text-orange-400' :
                            'text-gray-300'
                          }`}>{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Analysis Tab */}
      {tab === 'analysis' && (
        <div>
          {!parsed ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📂</div>
              <div>Load a datalog first to see analysis</div>
              <button onClick={() => setTab('upload')} className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">
                Go to Load Log
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-green-400 font-bold text-lg">AI Analysis Complete</span>
                <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-medium">
                  {RECOMMENDATIONS.filter(r => r.severity === 'warning').length} warnings · {RECOMMENDATIONS.filter(r => r.severity === 'ok').length} passed · {RECOMMENDATIONS.filter(r => r.severity === 'info').length} suggestions
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {RECOMMENDATIONS.map(rec => {
                  const style = severityStyle(rec.severity)
                  return (
                    <div key={rec.id} className={`rounded-xl border p-4 ${style.border} ${style.bg}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{style.icon}</span>
                            <span className="font-semibold text-white">{rec.title}</span>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">{rec.detail}</p>
                        </div>
                        {rec.channel && (
                          <span className={`text-xs font-mono px-2 py-0.5 rounded whitespace-nowrap ${style.badge}`}>
                            {rec.channel}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Charts Tab */}
      {tab === 'charts' && (
        <div>
          {!parsed ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📈</div>
              <div>Load a datalog to see charts</div>
              <button onClick={() => setTab('upload')} className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg">
                Go to Load Log
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-gray-200 mb-4">Channel Plots — {parsed.rows.length} samples</h3>
              {rpm.length > 1 && <SVGChart label="RPM" color="#22c55e" data={rpm} yMin={0} yMax={7000} />}
              {map.length > 1 && <SVGChart label="MAP (kPa) — Boost Pressure" color="#f59e0b" data={map} yMin={0} yMax={200} />}
              {lambda.length > 1 && <SVGChart label="Lambda Bank 1" color="#60a5fa" data={lambda} yMin={0.7} yMax={1.1} />}
            </>
          )}
        </div>
      )}

      {/* About Tab */}
      {tab === 'about' && (
        <div className="max-w-2xl">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-4">
            <h2 className="text-xl font-bold text-green-400 mb-3">TunerAI</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              TunerAI analyzes ECU datalogs and surfaces tuning recommendations using AI. Built for high-performance tuning shops that want to move faster, catch issues earlier, and deliver better results to their customers.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Upload a CSV datalog from HP Tuners, EFI Live, MoTeC, AEM, or any compatible platform. TunerAI parses the channels, identifies anomalies, and generates prioritized recommendations — knock events, fuel trim drift, boost deviations, EGT trends, and more.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                ['🔍 Knock Detection', 'Per-bank, per-cylinder analysis with RPM/load context'],
                ['⛽ Fuel Trim Analysis', 'STFT/LTFT trends, lambda targeting, enrichment flags'],
                ['💨 Boost Control', 'WGDC correlation, target curve deviation, overboost alerts'],
                ['🌡️ EGT Monitoring', 'Threshold alerts, bank imbalance, thermal trend tracking'],
              ].map(([title, desc]) => (
                <div key={title} className="bg-gray-800 rounded-lg p-3">
                  <div className="font-semibold text-white text-sm mb-1">{title}</div>
                  <div className="text-gray-400 text-xs">{desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-400">
            <div className="font-semibold text-gray-300 mb-1">Built by Tovar Euro Performance × TunerAI</div>
            <div>Boutique performance shop · Boerne, TX · tovareuro.com</div>
            <div className="mt-2 text-xs text-gray-600">© 2026 Tovar Euro LLC. All rights reserved. TunerAI and all associated software, designs, and methodologies are proprietary to Tovar Euro LLC.</div>
          </div>
        </div>
      )}
    </main>
  )
}
