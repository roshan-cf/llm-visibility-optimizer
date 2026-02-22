export interface ProductSchema {
  name: string;
  description: string;
  image?: string;
  brand?: string;
  price?: string;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string;
  url?: string;
}

export interface FAQSchema {
  question: string;
  answer: string;
}

export interface OrganizationSchema {
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateProductSchema(data: ProductSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    description: data.description,
    ...(data.image && { image: data.image }),
    ...(data.brand && { brand: { "@type": "Brand", name: data.brand } }),
    ...(data.sku && { sku: data.sku }),
    ...(data.url && { url: data.url }),
    ...(data.price && {
      offers: {
        "@type": "Offer",
        price: data.price,
        priceCurrency: data.currency || "USD",
        availability: data.availability 
          ? `https://schema.org/${data.availability}`
          : "https://schema.org/InStock",
      },
    }),
  };
}

export function generateFAQSchema(faqs: FAQSchema[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateOrganizationSchema(data: OrganizationSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    ...(data.url && { url: data.url }),
    ...(data.logo && { logo: data.logo }),
    ...(data.description && { description: data.description }),
    ...(data.telephone && { telephone: data.telephone }),
    ...(data.email && { email: data.email }),
    ...(data.address && {
      address: {
        "@type": "PostalAddress",
        ...data.address,
      },
    }),
    ...(data.sameAs && { sameAs: data.sameAs }),
  };
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateLocalBusinessSchema(
  org: OrganizationSchema,
  businessType: string = "LocalBusiness"
): object {
  return {
    "@context": "https://schema.org",
    "@type": businessType,
    name: org.name,
    ...(org.url && { url: org.url }),
    ...(org.logo && { logo: org.logo }),
    ...(org.description && { description: org.description }),
    ...(org.telephone && { telephone: org.telephone }),
    ...(org.email && { email: org.email }),
    ...(org.address && {
      address: {
        "@type": "PostalAddress",
        ...org.address,
      },
    }),
    ...(org.sameAs && { sameAs: org.sameAs }),
  };
}

export function prettyPrintSchema(schema: object): string {
  return JSON.stringify(schema, null, 2);
}
