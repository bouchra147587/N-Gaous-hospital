import { notFound } from "next/navigation";
import DepartmentDetailView from "@/components/DepartmentDetailView";
import { getDepartments, getDoctors, getDepartmentDetail } from "@/lib/api";

export default async function DepartmentPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await params;
  const [departments, doctors] = await Promise.all([getDepartments(), getDoctors()]);
  const department = departments.find((d) => d.slug === slug);
  if (!department) notFound();
  const detail = await getDepartmentDetail(department.id);
  const deptDoctors = doctors.filter((d) => d.department_id === department.id);
  return <DepartmentDetailView department={department} doctors={deptDoctors} detail={detail} />;
}
