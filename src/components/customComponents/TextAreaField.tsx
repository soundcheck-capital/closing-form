import React from 'react';

interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error = '',
  onBlur,
  placeholder = '',
  rows = 6,
  required = false,
}) => {
  return (
    <div className="w-full mb-4">
      <h4 className=" text-md font-medium text-neutral-900 mb-2 leading-tight ">{label} {required && <span className="text-red-500">*</span>}</h4>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`block w-full p-4 text-sm text-gray-900 rounded-2xl border border-gray-300 focus:border-rose-300 peer focus:ring-1 focus:ring-rose-300 focus:outline-none resize-vertical`}
      />

      {error && (
        <div className="mt-2 ml-2">
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TextAreaField; 