export const fallbackDashboard = {
  monthlySpending: [
    { month: "2026-01", total: 238.5 },
    { month: "2026-02", total: 181.9 },
    { month: "2026-03", total: 264.3 }
  ],
  spendingByCategory: [
    { category: "Laticinios", total: 92.42 },
    { category: "Mercearia", total: 187.26 },
    { category: "Carnes", total: 51.0 }
  ],
  topPurchasedProducts: [
    { product: "Leite Italac 1L", quantity: 18 },
    { product: "Feijao Carioca 1kg", quantity: 2 },
    { product: "Patinho Bovino kg", quantity: 1.2 }
  ],
  mostExpensiveProducts: [
    { product: "Azeite de Oliva 500ml", averagePrice: 46.93 },
    { product: "Patinho Bovino kg", averagePrice: 42.5 },
    { product: "Arroz Tipo 1 5kg", averagePrice: 28.5 }
  ],
  insights: {
    biggestPriceIncrease: [
      { product: "Azeite de Oliva 500ml", variationPercent: 37.6 },
      { product: "Leite Italac 1L", variationPercent: 6.1 }
    ],
    mostFrequentProducts: [
      { product: "Leite Italac 1L", purchases: 3 },
      { product: "Azeite de Oliva 500ml", purchases: 3 }
    ],
    cheapestStores: [
      { store: "Pao de Acucar", averagePrice: 24.64 },
      { store: "Assai Atacadista", averagePrice: 25.69 },
      { store: "Sam's Club", averagePrice: 29.1 }
    ]
  }
};

export const fallbackLookup = {
  productId: "prod-4",
  productName: "Azeite de Oliva 500ml",
  lastPrice: 54.9,
  lowestPrice: 39.9,
  highestPrice: 54.9,
  averagePrice: 46.93,
  lastStore: "Pao de Acucar",
  lastPurchaseDate: "2026-03-10"
};

export const fallbackProducts = [
  { id: "prod-1", normalizedName: "Leite Italac 1L", category: "Laticinios", matches: 3 },
  { id: "prod-4", normalizedName: "Azeite de Oliva 500ml", category: "Mercearia", matches: 3 },
  { id: "prod-2", normalizedName: "Arroz Tipo 1 5kg", category: "Mercearia", matches: 1 }
];

export const fallbackProduct = {
  product: { id: "prod-1", normalizedName: "Leite Italac 1L", category: "Laticinios" },
  history: [
    { id: "ph-1", productId: "prod-1", storeId: "store-1", price: 4.89, date: "2026-01-14", store: { name: "Sam's Club" } },
    { id: "ph-2", productId: "prod-1", storeId: "store-2", price: 5.39, date: "2026-02-09", store: { name: "Assai Atacadista" } },
    { id: "ph-3", productId: "prod-1", storeId: "store-3", price: 5.19, date: "2026-03-10", store: { name: "Pao de Acucar" } }
  ],
  purchases: [
    {
      id: "item-1",
      originalName: "LEITE ITALAC TP",
      quantity: 6,
      unitPrice: 4.89,
      totalPrice: 29.34,
      purchase: { purchaseDate: "2026-01-14" },
      store: { name: "Sam's Club" }
    }
  ],
  priceVariationPercent: 6.1
};

export const fallbackPurchases = [
  {
    id: "purchase-3",
    purchaseDate: "2026-03-10",
    totalValue: 264.3,
    itemsCount: 5,
    store: { name: "Pao de Acucar", location: "Sao Paulo - SP" },
    items: [
      { id: "item-3", normalizedProductName: "Leite Italac 1L", quantity: 8, totalPrice: 41.52 },
      { id: "item-7", normalizedProductName: "Arroz Tipo 1 5kg", quantity: 1, totalPrice: 28.5 }
    ]
  }
];
