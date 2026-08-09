import { useState, useEffect } from 'react';
import { getCurrencyConfig } from '@/utils/currencyUtils';

type MaskFunction = (value: string) => string;
type UnmaskFunction = (value: string) => string;

interface UseMaskOptions {
  mask: MaskFunction;
  unmask: UnmaskFunction;
  maxLength?: number;
  allowedKeys?: string[];
}

export const useMask = ({ mask, unmask, maxLength, allowedKeys = [] }: UseMaskOptions) => {
  const [displayValue, setDisplayValue] = useState('');

  const applyMask = (value: string): string => {
    if (typeof mask !== 'function') {
      console.error('Mask function is not defined or not a function:', mask);
      return value;
    }
    return mask(value);
  };

  const removeMask = (value: string): string => {
    if (typeof unmask !== 'function') {
      console.error('Unmask function is not defined or not a function:', unmask);
      return value;
    }
    return unmask(value);
  };

  const handleChange = (inputValue: string, onChange: (value: string) => void) => {
    const unmaskedValue = removeMask(inputValue);

    if (!maxLength || unmaskedValue.length <= maxLength) {
      const maskedValue = applyMask(inputValue);
      setDisplayValue(maskedValue);
      onChange(unmaskedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const defaultAllowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'v', 'c', 'a'
    ];

    const allAllowedKeys = [...defaultAllowedKeys, ...allowedKeys];
    const isNumber = /[0-9]/.test(e.key);
    const isControlKey = e.ctrlKey || e.metaKey;
    const isAllowedKey = allAllowedKeys.includes(e.key);

    if (!isNumber && !isAllowedKey && !isControlKey) {
      e.preventDefault();
    }
  };

  const updateDisplayValue = (value: string) => {
    if (typeof mask !== 'function') {
      console.error('Cannot update display value: mask function is not defined');
      setDisplayValue(value);
      return;
    }
    setDisplayValue(applyMask(value));
  };

  return {
    displayValue,
    handleChange,
    handleKeyDown,
    updateDisplayValue,
    applyMask,
    removeMask
  };
};

// Máscaras pré-definidas
export const masks = {
  phone: {
    mask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');

      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else if (numbers.length <= 11) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
    },
    unmask: (value: string): string => value.replace(/\D/g, ''),
    maxLength: 11
  },

  cpf: {
    mask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');

      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
      }
    },
    unmask: (value: string): string => value.replace(/\D/g, ''),
    maxLength: 11
  },

  cnpj: {
    mask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');

      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 5) {
        return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      } else if (numbers.length <= 8) {
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      } else if (numbers.length <= 12) {
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      } else {
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
      }
    },
    unmask: (value: string): string => value.replace(/\D/g, ''),
    maxLength: 14
  },

  cep: {
    mask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');

      if (numbers.length <= 5) {
        return numbers;
      } else {
        return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
      }
    },
    unmask: (value: string): string => value.replace(/\D/g, ''),
    maxLength: 8
  },

  date: {
    mask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');

      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 4) {
        return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
      } else {
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
      }
    },
    unmask: (value: string): string => value.replace(/\D/g, ''),
    maxLength: 8
  },

  currency: {
    mask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');
      const number = parseInt(numbers) || 0;
      const { locale, code } = getCurrencyConfig();

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(number / 100);
    },
    unmask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');
      return numbers;
    },
    maxLength: 15
  },

  time: {
    mask: (value: string): string => {
      const numbers = value.replace(/\D/g, '');

      let hours = numbers.slice(0, 2);
      let minutes = numbers.slice(2, 4);

      if (hours.length === 2 && parseInt(hours) > 23) {
        hours = '23';
      }
      if (minutes.length === 2 && parseInt(minutes) > 59) {
        minutes = '59';
      }

      if (numbers.length <= 2) {
        return hours;
      } else {
        return `${hours}:${minutes}`;
      }
    },
    unmask: (value: string): string => value.replace(/\D/g, ''),
    maxLength: 4
  }
};

// Hooks específicos para facilitar o uso
export const usePhoneMask = () => {
  return useMask({
    mask: masks.phone.mask,
    unmask: masks.phone.unmask,
    maxLength: masks.phone.maxLength
  });
};

export const useCpfMask = () => {
  return useMask({
    mask: masks.cpf.mask,
    unmask: masks.cpf.unmask,
    maxLength: masks.cpf.maxLength
  });
};

export const useCnpjMask = () => {
  return useMask({
    mask: masks.cnpj.mask,
    unmask: masks.cnpj.unmask,
    maxLength: masks.cnpj.maxLength
  });
};

export const useCepMask = () => {
  return useMask({
    mask: masks.cep.mask,
    unmask: masks.cep.unmask,
    maxLength: masks.cep.maxLength
  });
};

export const useDateMask = () => {
  return useMask({
    mask: masks.date.mask,
    unmask: masks.date.unmask,
    maxLength: masks.date.maxLength
  });
};

export const useCurrencyMask = () => {
  return useMask({
    mask: masks.currency.mask,
    unmask: masks.currency.unmask,
    maxLength: masks.currency.maxLength
  });
};

export const useTimeMask = () => {
  return useMask({
    mask: masks.time.mask,
    unmask: masks.time.unmask,
    maxLength: masks.time.maxLength
  });
};