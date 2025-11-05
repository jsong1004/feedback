import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  options: RadioOption[];
}

export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  ({ className, label, error, options, name, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={option.value} className="flex items-center">
              <input
                type="radio"
                id={`${name}-${option.value}`}
                name={name}
                value={option.value}
                className={cn(
                  "h-4 w-4 border-gray-300 text-blue-600",
                  "focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  error && "border-red-500",
                  className
                )}
                ref={index === 0 ? ref : undefined}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? `${name}-error` : undefined}
                {...props}
              />
              <label
                htmlFor={`${name}-${option.value}`}
                className="ml-2 block text-sm text-gray-900"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {error && (
          <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
