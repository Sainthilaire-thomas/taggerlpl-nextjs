import ClientTaggerPage from "./ClientTaggerPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function TaggingPage() {
  return (
    <ProtectedRoute>
      <ClientTaggerPage />
    </ProtectedRoute>
  );
}
