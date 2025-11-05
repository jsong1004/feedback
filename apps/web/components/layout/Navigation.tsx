"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();
  const { user, isAdmin, isOrganizer, isMentor, isMentee } = useAuth();

  const navItems = [
    { href: "/", label: "Home", show: true },
    { href: "/profile", label: "Profile", show: true },
    { href: "/admin/users", label: "Admin", show: isAdmin },
    { href: "/organizer/events", label: "Events", show: isOrganizer },
    { href: "/organizer/forms", label: "Forms", show: isOrganizer },
    { href: "/organizer/reports", label: "Reports", show: isOrganizer },
    { href: "/mentor/dashboard", label: "Mentor Dashboard", show: isMentor },
    { href: "/mentee/dashboard", label: "Mentee Dashboard", show: isMentee },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">
                Mentorship Feedback
              </span>
            </Link>

            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="hidden sm:block text-sm text-gray-700">
                  <span className="font-medium">{user.name || user.email}</span>
                  <div className="text-xs text-gray-500">
                    {user.roles.join(", ")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden border-t">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {item.label}
              </Link>
            ))}
        </div>
      </div>
    </nav>
  );
}
