import { runSchema } from "../config/database.js";

runSchema()
  .then(() => {
    console.log("Schema aplicado com sucesso.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Falha ao aplicar schema:", error.message);
    process.exit(1);
  });
