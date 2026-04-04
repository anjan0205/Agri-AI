import React from 'react';

const SelectField = ({ label, name, options, value, onChange, icon: Icon }) => {
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
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`appearance-none w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400 cursor-pointer`}
        >
          <option value="" disabled>Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 pointer-events-none text-gray-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SelectField;
