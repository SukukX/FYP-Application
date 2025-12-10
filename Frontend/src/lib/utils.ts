import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(path: string | undefined | null, forceDownload: boolean = false) {
  if (!path) return "";

  if (path.startsWith("http")) {
    // Handle Cloudinary URLs for forced download
    if (forceDownload && path.includes("cloudinary.com")) {
      // transformation 'fl_attachment' only works for 'image' and 'video' resource types.
      // It causes 401/errors for 'raw' types (docs, pdfs upload as raw).
      if (path.includes("/upload/") && path.includes("/image/") && !path.toLowerCase().endsWith(".pdf")) {
        return path.replace("/upload/", "/upload/fl_attachment/");
      }
    }
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
