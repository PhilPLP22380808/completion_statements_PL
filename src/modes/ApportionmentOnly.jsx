import React, { useState } from 'react';
import { Plus, Trash2, FileDown, Calculator, Building2, CalendarDays, PoundSterling, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import ApportionmentPreview from '../components/ApportionmentPreview';
import Brand from '../components/Brand';
import { downloadApportionmentOnly } from '../lib/pdf';

// Brand colors extracted from Pinnacle logo
const colors = {
  burgundy: '#722F37',
  burgundyDark: '#5a252c',
  burgundyLight: '#9e4a54',
  rose: '#b85a6a',
  blush: '#d4a5ab',
};

export default function ApportionmentOnly({ onHome }) {
  const [propertyAddress, setPropertyAddress] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchasePriceDisplay, setPurchasePriceDisplay] = useState('');

  // Format number with commas
  const formatWithCommas = (value) => {
    const num = value.replace(/[^0-9.]/g, '');
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Handle purchase price change
  const handlePurchasePriceChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    setPurchasePrice(raw);
    setPurchasePriceDisplay(formatWithCommas(e.target.value));
  };

  // Handle allowance money field change
  const handleAllowanceAmountChange = (id, value) => {
    const raw = value.replace(/,/g, '');
    setAllowances(allowances.map(a =>
      a.id === id ? { ...a, amount: raw, amountDisplay: formatWithCommas(value) } : a
    ));
  };

  // Handle apportionment money field change
  const handleApportionmentMoneyChange = (id, field, value) => {
    const raw = value.replace(/,/g, '');
    const displayField = field + 'Display';
    setApportionments(apportionments.map(a =>
      a.id === id ? { ...a, [field]: raw, [displayField]: formatWithCommas(value) } : a
    ));
  };

  const [allowances, setAllowances] = useState([
    { id: 1, description: '', amount: '', amountDisplay: '', inFavourOf: 'buyer' }
  ]);

  const [apportionments, setApportionments] = useState([
    { id: 1, name: 'Service Charge', periodStart: '', periodEnd: '', totalCharge: '', totalChargeDisplay: '', balanceOwed: '', balanceOwedDisplay: '', expanded: true }
  ]);

  // Add new allowance
  const addAllowance = () => {
    setAllowances([...allowances, {
      id: Date.now(),
      description: '',
      amount: '',
      amountDisplay: '',
      inFavourOf: 'buyer'
    }]);
  };

  // Remove allowance
  const removeAllowance = (id) => {
    if (allowances.length > 1) {
      setAllowances(allowances.filter(a => a.id !== id));
    }
  };

  // Update allowance
  const updateAllowance = (id, field, value) => {
    setAllowances(allowances.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  // Add new apportionment
  const addApportionment = () => {
    setApportionments([...apportionments, {
      id: Date.now(),
      name: 'New Charge',
      periodStart: '',
      periodEnd: '',
      totalCharge: '',
      totalChargeDisplay: '',
      balanceOwed: '',
      balanceOwedDisplay: '',
      expanded: true
    }]);
  };

  // Remove apportionment
  const removeApportionment = (id) => {
    if (apportionments.length > 1) {
      setApportionments(apportionments.filter(a => a.id !== id));
    }
  };

  // Update apportionment
  const updateApportionment = (id, field, value) => {
    setApportionments(apportionments.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  // Toggle apportionment expansion
  const toggleApportionment = (id) => {
    setApportionments(apportionments.map(a =>
      a.id === id ? { ...a, expanded: !a.expanded } : a
    ));
  };

  // Calculate days between two dates
  const daysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate apportionment details - returns values progressively as they become available
  const calculateApportionment = (apportionment) => {
    const { periodStart, periodEnd, totalCharge, balanceOwed } = apportionment;

    let result = {
      daysInPeriod: null,
      dailyRate: null,
      daysToApportion: null,
      amountToApportion: null,
      paidTo: null,
      action: null
    };

    // Calculate days in period (needs both period dates)
    if (periodStart && periodEnd) {
      const daysInPeriod = daysBetween(periodStart, periodEnd);
      if (daysInPeriod && daysInPeriod > 0) {
        result.daysInPeriod = daysInPeriod;

        // Calculate daily rate (needs days in period + total charge)
        if (totalCharge && parseFloat(totalCharge) > 0) {
          result.dailyRate = parseFloat(totalCharge) / daysInPeriod;
        }
      }
    }

    // Calculate days to apportion (needs completion date + period end)
    if (completionDate && periodEnd) {
      result.daysToApportion = daysBetween(completionDate, periodEnd);
    }

    // Calculate amount to apportion (needs daily rate + days to apportion + balance owed)
    if (result.dailyRate !== null && result.daysToApportion !== null && balanceOwed !== '' && balanceOwed !== null) {
      const buyerShare = result.dailyRate * result.daysToApportion;
      const balance = parseFloat(balanceOwed);

      if (!isNaN(balance)) {
        if (balance > buyerShare) {
          result.amountToApportion = balance - buyerShare;
          result.paidTo = 'Buyer';
          result.action = 'deduct';
        } else {
          result.amountToApportion = buyerShare - balance;
          result.paidTo = 'Seller';
          result.action = 'add';
        }
      }
    }

    return result;
  };

  // Calculate total balance to complete
  const calculateTotal = () => {
    const price = parseFloat(purchasePrice) || 0;
    if (price === 0) return null;

    let total = price;

    // Add/subtract allowances
    allowances.forEach(allowance => {
      const amount = parseFloat(allowance.amount) || 0;
      if (allowance.inFavourOf === 'buyer') {
        total -= amount;
      } else {
        total += amount;
      }
    });

    // Add/subtract apportionments
    apportionments.forEach(apportionment => {
      const calc = calculateApportionment(apportionment);
      if (calc.amountToApportion !== null) {
        if (calc.action === 'add') {
          total += calc.amountToApportion;
        } else {
          total -= calc.amountToApportion;
        }
      }
    });

    return total;
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Generate and download the apportionment statement PDF
  const generatePDF = () => {
    downloadApportionmentOnly({
      address: propertyAddress,
      ourRef: '',
      completionDate,
      purchasePrice,
      allowances,
      apportionments,
    });
  };

  const total = calculateTotal();
  const canExport = total !== null || apportionments.some(a => calculateApportionment(a).amountToApportion !== null);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #faf8f8 0%, #f5f0f1 100%)',
      fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: `3px solid ${colors.burgundy}`,
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(114, 47, 55, 0.08)',
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Brand label="Apportionment Calculator" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onHome && (
              <button
                onClick={onHome}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', background: 'white', color: colors.burgundy,
                  border: `1px solid ${colors.blush}`, borderRadius: 8,
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} /> Change task
              </button>
            )}
            <button
              onClick={generatePDF}
              disabled={!canExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: canExport ? colors.burgundy : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: canExport ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: canExport ? '0 2px 8px rgba(114, 47, 55, 0.3)' : 'none',
              }}
              onMouseOver={e => canExport && (e.currentTarget.style.background = colors.burgundyDark)}
              onMouseOut={e => canExport && (e.currentTarget.style.background = colors.burgundy)}
            >
              <FileDown size={18} />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 28, alignItems: 'start' }}>
        <div>

        {/* Property Details Card */}
        <section style={{
          background: 'white',
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(114, 47, 55, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Building2 size={20} color={colors.burgundy} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Property Details</h2>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Property Address
              </label>
              <input
                type="text"
                value={propertyAddress}
                onChange={e => setPropertyAddress(e.target.value)}
                placeholder="Enter the full property address"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e8e4e5',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = colors.burgundy}
                onBlur={e => e.target.style.borderColor = '#e8e4e5'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Completion Date
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={e => setCompletionDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e8e4e5',
                    borderRadius: 10,
                    fontSize: 15,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = colors.burgundy}
                  onBlur={e => e.target.style.borderColor = '#e8e4e5'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Purchase Price (£)
                </label>
                <input
                  type="text"
                  value={purchasePriceDisplay}
                  onChange={handlePurchasePriceChange}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e8e4e5',
                    borderRadius: 10,
                    fontSize: 15,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = colors.burgundy}
                  onBlur={e => e.target.style.borderColor = '#e8e4e5'}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Allowances Card */}
        <section style={{
          background: 'white',
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(114, 47, 55, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PoundSterling size={20} color={colors.burgundy} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Allowances &amp; Adjustments</h2>
            </div>
            <button
              onClick={addAllowance}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#f8f5f5',
                color: colors.burgundy,
                border: `1px solid ${colors.blush}`,
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = colors.blush}
              onMouseOut={e => e.currentTarget.style.background = '#f8f5f5'}
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {allowances.map((allowance) => (
              <div key={allowance.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1.5fr auto',
                gap: 12,
                alignItems: 'end',
                padding: 16,
                background: '#faf8f8',
                borderRadius: 10,
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Description</label>
                  <input
                    type="text"
                    value={allowance.description}
                    onChange={e => updateAllowance(allowance.id, 'description', e.target.value)}
                    placeholder="e.g. Retention, Fixtures"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e0dada',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Amount (£)</label>
                  <input
                    type="text"
                    value={allowance.amountDisplay}
                    onChange={e => handleAllowanceAmountChange(allowance.id, e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e0dada',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>In Favour Of</label>
                  <select
                    value={allowance.inFavourOf}
                    onChange={e => updateAllowance(allowance.id, 'inFavourOf', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e0dada',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="buyer">Buyer (deduct from balance)</option>
                    <option value="seller">Seller (add to balance)</option>
                  </select>
                </div>
                <button
                  onClick={() => removeAllowance(allowance.id)}
                  disabled={allowances.length === 1}
                  style={{
                    padding: 10,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: allowances.length === 1 ? 'not-allowed' : 'pointer',
                    opacity: allowances.length === 1 ? 0.3 : 1,
                    color: '#999',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={e => allowances.length > 1 && (e.currentTarget.style.color = '#dc2626')}
                  onMouseOut={e => e.currentTarget.style.color = '#999'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Apportionments Card */}
        <section style={{
          background: 'white',
          borderRadius: 16,
          padding: 28,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(114, 47, 55, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarDays size={20} color={colors.burgundy} />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Charges to Apportion</h2>
            </div>
            <button
              onClick={addApportionment}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#f8f5f5',
                color: colors.burgundy,
                border: `1px solid ${colors.blush}`,
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = colors.blush}
              onMouseOut={e => e.currentTarget.style.background = '#f8f5f5'}
            >
              <Plus size={16} /> Add Charge
            </button>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {apportionments.map((apportionment) => {
              const calc = calculateApportionment(apportionment);

              return (
                <div key={apportionment.id} style={{
                  border: '1px solid #e8e4e5',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div
                    onClick={() => toggleApportionment(apportionment.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      background: '#faf8f8',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="text"
                      value={apportionment.name}
                      onChange={e => updateApportionment(apportionment.id, 'name', e.target.value)}
                      onClick={e => e.stopPropagation()}
                      placeholder="Enter charge name..."
                      style={{
                        background: 'white',
                        border: '1px solid #e0dada',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#1a1a1a',
                        outline: 'none',
                        width: 220,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = colors.burgundy;
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e0dada';
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {calc.amountToApportion !== null && (
                        <span style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: calc.action === 'add' ? '#16a34a' : '#dc2626',
                        }}>
                          {calc.action === 'add' ? '+' : '−'}{formatCurrency(calc.amountToApportion)}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeApportionment(apportionment.id); }}
                        disabled={apportionments.length === 1}
                        style={{
                          padding: 6,
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 6,
                          cursor: apportionments.length === 1 ? 'not-allowed' : 'pointer',
                          opacity: apportionments.length === 1 ? 0.3 : 1,
                          color: '#999',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                      {apportionment.expanded ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
                    </div>
                  </div>

                  {/* Content */}
                  {apportionment.expanded && (
                    <div style={{ padding: 18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Billing Period Start</label>
                          <input
                            type="date"
                            value={apportionment.periodStart}
                            onChange={e => updateApportionment(apportionment.id, 'periodStart', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e0dada',
                              borderRadius: 8,
                              fontSize: 14,
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Billing Period End</label>
                          <input
                            type="date"
                            value={apportionment.periodEnd}
                            onChange={e => updateApportionment(apportionment.id, 'periodEnd', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e0dada',
                              borderRadius: 8,
                              fontSize: 14,
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Total Charge for Period (£)</label>
                          <input
                            type="text"
                            value={apportionment.totalChargeDisplay}
                            onChange={e => handleApportionmentMoneyChange(apportionment.id, 'totalCharge', e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e0dada',
                              borderRadius: 8,
                              fontSize: 14,
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Days in Period</label>
                          <div style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            fontSize: 14,
                            color: '#555',
                            fontWeight: 500,
                          }}>
                            {calc.daysInPeriod ?? '-'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Daily Rate (£)</label>
                          <div style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            fontSize: 14,
                            color: '#555',
                            fontWeight: 500,
                          }}>
                            {calc.dailyRate !== null ? calc.dailyRate.toFixed(2) : '-'}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Balance Owed on Statement (£)</label>
                          <input
                            type="text"
                            value={apportionment.balanceOwedDisplay}
                            onChange={e => handleApportionmentMoneyChange(apportionment.id, 'balanceOwed', e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e0dada',
                              borderRadius: 8,
                              fontSize: 14,
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Days to Apportion</label>
                          <div style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            fontSize: 14,
                            color: '#555',
                            fontWeight: 500,
                          }}>
                            {calc.daysToApportion ?? '-'}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 4 }}>Amount to Apportion (£)</label>
                          <div style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            fontSize: 14,
                            color: '#555',
                            fontWeight: 600,
                          }}>
                            {calc.amountToApportion !== null ? calc.amountToApportion.toFixed(2) : '-'}
                          </div>
                        </div>
                      </div>

                      {/* Calculated values */}
                      {calc.amountToApportion !== null && (
                        <div style={{
                          background: '#f8f5f5',
                          borderRadius: 8,
                          padding: 14,
                          fontSize: 13,
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <span style={{ color: '#555' }}>
                              Apportionment payable to <strong>{calc.paidTo}</strong>. <em>{calc.action === 'add' ? 'Add to' : 'Deduct from'} purchase price.</em>
                            </span>
                            <span style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: calc.action === 'add' ? '#16a34a' : '#dc2626',
                            }}>
                              {calc.action === 'add' ? '+' : '−'}{formatCurrency(calc.amountToApportion)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Total Card */}
        <section style={{
          background: `linear-gradient(135deg, ${colors.burgundy} 0%, ${colors.burgundyDark} 100%)`,
          borderRadius: 16,
          padding: 32,
          color: 'white',
          boxShadow: '0 4px 20px rgba(114, 47, 55, 0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Calculator size={20} />
            <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
              Balance to Complete
            </span>
          </div>
          <div style={{
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: '-1px',
          }}>
            {total !== null ? formatCurrency(total) : '-'}
          </div>
          {total === null && (
            <p style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
              Enter a purchase price and completion date to calculate the balance.
            </p>
          )}
        </section>

        {/* Help text */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          fontSize: 13,
          color: '#888',
        }}>
          <p style={{ marginBottom: 8 }}>
            <strong style={{ color: '#666' }}>How apportionments work:</strong> Enter the billing period dates, total charge, and current balance.
          </p>
          <p>
            The calculator determines the buyer's share based on days remaining after completion, then works out who owes whom.
          </p>
        </div>
        </div>

        {/* Live preview */}
        <div style={{ position: 'sticky', top: 96 }}>
          <ApportionmentPreview
            address={propertyAddress}
            completionDate={completionDate}
            purchasePrice={purchasePrice}
            allowances={allowances}
            apportionments={apportionments}
          />
        </div>
      </main>
    </div>
  );
}
