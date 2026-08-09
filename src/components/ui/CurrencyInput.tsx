import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { maskCurrency, formatCurrency, parseCurrency, getCurrencyConfig, CurrencyType } from '@/utils/currencyUtils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label?: string;
    containerClassName?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onValueChange?: (value: number) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ label, containerClassName, className, id, onChange, onValueChange, value, ...props }, ref) => {
        const config = getCurrencyConfig();
        const currency: CurrencyType = config.symbol === '€' ? 'EUR' : 'BRL';

        // Estado interno para gerenciar o valor mascarado (string)
        const [innerValue, setInnerValue] = useState<string>(() => {
            const initial = value !== undefined ? value : props.defaultValue;
            if (typeof initial === 'number' && !isNaN(initial)) return formatCurrency(initial, currency);
            if (Array.isArray(initial)) return '';
            return (initial as string) || '';
        });

        // Sincroniza o estado interno se a prop value mudar externamente
        useEffect(() => {
            if (value !== undefined) {
                let formatted = '';
                if (typeof value === 'number') {
                    formatted = formatCurrency(value, currency);
                } else if (Array.isArray(value)) {
                    formatted = '';
                } else {
                    formatted = (value as string) || '';
                }
                setInnerValue(formatted);
            }
        }, [value, currency]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const originalValue = e.target.value;
            const masked = maskCurrency(originalValue, currency);
            
            // Atualiza o estado interno para refletir no input imediatamente
            setInnerValue(masked);

            if (onChange) {
                const event = {
                    ...e,
                    target: {
                        ...e.target,
                        value: masked,
                        name: props.name
                    }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
            }

            if (onValueChange) {
                const numericValue = parseCurrency(masked);
                onValueChange(numericValue);
            }
        };

        const displayValue = value !== undefined 
            ? (typeof value === 'number' ? formatCurrency(value, currency) : (Array.isArray(value) ? '' : value as string))
            : innerValue;

        return (
            <div className={cn("space-y-1.5", containerClassName)}>
                {label && (
                    <label htmlFor={id} className="text-[12px] ml-1 block font-bold text-gray-400 dark:text-gray-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{config.symbol}</span>
                    <input
                        {...props}
                        ref={ref}
                        id={id}
                        type="text"
                        value={displayValue}
                        onChange={handleChange}
                        onFocus={(e) => e.target.select()}
                        className={cn(
                            "w-full pl-9 pr-4 py-2 border rounded-lg text-right font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all placeholder:text-gray-400 placeholder:font-normal",
                            className
                        )}
                        placeholder={props.placeholder || (currency === 'EUR' ? "0,00" : "0,00")}
                    />
                </div>
            </div>
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;

