const { Readable } = require("node:stream");
const cloudinary = require("cloudinary").v2;
const { createWorker } = require("tesseract.js");
const env = require("../config/env");
const createError = require("../utils/createError");

let workerPromise;

const configureCloudinary = () => {
  const credentials = env.cloudinary;
  if (!credentials?.cloudName || !credentials.apiKey || !credentials.apiSecret) {
    throw createError(503, "Receipt storage is not configured");
  }
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });
};

const uploadReceiptImage = (buffer, userId) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "scanspend/receipts",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        max_bytes: 5 * 1024 * 1024,
        context: { user_id: userId.toString() },
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    Readable.from(buffer).pipe(upload);
  });
};

const recognizeReceipt = async (buffer) => {
  workerPromise ??= createWorker("eng");
  const worker = await workerPromise;
  const result = await worker.recognize(buffer);
  const text = result.data.text.slice(0, 20000).trim();
  const merchant = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean)?.slice(0, 120);
  const totalMatch = text.match(/(?:grand\s+total|amount\s+due|total)\D{0,24}([0-9,]+(?:\.\d{1,2})?)/i);
  const amount = totalMatch ? Number(totalMatch[1].replaceAll(",", "")) : undefined;
  const dateMatch = text.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  const expenseDate = dateMatch
    ? new Date(`${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}T00:00:00.000Z`)
    : undefined;

  return {
    extracted: {
      ...(merchant ? { merchant } : {}),
      ...(Number.isFinite(amount) && amount > 0 ? { amount } : {}),
      ...(expenseDate && !Number.isNaN(expenseDate.getTime()) ? { expenseDate } : {}),
    },
  };
};

const deleteReceiptImage = async (publicId) => {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
};

module.exports = { uploadReceiptImage, recognizeReceipt, deleteReceiptImage };