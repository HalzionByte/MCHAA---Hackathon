"use client";

import React, { useState } from 'react';
import { analyzeImage } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const URL_REGEX = /^https?:\/\/.+/;

export default function ImageUpload({ fieldId, onAnalyzeComplete }) {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isValidUrl = (url) => URL_REGEX.test(url.trim());

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError(t('upload.urlError'));
      return;
    }
    if (!isValidUrl(imageUrl)) {
      setError(t('upload.urlInvalid'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeImage(imageUrl, fieldId);
      onAnalyzeComplete?.(result.anomaly_id);
    } catch (err) {
      setError(t('upload.analyzeFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-5">
      <h3 className="card-title">{t('upload.title')}</h3>
      <form onSubmit={handleAnalyze} className="space-y-3">
        <input
          type="text"
          placeholder={t('upload.placeholder')}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
          className="input-field"
          aria-describedby="url-error"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t('upload.analyzing') : t('upload.analyzeImage')}
        </button>
        {error && <p id="url-error" className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}
