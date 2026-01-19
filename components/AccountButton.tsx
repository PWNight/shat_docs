// components/AuthButton.tsx
import Anchor from "@/components/ui/Anchor";
import { LogIn, UserCircle } from "lucide-react";
import { SessionPayload } from "@/utils/session";

interface AuthButtonProps {
  session: SessionPayload | null;
}

export function AuthButton({ session }: AuthButtonProps) {
  const isLoggedIn = !!session;

  const config = isLoggedIn
      ? {
        href: "/profile",
        label: session.full_name || "Личный кабинет",
        icon: UserCircle,
        className: "bg-blue-600 hover:bg-blue-700 text-white"
      }
      : {
        href: "/login",
        label: "Войти",
        icon: LogIn,
        className: "bg-neutral-100 hover:bg-neutral-200"
      };

  const Icon = config.icon;

  return (
      <Anchor
          href={config.href}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow-md ${config.className}`}
      >
        <Icon className="w-4 h-4" />
        <span className="max-w-[150px] truncate">{config.label}</span>
      </Anchor>
  );
}