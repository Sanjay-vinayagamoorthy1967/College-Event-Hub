import React from 'react';

export default function Badge({ category = 'Tech', size = 'md' }) {
  const badgeClasses = {
    tech: 'badge-tech',
    cultural: 'badge-cultural',
    sports: 'badge-sports',
    workshop: 'badge-workshop',
    hackathon: 'badge-hackathon',
    seminar: 'badge-seminar',
    free: 'badge-free',
    paid: 'badge-paid'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs'
  };

  const catKey = category.toLowerCase().replace('-', '');
  const mappedClass = badgeClasses[catKey] || 'badge-tech';

  return (
    <span className={`badge ${sizeClasses[size]} ${mappedClass}`}>
      {category}
    </span>
  );
}
