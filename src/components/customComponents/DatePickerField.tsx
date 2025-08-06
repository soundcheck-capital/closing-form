import TextField from "./TextField";

const DatePickerField = ({ label, name, value, onChange, required = false }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean }) => {
  return (
    <div className="w-full">
        <TextField type="date" name={name} value={value} onChange={onChange} label={label} error='' onBlur={() => { }} required={required} />
    </div>
  );
};

export default DatePickerField;