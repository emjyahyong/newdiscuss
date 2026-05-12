import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";
import LogoutButton from "./LogoutButton";

export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Discussion</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Bonjour,{" "}
            <strong className="text-gray-700">{session.user.name}</strong>
          </span>
          <LogoutButton />
        </div>
      </header>
      <ChatClient currentUserId={session.user.id} />
    </div>
  );
}
