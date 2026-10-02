import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Product,
  Sale,
  Expense,
  Customer,
  Supplier,
  BusinessProfile,
  SaleItem,
  PaymentMethod,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_BUSINESS_PROFILE,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
} from '../data/mockData';
import { generateId } from '../utils/formatters';

interface DataContextType {
  currentUser: User | null;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => void;
  
  businessProfile: BusinessProfile;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, quantityDiff: number, notes?: string) => void;

  sales: Sale[];
  createSale: (saleData: {
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
    notes?: string;
  }) => Sale;
  cancelSale: (saleId: string, reason?: string) => boolean;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'expenseNumber' | 'recordedBy'>) => Expense;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchasesCount' | 'totalSpent'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  payCustomerCredit: (customerId: string, amount: number) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  resetToDemoData: () => void;

  // Real-time computed alerts
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  customersWithDebt: Customer[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'emprendegt_user',
  BUSINESS: 'emprendegt_business',
  PRODUCTS: 'emprendegt_products',
  SALES: 'emprendegt_sales',
  EXPENSES: 'emprendegt_expenses',
  CUSTOMERS: 'emprendegt_customers',
  SUPPLIERS: 'emprendegt_suppliers',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_PROFILE;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed: Product[] = JSON.parse(saved);
      // Ensure products have images and categories updated from INITIAL_PRODUCTS
      return parsed.map((p) => {
        const initial = INITIAL_PRODUCTS.find((init) => init.id === p.id);
        if (p.id === 'prod_5' && initial) {
          return { ...initial };
        }
        let updatedCategory = p.category as any;
        if (updatedCategory === 'Bebidas y Licores' || updatedCategory === 'Licores') {
          updatedCategory = 'Agua Pura';
        }
        if (initial) {
          return {
            ...p,
            category: updatedCategory,
            imageUrl: initial.imageUrl || p.imageUrl,
          };
        }
        return { ...p, category: updatedCategory };
      });
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!saved) return INITIAL_SALES;
    try {
      const parsed: Sale[] = JSON.parse(saved);
      return parsed.map((s) => ({
        ...s,
        items: s.items.map((it) => {
          if (it.productId === 'prod_5' || it.productName.toLowerCase().includes('cerveza')) {
            return {
              ...it,
              productName: 'Agua Pura Salvavidas Botella 600ml',
              code: 'AG-001',
              unitPrice: 5.00,
              costPrice: 2.50,
            };
          }
          return it;
        }),
      }));
    } catch {
      return INITIAL_SALES;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (!saved) return INITIAL_SUPPLIERS;
    try {
      const parsed: Supplier[] = JSON.parse(saved);
      return parsed.map((sup) => {
        if (sup.id === 'sup_2') {
          return {
            ...sup,
            companyName: 'Embotelladora y Distribuidora Salvavidas, S.A.',
            category: 'Agua Pura y Envasados',
          };
        }
        return sup;
      });
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(businessProfile));
  }, [businessProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  // Auth methods
  const login = (email: string, role: UserRole = 'admin') => {
    const roleNames: Record<UserRole, string> = {
      admin: 'Carlos Morales (Administrador)',
      cajero: 'Luisa Fernanda (Cajera)',
      contador: 'Lic. Rodrigo Paz (Contador)',
    };
    const newUser: User = {
      id: generateId('usr'),
      name: roleNames[role] || 'Usuario EMPRENDEGT',
      email: email || `${role}@emprendegt.com`,
      role,
      businessName: businessProfile.name,
      phone: '+502 4589-1122',
    };
    setCurrentUser(newUser);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const quickSwitchRole = (role: UserRole) => {
    if (!currentUser) {
      login(`${role}@emprendegt.com`, role);
      return;
    }
    const roleNames: Record<UserRole, string> = {
      admin: 'Carlos Morales (Administrador)',
      cajero: 'Luisa Fernanda (Cajera)',
      contador: 'Lic. Rodrigo Paz (Contador)',
    };
    setCurrentUser({
      ...currentUser,
      role,
      name: roleNames[role] || currentUser.name,
    });
  };

  const updateBusinessProfile = (profile: Partial<BusinessProfile>) => {
    setBusinessProfile((prev) => ({ ...prev, ...profile }));
  };

  // Products
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: generateId('prod'),
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updatedData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updatedData,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (id: string, quantityDiff: number, _notes?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + quantityDiff);
          return {
            ...p,
            stock: newStock,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // Sales
  const createSale = (saleData: {
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
    notes?: string;
  }): Sale => {
    const saleCount = sales.length + 1;
    const padded = String(saleCount).padStart(5, '0');
    const receiptNumber = `FAC-2026-${padded}`;
    const newSale: Sale = {
      id: generateId('sale'),
      receiptNumber,
      date: new Date().toISOString(),
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      amountPaid: saleData.amountPaid,
      change: saleData.change,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      customerNit: saleData.customerNit,
      cashierName: currentUser ? currentUser.name : 'Cajero Principal',
      notes: saleData.notes,
      status: 'completada',
    };

    // 1. Deduct stock for each sold product
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = saleData.items.find((item) => item.productId === prod.id);
        if (soldItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - soldItem.quantity),
            updatedAt: new Date().toISOString(),
          };
        }
        return prod;
      })
    );

    // 2. Update customer statistics and credit debt if paymentMethod is 'credito'
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === saleData.customerId) {
          const isCredit = saleData.paymentMethod === 'credito';
          return {
            ...c,
            totalPurchasesCount: c.totalPurchasesCount + 1,
            totalSpent: c.totalSpent + saleData.total,
            balanceOwed: isCredit ? c.balanceOwed + saleData.total : c.balanceOwed,
          };
        }
        return c;
      })
    );

    // 3. Save sale
    setSales((prev) => [newSale, ...prev]);

    return newSale;
  };

  const cancelSale = (saleId: string, reason = 'Anulación solicitada por el usuario'): boolean => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale || targetSale.status === 'anulada') {
      return false;
    }

    // 1. Restore products stock
    setProducts((prev) =>
      prev.map((prod) => {
        const itemInSale = targetSale.items.find((it) => it.productId === prod.id);
        if (itemInSale) {
          return {
            ...prod,
            stock: prod.stock + itemInSale.quantity,
            updatedAt: new Date().toISOString(),
          };
        }
        return prod;
      })
    );

    // 2. Adjust customer debt if it was credit
    if (targetSale.paymentMethod === 'credito') {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === targetSale.customerId) {
            return {
              ...c,
              balanceOwed: Math.max(0, c.balanceOwed - targetSale.total),
              totalSpent: Math.max(0, c.totalSpent - targetSale.total),
            };
          }
          return c;
        })
      );
    }

    // 3. Mark sale as anulada
    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: 'anulada',
              anulledAt: new Date().toISOString(),
              anulledReason: reason,
            }
          : s
      )
    );

    return true;
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'recordedBy'>): Expense => {
    const expenseCount = expenses.length + 1;
    const padded = String(expenseCount).padStart(5, '0');
    const expenseNumber = `GST-2026-${padded}`;
    const newExpense: Expense = {
      ...expenseData,
      id: generateId('exp'),
      expenseNumber,
      recordedBy: currentUser ? currentUser.name : 'Administrador',
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Customers
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalPurchasesCount' | 'totalSpent'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: generateId('cust'),
      totalPurchasesCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const payCustomerCredit = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.balanceOwed - amount);
          return { ...c, balanceOwed: newDebt };
        }
        return c;
      })
    );
  };

  // Suppliers
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: generateId('sup'),
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setCurrentUser(INITIAL_USER);
    setBusinessProfile(INITIAL_BUSINESS_PROFILE);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
  };

  // Alerts
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockProducts = products.filter((p) => p.stock === 0);
  const customersWithDebt = customers.filter((c) => c.balanceOwed > 0);

  return (
    <DataContext.Provider
      value={{
        currentUser,
        login,
        logout,
        quickSwitchRole,
        businessProfile,
        updateBusinessProfile,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        sales,
        createSale,
        cancelSale,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        payCustomerCredit,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        resetToDemoData,
        lowStockProducts,
        outOfStockProducts,
        customersWithDebt,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
