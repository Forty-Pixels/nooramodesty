import { schedule } from "@netlify/functions";
import { createClient } from "next-sanity";

const handler = schedule("0 */6 * * *", async () => {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.SANITY_API_TOKEN;

  if (!projectId || !dataset || !token) {
    console.error("Sanity environment is not configured for scheduled order conversion.");
    return { statusCode: 500, body: "Sanity not configured" };
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01",
    useCdn: false,
  });
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const orders = await client.fetch<Array<{ _id: string; orderNumber: string }>>(
    `*[
      _type == "order" &&
      paymentMethod == "bank_transfer" &&
      adminStatus == "pending_approval" &&
      !defined(paymentSlip.asset._ref) &&
      placedAt < $cutoff
    ]{_id, orderNumber}`,
    { cutoff },
  );

  for (const order of orders) {
    await client.patch(order._id).set({ paymentMethod: "cod" }).commit();
    console.log(`Converted unpaid bank transfer order ${order.orderNumber} to COD.`);
  }

  return { statusCode: 200, body: JSON.stringify({ converted: orders.length }) };
});

export { handler };
