import { redirect } from "next/navigation";

export default function Home() {
  redirect("/phase1-corpus/management");
  return null;
}
