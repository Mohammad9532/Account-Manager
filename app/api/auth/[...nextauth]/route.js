import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
    adapter: MongoDBAdapter(clientPromise, { databaseName: 'Mintmart' }),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Mobile Login",
            credentials: {
                phone: { label: "Phone Number", type: "text", placeholder: "0501234567" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                await dbConnect();

                // 1. Find user by phone
                const user = await User.findOne({ phone: credentials.phone }).select('+password');

                if (!user) {
                    throw new Error("No user found with this phone number");
                }

                // 2. Check Password
                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                return { id: user._id, name: user.name, email: user.email, phone: user.phone };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
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
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
