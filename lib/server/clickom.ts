import "server-only";

export interface ClickomSalePayload {
  invoice_no: string;
  custom_order_id: string;
  mobile: string;
  customer_full_name: string;
  customer_address_line_1: string;
  customer_address_line_2?: string;
  customer_city: string;
  customer_zip_code: string;
  customer_country: string;
  products: Array<{
    product_id: number;
    variation_id: number;
    quantity: number;
    unit_price: number;
    unit_price_inc_tax: number;
    enable_stock: 0;
  }>;
  payment: Array<{
    amount: number;
    method: "cash" | "bank_transfer";
  }>;
}

function getClickomConfig() {
  const apiKey = process.env.CLICKOM_API_KEY;
  const baseUrl = process.env.CLICKOM_BASE_URL || "https://rcholdings.clickom.lk";

  if (!apiKey) {
    throw new Error("Clickom is not configured yet.");
  }

  return { apiKey, baseUrl };
}

export async function createClickomSale(payload: ClickomSalePayload): Promise<{ saleId: string }> {
  const { apiKey, baseUrl } = getClickomConfig();

  const response = await fetch(`${baseUrl}/customapi/sales`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Clickom sale creation failed.");
  }

  return {
    saleId: String(data?.id || data?.sale_id || data?.data?.id || data?.data?.sale_id || payload.invoice_no),
  };
}

export async function getClickomSaleStatus(orderId: string): Promise<string> {
  const { apiKey, baseUrl } = getClickomConfig();

  const response = await fetch(
    `${baseUrl}/customapi/sales_status?customer_order_id=${encodeURIComponent(orderId)}`,
    {
      headers: { "x-api-key": apiKey },
    },
  );
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Clickom status sync failed.");
  }

  return String(data?.status || data?.data?.status || "processing");
}
