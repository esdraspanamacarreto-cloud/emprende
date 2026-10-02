import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate, exportToCsv } from '../../utils/formatters';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  CheckCircle,
  Building,
  TrendingDown,
  DollarSign
} from 'lucide-react';

interface ExpensesViewProps {
  initialSubTab?: string;
  onNavigate: (tab: string, subTab?: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  initialSubTab = 'historial',
}) => {
  const { expenses, addExpense, deleteExpense } = useData();

  const [activeTab, setActiveTab] = useState<'historial' | 'registrar'>(
    initialSubTab === 'registrar' ? 'registrar' : 'historial'
  );

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory>('Servicios Básicos (Luz/Agua/Internet)');
  const [description, setDescription] = useState('');
  const [supplierOrBeneficiary, setSupplierOrBeneficiary] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'cheque'>('efectivo');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formSuccess, setFormSuccess] = useState(false);

  // Historial Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const categoriesList: ExpenseCategory[] = [
    'Alquiler de Local',
    'Servicios Básicos (Luz/Agua/Internet)',
    'Sueldos y Salarios',
    'Proveedores y Mercadería',
    'Transporte y Combustible',
    'Marketing y Publicidad',
    'Mantenimiento y Reparaciones',
    'Impuestos y SAT',
    'Otros Gastos',
  ];

  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('El monto del gasto debe ser mayor a 0');
      return;
    }

    addExpense({
      date: `${expenseDate}T${new Date().toTimeString().split(' ')[0]}`,
      category,
      description,
      amount: Number(amount),
      paymentMethod,
      supplierOrBeneficiary: supplierOrBeneficiary.trim() || 'General',
      invoiceRef: invoiceRef.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      // Reset form
      setAmount(0);
      setDescription('');
      setSupplierOrBeneficiary('');
      setInvoiceRef('');
      setNotes('');
      setActiveTab('historial');
    }, 1000);
  };

  // Filtered Expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.supplierOrBeneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.invoiceRef && exp.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' || exp.category === categoryFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = exp.date.startsWith(todayStr);
    } else if (dateFilter === 'month') {
      matchesDate = exp.date.startsWith(currentMonthStr);
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalFilteredAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Month and Today stats
  const todayTotal = expenses
    .filter((e) => e.date.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const monthTotal = expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((acc, e) => acc + e.amount, 0);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'No. Gasto',
      'Fecha',
      'Categoría',
      'Descripción',
      'Proveedor / Beneficiario',
      'Método de Pago',
      'No. Factura',
      'Monto (Q)',
      'Registrado por',
    ];
    const rows = filteredExpenses.map((e) => [
      e.expenseNumber,
      formatDate(e.date),
      e.category,
      e.description,
      e.supplierOrBeneficiary,
      e.paymentMethod,
      e.invoiceRef || 'N/A',
      e.amount.toFixed(2),
      e.recordedBy,
    ]);
    exportToCsv('Historial_Gastos_EMPRENDEGT', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Control de Gastos Operativos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro, deducciones fiscales y seguimiento de costos en Quetzales (Q)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Historial ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('registrar')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
              activeTab === 'registrar'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Gastos de Hoy
          </span>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers mt-1">
            {formatCurrency(todayTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {expenses.filter((e) => e.date.startsWith(todayStr)).length} movimientos hoy
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Gastos Mes en Curso
          </span>
          <div className="text-xl font-bold text-rose-600 font-mono-numbers mt-1">
            {formatCurrency(monthTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total acumulado del mes corriente
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total en Filtro Actual
          </span>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers mt-1">
            {formatCurrency(totalFilteredAmount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredExpenses.length} gastos listados
          </p>
        </div>
      </div>

      {activeTab === 'historial' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por concepto, proveedor o factura..."
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">Todas las Categorías</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">Todo el Historial</option>
                <option value="today">Gastos de Hoy</option>
                <option value="month">Mes Actual</option>
              </select>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">No. Gasto</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Categoría & Concepto</th>
                    <th className="py-3 px-4">Proveedor / Beneficiario</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4 text-right">Monto (Q)</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No hay gastos registrados que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {exp.expenseNumber}
                          {exp.invoiceRef && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Doc: {exp.invoiceRef}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          {formatDate(exp.date)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{exp.description}</div>
                          <div className="text-[11px] text-slate-500">{exp.category}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-700">
                          {exp.supplierOrBeneficiary}
                        </td>

                        <td className="py-3 px-4 capitalize text-slate-600">
                          {exp.paymentMethod}
                        </td>

                        <td className="py-3 px-4 text-right font-mono-numbers font-bold text-rose-600">
                          {formatCurrency(exp.amount)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDeleteConfirmId(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Form for Register Expense */
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-xs mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registrar Gasto del Negocio
              </h2>
              <p className="text-xs text-slate-500">
                Ingrese los comprobantes de egreso para el cálculo preciso de utilidades
              </p>
            </div>
            <button
              onClick={() => setActiveTab('historial')}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleRegisterExpense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto del Gasto en Quetzales (Q) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full text-base font-bold text-rose-600 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha del Gasto *
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría del Gasto *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de Pago Utilizado
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Tarjeta Débito / Crédito</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción / Concepto *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Pago de energía eléctrica local comercial mes de septiembre"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proveedor / Beneficiario
                </label>
                <input
                  type="text"
                  value={supplierOrBeneficiary}
                  onChange={(e) => setSupplierOrBeneficiary(e.target.value)}
                  placeholder="Ej. EEGSA / Gasolinera Shell / Propietario"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Factura / Comprobante (Opcional)
                </label>
                <input
                  type="text"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  placeholder="Ej. DTE-4910291 o REC-094"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observaciones Adicionales
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas internas contables..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Gasto registrado exitosamente en el libro contable.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('historial')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Guardar Gasto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-2 text-rose-600">
              ¿Eliminar Registro de Gasto?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Este movimiento será borrado permanentemente y recalculará la utilidad del negocio.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteExpense(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
