import React from 'react';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  TrendingUp,
  AlertTriangle,
  Lock,
  PlusCircle,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  currentSubTab?: string;
  onNavigate: (tab: string, subTab?: string) => void;
  onOpenLoginModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  currentSubTab,
  onNavigate,
  onOpenLoginModal,
}) => {
  const { lowStockProducts, outOfStockProducts, currentUser } = useData();
  const totalAlerts = lowStockProducts.length + outOfStockProducts.length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: totalAlerts > 0 ? `${totalAlerts} alertas` : undefined,
      subItems: [
        { id: 'resumen', label: 'Resumen General' },
        { id: 'alertas', label: 'Centro de Alertas' },
      ],
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: Package,
      subItems: [
        { id: 'inventario', label: 'Inventario / Catálogo' },
        { id: 'registrar', label: 'Registrar Producto' },
      ],
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: ShoppingCart,
      subItems: [
        { id: 'nueva', label: 'Nueva Venta (POS)' },
        { id: 'historial', label: 'Historial de Ventas' },
      ],
    },
    {
      id: 'gastos',
      label: 'Gastos',
      icon: Receipt,
      subItems: [
        { id: 'historial', label: 'Historial de Gastos' },
        { id: 'registrar', label: 'Registrar Gasto' },
      ],
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'proveedores',
      label: 'Proveedores',
      icon: Truck,
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: TrendingUp,
      subItems: [
        { id: 'ventas', label: 'Reporte de Ventas' },
        { id: 'gastos', label: 'Reporte de Gastos' },
        { id: 'ganancias', label: 'Ganancias / Utilidad' },
        { id: 'inventario', label: 'Valorización Inventario' },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4">
      <div className="space-y-6 px-3">
        {/* Auth status block */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              {currentUser ? 'Sesión Iniciada' : 'No Identificado'}
            </span>
            <button
              onClick={onOpenLoginModal}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              {currentUser ? 'Cambiar' : 'Acceder'}
            </button>
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1 truncate">
            {currentUser ? currentUser.name : 'Invitado'}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {currentUser ? currentUser.email : 'Acceso en modo visualización'}
          </p>
        </div>

        {/* Main Navigation Menu */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Módulos del Sistema
          </p>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => onNavigate(item.id, item.subItems?.[0]?.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Subitems */}
                {isActive && item.subItems && (
                  <div className="pl-8 pr-2 py-1 space-y-1 border-l-2 border-slate-200 ml-4 my-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = currentSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => onNavigate(item.id, sub.id)}
                          className={`w-full text-left text-xs py-1 px-2 rounded-md transition-colors cursor-pointer ${
                            isSubActive
                              ? 'font-bold text-emerald-700 bg-emerald-50'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary widget */}
      <div className="px-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Moneda de Operación:</span>
          <span className="font-bold text-slate-800">Quetzal (Q)</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Impuesto Fiscal SAT:</span>
          <span className="font-semibold text-slate-800">IVA 12%</span>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 text-center">
          EMPRENDEGT · Guatemala 2026
        </div>
      </div>
    </aside>
  );
};
