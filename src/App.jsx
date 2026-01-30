import React, { useState, useRef } from 'react';
import { Plus, Trash2, FileDown, Calculator, Building2, CalendarDays, PoundSterling, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';

// Brand colors extracted from Pinnacle logo
const colors = {
  burgundy: '#722F37',
  burgundyDark: '#5a252c',
  burgundyLight: '#9e4a54',
  rose: '#b85a6a',
  blush: '#d4a5ab',
};

export default function App() {
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

  const printRef = useRef(null);

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
    if (value === null || value === undefined || isNaN(value)) return '—';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Generate and download PDF
  const generatePDF = () => {
    const total = calculateTotal();
    const doc = new jsPDF();
    
    // Colors
    const burgundy = [114, 47, 55];
    const darkGray = [51, 51, 51];
    const mediumGray = [102, 102, 102];
    const lightGray = [150, 150, 150];
    const green = [22, 163, 74];
    const red = [220, 38, 38];
    
    let y = 20;
    const leftMargin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - 40;
    
    // Helper functions
    const addText = (text, x, yPos, options = {}) => {
      const { size = 10, color = darkGray, style = 'normal', align = 'left' } = options;
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.setFont('helvetica', style);
      if (align === 'right') {
        doc.text(text, pageWidth - 20, yPos, { align: 'right' });
      } else {
        doc.text(text, x, yPos);
      }
    };
    
    const addLine = (y1, color = [229, 224, 224]) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y1, pageWidth - 20, y1);
    };
    
    // Header
    addText('Pinnacle Property Lawyers', leftMargin, y, { size: 18, color: burgundy, style: 'bold' });
    y += 6;
    addText('Professional Legal Services', leftMargin, y, { size: 9, color: mediumGray });
    
    // Document title (right aligned)
    addText('Completion Statement', 0, 20, { size: 14, style: 'bold', align: 'right' });
    addText(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 0, 26, { size: 9, color: mediumGray, align: 'right' });
    
    y += 10;
    doc.setDrawColor(...burgundy);
    doc.setLineWidth(1);
    doc.line(leftMargin, y, pageWidth - 20, y);
    
    // Property Details Box
    y += 10;
    doc.setFillColor(248, 245, 245);
    doc.roundedRect(leftMargin, y, contentWidth, 28, 2, 2, 'F');
    
    y += 8;
    addText('PROPERTY', leftMargin + 5, y, { size: 8, color: burgundy, style: 'bold' });
    y += 6;
    addText(propertyAddress || 'Address not specified', leftMargin + 5, y, { size: 11, style: 'bold' });
    y += 8;
    addText(`Completion Date: ${formatDate(completionDate)}`, leftMargin + 5, y, { size: 9, color: mediumGray });
    addText(`Purchase Price: ${formatCurrency(parseFloat(purchasePrice))}`, leftMargin + 85, y, { size: 9, color: mediumGray });
    
    // Purchase Price Section
    y += 18;
    addText('Purchase Price', leftMargin, y, { size: 11, color: burgundy, style: 'bold' });
    y += 3;
    addLine(y);
    y += 8;
    addText('Gross Purchase Price', leftMargin, y, { size: 10 });
    addText(formatCurrency(parseFloat(purchasePrice)), 0, y, { size: 10, align: 'right' });
    
    // Allowances Section
    const validAllowances = allowances.filter(a => a.amount && parseFloat(a.amount) > 0);
    if (validAllowances.length > 0) {
      y += 14;
      addText('Allowances & Adjustments', leftMargin, y, { size: 11, color: burgundy, style: 'bold' });
      y += 3;
      addLine(y);
      y += 8;
      
      // Table header
      addText('Description', leftMargin, y, { size: 9, color: mediumGray });
      addText('In Favour Of', leftMargin + 80, y, { size: 9, color: mediumGray });
      addText('Amount', 0, y, { size: 9, color: mediumGray, align: 'right' });
      y += 2;
      addLine(y, [240, 240, 240]);
      y += 6;
      
      validAllowances.forEach(a => {
        addText(a.description || 'Allowance', leftMargin, y, { size: 10 });
        addText(a.inFavourOf === 'buyer' ? 'Buyer' : 'Seller', leftMargin + 80, y, { size: 10 });
        const amountColor = a.inFavourOf === 'buyer' ? red : green;
        const prefix = a.inFavourOf === 'buyer' ? '-' : '+';
        addText(`${prefix}${formatCurrency(parseFloat(a.amount))}`, 0, y, { size: 10, color: amountColor, align: 'right' });
        y += 7;
      });
    }
    
    // Apportionments Section
    const validApportionments = apportionments.filter(a => calculateApportionment(a).amountToApportion !== null);
    if (validApportionments.length > 0) {
      y += 10;
      addText('Apportionments', leftMargin, y, { size: 11, color: burgundy, style: 'bold' });
      y += 3;
      addLine(y);
      y += 6;
      
      validApportionments.forEach(a => {
        const calc = calculateApportionment(a);
        
        // Check if we need a new page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        // Apportionment box
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(leftMargin, y, contentWidth, 42, 2, 2, 'F');
        
        y += 7;
        addText(a.name, leftMargin + 5, y, { size: 10, style: 'bold' });
        
        y += 7;
        addText('Billing Period:', leftMargin + 5, y, { size: 8, color: mediumGray });
        addText(`${formatDate(a.periodStart)} to ${formatDate(a.periodEnd)} (${calc.daysInPeriod} days)`, leftMargin + 35, y, { size: 8 });
        
        y += 5;
        addText('Total Charge:', leftMargin + 5, y, { size: 8, color: mediumGray });
        addText(formatCurrency(parseFloat(a.totalCharge)), leftMargin + 35, y, { size: 8 });
        addText('Daily Rate:', leftMargin + 85, y, { size: 8, color: mediumGray });
        addText(formatCurrency(calc.dailyRate), leftMargin + 105, y, { size: 8 });
        
        y += 5;
        addText('Balance on Statement:', leftMargin + 5, y, { size: 8, color: mediumGray });
        addText(formatCurrency(parseFloat(a.balanceOwed)), leftMargin + 45, y, { size: 8 });
        addText('Days to Apportion:', leftMargin + 85, y, { size: 8, color: mediumGray });
        addText(`${calc.daysToApportion}`, leftMargin + 115, y, { size: 8 });
        
        y += 8;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(leftMargin + 5, y, pageWidth - 25, y);
        doc.setLineDashPattern([], 0);
        
        y += 5;
        addText(`Apportionment payable to ${calc.paidTo}`, leftMargin + 5, y, { size: 9, style: 'bold' });
        const amountColor = calc.action === 'add' ? green : red;
        const prefix = calc.action === 'add' ? '+' : '-';
        addText(`${prefix}${formatCurrency(calc.amountToApportion)}`, 0, y, { size: 10, color: amountColor, style: 'bold', align: 'right' });

        y += 12;
      });
    }
    
    // Check if we need a new page for the total
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    // Total Section
    y += 8;
    doc.setFillColor(...burgundy);
    doc.roundedRect(leftMargin, y, contentWidth, 24, 2, 2, 'F');
    
    y += 9;
    addText('BALANCE TO COMPLETE', leftMargin + 8, y, { size: 9, color: [255, 255, 255], style: 'bold' });
    y += 9;
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(total), leftMargin + 8, y);
    
    // Footer
    y += 20;
    addLine(y, [229, 224, 224]);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text('This completion statement was generated by Pinnacle Property Lawyers.', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('Please verify all figures before completion. E&OE.', pageWidth / 2, y, { align: 'center' });
    
    // Save the PDF
    const filename = `Completion_Statement_${propertyAddress.replace(/[^a-zA-Z0-9]/g, '_') || 'Property'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const total = calculateTotal();

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${colors.burgundy} 0%, ${colors.rose} 100%)`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 20,
            }}>P</div>
            <div>
              <div style={{ fontWeight: 600, color: colors.burgundy, fontSize: 16 }}>Pinnacle Property Lawyers</div>
              <div style={{ fontSize: 12, color: '#888' }}>Completion Statement Calculator</div>
            </div>
          </div>
          <button
            onClick={generatePDF}
            disabled={!total}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: total ? colors.burgundy : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: total ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: total ? '0 2px 8px rgba(114, 47, 55, 0.3)' : 'none',
            }}
            onMouseOver={e => total && (e.currentTarget.style.background = colors.burgundyDark)}
            onMouseOut={e => total && (e.currentTarget.style.background = colors.burgundy)}
          >
            <FileDown size={18} />
            Export Statement
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        
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
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Allowances & Adjustments</h2>
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
            {allowances.map((allowance, index) => (
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
                            {calc.daysInPeriod ?? '—'}
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
                            {calc.dailyRate !== null ? calc.dailyRate.toFixed(2) : '—'}
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
                            {calc.daysToApportion ?? '—'}
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
                            {calc.amountToApportion !== null ? calc.amountToApportion.toFixed(2) : '—'}
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
                              Apportionment payable to <strong>{calc.paidTo}</strong> — <em>{calc.action === 'add' ? 'add to' : 'deduct from'} purchase price</em>
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
            {total !== null ? formatCurrency(total) : '—'}
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
      </main>
    </div>
  );
}
