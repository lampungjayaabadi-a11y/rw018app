/**
 * Helper utilities for parsing and playing videos and handling media galleries
 */

export interface ParsedVideoInfo {
  type: 'youtube' | 'drive' | 'direct' | 'unknown';
  embedUrl: string;
  directUrl: string;
  thumbnailUrl?: string;
}

export function parseVideoUrl(url?: string): ParsedVideoInfo | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube detection (watch?v=, youtu.be, shorts, embed)
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      directUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 2. Google Drive video file detection
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directUrl: trimmed,
    };
  }

  // 3. Direct video format or data/blob URL
  const isDirect =
    trimmed.startsWith('data:video/') ||
    trimmed.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed) ||
    trimmed.includes('mixkit.co') ||
    trimmed.includes('cloudinary.com') ||
    trimmed.includes('firebasestorage.googleapis.com');

  return {
    type: isDirect ? 'direct' : 'direct',
    embedUrl: trimmed,
    directUrl: trimmed,
  };
}

/**
 * Collect all photos and videos attached to a Kegiatan item
 */
export function extractKegiatanMedia(kegiatan: {
  fotoUrls?: string[];
  videoUrl?: string;
  videoThumbnail?: string;
  dokumentasi?: Array<{ id: string; url: string; tipe: 'foto' | 'video'; judul?: string }>;
}) {
  const photos: Array<{ url: string; caption?: string }> = [];
  const videos: Array<{ url: string; title?: string; thumbnail?: string }> = [];

  const seenPhotoUrls = new Set<string>();
  const seenVideoUrls = new Set<string>();

  // Add from fotoUrls
  if (Array.isArray(kegiatan.fotoUrls)) {
    kegiatan.fotoUrls.forEach((url) => {
      if (url && typeof url === 'string' && url.trim() && !seenPhotoUrls.has(url.trim())) {
        const u = url.trim();
        seenPhotoUrls.add(u);
        photos.push({ url: u });
      }
    });
  }

  // Add from videoUrl
  if (kegiatan.videoUrl && typeof kegiatan.videoUrl === 'string' && kegiatan.videoUrl.trim()) {
    const vUrl = kegiatan.videoUrl.trim();
    if (!seenVideoUrls.has(vUrl)) {
      seenVideoUrls.add(vUrl);
      videos.push({
        url: vUrl,
        thumbnail: kegiatan.videoThumbnail,
      });
    }
  }

  // Add from dokumentasi array if present
  if (Array.isArray(kegiatan.dokumentasi)) {
    kegiatan.dokumentasi.forEach((doc) => {
      if (doc && doc.url && typeof doc.url === 'string') {
        const u = doc.url.trim();
        if (doc.tipe === 'video') {
          if (!seenVideoUrls.has(u)) {
            seenVideoUrls.add(u);
            videos.push({
              url: u,
              title: doc.judul,
              thumbnail: kegiatan.videoThumbnail,
            });
          }
        } else {
          if (!seenPhotoUrls.has(u)) {
            seenPhotoUrls.add(u);
            photos.push({
              url: u,
              caption: doc.judul,
            });
          }
        }
      }
    });
  }

  return { photos, videos };
}
