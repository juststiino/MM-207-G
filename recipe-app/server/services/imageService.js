import sharp from "sharp";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_DOWNLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_SIZE_BYTES = 1 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_WIDTH = 800;
const WEBP_QUALITY = 82;

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

async function optimizeImage(buffer) {
  let pipeline = sharp(buffer, { animated: false }).rotate();

  const metadata = await pipeline.metadata();

  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    });
  }

  const outputBuffer = await pipeline
    .webp({
      quality: WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();

  if (outputBuffer.length === 0) {
    throw makeImageError("errors.emptyImage");
  }

  if (outputBuffer.length > MAX_OUTPUT_SIZE_BYTES) {
    throw makeImageError("errors.imageTooLarge");
  }

  return {
    imageData: outputBuffer,
    imageMimeType: "image/webp",
  };
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
      if (!Number.isNaN(contentLength) && contentLength > MAX_DOWNLOAD_SIZE_BYTES) {
        throw makeImageError("errors.imageTooLarge");
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    if (originalBuffer.length === 0) {
      throw makeImageError("errors.emptyImage");
    }

    if (originalBuffer.length > MAX_DOWNLOAD_SIZE_BYTES) {
      throw makeImageError("errors.imageTooLarge");
    }

    const optimized = await optimizeImage(originalBuffer);

    return {
      imageData: optimized.imageData,
      imageMimeType: optimized.imageMimeType,
      imageSourceUrl: imageUrl,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw makeImageError("errors.imageDownloadTimedOut");
    }

    if (error.translationKey) {
      throw error;
    }

    throw makeImageError("errors.imageDownloadFailed");
  } finally {
    clearTimeout(timeout);
  }
}