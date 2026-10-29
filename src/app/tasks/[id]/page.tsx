import PrototypeApp from "@/components/prototype/PrototypeApp";
export default function Task({ params }: { params: { id: string } }) { return <PrototypeApp initialView="tasks" initialTask={params.id} />; }
