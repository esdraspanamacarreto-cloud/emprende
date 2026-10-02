import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, exportToCsv } from '../../utils/formatters';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  Package,
  Download,
  Calendar,
  Filter,
  DollarSign,
  PieChart,
  BarChart3,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface ReportsViewProps {
  initialSubTab?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialSubTab = 'ventas',
}) => {
  const { sales, expenses, products, customers } = useData();

  const [activeReport, setActiveReport] = useState<
    'ventas' | 'gastos' | 'ganancias' | 'inventario'
  >(
    ['ventas', 'gastos', 'ganancias', 'inventario'].includes(initialSubTab)
      ? (initialSubTab as any)
      : 'ventas'
  );

  const [period, setPeriod] = useState<'today' | '7days' | 'month' | 'all'>('month');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // Filter Sales based on period
  const filteredSales = sales.filter((s) => {
    if (s.status === 'anulada') return false;
    const saleDate = s.date.split('T')[0];
    if (period === 'today') return saleDate === todayStr;
    if (period === '7days') return saleDate >= sevenDaysAgo;
    if (period === 'month') return saleDate.startsWith(currentMonthStr);
    return true;
  });

  // Filter Expenses based on period
  const filteredExpenses = expenses.filter((e) => {
    const expDate = e.date.split('T')[0];
    if (period === 'today') return expDate === todayStr;
    if (period === '7days') return expDate >= sevenDaysAgo;
    if (period === 'month') return expDate.startsWith(currentMonthStr);
    return true;
  });

  // 1. Metrics for Ventas
  const totalVentasQ = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalTicketsCount = filteredSales.length;
  const ticketPromedioQ = totalTicketsCount > 0 ? totalVentasQ / totalTicketsCount : 0;

  // Sales by payment method
  const salesByMethod: Record<string, { count: number; total: number }> = {
    efectivo: { count: 0, total: 0 },
    transferencia: { count: 0, total: 0 },
    tarjeta: { count: 0, total: 0 },
    credito: { count: 0, total: 0 },
  };
  filteredSales.forEach((s) => {
    if (salesByMethod[s.paymentMethod]) {
      salesByMethod[s.paymentMethod].count += 1;
      salesByMethod[s.paymentMethod].total += s.total;
    }
  });

  // Sales by product ranking
  const productPerformanceMap: Record<
    string,
    { name: string; qty: number; totalQ: number; costQ: number }
  > = {};
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productPerformanceMap[item.productId]) {
        productPerformanceMap[item.productId] = {
          name: item.productName,
          qty: 0,
          totalQ: 0,
          costQ: 0,
        };
      }
      productPerformanceMap[item.productId].qty += item.quantity;
      productPerformanceMap[item.productId].totalQ += item.subtotal;
      productPerformanceMap[item.productId].costQ += item.costPrice * item.quantity;
    });
  });
  const rankedProducts = Object.values(productPerformanceMap).sort(
    (a, b) => b.totalQ - a.totalQ
  );

  // 2. Metrics for Gastos
  const totalGastosQ = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const expensesByCategory: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });
  const rankedExpenseCategories = Object.entries(expensesByCategory).sort(
    (a, b) => b[1] - a[1]
  );

  // 3. Metrics for Ganancias (P&L)
  const totalCostOfGoodsSoldQ = filteredSales.reduce((acc, sale) => {
    const saleCost = sale.items.reduce(
      (itemAcc, item) => itemAcc + item.costPrice * item.quantity,
      0
    );
    return acc + saleCost;
  }, 0);

  const grossProfitQ = totalVentasQ - totalCostOfGoodsSoldQ;
  const grossMarginPercent = totalVentasQ > 0 ? (grossProfitQ / totalVentasQ) * 100 : 0;
  const netProfitQ = grossProfitQ - totalGastosQ;
  const netMarginPercent = totalVentasQ > 0 ? (netProfitQ / totalVentasQ) * 100 : 0;

  // 4. Metrics for Inventario
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.salePrice * p.stock, 0);
  const projectedProfit = totalRetailValuation - totalCostValuation;

  // Export handlers
  const handleExportVentas = () => {
    const headers = ['Producto', 'Unidades Vendidas', 'Ingreso Total (Q)', 'Costo Total (Q)', 'Ganancia Bruta (Q)'];
    const rows = rankedProducts.map((p) => [
      p.name,
      p.qty,
      p.totalQ.toFixed(2),
      p.costQ.toFixed(2),
      (p.totalQ - p.costQ).toFixed(2),
    ]);
    exportToCsv(`Reporte_Ventas_${period}`, headers, rows);
  };

  const handleExportGastos = () => {
    const headers = ['Categoría de Gasto', 'Monto Acumulado (Q)', '% del Total'];
    const rows = rankedExpenseCategories.map(([cat, amount]) => [
      cat,
      amount.toFixed(2),
      totalGastosQ > 0 ? `${((amount / totalGastosQ) * 100).toFixed(1)}%` : '0%',
    ]);
    exportToCsv(`Reporte_Gastos_${period}`, headers, rows);
  };

  const handleExportGanancias = () => {
    const headers = ['Concepto Contable', 'Monto en Quetzales (Q)', '% sobre Ventas'];
    const rows = [
      ['Ingresos Totales por Ventas', totalVentasQ.toFixed(2), '100%'],
      ['(-) Costo de Mercancía Vendida', totalCostOfGoodsSoldQ.toFixed(2), `${((totalCostOfGoodsSoldQ / (totalVentasQ || 1)) * 100).toFixed(1)}%`],
      ['(=) Utilidad Bruta', grossProfitQ.toFixed(2), `${grossMarginPercent.toFixed(1)}%`],
      ['(-) Gastos de Operación y Administración', totalGastosQ.toFixed(2), `${((totalGastosQ / (totalVentasQ || 1)) * 100).toFixed(1)}%`],
      ['(=) UTILIDAD NETA DEL PERÍODO', netProfitQ.toFixed(2), `${netMarginPercent.toFixed(1)}%`],
    ];
    exportToCsv(`Estado_Resultados_Ganancias_${period}`, headers, rows);
  };

  const handleExportInventario = () => {
    const headers = ['Código', 'Producto', 'Categoría', 'Stock', 'Costo Unitario (Q)', 'Costo Total (Q)', 'Precio Venta (Q)', 'Valor Venta Total (Q)', 'Ganancia Potencial (Q)'];
    const rows = products.map((p) => [
      p.code,
      p.name,
      p.category,
      p.stock,
      p.costPrice.toFixed(2),
      (p.costPrice * p.stock).toFixed(2),
      p.salePrice.toFixed(2),
      (p.salePrice * p.stock).toFixed(2),
      ((p.salePrice - p.costPrice) * p.stock).toFixed(2),
    ]);
    exportToCsv('Reporte_Valorizacion_Inventario', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Reportes & Inteligencia de Negocio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Análisis financiero, rentabilidad, rotación de productos y balance comercial
          </p>
        </div>

        {/* Period Selector (Functional Segmented Control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              period === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              period === '7days'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Días
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              period === 'month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              period === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* Sub-Reports Tabs matching user spec */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveReport('ventas')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeReport === 'ventas'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Reporte de Ventas</span>
        </button>

        <button
          onClick={() => setActiveReport('gastos')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeReport === 'gastos'
              ? 'border-rose-600 text-rose-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Reporte de Gastos</span>
        </button>

        <button
          onClick={() => setActiveReport('ganancias')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeReport === 'ganancias'
              ? 'border-indigo-600 text-indigo-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Reporte de Ganancias (Utilidades)</span>
        </button>

        <button
          onClick={() => setActiveReport('inventario')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeReport === 'inventario'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Reporte de Inventario</span>
        </button>
      </div>

      {/* 1. REPORTE DE VENTAS */}
      {activeReport === 'ventas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Facturado
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
                {formatCurrency(totalVentasQ)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Período seleccionado</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tickets Emitidos
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
                {totalTicketsCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Transacciones válidas</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ticket Promedio
              </span>
              <div className="text-2xl font-bold text-emerald-700 font-mono-numbers mt-1">
                {formatCurrency(ticketPromedioQ)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Gasto medio por cliente</p>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Ventas por Método de Pago
              </h2>
              <span className="text-xs text-slate-500">Distribución de cobros</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {Object.entries(salesByMethod).map(([method, data]) => {
                const percent = totalVentasQ > 0 ? (data.total / totalVentasQ) * 100 : 0;
                return (
                  <div key={method} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 capitalize">
                      {method}
                    </span>
                    <div className="text-lg font-bold text-slate-900 font-mono-numbers mt-1">
                      {formatCurrency(data.total)}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{data.count} ventas</span>
                      <span className="font-bold text-slate-700">{percent.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Sales Ranking Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Desglose de Ventas por Producto
                </h2>
                <p className="text-xs text-slate-500">Ranking por facturación y unidades</p>
              </div>
              <button
                onClick={handleExportVentas}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-right">Uds Vendidas</th>
                    <th className="py-2.5 px-3 text-right">Ingreso Total (Q)</th>
                    <th className="py-2.5 px-3 text-right">Costo Mercancía (Q)</th>
                    <th className="py-2.5 px-3 text-right">Utilidad Bruta (Q)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers">{p.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-slate-900">
                        {formatCurrency(p.totalQ)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-500">
                        {formatCurrency(p.costQ)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-emerald-700">
                        {formatCurrency(p.totalQ - p.costQ)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORTE DE GASTOS */}
      {activeReport === 'gastos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Gastos en el Período
              </span>
              <div className="text-2xl font-bold text-rose-600 font-mono-numbers mt-1">
                {formatCurrency(totalGastosQ)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {filteredExpenses.length} egresos contabilizados
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Categoría Principal de Gasto
              </span>
              <div className="text-base font-bold text-slate-900 mt-1 truncate">
                {rankedExpenseCategories[0]?.[0] || 'Sin registros'}
              </div>
              <p className="text-xs text-rose-600 font-mono-numbers font-bold mt-1">
                {rankedExpenseCategories[0]?.[1]
                  ? formatCurrency(rankedExpenseCategories[0][1])
                  : 'Q 0.00'}
              </p>
            </div>
          </div>

          {/* Categories breakdown bar list */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Distribución de Gastos por Categoría
                </h2>
                <p className="text-xs text-slate-500">Porcentaje sobre egresos operativos</p>
              </div>
              <button
                onClick={handleExportGastos}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>

            <div className="space-y-3">
              {rankedExpenseCategories.map(([cat, amount], idx) => {
                const percent = totalGastosQ > 0 ? (amount / totalGastosQ) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px]">{percent.toFixed(1)}%</span>
                        <span className="font-mono-numbers font-bold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. REPORTE DE GANANCIAS (ESTADO DE RESULTADOS) */}
      {activeReport === 'ganancias' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Utilidad Bruta
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
                {formatCurrency(grossProfitQ)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
                Margen Bruto: {grossMarginPercent.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gastos de Operación
              </span>
              <div className="text-2xl font-bold text-rose-600 font-mono-numbers mt-1">
                {formatCurrency(totalGastosQ)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Deducciones generales</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                UTILIDAD NETA (GANANCIA REAL)
              </span>
              <div
                className={`text-2xl font-bold font-mono-numbers mt-1 ${
                  netProfitQ >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatCurrency(netProfitQ)}
              </div>
              <p className="text-[11px] font-bold text-slate-700 mt-1 font-mono-numbers">
                Margen Neto: {netMarginPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Formal Income Statement Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Estado de Resultados Financiero (P&L)
                </h2>
                <p className="text-xs text-slate-500">
                  Cálculo contable transparente de ingresos, costo de ventas y utilidades
                </p>
              </div>
              <button
                onClick={handleExportGanancias}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar P&L</span>
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 text-slate-900">
                <span className="font-bold font-sans">1. Ingresos Brutos por Ventas</span>
                <span className="font-bold tabular-nums">{formatCurrency(totalVentasQ)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                <span className="pl-4 font-sans">(-) Costo de Mercancía Vendida (Costo Proveedores)</span>
                <span className="tabular-nums">- {formatCurrency(totalCostOfGoodsSoldQ)}</span>
              </div>

              <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-lg text-slate-900 font-bold">
                <span className="font-sans">(=) UTILIDAD BRUTA (Margen: {grossMarginPercent.toFixed(1)}%)</span>
                <span className="tabular-nums">{formatCurrency(grossProfitQ)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-700">
                <span className="pl-4 font-sans">(-) Gastos Operativos y Administrativos</span>
                <span className="tabular-nums">- {formatCurrency(totalGastosQ)}</span>
              </div>

              <div
                className={`flex justify-between py-3 px-4 rounded-xl font-bold text-sm ${
                  netProfitQ >= 0
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                <span className="font-sans">
                  (=) GANANCIA NETA DEL NEGOCIO (Margen: {netMarginPercent.toFixed(1)}%)
                </span>
                <span className="tabular-nums text-base">{formatCurrency(netProfitQ)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. REPORTE DE INVENTARIO */}
      {activeReport === 'inventario' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Unidades Físicas
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
                {totalUnits}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">En bodega y mostrador</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Valor a Costo (Inversión)
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers mt-1">
                {formatCurrency(totalCostValuation)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Capital invertido en stock</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Valor Comercial en Venta
              </span>
              <div className="text-2xl font-bold text-emerald-700 font-mono-numbers mt-1">
                {formatCurrency(totalRetailValuation)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Ingreso potencial bruto</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ganancia Proyectada
              </span>
              <div className="text-2xl font-bold text-indigo-700 font-mono-numbers mt-1">
                {formatCurrency(projectedProfit)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Margen total por vender</p>
            </div>
          </div>

          {/* Inventory Valuation Details Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Valorización Detallada por Producto
                </h2>
                <p className="text-xs text-slate-500">Capital inmovilizado y retorno esperado</p>
              </div>
              <button
                onClick={handleExportInventario}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                    <th className="py-2.5 px-3 text-right">Costo Unit. (Q)</th>
                    <th className="py-2.5 px-3 text-right">Inversión Total (Q)</th>
                    <th className="py-2.5 px-3 text-right">Precio Venta (Q)</th>
                    <th className="py-2.5 px-3 text-right">Valor Venta (Q)</th>
                    <th className="py-2.5 px-3 text-right">Ganancia Proy. (Q)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const costVal = p.costPrice * p.stock;
                    const retailVal = p.salePrice * p.stock;
                    const profitVal = retailVal - costVal;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {p.code}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">{p.category}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono-numbers font-bold">
                          {p.stock} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-600">
                          {formatCurrency(p.costPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers font-semibold text-slate-900">
                          {formatCurrency(costVal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-600">
                          {formatCurrency(p.salePrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-slate-900">
                          {formatCurrency(retailVal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-emerald-700">
                          {formatCurrency(profitVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
