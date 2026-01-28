import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(clientPromise, { databaseName: "Mintmart" }),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            name: "Mobile Login",
            credentials: {
                phone: { label: "Phone Number", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await dbConnect();

                const user = await User.findOne({
                    phone: credentials.phone,
                }).select("+password");

                if (!user) {
                    throw new Error("No user found with this phone number");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password,
                );

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.phone = token.phone;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.phone = user.phone;
            }
            return token;
        },
    },
    pages: { signIn: "/login" },
});
