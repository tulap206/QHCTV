import React from 'react';
import { LOGO_SRC } from '@/lib/constants';

export const LogoImg = ({ size = 40 }) => {
  return (
    <img
      src={LOGO_SRC}
      width={size}
      height={size}
      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      alt="Logo"
    />
  );
};
