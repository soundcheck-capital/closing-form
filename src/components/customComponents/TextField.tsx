import { useValidation } from '../../contexts/ValidationContext';

const TextField = ({ label, name, value, onChange, error, onBlur, onFocus, type, id, placeholder, required }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, error: string, onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void, onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void, type: string, id?: string, placeholder?: string, required?: boolean }) => {
  const inputId = id || name.replace(/\s+/g, '_').toLowerCase();
  const { hasError, getFieldError } = useValidation();
  const hasFieldError = hasError(name);
  const fieldError = getFieldError(name);
  
  return (  
    <div className="w-full mb-4" onFocus={onFocus}>
      <label className="text-xs text-gray-500 px-2 top-2 start-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <input 
        autoComplete="on" 
        type={type} 
        id={inputId} 
        value={value} 
        name={name} 
        className={`w-full p-2 text-sm text-gray-900 rounded-xl border focus:outline-none  focus:ring-amber-500 ${
          hasFieldError 
            ? 'border-gray-300 focus:border-red-500' 
            : 'border-gray-300 focus:border-amber-500'
        }`} 
        placeholder={placeholder || ''} 
        required 
        onChange={onChange} 
        onBlur={onBlur} 
        onFocus={onFocus} 
        title='Please enter your information here' 
      />
      {fieldError && (
        <p className="mt-1 text-sm text-red-600 px-2">{fieldError}</p>
      )}
    </div>
  );
};

export default TextField;


