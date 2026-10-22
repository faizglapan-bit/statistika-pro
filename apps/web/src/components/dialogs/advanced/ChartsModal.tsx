import React, { useState, useEffect, useRef } from 'react'
import { VariableDefinition } from '@/types'
import { fetchChartData } from '@/services/advancedAnalysisApi'
import {
  BarChart2,
  Download,
  X,
  Loader2,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  datasetId: string
  variables: VariableDefinition[]
}

type ChartType = 'histogram' | 'boxplot' | 'scatter' | 'bar' | 'heatmap' | 'qq_plot'

export const ChartsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  datasetId,
  variables,
}) => {
  const [chartType, setChartType] = useState<ChartType>('histogram')

  // Parameter controls
  const [selectedVar, setSelectedVar] = useState<string>('')
  const [selectedVarX, setSelectedVarX] = useState<string>('')
  const [selectedVarY, setSelectedVarY] = useState<string>('')
  const [selectedCat, setSelectedCat] = useState<string>('')
  const [multiVars, setMultiVars] = useState<string[]>([])
  const [binsCount, setBinsCount] = useState<number>(10)
  const [showRegressionLine, setShowRegressionLine] = useState<boolean>(true)
  const [barStatType, setBarStatType] = useState<'mean' | 'count' | 'sum'>('mean')

  const [chartData, setChartData] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const numericVars = variables.filter((v) => v.type === 'numeric')

  // Inisialisasi default variables
  useEffect(() => {
    if (numericVars.length > 0) {
      if (!selectedVar) setSelectedVar(numericVars[0].name)
      if (!selectedVarX) setSelectedVarX(numericVars[0].name)
      if (!selectedVarY && numericVars.length > 1) setSelectedVarY(numericVars[1].name)
      if (multiVars.length === 0) setMultiVars(numericVars.slice(0, 4).map((v) => v.name))
    }
    if (variables.length > 0 && !selectedCat) {
      const nonNum = variables.find((v) => v.type !== 'numeric') || variables[0]
      setSelectedCat(nonNum.name)
    }
  }, [variables])

  const loadChart = async () => {
    setError(null)
    setLoading(true)
    try {
      const payload: any = { chart_type: chartType }

      if (chartType === 'histogram') {
        if (!selectedVar) throw new Error('Pilih variabel numerik untuk histogram.')
        payload.variable = selectedVar
        payload.bins_count = binsCount
      } else if (chartType === 'boxplot') {
        if (!selectedVar) throw new Error('Pilih variabel numerik untuk boxplot.')
        payload.variable = selectedVar
        if (selectedCat) payload.category_variable = selectedCat
      } else if (chartType === 'scatter') {
        if (!selectedVarX || !selectedVarY) throw new Error('Pilih variabel X dan Y untuk scatter plot.')
        payload.x_variable = selectedVarX
        payload.y_variable = selectedVarY
        payload.include_regression_line = showRegressionLine
      } else if (chartType === 'bar') {
        if (!selectedCat) throw new Error('Pilih variabel kategori.')
        payload.category_variable = selectedCat
        payload.numeric_variable = selectedVar || undefined
        payload.stat_type = barStatType
      } else if (chartType === 'heatmap') {
        if (multiVars.length < 2) throw new Error('Pilih minimal 2 variabel numerik untuk heatmap.')
        payload.variables = multiVars
        payload.method = 'pearson'
      } else if (chartType === 'qq_plot') {
        if (!selectedVar) throw new Error('Pilih variabel untuk Q-Q plot.')
        payload.variable = selectedVar
      }

      const res = await fetchChartData(datasetId, payload)
      setChartData(res)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat visualisasi grafik.')
    } finally {
      setLoading(false)
    }
  }

  // Muat ulang saat parameter utama berubah
  useEffect(() => {
    if (isOpen) {
      loadChart()
    }
  }, [isOpen, chartType, selectedVar, selectedVarX, selectedVarY, selectedCat, binsCount, showRegressionLine, barStatType])

  // Gambar ke Canvas untuk ekspor resolusi tinggi
  useEffect(() => {
    if (!chartData || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // High DPI scaling
    const width = 800
    const height = 480
    canvas.width = width
    canvas.height = height

    // Background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    // Border & Header
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 16px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(chartData.title || 'Statistika Pro Chart', width / 2, 35)

    // Subtitle
    ctx.fillStyle = '#64748B'
    ctx.font = '11px Inter, sans-serif'
    ctx.fillText('Dihasilkan oleh Statistika Pro — Standard Academic Visualizer', width / 2, 55)

    const plotX = 80
    const plotY = 80
    const plotW = width - 130
    const plotH = height - 140

    // Gambar grid & sumbu
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 1
    ctx.strokeRect(plotX, plotY, plotW, plotH)

    if (chartType === 'histogram' && chartData.bins) {
      const bins = chartData.bins
      const maxCount = Math.max(1, ...bins.map((b: any) => b.count))
      const barW = plotW / bins.length

      bins.forEach((b: any, idx: number) => {
        const barH = (b.count / maxCount) * (plotH - 20)
        const x = plotX + idx * barW + 2
        const y = plotY + plotH - barH

        ctx.fillStyle = '#3B82F6'
        ctx.fillRect(x, y, barW - 4, barH)

        // Label frekuensi di atas batang
        if (b.count > 0) {
          ctx.fillStyle = '#1E3A8A'
          ctx.font = '10px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(String(b.count), x + (barW - 4) / 2, y - 5)
        }

        // Label sumbu X
        ctx.fillStyle = '#475569'
        ctx.font = '9px Inter, sans-serif'
        ctx.fillText(b.mid.toFixed(1), x + (barW - 4) / 2, plotY + plotH + 18)
      })

      // Sumbu X label
      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(chartData.variable || 'Nilai Variabel', plotX + plotW / 2, height - 15)
    } else if (chartType === 'scatter' && chartData.points) {
      const pts = chartData.points
      const xs = pts.map((p: any) => p.x)
      const ys = pts.map((p: any) => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const rangeX = maxX - minX || 1
      const rangeY = maxY - minY || 1

      // Titik-titik scatter
      pts.forEach((p: any) => {
        const cx = plotX + ((p.x - minX) / rangeX) * plotW
        const cy = plotY + plotH - ((p.y - minY) / rangeY) * plotH

        ctx.fillStyle = 'rgba(37, 99, 235, 0.7)'
        ctx.beginPath()
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Garis regresi
      if (chartData.regression_line) {
        const line = chartData.regression_line
        const x1 = plotX + ((line.start.x - minX) / rangeX) * plotW
        const y1 = plotY + plotH - ((line.start.y - minY) / rangeY) * plotH
        const x2 = plotX + ((line.end.x - minX) / rangeX) * plotW
        const y2 = plotY + plotH - ((line.end.y - minY) / rangeY) * plotH

        ctx.strokeStyle = '#DC2626'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Formula label
        ctx.fillStyle = '#DC2626'
        ctx.font = 'bold 11px Inter, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${line.formula} (R² = ${line.r_squared.toFixed(3)})`, plotX + plotW - 10, plotY + 25)
      }

      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(chartData.x_variable, plotX + plotW / 2, height - 15)
    } else if (chartType === 'bar' && chartData.bars) {
      const bars = chartData.bars
      const maxVal = Math.max(1, ...bars.map((b: any) => b.value))
      const barW = plotW / bars.length

      bars.forEach((b: any, idx: number) => {
        const barH = (b.value / maxVal) * (plotH - 40)
        const x = plotX + idx * barW + 10
        const y = plotY + plotH - barH

        ctx.fillStyle = '#0D9488'
        ctx.fillRect(x, y, barW - 20, barH)

        // Error bar jika ada
        if (b.error_low !== undefined && b.error_high !== undefined) {
          const eLowY = plotY + plotH - (b.error_low / maxVal) * (plotH - 40)
          const eHighY = plotY + plotH - (b.error_high / maxVal) * (plotH - 40)
          const midX = x + (barW - 20) / 2

          ctx.strokeStyle = '#134E4A'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(midX, eLowY)
          ctx.lineTo(midX, eHighY)
          ctx.stroke()
          // Cap
          ctx.beginPath()
          ctx.moveTo(midX - 6, eHighY)
          ctx.lineTo(midX + 6, eHighY)
          ctx.moveTo(midX - 6, eLowY)
          ctx.lineTo(midX + 6, eLowY)
          ctx.stroke()
        }

        ctx.fillStyle = '#0F172A'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(b.value.toFixed(2), x + (barW - 20) / 2, y - 8)

        // Label kategori
        ctx.fillStyle = '#475569'
        ctx.fillText(String(b.category), x + (barW - 20) / 2, plotY + plotH + 20)
      })
    } else if (chartType === 'boxplot' && chartData.boxplots) {
      const bps = chartData.boxplots
      const allVals = bps.flatMap((b: any) => [b.min, b.max, ...b.outliers])
      const minV = Math.min(...allVals), maxV = Math.max(...allVals)
      const rangeV = maxV - minV || 1
      const boxW = plotW / bps.length

      bps.forEach((b: any, idx: number) => {
        const midX = plotX + idx * boxW + boxW / 2
        const bW = Math.min(50, boxW * 0.5)

        const yQ1 = plotY + plotH - ((b.q1 - minV) / rangeV) * plotH
        const yQ3 = plotY + plotH - ((b.q3 - minV) / rangeV) * plotH
        const yMed = plotY + plotH - ((b.median - minV) / rangeV) * plotH
        const yWLow = plotY + plotH - ((b.whisker_low - minV) / rangeV) * plotH
        const yWHigh = plotY + plotH - ((b.whisker_high - minV) / rangeV) * plotH

        // Whiskers line
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(midX, yWLow)
        ctx.lineTo(midX, yWHigh)
        ctx.stroke()

        // Whisker caps
        ctx.beginPath()
        ctx.moveTo(midX - 10, yWLow)
        ctx.lineTo(midX + 10, yWLow)
        ctx.moveTo(midX - 10, yWHigh)
        ctx.lineTo(midX + 10, yWHigh)
        ctx.stroke()

        // Box
        ctx.fillStyle = '#E0E7FF'
        ctx.strokeStyle = '#4338CA'
        ctx.lineWidth = 2
        ctx.fillRect(midX - bW / 2, yQ3, bW, yQ1 - yQ3)
        ctx.strokeRect(midX - bW / 2, yQ3, bW, yQ1 - yQ3)

        // Median line
        ctx.strokeStyle = '#B91C1C'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(midX - bW / 2, yMed)
        ctx.lineTo(midX + bW / 2, yMed)
        ctx.stroke()

        // Outliers
        b.outliers.forEach((outVal: number) => {
          const outY = plotY + plotH - ((outVal - minV) / rangeV) * plotH
          ctx.fillStyle = '#DC2626'
          ctx.beginPath()
          ctx.arc(midX, outY, 3.5, 0, Math.PI * 2)
          ctx.fill()
        })

        ctx.fillStyle = '#1E293B'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(String(b.group), midX, plotY + plotH + 20)
      })
    } else if (chartType === 'heatmap' && chartData.matrix) {
      const vars = chartData.variables
      const mSize = Math.min(plotW, plotH)
      const cellW = mSize / vars.length

      chartData.matrix.forEach((row: any[], i: number) => {
        row.forEach((cell: any, j: number) => {
          const x = plotX + j * cellW
          const y = plotY + i * cellW
          const r = cell.r

          // Color scale: blue (1.0) -> white (0) -> red (-1.0)
          let color = '#FFFFFF'
          if (r > 0) {
            const intensity = Math.round(r * 200)
            color = `rgb(${255 - intensity}, ${255 - intensity / 2}, 255)`
          } else {
            const intensity = Math.round(Math.abs(r) * 200)
            color = `rgb(255, ${255 - intensity}, ${255 - intensity})`
          }

          ctx.fillStyle = color
          ctx.fillRect(x, y, cellW, cellW)
          ctx.strokeStyle = '#CBD5E1'
          ctx.strokeRect(x, y, cellW, cellW)

          ctx.fillStyle = Math.abs(r) > 0.5 ? '#FFFFFF' : '#0F172A'
          ctx.font = 'bold 11px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(r.toFixed(2), x + cellW / 2, y + cellW / 2 + 4)
        })

        // Row label
        ctx.fillStyle = '#1E293B'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(vars[i], plotX - 8, plotY + i * cellW + cellW / 2 + 3)

        // Col label
        ctx.textAlign = 'center'
        ctx.fillText(vars[i], plotX + i * cellW + cellW / 2, plotY + mSize + 18)
      })
    } else if (chartType === 'qq_plot' && chartData.points) {
      const pts = chartData.points
      const allQ = pts.flatMap((p: any) => [p.theoretical_quantile, p.sample_quantile])
      const minQ = Math.min(...allQ), maxQ = Math.max(...allQ)
      const rangeQ = maxQ - minQ || 1

      // Garis referensi diagonal (y = x)
      ctx.strokeStyle = '#DC2626'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(plotX, plotY + plotH)
      ctx.lineTo(plotX + plotW, plotY)
      ctx.stroke()

      // Titik-titik Q-Q
      pts.forEach((p: any) => {
        const cx = plotX + ((p.theoretical_quantile - minQ) / rangeQ) * plotW
        const cy = plotY + plotH - ((p.sample_quantile - minQ) / rangeQ) * plotH

        ctx.fillStyle = 'rgba(2, 132, 199, 0.8)'
        ctx.beginPath()
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Kuantil Teoritis Normal Standar', plotX + plotW / 2, height - 15)
    }
  }, [chartData, chartType])

  const handleDownloadPng = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `Grafik_${chartType}_${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Visualisasi Grafik Statistik Interaktif
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Histogram, Boxplot, Scatter Plot, Bar Chart, Heatmap Korelasi, & Q-Q Plot
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              disabled={!chartData || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor PNG
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chart Type Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto">
          {[
            { id: 'histogram', label: 'Histogram' },
            { id: 'boxplot', label: 'Boxplot' },
            { id: 'scatter', label: 'Scatter Plot' },
            { id: 'bar', label: 'Bar Chart' },
            { id: 'heatmap', label: 'Heatmap Korelasi' },
            { id: 'qq_plot', label: 'Normal Q-Q Plot' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setChartType(item.id as ChartType); }}
              className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition -mb-px ${
                chartType === item.id
                  ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content Layout: Sidebar Controls + Chart View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Controls Panel */}
          <div className="w-72 border-r border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/40 dark:bg-slate-900/20 overflow-y-auto shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Sliders className="w-3.5 h-3.5" />
              Parameter Grafik
            </div>

            {error && (
              <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Variable Selectors depending on Chart Type */}
            {(chartType === 'histogram' || chartType === 'boxplot' || chartType === 'qq_plot') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Variabel Numerik
                </label>
                <select
                  value={selectedVar}
                  onChange={(e) => setSelectedVar(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  {numericVars.map((v) => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}

            {chartType === 'histogram' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Jumlah Bin: {binsCount}
                </label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={binsCount}
                  onChange={(e) => setBinsCount(parseInt(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>
            )}

            {chartType === 'boxplot' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kelompokkan Berdasarkan (Opsional)
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Semua Data (Satu Box) --</option>
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}

            {chartType === 'scatter' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Sumbu X (Independen)
                  </label>
                  <select
                    value={selectedVarX}
                    onChange={(e) => setSelectedVarX(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {numericVars.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Sumbu Y (Dependen)
                  </label>
                  <select
                    value={selectedVarY}
                    onChange={(e) => setSelectedVarY(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {numericVars.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showRegressionLine}
                    onChange={(e) => setShowRegressionLine(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Tampilkan Garis Regresi OLS</span>
                </label>
              </>
            )}

            {chartType === 'bar' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Variabel Kategori (Sumbu X)
                  </label>
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Variabel Numerik (Sumbu Y)
                  </label>
                  <select
                    value={selectedVar}
                    onChange={(e) => setSelectedVar(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Hitung Frekuensi Saja --</option>
                    {numericVars.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                {selectedVar && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Statistik
                    </label>
                    <select
                      value={barStatType}
                      onChange={(e) => setBarStatType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="mean">Rata-rata (dengan Error Bar 95% CI)</option>
                      <option value="sum">Jumlah Total (Sum)</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {chartType === 'heatmap' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Pilih Variabel Matriks:
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded p-1.5 bg-white dark:bg-slate-800">
                  {numericVars.map((v) => {
                    const isChecked = multiVars.includes(v.name)
                    return (
                      <div
                        key={v.name}
                        onClick={() => {
                          setMultiVars((prev) =>
                            prev.includes(v.name) ? prev.filter((x) => x !== v.name) : [...prev, v.name]
                          )
                        }}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{v.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Canvas Rendering Area */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/50 overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                <span className="text-xs font-medium">Menghitung data visualisasi...</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-2 overflow-hidden max-w-full">
                <canvas ref={canvasRef} className="max-w-full h-auto block" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
