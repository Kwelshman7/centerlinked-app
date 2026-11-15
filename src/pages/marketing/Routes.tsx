import { useParams } from "react-router-dom";
import { ArticleView } from "@/components/marketing/ArticleView";
import { MarketingShell, useMarketingMeta } from "@/components/marketing/MarketingChrome";
import { articleByPath } from "@/components/marketing/site";
import { Pricing } from "@/components/landing/Pricing";
import NotFound from "@/pages/NotFound";
import { InsightArticlePage } from "./CompanyPages";

export function ForAudiencePage() {
  const { audience } = useParams();
  const article = articleByPath(`/for/${audience ?? ""}`);
  if (!article) return <NotFound />;
  return <ArticleView article={article} />;
}

export function PlatformTopicPage() {
  const { topic } = useParams();
  const article = articleByPath(`/platform/${topic ?? ""}`);
  if (!article) return <NotFound />;
  return <ArticleView article={article} />;
}

export function ComparisonPage() {
  const { slug } = useParams();
  const article = articleByPath(`/vs/${slug ?? ""}`);
  if (!article) return <NotFound />;
  return <ArticleView article={article} />;
}

export function PricingPage() {
  useMarketingMeta(
    "Plans and pricing | CenterLinked",
    "Listing is free. Search is free with a work email. Membership is optional and priced by how many facilities you keep live, from $99 a month.",
  );

  return (
    <MarketingShell>
      <Pricing />
    </MarketingShell>
  );
}

export function InsightRoute() {
  const { slug } = useParams();
  if (!slug) return <NotFound />;
  const known = ["insurance-before-the-brochure", "what-monthly-verification-changes", "the-person-on-the-listing"];
  if (!known.includes(slug)) return <NotFound />;
  return <InsightArticlePage slug={slug} />;
}
