"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Droplets, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCrops } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';

const cropEmojis = {
  wheat: '🌾',
  rice: '🍚',
  cotton: '🌿',
  sugarcane: '🎋',
};

const cropTranslations = {
  ur: {
    wheat: {
      name: 'گندم',
      local_name: 'گندم',
      description: 'گندم پاکستان کی سب سے اہم فصل ہے جو ریبعی موسم میں کشید کی جاتی ہے۔ یہ فصل نومبر سے اپریل تک کھیتی جاتی ہے۔',
      season: 'ربیع',
      rotation_benefits: 'گندم کے بعد دلیہ یا مونگ کی فصل بوجھے سے مٹی کی زرخیزی بڑھتی ہے۔',
      diseases: {
        'Wheat Rust': { name: 'گندم کا زنگ', symptoms: 'بھورے یا نارنجی دھبے پتوں پر نمودار ہوتے ہیں۔' },
        'Powdery Mildew': { name: 'پاؤڈری ملڈیو', symptoms: 'سفید پاؤڈر جیسا مادہ پتوں پر لگ جاتا ہے۔' },
        'Karnal Bunt': { name: 'کارنال بنت', symptoms: 'dana سیاہ اور بدبو دار ہو جاتا ہے۔' },
      },
    },
    rice: {
      name: 'چاول',
      local_name: 'چاول / دھان',
      description: 'چاول پاکستان کی دوسری بڑی غذائی فصل ہے۔ یہ خریفی موسم میں جون سے نومبر تک کشید کی جاتی ہے۔',
      season: 'خریف',
      rotation_benefits: 'چاول کے بعد گندم یا سرسوں بوجھنے سے زمین کی صحت بہتر ہوتی ہے۔',
      diseases: {
        'Rice Blast': { name: 'چاول کا بھاپ', symptoms: 'پتوں پر سفید یا بھورے دھبے نمودار ہوتے ہیں۔' },
        'Bacterial Blight': { name: 'بیکٹیریل بلائٹ', symptoms: 'پتوں کی نوکیں پیلی ہو کر سوکھ جاتی ہیں۔' },
        'Sheath Blight': { name: 'شیتھ بلائٹ', symptoms: 'تنے کے نیچے حصے پر بھورے دھبے لگتے ہیں۔' },
      },
    },
    cotton: {
      name: 'کپاس',
      local_name: 'کپاس / ریان',
      description: 'کپاس پاکستان کی اہم نقدی فصل ہے۔ یہ خریفی موسم میں مئی سے اکتوبر تک کشید کی جاتی ہے۔',
      season: 'خریف',
      rotation_benefits: 'کپاس کے بعد گندم یا چنا بوجھنے سے زمین کی منڈی کم ہوتی ہے۔',
      diseases: {
        'Cotton Leaf Curl': { name: 'کپاس کے پتوں کا مروڑ', symptoms: 'پتوں کی کناری اوپر کی طرف مڑ جاتی ہیں۔' },
        'Bollworm': { name: 'بول ورم', symptoms: 'کپاس کے فلوں میں کیڑے لگ جاتے ہیں۔' },
        'Wilt': { name: 'والٹ', symptoms: 'پودا اچانک سوکھ جاتا ہے۔' },
      },
    },
    sugarcane: {
      name: 'گنا',
      local_name: 'گنا / عقیق',
      description: 'گنا پاکستان کی اہم چینی کی فصل ہے۔ یہ سال بھر کشید کی جا سکتی ہے۔',
      season: 'ہر موسم',
      rotation_benefits: 'گنا کے بعد دلیہ یا بیرسیم بوجھنے سے مٹی کی نمی بہتر ہوتی ہے۔',
      diseases: {
        'Red Rot': { name: 'لال سڑن', symptoms: 'تنے کا اندرونی حصہ سرخ ہو کر سڑ جاتا ہے۔' },
        'Smosaic': { name: 'ایس موزیک', symptoms: 'پتوں پر پیلے دھبے نمودار ہوتے ہیں۔' },
        'Whip Smut': { name: 'وپ سمٹ', symptoms: 'ٹپ پر کالا پاؤڈر بن جاتا ہے۔' },
      },
    },
  },
};

const cropCardBorders = {
  wheat: 'border-amber-700/40',
  rice: 'border-emerald-700/40',
  cotton: 'border-green-700/40',
  sugarcane: 'border-lime-700/40',
};

function WaterGauge({ mm, maxMm = 2000 }) {
  const { t } = useLanguage();
  const pct = Math.min((mm / maxMm) * 100, 100);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
          <Droplets className="w-4 h-4 text-[var(--cyan)]" />
          {t('crop.waterNeed')}
        </span>
        <span className="text-sm font-bold text-[var(--text-primary)]">{mm} mm</span>
      </div>
      <div className="w-full h-3 rounded-full bg-[var(--card-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--emerald) 0%, var(--cyan) 50%, #3B82F6 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function MoistureRange({ min, max }) {
  const { t } = useLanguage();
  const range = 80;
  const minPct = (min / range) * 100;
  const maxPct = (max / range) * 100;
  return (
    <div className="mt-3">
      <span className="text-sm text-[var(--text-muted)] block mb-1.5">{t('crop.optimalMoisture')}</span>
      <div className="relative h-3 rounded-full bg-[var(--card-border)]">
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${minPct}%`,
            width: `${maxPct - minPct}%`,
            background: 'linear-gradient(90deg, var(--cyan), var(--emerald))',
          }}
        />
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-[var(--bg-main)]"
          style={{ left: `${minPct}%`, top: -2, background: 'var(--cyan)' }}
        />
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-[var(--bg-main)]"
          style={{ left: `calc(${maxPct}% - 12px)`, top: -2, background: 'var(--emerald)' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[var(--cyan)] font-medium">{min}%</span>
        <span className="text-xs text-[var(--emerald)] font-medium">{max}%</span>
      </div>
    </div>
  );
}

function DiseaseRisk({ diseases, cropId, lang }) {
  const { t } = useLanguage();
  if (!diseases?.length) return null;
  const translated = lang === 'ur' && cropTranslations.ur?.[cropId]?.diseases
    ? diseases.map(d => {
        const tr = cropTranslations.ur[cropId].diseases[d.name];
        return tr ? { ...d, name: tr.name, symptoms: tr.symptoms } : d;
      })
    : diseases;
  return (
    <div className="mt-4">
      <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-2">
        <AlertTriangle className="w-4 h-4 text-[var(--amber)]" />
        {t('crop.commonRisks')}
      </span>
      <div className="space-y-2">
        {translated.map((d, i) => {
          const isHighRisk = d.risk_factor?.toLowerCase().includes('high') || d.risk_factor?.toLowerCase().includes('waterlog');
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 p-2.5 rounded-lg"
              style={{ background: 'var(--bg-main)' }}
            >
              <span
                className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                style={{ background: isHighRisk ? 'var(--crimson)' : 'var(--amber)' }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{d.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{d.symptoms}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RotationTip({ crop, lang }) {
  const { t } = useLanguage();
  const rotationIds = crop.recommended_rotation_crops || [];
  if (!rotationIds.length) return null;

  const emojiMap = { wheat: '🌾', rice: '🍚', cotton: '🌿', sugarcane: '🎋', pulses: '🫘', berseem: '☘️', mustard: '🌻' };

  const translatedBenefits = lang === 'ur' && cropTranslations.ur?.[crop.crop_id]?.rotation_benefits
    ? cropTranslations.ur[crop.crop_id].rotation_benefits
    : crop.rotation_benefits;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw className="w-4 h-4 text-[var(--emerald)]" />
        <span className="text-sm text-[var(--text-muted)]">{t('crop.afterHarvest')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {rotationIds.map((rid) => (
          <span
            key={rid}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--emerald)' }}
          >
            <span>{emojiMap[rid] || '🌱'}</span>
            {rid.charAt(0).toUpperCase() + rid.slice(1)}
          </span>
        ))}
      </div>
      {translatedBenefits && (
        <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">{translatedBenefits}</p>
      )}
    </div>
  );
}

export default function CropsPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCrops()
      .then(data => setCrops(data))
      .catch(() => setCrops([]))
      .finally(() => setLoading(false));
  }, []);

  const translatedCrops = crops.map(crop => {
    if (lang !== 'ur') return crop;
    const tr = cropTranslations.ur?.[crop.crop_id];
    if (!tr) return crop;
    return {
      ...crop,
      name: tr.name || crop.name,
      local_name: tr.local_name || crop.local_name,
      description: tr.description || crop.description,
      season: tr.season || crop.season,
    };
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--card-border)] bg-[var(--card-surface)] hover:bg-[var(--card-border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{t('crop.guide')}</h1>
          <p className="text-base text-[var(--text-muted)]">{t('crop.pakEncyclopedia')}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--cyan)] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Crop Cards */}
      <div className="space-y-6">
        {translatedCrops.map((crop, index) => {
          const emoji = cropEmojis[crop.crop_id] || '🌱';
          const borderColor = cropCardBorders[crop.crop_id] || 'border-[var(--card-border)]';

          return (
            <motion.div
              key={crop.crop_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-6 border-l-4 ${borderColor}`}
            >
              {/* Crop Header */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{emoji}</span>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">{crop.name}</h2>
                  <p className="text-base text-[var(--text-muted)]">{crop.local_name}</p>
                </div>
                <span
                  className="text-sm font-bold px-4 py-1.5 rounded-full"
                  style={{
                    background: crop.season === 'Rabi' ? 'rgba(6,182,212,0.2)' : crop.season === 'Kharif' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                    color: crop.season === 'Rabi' ? 'var(--cyan)' : crop.season === 'Kharif' ? 'var(--amber)' : 'var(--emerald)',
                  }}
                >
                  {crop.season}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3">{crop.description}</p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-3 mb-3">
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--card-border)]/50 text-[var(--text-muted)]">
                  ⏱ {t('crop.days', { days: crop.growth_duration_days })}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--card-border)]/50 text-[var(--text-muted)]">
                  🧪 pH {crop.soil_ph_range}
                </span>
              </div>

              {/* Water Gauge */}
              <WaterGauge mm={crop.water_requirement_mm} />

              {/* Moisture Range */}
              <MoistureRange
                min={crop.optimal_soil_moisture_percent.min}
                max={crop.optimal_soil_moisture_percent.max}
              />

              {/* Disease Risk */}
              <DiseaseRisk diseases={crop.common_diseases} cropId={crop.crop_id} lang={lang} />

              {/* Rotation Tips */}
              <RotationTip crop={crop} lang={lang} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
