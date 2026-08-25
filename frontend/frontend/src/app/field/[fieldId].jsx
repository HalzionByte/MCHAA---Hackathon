import React from 'react';
import { useParams } from 'next/navigation';
import FieldMap from '../../components/FieldMap';
import ImageUpload from '../../components/ImageUpload';

export default function FieldPage() {
  const { fieldId } = useParams();
  return (
    <div className="min-h-screen">
      <FieldMap fieldId={fieldId} />
      <ImageUpload fieldId={fieldId} onAnalyzeComplete={() => {}} />
    </div>
  );
}