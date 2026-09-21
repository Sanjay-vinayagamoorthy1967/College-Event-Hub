export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval}y ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval}mo ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  
  return 'Just now';
};

export const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'tech': return 'tech';
    case 'cultural': return 'cultural';
    case 'sports': return 'sports';
    case 'workshop': return 'workshop';
    case 'hackathon': return 'hackathon';
    case 'seminar': return 'seminar';
    default: return 'tech';
  }
};

export const generateAvatar = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getDefaultEventPoster = (category, eventId, title = '') => {
  const t = title.toLowerCase();
  
  // Keyword-based specific image overrides
  if (t.includes('cricket')) return 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=60';
  if (t.includes('football') || t.includes('soccer') || t.includes('futsal')) return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=60';
  if (t.includes('basketball')) return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=60';
  if (t.includes('volleyball')) return 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=60';
  if (t.includes('badminton')) return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60';
  if (t.includes('music') || t.includes('concert') || t.includes('sing')) return 'https://images.unsplash.com/photo-1540039155732-61ee01b29792?w=800&auto=format&fit=crop&q=60';
  if (t.includes('dance')) return 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=60';
  if (t.includes('art') || t.includes('paint') || t.includes('drawing')) return 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=60';
  if (t.includes('code') || t.includes('programming') || t.includes('web') || t.includes('app')) return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60';
  if (t.includes('robot') || t.includes('robo')) return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60';
  if (t.includes('ai') || t.includes('machine learning')) return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60';

  // Convert ID to a simple deterministic number
  let hash = 0;
  if (eventId) {
    for (let i = 0; i < eventId.length; i++) {
      hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  hash = Math.abs(hash);

  const images = {
    tech: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=60'
    ],
    hackathon: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60'
    ],
    workshop: [
      'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60'
    ],
    seminar: [
      'https://images.unsplash.com/photo-1475721025505-c310742fef06?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop&q=60'
    ],
    sports: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1518605368461-1eb22119eb20?w=800&auto=format&fit=crop&q=60'
    ],
    cultural: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc0?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1533174000273-928c0535ce98?w=800&auto=format&fit=crop&q=60'
    ],
    default: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60'
    ]
  };

  const catKey = category?.toLowerCase() || 'default';
  const list = images[catKey] || images.default;
  return list[hash % list.length];
};
