const stores = [
  { id: "store-1", name: "Sam's Club", location: "Sao Paulo - SP" },
  { id: "store-2", name: "Assai Atacadista", location: "Sao Paulo - SP" },
  { id: "store-3", name: "Pao de Acucar", location: "Sao Paulo - SP" }
];

const products = [
  { id: "prod-1", normalizedName: "Leite Italac 1L", category: "Laticinios" },
  { id: "prod-2", normalizedName: "Arroz Tipo 1 5kg", category: "Mercearia" },
  { id: "prod-3", normalizedName: "Feijao Carioca 1kg", category: "Mercearia" },
  { id: "prod-4", normalizedName: "Azeite de Oliva 500ml", category: "Mercearia" },
  { id: "prod-5", normalizedName: "Patinho Bovino kg", category: "Carnes" }
];

const purchases = [
  {
    id: "purchase-1",
    userId: "user-1",
    storeId: "store-1",
    purchaseDate: "2026-01-14",
    totalValue: 238.5,
    itemsCount: 5
  },
  {
    id: "purchase-2",
    userId: "user-1",
    storeId: "store-2",
    purchaseDate: "2026-02-09",
    totalValue: 181.9,
    itemsCount: 4
  },
  {
    id: "purchase-3",
    userId: "user-1",
    storeId: "store-3",
    purchaseDate: "2026-03-10",
    totalValue: 264.3,
    itemsCount: 5
  }
];

const purchaseItems = [
  {
    id: "item-1",
    purchaseId: "purchase-1",
    productId: "prod-1",
    originalName: "LEITE ITALAC TP",
    normalizedProductName: "Leite Italac 1L",
    quantity: 6,
    unitPrice: 4.89,
    totalPrice: 29.34
  },
  {
    id: "item-2",
    purchaseId: "purchase-2",
    productId: "prod-1",
    originalName: "LEITE INTG ITALAC",
    normalizedProductName: "Leite Italac 1L",
    quantity: 4,
    unitPrice: 5.39,
    totalPrice: 21.56
  },
  {
    id: "item-3",
    purchaseId: "purchase-3",
    productId: "prod-1",
    originalName: "LEITE ITALAC 1L",
    normalizedProductName: "Leite Italac 1L",
    quantity: 8,
    unitPrice: 5.19,
    totalPrice: 41.52
  },
  {
    id: "item-4",
    purchaseId: "purchase-1",
    productId: "prod-4",
    originalName: "AZEITE OLIVA 500ML",
    normalizedProductName: "Azeite de Oliva 500ml",
    quantity: 1,
    unitPrice: 39.9,
    totalPrice: 39.9
  },
  {
    id: "item-5",
    purchaseId: "purchase-2",
    productId: "prod-4",
    originalName: "AZEITE DE OLIVA EXTRA VIRGEM",
    normalizedProductName: "Azeite de Oliva 500ml",
    quantity: 1,
    unitPrice: 45.98,
    totalPrice: 45.98
  },
  {
    id: "item-6",
    purchaseId: "purchase-3",
    productId: "prod-4",
    originalName: "AZEITE OLIVA GALO",
    normalizedProductName: "Azeite de Oliva 500ml",
    quantity: 1,
    unitPrice: 54.9,
    totalPrice: 54.9
  },
  {
    id: "item-7",
    purchaseId: "purchase-3",
    productId: "prod-2",
    originalName: "ARROZ T1 5KG",
    normalizedProductName: "Arroz Tipo 1 5kg",
    quantity: 1,
    unitPrice: 28.5,
    totalPrice: 28.5
  },
  {
    id: "item-8",
    purchaseId: "purchase-3",
    productId: "prod-3",
    originalName: "FEIJAO CARIOCA 1KG",
    normalizedProductName: "Feijao Carioca 1kg",
    quantity: 2,
    unitPrice: 8.99,
    totalPrice: 17.98
  },
  {
    id: "item-9",
    purchaseId: "purchase-1",
    productId: "prod-5",
    originalName: "PATINHO BOV KG",
    normalizedProductName: "Patinho Bovino kg",
    quantity: 1.2,
    unitPrice: 42.5,
    totalPrice: 51
  }
];

let priceHistory = [
  { id: "ph-1", productId: "prod-1", storeId: "store-1", price: 4.89, date: "2026-01-14" },
  { id: "ph-2", productId: "prod-1", storeId: "store-2", price: 5.39, date: "2026-02-09" },
  { id: "ph-3", productId: "prod-1", storeId: "store-3", price: 5.19, date: "2026-03-10" },
  { id: "ph-4", productId: "prod-4", storeId: "store-1", price: 39.9, date: "2026-01-14" },
  { id: "ph-5", productId: "prod-4", storeId: "store-2", price: 45.98, date: "2026-02-09" },
  { id: "ph-6", productId: "prod-4", storeId: "store-3", price: 54.9, date: "2026-03-10" },
  { id: "ph-7", productId: "prod-2", storeId: "store-3", price: 28.5, date: "2026-03-10" },
  { id: "ph-8", productId: "prod-3", storeId: "store-3", price: 8.99, date: "2026-03-10" },
  { id: "ph-9", productId: "prod-5", storeId: "store-1", price: 42.5, date: "2026-01-14" }
];

export const mockDatabase = {
  stores,
  products,
  purchases,
  purchaseItems,
  get priceHistory() {
    return priceHistory;
  },
  addParsedPurchase(parsedReceipt) {
    const storeId = `store-${stores.length + 1}`;
    const purchaseId = `purchase-${purchases.length + 1}`;
    const foundStore = stores.find(
      (store) => store.name.toLowerCase() === parsedReceipt.storeName.toLowerCase()
    );
    const store = foundStore || {
      id: storeId,
      name: parsedReceipt.storeName,
      location: parsedReceipt.storeLocation
    };

    if (!foundStore) {
      stores.push(store);
    }

    purchases.push({
      id: purchaseId,
      userId: "user-1",
      storeId: store.id,
      purchaseDate: parsedReceipt.purchaseDate,
      totalValue: parsedReceipt.totalValue,
      itemsCount: parsedReceipt.items.length
    });

    parsedReceipt.items.forEach((item, index) => {
      let product = products.find(
        (entry) =>
          entry.normalizedName.toLowerCase() === item.normalizedProductName.toLowerCase()
      );

      if (!product) {
        product = {
          id: `prod-${products.length + 1}`,
          normalizedName: item.normalizedProductName,
          category: item.category
        };
        products.push(product);
      }

      purchaseItems.push({
        id: `item-${purchaseItems.length + index + 1}`,
        purchaseId,
        productId: product.id,
        originalName: item.originalName,
        normalizedProductName: item.normalizedProductName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      });

      priceHistory = [
        ...priceHistory,
        {
          id: `ph-${priceHistory.length + index + 1}`,
          productId: product.id,
          storeId: store.id,
          price: item.unitPrice,
          date: parsedReceipt.purchaseDate
        }
      ];
    });

    return {
      purchaseId,
      store,
      itemsCount: parsedReceipt.items.length
    };
  }
};
