import TextField from "./TextField";

interface CurrencyFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({
  value,
  onChange,
  placeholder,
  label,
  id,
  name,
  required = false,
}) => {
  const prefix = "$";

  // Formatte la partie entière avec séparateur de milliers ; ajoute les décimales seulement si l'utilisateur en a tapé
  const formatCurrency = (val: string) => {
    if (!val) return "";
    const [intPart, decPart] = val.split(".");
    const formattedInt = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(Number(intPart));
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  // Au changement : ne garder que chiffres et point, un seul point, max 2 décimales
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Retirer le préfixe s'il est présent
    let input = e.target.value.replace(prefix, "").replace(/[^0-9.]/g, "");
    const parts = input.split(".");
    if (parts.length > 1) {
      const [intP, ...rest] = parts;
      let dec = rest.join("");
      dec = dec.slice(0, 2);
      input = `${intP}.${dec}`;
    }
    onChange(input);
  };

  // Au focus : affiche la valeur brute sans préfixe
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = value;
  };

  // Au blur : applique le formatage avec séparateurs et préfixe
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(value);
    e.target.value = formatted ? `${prefix}${formatted}` : "";
  };

  return (
    <TextField
      id={id}
      type="text"
      name={name || ""}
      placeholder={placeholder}
      label={label || ''}
      value={value ? `${prefix}${formatCurrency(value)}` : ""}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      error=""
      required={required}
    />
  );
};

export default CurrencyField;
