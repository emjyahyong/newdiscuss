"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm px-3 py-1.5 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-lg transition-colors"
    >
      Se déconnecter
    </button>
  );
}
