export interface ReportPdfUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  company: string | null;
  blog: string | null;
}

export interface ReportPdfSection {
  title: string;
  body: string;
}

export interface ReportPdfChartPoint {
  name: string;
  value: number;
}

export interface ExportGithubReportPdfOptions {
  fileName: string;
  user: ReportPdfUser;
  sections: ReportPdfSection[];
  generatedAt: string;
  provider: string;
  languageData: ReportPdfChartPoint[];
  commitTrendData: ReportPdfChartPoint[];
  totalContributions: number;
  totalContributionDays: number;
}

type PdfDoc = {
  addImage: (...args: unknown[]) => void;
  addPage: () => void;
  circle: (...args: unknown[]) => void;
  getTextWidth: (text: string) => number;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  line: (...args: unknown[]) => void;
  rect: (...args: unknown[]) => void;
  roundedRect: (...args: unknown[]) => void;
  save: (fileName: string) => void;
  setDrawColor: (...args: unknown[]) => void;
  setFillColor: (...args: unknown[]) => void;
  setFont: (fontName: string, fontStyle?: string) => void;
  setFontSize: (size: number) => void;
  setLineWidth: (width: number) => void;
  setTextColor: (...args: unknown[]) => void;
  splitTextToSize: (text: string, width: number) => string[];
  text: (text: string | string[], x: number, y: number, options?: { align?: string }) => void;
  textWithLink: (text: string, x: number, y: number, options: { url: string; align?: string }) => void;
};

async function loadImageAsDataUrl(imageUrl: string) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read image.'));
    reader.readAsDataURL(blob);
  });
}

function splitText(doc: PdfDoc, text: string, width: number) {
  return doc.splitTextToSize(text, width);
}

function drawDivider(doc: PdfDoc, x: number, y: number, width: number) {
  doc.setDrawColor(220, 226, 232);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + width, y);
}

function drawMetaPill(doc: PdfDoc, label: string, x: number, y: number) {
  const width = doc.getTextWidth(label) + 10;
  doc.setDrawColor(214, 220, 228);
  doc.setFillColor(247, 249, 252);
  doc.roundedRect(x, y, width, 7, 3.5, 3.5, 'FD');
  doc.setTextColor(73, 80, 87);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(label, x + 5, y + 4.7);
  return width;
}

function drawMetricCard(doc: PdfDoc, label: string, value: string, x: number, y: number, width: number) {
  doc.setDrawColor(223, 228, 235);
  doc.setFillColor(250, 251, 252);
  doc.roundedRect(x, y, width, 20, 3.5, 3.5, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(label.toUpperCase(), x + 4, y + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(value, x + 4, y + 14.5);
}

function drawLanguageChart(doc: PdfDoc, data: ReportPdfChartPoint[], x: number, y: number, width: number) {
  const chartData = data.slice(0, 5);
  if (!chartData.length) return;

  const colors = [
    [15, 118, 110],
    [37, 99, 235],
    [124, 58, 237],
    [234, 88, 12],
    [8, 145, 178],
  ];
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Language breakdown', x, y);

  chartData.forEach((item, index) => {
    const rowY = y + 8 + index * 10;
    const barX = x + 34;
    const barWidth = width - 44;
    const filledWidth = Math.max(8, (item.value / maxValue) * barWidth);
    const color = colors[index % colors.length];

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(item.name, x, rowY + 3.8);
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(barX, rowY, barWidth, 5, 2, 2, 'FD');
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(barX, rowY, filledWidth, 5, 2, 2, 'F');
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.value), x + width, rowY + 3.8, { align: 'right' });
  });
}

function drawCommitChart(doc: PdfDoc, data: ReportPdfChartPoint[], x: number, y: number, width: number, height: number) {
  const chartData = data.slice(-7);
  if (!chartData.length) return;

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const stepX = chartData.length > 1 ? width / (chartData.length - 1) : width;
  const baseY = y + height;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Commit trend', x, y);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(x, baseY, x + width, baseY);

  const points = chartData.map((item, index) => ({
    x: x + stepX * index,
    y: baseY - ((item.value / maxValue) * (height - 10)),
    label: item.name,
    value: item.value,
  }));

  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(1.2);
  for (let index = 0; index < points.length - 1; index += 1) {
    doc.line(points[index].x, points[index].y, points[index + 1].x, points[index + 1].y);
  }

  points.forEach((point) => {
    doc.setFillColor(15, 118, 110);
    doc.circle(point.x, point.y, 1.5, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(String(point.value), point.x, point.y - 3.5, { align: 'center' });
    doc.setTextColor(100, 116, 139);
    doc.text(point.label, point.x, baseY + 5, { align: 'center' });
  });
}

function ensurePage(doc: PdfDoc, cursorY: number, neededHeight: number, pageHeight: number, margin: number) {
  if (cursorY + neededHeight <= pageHeight - margin) {
    return cursorY;
  }

  doc.addPage();
  return margin;
}

export async function exportGithubReportPdf(options: ExportGithubReportPdfOptions) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  }) as unknown as PdfDoc;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GitHub Professional Report', margin, cursorY + 4);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated ${new Date(options.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, cursorY + 10);
  doc.text(`Source: ${options.provider}`, pageWidth - margin, cursorY + 10, { align: 'right' });
  cursorY += 16;

  drawDivider(doc, margin, cursorY, contentWidth);
  cursorY += 8;

  const avatarDataUrl = await loadImageAsDataUrl(options.user.avatar_url);
  doc.addImage(avatarDataUrl, 'PNG', margin, cursorY, 22, 22);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(options.user.name ?? options.user.login, margin + 28, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(8, 145, 178);
  doc.textWithLink(`@${options.user.login}`, margin + 28, cursorY + 13, { url: options.user.html_url });
  doc.textWithLink(options.user.html_url, pageWidth - margin, cursorY + 13, {
    url: options.user.html_url,
    align: 'right',
  });

  doc.setTextColor(51, 65, 85);
  const bioLines = splitText(doc, options.user.bio ?? 'No bio available for this profile.', contentWidth - 34);
  doc.text(bioLines, margin + 28, cursorY + 19);
  cursorY += Math.max(24, 12 + bioLines.length * 4.5);

  const chipLabels = [
    options.user.company,
    options.user.location,
    options.user.blog ? 'Portfolio available' : null,
  ].filter(Boolean) as string[];

  let chipX = margin;
  chipLabels.forEach((chip) => {
    chipX += drawMetaPill(doc, chip, chipX, cursorY) + 4;
  });
  cursorY += 12;

  const metricGap = 4;
  const metricWidth = (contentWidth - metricGap * 3) / 4;
  drawMetricCard(doc, 'Followers', String(options.user.followers), margin, cursorY, metricWidth);
  drawMetricCard(doc, 'Following', String(options.user.following), margin + metricWidth + metricGap, cursorY, metricWidth);
  drawMetricCard(doc, 'Public repos', String(options.user.public_repos), margin + (metricWidth + metricGap) * 2, cursorY, metricWidth);
  drawMetricCard(doc, 'Contributions', String(options.totalContributions), margin + (metricWidth + metricGap) * 3, cursorY, metricWidth);
  cursorY += 28;

  doc.setDrawColor(223, 228, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cursorY, contentWidth, 62, 3.5, 3.5, 'FD');
  drawLanguageChart(doc, options.languageData, margin + 6, cursorY + 10, (contentWidth - 18) / 2);
  drawCommitChart(doc, options.commitTrendData, margin + 12 + (contentWidth - 18) / 2, cursorY + 10, (contentWidth - 24) / 2, 32);
  cursorY += 70;

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Active contribution days: ${options.totalContributionDays}`, margin, cursorY);
  cursorY += 8;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Executive Summary', margin, cursorY);
  cursorY += 8;

  for (const section of options.sections) {
    const bodyLines = splitText(doc, section.body, contentWidth - 10);
    const sectionHeight = 10 + bodyLines.length * 4.6 + 6;
    cursorY = ensurePage(doc, cursorY, sectionHeight + 4, pageHeight, margin);

    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, cursorY, contentWidth, sectionHeight, 3, 3, 'S');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(section.title, margin + 5, cursorY + 7);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(bodyLines, margin + 5, cursorY + 13);
    cursorY += sectionHeight + 4;
  }

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Generated from public GitHub data and dashboard analytics.', margin, pageHeight - 8);
  doc.textWithLink(options.user.html_url, pageWidth - margin, pageHeight - 8, {
    url: options.user.html_url,
    align: 'right',
  });

  doc.save(`${options.fileName}.pdf`);
}
