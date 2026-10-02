import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { 
  ShoppingCart, 
  User as UserIcon, 
  LogOut, 
  RotateCcw,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, subTab?: string) => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenLoginModal }) => {
  const { currentUser, logout, quickSwitchRole, resetToDemoData, lowStockProducts, businessProfile } = useData();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showResetNotice, setShowResetNotice] = useState(false);

  const handleReset = () => {
    if (confirm('¿Restablecer datos a la configuración inicial de demostración chapina?')) {
      resetToDemoData();
      setShowResetNotice(true);
      setTimeout(() => setShowResetNotice(false), 3000);
    }
  };

  const roleLabelMap: Record<UserRole, string> = {
    admin: 'Admin',
    cajero: 'Cajero',
    contador: 'Contador',
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('dashboard');
            }}
            className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm tracking-normal shadow-xs">
              GT
            </span>
            <span>EMPRENDEGT</span>
          </a>
          <span className="hidden sm:inline-block text-xs text-slate-400 font-normal">
            / {businessProfile.name}
          </span>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('dashboard')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('productos', 'inventario')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            Inventario
          </button>
          <button
            onClick={() => onNavigate('ventas', 'nueva')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            Punto de Venta
          </button>
          <button
            onClick={() => onNavigate('gastos', 'historial')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            Gastos
          </button>
          <button
            onClick={() => onNavigate('reportes', 'ganancias')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            Ganancias
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Quick POS button */}
          <button
            onClick={() => onNavigate('ventas', 'nueva')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Venta</span>
            <span className="sm:hidden">POS</span>
          </button>

          {/* User profile / session trigger */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Perfil y roles"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline font-semibold max-w-[110px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  ({roleLabelMap[currentUser.role]})
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {showUserDropdown && currentUser && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Sesión activa: {currentUser.role.toUpperCase()}</span>
                  </div>
                </div>

                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Cambiar Rol Rápido
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        quickSwitchRole('admin');
                        setShowUserDropdown(false);
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium text-center transition-colors cursor-pointer ${
                        currentUser.role === 'admin'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => {
                        quickSwitchRole('cajero');
                        setShowUserDropdown(false);
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium text-center transition-colors cursor-pointer ${
                        currentUser.role === 'cajero'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Cajero
                    </button>
                    <button
                      onClick={() => {
                        quickSwitchRole('contador');
                        setShowUserDropdown(false);
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium text-center transition-colors cursor-pointer ${
                        currentUser.role === 'contador'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Contador
                    </button>
                  </div>
                </div>

                <div className="px-2 pt-1">
                  <button
                    onClick={() => {
                      handleReset();
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Restablecer datos demo</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                      onOpenLoginModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Toast */}
      {showResetNotice && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Datos demo restaurados con éxito para Guatemala.</span>
        </div>
      )}
    </header>
  );
};
