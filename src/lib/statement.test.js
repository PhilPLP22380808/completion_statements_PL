import { newStatement, newLine, computeStatement } from './statement';

// Reproduces the firm's real "Purchase Completion Statement (12)", Crosby.
test('purchase statement totals match a real worked example', () => {
  const s = {
    ...newStatement('purchase'),
    price: '290000',
    priceAdditions: [newLine({ label: 'Land Registration Fee', amount: '150' })],
    costs: [
      newLine({ label: 'Our Legal Fee', amount: '1795', vatable: true }),   // 1795 + VAT = 2154
      newLine({ label: 'Search Pack Fee', amount: '245', vatable: true }),  // 245 + VAT = 294
    ],
    funds: [
      newLine({ label: 'Mortgage Advance', amount: '275500' }),
      newLine({ label: 'Deposit', amount: '14500' }),
    ],
  };
  const c = computeStatement(s);
  expect(c.sections[0].subtotal).toBeCloseTo(290150, 2);
  expect(c.sections[1].subtotal).toBeCloseTo(2448, 2);
  expect(c.sections[2].subtotal).toBeCloseTo(290000, 2);
  expect(c.total).toBeCloseTo(2598, 2);
  expect(c.direction).toBe('dueFromClient');
});

// Reproduces "Sale Completion Statement (17)", Longbottom.
test('sale statement: proceeds owed to the client', () => {
  const s = {
    ...newStatement('sale'),
    price: '365000',
    costs: [
      newLine({ label: 'Our Legal Fee', amount: '1595', vatable: true }),      // 1595 + VAT = 1914
      newLine({ label: 'Estate Agent Commission', amount: '8840', vatable: false }),
    ],
  };
  const c = computeStatement(s);
  expect(c.sections[0].subtotal).toBeCloseTo(365000, 2);
  expect(c.sections[1].subtotal).toBeCloseTo(10754, 2);
  expect(c.total).toBeCloseTo(354246, 2);
  expect(c.direction).toBe('owedToClient');
  expect(c.wording).toMatch(/owed to you/);
});

test('purchase: buyer-favour allowance reduces the balance; seller-favour increases it', () => {
  const base = { ...newStatement('purchase'), price: '400000' };
  const buyerFav = computeStatement({ ...base, allowances: [{ id: 'a', description: 'SC credit', amount: '750', inFavourOf: 'buyer' }] });
  const sellerFav = computeStatement({ ...base, allowances: [{ id: 'a', description: 'Extra', amount: '750', inFavourOf: 'seller' }] });
  expect(buyerFav.total).toBeCloseTo(400000 - 750, 2);
  expect(sellerFav.total).toBeCloseTo(400000 + 750, 2);
});

test('apportionments fold into the purchase price section', () => {
  const s = {
    ...newStatement('purchase'),
    price: '300000',
    includeApportionments: true,
    completionDate: '2026-07-01',
    charges: [{
      id: 'c1', name: 'Service Charge', category: 'Service Charge',
      periodStart: '2026-01-01', periodEnd: '2026-12-31',
      totalCharge: '1200', accountBalance: '0', balanceType: 'arrears',
    }],
  };
  const c = computeStatement(s);
  const scLine = c.sections[0].lines.find((l) => l.label === 'Service Charge Apportionment');
  expect(scLine).toBeTruthy();
  expect(scLine.payment).toBeCloseTo(603.30, 2);
  expect(c.total).toBeCloseTo(300000 + 603.30, 2);
});
