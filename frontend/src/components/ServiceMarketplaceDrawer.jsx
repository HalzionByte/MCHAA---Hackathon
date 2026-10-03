"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  CheckCircle2,
  Clock,
  Phone,
  Star,
  ShieldCheck,
  TrendingDown,
  Droplets,
  Sparkles,
  Navigation
} from 'lucide-react';
import { getServiceProviders, dispatchService, calculateServiceSavings } from '../api/api';

export default function ServiceMarketplaceDrawer({ isOpen, onClose, fieldId, anomalyId, severity = 0.8 }) {
  const [district, setDistrict] = useState('Multan');
  const [serviceType, setServiceType] = useState('all');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [savingsData, setSavingsData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);
      try {
        const [provList, savings] = await Promise.all([
          getServiceProviders(district, serviceType),
          calculateServiceSavings(10, severity, 1200)
        ]);
        setProviders(provList);
        setSavingsData(savings);
        if (provList.length > 0) {
          setSelectedProvider(provList[0]);
        }
      } catch (err) {
        console.error('Failed to load marketplace data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, district, serviceType, severity]);

  const handleDispatch = async () => {
    if (!selectedProvider) return;
    setDispatching(true);
    try {
      const res = await dispatchService({
        fieldId: fieldId || 'field-001',
        providerId: selectedProvider.provider_id,
        anomalyId: anomalyId || null,
        acres: savingsData?.spot_acres || 10
      });
      setDispatchResult(res);
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setDispatching(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2500] flex justify-end"
        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-xl bg-[var(--card-surface)] border-s border-[var(--card-border)] h-full flex flex-col shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="On-Demand Service Marketplace"
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Header */}
            <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--cyan)]/15 border border-[var(--cyan)]/30 text-[var(--cyan)]">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    On-Demand Service Marketplace
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--emerald)]/20 text-[var(--emerald-deep)] font-semibold border border-[var(--emerald)]/30">
                      Live GPS
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    1-Click Certified Spray Drones & Heavy Equipment Dispatch
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1 font-medium">District / Region</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-sm rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--cyan)]"
                >
                  <option value="Multan">Multan</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="all">All Districts</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1 font-medium">Hardware Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[var(--card-surface)] border border-[var(--card-border)] text-sm rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--cyan)]"
                >
                  <option value="all">All Hardware</option>
                  <option value="drone_spray">🛸 Spray Drone (Spot Spraying)</option>
                  <option value="tractor_spray">🚜 Heavy Tractor Sprayer</option>
                  <option value="harvester">🌾 Harvester Equipment</option>
                </select>
              </div>
            </div>

            {/* Cost-Efficiency Calculator Widget */}
            {savingsData && (
              <div className="p-4 rounded-xl border border-[var(--emerald)]/30 bg-gradient-to-r from-[var(--emerald)]/10 via-transparent to-[var(--cyan)]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--emerald-deep)] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Cost Savings Calculator (Spot vs Blanket)
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--emerald)] text-black font-mono">
                    -{savingsData.savings_percent}% Costs
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-1">
                  <div className="bg-[var(--card-surface)]/60 p-2 rounded-lg border border-[var(--card-border)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Spot Spray Area</div>
                    <div className="text-sm font-bold text-[var(--cyan)]">{savingsData.spot_acres} Acres</div>
                  </div>
                  <div className="bg-[var(--card-surface)]/60 p-2 rounded-lg border border-[var(--card-border)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Money Saved</div>
                    <div className="text-sm font-bold text-[var(--emerald-deep)]">Rs. {savingsData.savings_pkr.toLocaleString()}</div>
                  </div>
                  <div className="bg-[var(--card-surface)]/60 p-2 rounded-lg border border-[var(--card-border)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Water Saved</div>
                    <div className="text-sm font-bold text-[var(--cyan)] flex items-center justify-center gap-0.5">
                      <Droplets className="w-3 h-3 text-[var(--cyan)]" />
                      {savingsData.water_saved_liters}L
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--card-border)]">
                  <span>Traditional Blanket Spray: <strong className="line-through text-red-600">Rs. {savingsData.blanket_spray_cost_pkr.toLocaleString()}</strong></span>
                  <span>AI Drone Spot Spray: <strong className="text-[var(--emerald-deep)]">Rs. {savingsData.spot_drone_cost_pkr.toLocaleString()}</strong></span>
                </div>
              </div>
            )}

            {/* Provider List */}
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[var(--cyan)]" /> Nearby Verified Operators
              </h3>

              {loading ? (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  <div className="animate-spin w-6 h-6 border-2 border-[var(--cyan)] border-t-transparent rounded-full mx-auto mb-2" />
                  Locating nearby certified equipment...
                </div>
              ) : providers.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--text-muted)] bg-[var(--card-surface)] rounded-xl border border-[var(--card-border)]">
                  No operators found for selected filter. Try changing district or hardware.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pe-1">
                  {providers.map((p) => {
                    const isSelected = selectedProvider?.provider_id === p.provider_id;
                    const isDrone = p.service_type === 'drone_spray';

                    return (
                      <div
                        key={p.provider_id}
                        onClick={() => setSelectedProvider(p)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 ring-1 ring-[var(--cyan)]'
                            : 'border-[var(--card-border)] bg-[var(--card-surface)] hover:border-[var(--cyan)]/50 hover:bg-[var(--bg-main)]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{isDrone ? '🛸' : '🚜'}</span>
                              <h4 className="font-bold text-sm text-[var(--text-primary)]">{p.name}</h4>
                              {p.rating >= 4.8 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-300 flex items-center gap-0.5">
                                  <ShieldCheck className="w-3 h-3" /> Top Verified
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[var(--cyan)]" /> ETA: ~{p.eta_hours} hr
                              </span>
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <Star className="w-3 h-3 fill-amber-500" /> {p.rating}
                              </span>
                              <span>📍 {p.district}</span>
                            </div>
                          </div>

                          <div className="text-end">
                            <div className="text-sm font-extrabold text-[var(--emerald-deep)]">
                              Rs. {p.price_per_acre_pkr.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">per acre</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Sticky Footer Action / Confirmation */}
          <div className="shrink-0 border-t border-[var(--card-border)] bg-[var(--card-surface)] px-6 py-4 space-y-3">
            {dispatchResult ? (
              <div className="p-4 rounded-xl bg-[var(--emerald)]/15 border border-[var(--emerald)]/40 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--emerald)] text-black flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-[var(--emerald-deep)]">Dispatch Confirmed!</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Ref Code: <span className="font-mono text-[var(--text-primary)] font-bold">{dispatchResult.confirmation_code}</span>
                </p>
                <p className="text-xs text-[var(--text-primary)]">
                  Operator <strong>{dispatchResult.provider_name}</strong> is en route. ETA: ~{dispatchResult.eta_hours} hours.
                </p>
                <button
                  onClick={onClose}
                  className="w-full mt-2 py-2 text-xs font-bold rounded-lg bg-[var(--emerald)] text-black hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleDispatch}
                  disabled={!selectedProvider || dispatching}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--emerald-deep)] to-emerald-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
                >
                  {dispatching ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-white" />
                      1-Click Dispatch Operator ({selectedProvider?.name || 'Select Provider'})
                    </>
                  )}
                </button>
                <div className="text-center text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[var(--emerald-deep)]" /> Guaranteed Certified Equipment & Licensed Pilot
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
