const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10000;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function makeImageError(key, status = 400) {
  const error = new Error(key);
  error.status = status;
  error.translationKey = key;
  return error;
}

export async function downloadImageFromUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string" || !isHttpUrl(imageUrl)) {
    throw makeImageError("errors.imageUrlMustBeValidHttpUrl");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      throw makeImageError("errors.imageDownloadFailed");
    }

    const contentTypeHeader = response.headers.get("content-type") || "";
    const mimeType = contentTypeHeader.split(";")[0].trim().toLowerCase();

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      throw makeImageError("errors.unsupportedImageType");
    }

    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (!Number.isNaN(contentLength) && contentLength > MAX_IMAGE_SIZE_BYTES) {
        throw makeImageError("errors.imageTooLarge");
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      throw makeImageError("errors.emptyImage");
    }

    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw makeImageError("errors.imageTooLarge");
    }

    return {
      imageData: buffer,
      imageMimeType: mimeType,
      imageSourceUrl: imageUrl,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw makeImageError("errors.imageDownloadTimedOut");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}