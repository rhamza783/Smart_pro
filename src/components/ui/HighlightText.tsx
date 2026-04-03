import React from 'react';

interface HighlightTextProps {
  text: string;
  query: string;
  highlightRanges?: [number, number][];
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, query, highlightRanges }) => {
  if (!query || !text) return <>{text}</>;

  // If ranges are provided, use them
  if (highlightRanges && highlightRanges.length > 0) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    highlightRanges.sort((a, b) => a[0] - b[0]).forEach(([start, end], idx) => {
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start));
      }
      parts.push(
        <mark key={idx} className="bg-purple-100 text-purple-700 rounded-sm px-0.5">
          {text.substring(start, end)}
        </mark>
      );
      lastIndex = end;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  }

  // Fallback to simple includes if no ranges
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-purple-100 text-purple-700 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export default HighlightText;
