import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Supplier } from '../../types';
import { exportToCsv } from '../../utils/formatters';
import {
  Truck,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  X,
  Package
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nit, setNit] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setNit('');
    setAddress('');
    setCategory('Abarrotes y Granos');
    setPaymentTermsDays(0);
    setNotes('');
    setEditingSupplier(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setCompanyName(s.companyName);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setEmail(s.email);
    setNit(s.nit);
    setAddress(s.address);
    setCategory(s.category);
    setPaymentTermsDays(s.paymentTermsDays);
    setNotes(s.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        companyName,
        contactPerson,
        phone,
        email,
        nit,
        address,
        category,
        paymentTermsDays: Number(paymentTermsDays),
        notes: notes.trim() || undefined,
      });
    } else {
      addSupplier({
        companyName,
        contactPerson,
        phone,
        email,
        nit,
        address,
        category,
        paymentTermsDays: Number(paymentTermsDays),
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Filter
  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nit.includes(searchQuery)
    );
  });

  // Export
  const handleExportCsv = () => {
    const headers = [
      'Empresa Proveedora',
      'Contacto',
      'NIT',
      'Teléfono',
      'Correo',
      'Categoría',
      'Términos de Crédito (Días)',
      'Dirección',
    ];
    const rows = filteredSuppliers.map((s) => [
      s.companyName,
      s.contactPerson,
      s.nit,
      s.phone,
      s.email,
      s.category,
      s.paymentTermsDays === 0 ? 'Contado' : `${s.paymentTermsDays} días`,
      s.address,
    ]);
    exportToCsv('Proveedores_EMPRENDEGT', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Control de Proveedores & Compras
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empresas distribuidoras, contactos de entrega, condiciones de crédito y abastecimiento
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Proveedor</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Proveedores Activos
          </span>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers mt-1">
            {suppliers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Marcas y distribuidores aliados
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Con Línea de Crédito
          </span>
          <div className="text-xl font-bold text-indigo-600 font-mono-numbers mt-1">
            {suppliers.filter((s) => s.paymentTermsDays > 0).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Plazos autorizados (15 a 30 días)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Productos Abastecidos
          </span>
          <div className="text-xl font-bold text-emerald-700 font-mono-numbers mt-1">
            {products.filter((p) => p.supplierId).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Artículos catalogados con proveedor
          </p>
        </div>
      </div>

      {/* Search & Export */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por empresa, contacto o insumo..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Exportar Proveedores CSV</span>
        </button>
      </div>

      {/* Grid of Suppliers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => {
          const linkedProducts = products.filter((p) => p.supplierId === sup.id);

          return (
            <div
              key={sup.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {sup.companyName}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        NIT: {sup.nit}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {sup.paymentTermsDays === 0 ? 'Contado' : `${sup.paymentTermsDays} días`}
                  </span>
                </div>

                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Contacto: <strong>{sup.contactPerson}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Categoría:</span> {sup.category}
                </div>

                {sup.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded">
                    "{sup.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{linkedProducts.length} productos</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Editar proveedor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(sup.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Eliminar proveedor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
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
                  Nombre de la Empresa Proveedora *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. Cervecería Centro Americana, S.A."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Persona de Contacto / Vendedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ej. Lic. Fernando Ortiz"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIT de la Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="Ej. 345678-9"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono de Pedidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+502 2289-7000"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pedidos@empresa.gt"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría de Insumos
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Bebidas, Harinas, Lácteos"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Días de Crédito (0 = Contado)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección o Bodega de Despacho
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Anillo Periférico 18-90, Zona 7, Ciudad de Guatemala"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas de Entrega o Frecuencia de Visita
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Día de toma de pedido, descuentos por volumen..."
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
                  {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
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
              ¿Eliminar Proveedor?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              El proveedor será removido del catálogo de abastecimiento.
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
                  deleteSupplier(deleteConfirmId);
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
