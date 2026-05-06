export interface PolicySection {
  _id: string;
  title: string;
  body: string;
}

export interface PolicyPageContent {
  _id: string;
  title: string;
  slug: string;
  eyebrow: string;
  updatedAt: string;
  intro: string;
  sections: PolicySection[];
}
