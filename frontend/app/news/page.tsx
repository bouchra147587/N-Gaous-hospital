import NewsView from "@/components/NewsView";
import { getNews } from "@/lib/api";

export const metadata = { title: "الأخبار | المؤسسة العمومية الاستشفائية بنقاوس" };

export default async function NewsPage() {
  const news = await getNews();
  return <NewsView news={news} />;
}
