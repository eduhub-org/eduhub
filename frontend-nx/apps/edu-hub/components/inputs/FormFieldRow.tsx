import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

type FormFieldRowProps<FieldNames> = {
  label?: string;
  name: keyof FieldNames;
  placeholder?: string;
  required?: boolean;
  className?: string;
  formColor?: string;
  options?: { label: string; value: string }[];
  type?: 'text' | 'email' | 'select' | 'textarea' | 'file';
} & InputHTMLAttributes<HTMLInputElement> &
  SelectHTMLAttributes<HTMLSelectElement>;

const FormFieldRow = <FieldNames,>({
  label,
  name,
  options,
  placeholder,
  required = false,
  className = '',
  formColor = 'text-gray-400',
  type = 'text',
  ...rest
}: FormFieldRowProps<FieldNames>) => {
  const {
    formState: { errors },
    register,
  } = useFormContext();

  const t = useTranslations();

  return (
    <div className={`light relative ${formColor || 'text-label-primary'}`}>
      <label htmlFor={name} className={`${className} text-xs uppercase tracking-widest font-medium ${formColor || 'text-label-primary'}`}>
        {label}
      </label>
      {(type === 'text' || type === 'email') && (
        <input
          id={name}
          type={type}
          placeholder={placeholder || label}
          {...register(name, { required })}
          className={`bg-fill-primary p-4 mb-5 w-full block ${formColor || 'text-label-primary'}`}
          aria-invalid={errors[name] ? 'true' : 'false'}
          {...rest}
        />
      )}
      {type === 'select' && options && (
        <select
          id={name}
          {...register(name, { required })}
          className={`bg-fill-primary p-4 mb-5 w-full block ${formColor || 'text-label-primary'}`}
          aria-invalid={errors[name] ? 'true' : 'false'}
          defaultValue=""
          {...rest}
        >
          <option value="" disabled hidden>
            {t('form-select-placeholder')}
          </option>
          {options.map((option, i) => (
            <option value={option.value} key={`formoption-${i}`}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {type === 'file' && (
        <input
          id={name}
          placeholder={placeholder || label}
          {...register(name, { required })}
          className="hidden"
          aria-invalid={errors[name] ? 'true' : 'false'}
          type="file"
          {...rest}
        />
      )}
      {errors[name] && (
        <div className="text-edu-red absolute top-full left-0" role="alert">
          This field is required
        </div>
      )}
    </div>
  );
};

export default FormFieldRow;
