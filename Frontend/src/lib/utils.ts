import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Cookies from "js-cookie";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(path: string | undefined | null, forceDownload: boolean = false) {
  if (!path) return "";

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  if (path.startsWith("http")) {
    // Route sensitive Cloudinary URLs through secure proxy
    if (path.includes("cloudinary.com") && (path.includes("/kyc/") || path.includes("/documents/"))) {
      const token = Cookies.get("token");
      return `${baseUrl}/api/files/secure?url=${encodeURIComponent(path)}&token=${token || ''}`;
    }
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

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
