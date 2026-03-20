import crypto from "crypto";
import { getPool, isDatabaseConfigured } from "../config/database.js";
import { mockDatabase } from "../data/mockDatabase.js";
import { normalizeProductName } from "./normalization.service.js";
import { normalizeReceiptDraft } from "./receipt-draft.service.js";
import { hashPassword } from "../utils/auth.js";

const GUEST_DOMAIN = "guest.housegrocery.local";
const GUEST_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let databaseAvailability = {
  checkedAt: 0,
  value: null
};

export async function findUserByEmail(email) {
  if (!(await canUseDatabase())) {
    return null;
  }

  const { rows } = await getPool().query(
    `
      SELECT
        id,
        email,
        password,
        full_name AS "fullName",
        created_at AS "createdAt"
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
}

export async function createUser({ email, passwordHash, fullName }) {
  if (!(await canUseDatabase())) {
    throw new Error("Banco de dados nao configurado");
  }

  const { rows } = await getPool().query(
    `
      INSERT INTO users (id, email, password, full_name, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      RETURNING id, email, full_name AS "fullName", created_at AS "createdAt"
    `,
    [email, passwordHash, fullName]
  );

  return rows[0];
}

export async function createGuestSession(preferredCode = "") {
  const guestCode = normalizeGuestCode(preferredCode) || generateGuestCode();
  const guestIdentity = buildGuestIdentity(guestCode);

  if (!(await canUseDatabase())) {
    return {
      token: `demo-guest-${guestCode}`,
      guestCode,
      user: {
        id: "demo-user",
        email: guestIdentity.email,
        fullName: guestIdentity.fullName
      }
    };
  }

  let user = await findUserByEmail(guestIdentity.email);

  if (!user) {
    const passwordHash = await hashPassword(`guest:${guestCode}:house-grocery`);
    user = await createUser({
      email: guestIdentity.email,
      passwordHash,
      fullName: guestIdentity.fullName
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  await createSession(user.id, token);

  return {
    token,
    guestCode,
    user
  };
}

export async function createSession(userId, token) {
  if (!(await canUseDatabase())) {
    return;
  }

  await getPool().query(
    `
      INSERT INTO user_sessions (id, user_id, token, created_at, expires_at)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW() + INTERVAL '30 days')
    `,
    [userId, token]
  );
}

export async function getUserFromToken(token) {
  if (!(await canUseDatabase())) {
    return {
      id: "demo-user",
      email: "demo@housegrocery.local",
      fullName: "Demo User"
    };
  }

  const { rows } = await getPool().query(
    `
      SELECT
        u.id,
        u.email,
        u.full_name AS "fullName",
        s.expires_at AS "expiresAt"
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );

  return rows[0] || null;
}

export async function deleteSession(token) {
  if (!(await canUseDatabase())) {
    return;
  }

  await getPool().query(`DELETE FROM user_sessions WHERE token = $1`, [token]);
}

export function getGuestCodeFromUser(user) {
  const email = String(user?.email || "");
  const match = email.match(/^guest\+([A-Z0-9]+)@guest\.housegrocery\.local$/i);
  return match ? match[1].toUpperCase() : "";
}

export async function listPurchases(userId) {
  if (!(await canUseDatabase())) {
    return mockDatabase.purchases.map((purchase) => ({
      ...purchase,
      store: mockDatabase.stores.find((store) => store.id === purchase.storeId),
      items: mockDatabase.purchaseItems.filter((item) => item.purchaseId === purchase.id)
    }));
  }

  const { rows } = await getPool().query(
    `
      SELECT
        p.id,
        p.user_id AS "userId",
        p.store_id AS "storeId",
        p.purchase_date::text AS "purchaseDate",
        p.total_value::float AS "totalValue",
        p.items_count AS "itemsCount",
        s.name AS "storeName",
        s.location AS "storeLocation"
      FROM purchases p
      JOIN stores s ON s.id = p.store_id
      WHERE p.user_id = $1
      ORDER BY p.purchase_date DESC
    `,
    [userId]
  );

  const itemsByPurchase = await listPurchaseItemsGrouped(userId);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    storeId: row.storeId,
    purchaseDate: row.purchaseDate,
    totalValue: row.totalValue,
    itemsCount: row.itemsCount,
    store: {
      name: row.storeName,
      location: row.storeLocation
    },
    items: itemsByPurchase.get(row.id) || []
  }));
}

export async function listProducts(userId) {
  if (!(await canUseDatabase())) {
    return mockDatabase.products;
  }

  const { rows } = await getPool().query(
    `
      SELECT DISTINCT
        pr.id,
        COALESCE(NULLIF(pi.normalized_name_override, ''), pr.normalized_name) AS "normalizedName",
        pr.category
      FROM products pr
      JOIN purchase_items pi ON pi.product_id = pr.id
      JOIN purchases pu ON pu.id = pi.purchase_id
      WHERE pu.user_id = $1
      ORDER BY "normalizedName" ASC
    `,
    [userId]
  );
  return rows;
}

export async function listPriceHistory(userId) {
  if (!(await canUseDatabase())) {
    return mockDatabase.priceHistory;
  }

  const { rows } = await getPool().query(
    `
      SELECT
        ph.id,
        ph.product_id AS "productId",
        ph.store_id AS "storeId",
        ph.price::float AS "price",
        ph.date::text AS "date",
        s.name AS "storeName"
      FROM price_history ph
      JOIN stores s ON s.id = ph.store_id
      WHERE ph.user_id = $1
      ORDER BY ph.date ASC, ph.id ASC
    `,
    [userId]
  );
  return rows;
}

export async function getProductSnapshot(productId, userId) {
  if (!(await canUseDatabase())) {
    const product = mockDatabase.products.find((entry) => entry.id === productId);
    const history = mockDatabase.priceHistory
      .filter((entry) => entry.productId === productId)
      .map((entry) => ({
        ...entry,
        store: mockDatabase.stores.find((store) => store.id === entry.storeId)
      }));
    const purchases = mockDatabase.purchaseItems
      .filter((entry) => entry.productId === productId)
      .map((entry) => {
        const purchase = mockDatabase.purchases.find((item) => item.id === entry.purchaseId);
        return {
          ...entry,
          purchase: { purchaseDate: purchase.purchaseDate },
          store: mockDatabase.stores.find((store) => store.id === purchase.storeId)
        };
      });
    return { product, history, purchases };
  }

  const pool = getPool();
  const [productResult, historyResult, purchasesResult] = await Promise.all([
    pool.query(
      `
        SELECT
          pr.id,
          COALESCE(MAX(NULLIF(pi.normalized_name_override, '')), pr.normalized_name) AS "normalizedName",
          pr.category
        FROM products pr
        JOIN purchase_items pi ON pi.product_id = pr.id
        JOIN purchases pu ON pu.id = pi.purchase_id
        WHERE pr.id = $1 AND pu.user_id = $2
        GROUP BY pr.id, pr.normalized_name, pr.category
      `,
      [productId, userId]
    ),
    pool.query(
      `
        SELECT
          ph.id,
          ph.product_id AS "productId",
          ph.store_id AS "storeId",
          ph.price::float AS "price",
          ph.date::text AS "date",
          s.name AS "storeName"
        FROM price_history ph
        JOIN stores s ON s.id = ph.store_id
        WHERE ph.product_id = $1 AND ph.user_id = $2
        ORDER BY ph.date ASC, ph.id ASC
      `,
      [productId, userId]
    ),
    pool.query(
      `
        SELECT
          pi.id,
          pi.original_name AS "originalName",
          COALESCE(pi.normalized_name_override, pr.normalized_name) AS "normalizedProductName",
          pi.quantity::float AS "quantity",
          pi.unit_price::float AS "unitPrice",
          pi.total_price::float AS "totalPrice",
          pi.user_comment AS "userComment",
          pu.purchase_date::text AS "purchaseDate",
          s.name AS "storeName"
        FROM purchase_items pi
        JOIN products pr ON pr.id = pi.product_id
        JOIN purchases pu ON pu.id = pi.purchase_id
        JOIN stores s ON s.id = pu.store_id
        WHERE pi.product_id = $1 AND pu.user_id = $2
        ORDER BY pu.purchase_date DESC
      `,
      [productId, userId]
    )
  ]);

  return {
    product: productResult.rows[0] || null,
    history: historyResult.rows,
    purchases: purchasesResult.rows
  };
}

export async function saveParsedReceipt(parsedReceipt, userId) {
  const safeReceipt = normalizeReceiptDraft(parsedReceipt);

  if (!(await canUseDatabase())) {
    return mockDatabase.addParsedPurchase(safeReceipt);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const storeResult = await client.query(
      `
        INSERT INTO stores (id, name, location)
        VALUES (gen_random_uuid(), $1, $2)
        ON CONFLICT (name) DO UPDATE SET location = EXCLUDED.location
        RETURNING id, name, location
      `,
      [safeReceipt.storeName, safeReceipt.storeLocation]
    );

    const foundStore = storeResult.rows[0];

    const purchaseResult = await client.query(
      `
        INSERT INTO purchases (id, user_id, store_id, purchase_date, total_value, items_count)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        userId,
        foundStore.id,
        safeReceipt.purchaseDate,
        safeReceipt.totalValue,
        safeReceipt.items.length
      ]
    );

    for (const item of safeReceipt.items) {
      let product =
        (
          await client.query(
            `
              SELECT id, normalized_name AS "normalizedName", category
              FROM products
              WHERE normalized_name = $1
              LIMIT 1
            `,
            [item.normalizedProductName]
          )
        ).rows[0] || null;

      if (!product) {
        product = (
          await client.query(
            `
              INSERT INTO products (id, normalized_name, category)
              VALUES (gen_random_uuid(), $1, $2)
              RETURNING id, normalized_name AS "normalizedName", category
            `,
            [item.normalizedProductName, item.category]
          )
        ).rows[0];
      }

      const purchaseItemResult = await client.query(
        `
          INSERT INTO purchase_items (
            id,
            purchase_id,
            product_id,
            original_name,
            normalized_name_override,
            quantity,
            unit_price,
            total_price,
            user_comment
          )
          VALUES (gen_random_uuid(), $1, $2, $3, NULL, $4, $5, $6, $7)
          RETURNING id
        `,
        [
          purchaseResult.rows[0].id,
          product.id,
          item.originalName,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.userComment || null
        ]
      );

      await client.query(
        `
          INSERT INTO price_history (id, product_id, store_id, purchase_id, purchase_item_id, user_id, price, date)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
        `,
        [
          product.id,
          foundStore.id,
          purchaseResult.rows[0].id,
          purchaseItemResult.rows[0].id,
          userId,
          item.unitPrice,
          safeReceipt.purchaseDate
        ]
      );
    }

    await client.query("COMMIT");
    return {
      purchaseId: purchaseResult.rows[0].id,
      store: foundStore,
      itemsCount: safeReceipt.items.length
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listPurchaseItemsGrouped(userId) {
  const { rows } = await getPool().query(
    `
      SELECT
        pi.id,
        pi.purchase_id AS "purchaseId",
        pi.product_id AS "productId",
        COALESCE(pi.normalized_name_override, pr.normalized_name) AS "normalizedProductName",
        pi.quantity::float AS "quantity",
        pi.total_price::float AS "totalPrice",
        pi.user_comment AS "userComment"
      FROM purchase_items pi
      JOIN products pr ON pr.id = pi.product_id
      JOIN purchases pu ON pu.id = pi.purchase_id
      WHERE pu.user_id = $1
    `,
    [userId]
  );

  return rows.reduce((map, item) => {
    const current = map.get(item.purchaseId) || [];
    map.set(item.purchaseId, [...current, item]);
    return map;
  }, new Map());
}

export async function listEditableItems(userId) {
  const { rows } = await getPool().query(
    `
      SELECT
        pi.id,
        pi.purchase_id AS "purchaseId",
        pu.purchase_date::text AS "purchaseDate",
        s.name AS "storeName",
        pi.original_name AS "originalName",
        COALESCE(pi.normalized_name_override, pr.normalized_name) AS "normalizedProductName",
        pi.quantity::float AS "quantity",
        pi.unit_price::float AS "unitPrice",
        pi.total_price::float AS "totalPrice",
        pi.user_comment AS "userComment"
      FROM purchase_items pi
      JOIN purchases pu ON pu.id = pi.purchase_id
      JOIN stores s ON s.id = pu.store_id
      JOIN products pr ON pr.id = pi.product_id
      WHERE pu.user_id = $1
      ORDER BY pu.purchase_date DESC, pi.id DESC
    `,
    [userId]
  );

  return rows;
}

export async function updatePurchaseItem(userId, itemId, payload) {
  if (!(await canUseDatabase())) {
    return null;
  }

  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `
        SELECT
          pi.id,
          pi.purchase_id AS "purchaseId",
          pi.product_id AS "productId",
          pi.original_name AS "originalName",
          pi.normalized_name_override AS "normalizedNameOverride",
          COALESCE(pi.normalized_name_override, pr.normalized_name) AS "normalizedProductName",
          pr.category,
          pi.quantity::float AS "quantity",
          pi.unit_price::float AS "unitPrice",
          pi.total_price::float AS "totalPrice",
          pi.user_comment AS "userComment",
          pu.store_id AS "storeId",
          pu.purchase_date::text AS "purchaseDate"
        FROM purchase_items pi
        JOIN purchases pu ON pu.id = pi.purchase_id
        JOIN products pr ON pr.id = pi.product_id
        WHERE pi.id = $1 AND pu.user_id = $2
        LIMIT 1
      `,
      [itemId, userId]
    );

    const existing = existingResult.rows[0];
    if (!existing) {
      await client.query("ROLLBACK");
      return null;
    }

    const nextValues = {
      originalName:
        payload.originalName !== undefined
          ? sanitizePurchaseItemValue("originalName", payload.originalName)
          : existing.originalName,
      normalizedProductName:
        payload.normalizedProductName !== undefined
          ? sanitizePurchaseItemValue("normalizedProductName", payload.normalizedProductName)
          : existing.normalizedProductName,
      quantity:
        payload.quantity !== undefined ? sanitizeNumberValue(payload.quantity, existing.quantity) : existing.quantity,
      unitPrice:
        payload.unitPrice !== undefined
          ? sanitizeNumberValue(payload.unitPrice, existing.unitPrice)
          : existing.unitPrice,
      totalPrice:
        payload.totalPrice !== undefined
          ? sanitizeNumberValue(payload.totalPrice, existing.totalPrice)
          : existing.totalPrice,
      userComment:
        payload.userComment !== undefined
          ? sanitizePurchaseItemValue("userComment", payload.userComment)
          : existing.userComment
    };

    if (payload.totalPrice !== undefined && payload.unitPrice === undefined && nextValues.quantity > 0) {
      nextValues.unitPrice = roundMoney(nextValues.totalPrice / nextValues.quantity);
    }

    if (payload.totalPrice === undefined && (payload.quantity !== undefined || payload.unitPrice !== undefined)) {
      nextValues.totalPrice = roundMoney(nextValues.quantity * nextValues.unitPrice);
    }

    let productId = existing.productId;
    let normalizedNameOverride = existing.normalizedNameOverride;

    if (payload.normalizedProductName !== undefined && nextValues.normalizedProductName) {
      const product = await findOrCreateProduct(client, nextValues.normalizedProductName, existing.category);
      productId = product.id;
      normalizedNameOverride = null;
    }

    await client.query(
      `
        UPDATE purchase_items
        SET
          product_id = $1,
          original_name = $2,
          normalized_name_override = $3,
          quantity = $4,
          unit_price = $5,
          total_price = $6,
          user_comment = $7
        WHERE id = $8
      `,
      [
        productId,
        nextValues.originalName,
        normalizedNameOverride,
        nextValues.quantity,
        nextValues.unitPrice,
        nextValues.totalPrice,
        nextValues.userComment,
        itemId
      ]
    );

    const historyResult = await client.query(
      `
        UPDATE price_history
        SET
          product_id = $1,
          store_id = $2,
          purchase_id = $3,
          purchase_item_id = $4,
          user_id = $5,
          price = $6,
          date = $7
        WHERE purchase_item_id = $4
        RETURNING id
      `,
      [productId, existing.storeId, existing.purchaseId, itemId, userId, nextValues.unitPrice, existing.purchaseDate]
    );

    if (!historyResult.rows.length) {
      await client.query(
        `
          INSERT INTO price_history (id, product_id, store_id, purchase_id, purchase_item_id, user_id, price, date)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
        `,
        [productId, existing.storeId, existing.purchaseId, itemId, userId, nextValues.unitPrice, existing.purchaseDate]
      );
    }

    await client.query(
      `
        UPDATE purchases
        SET
          total_value = totals.total,
          items_count = totals.items_count
        FROM (
          SELECT
            COALESCE(SUM(total_price), 0)::numeric(10, 2) AS total,
            COUNT(*)::int AS items_count
          FROM purchase_items
          WHERE purchase_id = $1
        ) totals
        WHERE purchases.id = $1
      `,
      [existing.purchaseId]
    );

    const finalResult = await client.query(
      `
        SELECT
          pi.id,
          pi.purchase_id AS "purchaseId",
          pu.purchase_date::text AS "purchaseDate",
          s.name AS "storeName",
          pi.original_name AS "originalName",
          COALESCE(pi.normalized_name_override, pr.normalized_name) AS "normalizedProductName",
          pi.quantity::float AS "quantity",
          pi.unit_price::float AS "unitPrice",
          pi.total_price::float AS "totalPrice",
          pi.user_comment AS "userComment"
        FROM purchase_items pi
        JOIN purchases pu ON pu.id = pi.purchase_id
        JOIN stores s ON s.id = pu.store_id
        JOIN products pr ON pr.id = pi.product_id
        WHERE pi.id = $1
        LIMIT 1
      `,
      [itemId]
    );

    await client.query("COMMIT");
    return finalResult.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function canUseDatabase() {
  if (!isDatabaseConfigured()) {
    return false;
  }

  const now = Date.now();
  const ttl = databaseAvailability.value ? 30000 : 5000;
  if (databaseAvailability.value !== null && now - databaseAvailability.checkedAt < ttl) {
    return databaseAvailability.value;
  }

  try {
    await getPool().query("SELECT 1");
    databaseAvailability = {
      checkedAt: now,
      value: true
    };
    return true;
  } catch (_error) {
    databaseAvailability = {
      checkedAt: now,
      value: false
    };
    return false;
  }
}

function normalizeGuestCode(code) {
  return String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function generateGuestCode() {
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    code += GUEST_ALPHABET[Math.floor(Math.random() * GUEST_ALPHABET.length)];
  }

  return code;
}

function buildGuestIdentity(guestCode) {
  return {
    email: `guest+${guestCode}@${GUEST_DOMAIN}`,
    fullName: `Convidado ${guestCode}`
  };
}

function sanitizePurchaseItemValue(key, value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (key === "normalizedProductName" || key === "userComment") {
    return trimmed || null;
  }

  return trimmed;
}

function sanitizeNumberValue(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? roundMoney(numeric) : fallback;
}

async function findOrCreateProduct(client, normalizedName, fallbackCategory = "Outros") {
  const cleanName = String(normalizedName || "").trim();
  const existing =
    (
      await client.query(
        `
          SELECT id, normalized_name AS "normalizedName", category
          FROM products
          WHERE normalized_name = $1
          LIMIT 1
        `,
        [cleanName]
      )
    ).rows[0] || null;

  if (existing) {
    return existing;
  }

  const normalized = normalizeProductName(cleanName);
  const created = await client.query(
    `
      INSERT INTO products (id, normalized_name, category)
      VALUES (gen_random_uuid(), $1, $2)
      RETURNING id, normalized_name AS "normalizedName", category
    `,
    [cleanName, normalized.category || fallbackCategory || "Outros"]
  );

  return created.rows[0];
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}
