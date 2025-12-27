import { AuthForm } from "@/components/auth/auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign Up | AI Comic Generator",
    description: "Create a new account",
}

export default function SignupPage() {
    return <AuthForm mode="signup" />
}
