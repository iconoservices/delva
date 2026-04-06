'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/data/products';
import { useApp } from '@/lib/context/AppContext';
import { type Sale, type Expense, type FixedExpense } from '@/lib/types';

interface FinancialDashboardProps {
    storeProducts: Product[];
    effectiveStoreId: string;
    isMaster?: boolean;
    isSocio?: boolean;
}

// ── Constants ───────────────────────────────────────────────────────────────
const PAYMENT_LABELS: Record<string, string> = { efectivo: '💵 Efectivo', yape: '🟣 Yape/Plin', pos: '💳 POS', transferencia: '🏦 Transf.', credito: '📅 Crédito' };
const EXPENSE_CATS = ['📦 Insumos', '🚗 Movilidad', '📱 Marketing', '🏭 Proveedor', '⚡ Servicios', '📋 Otros'];
const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

// ── Date helpers ─────────────────────────────────────────────────────────────
const getDate = (val: any): Date | null => { if (!val) return null; if (val instanceof Date) return val; if (typeof val.toDate === 'function') return val.toDate(); return null; };
const isToday = (d: Date) => { const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); };
const isThisWeek = (d: Date) => { const n = new Date(); const s = new Date(n); s.setDate(n.getDate() - n.getDay()); s.setHours(0, 0, 0, 0); return d >= s; };
const isThisMonth = (d: Date) => { const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth(); };
type Period = 'today' | 'week' | 'month' | 'all';
const PL: Record<Period, string> = { today: 'Hoy', week: 'Semana', month: 'Mes', all: 'Todo' };

// ═══════════════════════════════════════════════════════════════════════════
export default function FinancialDashboard({ storeProducts, effectiveStoreId, isMaster, isSocio }: FinancialDashboardProps) {
    const { sales, expenses, fixedExpenses, loadingFinancials: loadingSales } = useApp();
    const canSeeFinancials = isMaster || isSocio;
    const [period, setPeriod] = useState<Period>('today');
    const [hideSensitive, setHideSensitive] = useState(false);

    // Expense form state
    const [expLabel, setExpLabel] = useState('');
    const [expAmount, setExpAmount] = useState('');
    const [expCat, setExpCat] = useState(EXPENSE_CATS[0]);
    const [savingExp, setSavingExp] = useState(false);

    // Fixed expense form state
    const [showFixedForm, setShowFixedForm] = useState(false);
    const [fixLabel, setFixLabel] = useState('');
    const [fixAmount, setFixAmount] = useState('');
    const [fixPeriod, setFixPeriod] = useState<'daily' | 'monthly'>('monthly');
    const [savingFix, setSavingFix] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    // No local listeners needed - Handled by AppContext

    // ── FILTERED DATA ─────────────────────────────────────────────────────
    const filteredSales = useMemo(() => sales.filter(s => { const d = getDate(s.createdAt); if (!d) return period === 'all'; if (period === 'today') return isToday(d); if (period === 'week') return isThisWeek(d); if (period === 'month') return isThisMonth(d); return true; }), [sales, period]);
    const filteredExpenses = useMemo(() => expenses.filter(e => { const d = getDate(e.createdAt); if (!d) return period === 'all'; if (period === 'today') return isToday(d); if (period === 'week') return isThisWeek(d); if (period === 'month') return isThisMonth(d); return true; }), [expenses, period]);

    // ── Fixed expenses contribution for the selected period ───────────────
    const fixedExpensesTotal = useMemo(() => {
        return fixedExpenses.reduce((acc, fe) => {
            if (fe.period === 'daily') {
                const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 30;
                return acc + Number(fe.amount) * days;
            }
            if (fe.period === 'monthly') {
                const months = period === 'today' ? 1 / 30 : period === 'week' ? 7 / 30 : period === 'month' ? 1 : 1;
                return acc + Number(fe.amount) * months;
            }
            return acc;
        }, 0);
    }, [fixedExpenses, period]);

    // ── KPI Calculations ──────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const totalRevenue = filteredSales.reduce((a, s) => a + Number(s.total || 0), 0);
        const salesCount = filteredSales.length;
        const aov = salesCount > 0 ? totalRevenue / salesCount : 0;
        let grossProfit = 0; let hasCostData = false;
        filteredSales.forEach(s => (s.items || []).forEach(i => { if (i.costPrice != null) { hasCostData = true; grossProfit += (Number(i.price) - Number(i.costPrice)) * i.qty; } }));
        const variableExpenses = filteredExpenses.reduce((a, e) => a + Number(e.amount || 0), 0);
        const totalExpenses = variableExpenses + fixedExpensesTotal;
        const netProfit = grossProfit - totalExpenses;
        const grossPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const published = storeProducts.filter(p => (p as any).published !== false);
        const outOfStock = published.filter(p => Number((p as any).stock ?? 0) <= 0).length;
        let invInvest = 0; let invProfit = 0; let withCost = 0;
        storeProducts.forEach(p => { const s = Number((p as any).stock ?? 0); if (p.costPrice != null && s > 0) { withCost++; invInvest += Number(p.costPrice) * s; invProfit += (Number(p.price || 0) - Number(p.costPrice)) * s; } });
        const noSku = storeProducts.filter(p => !p.sku).length;
        const noCost = storeProducts.filter(p => p.costPrice == null).length;
        const noImg = storeProducts.filter(p => !p.image).length;
        const noStock = storeProducts.filter(p => (p as any).stock == null || (p as any).stock === 0).length;
        const lowMargin = storeProducts.filter(p => p.costPrice != null && Number(p.price) > 0 && ((Number(p.price) - Number(p.costPrice!)) / Number(p.price)) * 100 < 20).length;
        return { totalRevenue, salesCount, aov, grossProfit, netProfit, totalExpenses, variableExpenses, fixedExpensesTotal, hasCostData, grossPct, netPct, outOfStock, published: published.length, invInvest, invProfit, withCost, noSku, noCost, noImg, noStock, lowMargin };
    }, [filteredSales, filteredExpenses, fixedExpensesTotal, storeProducts]);

    const topByMargin = useMemo(() => storeProducts.filter(p => p.costPrice != null && Number(p.price) > 0).map(p => ({ ...p, margin: Number(p.price) - Number(p.costPrice!), marginPct: ((Number(p.price) - Number(p.costPrice!)) / Number(p.price)) * 100 })).sort((a, b) => b.marginPct - a.marginPct).slice(0, 5), [storeProducts]);

    const S = (v: string) => hideSensitive ? '••••' : v;

    // ── Save expense ──────────────────────────────────────────────────────
    const saveExpense = async () => {
        if (!expLabel.trim() || !expAmount) return;
        setSavingExp(true);
        try { await addDoc(collection(db, 'expenses'), { label: expLabel.trim(), amount: Number(expAmount), category: expCat, storeId: effectiveStoreId, createdAt: new Date() }); setExpLabel(''); setExpAmount(''); } finally { setSavingExp(false); }
    };

    const saveFixed = async () => {
        if (!fixLabel.trim() || !fixAmount) return;
        setSavingFix(true);
        try { await addDoc(collection(db, 'fixedExpenses'), { label: fixLabel.trim(), amount: Number(fixAmount), period: fixPeriod, storeId: effectiveStoreId }); setFixLabel(''); setFixAmount(''); setShowFixedForm(false); } finally { setSavingFix(false); }
    };

    // ── KPI Card ──────────────────────────────────────────────────────────
    const KCard = ({ emoji, label, main, sub, color, bg }: { emoji: string; label: string; main: string; sub?: string; color: string; bg: string }) => (
        <div style={{ background: bg, borderRadius: '18px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 900, color, background: `${color}18`, padding: '2px 6px', borderRadius: '6px', letterSpacing: '0.5px' }}>{label}</span>
            </div>
            <p style={{ fontSize: '1.35rem', fontWeight: 900, color, margin: 0, lineHeight: 1.1 }}>{main}</p>
            {sub && <p style={{ fontSize: '0.64rem', color: '#888', margin: 0, fontWeight: 600 }}>{sub}</p>}
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════
    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: 'var(--primary)' }}>Dashboard Financiero 📊</h2>
                    <p style={{ fontSize: '0.68rem', color: '#888', margin: '2px 0 0' }}>
                        Tiempo real · {isMounted ? new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2px', background: '#f5f5f5', padding: '3px', borderRadius: '11px' }}>
                        {(['today', 'week', 'month', 'all'] as Period[]).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '5px 10px', borderRadius: '9px', border: 'none', background: period === p ? 'white' : 'transparent', color: period === p ? 'var(--primary)' : '#aaa', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer', transition: 'all 0.15s' }}>{PL[p]}</button>
                        ))}
                    </div>
                    {canSeeFinancials && (
                        <button onClick={() => setHideSensitive(h => !h)} style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1.5px solid #eee', background: hideSensitive ? '#fff3f3' : 'white', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {hideSensitive ? '🙈' : '👁️'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── MAIN 2-COLUMN LAYOUT ────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px', alignItems: 'start' }}>

                {/* ════════ LEFT COLUMN ════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* KPI CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                        <KCard emoji="💰" label="VENTAS" main={S(fmt(kpis.totalRevenue))} sub={`${kpis.salesCount} venta${kpis.salesCount !== 1 ? 's' : ''} · ${PL[period]}`} color="#007AFF" bg="#F0F7FF" />
                        {canSeeFinancials && <KCard emoji="📈" label="UTILIDAD NETA" main={S(fmt(kpis.netProfit))} sub={kpis.hasCostData ? `Margen: ${S(kpis.netPct.toFixed(1) + '%')} · Bruto: ${S(kpis.grossPct.toFixed(1) + '%')}` : 'Agrega costos a productos'} color={kpis.netProfit >= 0 ? '#52c41a' : '#ff4d4f'} bg={kpis.netProfit >= 0 ? '#F6FFED' : '#FFF1F0'} />}
                        <KCard emoji="🏷️" label="TICKET PROM." main={S(fmt(kpis.aov))} sub={kpis.salesCount > 0 ? 'Por venta en promedio' : 'Sin ventas aún'} color="#722ed1" bg="#F9F0FF" />
                        {canSeeFinancials && <KCard emoji="📦" label="INVERSIÓN" main={S(fmt(kpis.invInvest))} sub={`Ganancia proyectada: ${S(fmt(kpis.invProfit))}`} color="#fa8c16" bg="#FFF7E6" />}
                        <KCard emoji="🛍️" label="CATÁLOGO" main={`${kpis.published}`} sub={`${kpis.outOfStock} agotado${kpis.outOfStock !== 1 ? 's' : ''}`} color={kpis.outOfStock > 0 ? '#ff4d4f' : '#52c41a'} bg={kpis.outOfStock > 0 ? '#FFF1F0' : '#F6FFED'} />
                    </div>

                    {/* DATA HEALTH + TOP 5 */}
                    {canSeeFinancials && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {/* DATA HEALTH */}
                            <div style={{ background: 'white', borderRadius: '18px', padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                                <p style={{ fontSize: '0.58rem', fontWeight: 900, color: '#aaa', margin: '0 0 10px', letterSpacing: '0.5px' }}>🩺 SALUD DE DATOS</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {[
                                        { label: 'Sin SKU', count: kpis.noSku, icon: '🏷️', c: '#fa8c16' },
                                        { label: 'Sin costo registrado', count: kpis.noCost, icon: '💲', c: '#ff4d4f' },
                                        { label: 'Sin imagen', count: kpis.noImg, icon: '🖼️', c: '#fa8c16' },
                                        { label: 'Sin stock definido', count: kpis.noStock, icon: '📦', c: '#ff4d4f' },
                                        { label: 'Margen bajo (<20%)', count: kpis.lowMargin, icon: '⚠️', c: '#faad14' },
                                    ].map(({ label, count, icon, c }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: count > 0 ? `${c}10` : '#f6ffed', borderRadius: '8px', border: `1px solid ${count > 0 ? c + '30' : '#b7eb8f'}` }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#555' }}>{icon} {label}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: count > 0 ? c : '#52c41a' }}>{count > 0 ? count : '✓'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* TOP 5 */}
                            <div style={{ background: 'white', borderRadius: '18px', padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                                <p style={{ fontSize: '0.58rem', fontWeight: 900, color: '#aaa', margin: '0 0 10px', letterSpacing: '0.5px' }}>🏆 TOP 5 POR MARGEN %</p>
                                {topByMargin.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '16px', color: '#ccc' }}>
                                        <p style={{ margin: 0, fontSize: '1.2rem' }}>📋</p>
                                        <p style={{ fontSize: '0.72rem', marginTop: '6px' }}>Agrega costos para ver el ranking</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {topByMargin.map((p, i) => (
                                            <div key={p.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '5px 8px', background: i === 0 ? '#fffbe6' : '#fafafa', borderRadius: '8px', border: i === 0 ? '1px solid #ffe58f' : 'none' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: i === 0 ? '#fa8c16' : '#ccc', minWidth: '16px' }}>#{i + 1}</span>
                                                <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                                                <span style={{ fontSize: '0.65rem', color: p.marginPct < 20 ? '#ff4d4f' : '#52c41a', fontWeight: 900 }}>{hideSensitive ? '••%' : `${p.marginPct.toFixed(0)}%`}</span>
                                                {!hideSensitive && <span style={{ fontSize: '0.6rem', color: '#bbb' }}>+{fmt(p.margin)}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* POTENCIAL INVENTARIO */}
                                <div style={{ marginTop: '10px', borderTop: '1px solid #f5f5f5', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <p style={{ fontSize: '0.56rem', fontWeight: 900, color: '#aaa', margin: '0 0 6px', letterSpacing: '0.5px' }}>POTENCIAL SI VENDES TODO</p>
                                    {[
                                        { label: 'Costo invertido', val: kpis.invInvest, color: '#fa8c16' },
                                        { label: 'Ganancia potencial', val: kpis.invProfit, color: '#52c41a' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f9f9f9', borderRadius: '7px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#666' }}>{label}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color }}>{S(fmt(val))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HISTORIAL DE VENTAS */}
                    <div style={{ background: 'white', borderRadius: '18px', padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                        <p style={{ fontSize: '0.58rem', fontWeight: 900, color: '#aaa', margin: '0 0 10px', letterSpacing: '0.5px' }}>📋 HISTORIAL DE VENTAS ({PL[period].toUpperCase()})</p>
                        {loadingSales ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#ccc' }}>⏳ Cargando...</div>
                        ) : filteredSales.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px', color: '#ccc' }}>
                                <p style={{ fontSize: '1.6rem', margin: 0 }}>📭</p>
                                <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>No hay ventas en este período</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto auto', gap: '8px', padding: '0 8px 4px' }}>
                                    {['HORA', 'PRODUCTO(S)', 'PAGO', 'TOTAL', canSeeFinancials ? 'UTILIDAD' : ''].map((h, i) => (
                                        <span key={i} style={{ fontSize: '0.5rem', fontWeight: 900, color: '#bbb', letterSpacing: '0.5px' }}>{h}</span>
                                    ))}
                                </div>
                                {filteredSales.slice(0, 30).map(sale => {
                                    const d = getDate(sale.createdAt);
                                    const profit = (sale.items || []).reduce((a, i) => i.costPrice != null ? a + (Number(i.price) - Number(i.costPrice)) * i.qty : a, 0);
                                    const hasCost = (sale.items || []).some(i => i.costPrice != null);
                                    return (
                                        <div key={sale.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto auto', gap: '8px', alignItems: 'center', padding: '8px', background: '#fafafa', borderRadius: '10px', transition: 'background 0.1s', cursor: 'default' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0f7ff'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}>
                                            <span style={{ fontSize: '0.66rem', color: '#aaa', fontWeight: 600 }}>{d ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(sale.items || []).map(i => i.title).join(', ')}</span>
                                            <span style={{ fontSize: '0.6rem', background: '#f0f0f0', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>{PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)', textAlign: 'right' }}>{S(fmt(Number(sale.total || 0)))}</span>
                                            {canSeeFinancials && <span style={{ fontSize: '0.7rem', fontWeight: 900, color: hasCost ? '#52c41a' : '#ccc', textAlign: 'right' }}>{hasCost ? S(`+${fmt(profit)}`) : '—'}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ════════ RIGHT SIDEBAR ════════ */}
                {canSeeFinancials && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '20px' }}>

                        {/* ➕ REGISTRAR GASTO (siempre visible) */}
                        <div style={{ background: 'white', borderRadius: '18px', padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                            <p style={{ fontSize: '0.58rem', fontWeight: 900, color: '#aaa', margin: '0 0 10px', letterSpacing: '0.5px' }}>➕ REGISTRAR GASTO</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                <input value={expLabel} onChange={e => setExpLabel(e.target.value)} placeholder="Descripción del gasto..." style={{ padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #eee', fontSize: '0.78rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} onKeyDown={e => e.key === 'Enter' && saveExpense()} />
                                <select value={expCat} onChange={e => setExpCat(e.target.value)} style={{ padding: '7px 10px', borderRadius: '10px', border: '1.5px solid #eee', fontSize: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                                    {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="S/ Monto" type="number" style={{ flex: 1, padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #eee', fontSize: '0.78rem', outline: 'none' }} onKeyDown={e => e.key === 'Enter' && saveExpense()} />
                                    <button onClick={saveExpense} disabled={savingExp || !expLabel || !expAmount} style={{ padding: '0 14px', borderRadius: '10px', border: 'none', background: !expLabel || !expAmount ? '#eee' : '#52c41a', color: !expLabel || !expAmount ? '#bbb' : 'white', fontWeight: 800, fontSize: '0.72rem', cursor: !expLabel || !expAmount ? 'default' : 'pointer' }}>
                                        {savingExp ? '...' : '✓'}
                                    </button>
                                </div>
                            </div>

                            {/* Today's variable expenses list */}
                            {filteredExpenses.length > 0 && (
                                <div style={{ marginTop: '10px', borderTop: '1px solid #f5f5f5', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {filteredExpenses.slice(0, 8).map(e => (
                                        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 6px', background: '#fafafa', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.58rem', background: '#f0f0f0', padding: '1px 5px', borderRadius: '5px', color: '#666', flexShrink: 0 }}>{e.category.split(' ')[0]}</span>
                                            <span style={{ flex: 1, fontSize: '0.68rem', fontWeight: 600, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ff4d4f', flexShrink: 0 }}>{S(`-${fmt(Number(e.amount))}`)} </span>
                                            <button onClick={() => deleteDoc(doc(db, 'expenses', e.id))} style={{ width: '18px', height: '18px', borderRadius: '5px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ddd', fontSize: '0.65rem', flexShrink: 0 }}>✕</button>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', marginTop: '2px' }}>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#aaa' }}>Total variable</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ff4d4f' }}>{S(`-${fmt(kpis.variableExpenses)}`)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 📌 GASTOS FIJOS */}
                        <div style={{ background: 'white', borderRadius: '18px', padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <p style={{ fontSize: '0.58rem', fontWeight: 900, color: '#aaa', margin: 0, letterSpacing: '0.5px' }}>📌 GASTOS FIJOS</p>
                                <button onClick={() => setShowFixedForm(f => !f)} style={{ fontSize: '0.62rem', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', border: 'none', background: showFixedForm ? '#fff1f0' : '#f0f7ff', color: showFixedForm ? '#ff4d4f' : '#007AFF', cursor: 'pointer' }}>
                                    {showFixedForm ? '✕' : '+ Agregar'}
                                </button>
                            </div>

                            {showFixedForm && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '10px' }}>
                                    <input value={fixLabel} onChange={e => setFixLabel(e.target.value)} placeholder="Ej: Alquiler local" style={{ padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #eee', fontSize: '0.75rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input value={fixAmount} onChange={e => setFixAmount(e.target.value)} placeholder="S/ Monto" type="number" style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #eee', fontSize: '0.75rem', outline: 'none' }} />
                                        <select value={fixPeriod} onChange={e => setFixPeriod(e.target.value as any)} style={{ padding: '7px 6px', borderRadius: '8px', border: '1.5px solid #eee', fontSize: '0.68rem' }}>
                                            <option value="monthly">/mes</option>
                                            <option value="daily">/día</option>
                                        </select>
                                    </div>
                                    <button onClick={saveFixed} disabled={savingFix || !fixLabel || !fixAmount} style={{ padding: '7px', borderRadius: '8px', border: 'none', background: !fixLabel || !fixAmount ? '#eee' : 'var(--primary)', color: !fixLabel || !fixAmount ? '#bbb' : 'white', fontWeight: 800, fontSize: '0.72rem', cursor: !fixLabel || !fixAmount ? 'default' : 'pointer' }}>
                                        {savingFix ? 'Guardando...' : '✓ Guardar Gasto Fijo'}
                                    </button>
                                </div>
                            )}

                            {fixedExpenses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '12px', color: '#ddd' }}>
                                    <p style={{ fontSize: '0.72rem', margin: 0 }}>Sin gastos fijos configurados</p>
                                    <p style={{ fontSize: '0.62rem', margin: '3px 0 0', color: '#e0e0e0' }}>Ej: Alquiler, sueldos, internet</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {fixedExpenses.map(fe => (
                                        <div key={fe.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: '#fff7e6', borderRadius: '8px', border: '1px solid #ffe58f' }}>
                                            <span style={{ flex: 1, fontSize: '0.7rem', fontWeight: 700, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fe.label}</span>
                                            <span style={{ fontSize: '0.62rem', color: '#aaa', flexShrink: 0 }}>{fe.period === 'monthly' ? '/mes' : '/día'}</span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fa8c16', flexShrink: 0 }}>{S(fmt(Number(fe.amount)))}</span>
                                            <button onClick={() => deleteDoc(doc(db, 'fixedExpenses', fe.id))} style={{ width: '16px', height: '16px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ddd', fontSize: '0.6rem', flexShrink: 0 }}>✕</button>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', marginTop: '2px', borderTop: '1px solid #f5f5f5', paddingTop: '6px' }}>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#aaa' }}>Impacto {PL[period].toLowerCase()}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fa8c16' }}>{S(`-${fmt(kpis.fixedExpensesTotal)}`)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 📊 RESUMEN DE GASTOS */}
                        {(kpis.totalExpenses > 0) && (
                            <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: '18px', padding: '14px 16px' }}>
                                <p style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px', letterSpacing: '0.5px' }}>💼 RESUMEN DE GASTOS</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Gastos variables</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ff7875' }}>{S(`-${fmt(kpis.variableExpenses)}`)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Gastos fijos ({PL[period].toLowerCase()})</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ffa940' }}>{S(`-${fmt(kpis.fixedExpensesTotal)}`)}</span>
                                    </div>
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.68rem', color: 'white', fontWeight: 800 }}>Total gastos</span>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#ff4d4f' }}>{S(`-${fmt(kpis.totalExpenses)}`)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.07)', padding: '6px 8px', borderRadius: '8px', marginTop: '2px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 900 }}>Utilidad Neta</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: kpis.netProfit >= 0 ? '#95de64' : '#ff7875' }}>{S(fmt(kpis.netProfit))}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
