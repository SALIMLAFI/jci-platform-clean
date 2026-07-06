import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        await dbConnect();
        
        // Check if user exists
        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            password: '', // No password for Google auth users
            role: 'member',
            photo: user.image || '',
            membershipDate: new Date(),
            authProvider: 'google',
            hasLocalPassword: false,
          });
        } else {
          // Update user photo if not set
          if (!existingUser.photo && user.image) {
            existingUser.photo = user.image;
            await existingUser.save();
          }
        }

        // Attach user ID to the user object for session callback
        user.id = existingUser._id.toString();
        user.role = existingUser.role;
        user.photo = existingUser.photo;
        
        // Generate JWT token for API calls
        user.apiToken = generateToken(existingUser);
        
        // Store user data for localStorage compatibility
        user.userData = {
          id: existingUser._id.toString(),
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          photo: existingUser.photo,
          authProvider: existingUser.authProvider,
          hasLocalPassword: existingUser.hasLocalPassword,
        };
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.image = token.picture; // Use 'image' for NextAuth standard
        session.user.photo = token.picture; // Keep 'photo' for backward compatibility
        session.user.apiToken = token.apiToken;
        session.user.userData = token.userData;
        session.user.authProvider = token.authProvider;
        session.user.hasLocalPassword = token.hasLocalPassword;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.picture = user.photo || user.image; // Store photo in picture field for NextAuth
        token.apiToken = user.apiToken;
        token.userData = user.userData;
        token.authProvider = user.authProvider;
        token.hasLocalPassword = user.hasLocalPassword;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.BETTER_AUTH_SECRET,
});

export { handler as GET, handler as POST };
