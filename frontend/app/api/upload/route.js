import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary using a Promise
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'jci-ledger/proofs' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      uploadStream.end(buffer);
    });

    return NextResponse.json({ 
      url: uploadResult.secure_url, 
      public_id: uploadResult.public_id 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: 'Failed to upload file to Cloudinary' }, { status: 500 });
  }
}
