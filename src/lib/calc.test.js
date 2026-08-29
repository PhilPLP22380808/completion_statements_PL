import { daysBetween, calculateApportionment, summariseApportionments, vatOn, grossOf, sumLines } from './calc';

describe('daysBetween', () => {
  test('counts whole days, DST-safe', () => {
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31); // spans BST clock change
    expect(daysBetween('2026-07-01', '2026-12-31')).toBe(183);
  });
  test('null when a date is missing', () => {
    expect(daysBetween('', '2026-01-01')).toBeNull();
  });
});

describe('calculateApportionment (SCS 6.3.3, seller keeps completion day)', () => {
  const period = { periodStart: '2026-01-01', periodEnd: '2026-12-31', totalCharge: '1200' };

  test('seller paid in full: buyer reimburses their post-completion share', () => {
    const r = calculateApportionment({ ...period, accountBalance: '0' }, '2026-07-01');
    expect(r.daysInPeriod).toBe(364);
    expect(r.daysToApportion).toBe(183);
    expect(r.buyerShare).toBeCloseTo(603.30, 2);
    expect(r.paidTo).toBe('Seller');
    expect(r.action).toBe('add');
    expect(r.amountToApportion).toBeCloseTo(603.30, 2);
  });

  test('nothing paid: seller credits the buyer for the pre-completion share', () => {
    const r = calculateApportionment({ ...period, accountBalance: '1200' }, '2026-07-01');
    expect(r.paidTo).toBe('Buyer');
    expect(r.action).toBe('deduct');
    expect(r.amountToApportion).toBeCloseTo(596.70, 2);
  });

  test('account in credit is added to what the buyer reimburses the seller', () => {
    const r = calculateApportionment({ ...period, accountBalance: -300 }, '2026-07-01');
    expect(r.paidTo).toBe('Seller');
    expect(r.amountToApportion).toBeCloseTo(903.30, 2);
  });

  test('incomplete inputs return progressively, complete=false', () => {
    const r = calculateApportionment({ periodStart: '2026-01-01', periodEnd: '', totalCharge: '', accountBalance: '' }, '');
    expect(r.complete).toBe(false);
    expect(r.amountToApportion).toBeNull();
  });
});

describe('summariseApportionments', () => {
  test('groups by category, signed from the buyer perspective', () => {
    const charges = [
      { category: 'Service Charge', periodStart: '2026-01-01', periodEnd: '2026-12-31', totalCharge: '1200', accountBalance: '0' },
      { category: 'Ground Rent', periodStart: '2026-01-01', periodEnd: '2026-12-31', totalCharge: '250', accountBalance: '250' },
    ];
    const s = summariseApportionments(charges, '2026-07-01');
    expect(s.byCategory['Service Charge']).toBeCloseTo(603.30, 2); // buyer pays seller
    expect(s.byCategory['Ground Rent']).toBeLessThan(0);           // seller credits buyer
    expect(s.singlePeriodEnd).toBe('2026-12-31');
  });
});

describe('VAT', () => {
  test('per-line VAT rounds to the penny', () => {
    expect(vatOn('1795', true)).toBeCloseTo(359, 2);
    expect(vatOn('1795', false)).toBe(0);
    expect(grossOf('1795', true)).toBeCloseTo(2154, 2);
  });
  test('sumLines totals gross', () => {
    expect(sumLines([{ amount: '1795', vatable: true }, { amount: '245', vatable: true }])).toBeCloseTo(2448, 2);
  });
});
