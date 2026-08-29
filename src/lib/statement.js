// Statement data model + the routine that turns form state into a rendered
// ledger (sections of lines with PAYMENTS / RECEIPTS columns, sub-totals and a
// grand total). Every figure here is pence-rounded so columns foot exactly.

import { round2, parseMoney, formatMonthYear } from './format';
import { grossOf, summariseApportionments } from './calc';

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
    status: 'Provisional', // 'Draft' | 'Provisional' | 'Final'
    price: '',
    contentsPrice: '',
    priceAdditions: [], // purchase only: SDLT etc.
    costs: [newLine({ label: 'Our Legal Fee', vatable: true })],
    funds: [], // purchase: deposit/mortgage/etc.  sale: receipts
    allowances: [],
    includeApportionments: false,
    charges: [newCharge()],
  };
}

// A linked sale-and-purchase: shared client/date/status, plus a sale and a
// purchase sub-statement. The net sale balance feeds the purchase automatically.
export function newLinked() {
  return {
    mode: 'linked',
    clients: '',
    completionDate: '',
    status: 'Provisional',
    sale: { ...newStatement('sale'), costs: [newLine({ label: 'Our Legal Fee', vatable: true })] },
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
    // Section 1: purchase price and additions (all PAYMENTS)
    const s1 = [];
    if (parseMoney(state.price) !== 0 || state.price !== '') s1.push({ label: 'Basic Purchase Price', payment: parseMoney(state.price) });
    if (parseMoney(state.contentsPrice) > 0) s1.push({ label: 'Contents / Fixtures Price', payment: parseMoney(state.contentsPrice) });
    state.priceAdditions.forEach((l) => {
      if (l.label || parseMoney(l.amount)) s1.push({ label: l.label || 'Payment', payment: parseMoney(l.amount) });
    });
    // Apportionments the buyer owes the seller (positive) sit here
    Object.entries(appt.byCategory).forEach(([cat, v]) => {
      if (v > 0) s1.push({ label: `${cat} Apportionment`, payment: v });
    });
    // Seller-favour allowances increase what the buyer pays
    state.allowances.forEach((a) => {
      if (a.inFavourOf === 'seller' && parseMoney(a.amount)) s1.push({ label: a.description || 'Allowance in favour of seller', payment: parseMoney(a.amount) });
    });
    sections.push(makeSection('price', 'Purchase Price', s1, 'payment'));

    // Section 2: costs and disbursements (PAYMENTS, may carry VAT)
    const s2 = state.costs
      .filter((l) => l.label || parseMoney(l.amount))
      .map((l) => ({ label: l.label || 'Cost', payment: grossOf(l.amount, l.vatable), vatable: l.vatable }));
    sections.push(makeSection('costs', 'Costs & Disbursements', s2, 'payment'));

    // Section 3: funds received and allowances (RECEIPTS)
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
    sections.push(makeSection('funds', 'Funds Received & Allowances', s3, 'receipt'));

    const total = round2(sections[0].subtotal + sections[1].subtotal - sections[2].subtotal);
    return finalise(sections, total, /* positiveMeans */ 'dueFromClient');
  }

  // ---- SALE ----
  const s1 = [];
  if (parseMoney(state.price) !== 0 || state.price !== '') s1.push({ label: 'Basic Sale Price', receipt: parseMoney(state.price) });
  if (parseMoney(state.contentsPrice) > 0) s1.push({ label: 'Fittings / Contents Price', receipt: parseMoney(state.contentsPrice) });
  sections.push(makeSection('price', 'Sale Price', s1, 'receipt'));

  // Section 2: costs and disbursements (PAYMENTS)
  const s2 = state.costs
    .filter((l) => l.label || parseMoney(l.amount))
    .map((l) => ({ label: l.label || 'Cost', payment: grossOf(l.amount, l.vatable), vatable: l.vatable }));
  state.allowances.forEach((a) => {
    if (a.inFavourOf === 'buyer' && parseMoney(a.amount)) s2.push({ label: a.description || 'Allowance to buyer', payment: parseMoney(a.amount) });
  });
  Object.entries(appt.byCategory).forEach(([cat, v]) => {
    if (v < 0) s2.push({ label: `${cat} Apportionment allowed to buyer`, payment: round2(-v) });
  });
  sections.push(makeSection('costs', 'Costs & Disbursements', s2, 'payment'));

  // Section 3: receipts and allowances (RECEIPTS)
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

  const total = round2(sections[0].subtotal + sections[2].subtotal - sections[1].subtotal);
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
