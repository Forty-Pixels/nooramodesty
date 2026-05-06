import { PolicyContent } from "@/components/PolicyPage/PolicyContent";
import { shippingAndReturnPolicy } from "@/data/policies";

export default function ShippingAndReturnPolicyPage() {
  return <PolicyContent content={shippingAndReturnPolicy} />;
}
