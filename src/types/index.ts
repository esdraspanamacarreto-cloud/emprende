export type UserRole = 'admin' | 'cajero' | 'contador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  businessName: string;
  phone: string;
}

export type ProductCategory = 
  | 'Abarrotes y Alimentos'
  | 'Agua Pura'
  | 'Cuidado Personal'
  | 'Limpieza del Hogar'
  | 'Snacks y Golosinas'
  | 'Lácteos y Huevos'
  | 'Ferretería y Herramientas'
  | 'Papelería y Oficina'
  | 'Otros';

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  category: ProductCategory;
  costPrice: number;    // Precio de costo en Quetzales (Q)
  salePrice: number;    // Precio de venta al público en Quetzales (Q)
  stock: number;        // Existencias actuales
  minStock: number;     // Alerta cuando stock <= minStock
  unit: string;         // 'Unidad', 'Libra', 'Litro', 'Caja', 'Docena', 'Paquete'
  supplierId?: string;  // Proveedor asociado
  supplierName?: string;
  imageUrl?: string;    // Foto del producto
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'credito';

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  customerId: string;
  customerName: string;
  customerNit: string;
  cashierName: string;
  notes?: string;
  status: 'completada' | 'anulada';
  anulledAt?: string;
  anulledReason?: string;
}

export type ExpenseCategory = 
  | 'Alquiler de Local'
  | 'Servicios Básicos (Luz/Agua/Internet)'
  | 'Sueldos y Salarios'
  | 'Proveedores y Mercadería'
  | 'Transporte y Combustible'
  | 'Marketing y Publicidad'
  | 'Mantenimiento y Reparaciones'
  | 'Impuestos y SAT'
  | 'Otros Gastos';

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;       // Quetzales
  paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  supplierOrBeneficiary: string;
  invoiceRef?: string;  // No. Factura / Comprobante
  notes?: string;
  recordedBy: string;
}

export interface Customer {
  id: string;
  name: string;
  nitOrDpi: string;     // 'CF' o NIT específico (ej. 4589234-1)
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  balanceOwed: number;  // Saldo pendiente
  totalPurchasesCount: number;
  totalSpent: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  nit: string;
  address: string;
  category: string;
  paymentTermsDays: number; // Ej. 15 días, 30 días, Contado (0)
  notes?: string;
  createdAt: string;
}

export interface BusinessProfile {
  name: string;
  legalName: string;
  nit: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  currency: string;      // 'GTQ'
  symbol: string;        // 'Q'
  taxRate: number;       // 0.12 (IVA Guatemala)
  receiptGreeting: string;
  receiptFooter: string;
}
