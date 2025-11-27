import { Trade } from "@/types/trade"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Export trades to CSV format
 */
export function exportToCSV(trades: Trade[], filename: string = 'trades.csv') {
    // CSV headers
    const headers = [
        '日付',
        '通貨ペア',
        '方向',
        'エントリー価格',
        '決済価格',
        'ロットサイズ',
        '損益',
        'タグ',
        'メモ'
    ]

    // Convert trades to CSV rows
    const rows = trades.map(trade => [
        new Date(trade.entryTime).toLocaleString('ja-JP'),
        trade.pair,
        trade.direction === 'BUY' ? '買い' : '売り',
        trade.entryPrice.toString(),
        trade.exitPrice?.toString() || '-',
        trade.lotSize?.toString() || '-',
        trade.pnl?.toString() || '-',
        trade.tags?.join(', ') || '-',
        trade.notes || '-'
    ])

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Add BOM for Excel UTF-8 support
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })

    // Download file
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
}

/**
 * Export trades to PDF format
 */
export function exportToPDF(trades: Trade[], stats: any, filename: string = 'trades.pdf') {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text('トレード履歴レポート', 14, 20)

    // Date
    doc.setFontSize(10)
    doc.text(`作成日: ${new Date().toLocaleDateString('ja-JP')}`, 14, 28)

    // Summary stats
    if (stats) {
        doc.setFontSize(12)
        doc.text('サマリー統計', 14, 38)
        doc.setFontSize(10)
        doc.text(`勝率: ${stats.winRate}%`, 14, 45)
        doc.text(`合計損益: ¥${stats.totalPnl.toLocaleString()}`, 14, 52)
        doc.text(`トレード数: ${stats.totalTrades}件`, 14, 59)
        doc.text(`プロフィットファクター: ${stats.profitFactor}`, 14, 66)
    }

    // Trade table
    const tableData = trades.map(trade => [
        new Date(trade.entryTime).toLocaleDateString('ja-JP'),
        trade.pair,
        trade.direction === 'BUY' ? '買い' : '売り',
        trade.entryPrice.toString(),
        trade.exitPrice?.toString() || '-',
        trade.pnl ? `¥${trade.pnl.toLocaleString()}` : '-',
        trade.tags?.join(', ') || '-'
    ])

    autoTable(doc, {
        startY: stats ? 75 : 40,
        head: [['日付', '通貨ペア', '方向', 'エントリー', '決済', '損益', 'タグ']],
        body: tableData,
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [41, 41, 41],
            textColor: [212, 175, 55],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { top: 10 }
    })

    // Save PDF
    doc.save(filename)
}
