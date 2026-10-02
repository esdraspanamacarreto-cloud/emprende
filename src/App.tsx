import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { SalesView } from './components/sales/SalesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ReportsView } from './components/reports/ReportsView';
import { LoginModal } from './components/auth/LoginModal';
import { ReceiptModal } from './components/sales/ReceiptModal';
import { Menu, X } from 'lucide-react';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentSubTab, setCurrentSubTab] = useState<string | undefined>('resumen');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeReceiptSaleId, setActiveReceiptSaleId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { sales } = useData();

  const handleNavigate = (tab: string, subTab?: string) => {
    setCurrentTab(tab);
    setCurrentSubTab(subTab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReceipt = (saleId: string) => {
    setActiveReceiptSaleId(saleId);
  };

  const activeSaleForReceipt = sales.find((s) => s.id === activeReceiptSaleId) || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar adhering to 3-zone contract */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Mobile Top Subbar for toggle */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menú Módulos</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {currentTab} {currentSubTab ? `· ${currentSubTab}` : ''}
        </span>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            currentTab={currentTab}
            currentSubTab={currentSubTab}
            onNavigate={handleNavigate}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white h-full z-10 shadow-xl overflow-y-auto">
              <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-900">Navegación EMPRENDEGT</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar
                currentTab={currentTab}
                currentSubTab={currentSubTab}
                onNavigate={handleNavigate}
                onOpenLoginModal={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenReceipt={handleOpenReceipt}
            />
          )}

          {currentTab === 'productos' && (
            <ProductsView
              key={currentSubTab}
              initialSubTab={currentSubTab}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'ventas' && (
            <SalesView
              key={currentSubTab}
              initialSubTab={currentSubTab}
              onOpenReceipt={handleOpenReceipt}
            />
          )}

          {currentTab === 'gastos' && (
            <ExpensesView
              key={currentSubTab}
              initialSubTab={currentSubTab}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'clientes' && <CustomersView />}

          {currentTab === 'proveedores' && <SuppliersView />}

          {currentTab === 'reportes' && (
            <ReportsView
              key={currentSubTab}
              initialSubTab={currentSubTab}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <ReceiptModal
        sale={activeSaleForReceipt}
        isOpen={!!activeReceiptSaleId}
        onClose={() => setActiveReceiptSaleId(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}
