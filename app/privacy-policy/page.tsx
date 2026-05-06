import { PolicyContent } from "@/components/PolicyPage/PolicyContent";
import { privacyPolicy } from "@/data/policies";

export default function PrivacyPolicyPage() {
  return <PolicyContent content={privacyPolicy} />;
}
