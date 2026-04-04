import React from 'react';

const InputField = ({ label, name, value, onChange, placeholder, icon: Icon, type = "number", unit = "" }) => {
  return (
    <div className="flex flex-col gap-1.5 group">
      <label className="text-sm font-medium text-gray-700 transition-colors group-focus-within:text-agri-green-600">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-gray-400 group-focus-within:text-agri-green-500 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400`}
        />
        {unit && (
          <span className="absolute right-3 text-xs font-semibold text-gray-400 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputField;
