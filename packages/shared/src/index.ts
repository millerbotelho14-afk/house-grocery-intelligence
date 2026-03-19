export type ReceiptInputType = "pdf" | "image" | "xml" | "nfce_link";

export interface Store {
  id: string;
  name: string;
  location: string;
}

export interface Product {
  id: string;
  normalizedName: string;
  category: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  originalName: string;
  normalizedProductName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Purchase {
  id: string;
  userId: string;
  storeId: string;
  purchaseDate: string;
  totalValue: number;
  itemsCount: number;
}

export interface PricePoint {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  date: string;
}

export interface UploadReceiptRequest {
  type: ReceiptInputType;
  source: string;
}

export interface ParsedReceiptItem {
  originalName: string;
  normalizedProductName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface ParsedReceipt {
  storeName: string;
  storeLocation: string;
  purchaseDate: string;
  totalValue: number;
  items: ParsedReceiptItem[];
}

export interface PriceLookupResponse {
  productId: string;
  productName: string;
  lastPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  lastStore: string;
  lastPurchaseDate: string;
}

export interface DashboardResponse {
  monthlySpending: Array<{ month: string; total: number }>;
  spendingByCategory: Array<{ category: string; total: number }>;
  topPurchasedProducts: Array<{ product: string; quantity: number }>;
  mostExpensiveProducts: Array<{ product: string; averagePrice: number }>;
  insights: {
    biggestPriceIncrease: Array<{ product: string; variationPercent: number }>;
    mostFrequentProducts: Array<{ product: string; purchases: number }>;
    cheapestStores: Array<{ store: string; averagePrice: number }>;
  };
}
