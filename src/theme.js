// Brand colours extracted from the Pinnacle logo
export const colors = {
  burgundy: '#722F37',
  burgundyDark: '#5a252c',
  burgundyLight: '#9e4a54',
  rose: '#b85a6a',
  blush: '#d4a5ab',
  ink: '#1a1a1a',
  muted: '#666',
  faint: '#888',
  line: '#e8e4e5',
  panel: '#faf8f8',
  positive: '#16a34a',
  negative: '#dc2626',
};

// Firm details, printed on outward-facing statements.
// `name` is the trading name used in the branding; `legalName` is the registered
// company name used in the formal regulatory statement.
export const firm = {
  name: 'Pinnacle Law',
  legalName: 'Pinnacle Property Lawyers',
  addressLines: ['1 King William Street', 'London', 'EC4N 7BJ'],
  phone: '020 3948 6660',
  email: 'hello@pinnacle.law',
  regulator: 'Council for Licensed Conveyancers',
  companyNumber: '14308410',
  licenceNumber: '14497',
  regulatoryNote:
    'Pinnacle Property Lawyers (trading as Pinnacle Law) is a company registered in England and Wales, ' +
    'company registration number 14308410. The firm is authorised and regulated by the Council for Licensed ' +
    'Conveyancers in the conduct of Conveyancing and Wills and Probate services, Licence number 14497. A list ' +
    'of Directors is available upon request and is open to inspection at our registered office: ' +
    '1 King William Street, London, EC4N 7BJ.',
};

export const VAT_RATE = 0.20;

// The firm's standard fixed legal fees, net of VAT (inc VAT: purchase £2,495,
// sale £1,995). The purchase fee already includes the search package. Prefilled
// on new statements; the lawyer amends it on the exceptional matters.
export const FIXED_FEE_NET = {
  purchase: 2079.17,
  sale: 1662.50,
};

export const cardStyle = {
  background: 'white',
  borderRadius: 16,
  padding: 28,
  marginBottom: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(114, 47, 55, 0.06)',
};

export const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e0dada',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
};

export const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: '#888',
  marginBottom: 4,
};
