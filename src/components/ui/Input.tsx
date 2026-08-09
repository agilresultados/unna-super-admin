import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils'
import { getCurrencyConfig } from '@/utils/currencyUtils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask?: 'cpf-cnpj' | 'phone' | 'cep' | 'currency';
  onMaskedChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', mask, onMaskedChange, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(props.value || '');

    // Funções de máscara
    const applyMask = (value: string, maskType: string): string => {
      let maskedValue = value.replace(/\D/g, ''); // Remove tudo que não é dígito

      switch (maskType) {
        case 'cpf-cnpj':
          maskedValue = maskedValue.substring(0, 14);
          if (maskedValue.length <= 11) {
            // CPF: 000.000.000-00
            maskedValue = maskedValue.replace(/(\d{3})(\d)/, '$1.$2');
            maskedValue = maskedValue.replace(/(\d{3})(\d)/, '$1.$2');
            maskedValue = maskedValue.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
          } else {
            // CNPJ: 00.000.000/0000-00
            maskedValue = maskedValue.replace(/^(\d{2})(\d)/, '$1.$2');
            maskedValue = maskedValue.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            maskedValue = maskedValue.replace(/\.(\d{3})(\d)/, '.$1/$2');
            maskedValue = maskedValue.replace(/(\d{4})(\d)/, '$1-$2');
          }
          break;

        case 'phone':
          // (00) 0000-0000 ou (00) 00000-0000
          maskedValue = maskedValue.substring(0, 11);
          maskedValue = maskedValue.replace(/^(\d{2})(\d)/, '($1) $2');
          
          if (maskedValue.length <= 13) { // 10 dígitos: (00) 0000-0000
            maskedValue = maskedValue.replace(/(\d{4})(\d)/, '$1-$2');
          } else { // 11 dígitos: (00) 00000-0000
            maskedValue = maskedValue.replace(/(\d{5})(\d)/, '$1-$2');
          }
          break;

        case 'cep':
          // 00000-000
          maskedValue = maskedValue.substring(0, 8);
          maskedValue = maskedValue.replace(/^(\d{5})(\d)/, '$1-$2');
          break;

        case 'currency': {
          const { locale, code } = getCurrencyConfig();
          const numericValue = parseFloat(maskedValue) / 100;
          maskedValue = numericValue.toLocaleString(locale, {
            style: 'currency',
            currency: code
          });
          break;
        }
      }

      return maskedValue;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let finalValue = e.target.value;
      let displayValueResult = e.target.value;

      if (mask) {
        displayValueResult = applyMask(e.target.value, mask);
        setDisplayValue(displayValueResult);
        
        // Extrair o valor bruto APÓS aplicar a máscara (que já faz o substring/limite)
        finalValue = displayValueResult.replace(/\D/g, '');
      }

      // Chamar onChange original se fornecido
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name: e.target.name,
            value: finalValue
          }
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }

      // Chamar onMaskedChange se fornecido
      if (onMaskedChange) {
        onMaskedChange(finalValue);
      }
    };

    useEffect(() => {
      if (props.value !== undefined) {
        if (mask) {
          setDisplayValue(applyMask(String(props.value), mask));
        } else {
          setDisplayValue(String(props.value));
        }
      }
    }, [props.value, mask]);

    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onFocus={(e) => {
          e.target.select();
          if (props.onFocus) props.onFocus(e);
        }}
        {...props}
        value={mask ? displayValue : props.value}
        onChange={handleChange}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;

