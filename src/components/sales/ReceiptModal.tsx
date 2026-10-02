import React from 'react';
import { Sale } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { businessProfile } = useData();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  // 12% Guatemalan IVA calculation
  const totalAmount = sale.total;
  const subtotalSinIva = totalAmount / (1 + businessProfile.taxRate);
  const montoIva = totalAmount - subtotalSinIva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions (no-print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">Comprobante de Venta · FEL</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 bg-white text-slate-900 font-mono text-xs selection:bg-slate-200">
          
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-base font-bold font-sans tracking-tight text-slate-900">
              {businessProfile.name}
            </h2>
            <p className="text-[11px] text-slate-600 font-sans mt-0.5">
              {businessProfile.legalName}
            </p>
            <p className="text-[11px] font-bold mt-1">
              NIT: {businessProfile.nit}
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              {businessProfile.address}
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              Tel: {businessProfile.phone}
            </p>
            <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider text-slate-700">
              DOCUMENTO TRIBUTARIO ELECTRÓNICO
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Factura:</span>
              <span className="font-bold">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha y Hora:</span>
              <span>{formatDateTime(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Atendido por:</span>
              <span className="font-sans">{sale.cashierName}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-sans font-bold">{sale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NIT/DPI:</span>
              <span className="font-bold">{sale.customerNit}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="grid grid-cols-12 text-[10px] text-slate-500 font-bold uppercase pb-1 mb-1 border-b border-slate-200">
              <span className="col-span-2">Cant</span>
              <span className="col-span-6">Descripción</span>
              <span className="col-span-4 text-right">Total (Q)</span>
            </div>

            <div className="space-y-1.5 py-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] items-start">
                  <span className="col-span-2 font-bold">{item.quantity}x</span>
                  <span className="col-span-6 font-sans leading-tight">
                    {item.productName}
                    <span className="block text-[10px] text-slate-500 font-mono">
                      @{formatCurrency(item.unitPrice)}
                    </span>
                  </span>
                  <span className="col-span-4 text-right font-bold tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Calculation */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="tabular-nums">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Descuento:</span>
                <span className="tabular-nums">- {formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL A PAGAR:</span>
              <span className="tabular-nums">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Payment Method & Change */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Método de Pago:</span>
              <span className="capitalize font-bold">{sale.paymentMethod}</span>
            </div>
            {sale.paymentMethod === 'efectivo' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Efectivo Recibido:</span>
                  <span className="tabular-nums">{formatCurrency(sale.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Cambio Entregado:</span>
                  <span className="tabular-nums">{formatCurrency(sale.change)}</span>
                </div>
              </>
            )}
            {sale.paymentMethod === 'credito' && (
              <div className="p-1.5 bg-amber-50 rounded text-amber-800 text-[10px] font-sans">
                Venta cargada a la cuenta de crédito del cliente.
              </div>
            )}
          </div>

          {/* Tax Information SAT Guatemala */}
          <div className="py-2 border-b border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
            <div className="flex justify-between">
              <span>Monto Afecto (Sin IVA):</span>
              <span className="tabular-nums">{formatCurrency(subtotalSinIva)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>IVA Incluido (12% SAT):</span>
              <span className="tabular-nums">{formatCurrency(montoIva)}</span>
            </div>
          </div>

          {/* Footer Greetings */}
          <div className="pt-4 text-center space-y-1 text-[10px] text-slate-500 font-sans">
            <p className="font-semibold text-slate-700">
              {businessProfile.receiptGreeting}
            </p>
            <p className="leading-tight text-[9px]">
              {businessProfile.receiptFooter}
            </p>
            <div className="pt-2 flex items-center justify-center gap-1 text-[9px] text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certificador SAT Demo · DTE GT</span>
            </div>
          </div>

        </div>

        {/* Bottom Close Button (no-print) */}
        <div className="no-print p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
