
import { useValidation } from '../../contexts/ValidationContext';

const DropdownField = ({ label, name, value, onChange, error, onBlur, options, required = false }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, error: string, onBlur: (e: React.FocusEvent<HTMLSelectElement>) => void, options: string[], required?: boolean }) => {
  const id = name.replace(/\s+/g, '_').toLowerCase();
  const { hasError, getFieldError } = useValidation();
  const hasFieldError = hasError(name);
  const fieldError = getFieldError(name);
  
    return (
        <div className="relative w-full mb-4">  
          <label className="text-xs text-gray-500 px-2 top-2 start-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <select 
              id={id} 
              name={name} 
              value={value} 
              onChange={onChange} 
              className={`block w-full p-2 text-sm text-gray-900 
              rounded-xl border
             focus:outline-none pr-8 ${
                hasFieldError 
                  ? 'border-gray-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-amber-500'
              }`} 
              onBlur={onBlur}
            >
                <option value="" className="text-gray-300"></option>
                {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600 px-2">{fieldError}</p>
            )}
        </div>
    );
};  

export default DropdownField;


