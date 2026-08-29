import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { colors, inputStyle, labelStyle } from '../theme';
import { formatWithCommas } from '../lib/format';

export function Field({ label, children, style }) {
  return (
    <div style={style}>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
    </div>
  );
}

export function TextInput(props) {
  const { style, ...rest } = props;
  return <input type="text" style={{ ...inputStyle, ...style }} {...rest} />;
}

export function DateInput(props) {
  const { style, ...rest } = props;
  return <input type="date" style={{ ...inputStyle, ...style }} {...rest} />;
}

// Money input: shows thousands separators, calls onChange with the raw numeric string.
export function MoneyInput({ value, onChange, placeholder = '0.00', style, allowNegative = false }) {
  const display = value === '' || value === null || value === undefined ? '' : formatWithCommas(String(value));
  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      placeholder={placeholder}
      onChange={(e) => {
        let raw = e.target.value.replace(/[^0-9.-]/g, '');
        if (!allowNegative) raw = raw.replace(/-/g, '');
        onChange(raw);
      }}
      style={{ ...inputStyle, textAlign: 'right', ...style }}
    />
  );
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.muted, cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function IconButton({ onClick, disabled, title, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: 8, background: 'transparent', border: 'none', borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1,
        color: danger ? colors.negative : '#999', display: 'inline-flex',
      }}
    >
      {children}
    </button>
  );
}

export function DeleteButton({ onClick, disabled }) {
  return (
    <IconButton onClick={onClick} disabled={disabled} title="Remove line" danger>
      <Trash2 size={18} />
    </IconButton>
  );
}

export function AddButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
        background: '#f8f5f5', color: colors.burgundy, border: `1px solid ${colors.blush}`,
        borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: 'pointer',
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = colors.blush)}
      onMouseOut={(e) => (e.currentTarget.style.background = '#f8f5f5')}
    >
      <Plus size={16} /> {children}
    </button>
  );
}

// A dropdown of preset labels plus a "custom line" option.
export function QuickAdd({ catalog, existingLabels = [], onAdd, placeholder = 'Add a line…' }) {
  return (
    <select
      value=""
      onChange={(e) => {
        if (!e.target.value) return;
        if (e.target.value === '__custom__') onAdd({ label: '', amount: '', custom: true });
        else {
          const item = catalog.find((c) => c.label === e.target.value);
          onAdd({ label: item.label, amount: '', vatable: !!item.vatable });
        }
        e.target.value = '';
      }}
      style={{ ...inputStyle, width: 'auto', minWidth: 220, cursor: 'pointer', textAlign: 'left' }}
    >
      <option value="">{placeholder}</option>
      {catalog
        .filter((c) => !existingLabels.includes(c.label))
        .map((c) => (
          <option key={c.label} value={c.label}>{c.label}</option>
        ))}
      <option value="__custom__">Other (type your own)…</option>
    </select>
  );
}

// A <datalist> of suggestions for a free-text field. Render once per screen and
// point inputs at it with list={id}. Typing stays free; the list is a shortcut.
export function Datalist({ id, options }) {
  return (
    <datalist id={id}>
      {options.map((o) => <option key={o} value={o} />)}
    </datalist>
  );
}

// Back-compat wrapper for the allowance description field.
export const ALLOWANCE_LIST_ID = 'allowance-descriptions';
export function AllowanceDatalist({ options }) {
  return <Datalist id={ALLOWANCE_LIST_ID} options={options} />;
}

export function SectionCard({ icon: Icon, title, action, children }) {
  return (
    <section style={{
      background: 'white', borderRadius: 16, padding: 28, marginBottom: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(114, 47, 55, 0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={20} color={colors.burgundy} />}
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.ink, margin: 0 }}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
