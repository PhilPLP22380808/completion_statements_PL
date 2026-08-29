// PDF generation. Light branding only: these are working documents that go to
// clients and to the other side's conveyancers, so they must NOT read as
// letterhead. A small "P" mark, a little burgundy on headings and the balance
// box, firm and regulatory details in small print at the foot. Nothing more.

import jsPDF from 'jspdf';
import { firm } from '../theme';
import { pinnacleMarkPng } from '../assets/logo';
import { formatAmount, formatCurrency, formatLongDate, formatShortDate, parseMoney, round2 } from './format';
import { calculateApportionment } from './calc';
import { chargeBalanceValue } from './statement';

const BURGUNDY = [114, 47, 55];
const INK = [34, 34, 34];
const GREY = [110, 110, 110];
const FAINT = [150, 150, 150];
const RULE = [214, 205, 205];
const GREEN = [22, 163, 74];
const RED = [220, 38, 38];
const PANEL_FILL = [248, 245, 245];
const BOX_FILL = [250, 250, 250];

const M = { left: 20, right: 190, top: 22 };
const COL = { pay: 143, rec: 190 }; // right edges of the two money columns
const LINE_H = 5.8; // vertical step for a single ledger row

function newDoc() {
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

function text(doc, str, x, y, { size = 10, color = INK, style = 'normal', align = 'left', maxWidth } = {}) {
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.setFont('helvetica', style);
  doc.text(String(str), x, y, { align, maxWidth });
}

function rule(doc, y, color = RULE, width = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(M.left, y, M.right, y);
}

// Shared header: mark, trading name, document title, status marker, matter block.
function header(doc, { title, statement }) {
  const markSize = 13;
  try {
    doc.addImage(pinnacleMarkPng, 'PNG', M.left, M.top - 1, markSize, markSize);
  } catch (e) { /* image unavailable: carry on without the mark */ }

  text(doc, firm.name, M.left + markSize + 5, M.top + 5, { size: 13, color: BURGUNDY, style: 'bold' });
  text(doc, title, M.left + markSize + 5, M.top + 11.5, { size: 10, color: GREY });

  if (statement.status && statement.status !== 'Final') {
    text(doc, statement.status.toUpperCase(), M.right, M.top + 5, { size: 9, color: BURGUNDY, style: 'bold', align: 'right' });
  }

  let y = M.top + 26;
  const rows = [
    ['Client(s)', statement.clients],
    ['Property', statement.address],
    ['Our ref', statement.ourRef],
    ['Completion date', statement.completionDate ? formatLongDate(statement.completionDate) : ''],
  ].filter((r) => r[1]);

  rows.forEach(([k, v]) => {
    text(doc, k, M.left, y, { size: 9, color: GREY });
    text(doc, v, M.left + 36, y, { size: 10, color: INK });
    y += 7;
  });

  y += 3;
  rule(doc, y, BURGUNDY, 0.5);
  return y + 12;
}

// Large faint "DRAFT" stamped diagonally across every page.
function draftWatermark(doc) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.saveGraphicsState();
    try { doc.setGState(new doc.GState({ opacity: 0.10 })); } catch (e) { /* noop */ }
    doc.setTextColor(...BURGUNDY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(110);
    doc.text('DRAFT', 105, 165, { align: 'center', angle: 32 });
    doc.restoreGraphicsState();
  }
}

function footer(doc, note) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    let y = 270;
    rule(doc, y, RULE, 0.3);
    y += 6;
    text(doc, `${firm.name}, ${firm.addressLines.join(', ')}`, M.left, y, { size: 7.5, color: GREY });
    text(doc, `${firm.phone}   ${firm.email}`, M.right, y, { size: 7.5, color: GREY, align: 'right' });
    y += 4.5;
    text(
      doc,
      `${firm.legalName} (trading as ${firm.name}) is authorised and regulated by the ${firm.regulator}, `
        + `Licence ${firm.licenceNumber}. Registered in England and Wales, company ${firm.companyNumber}.`,
      M.left, y, { size: 7.5, color: GREY, maxWidth: M.right - M.left }
    );
    y += 8;
    text(doc, note, M.left, y, { size: 7.5, color: FAINT, maxWidth: 140 });
    if (pages > 1) text(doc, `Page ${p} of ${pages}`, M.right, y, { size: 7.5, color: FAINT, align: 'right' });
  }
}

function columnHeadings(doc, y) {
  text(doc, 'Payments £', COL.pay, y, { size: 8, color: GREY, align: 'right' });
  text(doc, 'Receipts £', COL.rec, y, { size: 8, color: GREY, align: 'right' });
  return y + 4;
}

function lineRow(doc, y, label, { payment, receipt, indent = 5, bold = false } = {}) {
  const style = bold ? 'bold' : 'normal';
  const wrapped = doc.splitTextToSize(label, 96);
  text(doc, wrapped, M.left + indent, y, { size: 9.5, color: INK, style });
  if (payment != null) text(doc, formatAmount(payment), COL.pay, y, { size: 9.5, color: INK, style, align: 'right' });
  if (receipt != null) text(doc, formatAmount(receipt), COL.rec, y, { size: 9.5, color: INK, style, align: 'right' });
  return y + LINE_H + (wrapped.length - 1) * 4.6;
}

function pageBreakIfNeeded(doc, y, needed = 24) {
  if (y + needed > 262) {
    doc.addPage();
    return M.top + 6;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Completion statement (purchase or sale)
// ---------------------------------------------------------------------------
export function buildCompletionStatementPDF(statement, computed) {
  const doc = newDoc();
  const isPurchase = statement.matterType === 'purchase';
  let y = header(doc, { title: `Completion Statement (${isPurchase ? 'Purchase' : 'Sale'})`, statement });

  y = columnHeadings(doc, y);
  rule(doc, y - 1);
  y += 5;

  computed.sections.forEach((section, si) => {
    y = pageBreakIfNeeded(doc, y, 24);
    if (si > 0) y += 1;
    text(doc, section.title.toUpperCase(), M.left, y, { size: 9, color: BURGUNDY, style: 'bold' });
    y += 5;

    if (section.lines.length === 0) {
      text(doc, 'None', M.left + 5, y, { size: 9.5, color: FAINT, style: 'italic' });
      y += LINE_H - 1;
    }
    section.lines.forEach((l) => {
      y = pageBreakIfNeeded(doc, y);
      const label = l.vatable ? `${l.label} (incl. VAT)` : l.label;
      y = lineRow(doc, y, label, { payment: l.payment, receipt: l.receipt });
    });

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(M.left + 100, y - 4, COL.rec, y - 4);
    y += 1;
    const onPay = section.column === 'payment';
    y = lineRow(doc, y, `${section.title} subtotal`, {
      payment: onPay ? section.subtotal : null,
      receipt: onPay ? null : section.subtotal,
      bold: true,
    });
    y += 2;
  });

  // Balance box
  y = pageBreakIfNeeded(doc, y, 28);
  y += 4;
  doc.setFillColor(...BURGUNDY);
  doc.roundedRect(M.left, y, M.right - M.left, 18, 2, 2, 'F');
  text(doc, computed.wording.toUpperCase(), M.left + 8, y + 11, { size: 10.5, color: [255, 255, 255], style: 'bold' });
  text(doc, formatCurrency(computed.absTotal), M.right - 8, y + 11.5, { size: 14, color: [255, 255, 255], style: 'bold', align: 'right' });
  y += 27;

  text(doc, 'Errors and Omissions Excepted', M.left, y, { size: 8.5, color: GREY, style: 'italic' });

  const note = footNote(statement, computed);
  if (statement.status === 'Draft') draftWatermark(doc);
  footer(doc, note);
  return doc;
}

function footNote(statement, computed) {
  const parts = [`Prepared ${formatLongDate(new Date().toISOString().slice(0, 10))}.`];
  if (statement.status === 'Draft') {
    parts.push('Draft for checking. Figures are not final.');
  }
  if (computed && computed.appt && computed.appt.periodEnds && computed.appt.periodEnds.length > 1) {
    parts.push('See the separate apportionment statement for the breakdown of apportioned charges.');
  } else if (statement.includeApportionments) {
    parts.push('An apportionment statement is provided separately.');
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Apportionment statement (original layout, current branding)
// ---------------------------------------------------------------------------
// `charges` is a normalised list: { name, category, periodStart, periodEnd,
// totalCharge, accountBalance }  (accountBalance signed: + arrears, - credit).
// opts: { allowances, purchasePrice } — supplied for the standalone calculator
// to draw the allowances table and the Balance to Complete box; omitted for the
// companion statement that sits alongside a completion statement.
export function buildApportionmentStatementPDF(statement, charges, opts = {}) {
  const { allowances = [], purchasePrice = '' } = opts;
  const price = parseMoney(purchasePrice);
  const showBalance = price > 0;
  const doc = newDoc();
  const generated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  // Header
  try { doc.addImage(pinnacleMarkPng, 'PNG', M.left, M.top - 2, 12, 12); } catch (e) { /* noop */ }
  text(doc, firm.name, M.left + 16, M.top + 4, { size: 16, color: BURGUNDY, style: 'bold' });
  text(doc, 'Apportionment Statement', M.right, M.top + 2, { size: 13, color: INK, style: 'bold', align: 'right' });
  text(doc, `Generated ${generated}`, M.right, M.top + 8, { size: 9, color: GREY, align: 'right' });
  if (statement.status === 'Draft') text(doc, 'DRAFT', M.left + 16, M.top + 10, { size: 9, color: BURGUNDY, style: 'bold' });

  let y = M.top + 15;
  doc.setDrawColor(...BURGUNDY);
  doc.setLineWidth(1);
  doc.line(M.left, y, M.right, y);

  // Property / matter box
  y += 8;
  const boxRows = [
    statement.clients && ['CLIENT(S)', statement.clients],
    ['PROPERTY', statement.address || 'Address not specified'],
    statement.ourRef && ['OUR REF', statement.ourRef],
    ['COMPLETION DATE', statement.completionDate ? formatLongDate(statement.completionDate) : 'TBC'],
    showBalance && ['PURCHASE PRICE', formatCurrency(price)],
  ].filter(Boolean);
  const boxH = 6 + boxRows.length * 6;
  doc.setFillColor(...PANEL_FILL);
  doc.roundedRect(M.left, y, M.right - M.left, boxH, 2, 2, 'F');
  let by = y + 7;
  boxRows.forEach(([k, v]) => {
    text(doc, k, M.left + 5, by, { size: 7.5, color: BURGUNDY, style: 'bold' });
    text(doc, v, M.left + 42, by, { size: 9.5, color: INK });
    by += 6;
  });
  y += boxH + 12;

  // Allowances & adjustments table (standalone only)
  const validAllowances = allowances.filter((a) => parseMoney(a.amount) !== 0);
  if (showBalance && validAllowances.length > 0) {
    text(doc, 'ALLOWANCES & ADJUSTMENTS', M.left, y, { size: 10, color: BURGUNDY, style: 'bold' });
    y += 3;
    rule(doc, y);
    y += 7;
    text(doc, 'Description', M.left, y, { size: 8, color: GREY });
    text(doc, 'In favour of', M.left + 95, y, { size: 8, color: GREY });
    text(doc, 'Amount', M.right, y, { size: 8, color: GREY, align: 'right' });
    y += 2;
    rule(doc, y, [235, 235, 235]);
    y += 6;
    validAllowances.forEach((a) => {
      const amt = parseMoney(a.amount);
      const buyer = a.inFavourOf === 'buyer';
      text(doc, a.description || 'Allowance', M.left, y, { size: 9.5, color: INK });
      text(doc, buyer ? 'Buyer' : 'Seller', M.left + 95, y, { size: 9.5, color: INK });
      text(doc, `${buyer ? '-' : '+'}${formatCurrency(Math.abs(amt))}`, M.right, y, { size: 9.5, color: buyer ? RED : GREEN, align: 'right' });
      y += 6.5;
    });
    y += 6;
  }

  // Apportionments
  const done = charges
    .map((c) => ({ charge: c, calc: calculateApportionment(c, statement.completionDate) }))
    .filter((r) => r.calc.complete);

  text(doc, 'APPORTIONMENTS', M.left, y, { size: 10, color: BURGUNDY, style: 'bold' });
  y += 3;
  rule(doc, y);
  y += 8;

  if (done.length === 0) {
    text(doc, 'No apportionments have been calculated.', M.left, y, { size: 9.5, color: GREY, style: 'italic' });
    y += 10;
  }

  done.forEach(({ charge, calc }) => {
    if (y > 232) { doc.addPage(); y = M.top; }
    doc.setFillColor(...BOX_FILL);
    doc.roundedRect(M.left, y, M.right - M.left, 40, 2, 2, 'F');
    let iy = y + 7;
    text(doc, charge.name || charge.category || 'Charge', M.left + 5, iy, { size: 10, color: INK, style: 'bold' });
    iy += 7;
    text(doc, 'Billing period', M.left + 5, iy, { size: 8, color: GREY });
    text(doc, `${formatShortDate(charge.periodStart)} to ${formatShortDate(charge.periodEnd)}  (${calc.daysInPeriod} days)`, M.left + 42, iy, { size: 8, color: INK });
    iy += 5.5;
    text(doc, 'Total charge', M.left + 5, iy, { size: 8, color: GREY });
    text(doc, formatCurrency(parseMoney(charge.totalCharge)), M.left + 42, iy, { size: 8, color: INK });
    text(doc, 'Daily rate', M.left + 95, iy, { size: 8, color: GREY });
    text(doc, formatCurrency(calc.dailyRate), M.left + 118, iy, { size: 8, color: INK });
    iy += 5.5;
    const bal = parseMoney(charge.accountBalance);
    text(doc, 'Balance on statement', M.left + 5, iy, { size: 8, color: GREY });
    text(doc, `${formatCurrency(Math.abs(bal))}${bal < 0 ? ' (in credit)' : ''}`, M.left + 42, iy, { size: 8, color: INK });
    text(doc, 'Days to apportion', M.left + 95, iy, { size: 8, color: GREY });
    text(doc, `${calc.daysToApportion}`, M.left + 128, iy, { size: 8, color: INK });
    iy += 6;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(M.left + 5, iy, M.right - 5, iy);
    doc.setLineDashPattern([], 0);
    iy += 5.5;
    text(doc, `Apportionment payable to ${calc.paidTo}`, M.left + 5, iy, { size: 9, color: INK, style: 'bold' });
    text(doc, `${calc.action === 'add' ? '+' : '-'}${formatCurrency(calc.amountToApportion)}`, M.right - 5, iy, { size: 10, color: calc.action === 'add' ? GREEN : RED, style: 'bold', align: 'right' });
    y += 46;
  });

  // Balance to complete (standalone only)
  if (showBalance) {
    let balance = price;
    validAllowances.forEach((a) => {
      const amt = parseMoney(a.amount);
      balance += a.inFavourOf === 'buyer' ? -Math.abs(amt) : Math.abs(amt);
    });
    done.forEach(({ calc }) => { balance += calc.action === 'add' ? calc.amountToApportion : -calc.amountToApportion; });

    if (y > 236) { doc.addPage(); y = M.top; }
    y += 4;
    doc.setFillColor(...BURGUNDY);
    doc.roundedRect(M.left, y, M.right - M.left, 20, 2, 2, 'F');
    text(doc, 'BALANCE TO COMPLETE', M.left + 8, y + 12, { size: 9, color: [255, 255, 255], style: 'bold' });
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(round2(balance)), M.right - 8, y + 12.5, { align: 'right' });
    y += 28;
  }

  text(doc, 'Errors and Omissions Excepted', M.left, y + 2, { size: 8.5, color: GREY, style: 'italic' });

  if (statement.status === 'Draft') draftWatermark(doc);
  footer(doc, `Prepared ${generated}.`);
  return doc;
}

// ---------------------------------------------------------------------------
// Public: build and download the right set of documents
// ---------------------------------------------------------------------------
function fileStem(statement, kind) {
  const ref = (statement.ourRef || statement.address || 'Statement').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
  const stamp = (statement.status || 'Draft').toUpperCase();
  return `${ref} ${kind} ${stamp}.pdf`;
}

export function downloadCompletionSet(statement, computed) {
  buildCompletionStatementPDF(statement, computed).save(fileStem(statement, 'Completion Statement'));
  maybeApportionmentPdf(statement);
}

function maybeApportionmentPdf(statement, kind = 'Apportionment Statement') {
  if (!statement.includeApportionments) return;
  const charges = statement.charges
    .map((c) => ({ ...c, accountBalance: c.accountBalance === '' ? '' : chargeBalanceValue(c) }));
  const anyComplete = charges.some((c) => calculateApportionment(c, statement.completionDate).complete);
  if (anyComplete) buildApportionmentStatementPDF(statement, charges).save(fileStem(statement, kind));
}

// Linked sale and purchase: a completion statement for each side, plus an
// apportionment statement for either side that has charges. Separate downloads.
export function downloadLinkedSet(state, computed) {
  buildCompletionStatementPDF(computed.saleStatement, computed.sale).save(fileStem(computed.saleStatement, 'Sale Completion Statement'));
  buildCompletionStatementPDF(computed.purchaseStatement, computed.purchase).save(fileStem(computed.purchaseStatement, 'Purchase Completion Statement'));
  maybeApportionmentPdf(computed.saleStatement, 'Sale Apportionment Statement');
  maybeApportionmentPdf(computed.purchaseStatement, 'Purchase Apportionment Statement');
}

// Apportionment-only mode: one document, the apportionment statement, with the
// allowances table and Balance to Complete box when a purchase price is entered.
export function downloadApportionmentOnly({ address, ourRef, completionDate, status = 'Draft', purchasePrice, allowances, apportionments }) {
  const statement = { clients: '', address, ourRef, completionDate, status };
  const charges = apportionments.map((a) => ({
    name: a.name,
    category: a.name,
    periodStart: a.periodStart,
    periodEnd: a.periodEnd,
    totalCharge: a.totalCharge,
    accountBalance: a.balanceOwed === '' ? '' : parseMoney(a.balanceOwed),
  }));

  buildApportionmentStatementPDF(statement, charges, { allowances: allowances || [], purchasePrice })
    .save(fileStem(statement, 'Apportionment Statement'));
}
