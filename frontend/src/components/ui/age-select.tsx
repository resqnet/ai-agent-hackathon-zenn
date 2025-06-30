'use client';

import { forwardRef } from 'react';

interface AgeSelectProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export const AgeSelect = forwardRef<HTMLSelectElement, AgeSelectProps>(
  ({ value, onChange, className = '', disabled = false }, ref) => {
    // 0歳から3歳（36ヶ月）までの年齢オプションを生成
    const generateAgeOptions = () => {
      const options = [];
      
      // 0歳0ヶ月から3歳まで
      for (let months = 0; months <= 36; months++) {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        
        let label;
        if (months === 0) {
          label = '0歳0ヶ月（新生児）';
        } else if (years === 0) {
          label = `0歳${remainingMonths}ヶ月`;
        } else if (remainingMonths === 0) {
          label = `${years}歳`;
        } else {
          label = `${years}歳${remainingMonths}ヶ月`;
        }
        
        options.push({ value: months, label });
      }
      
      return options;
    };

    const ageOptions = generateAgeOptions();

    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground ${className}`}
      >
        {ageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

AgeSelect.displayName = 'AgeSelect';