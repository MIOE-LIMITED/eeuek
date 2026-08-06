'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const QuoteContext = createContext(null);

export const CONDITIONS = ['Sıfır', '2.El', 'Takas', 'Tamir'];

const makeRow = (id, patch) => ({ id, code: '', qty: 1, cond: 'Sıfır', ...patch });

const digits = (s) => (s || '').replace(/\D/g, '');
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhone = (s) => digits(s).length >= 10 && digits(s).length <= 15;
const hasLetter = (s) => /\p{L}/u.test(s || '');

function validate({ name, contact, rows }) {
  const errors = {};
  if (name.trim().length < 2 || !hasLetter(name)) errors.name = 'Ad Soyad / Firma girin.';
  const c = contact.trim();
  if (!c) errors.contact = 'E-posta veya telefon girin.';
  else if (!isEmail(c) && !isPhone(c)) errors.contact = 'Geçerli bir e-posta veya telefon girin.';
  if (!rows.some((r) => r.code.trim())) errors.rows = 'En az bir ürün / parça kodu girin.';
  return errors;
}

export function QuoteProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rows, setRows] = useState(() => [makeRow(1)]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ref, tsLocal }
  const idRef = useRef(2);
  const newId = () => idRef.current++;

  const openQuote = useCallback(() => {
    setOpen(true);
    setSubmitted(false);
  }, []);

  const closeQuote = useCallback(() => setOpen(false), []);

  const addItem = useCallback((code, cond = 'Sıfır') => {
    const trimmed = (code || '').trim();
    setOpen(true);
    setSubmitted(false);
    if (!trimmed) return;
    setRows((prev) => {
      if (prev.some((r) => r.code === trimmed)) {
        return prev.map((r) => (r.code === trimmed ? { ...r, qty: Number(r.qty) + 1 } : r));
      }
      return [...prev.filter((r) => r.code.trim()), makeRow(newId(), { code: trimmed, cond })];
    });
  }, []);

  const patchRow = useCallback((id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setErrors((e) => (e.rows ? { ...e, rows: undefined } : e));
  }, []);

  const removeRow = useCallback((id) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, makeRow(newId())]);
  }, []);

  const updateName = useCallback((v) => {
    setName(v);
    setErrors((e) => (e.name ? { ...e, name: undefined } : e));
  }, []);

  const updateContact = useCallback((v) => {
    setContact(v);
    setErrors((e) => (e.contact ? { ...e, contact: undefined } : e));
  }, []);

  const submitQuote = useCallback(async () => {
    const errs = validate({ name, contact, rows });
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          rows: rows
            .filter((r) => r.code.trim())
            .map((r) => ({ code: r.code, qty: r.qty, cond: r.cond })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setResult({ ref: data.ref, tsLocal: data.tsLocal });
        setSubmitted(true);
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ form: data.error || 'Gönderilemedi. Lütfen tekrar deneyin.' });
      }
    } catch {
      setErrors({ form: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  }, [name, contact, rows]);

  const resetQuote = useCallback(() => {
    setOpen(false);
    setSubmitted(false);
    idRef.current = 2;
    setRows([makeRow(1)]);
    setName('');
    setContact('');
    setErrors({});
    setResult(null);
  }, []);

  const rowCount = useMemo(() => rows.filter((r) => r.code.trim()).length, [rows]);

  const value = useMemo(
    () => ({
      open, submitted, rows, rowCount, name, contact, errors, loading, result,
      openQuote, closeQuote, addItem, patchRow, removeRow, addRow,
      updateName, updateContact, submitQuote, resetQuote,
    }),
    [open, submitted, rows, rowCount, name, contact, errors, loading, result,
      openQuote, closeQuote, addItem, patchRow, removeRow, addRow,
      updateName, updateContact, submitQuote, resetQuote],
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote, QuoteProvider içinde kullanılmalı');
  return ctx;
}
