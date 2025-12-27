"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { User, LogOut, LogIn, Loader2 } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function UserAuthButton() {
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Get initial user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    if (loading) {
        return (
            <Button variant="outline" size="sm" disabled className="border-purple-300">
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/login")}
            className="border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900"
        >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
        </Button>
    )
}
