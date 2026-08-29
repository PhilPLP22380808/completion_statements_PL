// Quick-add catalogues for the statement sections. `vatable` is the default
// VAT-on/off state for that line; the user can still toggle it per line.

// Purchase: our fees and the disbursements we incur doing the legal work.
export const purchaseFees = [
  { label: 'Our Legal Fee', vatable: true },
  { label: 'Search Pack Fee', vatable: true },
  { label: 'Bankruptcy Search Fee' },
  { label: 'OS1 Priority Search Fee' },
  { label: 'AML / ID Check Fee', vatable: true },
  { label: 'Telegraphic Transfer / Bank Fee', vatable: true },
  { label: 'HMLR Searches Admin Fee', vatable: true },
  { label: 'Stamp Duty Return Fee', vatable: true },
  { label: 'Expedited Completion Fee', vatable: true },
  { label: 'Leasehold Supplement Fee', vatable: true },
  { label: 'Newbuild Supplement Fee', vatable: true },
  { label: 'Shared Ownership Fee', vatable: true },
  { label: 'Help to Buy Fee', vatable: true },
  { label: 'Help to Buy ISA / LISA Fee', vatable: true },
  { label: 'Right to Buy Fee', vatable: true },
  { label: 'Company Purchase Fee', vatable: true },
  { label: 'Declaration of Trust Fee', vatable: true },
  { label: 'Declaration of Solvency Fee', vatable: true },
  { label: 'Gifted Deposit Fee', vatable: true },
  { label: 'Unregistered Property Fee', vatable: true },
  { label: 'Islamic Mortgage Fee', vatable: true },
  { label: 'Secondary Lender Fee', vatable: true },
  { label: 'Auction Fee', vatable: true },
  { label: 'Repossession Fee', vatable: true },
];

// Purchase: other money leaving the completion account (not our fee or disbursement).
export const purchaseCostItems = [
  { label: 'Stamp Duty Land Tax' },
  { label: 'Land Transaction Tax (Wales)' },
  { label: 'Land and Buildings Transaction Tax (Scotland)' },
  { label: 'Land Registration Fee' },
  { label: 'Notice of Transfer / Charge Fee' },
  { label: 'Deed of Covenant Fee' },
  { label: 'Certificate of Compliance Fee' },
  { label: 'Share Certificate Fee' },
  { label: 'Chancel Repair Indemnity' },
  { label: 'Restrictive Covenant Indemnity' },
  { label: 'Other Indemnity Policy Premium' },
  { label: 'Misc Payment' },
];

// Purchase, section 3 funds received / allowances.
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

// Sale: our fees and the disbursements we incur doing the legal work.
export const saleFees = [
  { label: 'Our Legal Fee', vatable: true },
  { label: 'Leasehold Supplement Fee', vatable: true },
  { label: 'Unregistered Property Fee', vatable: true },
  { label: 'Additional Redemption Fee', vatable: true },
  { label: 'Expedited Completion Fee', vatable: true },
  { label: 'AML / ID Check Fee', vatable: true },
  { label: 'Telegraphic Transfer / Bank Fee', vatable: true },
  { label: 'Office Copies / OCE Fee' },
  { label: 'Bankruptcy Search Fee' },
];

// Sale: other money leaving the completion account (not our fee or disbursement).
export const saleCostItems = [
  { label: 'Mortgage Redemption' },
  { label: 'Second Mortgage Redemption' },
  { label: 'Estate Agent Commission' },
  { label: 'Leasehold / Management Pack Fee' },
  { label: 'Notice of Transfer / Charge Fee' },
  { label: 'Deed of Covenant Fee' },
  { label: 'Landlord / Freeholder Fees' },
  { label: 'Misc Payment' },
];

// Sale, section 3 receipts / allowances.
export const saleReceipts = [
  { label: 'Payment on Account' },
  { label: 'Apportionments from Buyer' },
  { label: 'Miscellaneous Receipt' },
];

export const APPORTIONMENT_CATEGORIES = ['Service Charge', 'Ground Rent', 'Rent', 'Other'];

// Common descriptions for the Allowances & adjustments rows. Offered as a
// type-ahead list; the field stays free text.
export const ALLOWANCE_DESCRIPTIONS = [
  'Allowance for Indemnity Policy',
  'Fixtures and Fittings',
  'Allowance for Works',
  'Service Charge Credit',
  'Allowance for Outstanding / Snagging Works',
  'Allowance for Repairs',
  "Seller's Contribution to Buyer's Costs",
  'Allowance for Unpaid Invoices',
  'Damaged or Missing Items',
  'Allowance for White Goods or Appliances',
  'Rent / Tenancy Deposit',
  'Compensation for Late Completion',
];
