/**
 * 画像圧縮・リサイズユーティリティ
 * iOSからの大きな画像ファイルを10MB以下に圧縮してCloud Functionsに送信可能にする
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0-1.0
  maxFileSize?: number; // bytes
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processedFormat: string;
}

/**
 * 画像ファイルを圧縮する
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // 既にファイルサイズが上限以下の場合はそのまま返す
    if (file.size <= maxFileSize) {
      resolve({
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1.0,
        processedFormat: file.type
      });
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context could not be created'));
      return;
    }

    img.onload = () => {
      try {
        // 画像サイズを計算（アスペクト比を維持）
        const { width, height } = calculateResizedDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // 段階的に品質を下げて目標サイズ以下になるまで圧縮
        compressToTargetSize(canvas, format, quality, maxFileSize)
          .then(({ blob, finalQuality }) => {
            const compressedFile = new File(
              [blob],
              generateFileName(file.name, format),
              { type: blob.type }
            );

            console.log(`画像圧縮完了: ${file.name}`);
            console.log(`元サイズ: ${(file.size / 1024).toFixed(2)}KB → 圧縮後: ${(blob.size / 1024).toFixed(2)}KB`);
            console.log(`品質: ${finalQuality}, 圧縮率: ${((1 - blob.size / file.size) * 100).toFixed(1)}%`);

            resolve({
              compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: blob.size / file.size,
              processedFormat: blob.type
            });
          })
          .catch(reject);

        // メモリ解放
        URL.revokeObjectURL(img.src);
      } catch (error) {
        reject(new Error(`Image compression failed: ${error}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // 画像を読み込み
    img.src = URL.createObjectURL(file);
  });
}

/**
 * リサイズ後の画像寸法を計算（アスペクト比維持）
 */
function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // 幅を基準にリサイズ
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // 高さを基準にリサイズ
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * 目標ファイルサイズ以下になるまで段階的に圧縮
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  format: string,
  initialQuality: number,
  maxFileSize: number
): Promise<{ blob: Blob; finalQuality: number }> {
  let quality = initialQuality;
  let blob: Blob;

  // 最大10回まで品質を下げて試行
  for (let attempt = 0; attempt < 10; attempt++) {
    blob = await canvasToBlob(canvas, `image/${format}`, quality);
    
    if (blob.size <= maxFileSize) {
      return { blob, finalQuality: quality };
    }

    // 品質を20%ずつ下げる
    quality = Math.max(0.1, quality - 0.2);
    
    console.log(`圧縮試行 ${attempt + 1}: サイズ ${(blob.size / 1024).toFixed(2)}KB (品質: ${quality})`);
  }

  // 最終的に目標サイズを超えても最低品質で返す
  blob = await canvasToBlob(canvas, `image/${format}`, 0.1);
  console.warn(`圧縮後も目標サイズ(${(maxFileSize / 1024).toFixed(2)}KB)を超えています: ${(blob.size / 1024).toFixed(2)}KB`);
  
  return { blob, finalQuality: 0.1 };
}

/**
 * CanvasをBlobに変換（Promise版）
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * 圧縮後のファイル名を生成
 */
function generateFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const timestamp = Date.now();
  
  switch (format) {
    case 'jpeg':
      return `${nameWithoutExt}_compressed_${timestamp}.jpg`;
    case 'png':
      return `${nameWithoutExt}_compressed_${timestamp}.png`;
    case 'webp':
      return `${nameWithoutExt}_compressed_${timestamp}.webp`;
    default:
      return `${nameWithoutExt}_compressed_${timestamp}.jpg`;
  }
}

/**
 * 画像圧縮のプリセット設定
 */
export const COMPRESSION_PRESETS = {
  // 高品質（ファイルサイズ優先度: 低）
  HIGH_QUALITY: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.9,
    format: 'jpeg' as const
  },
  
  // 標準品質（バランス重視）
  STANDARD: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'jpeg' as const
  },
  
  // 軽量化（ファイルサイズ優先度: 高）
  LIGHTWEIGHT: {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.6,
    format: 'jpeg' as const
  },
  
  // iOS対応（2MB制限対応）
  IOS_SAFE: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.75,
    maxFileSize: 2 * 1024 * 1024, // 2MBに調整
    format: 'jpeg' as const
  }
} as const;

/**
 * iOS Safari 向けの画像圧縮（最適化済み）
 */
export async function compressForIOS(file: File): Promise<CompressionResult> {
  return compressImage(file, COMPRESSION_PRESETS.IOS_SAFE);
}

/**
 * ファイルサイズを人間が読みやすい形式で表示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}