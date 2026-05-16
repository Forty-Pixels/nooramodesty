import "server-only";

import { requireSanityWriteClient } from "./sanity";

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function suffix() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export async function generateOrderNumber(): Promise<string> {
  const client = requireSanityWriteClient();
  const prefix = process.env.ORDER_NUMBER_PREFIX || "NM";
  const datePart = formatDate(new Date());

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const orderNumber = `${prefix}-${datePart}-${suffix()}`;
    const existing = await client.fetch<number>(
      `count(*[_type == "order" && orderNumber == $orderNumber])`,
      { orderNumber },
    );

    if (existing === 0) {
      return orderNumber;
    }
  }

  throw new Error("Unable to generate a unique order number.");
}
