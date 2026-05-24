import React, { useState } from 'react';

const LazyImg = ({ src, alt, className, style, webpSrc, loading: loadingProp = 'lazy', fallback = null, onClick }) => {
  const [error, setError] = useState(false);

  if (error && fallback) return fallback;
  if (error) return null;

  const imgProps = {
    src,
    alt: alt || '',
    className,
    style,
    loading: loadingProp,
    decoding: 'async',
    onError: () => setError(true),
    onClick,
  };

  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img {...imgProps} />
      </picture>
    );
  }

  return <img {...imgProps} />;
};

export default LazyImg;
