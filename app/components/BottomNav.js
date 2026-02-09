"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Library, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Library", href: "/library", icon: Library },
    { name: "Reader", href: "/reader", icon: BookOpen },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <Icon size={24} />
            <span className="text-xs mt-1 font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
