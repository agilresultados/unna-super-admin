import React, { useEffect } from 'react';
import { useMask } from '@/hooks/useMask';

interface MaskedInputProps {
  value: string;
  onChange: (value: string) => void;
  mask: (value: string) => string;
  unmask: (value: string) => string;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  type?: string;
  allowedKeys?: string[];
}

const MaskedInput: React.FC<MaskedInputProps> = ({
  value,
  onChange,
  mask,
  unmask,
  maxLength,
  placeholder = "",
  className = "",
  required = false,
  disabled = false,
  name,
  id,
  type = "text",
  allowedKeys = []
}) => {
  const { displayValue, handleChange, handleKeyDown, updateDisplayValue } = useMask({
    mask,
    unmask,
    maxLength,
    allowedKeys
  });

  // Atualizar display value quando o value prop mudar
  useEffect(() => {
    if (typeof mask === 'function' && typeof unmask === 'function') {
      updateDisplayValue(value);
    }
  }, [value, mask, unmask, updateDisplayValue]);

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.value, onChange);
  };

  return (
    <input
      type={type}
      value={displayValue}
      onChange={onChangeHandler}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      required={required}
      disabled={disabled}
      name={name}
      id={id}
    />
  );
};

export default MaskedInput; 