import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Inicializar el cliente S3 compatible con Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // Esta ruta todavía NO pide sesión (Delva inicia sesión con Firebase, que este servidor no
    // comprueba), así que se limita lo que se puede hacer con ella: solo imágenes, de tamaño
    // razonable y pedidas desde esta misma página. La protección de verdad llega con el login de
    // Supabase (se comprobará el token igual que en Boga).
    const origen = request.headers.get('origin');
    if (origen && new URL(origen).host !== request.headers.get('host')) {
      return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
    }
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return NextResponse.json({ error: 'Solo se aceptan imágenes' }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen supera los 8 MB' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar un nombre único de archivo
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const key = `delva/${fileName}`;

    // Subir a Cloudflare R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Retornar la URL pública en Cloudflare R2
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Error al subir a Cloudflare R2:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
