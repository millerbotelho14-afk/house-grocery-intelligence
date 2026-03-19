import {
  getDashboard,
  getEditableItems as getEditableItemsFromRepository,
  getPriceLookup,
  getProductById,
  getProducts,
  getPurchases,
  updateEditableItem as updateEditableItemFromRepository
} from "../services/analytics.service.js";

export async function listProducts(req, res) {
  return res.json(await getProducts(req.user.id, req.query.q || ""));
}

export async function getProduct(req, res) {
  const product = await getProductById(req.user.id, req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Produto nao encontrado" });
  }
  return res.json(product);
}

export async function priceLookup(req, res) {
  const data = await getPriceLookup(req.user.id, req.query.q || "");
  if (!data) {
    return res.status(404).json({ message: "Nenhum produto encontrado" });
  }
  return res.json(data);
}

export async function dashboard(_req, res) {
  return res.json(await getDashboard(_req.user.id));
}

export async function purchases(req, res) {
  return res.json(await getPurchases(req.user.id));
}

export async function getEditableItems(req, res) {
  return res.json(await getEditableItemsFromRepository(req.user.id));
}

export async function updateEditableItem(req, res) {
  const item = await updateEditableItemFromRepository(req.user.id, req.params.id, req.body || {});
  if (!item) {
    return res.status(404).json({ message: "Item nao encontrado" });
  }
  return res.json(item);
}
