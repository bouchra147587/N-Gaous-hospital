import HomeView from "@/components/HomeView";
import { getServices, getDepartments, getDoctors, getHospitalInfo, getNews, getAdministration } from "@/lib/api";

export default async function HomePage() {
  const [services, departments, doctors, hospital, news, administration] = await Promise.all([
    getServices(),
    getDepartments(),
    getDoctors(),
    getHospitalInfo(),
    getNews(),
    getAdministration(),
  ]);

  return (
    <HomeView services={services} departments={departments} doctors={doctors} hospital={hospital} news={news} administration={administration} />
  );
}
