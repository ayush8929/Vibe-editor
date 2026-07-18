import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
    providers: [
        GitHub({
            clientId: process.env.Auth_GITHUB_ID,
            clientSecret: process.env.Auth_GITHUB_SECRET
        }),
        Google({
            clientId: process.env.Auth_GOOGLE_ID,
            clientSecret: process.env.Auth_GOOGLE_SECRET,
        })
    ]   
} satisfies NextAuthConfig;
