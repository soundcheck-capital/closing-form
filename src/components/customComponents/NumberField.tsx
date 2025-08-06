import React, { useState } from "react";
import TextField from "./TextField";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  name?: string;
  showPercent?: boolean; // Si true, affiche '%' comme suffixe après blur
  required?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  id,
  showPercent = false,
  name,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const suffix = showPercent ? "%" : "";

  // Formatte la partie entière avec séparateur de milliers
  const formatValue = (val: string) => {
    if (!val) return "";
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Change: retire suffix et virgules, renvoie les chiffres
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    if (suffix && input.endsWith(suffix)) {
      input = input.slice(0, -suffix.length);
    }
    input = input.replace(/,/g, "");
    onChange(input);
  };

  // Focus: passe en mode édition, affiche la valeur brute
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.value = value;
  };

  // Blur: quitte édition, applique format et suffixe
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const formatted = formatValue(value);
    e.target.value = formatted ? `${formatted}${suffix}` : "";
  };

  // Valeur affichée selon le focus
  const displayValue = isFocused
    ? value
    : value
    ? `${formatValue(value)}${suffix}`
    : "";

  return (
    <TextField
      id={id}
      type="text"
      name={name || ""}
      placeholder={placeholder}
      label={label || ''} 
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      error=""
      required={required}
    />
  );
};

export default NumberInput;
