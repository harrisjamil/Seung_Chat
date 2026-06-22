'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  className?: string;
};

function toDigits(value: string, length: number) {
  return Array.from({ length }, (_, index) => value[index] ?? '');
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  id,
  className,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  function updateDigit(index: number, digit: string) {
    const digits = toDigits(value, length);
    digits[index] = digit;
    onChange(digits.join('').replace(/\s/g, ''));
  }

  function handleChange(index: number, nextValue: string) {
    const cleaned = nextValue.replace(/\D/g, '');

    if (cleaned.length > 1) {
      onChange(cleaned.slice(0, length));
      const focusIndex = Math.min(cleaned.length, length) - 1;
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    updateDigit(index, cleaned);
    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    const digits = toDigits(value, length);

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index]) {
        updateDigit(index, '');
      } else if (index > 0) {
        updateDigit(index - 1, '');
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
      return;
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div
      className={cn('flex items-center justify-start gap-1.5 sm:gap-2', className)}
      role="group"
      aria-label="Verification code"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={value[index] ?? ''}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            'size-10 shrink-0 rounded-md border border-border/70 bg-muted/30 p-0 text-center text-lg font-semibold tabular-nums sm:size-11',
            'transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
