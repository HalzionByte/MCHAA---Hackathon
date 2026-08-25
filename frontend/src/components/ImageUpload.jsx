import React, { useState } from 'react';
import { analyzeImage } from '../api/api';

export default function ImageUpload({ fieldId, onAnalyzeComplete }) {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeImage(imageUrl, fieldId);
      onAnalyzeComplete?.(result.anomaly_id);
    } catch (err) {
      setError('Failed to analyze image. Check console for details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-5">
      <h3 className="card-title">Upload Field Image</h3>
      <form onSubmit={handleAnalyze} className="space-y-3">
        <input
          type="text"
          placeholder="https://example.com/field-image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
          className="input-field"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}