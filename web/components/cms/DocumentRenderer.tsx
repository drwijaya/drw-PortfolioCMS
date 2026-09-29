import { BlockRenderer } from "@/components/case-study/BlockRenderer";
import { CaseStudyScroll } from "@/components/case-study/CaseStudyScroll";
import { WorkDetail } from "@/components/case-study/CaseStudy";
import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";
import { WorksExplorer } from "@/components/projects/WorksExplorer";
import { PlaygroundExplorer } from "@/components/projects/PlaygroundExplorer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProjects, getRecentPlayground, getPlayground } from "@/lib/content";
import { clean } from "@/lib/sanitize";
import {
  LEGACY_BLOCKS,
  toLegacyBlock,
  workDetail,
  type CmsBlock,
  type CmsDocument,
} from "@/lib/cms/model";
import { publishedEntries } from "@/lib/cms/repository";
import { readDocuments, readDocument } from "@/lib/cms/read";
import type { Project } from "@/lib/types";
import "@/app/(site)/works/[slug]/case-study.css";
import "@/app/(site)/works/[slug]/detail.css";
import "@/app/(site)/works/[slug]/storytelling.css";
import "./content.css";
export async function BlogListing({page=1,category='',tag=''}:{page?:number;category?:string;tag?:string}={}) {
  const all=(await readDocuments("post")).filter(p=>(!category||(p.data.categories as string[]??[]).includes(category))&&(!tag||(p.data.tags as string[]??[]).includes(tag))).sort((a,b)=>String(b.data.date??'').localeCompare(String(a.data.date??'')));
  const total=Math.ceil(all.length/12);page=Math.max(1,Math.min(page,total||1));const posts=all.slice((page-1)*12,page*12);
  const href=(n:number)=>`/blog?${new URLSearchParams({page:String(n),...(category?{category}:{}),...(tag?{tag}:{})})}`;
  return (
    <div className="cms-public-list">
      {posts.map((post) => (
        <article key={post.slug}>
          <a href={`/blog/${post.slug}`}>
            <h2>{post.title}</h2>
          </a>
          <p>{String(post.data.excerpt ?? post.seo.description)}</p>
          <small>
            {String(post.data.date ?? "").slice(0, 10)} · {readingMinutes(post)}{" "}
            min read
          </small>
        </article>
      ))}
      {!posts.length && <p>No articles published yet.</p>}{total>1&&<nav aria-label="Article pages">{page>1&&<a href={href(page-1)}>← Previous</a>}<span> {page} / {total} </span>{page<total&&<a href={href(page+1)}>Next →</a>}</nav>}
    </div>
  );
}
export function readingMinutes(doc: CmsDocument) {
  return Math.max(
    1,
    Math.ceil(
      JSON.stringify(doc.blocks)
        .replace(/<[^>]*>/g, " ")
        .split(/\s+/).length / 220,
    ),
  );
}
async function RenderBlock({
  node,
  depth = 0,
}: {
  node: CmsBlock;
  depth?: number;
}) {
  const a = node.attributes;
  if (depth > 8||node.attributes.hidden===true) return null;
  if ((LEGACY_BLOCKS as readonly string[]).includes(node.type))
    return <BlockRenderer block={toLegacyBlock(node)} />;
  if (node.type === "heading") {
    const text = clean(String(a.text ?? ""));
    return a.level === 3 ? (
      <h3 dangerouslySetInnerHTML={{ __html: text }} />
    ) : a.level === 4 ? (
      <h4 dangerouslySetInnerHTML={{ __html: text }} />
    ) : (
      <h2 dangerouslySetInnerHTML={{ __html: text }} />
    );
  }
  if (node.type === "button")
    return (
      <a className="cs-btn cs-btn-primary" href={String(a.href ?? "/")}>
        {String(a.text ?? "Read more")}
      </a>
    );
  if (node.type === "separator") return <hr />;
  if (node.type === "file")
    return (
      <a href={String(a.src ?? "")} download>
        {String(a.label ?? "Download")}
      </a>
    );
  if (node.type === "audio")
    return (
      <figure>
        <audio controls src={String(a.src ?? "")} />
        <figcaption>{String(a.caption ?? "")}</figcaption>
      </figure>
    );
  if (node.type === "video")
    return (
      <figure>
        <video controls preload="metadata" src={String(a.src ?? "")} />
        <figcaption>{String(a.caption ?? "")}</figcaption>
      </figure>
    );
  if (
    ["profile", "experience", "education", "certifications", "skills"].includes(
      node.type,
    )
  )
    return (
      <AboutSection only={node.type === "profile" ? a.profileMode==='identity'?['profile']:undefined : [node.type]} embedded={node.type!=='profile'||a.profileMode==='identity'}/>
    );
  if (node.type === "contact") return <ContactSection />;
  if (node.type === "works")
    return (
      <WorksExplorer
        projects={await getProjects()}
        playground={await getRecentPlayground()}
      />
    );
  if (node.type === "playground")
    return <PlaygroundExplorer items={await getPlayground()} />;
  if (node.type === "blog") return <BlogListing />;
  if (node.type === "pattern") {
    const patterns = await publishedEntries("pattern");
    const doc = patterns.find((d) => d.id===a.entryId||d.published?.slug===a.entryId)?.published;
    return doc ? (
      <>
        {doc.blocks.map((n) => (
          <RenderBlock node={n} depth={depth + 1} key={n.id} />
        ))}
      </>
    ) : null;
  }
  return (
    <section
      className={node.type === "columns" ? "cms-public-columns" : undefined}
      data-cols={Number(a.cols) || 2}
    >
      {node.type === "section" && <h2>{String(a.lead ?? a.label ?? "")}</h2>}
      {node.type === "beat" && (
        <>
          <h3>{String(a.heading ?? "")}</h3>
          <p>{String(a.intro ?? "")}</p>
        </>
      )}
      {node.children.map((n) => (
        <RenderBlock node={n} depth={depth + 1} key={n.id} />
      ))}
    </section>
  );
}
export async function DocumentRenderer({
  document: doc,
}: {
  document: CmsDocument;
}) {
  if (doc.kind === "work")
    return (
      <div className="project-detail-page is-reading">
        <WorkDetail
          detail={workDetail(doc)}
          project={{
            ...(doc.data.project as Project),
            slug: doc.slug,
            title: doc.title,
          }}
        />
      </div>
    );
  if (doc.kind === "page" && doc.data.template === "existing")
    return (
      <>
        {doc.blocks.map((n) => (
          <RenderBlock key={n.id} node={n} />
        ))}
      </>
    );
  return (
    <CaseStudyScroll>
      <article className="cs-root cms-public-document">
        <PageHeader first as="h1" label={doc.title} />
        {doc.kind === "post" && (
          <p className="cms-public-byline">
            {String(doc.data.date ?? "").slice(0, 10)} · {readingMinutes(doc)}{" "}
            min read
          </p>
        )}
        {doc.blocks.map((n) => (
          <RenderBlock key={n.id} node={n} />
        ))}
      </article>
    </CaseStudyScroll>
  );
}
export async function pageDocument(slug: string) {
  return readDocument("page", slug);
}
