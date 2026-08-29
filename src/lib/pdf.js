// PDF generation. Light branding only: these are working documents that go to
// clients and to the other side's conveyancers, so they must NOT read as
// letterhead. A small "P" mark, a little burgundy on headings and the balance
// box, firm and regulatory details in small print at the foot. Nothing more.

import jsPDF from 'jspdf';
import { firm } from '../theme';
import { pinnacleMarkPng } from '../assets/logo';
import { formatAmount, formatCurrency, formatLongDate, formatShortDate, formatMonthYear, parseMoney } from './format';
import { calculateApportionment } from './calc';
import { chargeBalanceValue } from './statement';

const BURGUNDY = [114, 47, 55];
const INK = [34, 34, 34];
const GREY = [110, 110, 110];
const FAINT = [150, 150, 150];
const RULE = [214, 205, 205];

const M = { left: 20, right: 190, top: 22 };
const COL = { pay: 143, rec: 190 }; // right edges of the two money columns
const LINE_H = 6.6; // vertical step for a single ledger row

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
  if (y + needed > 256) {
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
  y += 7;

  computed.sections.forEach((section, si) => {
    y = pageBreakIfNeeded(doc, y, 28);
    if (si > 0) y += 3;
    text(doc, section.title.toUpperCase(), M.left, y, { size: 9, color: BURGUNDY, style: 'bold' });
    y += 7;

    if (section.lines.length === 0) {
      text(doc, 'None', M.left + 5, y, { size: 9.5, color: FAINT, style: 'italic' });
      y += LINE_H;
    }
    section.lines.forEach((l) => {
      y = pageBreakIfNeeded(doc, y);
      const label = l.vatable ? `${l.label} (incl. VAT)` : l.label;
      y = lineRow(doc, y, label, { payment: l.payment, receipt: l.receipt });
    });

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(M.left + 100, y - 4, COL.rec, y - 4);
    y += 1.5;
    const onPay = section.column === 'payment';
    y = lineRow(doc, y, `${section.title} subtotal`, {
      payment: onPay ? section.subtotal : null,
      receipt: onPay ? null : section.subtotal,
      bold: true,
    });
    y += 5;
  });

  // Balance box
  y = pageBreakIfNeeded(doc, y, 32);
  y += 6;
  doc.setFillColor(...BURGUNDY);
  doc.roundedRect(M.left, y, M.right - M.left, 20, 2, 2, 'F');
  text(doc, computed.wording.toUpperCase(), M.left + 8, y + 12, { size: 10.5, color: [255, 255, 255], style: 'bold' });
  text(doc, formatCurrency(computed.absTotal), M.right - 8, y + 12.5, { size: 14, color: [255, 255, 255], style: 'bold', align: 'right' });
  y += 30;

  text(doc, 'Errors and Omissions Excepted', M.left, y, { size: 8.5, color: GREY, style: 'italic' });

  const note = footNote(statement, computed);
  footer(doc, note);
  return doc;
}

function footNote(statement, computed) {
  const parts = [`Prepared ${formatLongDate(new Date().toISOString().slice(0, 10))}.`];
  if (statement.status === 'Provisional') {
    parts.push('Figures are provisional and subject to final adjustment once confirmed.');
  }
  if (computed && computed.appt && computed.appt.periodEnds && computed.appt.periodEnds.length > 1) {
    parts.push('See the separate apportionment statement for the breakdown of apportioned charges.');
  } else if (statement.includeApportionments) {
    parts.push('An apportionment statement is provided separately.');
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Apportionment statement (standalone document)
// ---------------------------------------------------------------------------
// `charges` is a normalised list: { name, category, periodStart, periodEnd,
// totalCharge, accountBalance }  (accountBalance signed: + arrears, - credit).
export function buildApportionmentStatementPDF(statement, charges, balanceLedger) {
  const doc = newDoc();
  let y = header(doc, { title: 'Apportionment Statement', statement });

  const done = charges
    .map((c) => ({ charge: c, calc: calculateApportionment(c, statement.completionDate) }))
    .filter((r) => r.calc.complete);

  if (done.length === 0) {
    text(doc, 'No apportionments have been calculated yet.', M.left, y, { size: 10, color: GREY });
    footer(doc, `Prepared ${formatLongDate(new Date().toISOString().slice(0, 10))}.`);
    return doc;
  }

  text(
    doc,
    'Apportioned in accordance with the Standard Conditions of Sale (condition 6.3): the seller is treated as '
      + 'owning the property up to and including the completion date, with the buyer liable from the following day.',
    M.left, y, { size: 8.5, color: GREY, maxWidth: M.right - M.left }
  );
  y += 12;

  done.forEach(({ charge, calc }) => {
    y = pageBreakIfNeeded(doc, y, 46);
    text(doc, charge.name || charge.category || 'Charge', M.left, y, { size: 10.5, color: BURGUNDY, style: 'bold' });
    y += 6;

    const rows = [
      ['Billing period', `${formatShortDate(charge.periodStart)} to ${formatShortDate(charge.periodEnd)}  (${calc.daysInPeriod} days)`],
      ['Total charge for the period', formatCurrency(parseMoney(charge.totalCharge))],
      ['Daily rate', `${formatCurrency(calc.dailyRate)}  (charge / days in period)`],
      ['Balance on the managing agent statement', `${formatCurrency(Math.abs(parseMoney(charge.accountBalance)))}  ${parseMoney(charge.accountBalance) < 0 ? 'in credit' : 'in arrears'}`],
      ['Days apportioned to the buyer', `${calc.daysToApportion}  (day after completion to period end)`],
      ["Buyer's share of the period", formatCurrency(calc.buyerShare)],
    ];
    rows.forEach(([k, v]) => {
      text(doc, k, M.left + 4, y, { size: 9, color: GREY });
      text(doc, v, M.left + 78, y, { size: 9, color: INK });
      y += 5;
    });

    y += 1;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(M.left + 4, y, M.right, y);
    y += 5.5;
    text(doc, `Apportionment payable to the ${calc.paidTo.toLowerCase()}`, M.left + 4, y, { size: 10, color: INK, style: 'bold' });
    text(doc, formatCurrency(calc.amountToApportion), M.right, y, { size: 11, color: BURGUNDY, style: 'bold', align: 'right' });
    y += 12;
  });

  // Optional: how the apportionments feed the completion balance
  if (balanceLedger && balanceLedger.length) {
    y = pageBreakIfNeeded(doc, y, 10 + balanceLedger.length * 6);
    rule(doc, y);
    y += 6;
    text(doc, 'EFFECT ON THE COMPLETION BALANCE', M.left, y, { size: 9, color: BURGUNDY, style: 'bold' });
    y += 6;
    balanceLedger.forEach(({ label, value }) => {
      text(doc, label, M.left + 4, y, { size: 9.5, color: INK });
      const display = value < 0 ? `(${formatAmount(-value)})` : formatAmount(value);
      text(doc, display, M.right, y, { size: 9.5, color: INK, align: 'right' });
      y += 5.4;
    });
    const total = balanceLedger.reduce((t, l) => t + l.value, 0);
    doc.line(M.left + 120, y - 3.5, M.right, y - 3.5);
    text(doc, 'Balance to complete', M.left + 4, y, { size: 9.5, color: INK, style: 'bold' });
    text(doc, formatCurrency(total), M.right, y, { size: 9.5, color: INK, style: 'bold', align: 'right' });
    y += 8;
  }

  const singleEnd = done.length && done.every((r) => r.charge.periodEnd === done[0].charge.periodEnd)
    ? done[0].charge.periodEnd : null;
  const note = singleEnd
    ? `Prepared ${formatLongDate(new Date().toISOString().slice(0, 10))}. Apportionments run to the end of ${formatMonthYear(singleEnd)}.`
    : `Prepared ${formatLongDate(new Date().toISOString().slice(0, 10))}.`;
  text(doc, 'Errors and Omissions Excepted', M.left, y, { size: 8.5, color: GREY, style: 'italic' });
  footer(doc, note);
  return doc;
}

// ---------------------------------------------------------------------------
// Public: build and download the right set of documents
// ---------------------------------------------------------------------------
function fileStem(statement, kind) {
  const ref = (statement.ourRef || statement.address || 'Statement').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
  return `${ref} ${kind}.pdf`;
}

export function downloadCompletionSet(statement, computed) {
  buildCompletionStatementPDF(statement, computed).save(fileStem(statement, 'Completion Statement'));

  if (statement.includeApportionments) {
    const charges = statement.charges
      .map((c) => ({ ...c, accountBalance: c.accountBalance === '' ? '' : chargeBalanceValue(c) }));
    const anyComplete = charges.some((c) => calculateApportionment(c, statement.completionDate).complete);
    if (anyComplete) {
      buildApportionmentStatementPDF(statement, charges).save(fileStem(statement, 'Apportionment Statement'));
    }
  }
}

// Apportionment-only mode: one document, the apportionment statement, with the
// balance-to-complete summary if a purchase price was entered.
export function downloadApportionmentOnly({ address, ourRef, completionDate, purchasePrice, allowances, apportionments }) {
  const statement = { clients: '', address, ourRef, completionDate, status: 'Provisional' };
  const charges = apportionments.map((a) => ({
    name: a.name,
    category: a.name,
    periodStart: a.periodStart,
    periodEnd: a.periodEnd,
    totalCharge: a.totalCharge,
    accountBalance: a.balanceOwed === '' ? '' : parseMoney(a.balanceOwed),
  }));

  const price = parseMoney(purchasePrice);
  let ledger = null;
  if (price > 0) {
    ledger = [{ label: 'Purchase price', value: price }];
    (allowances || []).forEach((al) => {
      const amt = parseMoney(al.amount);
      if (amt) ledger.push({ label: al.description || `Allowance in favour of ${al.inFavourOf}`, value: al.inFavourOf === 'buyer' ? -amt : amt });
    });
    charges.forEach((c) => {
      const calc = calculateApportionment(c, completionDate);
      if (calc.complete) ledger.push({ label: `${c.name || 'Charge'} apportionment (to ${calc.paidTo})`, value: calc.action === 'add' ? calc.amountToApportion : -calc.amountToApportion });
    });
  }

  buildApportionmentStatementPDF(statement, charges, ledger).save(fileStem(statement, 'Apportionment Statement'));
}
