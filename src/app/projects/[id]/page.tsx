import PrototypeApp from "@/components/prototype/PrototypeApp";
export default function Project({ params }: { params: { id: string } }) {
  return <PrototypeApp initialView="projects" initialProject={params.id} />;
}
