// Statement data model + the routine that turns form state into a rendered
// ledger (sections of lines with PAYMENTS / RECEIPTS columns, sub-totals and a
// grand total). Every figure here is pence-rounded so columns foot exactly.

import { round2, parseMoney, formatMonthYear } from './format';
import { grossOf, summariseApportionments } from './calc';
import { FIXED_FEE_NET } from '../theme';

const isSdlt = (label) => /stamp duty land tax|^sdlt/i.test(label || '');
const isEstateAgent = (label) => /estate agent/i.test(label || '');

// The effective net amount for a line. An estate agent commission line entered
// as a percentage is worked out from the sale price.
export function effectiveNet(line, salePrice) {
  if (isEstateAgent(line.label) && parseMoney(line.pct) > 0) {
    return round2(parseMoney(salePrice) * parseMoney(line.pct) / 100);
  }
  return parseMoney(line.amount);
}

// A short note printed under a line: the SDLT rate basis, or "X% of sale price".
export function lineNote(line, salePrice) {
  if (isEstateAgent(line.label) && parseMoney(line.pct) > 0) return `${line.pct}% of sale price`;
  if (isSdlt(line.label) && line.sdltBasis) return line.sdltBasis;
  return undefined;
}

let seq = 0;
const uid = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`;

export function newLine(init = {}) {
  return { id: uid(), label: '', amount: '', vatable: false, ...init };
}

export function newCharge(init = {}) {
  return {
    id: uid(),
    name: 'Service Charge',
    category: 'Service Charge',
    periodStart: '',
    periodEnd: '',
    totalCharge: '',
    accountBalance: '',
    balanceType: 'arrears', // 'arrears' (account owes) | 'credit' (account in credit)
    expanded: true,
    ...init,
  };
}

export function newStatement(matterType) {
  return {
    matterType, // 'purchase' | 'sale'
    clients: '',
    address: '',
    ourRef: '',
    completionDate: '',
    status: 'Draft', // 'Draft' | 'Final'
    price: '',
    contentsPrice: '',
    // Fees section: prefilled with our fixed legal fee (net, VAT applies). The
    // lawyer amends it on the exceptional matters; VAT is pre-ticked here only.
    costs: [newLine({
      label: 'Our Legal Fee',
      amount: FIXED_FEE_NET[matterType === 'purchase' ? 'purchase' : 'sale'].toFixed(2),
      vatable: true,
    })],
    otherCosts: [], // "Costs" section: SDLT / redemption / agent commission / etc.
    funds: [], // receipts: deposit, mortgage advance, funds from sale, POA
    allowances: [],
    includeApportionments: false,
    charges: [newCharge()],
  };
}

// Only Draft or Final are valid; coerce anything else (e.g. an old "Provisional").
export const normalizeStatus = (s) => (s === 'Final' ? 'Final' : 'Draft');

const hasChargeData = (c) => c.periodStart || c.periodEnd || parseMoney(c.totalCharge)
  || (c.accountBalance !== '' && c.accountBalance != null);

// A line list is "untouched" if it is empty, matches the given template (same
// labels and amounts), or is just a legacy empty "Our Legal Fee" row.
function listIsUntouched(lines, template) {
  const l = lines || [];
  if (l.length === 0) return true;
  if (l.length === 1 && l[0].label === 'Our Legal Fee' && !parseMoney(l[0].amount) && !l[0].pct) return true;
  if (l.length !== template.length) return false;
  return l.every((x, i) => (x.label || '') === (template[i].label || '')
    && String(x.amount || '') === String(template[i].amount || ''));
}

// True when a statement holds no real work beyond the template: no matter
// details, no figures the lawyer entered, no allowances, no apportionment data.
// Used to discard a leftover blank autosave so a fresh statement starts from the
// current template.
export function isBlankStatement(s, matterType) {
  if (!s) return true;
  const mt = matterType || s.matterType || 'purchase';
  if (s.clients || s.address || s.ourRef || s.completionDate) return false;
  if (parseMoney(s.price) || parseMoney(s.contentsPrice)) return false;
  if ((s.allowances || []).some((a) => a.description || parseMoney(a.amount))) return false;
  if (s.includeApportionments && (s.charges || []).some(hasChargeData)) return false;
  const tmpl = newStatement(mt);
  if (!listIsUntouched(s.costs, tmpl.costs)) return false;
  if (!listIsUntouched(s.otherCosts, tmpl.otherCosts)) return false;
  if (!listIsUntouched(s.funds, tmpl.funds)) return false;
  return true;
}

export function isBlankLinked(state) {
  if (!state) return true;
  if (state.clients || state.completionDate) return false;
  return isBlankStatement(state.sale, 'sale') && isBlankStatement(state.purchase, 'purchase');
}

// A linked sale-and-purchase: shared client/date/status, plus a sale and a
// purchase sub-statement. The net sale balance feeds the purchase automatically.
export function newLinked() {
  return {
    mode: 'linked',
    clients: '',
    completionDate: '',
    status: 'Draft',
    sale: newStatement('sale'),
    purchase: newStatement('purchase'),
  };
}

// Compute both sides of a linked deal. The sale's net balance is injected into
// the purchase as a single "Net sale proceeds" receipt line.
export function computeLinked(state) {
  const shared = { clients: state.clients, completionDate: state.completionDate, status: state.status };
  const saleStatement = { ...state.sale, ...shared, matterType: 'sale' };
  const sale = computeStatement(saleStatement);

  // owedToClient -> proceeds available to the purchase; dueFromClient -> a shortfall to carry.
  const netProceeds = sale.direction === 'owedToClient' ? sale.absTotal : -sale.absTotal;
  const proceedsLine = { id: 'net-sale-proceeds', label: 'Net sale proceeds', amount: String(round2(netProceeds)), vatable: false, locked: true };

  const purchaseStatement = {
    ...state.purchase,
    ...shared,
    matterType: 'purchase',
    funds: [proceedsLine, ...state.purchase.funds],
  };
  const purchase = computeStatement(purchaseStatement);

  return { sale, purchase, netProceeds, saleStatement, purchaseStatement };
}

// Effective signed account balance for a charge (+ = arrears, - = credit).
export function chargeBalanceValue(charge) {
  const n = parseMoney(charge.accountBalance);
  return charge.balanceType === 'credit' ? -Math.abs(n) : Math.abs(n);
}

function chargeForCalc(charge) {
  return { ...charge, accountBalance: charge.accountBalance === '' ? '' : chargeBalanceValue(charge) };
}

const lineHasContent = (l) => l.label || parseMoney(l.amount) || parseMoney(l.pct);

// Build a "Costs" section payment line, resolving an estate agent percentage and
// attaching a sub-note (SDLT basis, or "X% of sale price").
function costLine(l, salePrice) {
  return {
    label: l.label || 'Cost',
    payment: grossOf(effectiveNet(l, salePrice), l.vatable),
    vatable: l.vatable,
    note: lineNote(l, salePrice),
  };
}

/**
 * Build the ledger. Returns:
 *  { sections: [{ key, title, lines: [{label, payment, receipt}], subtotal, column }],
 *    total, absTotal, direction: 'dueFromClient' | 'owedToClient', wording }
 */
export function computeStatement(state) {
  const isPurchase = state.matterType === 'purchase';
  const appt = state.includeApportionments
    ? summariseApportionments(state.charges.map(chargeForCalc), state.completionDate)
    : { byCategory: {}, periodEnds: [], singlePeriodEnd: null };

  const sections = [];

  if (isPurchase) {
    // Section 1: purchase price (PAYMENTS) - price and contents only
    const s1 = [];
    if (parseMoney(state.price) !== 0 || state.price !== '') s1.push({ label: 'Basic Purchase Price', payment: parseMoney(state.price) });
    if (parseMoney(state.contentsPrice) > 0) s1.push({ label: 'Contents / Fixtures Price', payment: parseMoney(state.contentsPrice) });
    sections.push(makeSection('price', 'Purchase Price', s1, 'payment'));

    // Section 2: our fees and disbursements (PAYMENTS, may carry VAT)
    const sFees = state.costs
      .filter((l) => l.label || parseMoney(l.amount))
      .map((l) => ({ label: l.label || 'Fee', payment: grossOf(l.amount, l.vatable), vatable: l.vatable }));
    sections.push(makeSection('fees', 'Fees and Disbursements', sFees, 'payment'));

    // Section 3: other costs leaving the completion account (PAYMENTS)
    const sCosts = (state.otherCosts || [])
      .filter(lineHasContent)
      .map((l) => costLine(l, state.price));
    // Apportionments the buyer owes the seller (positive)
    Object.entries(appt.byCategory).forEach(([cat, v]) => {
      if (v > 0) sCosts.push({ label: `${cat} Apportionment`, payment: v });
    });
    // Seller-favour allowances increase what the buyer pays
    state.allowances.forEach((a) => {
      if (a.inFavourOf === 'seller' && parseMoney(a.amount)) sCosts.push({ label: a.description || 'Allowance in favour of seller', payment: parseMoney(a.amount) });
    });
    sections.push(makeSection('costs', 'Costs', sCosts, 'payment'));

    // Section 4: receipts and allowances (RECEIPTS)
    const s3 = [];
    state.funds.forEach((l) => {
      if (l.label || parseMoney(l.amount)) s3.push({ label: l.label || 'Receipt', receipt: parseMoney(l.amount) });
    });
    state.allowances.forEach((a) => {
      if (a.inFavourOf === 'buyer' && parseMoney(a.amount)) s3.push({ label: a.description || 'Allowance in favour of buyer', receipt: parseMoney(a.amount) });
    });
    Object.entries(appt.byCategory).forEach(([cat, v]) => {
      if (v < 0) s3.push({ label: `${cat} Apportionment (allowance)`, receipt: round2(-v) });
    });
    sections.push(makeSection('receipts', 'Receipts & Allowances', s3, 'receipt'));

    const total = round2(sections[0].subtotal + sections[1].subtotal + sections[2].subtotal - sections[3].subtotal);
    return finalise(sections, total, /* positiveMeans */ 'dueFromClient');
  }

  // ---- SALE ----
  // Section 1: sale price (RECEIPTS)
  const s1 = [];
  if (parseMoney(state.price) !== 0 || state.price !== '') s1.push({ label: 'Basic Sale Price', receipt: parseMoney(state.price) });
  if (parseMoney(state.contentsPrice) > 0) s1.push({ label: 'Fittings / Contents Price', receipt: parseMoney(state.contentsPrice) });
  sections.push(makeSection('price', 'Sale Price', s1, 'receipt'));

  // Section 2: our fees and disbursements (PAYMENTS, may carry VAT)
  const sFees = state.costs
    .filter((l) => l.label || parseMoney(l.amount))
    .map((l) => ({ label: l.label || 'Fee', payment: grossOf(l.amount, l.vatable), vatable: l.vatable }));
  sections.push(makeSection('fees', 'Fees and Disbursements', sFees, 'payment'));

  // Section 3: other costs leaving the completion account (PAYMENTS)
  const sCosts = (state.otherCosts || [])
    .filter(lineHasContent)
    .map((l) => costLine(l, state.price));
  state.allowances.forEach((a) => {
    if (a.inFavourOf === 'buyer' && parseMoney(a.amount)) sCosts.push({ label: a.description || 'Allowance to buyer', payment: parseMoney(a.amount) });
  });
  Object.entries(appt.byCategory).forEach(([cat, v]) => {
    if (v < 0) sCosts.push({ label: `${cat} Apportionment allowed to buyer`, payment: round2(-v) });
  });
  sections.push(makeSection('costs', 'Costs', sCosts, 'payment'));

  // Section 4: receipts and allowances (RECEIPTS)
  const s3 = [];
  state.funds.forEach((l) => {
    if (l.label || parseMoney(l.amount)) s3.push({ label: l.label || 'Receipt', receipt: parseMoney(l.amount) });
  });
  state.allowances.forEach((a) => {
    if (a.inFavourOf === 'seller' && parseMoney(a.amount)) s3.push({ label: a.description || 'Allowance in favour of seller', receipt: parseMoney(a.amount) });
  });
  Object.entries(appt.byCategory).forEach(([cat, v]) => {
    if (v > 0) {
      const until = appt.singlePeriodEnd ? ` until the end of ${formatMonthYear(appt.singlePeriodEnd)}` : '';
      s3.push({ label: `${cat} apportionment from buyer${until}`, receipt: v });
    }
  });
  sections.push(makeSection('receipts', 'Receipts & Allowances', s3, 'receipt'));

  const total = round2(sections[0].subtotal + sections[3].subtotal - sections[1].subtotal - sections[2].subtotal);
  return finalise(sections, total, /* positiveMeans */ 'owedToClient', appt);
}

function makeSection(key, title, lines, column) {
  const subtotal = round2(lines.reduce((t, l) => round2(t + (l.payment || 0) + (l.receipt || 0)), 0));
  return { key, title, column, lines, subtotal };
}

function finalise(sections, total, positiveMeans, appt) {
  const direction = total >= 0 ? positiveMeans : (positiveMeans === 'dueFromClient' ? 'owedToClient' : 'dueFromClient');
  const wording = direction === 'dueFromClient'
    ? 'This balance is due from you.'
    : 'This balance is owed to you.';
  return { sections, total, absTotal: Math.abs(total), direction, wording, appt };
}
