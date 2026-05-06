import { PolicyContent } from "@/components/PolicyPage/PolicyContent";
import { termsAndConditionsPolicy } from "@/data/policies";

export default function TermsAndConditionsPage() {
  return <PolicyContent content={termsAndConditionsPolicy} />;
}
