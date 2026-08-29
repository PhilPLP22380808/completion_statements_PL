// Quick-add catalogues for the statement sections. `vatable` is the default
// VAT-on/off state for that line; the user can still toggle it per line.

// Purchase — Section 1 additions to the gross price (no VAT column here).
export const purchasePriceAdditions = [
  { label: 'Stamp Duty Land Tax' },
  { label: 'Land Transaction Tax (Wales)' },
  { label: 'Land and Buildings Transaction Tax (Scotland)' },
  { label: 'Land Registration Fee' },
  { label: 'Bankruptcy Search Fee' },
  { label: 'OS1 Priority Search Fee' },
  { label: 'Notice of Transfer / Charge Fee' },
  { label: 'Deed of Covenant Fee' },
  { label: 'Certificate of Compliance Fee' },
  { label: 'Share Certificate Fee' },
  { label: 'Chancel Repair Indemnity' },
  { label: 'Misc Payment' },
];

// Purchase — Section 2 costs & disbursements.
export const purchaseCosts = [
  { label: 'Our Legal Fee', vatable: true },
  { label: 'Search Pack Fee', vatable: true },
  { label: 'Leasehold Supplement Fee', vatable: true },
  { label: 'Newbuild Supplement Fee', vatable: true },
  { label: 'Shared Ownership Fee', vatable: true },
  { label: 'Help to Buy Fee', vatable: true },
  { label: 'Help to Buy ISA / LISA Fee', vatable: true },
  { label: 'Right to Buy Fee', vatable: true },
  { label: 'Company Purchase Fee', vatable: true },
  { label: 'Declaration of Trust Fee', vatable: true },
  { label: 'Gifted Deposit Fee', vatable: true },
  { label: 'Unregistered Property Fee', vatable: true },
  { label: 'Indemnity Insurance Policy Fee', vatable: true },
  { label: 'Islamic Mortgage Fee', vatable: true },
  { label: 'Secondary Lender Fee', vatable: true },
  { label: 'Auction Fee', vatable: true },
  { label: 'Repossession Fee', vatable: true },
  { label: 'Declaration of Solvency Fee', vatable: true },
  { label: 'HMLR Searches Admin Fee', vatable: true },
  { label: 'Stamp Duty Return Fee', vatable: true },
  { label: 'Telegraphic Transfer / Bank Fee', vatable: true },
];

// Purchase — Section 3 funds received / allowances.
export const purchaseFunds = [
  { label: 'Deposit' },
  { label: 'Mortgage Advance' },
  { label: 'Mortgage Cashback' },
  { label: 'Payment on Account' },
  { label: 'Net Sale Proceeds' },
  { label: 'Help to Buy ISA / LISA Bonus' },
  { label: 'Gifted Deposit' },
  { label: 'Miscellaneous Receipt' },
];

// Sale — Section 2 costs & disbursements.
export const saleCosts = [
  { label: 'Our Legal Fee', vatable: true },
  { label: 'Leasehold Fee', vatable: true },
  { label: 'Unregistered Property Fee', vatable: true },
  { label: 'Additional Redemption Fee', vatable: true },
  { label: 'AML Search Fee', vatable: true },
  { label: 'Telegraphic Transfer / Bank Fee', vatable: true },
  { label: 'Mortgage Redemption' },
  { label: 'Second Mortgage Redemption' },
  { label: 'Estate Agent Commission' },
  { label: 'Leasehold Pack / OCE Fee' },
  { label: 'Leaseholder / Management Pack Fee' },
  { label: 'Notice of Transfer / Charge Fee' },
  { label: 'Misc Payment' },
];

// Sale — Section 3 receipts / allowances.
export const saleReceipts = [
  { label: 'Payment on Account' },
  { label: 'Apportionments from Buyer' },
  { label: 'Miscellaneous Receipt' },
];

export const APPORTIONMENT_CATEGORIES = ['Service Charge', 'Ground Rent', 'Rent', 'Other'];
