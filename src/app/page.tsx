import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tagging");

  // Ce code ne sera jamais exécuté en raison de la redirection
  return null;
}
