import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Product, ProductCategory } from '../../types';
import { formatCurrency, exportToCsv } from '../../utils/formatters';
import { ProductImage } from '../common/ProductImage';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface ProductsViewProps {
  initialSubTab?: string;
  onNavigate: (tab: string, subTab?: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ initialSubTab = 'inventario' }) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    suppliers,
  } = useData();

  const [activeTab, setActiveTab] = useState<'inventario' | 'registrar'>(
    initialSubTab === 'registrar' ? 'registrar' : 'inventario'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');

  // Form state for creating / editing
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Abarrotes y Alimentos');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState('Unidad');
  const [supplierId, setSupplierId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const categories: ProductCategory[] = [
    'Abarrotes y Alimentos',
    'Agua Pura',
    'Cuidado Personal',
    'Limpieza del Hogar',
    'Snacks y Golosinas',
    'Lácteos y Huevos',
    'Ferretería y Herramientas',
    'Papelería y Oficina',
    'Otros',
  ];

  // Reset form
  const resetForm = () => {
    setCode(`PROD-${String(products.length + 1).padStart(3, '0')}`);
    setBarcode('');
    setName('');
    setDescription('');
    setCategory('Abarrotes y Alimentos');
    setCostPrice(0);
    setSalePrice(0);
    setStock(10);
    setMinStock(5);
    setUnit('Unidad');
    setSupplierId('');
    setImageUrl('');
  };

  const handleOpenRegister = () => {
    resetForm();
    setEditingProduct(null);
    setActiveTab('registrar');
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code);
    setBarcode(p.barcode || '');
    setName(p.name);
    setDescription(p.description || '');
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSalePrice(p.salePrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setUnit(p.unit);
    setSupplierId(p.supplierId || '');
    setImageUrl(p.imageUrl || '');
    setActiveTab('registrar');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = selectedSupplier ? selectedSupplier.companyName : undefined;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        code,
        barcode,
        name,
        description,
        category,
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
        stock: Number(stock),
        minStock: Number(minStock),
        unit,
        supplierId,
        supplierName,
        imageUrl: imageUrl.trim() || undefined,
      });
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setEditingProduct(null);
        setActiveTab('inventario');
      }, 1000);
    } else {
      addProduct({
        code,
        barcode,
        name,
        description,
        category,
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
        stock: Number(stock),
        minStock: Number(minStock),
        unit,
        supplierId,
        supplierName,
        imageUrl: imageUrl.trim() || undefined,
      });
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setActiveTab('inventario');
      }, 1000);
    }
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdjustProduct) return;
    const diff = adjustType === 'add' ? adjustAmount : -adjustAmount;
    adjustStock(quickAdjustProduct.id, diff);
    setQuickAdjustProduct(null);
  };

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.barcode && prod.barcode.includes(searchQuery));

    const matchesCategory =
      categoryFilter === 'all' || prod.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = prod.stock > 0 && prod.stock <= prod.minStock;
    } else if (stockFilter === 'out') {
      matchesStock = prod.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Código',
      'Código Barras',
      'Nombre',
      'Categoría',
      'Unidad',
      'Costo Q',
      'Precio Venta Q',
      'Existencia',
      'Stock Mínimo',
      'Proveedor',
    ];
    const rows = filteredProducts.map((p) => [
      p.code,
      p.barcode || '',
      p.name,
      p.category,
      p.unit,
      p.costPrice.toFixed(2),
      p.salePrice.toFixed(2),
      p.stock,
      p.minStock,
      p.supplierName || 'N/A',
    ]);
    exportToCsv('Inventario_EMPRENDEGT', headers, rows);
  };

  // Calculated margin for form preview
  const marginQ = salePrice - costPrice;
  const marginPercent = salePrice > 0 ? (marginQ / salePrice) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Control de Productos e Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro, edición, control de existencias y costos en Quetzales (Q)
          </p>
        </div>

        {/* Tab Switch & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'inventario'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Ver Inventario ({products.length})
          </button>
          <button
            onClick={handleOpenRegister}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
              activeTab === 'registrar'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Producto</span>
          </button>
        </div>
      </div>

      {activeTab === 'inventario' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, código o barra..."
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas las existencias</option>
                <option value="low">⚠️ Solo Stock Bajo</option>
                <option value="out">🛑 Solo Agotados (0)</option>
              </select>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Exportar a Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Código / Barras</th>
                    <th className="py-3 px-4">Producto & Categoría</th>
                    <th className="py-3 px-4 text-right">Costo (Q)</th>
                    <th className="py-3 px-4 text-right">Precio Venta (Q)</th>
                    <th className="py-3 px-4 text-right">Margen</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No se encontraron productos con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;
                      const isOutOfStock = prod.stock === 0;
                      const prodMargin = prod.salePrice - prod.costPrice;
                      const prodMarginPercent =
                        prod.salePrice > 0 ? (prodMargin / prod.salePrice) * 100 : 0;

                      return (
                        <tr
                          key={prod.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isOutOfStock
                              ? 'bg-rose-50/30'
                              : isLowStock
                              ? 'bg-amber-50/30'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900">
                              {prod.code}
                            </span>
                            {prod.barcode && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                ║▌ {prod.barcode}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                                <ProductImage
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  category={prod.category}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{prod.name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <span>{prod.category}</span>
                                  <span>·</span>
                                  <span className="italic">{prod.unit}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono-numbers text-slate-600">
                            {formatCurrency(prod.costPrice)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                            {formatCurrency(prod.salePrice)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono-numbers text-emerald-700 font-semibold">
                            {prodMarginPercent.toFixed(0)}%
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`font-mono-numbers font-bold text-sm ${
                                  isOutOfStock
                                    ? 'text-rose-600'
                                    : isLowStock
                                    ? 'text-amber-600'
                                    : 'text-slate-900'
                                }`}
                              >
                                {prod.stock}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                / min {prod.minStock}
                              </span>
                            </div>
                            {isOutOfStock && (
                              <div className="text-[10px] text-rose-600 font-bold uppercase">
                                Agotado
                              </div>
                            )}
                            {isLowStock && (
                              <div className="text-[10px] text-amber-600 font-bold uppercase">
                                Stock Bajo
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                            {prod.supplierName || '—'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setQuickAdjustProduct(prod);
                                  setAdjustAmount(1);
                                  setAdjustType('add');
                                }}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                title="Ajustar existencias (+/-)"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(prod)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Editar producto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(prod.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      ) : (
        /* Form for Register / Edit Product */
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-xs mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h2>
              <p className="text-xs text-slate-500">
                Complete los datos para inventario y facturación en Quetzales
              </p>
            </div>
            <button
              onClick={() => setActiveTab('inventario')}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código Interno / SKU *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej. AB-010"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Barras (Opcional)
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ej. 740100100199"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Café de Antigua Gourmet Molido 400g"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Unidad">Unidad</option>
                  <option value="Libra">Libra (lb)</option>
                  <option value="Bolsa">Bolsa</option>
                  <option value="Botella">Botella</option>
                  <option value="Lata">Lata</option>
                  <option value="Caja">Caja</option>
                  <option value="Cartón">Cartón</option>
                  <option value="Docena">Docena</option>
                  <option value="Paquete">Paquete</option>
                  <option value="Galón">Galón</option>
                  <option value="Litro">Litro</option>
                </select>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Precios y Rentabilidad (Quetzales)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio de Costo (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio de Venta al Público (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Profit preview pill */}
              <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                <span>
                  Ganancia por unidad: <strong className="text-emerald-700">{formatCurrency(marginQ)}</strong>
                </span>
                <span>
                  Margen bruto: <strong className="text-emerald-700">{marginPercent.toFixed(1)}%</strong>
                </span>
              </div>
            </div>

            {/* Stock Control */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Existencia Actual (Stock) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Mínimo (Alerta) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proveedor
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sin proveedor asignado</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Image URL Input & Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Foto del Producto (URL o Ruta)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-300 shrink-0 shadow-2xs">
                  <ProductImage
                    src={imageUrl}
                    alt={name || 'Vista previa'}
                    category={category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Ej. /src/assets/images/prod_cafe_antigua_1790967496211.jpg"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ingresa una ruta local o URL de imagen. Si se deja vacío, se mostrará el ícono de la categoría.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción / Notas
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles sobre presentación, empaque o características..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>
                  {editingProduct
                    ? 'Producto actualizado correctamente'
                    : 'Producto registrado con éxito en el catálogo'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('inventario')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Volver al Inventario
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-sm">¿Eliminar Producto?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Esta acción no se puede deshacer. El producto será removido del inventario y del catálogo de ventas.
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
                  deleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Adjust Stock Modal */}
      {quickAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Ajuste Rápido de Stock</h3>
              <button
                onClick={() => setQuickAdjustProduct(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-800 line-clamp-1">
              {quickAdjustProduct.name}
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Stock actual: <strong className="font-mono">{quickAdjustProduct.stock} {quickAdjustProduct.unit}</strong>
            </p>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Entrada (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    adjustType === 'remove'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>Salida (-)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cantidad a {adjustType === 'add' ? 'Ingresar' : 'Retirar'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 1)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAdjustProduct(null)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
