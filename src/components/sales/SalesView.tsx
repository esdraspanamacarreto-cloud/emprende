import React, { useState, useId } from 'react';
import { useData } from '../../context/DataContext';
import { Product, SaleItem, PaymentMethod } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ProductImage } from '../common/ProductImage';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  Banknote,
  Building,
  RotateCcw,
  Eye,
  AlertCircle,
  Barcode,
  User,
  ArrowRight,
  Filter,
  Package
} from 'lucide-react';

interface SalesViewProps {
  initialSubTab?: string;
  onOpenReceipt: (saleId: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  initialSubTab = 'nueva',
  onOpenReceipt,
}) => {
  const { products, sales, customers, createSale, cancelSale } = useData();

  const [activeTab, setActiveTab] = useState<'nueva' | 'historial'>(
    initialSubTab === 'historial' ? 'historial' : 'nueva'
  );

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_cf');
  const [customNit, setCustomNit] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountPaidInput, setAmountPaidInput] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Cancel sale state
  const [cancelModalSaleId, setCancelModalSaleId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Devolución de cliente');

  // Filter for Historial
  const [historySearch, setHistorySearch] = useState('');
  const [historyMethodFilter, setHistoryMethodFilter] = useState('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');

  const categories = [
    'all',
    'Abarrotes y Alimentos',
    'Agua Pura',
    'Cuidado Personal',
    'Limpieza del Hogar',
    'Snacks y Golosinas',
    'Lácteos y Huevos',
  ];

  // Cart calculations
  const subtotalCart = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalCart = Math.max(0, subtotalCart - discountAmount);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`El producto "${product.name}" no tiene existencias disponibles.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`No puedes agregar más de ${product.stock} unidades disponibles.`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          code: product.code,
          quantity: 1,
          unitPrice: product.salePrice,
          costPrice: product.costPrice,
          subtotal: product.salePrice,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > prod.stock) {
      alert(`Solo hay ${prod.stock} unidades en stock.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Barcode / code quick scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
        p.code.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No se encontró producto con código o barra "${barcodeInput}".`);
    }
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountPaidInput(totalCart);
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  // Complete checkout
  const handleCompleteSale = () => {
    setCheckoutError(null);

    // Validate cash payment
    if (paymentMethod === 'efectivo' && amountPaidInput < totalCart) {
      setCheckoutError(
        `El monto pagado (${formatCurrency(amountPaidInput)}) es menor que el total (${formatCurrency(totalCart)}).`
      );
      return;
    }

    let customerName = 'Consumidor Final';
    let customerNit = 'CF';
    let finalCustId = selectedCustomerId;

    if (isCustomCustomer) {
      customerName = customName.trim() || 'Consumidor Final';
      customerNit = customNit.trim() || 'CF';
      finalCustId = 'cust_cf';
    } else {
      const found = customers.find((c) => c.id === selectedCustomerId);
      if (found) {
        customerName = found.name;
        customerNit = found.nitOrDpi;
      }
    }

    const change =
      paymentMethod === 'efectivo' ? Math.max(0, amountPaidInput - totalCart) : 0;

    const createdSale = createSale({
      items: cart,
      subtotal: subtotalCart,
      discount: discountAmount,
      total: totalCart,
      paymentMethod,
      amountPaid: paymentMethod === 'efectivo' ? amountPaidInput : totalCart,
      change,
      customerId: finalCustId,
      customerName,
      customerNit,
      notes: saleNotes,
    });

    // Reset POS & open receipt
    setIsCheckoutOpen(false);
    clearCart();
    setSaleNotes('');
    onOpenReceipt(createdSale.id);
  };

  // Cancel sale execution
  const handleConfirmCancelSale = () => {
    if (!cancelModalSaleId) return;
    cancelSale(cancelModalSaleId, cancelReason);
    setCancelModalSaleId(null);
  };

  // Filtered products for catalog
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered sales for history
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.receiptNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.customerNit.toLowerCase().includes(historySearch.toLowerCase());

    const matchesMethod =
      historyMethodFilter === 'all' || s.paymentMethod === historyMethodFilter;

    let matchesDate = true;
    const saleDateStr = s.date.split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    if (historyDateFilter === 'today') {
      matchesDate = saleDateStr === today;
    } else if (historyDateFilter === '7days') {
      const past7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      matchesDate = saleDateStr >= past7;
    } else if (historyDateFilter === 'month') {
      const currentMonth = today.substring(0, 7);
      matchesDate = saleDateStr.startsWith(currentMonth);
    }

    return matchesSearch && matchesMethod && matchesDate;
  });

  const totalFilteredSalesSum = filteredSales
    .filter((s) => s.status === 'completada')
    .reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & SubTab Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Módulo de Ventas & Facturación
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Punto de venta (POS) en tiempo real con emisión de tickets y facturas FEL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('nueva')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'nueva'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Nueva Venta (POS)</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>Historial ({sales.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'nueva' ? (
        /* POS Layout: Left catalog (60%) + Right cart & checkout (40%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Catalog & Barcode scan */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Barcode Quick Input + Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex gap-2">
                <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
                  <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Escanear código de barras o teclear SKU y presionar Enter..."
                    className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </form>
                <button
                  type="button"
                  onClick={handleBarcodeSubmit}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Agregar
                </button>
              </div>

              {/* Text Search & Category scroll */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar producto por nombre..."
                  className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category Pills (Functional filter buttons with counts) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
                {categories.map((cat) => {
                  const count = cat === 'all'
                    ? products.length
                    : products.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat === 'all' ? 'Todas las Categorías' : cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedCategory === cat ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Grid with Product Images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    className={`bg-white border rounded-xl p-3 shadow-xs transition-all flex flex-col justify-between cursor-pointer group ${
                      isOutOfStock
                        ? 'opacity-65 border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-emerald-500 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Product Image Frame */}
                      <div className="relative w-full aspect-square mb-2.5 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                        <ProductImage
                          src={prod.imageUrl}
                          alt={prod.name}
                          category={prod.category}
                          className="w-full h-full object-cover"
                        />

                        {/* Top Stock Badge */}
                        <div className="absolute top-1.5 right-1.5">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-rose-600 px-1.5 py-0.5 rounded shadow-xs">
                              Agotado
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/95 px-1.5 py-0.5 rounded shadow-xs">
                              Quedan {prod.stock}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-700 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-xs">
                              {prod.stock} {prod.unit}
                            </span>
                          )}
                        </div>

                        {/* Top Code Badge */}
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-800 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-xs">
                            {prod.code}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {prod.category}
                      </p>
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 font-mono-numbers text-sm">
                          {formatCurrency(prod.salePrice)}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(prod);
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white shadow-xs'
                        }`}
                        title="Agregar a la canasta"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Cart & Fast Checkout */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Canasta de Venta ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Customer Selector Block */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg mb-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Cliente / Facturación
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomCustomer(!isCustomCustomer)}
                  className="text-emerald-700 hover:underline font-semibold cursor-pointer text-[11px]"
                >
                  {isCustomCustomer ? 'Elegir de lista' : '+ Ingresar otro NIT'}
                </button>
              </div>

              {isCustomCustomer ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    value={customNit}
                    onChange={(e) => setCustomNit(e.target.value)}
                    placeholder="NIT o CF (Ej. 481920-1)"
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nombre o Razón Social"
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.nitOrDpi === 'CF' ? 'CF' : `NIT: ${c.nitOrDpi}`})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  La canasta está vacía. Selecciona productos del catálogo o escanea con la barra de búsqueda.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <ProductImage
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate" title={item.productName}>
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          @{formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono-numbers font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-mono-numbers font-bold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Totals & Checkout Button */}
            <div className="pt-3 border-t border-slate-200 mt-3 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono-numbers">{formatCurrency(subtotalCart)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Descuento (Q):</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-20 text-right text-xs px-2 py-0.5 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total a Cobrar:</span>
                <span className="font-mono-numbers text-base text-emerald-700">
                  {formatCurrency(totalCart)}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                  cart.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <span>Cobrar {formatCurrency(totalCart)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* History of Sales */
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por No. Factura, cliente o NIT..."
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value as any)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas las Fechas</option>
                <option value="today">Ventas de Hoy</option>
                <option value="7days">Últimos 7 días</option>
                <option value="month">Mes Actual</option>
              </select>

              <select
                value={historyMethodFilter}
                onChange={(e) => setHistoryMethodFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos los Métodos</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="credito">Al Crédito</option>
              </select>

              <div className="text-xs px-3 py-2 bg-emerald-50 text-emerald-800 rounded-lg font-bold font-mono">
                Total: {formatCurrency(totalFilteredSalesSum)}
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">No. Factura</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Cliente / NIT</th>
                    <th className="py-3 px-4">Artículos</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4 text-right">Total (Q)</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No se encontraron registros de ventas para esta búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const isAnulada = sale.status === 'anulada';
                      return (
                        <tr
                          key={sale.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isAnulada ? 'bg-slate-50/60 opacity-65' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {sale.receiptNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatDateTime(sale.date)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">
                              {sale.customerName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              NIT: {sale.customerNit}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {sale.items.length} productos (
                            {sale.items.reduce((a, b) => a + b.quantity, 0)} uds)
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-700">
                            {sale.paymentMethod}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                            {isAnulada ? (
                              <span className="line-through text-slate-400">
                                {formatCurrency(sale.total)}
                              </span>
                            ) : (
                              formatCurrency(sale.total)
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isAnulada ? (
                              <span className="text-[10px] font-bold uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                Anulada
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Completada
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenReceipt(sale.id)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Ver comprobante"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!isAnulada && (
                                <button
                                  onClick={() => setCancelModalSaleId(sale.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Anular venta y devolver stock"
                                >
                                  <RotateCcw className="w-4 h-4" />
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
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200 mb-4">
              Finalizar Venta · Total: {formatCurrency(totalCart)}
            </h2>

            {checkoutError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('efectivo');
                      setAmountPaidInput(totalCart);
                    }}
                    className={`p-2.5 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'efectivo'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Efectivo Chapín</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`p-2.5 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'transferencia'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Transferencia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`p-2.5 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'tarjeta'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <span>Tarjeta (POS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credito')}
                    className={`p-2.5 text-xs font-semibold rounded-lg border flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'credito'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-amber-600" />
                    <span>Al Crédito</span>
                  </button>
                </div>
              </div>

              {/* Cash payment bills calculator */}
              {paymentMethod === 'efectivo' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monto Recibido en Quetzales (Q)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={totalCart}
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(parseFloat(e.target.value) || 0)}
                      className="w-full text-base font-bold text-slate-900 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  {/* Fast tender bill shortcuts */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Billetes Rápidos:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAmountPaidInput(totalCart)}
                        className="px-2 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer font-mono"
                      >
                        Exacto ({formatCurrency(totalCart)})
                      </button>
                      {[20, 50, 100, 200].map((bill) => (
                        <button
                          key={bill}
                          type="button"
                          onClick={() => setAmountPaidInput(bill)}
                          className="px-2 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer font-mono"
                        >
                          Q{bill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-700">Cambio a Entregar:</span>
                    <span className="font-mono-numbers text-base text-emerald-700">
                      {formatCurrency(Math.max(0, amountPaidInput - totalCart))}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'transferencia' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                  <p className="font-bold">Bancos Disponibles para Transferencia:</p>
                  <p className="text-[11px] mt-1">
                    Banrural, Banco Industrial (BI), BAM, G&T Continental.
                  </p>
                </div>
              )}

              {paymentMethod === 'credito' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <p className="font-bold">Crédito Comercial:</p>
                  <p className="text-[11px] mt-1">
                    Esta venta incrementará el saldo por cobrar del cliente seleccionado.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas de la Venta (Opcional)
                </label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="Ej. No. autorización transferencia o comentarios"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Volver a la Canasta
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSale}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar e Imprimir Factura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Sale Modal */}
      {cancelModalSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-2 text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>¿Anular Venta Seleccionada?</span>
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Al anular esta venta, las unidades vendidas regresarán automáticamente al inventario disponible.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Motivo de la anulación
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
              >
                <option value="Devolución de cliente">Devolución de cliente</option>
                <option value="Error en precio o producto">Error en precio o producto</option>
                <option value="Cliente desistió de compra">Cliente desistió de la compra</option>
                <option value="Duplicidad de comprobante">Duplicidad de comprobante</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelModalSaleId(null)}
                className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCancelSale}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Sí, Anular Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
