import type { Metadata } from "next";
import type { CmsDocument } from "./model";
import { publicPath } from "./model";
export function documentMetadata(doc: CmsDocument): Metadata {
  const title = doc.seo.title || doc.title,
    description = doc.seo.description || String(doc.data.excerpt ?? ""),
    url = doc.seo.canonical || publicPath(doc) || "/";
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: !doc.seo.noindex, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: doc.kind === "post" ? "article" : "website",
      ...(doc.seo.image ? { images: [doc.seo.image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(doc.seo.image ? { images: [doc.seo.image] } : {}),
    },
  };
}

export function mergePublishedMetadata(base:Metadata,doc:CmsDocument|null):Metadata {
 if(!doc)return base
 const title=doc.seo.title||base.title,description=doc.seo.description||base.description
 const image=doc.seo.image
 return {...base,title,description,robots:{index:!doc.seo.noindex,follow:true},...(doc.seo.canonical?{alternates:{canonical:doc.seo.canonical}}:{}),openGraph:{...base.openGraph,...(doc.seo.title?{title:doc.seo.title}:{}),...(doc.seo.description?{description:doc.seo.description}:{}),...(image?{images:[image]}:{})},twitter:{...base.twitter,...(doc.seo.title?{title:doc.seo.title}:{}),...(doc.seo.description?{description:doc.seo.description}:{}),...(image?{images:[image]}:{})}}
}
