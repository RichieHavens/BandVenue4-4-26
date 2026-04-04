import { supabase } from './supabase';

export async function resizeAndCropImage(file: File | Blob, targetSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));

      canvas.width = targetSize;
      canvas.height = targetSize;

      // Crop to square
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = reject;
  });
}

export async function resizeImageKeepAspect(file: File | Blob, maxWidth: number, maxHeight: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = reject;
  });
}

export interface UploadedImageSet {
  original: string;
  thumbnail?: string; // 150x150 square
  logo?: string;      // 400x400 square
  hero_pc?: string;   // 1920px wide
  hero_mobile?: string; // 800px wide
}

const BUCKET_NAME = 'images';

async function uploadBlob(blob: Blob, path: string): Promise<string> {
  console.log(`Attempting to upload blob to ${BUCKET_NAME}/${path}`, {
    size: blob.size,
    type: blob.type
  });
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg'
    });

  if (error) {
    console.error('Upload error details:', error);
    if (error.message?.toLowerCase().includes('bucket not found') || (error as any).status === 404 || (error as any).status === 400) {
      console.log(`Bucket ${BUCKET_NAME} not found, attempting to create it...`);
      try {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
        if (createError) throw createError;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, blob, {
            upsert: true,
            contentType: blob.type || 'image/jpeg'
          });
        if (retryError) throw retryError;
      } catch (err: any) {
        throw err;
      }
    } else {
      throw error;
    }
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

export async function uploadLogoImageSet(file: File, userId: string): Promise<UploadedImageSet> {
  const timestamp = Date.now();
  const basePath = `${userId}/logo_${timestamp}`;

  const [original, logo, thumbnail] = await Promise.all([
    uploadBlob(file, `${basePath}_original.jpg`),
    resizeAndCropImage(file, 400).then(blob => uploadBlob(blob, `${basePath}_400.jpg`)),
    resizeAndCropImage(file, 150).then(blob => uploadBlob(blob, `${basePath}_150.jpg`))
  ]);

  return { original, logo, thumbnail };
}

export async function uploadHeroImageSet(file: File, userId: string): Promise<UploadedImageSet> {
  const timestamp = Date.now();
  const basePath = `${userId}/hero_${timestamp}`;

  const [original, hero_pc, hero_mobile] = await Promise.all([
    uploadBlob(file, `${basePath}_original.jpg`),
    resizeImageKeepAspect(file, 1920, 1080).then(blob => uploadBlob(blob, `${basePath}_pc.jpg`)),
    resizeImageKeepAspect(file, 800, 450).then(blob => uploadBlob(blob, `${basePath}_mobile.jpg`))
  ]);

  return { original, hero_pc, hero_mobile };
}

export async function uploadGalleryImage(file: File, userId: string): Promise<string> {
  const timestamp = Date.now();
  const basePath = `${userId}/gallery_${timestamp}`;
  const mediumBlob = await resizeAndCropImage(file, 400);
  return await uploadBlob(mediumBlob, `${basePath}_400.jpg`);
}

// Legacy support
export async function uploadStandardImageSet(file: File, userId: string): Promise<UploadedImageSet> {
  return uploadLogoImageSet(file, userId);
}
