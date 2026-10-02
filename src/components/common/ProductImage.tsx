import React, { useState } from 'react';
import { ProductCategory } from '../../types';
import {
  Package,
  ShoppingBag,
  Droplets,
  Sparkles,
  Home,
  Cookie,
  Egg,
  Wrench,
  FileText
} from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  category?: ProductCategory | string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  category,
  className = '',
  aspectRatio = 'square',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const getCategoryTheme = (cat?: string) => {
    switch (cat) {
      case 'Abarrotes y Alimentos':
        return {
          icon: ShoppingBag,
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200/60',
        };
      case 'Agua Pura':
      case 'Agua Pura y Bebidas':
        return {
          icon: Droplets,
          bg: 'bg-cyan-50',
          text: 'text-cyan-700',
          border: 'border-cyan-200/60',
        };
      case 'Cuidado Personal':
        return {
          icon: Sparkles,
          bg: 'bg-teal-50',
          text: 'text-teal-700',
          border: 'border-teal-200/60',
        };
      case 'Limpieza del Hogar':
        return {
          icon: Home,
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200/60',
        };
      case 'Snacks y Golosinas':
        return {
          icon: Cookie,
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200/60',
        };
      case 'Lácteos y Huevos':
        return {
          icon: Egg,
          bg: 'bg-yellow-50',
          text: 'text-yellow-800',
          border: 'border-yellow-200/60',
        };
      case 'Ferretería y Herramientas':
        return {
          icon: Wrench,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-300',
        };
      case 'Papelería y Oficina':
        return {
          icon: FileText,
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200/60',
        };
      default:
        return {
          icon: Package,
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          border: 'border-slate-200',
        };
    }
  };

  const theme = getCategoryTheme(category);
  const IconComponent = theme.icon;

  if (!src || imageFailed) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-3 text-center rounded-lg border ${theme.bg} ${theme.border} ${theme.text} ${className}`}
        role="img"
        aria-label={alt}
      >
        <IconComponent className="w-8 h-8 opacity-75 mb-1 shrink-0" />
        <span className="text-[10px] font-semibold line-clamp-1 max-w-[90%]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImageFailed(true)}
        className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
      />
    </div>
  );
};
