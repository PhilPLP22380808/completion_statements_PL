// Quick-add catalogues for the statement sections. `vatable` is the default
// VAT-on/off state for that line; the user can still toggle it per line.

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
