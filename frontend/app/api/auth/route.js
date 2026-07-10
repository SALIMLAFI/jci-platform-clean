import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";

async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LddnzotAAAAABdfG9xlJLVwkbeKEuufob4_ruKw';
  
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${secretKey}&response=${token}`,
  });

  const data = await response.json();
  return data.success;
}

export async function POST(request) {
  await dbConnect();
  
  try {
    const body = await request.json();
    const { action, name, email, password, role, membershipDate, recaptchaToken, rememberMe } = body;

    // Verify reCAPTCHA for both login and register
    if (!recaptchaToken) {
      return NextResponse.json({ error: "reCAPTCHA token is required" }, { status: 400 });
    }

    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return NextResponse.json({ error: "Invalid reCAPTCHA token" }, { status: 400 });
    }

    // Handle Register
    if (action === "register") {
      if (!name || !email || !password) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      
      if (cleanName.length < 3) {
        return NextResponse.json({ error: "Le nom doit contenir au moins 3 caractères." }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
      }

      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      // Note: we updated the regex to force special character as requested in the prompt.
      if (!strongPasswordRegex.test(password)) {
        return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères, inclure une majuscule, une minuscule, un chiffre et un caractère spécial." }, { status: 400 });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        // Allow a Google-created account to be completed with a password
        if (!existingUser.password) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          existingUser.name = cleanName;
          existingUser.password = hashedPassword;
          existingUser.role = role || existingUser.role || "member";
          existingUser.membershipDate = membershipDate || existingUser.membershipDate || new Date();
          existingUser.authProvider = "local";
          existingUser.hasLocalPassword = true;
          await existingUser.save();

          const token = generateToken(existingUser, rememberMe);
          const userResponse = { id: existingUser._id, name: existingUser.name, email: existingUser.email, role: existingUser.role, photo: existingUser.photo || '', authProvider: existingUser.authProvider, hasLocalPassword: existingUser.hasLocalPassword };
          
          const response = NextResponse.json({ user: userResponse, token }, { status: 200 });
          setAuthCookie(response, token, rememberMe);
          return response;
        }

        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: role || "member",
        membershipDate: membershipDate || new Date(),
        authProvider: "local",
        hasLocalPassword: true,
      });

      const token = generateToken(newUser, rememberMe);

      // Return user without password
      const userResponse = { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, authProvider: newUser.authProvider, hasLocalPassword: newUser.hasLocalPassword };
      
      const response = NextResponse.json({ user: userResponse, token }, { status: 201 });
      setAuthCookie(response, token, rememberMe);
      return response;
    }
    
    // Handle Login
    if (action === "login") {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      console.log('[API /auth login] Login attempt for email:', cleanEmail);
      
      if (!cleanEmail || !password) {
        console.log('[API /auth login] Missing email or password');
        return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
      }

      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        console.log('[API /auth login] User not found for email:', cleanEmail);
        return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
      }

      if (user.hasLocalPassword === false || !user.password) {
        console.log('[API /auth login] Account has no password, likely Google-only account:', email);
        return NextResponse.json({
          error: "Ce compte est lié à Google. Utilisez Google pour vous connecter ou créez un mot de passe local depuis le lien de réinitialisation.",
        }, { status: 401 });
      }

      console.log('[API /auth login] User found, comparing password');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('[API /auth login] Password mismatch for email:', cleanEmail);
        return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
      }

      console.log('[API /auth login] Password match, generating token');
      const token = generateToken(user, rememberMe);
      const userResponse = { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        photo: user.photo || '',
        createdAt: user.createdAt,
        authProvider: user.authProvider,
        hasLocalPassword: user.hasLocalPassword
      };
      
      console.log('[API /auth login] User logged in successfully:', userResponse);
      
      const response = NextResponse.json({ user: userResponse, token }, { status: 200 });
      setAuthCookie(response, token, rememberMe);
      return response;
    }

    return NextResponse.json({ error: "Invalid action. Use 'register' or 'login'" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
