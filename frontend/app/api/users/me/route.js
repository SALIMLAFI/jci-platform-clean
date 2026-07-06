import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  await dbConnect();
  
  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findById(userPayload.id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, photo } = await request.json();
    
    console.log('[API /users/me PUT] Received data:', { 
      name, 
      email, 
      photo: photo ? `present (${photo.substring(0, 50)}...)` : 'missing' 
    });
    
    // Only allow updating name, email, and photo
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (photo !== undefined) updateData.photo = photo;

    console.log('[API /users/me PUT] Update data:', {
      ...updateData,
      photo: updateData.photo ? `present (${updateData.photo.substring(0, 50)}...)` : 'missing'
    });

    const updatedUser = await User.findByIdAndUpdate(
      userPayload.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('[API /users/me PUT] Updated user from DB:', {
      id: updatedUser._id,
      name: updatedUser.name,
      photo: updatedUser.photo ? `present (${updatedUser.photo.substring(0, 50)}...)` : 'missing',
      photoLength: updatedUser.photo?.length || 0,
      photoStartsWith: updatedUser.photo?.substring(0, 20)
    });

    const responseUser = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      photo: updatedUser.photo,
      createdAt: updatedUser.createdAt
    };

    console.log('[API /users/me PUT] Response user:', {
      ...responseUser,
      photo: responseUser.photo ? `present (${responseUser.photo.substring(0, 50)}...)` : 'missing'
    });

    return NextResponse.json({ user: responseUser }, { status: 200 });
  } catch (error) {
    console.error('[API /users/me PUT] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
