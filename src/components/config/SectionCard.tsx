import React, { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-background rounded-3xl shadow-neumorphic p-6 mb-6">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-300/30 pb-3">
        {icon && <div className="text-primary">{icon}</div>}
        <h3 className="font-bold text-lg text-primary">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default SectionCard;
