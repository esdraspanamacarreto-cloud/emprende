import React from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  Package,
  AlertTriangle,
  ShoppingCart,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string, subTab?: string) => void;
  onOpenReceipt: (saleId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenReceipt }) => {
  const {
    sales,
    expenses,
    products,
    customers,
    lowStockProducts,
    outOfStockProducts,
    customersWithDebt,
    currentUser,
    businessProfile
  } = useData();

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Ventas del día
  const todaySales = sales.filter(
    (s) => s.status === 'completada' && s.date.startsWith(todayStr)
  );
  const totalSalesToday = todaySales.reduce((acc, s) => acc + s.total, 0);
  const countSalesToday = todaySales.length;
  const avgTicketToday = countSalesToday > 0 ? totalSalesToday / countSalesToday : 0;

  // 2. Gastos del día y del mes
  const todayExpenses = expenses.filter((e) => e.date.startsWith(todayStr));
  const totalExpensesToday = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  const currentYearMonth = todayStr.substring(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentYearMonth));
  const totalExpensesMonth = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

  // 3. Ganancia del día (Venta total - Costo de mercancía vendida - Gastos del día)
  const costOfGoodsSoldToday = todaySales.reduce((acc, sale) => {
    const saleCost = sale.items.reduce(
      (itemAcc, item) => itemAcc + item.costPrice * item.quantity,
      0
    );
    return acc + saleCost;
  }, 0);

  const grossProfitToday = totalSalesToday - costOfGoodsSoldToday;
  const netProfitToday = grossProfitToday - totalExpensesToday;
  const profitMarginPercent =
    totalSalesToday > 0 ? (netProfitToday / totalSalesToday) * 100 : 0;

  // 4. Productos disponibles e inventario
  const totalProductsCount = products.length;
  const totalUnitsInStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalCostValuation = products.reduce(
    (acc, p) => acc + p.costPrice * p.stock,
    0
  );
  const totalRetailValuation = products.reduce(
    (acc, p) => acc + p.salePrice * p.stock,
    0
  );

  // 5. Alertas totales
  const totalAlertsCount =
    lowStockProducts.length + outOfStockProducts.length + customersWithDebt.length;

  // Top selling products computation
  const productSalesCountMap: Record<string, { name: string; qty: number; totalQ: number }> = {};
  sales
    .filter((s) => s.status === 'completada')
    .forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSalesCountMap[item.productId]) {
          productSalesCountMap[item.productId] = {
            name: item.productName,
            qty: 0,
            totalQ: 0,
          };
        }
        productSalesCountMap[item.productId].qty += item.quantity;
        productSalesCountMap[item.productId].totalQ += item.subtotal;
      });
    });

  const topSellingProducts = Object.values(productSalesCountMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Panel de Control · {businessProfile.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fecha de operación: <span className="font-semibold text-slate-700">{formatDate(new Date())}</span> · Sesión: {currentUser?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('ventas', 'nueva')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Nueva Venta</span>
          </button>
          <button
            onClick={() => onNavigate('gastos', 'registrar')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>+ Registrar Gasto</span>
          </button>
          <button
            onClick={() => onNavigate('productos', 'registrar')}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-500" />
            <span>+ Producto</span>
          </button>
        </div>
      </div>

      {/* 5 Core Metric Cards according to user spec */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Ventas del día */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ventas del Día
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers">
            {formatCurrency(totalSalesToday)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{countSalesToday} tickets emitidos</span>
            <span className="font-mono-numbers">Prom: {formatCurrency(avgTicketToday)}</span>
          </div>
        </div>

        {/* 2. Gastos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gastos del Día
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers">
            {formatCurrency(totalExpensesToday)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Mes actual:</span>
            <span className="font-mono-numbers font-semibold text-rose-600">
              {formatCurrency(totalExpensesMonth)}
            </span>
          </div>
        </div>

        {/* 3. Ganancia */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ganancia del Día
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono-numbers ${netProfitToday >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatCurrency(netProfitToday)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Margen neto:</span>
            <span className="font-mono-numbers font-semibold text-slate-800">
              {profitMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 4. Productos disponibles */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Productos Disponibles
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers">
            {totalUnitsInStock}{' '}
            <span className="text-xs font-normal text-slate-500">unidades</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{totalProductsCount} referencias</span>
            <button
              onClick={() => onNavigate('productos', 'inventario')}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Ver Catálogo
            </button>
          </div>
        </div>

        {/* 5. Alertas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Alertas Activas
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              totalAlertsCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono-numbers">
            {totalAlertsCount}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {lowStockProducts.length} bajas · {outOfStockProducts.length} agotadas
            </span>
            <button
              onClick={() => onNavigate('dashboard', 'alertas')}
              className="text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Detalles
            </button>
          </div>
        </div>

      </div>

      {/* Section: Operational Alertas Box (if any exist) */}
      {totalAlertsCount > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Centro de Alertas de Negocio (Atención Requerida)</span>
            </div>
            <span className="text-xs text-rose-700 font-medium">
              Actualizado en tiempo real
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Low stock alerts */}
            {lowStockProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-rose-200/80 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Stock Bajo
                    </span>
                    <span className="text-xs font-mono text-slate-500">{prod.code}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                    {prod.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Quedan: <strong className="text-rose-700 font-mono">{prod.stock} {prod.unit}</strong> (Mínimo: {prod.minStock})
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('productos', 'inventario')}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer whitespace-nowrap ml-2"
                >
                  Surtir
                </button>
              </div>
            ))}

            {/* Out of stock alerts */}
            {outOfStockProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-rose-300 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-rose-600 px-1.5 py-0.5 rounded">
                    Agotado (0)
                  </span>
                  <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                    {prod.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Proveedor: {prod.supplierName || 'No asignado'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('productos', 'inventario')}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-md transition-colors cursor-pointer whitespace-nowrap ml-2"
                >
                  Pedir
                </button>
              </div>
            ))}

            {/* Debt alerts */}
            {customersWithDebt.slice(0, 3).map((cust) => (
              <div
                key={cust.id}
                className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    Saldo al Crédito
                  </span>
                  <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                    {cust.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Debe: <strong className="text-amber-800 font-mono">{formatCurrency(cust.balanceOwed)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('clientes')}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer whitespace-nowrap ml-2"
                >
                  Cobrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Recent Sales & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Últimas Ventas Realizadas
              </h2>
              <p className="text-xs text-slate-500">Transacciones y facturas registradas en caja</p>
            </div>
            <button
              onClick={() => onNavigate('ventas', 'historial')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Ver todas →
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay ventas registradas aún. Presiona "+ Nueva Venta" para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2 font-medium">No. Factura</th>
                    <th className="pb-2 font-medium">Cliente / NIT</th>
                    <th className="pb-2 font-medium">Método</th>
                    <th className="pb-2 font-medium text-right">Total (Q)</th>
                    <th className="pb-2 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.slice(0, 6).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5">
                        <span className="font-mono font-bold text-slate-800">
                          {sale.receiptNumber}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {formatDateTime(sale.date)}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="font-medium text-slate-900 truncate max-w-[150px]">
                          {sale.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIT: {sale.customerNit}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="capitalize text-slate-600">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono-numbers font-bold text-slate-900">
                        {sale.status === 'anulada' ? (
                          <span className="line-through text-slate-400">
                            {formatCurrency(sale.total)}
                          </span>
                        ) : (
                          formatCurrency(sale.total)
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onOpenReceipt(sale.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Ver Comprobante / Imprimir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Recibo</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Top Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Productos Más Vendidos
                </h2>
                <p className="text-xs text-slate-500">Por unidades rotadas</p>
              </div>
            </div>

            <div className="space-y-3">
              {topSellingProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 max-w-[170px]">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 font-medium truncate" title={p.name}>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 font-mono-numbers">
                      {p.qty} uds
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono-numbers">
                      {formatCurrency(p.totalQ)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Inventory Valuation Card */}
          <div className="mt-6 pt-4 border-t border-slate-200 bg-slate-50 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Valorización de Inventario
            </span>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-600">Inversión a Costo:</span>
              <span className="font-mono-numbers font-semibold text-slate-800">
                {formatCurrency(totalCostValuation)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-600">Venta Proyectada:</span>
              <span className="font-mono-numbers font-bold text-emerald-700">
                {formatCurrency(totalRetailValuation)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
