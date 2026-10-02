import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Customer } from '../../types';
import { formatCurrency, formatDate, exportToCsv } from '../../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  DollarSign,
  Phone,
  MapPin,
  CheckCircle,
  X,
  CreditCard
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, payCustomerCredit } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [nitOrDpi, setNitOrDpi] = useState('CF');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Payment / Abono modal
  const [payModalCustomer, setPayModalCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Delete modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setNitOrDpi('CF');
    setPhone('');
    setEmail('');
    setAddress('');
    setCreditLimit(0);
    setNotes('');
    setEditingCustomer(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setNitOrDpi(c.nitOrDpi);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setCreditLimit(c.creditLimit);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name,
        nitOrDpi: nitOrDpi.trim() || 'CF',
        phone,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: Number(creditLimit),
        notes: notes.trim() || undefined,
      });
    } else {
      addCustomer({
        name,
        nitOrDpi: nitOrDpi.trim() || 'CF',
        phone,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: Number(creditLimit),
        balanceOwed: 0,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalCustomer || payAmount <= 0) return;
    payCustomerCredit(payModalCustomer.id, payAmount);
    setPayModalCustomer(null);
    setPayAmount(0);
  };

  // Filter
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nitOrDpi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    const matchesDebt = filterDebtOnly ? c.balanceOwed > 0 : true;

    return matchesSearch && matchesDebt;
  });

  const totalOwedByAll = customers.reduce((acc, c) => acc + c.balanceOwed, 0);

  // Export
  const handleExportCsv = () => {
    const headers = [
      'Nombre',
      'NIT / DPI',
      'Teléfono',
      'Correo',
      'Dirección',
      'Saldo Pendiente (Q)',
      'Límite de Crédito (Q)',
      'Compras Totales (Q)',
    ];
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.nitOrDpi,
      c.phone,
      c.email || '',
      c.address || '',
      c.balanceOwed.toFixed(2),
      c.creditLimit.toFixed(2),
      c.totalSpent.toFixed(2),
    ]);
    exportToCsv('Directorio_Clientes_EMPRENDEGT', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de clientes, historial de compras, créditos y facturación SAT (NIT / CF)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Cliente</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Clientes Registrados
          </span>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers mt-1">
            {customers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Consumidores finales y cuentas comerciales
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cuentas por Cobrar (Créditos)
          </span>
          <div className="text-xl font-bold text-amber-600 font-mono-numbers mt-1">
            {formatCurrency(totalOwedByAll)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {customers.filter((c) => c.balanceOwed > 0).length} clientes con saldo pendiente
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ventas Acumuladas Clientes
          </span>
          <div className="text-xl font-bold text-emerald-700 font-mono-numbers mt-1">
            {formatCurrency(customers.reduce((acc, c) => acc + c.totalSpent, 0))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Volumen histórico facturado
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, NIT/DPI o teléfono..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterDebtOnly(!filterDebtOnly)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              filterDebtOnly
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {filterDebtOnly ? '✓ Mostrando solo con saldo' : 'Filtrar con saldo pendiente'}
          </button>

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
                <th className="py-3 px-4">Cliente / Razón Social</th>
                <th className="py-3 px-4">NIT / DPI</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Límite Crédito</th>
                <th className="py-3 px-4 text-right">Saldo por Cobrar</th>
                <th className="py-3 px-4 text-right">Compras Acumuladas</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron clientes para la búsqueda actual.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const hasDebt = cust.balanceOwed > 0;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        {cust.address && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {cust.address}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {cust.nitOrDpi}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>{cust.phone}</div>
                        {cust.email && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {cust.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono-numbers text-slate-600">
                        {cust.creditLimit > 0 ? formatCurrency(cust.creditLimit) : 'Sin crédito'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono-numbers font-bold ${
                            hasDebt ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(cust.balanceOwed)}
                        </span>
                        {hasDebt && (
                          <div className="text-[10px] text-amber-600 font-semibold">
                            Pendiente
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono-numbers text-slate-900 font-semibold">
                        {formatCurrency(cust.totalSpent)}
                        <div className="text-[10px] text-slate-400">
                          {cust.totalPurchasesCount} compras
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDebt && (
                            <button
                              onClick={() => {
                                setPayModalCustomer(cust);
                                setPayAmount(cust.balanceOwed);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                              title="Registrar Abono a la cuenta"
                            >
                              Abonar
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {cust.id !== 'cust_cf' && (
                            <button
                              onClick={() => setDeleteConfirmId(cust.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Doña Gloria Vásquez o Panadería La Espiga"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIT o CF *
                  </label>
                  <input
                    type="text"
                    required
                    value={nitOrDpi}
                    onChange={(e) => setNitOrDpi(e.target.value)}
                    placeholder="Ej. CF o 5629103-8"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+502 4589-1122"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Límite de Crédito Autorizado (Q)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección de Entrega / Facturación
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. 4ta Calle 8-12, Zona 3, Guatemala"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Condiciones de pago, días de cobro o referencias..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Credit / Abono Modal */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Abonar a Cuenta Corriente</span>
            </h3>
            <p className="text-xs text-slate-600 mb-1 font-semibold">
              {payModalCustomer.name}
            </p>
            <p className="text-xs text-amber-700 font-bold mb-4 font-mono">
              Saldo Pendiente: {formatCurrency(payModalCustomer.balanceOwed)}
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto a Abonar en Quetzales (Q) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={payModalCustomer.balanceOwed}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold text-slate-900 px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-2 text-rose-600">
              ¿Eliminar Cliente?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              El cliente será removido del directorio comercial.
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
                  deleteCustomer(deleteConfirmId);
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
