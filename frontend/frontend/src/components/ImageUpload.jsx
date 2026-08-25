import React, { useState } from 'react';
import { analyzeImage } from '../api/api';

export default function ImageUpload({ fieldId, onAnalyzeComplete }) {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      setError('Please enter an image URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeImage(imageUrl, fieldId);
      onAnalyzeComplete(result.anomaly_id);
    } catch (err) {
      setError('Failed to analyze image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-lg">
      <h3>Upload Field Image</h3>
      <form onSubmit={handleAnalyze}>
        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
          className="w-full p-3 rounded-md border var(--card-border) focus:outline-none focus:ring-2 focus:ring-emerald"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-6 py-3 rounded-md font-medium transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </form>
      {error && <p className="mt-4 text-error">{error}</p>}
    </div>
  );
}