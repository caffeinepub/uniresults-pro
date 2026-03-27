/**
 * ExternalBlob - Caffeine blob storage implementation.
 * This implementation stores blobs as object URLs in the browser.
 * In production, blobs are stored on the Caffeine blob gateway.
 */
export class ExternalBlob {
  private readonly bytes: Uint8Array | null;
  private readonly url: string | null;
  private progressCallback: ((percentage: number) => void) | null = null;

  private constructor(bytes: Uint8Array | null, url: string | null) {
    this.bytes = bytes;
    this.url = url;
  }

  static fromBytes(data: Uint8Array): ExternalBlob {
    return new ExternalBlob(data, null);
  }

  static fromURL(url: string): ExternalBlob {
    return new ExternalBlob(null, url);
  }

  withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    const blob = new ExternalBlob(this.bytes, this.url);
    blob.progressCallback = onProgress;
    return blob;
  }

  getDirectURL(): string {
    if (this.url) return this.url;
    if (this.bytes) {
      // Simulate upload progress
      if (this.progressCallback) {
        const cb = this.progressCallback;
        let pct = 0;
        const interval = setInterval(() => {
          pct = Math.min(pct + 20, 95);
          cb(pct);
          if (pct >= 95) clearInterval(interval);
        }, 50);
        setTimeout(() => {
          clearInterval(interval);
          cb(100);
        }, 350);
      }
      const blob = new Blob([this.bytes.buffer as ArrayBuffer], {
        type: "image/jpeg",
      });
      return URL.createObjectURL(blob);
    }
    throw new Error("ExternalBlob has no data");
  }

  async getBytes(): Promise<Uint8Array> {
    if (this.bytes) return this.bytes;
    if (this.url) {
      const res = await fetch(this.url);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
    throw new Error("ExternalBlob has no data");
  }
}
