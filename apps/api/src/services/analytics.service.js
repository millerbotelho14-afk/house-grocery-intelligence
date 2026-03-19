import {
  getProductSnapshot,
  listEditableItems as listEditableItemsFromRepository,
  listPriceHistory,
  listProducts as listProductsFromRepository,
  listPurchases as listPurchasesFromRepository,
  updatePurchaseItem
} from "./repository.service.js";
import { fuzzyScore } from "./search.service.js";

export async function getPurchases(userId) {
  return listPurchasesFromRepository(userId);
}

export async function getProducts(userId, query = "") {
  const products = await listProductsFromRepository(userId);
  const purchases = await listPurchasesFromRepository(userId);
  const allItems = purchases.flatMap((purchase) => purchase.items || []);

  return products
    .map((product) => {
      const matchingItems = allItems.filter(
        (item) =>
          item.productId === product.id ||
          item.normalizedProductName?.toLowerCase() === product.normalizedName.toLowerCase()
      );
      return {
        ...product,
        matches: matchingItems.length,
        score: fuzzyScore(query, product.normalizedName)
      };
    })
    .filter((product) => product.score > 0)
    .sort((a, b) => b.score - a.score || b.matches - a.matches);
}

export async function getProductById(userId, productId) {
  const snapshot = await getProductSnapshot(productId, userId);
  const product = snapshot.product;
  if (!product) return null;

  const history = snapshot.history
    .map((entry) => ({
      ...entry,
      store: entry.store || { name: entry.storeName }
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const purchases = snapshot.purchases
    .map((item) => ({
      ...item,
      purchase: item.purchase || { purchaseDate: item.purchaseDate },
      store: item.store || { name: item.storeName }
    }))
    .sort((a, b) => b.purchase.purchaseDate.localeCompare(a.purchase.purchaseDate));

  const variation =
    history.length > 1
      ? Number(
          ((((history.at(-1)?.price || 0) - history[0].price) / history[0].price) * 100).toFixed(1)
        )
      : 0;

  return {
    product,
    history,
    purchases,
    priceVariationPercent: variation
  };
}

export async function getPriceLookup(userId, query = "") {
  const product = (await getProducts(userId, query))[0];
  if (!product) return null;

  const history = (await listPriceHistory(userId))
    .filter((entry) => entry.productId === product.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!history.length) {
    return null;
  }

  const prices = history.map((entry) => entry.price);
  const last = history.at(-1);

  return {
    productId: product.id,
    productName: product.normalizedName,
    lastPrice: last?.price || 0,
    lowestPrice: Math.min(...prices),
    highestPrice: Math.max(...prices),
    averagePrice: Number((prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2)),
    lastStore: last?.storeName || "",
    lastPurchaseDate: last?.date || ""
  };
}

export async function getDashboard(userId) {
  const purchases = await listPurchasesFromRepository(userId);
  const products = await listProductsFromRepository(userId);
  const priceHistory = await listPriceHistory(userId);
  const monthlyMap = new Map();
  const categoryMap = new Map();
  const quantityMap = new Map();
  const expensiveMap = new Map();

  purchases.forEach((purchase) => {
    const month = purchase.purchaseDate.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + purchase.totalValue);
  });

  purchases.flatMap((purchase) => purchase.items || []).forEach((item) => {
    const product = products.find(
      (entry) =>
        entry.id === item.productId ||
        entry.normalizedName.toLowerCase() === item.normalizedProductName?.toLowerCase()
    );
    if (!product) return;

    categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + item.totalPrice);
    quantityMap.set(product.normalizedName, (quantityMap.get(product.normalizedName) || 0) + item.quantity);

    const current = expensiveMap.get(product.normalizedName) || [];
    expensiveMap.set(product.normalizedName, [...current, item.totalPrice / Math.max(item.quantity, 1)]);
  });

  const topPurchasedProducts = [...quantityMap.entries()]
    .map(([product, quantity]) => ({ product, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const mostExpensiveProducts = [...expensiveMap.entries()]
    .map(([product, prices]) => ({
      product,
      averagePrice: Number((prices.reduce((sum, value) => sum + value, 0) / prices.length).toFixed(2))
    }))
    .sort((a, b) => b.averagePrice - a.averagePrice)
    .slice(0, 5);

  return {
    monthlySpending: [...monthlyMap.entries()].map(([month, total]) => ({
      month,
      total: Number(total.toFixed(2))
    })),
    spendingByCategory: [...categoryMap.entries()].map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2))
    })),
    topPurchasedProducts,
    mostExpensiveProducts,
    insights: {
      biggestPriceIncrease: getBiggestPriceIncrease(products, priceHistory),
      mostFrequentProducts: getMostFrequentProducts(purchases),
      cheapestStores: getCheapestStores(priceHistory)
    }
  };
}

export async function getEditableItems(userId) {
  return listEditableItemsFromRepository(userId);
}

export async function updateEditableItem(userId, itemId, payload) {
  return updatePurchaseItem(userId, itemId, payload);
}

function getBiggestPriceIncrease(products, priceHistory) {
  return products
    .map((product) => {
      const history = priceHistory
        .filter((entry) => entry.productId === product.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (history.length < 2) return null;
      const variationPercent = Number(
        ((((history.at(-1).price - history[0].price) / history[0].price) * 100).toFixed(1))
      );
      return { product: product.normalizedName, variationPercent };
    })
    .filter(Boolean)
    .sort((a, b) => b.variationPercent - a.variationPercent)
    .slice(0, 3);
}

function getMostFrequentProducts(purchases) {
  const frequency = new Map();
  purchases.flatMap((purchase) => purchase.items || []).forEach((item) => {
    const key = item.normalizedProductName || item.productId;
    frequency.set(key, (frequency.get(key) || 0) + 1);
  });

  return [...frequency.entries()]
    .map(([product, purchasesCount]) => ({ product, purchases: purchasesCount }))
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 3);
}

function getCheapestStores(priceHistory) {
  const storeBuckets = new Map();

  priceHistory.forEach((entry) => {
    const current = storeBuckets.get(entry.storeId) || {
      store: entry.storeName || entry.storeId,
      prices: []
    };
    current.prices.push(entry.price);
    storeBuckets.set(entry.storeId, current);
  });

  return [...storeBuckets.values()]
    .map((entry) => ({
      store: entry.store,
      averagePrice: Number(
        (entry.prices.reduce((sum, value) => sum + value, 0) / entry.prices.length).toFixed(2)
      )
    }))
    .sort((a, b) => a.averagePrice - b.averagePrice)
    .slice(0, 3);
}
