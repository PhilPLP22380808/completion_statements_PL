// Calculation engine: apportionments (SCS 5th ed. condition 6.3) and statement totals.
// All money that ends up on a statement is rounded to whole pence here, so the
// printed figures and the printed sub-totals always agree.

import { round2, parseMoney } from './format';
import { VAT_RATE } from '../theme';

// Whole days from startDate to endDate (both 'YYYY-MM-DD'). DST-safe: date inputs
// parse as UTC midnight, so the millisecond difference is an exact multiple of a day.
export function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) return null;
  return Math.round((end - start) / 86400000);
}

/**
 * Apportion a single periodic charge (service charge, ground rent, etc.).
 *
 * SCS 6.3.3: the seller is assumed to own the property until the end of the
 * completion day, so the buyer bears the charge from the day after completion to
 * the end of the billing period. That span is (periodEnd - completionDate) days,
 * which naturally excludes the completion day itself.
 *
 * `accountBalance` is what is still outstanding on the account per the managing
 * agent's statement (positive = arrears the account still owes; negative = the
 * account is in credit). The buyer inherits that balance at completion, so the
 * apportionment trues each party up to their time-based share of it.
 *
 * Returns figures progressively as inputs become available; `amountToApportion`
 * is rounded to whole pence and is the figure that goes on the statement.
 */
export function calculateApportionment(charge, completionDate) {
  const periodStart = charge.periodStart;
  const periodEnd = charge.periodEnd;
  const totalCharge = parseMoney(charge.totalCharge);
  const hasBalance = charge.accountBalance !== '' && charge.accountBalance !== null && charge.accountBalance !== undefined;
  const accountBalance = hasBalance ? parseMoney(charge.accountBalance) : null;

  const result = {
    daysInPeriod: null,
    dailyRate: null,
    daysToApportion: null,
    buyerShare: null,
    amountToApportion: null,
    paidTo: null,        // 'Buyer' | 'Seller'
    action: null,        // 'deduct' | 'add'  (relative to the buyer's completion balance)
    complete: false,
  };

  if (periodStart && periodEnd) {
    const dip = daysBetween(periodStart, periodEnd);
    if (dip && dip > 0) {
      result.daysInPeriod = dip;
      if (totalCharge > 0) result.dailyRate = totalCharge / dip;
    }
  }

  if (completionDate && periodEnd) {
    result.daysToApportion = daysBetween(completionDate, periodEnd);
  }

  if (result.dailyRate !== null && result.daysToApportion !== null && accountBalance !== null) {
    const buyerShare = round2(result.dailyRate * result.daysToApportion);
    result.buyerShare = buyerShare;
    const diff = round2(accountBalance - buyerShare);

    if (diff >= 0) {
      // Account owes more than the buyer's forward share -> seller credits the buyer.
      result.amountToApportion = diff;
      result.paidTo = 'Buyer';
      result.action = 'deduct';
    } else {
      // Buyer's forward share exceeds the outstanding balance -> buyer pays the seller.
      result.amountToApportion = round2(-diff);
      result.paidTo = 'Seller';
      result.action = 'add';
    }
    result.complete = true;
  }

  return result;
}

// Group completed apportionments by category, signed from the BUYER's perspective:
// positive = buyer pays the seller (adds to the purchase completion balance),
// negative = seller credits the buyer.
export function summariseApportionments(charges, completionDate) {
  const byCategory = {};
  let periodEnds = new Set();

  charges.forEach((charge) => {
    const calc = calculateApportionment(charge, completionDate);
    if (!calc.complete) return;
    const cat = charge.category || 'Other';
    const signed = calc.action === 'add' ? calc.amountToApportion : -calc.amountToApportion;
    byCategory[cat] = round2((byCategory[cat] || 0) + signed);
    if (charge.periodEnd) periodEnds.add(charge.periodEnd);
  });

  return {
    byCategory,                                   // { 'Service Charge': 123.45, 'Ground Rent': -4.20 }
    periodEnds: Array.from(periodEnds).sort(),     // for the narrative line
    singlePeriodEnd: periodEnds.size === 1 ? Array.from(periodEnds)[0] : null,
  };
}

// VAT for one fee line, rounded per line (matches how the firm's statements read).
export function vatOn(net, vatable) {
  if (!vatable) return 0;
  return round2(parseMoney(net) * VAT_RATE);
}

export function grossOf(net, vatable) {
  return round2(parseMoney(net) + vatOn(net, vatable));
}

// Sum a list of { amount, vatable } lines to a gross total (pence-exact).
export function sumLines(lines) {
  return round2((lines || []).reduce((t, l) => round2(t + grossOf(l.amount, l.vatable)), 0));
}
