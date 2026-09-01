import { newStatement, newLine, computeStatement, newLinked, computeLinked, isBlankStatement, isBlankLinked } from './statement';

// Reproduces the firm's real "Purchase Completion Statement (12)", Crosby.
// Purchase statement has 4 sections: price, fees & disbursements, costs, receipts.
test('purchase statement totals match a real worked example', () => {
  const s = {
    ...newStatement('purchase'),
    price: '290000',
    costs: [
      newLine({ label: 'Our Legal Fee', amount: '1795', vatable: true }),   // 1795 + VAT = 2154
      newLine({ label: 'Search Pack Fee', amount: '245', vatable: true }),  // 245 + VAT = 294
    ],
    otherCosts: [newLine({ label: 'Land Registration Fee', amount: '150' })],
    funds: [
      newLine({ label: 'Mortgage Advance', amount: '275500' }),
      newLine({ label: 'Deposit', amount: '14500' }),
    ],
  };
  const c = computeStatement(s);
  expect(c.sections.map((x) => x.title)).toEqual(['Purchase Price', 'Fees and Disbursements', 'Costs', 'Receipts & Allowances']);
  expect(c.sections[0].subtotal).toBeCloseTo(290000, 2);
  expect(c.sections[1].subtotal).toBeCloseTo(2448, 2);
  expect(c.sections[2].subtotal).toBeCloseTo(150, 2);
  expect(c.sections[3].subtotal).toBeCloseTo(290000, 2);
  expect(c.total).toBeCloseTo(2598, 2);
  expect(c.direction).toBe('dueFromClient');
});

// Reproduces "Sale Completion Statement (17)", Longbottom.
// Sale statement has 4 sections: price, fees & disbursements, costs, receipts.
test('sale statement: proceeds owed to the client', () => {
  const s = {
    ...newStatement('sale'),
    price: '365000',
    costs: [newLine({ label: 'Our Legal Fee', amount: '1595', vatable: true })],  // 1595 + VAT = 1914
    otherCosts: [newLine({ label: 'Estate Agent Commission', amount: '8840', vatable: false })],
  };
  const c = computeStatement(s);
  expect(c.sections.map((x) => x.title)).toEqual(['Sale Price', 'Fees and Disbursements', 'Costs', 'Receipts & Allowances']);
  expect(c.sections[0].subtotal).toBeCloseTo(365000, 2);
  expect(c.sections[1].subtotal).toBeCloseTo(1914, 2);
  expect(c.sections[2].subtotal).toBeCloseTo(8840, 2);
  expect(c.total).toBeCloseTo(354246, 2);
  expect(c.direction).toBe('owedToClient');
  expect(c.wording).toMatch(/owed to you/);
});

test('new statements default to Draft', () => {
  expect(newStatement('sale').status).toBe('Draft');
  expect(newStatement('purchase').status).toBe('Draft');
});

test('fees section is prefilled with the fixed legal fee, net, VAT ticked', () => {
  const p = newStatement('purchase').costs;
  const s = newStatement('sale').costs;
  expect(p).toHaveLength(1);
  expect(p[0]).toMatchObject({ label: 'Our Legal Fee', amount: '2079.17', vatable: true });
  expect(s[0]).toMatchObject({ label: 'Our Legal Fee', amount: '1662.50', vatable: true });
});

test('a manually added fee row defaults to VAT unticked', () => {
  // newLine (used by the Add button with { vatable: false }) is unticked
  expect(newLine({ vatable: false }).vatable).toBe(false);
  expect(newLine().vatable).toBe(false);
});

test('purchase: buyer-favour allowance reduces the balance; seller-favour increases it', () => {
  const base = { ...newStatement('purchase'), price: '400000', costs: [] };
  const buyerFav = computeStatement({ ...base, allowances: [{ id: 'a', description: 'SC credit', amount: '750', inFavourOf: 'buyer' }] });
  const sellerFav = computeStatement({ ...base, allowances: [{ id: 'a', description: 'Extra', amount: '750', inFavourOf: 'seller' }] });
  expect(buyerFav.total).toBeCloseTo(400000 - 750, 2);
  expect(sellerFav.total).toBeCloseTo(400000 + 750, 2);
});

test('apportionments fold into the purchase Costs section', () => {
  const s = {
    ...newStatement('purchase'),
    price: '300000',
    costs: [],
    includeApportionments: true,
    completionDate: '2026-07-01',
    charges: [{
      id: 'c1', name: 'Service Charge', category: 'Service Charge',
      periodStart: '2026-01-01', periodEnd: '2026-12-31',
      totalCharge: '1200', accountBalance: '0', balanceType: 'arrears',
    }],
  };
  const c = computeStatement(s);
  const costs = c.sections.find((x) => x.title === 'Costs');
  const scLine = costs.lines.find((l) => l.label === 'Service Charge Apportionment');
  expect(scLine).toBeTruthy();
  expect(scLine.payment).toBeCloseTo(603.30, 2);
  expect(c.total).toBeCloseTo(300000 + 603.30, 2);
});

test('linked deal: net sale proceeds flow into the purchase', () => {
  const s = newLinked();
  s.clients = 'Rita Ann Bird';
  s.completionDate = '2026-08-28';
  s.sale.price = '430000';
  s.sale.costs = [newLine({ label: 'Our Legal Fee', amount: '1595', vatable: true })];
  s.purchase.price = '429950';
  s.purchase.costs = [newLine({ label: 'Our Legal Fee', amount: '1795', vatable: true })];

  const c = computeLinked(s);
  expect(c.sale.direction).toBe('owedToClient');
  expect(c.netProceeds).toBeCloseTo(430000 - 1914, 2); // 428,086

  const receipts = c.purchase.sections.find((x) => x.title === 'Receipts & Allowances');
  const proceeds = receipts.lines.find((l) => l.label === 'Net sale proceeds');
  expect(proceeds).toBeTruthy();
  expect(proceeds.receipt).toBeCloseTo(428086, 2);

  // purchase: 429,950 + (1795 + VAT 359) - 428,086 net proceeds
  expect(c.purchase.total).toBeCloseTo(429950 + 2154 - 428086, 2);
});

test('isBlankStatement: fresh templates are blank, any real entry is not', () => {
  expect(isBlankStatement(newStatement('purchase'))).toBe(true);
  expect(isBlankStatement(newStatement('sale'))).toBe(true);
  expect(isBlankStatement({ ...newStatement('purchase'), price: '295000' })).toBe(false);
  expect(isBlankStatement({ ...newStatement('purchase'), ourRef: 'AB/P/Smith' })).toBe(false);
  expect(isBlankStatement({ ...newStatement('sale'), costs: [newLine({ label: 'Our Legal Fee', amount: '1595' })] })).toBe(false);
  expect(isBlankLinked(newLinked())).toBe(true);
  expect(isBlankLinked({ ...newLinked(), clients: 'Jane Smith' })).toBe(false);
});

test('estate agent commission by percentage of the sale price', () => {
  const { effectiveNet, lineNote } = require('./statement');
  const line = { label: 'Estate Agent Commission', pct: '1.25', amount: '' };
  expect(effectiveNet(line, '400000')).toBeCloseTo(5000, 2);
  expect(lineNote(line, '400000')).toBe('1.25% of sale price');
  // a fixed amount, no percentage
  const fixed = { label: 'Estate Agent Commission', pct: '', amount: '3200' };
  expect(effectiveNet(fixed, '400000')).toBe(3200);
  expect(lineNote(fixed, '400000')).toBeUndefined();
});

test('SDLT basis prints as a note on the line', () => {
  const { lineNote } = require('./statement');
  expect(lineNote({ label: 'Stamp Duty Land Tax', sdltBasis: 'First-time buyer relief' })).toBe('First-time buyer relief');
  expect(lineNote({ label: 'Land Registration Fee', sdltBasis: 'x' })).toBeUndefined();
});

test('sale statement: agent commission as a percentage feeds the Costs subtotal', () => {
  const s = {
    ...newStatement('sale'),
    price: '500000',
    costs: [newLine({ label: 'Our Legal Fee', amount: '1662.50', vatable: true })],
    otherCosts: [newLine({ label: 'Estate Agent Commission', pct: '1.5', amount: '', vatable: false })],
  };
  const c = computeStatement(s);
  const costs = c.sections.find((x) => x.title === 'Costs');
  expect(costs.subtotal).toBeCloseTo(7500, 2); // 1.5% of 500,000
  expect(costs.lines[0].note).toBe('1.5% of sale price');
});
