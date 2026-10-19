import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export interface StickerOptions {
  pack?: string;
  author?: string;
  categories?: string[];
}

export class MediaPipeline {
  private static ffmpegBinary = 'ffmpeg';
  private static isFfmpegAvailable: boolean | null = null;

  public static async checkFfmpeg(): Promise<boolean> {
    if (this.isFfmpegAvailable !== null) return this.isFfmpegAvailable;

    return new Promise((resolve) => {
      const proc = spawn(this.ffmpegBinary, ['-version']);
      proc.on('error', () => {
        this.isFfmpegAvailable = false;
        resolve(false);
      });
      proc.on('close', (code) => {
        this.isFfmpegAvailable = code === 0;
        resolve(this.isFfmpegAvailable);
      });
    });
  }

  public static async createSticker(
    inputBuffer: Buffer,
    isVideo: boolean = false,
    options: StickerOptions = {}
  ): Promise<Buffer> {
    const hasFfmpeg = await this.checkFfmpeg();
    if (!hasFfmpeg) {
      throw new Error('FFmpeg is not installed or not found in system PATH. Cannot generate sticker.');
    }

    const tempDir = path.join(os.tmpdir(), 'bot404_temp');
    await fs.mkdir(tempDir, { recursive: true });

    const randomId = crypto.randomBytes(8).toString('hex');
    const inputExt = isVideo ? '.mp4' : '.png';
    const inputPath = path.join(tempDir, `input_${randomId}${inputExt}`);
    const outputPath = path.join(tempDir, `output_${randomId}.webp`);

    await fs.writeFile(inputPath, inputBuffer);

    try {
      const ffmpegArgs: string[] = [];

      if (isVideo) {
        // Video to animated WebP: max 6 seconds, 512x512 square fit with padding, fps 15
        ffmpegArgs.push(
          '-y',
          '-t', '6',
          '-i', inputPath,
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
          '-loop', '0',
          '-ss', '00:00:00',
          '-an',
          '-vsync', '0',
          '-s', '512x512',
          outputPath
        );
      } else {
        // Static Image to WebP: 512x512 square fit with transparent padding
        ffmpegArgs.push(
          '-y',
          '-i', inputPath,
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
          '-lossless', '1',
          '-q:v', '90',
          outputPath
        );
      }

      await this.runFfmpeg(ffmpegArgs);

      const rawWebp = await fs.readFile(outputPath);
      const pack = options.pack || 'BOT_404_V3';
      const author = options.author || 'Rutaab';

      return this.addExifMetadata(rawWebp, pack, author, options.categories);
    } finally {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  }

  public static async convertToOpusOgg(inputBuffer: Buffer): Promise<Buffer> {
    const hasFfmpeg = await this.checkFfmpeg();
    if (!hasFfmpeg) {
      throw new Error('FFmpeg is not installed or not found in system PATH. Cannot convert audio.');
    }

    const tempDir = path.join(os.tmpdir(), 'bot404_temp');
    await fs.mkdir(tempDir, { recursive: true });

    const randomId = crypto.randomBytes(8).toString('hex');
    const inputPath = path.join(tempDir, `audio_in_${randomId}`);
    const outputPath = path.join(tempDir, `audio_out_${randomId}.ogg`);

    await fs.writeFile(inputPath, inputBuffer);

    try {
      const args = [
        '-y',
        '-i', inputPath,
        '-c:a', 'libopus',
        '-b:a', '64k',
        '-vbr', 'on',
        '-compression_level', '10',
        '-ar', '48000',
        '-ac', '1',
        outputPath
      ];

      await this.runFfmpeg(args);
      return await fs.readFile(outputPath);
    } finally {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  }

  public static async convertToMp3(inputBuffer: Buffer, bitrateKbps: number = 320): Promise<Buffer> {
    const hasFfmpeg = await this.checkFfmpeg();
    if (!hasFfmpeg) {
      throw new Error('FFmpeg is not installed or not found in system PATH.');
    }

    const tempDir = path.join(os.tmpdir(), 'bot404_temp');
    await fs.mkdir(tempDir, { recursive: true });

    const randomId = crypto.randomBytes(8).toString('hex');
    const inputPath = path.join(tempDir, `extract_in_${randomId}`);
    const outputPath = path.join(tempDir, `extract_out_${randomId}.mp3`);

    await fs.writeFile(inputPath, inputBuffer);

    try {
      const args = [
        '-y',
        '-i', inputPath,
        '-vn',
        '-c:a', 'libmp3lame',
        '-b:a', `${bitrateKbps}k`,
        outputPath
      ];

      await this.runFfmpeg(args);
      return await fs.readFile(outputPath);
    } finally {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  }

  private static runFfmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegBinary, args);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-300)}`));
        }
      });
    });
  }

  public static addExifMetadata(
    webpBuffer: Buffer,
    packName: string,
    author: string,
    categories: string[] = ['🤖']
  ): Buffer {
    const json = {
      'sticker-pack-id': 'com.rutaab.bot404',
      'sticker-pack-name': packName,
      'sticker-pack-publisher': author,
      'emojis': categories
    };

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);

    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    // If file is too small to be valid WebP, return original
    if (webpBuffer.length < 12) return webpBuffer;

    // WebP structure: RIFF (4) + file length (4) + WEBP (4) + chunks
    // Add EXIF chunk: 'EXIF' + chunk length (4) + exif payload
    const exifHeader = Buffer.from('EXIF');
    const exifLength = Buffer.alloc(4);
    exifLength.writeUInt32LE(exif.length, 0);

    // If exif length is odd, add padding byte
    const padding = exif.length % 2 !== 0 ? Buffer.from([0x00]) : Buffer.alloc(0);

    const exifChunk = Buffer.concat([exifHeader, exifLength, exif, padding]);

    // Update RIFF size
    const newTotalSize = webpBuffer.length + exifChunk.length - 8;
    const newHeader = Buffer.alloc(4);
    newHeader.writeUInt32LE(newTotalSize, 0);

    // Splice new size into webp header and append chunk
    const modified = Buffer.concat([
      webpBuffer.subarray(0, 4),
      newHeader,
      webpBuffer.subarray(8),
      exifChunk
    ]);

    return modified;
  }
}
