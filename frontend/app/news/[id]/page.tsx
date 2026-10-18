import { notFound } from "next/navigation";
import { getNews } from "@/lib/api";
import NewsDetailView from "@/components/NewsDetailView";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await getNews();
  const item = news.find((n) => String(n.id) === id);

  if (!item) notFound();

  return <NewsDetailView item={item} />;
}
