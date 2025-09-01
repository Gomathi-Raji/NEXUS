import React from 'react';

export function SafeMermaid({ chart }: { chart: string }) {
  return (
    <div className="mermaid-container bg-white p-4 rounded border" style={{ minHeight: '400px' }}>
      <pre className="text-xs">{chart}</pre>
    </div>
  );
}
