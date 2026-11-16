// src/components/InputRupiah.jsx
import React, { useRef, useLayoutEffect, useState, useEffect, forwardRef } from 'react';

/**
 * Format string atau angka menjadi format ribuan dengan titik:
 * 1800000 -> "1.800.000"
 */
export const formatRibuan = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse string berformat titik menjadi angka integer murni:
 * "1.800.000" -> 1800000
 */
export const parseRibuan = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const clean = String(val).replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

/**
 * Parse string berformat titik menjadi string digit murni:
 * "1.800.000" -> "1800000"
 */
export const parseRibuanString = (val) => {
  if (val === null || val === undefined || val === '') return '';
  return String(val).replace(/\D/g, '');
};

/**
 * Komponen Input Nominal Rupiah Otomatis:
 * - Mengetik "1800000" otomatis tertampil "1.800.000"
 * - e.target.value yang dikirim ke onChange maupun onBlur adalah digit murni ("1800000")
 *   sehingga parseInt(e.target.value) di handler form tetap berjalan 100% aman!
 * - Mendukung paste teks dengan Rp, titik, atau koma.
 * - Posisi kursor terjaga akurat saat titik disisipkan/dihapus otomatis.
 * - Mendukung controlled (value) maupun uncontrolled (defaultValue).
 */
const InputRupiah = forwardRef(({
  value,
  defaultValue,
  onChange,
  onBlur,
  onValueChange, // opsional: callback khusus (numberValue, rawString, formattedString)
  placeholder = 'Contoh: 1.000.000',
  style = {},
  prefix = '',
  allowZero = true,
  disabled = false,
  required = false,
  autoFocus = false,
  ...rest
}, ref) => {
  const isControlled = value !== undefined;
  const [internalVal, setInternalVal] = useState(defaultValue !== undefined ? defaultValue : '');
  
  const innerRef = useRef(null);
  const inputRef = ref || innerRef;
  const cursorInfoRef = useRef(null);

  const activeRaw = isControlled ? value : internalVal;
  const displayValue = formatRibuan(activeRaw);

  const handleChange = (e) => {
    const rawInput = e.target.value;
    const currentCursor = e.target.selectionStart;

    // Hitung berapa banyak digit (angka) yang berada di sebelah kiri kursor sebelum re-format
    const textBeforeCursor = rawInput.slice(0, currentCursor);
    const digitsBeforeCursor = (textBeforeCursor.replace(/\D/g, '')).length;

    // Bersihkan semua karakter selain digit angka
    const cleanDigits = rawInput.replace(/\D/g, '');
    const numValue = cleanDigits ? parseInt(cleanDigits, 10) : 0;
    const newFormatted = formatRibuan(cleanDigits);

    // Hitung posisi kursor baru yang sesuai pada string berformat
    let newCursor = 0;
    if (digitsBeforeCursor <= 0) {
      newCursor = 0;
    } else {
      let count = 0;
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) {
          count++;
          if (count === digitsBeforeCursor) {
            newCursor = i + 1;
            break;
          }
        }
      }
      if (count < digitsBeforeCursor) {
        newCursor = newFormatted.length;
      }
    }

    cursorInfoRef.current = newCursor;

    if (!isControlled) {
      setInternalVal(cleanDigits);
    }

    // Kirim synthetic event ke onChange bawaan agar e.target.value berisi digit murni
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanDigits,
          formattedValue: newFormatted,
          rawNumber: numValue
        }
      };
      onChange(syntheticEvent);
    }

    if (onValueChange) {
      onValueChange(numValue, cleanDigits, newFormatted);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      const cleanDigits = String(activeRaw || '').replace(/\D/g, '');
      const numValue = cleanDigits ? parseInt(cleanDigits, 10) : 0;
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanDigits,
          formattedValue: formatRibuan(cleanDigits),
          rawNumber: numValue
        }
      };
      onBlur(syntheticEvent);
    }
  };

  useLayoutEffect(() => {
    if (cursorInfoRef.current !== null && inputRef.current) {
      const pos = cursorInfoRef.current;
      inputRef.current.setSelectionRange(pos, pos);
      cursorInfoRef.current = null;
    }
  }, [displayValue]);

  if (prefix) {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <span style={{
          position: 'absolute',
          left: 12,
          fontWeight: 'bold',
          color: '#64748b',
          fontSize: style.fontSize || 13,
          pointerEvents: 'none'
        }}>
          {prefix}
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          style={{
            ...style,
            paddingLeft: 38
          }}
          {...rest}
        />
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      style={style}
      {...rest}
    />
  );
});

InputRupiah.displayName = 'InputRupiah';

export default InputRupiah;
