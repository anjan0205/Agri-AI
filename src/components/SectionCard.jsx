import React from 'react';

const SectionCard = ({ title, icon: Icon, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-agri-green-50 rounded-lg">
          {Icon && <Icon className="w-5 h-5 text-agri-green-600" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
