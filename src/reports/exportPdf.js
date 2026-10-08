// Renders the whole Reports page (not just the visible part) to a single-page PDF and downloads it.
// html2canvas / jspdf are loaded only when Export is clicked.
export async function exportReportPdf(node, fileName) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])

  const canvas = await html2canvas(node, {
    backgroundColor: '#070d1a',
    scale: 2,
    useCORS: true,
    logging: false,
    scrollX: -window.scrollX,
    scrollY: -window.scrollY,
    width: node.scrollWidth,
    height: node.scrollHeight,
    windowWidth: Math.max(document.documentElement.clientWidth, node.scrollWidth),
    windowHeight: Math.max(document.documentElement.clientHeight, node.scrollHeight),
    ignoreElements: (el) => el.hasAttribute?.('data-html2canvas-ignore'),
  })

  const w = canvas.width / 2
  const h = canvas.height / 2
  // One page sized exactly to the report so nothing is cut off or split.
  const pdf = new jsPDF({ orientation: w > h ? 'l' : 'p', unit: 'px', format: [w, h], hotfixes: ['px_scaling'] })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h)
  pdf.save(fileName) // browser downloads it to the normal Downloads location
}
