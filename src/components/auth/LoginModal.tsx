import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Lock, UserCheck, Shield, ShoppingBag, Calculator, X, Building2 } from 'lucide-react';
import { UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, login, logout, quickSwitchRole, businessProfile, updateBusinessProfile } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<'login' | 'perfil'>('login');

  // Business profile form state
  const [bName, setBName] = useState(businessProfile.name);
  const [bNit, setBNit] = useState(businessProfile.nit);
  const [bAddress, setBAddress] = useState(businessProfile.address);
  const [bPhone, setBPhone] = useState(businessProfile.phone);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || `${selectedRole}@emprendegt.com`, selectedRole);
    onClose();
  };

  const handleRoleQuickLogin = (role: UserRole) => {
    quickSwitchRole(role);
    onClose();
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      name: bName,
      nit: bNit,
      address: bAddress,
      phone: bPhone,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">EMPRENDEGT · Inicio de Sesión</h2>
              <p className="text-xs text-slate-300">Control de usuarios y perfil comercial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-2.5 text-xs font-semibold border-b-2 mr-6 transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Acceso y Roles
          </button>
          <button
            onClick={() => setActiveTab('perfil')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'perfil'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Datos del Negocio (SAT / NIT)
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'login' ? (
            <div className="space-y-5">
              {currentUser && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Sesión Actual Activa
                    </span>
                    <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-600">{currentUser.email} · Rol: {currentUser.role.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}

              {/* Quick access cards */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Acceso Rápido con 1 Clic (Perfiles Preconfigurados)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('admin')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Administrador</p>
                    <p className="text-[11px] text-slate-500">Acceso total a todos los módulos</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('cajero')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Cajero / POS</p>
                    <p className="text-[11px] text-slate-500">Ventas rápidas e inventario</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('contador')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-700 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Calculator className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Contador</p>
                    <p className="text-[11px] text-slate-500">Gastos, reportes y utilidades</p>
                  </button>
                </div>
              </div>

              {/* Form for manual credentials */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  O Ingrese Credenciales Manuales
                </p>
                <form onSubmit={handleManualLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@negociogt.com"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Rol Deseado</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="admin">Administrador</option>
                        <option value="cajero">Cajero / Vendedor</option>
                        <option value="contador">Contador</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Iniciar Sesión en EMPRENDEGT</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveBusiness} className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <Building2 className="w-6 h-6 text-slate-500 shrink-0" />
                <p className="text-xs text-slate-600">
                  Esta información aparece en las facturas, recibos impresos y reportes oficiales para Guatemala.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Comercial del Negocio</label>
                <input
                  type="text"
                  required
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">NIT de la Empresa</label>
                  <input
                    type="text"
                    required
                    value={bNit}
                    onChange={(e) => setBNit(e.target.value)}
                    placeholder="Ej. 8492015-3"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Dirección Comercial (Zona y Municipio)</label>
                <input
                  type="text"
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  placeholder="Ej. 6ta Avenida 12-42, Zona 1, Guatemala"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {savedSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-medium border border-emerald-200 text-center animate-in fade-in">
                  ✓ Datos comerciales actualizados correctamente
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Guardar Configuración Comercial
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
