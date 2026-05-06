export interface SiteLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface SiteLinks {
  contactPhone: string;
  social: SiteLink[];
  site: SiteLink[];
  legal: SiteLink[];
  support: SiteLink[];
}
