'use client';

import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, max, className = '' }) => {
  const isExceeded = current > max;
  const isNearLimit = current > max * 0.8;
  const isWarning = current > max * 0.9;
  
  return (
    <div className={`char-counter text-base transition-colors duration-200 ${
      isExceeded 
        ? 'text-red-600 font-semibold animate-pulse' 
        : isWarning
          ? 'text-red-500 font-medium'
        : isNearLimit 
          ? 'text-amber-600 font-medium' 
          : 'text-gray-500'
    } ${className}`}>
      <span className={`${isExceeded ? 'font-bold bg-red-100 px-1 rounded' : ''}`}>
        {current}
      </span>
      <span className="text-gray-400 mx-0.5">/</span>
      <span>{max}</span>
      {isExceeded && (
        <span className="ml-1 text-sm text-red-600 font-medium bg-red-50 px-1 py-0.5 rounded">
          制限超過!
        </span>
      )}
      {isWarning && !isExceeded && (
        <span className="ml-1 text-sm text-amber-600">
          ⚠️
        </span>
      )}
    </div>
  );
};