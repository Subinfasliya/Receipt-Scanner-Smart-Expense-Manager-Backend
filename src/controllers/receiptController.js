const Receipt = require("../models/receiptModel");
const Expense = require("../models/expenseModel");
const createError = require("../utils/createError");
const { successResponse } = require("../utils/apiResponse");
const {
  uploadReceiptImage,
  recognizeReceipt,
  deleteReceiptImage,
} = require("../services/receiptService");

const hasSupportedImageSignature = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return true;
  return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
};

const createReceipt = async (req, res, next) => {
  let upload;
  try {
    if (!req.file || !hasSupportedImageSignature(req.file.buffer)) {
      throw createError(400, "A valid JPEG, PNG, or WebP receipt image is required");
    }
    upload = await uploadReceiptImage(req.file.buffer, req.user._id);
    const ocr = await recognizeReceipt(req.file.buffer);
    const receipt = await Receipt.create({
      userId: req.user._id,
      publicId: upload.public_id,
      secureUrl: upload.secure_url,
      format: upload.format,
      bytes: upload.bytes,
      extracted: ocr.extracted,
    });
    return successResponse(res, 201, "Receipt uploaded and scanned", receipt);
  } catch (error) {
    if (upload?.public_id) {
      await deleteReceiptImage(upload.public_id).catch(() => {});
    }
    return next(error);
  }
};

const listReceipts = async (req, res, next) => {
  try {
    const receipts = await Receipt.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return successResponse(res, 200, "Receipts retrieved successfully", receipts);
  } catch (error) {
    return next(error);
  }
};

const getReceipt = (req, res) =>
  successResponse(res, 200, "Receipt retrieved successfully", req.resource);

const deleteReceipt = async (req, res, next) => {
  try {
    await deleteReceiptImage(req.resource.publicId);
    await req.resource.deleteOne();
    return successResponse(res, 200, "Receipt deleted successfully");
  } catch (error) {
    return next(error);
  }
};

const createExpenseFromReceipt = async (req, res, next) => {
  try {
    const receipt = req.resource;
    if (receipt.expenseId) throw createError(409, "Receipt is already linked to an expense");
    const amount = req.body.amount ?? receipt.extracted.amount;
    if (!amount) throw createError(422, "Provide the expense amount because OCR could not identify it");
    const idempotencyKey = `receipt:${receipt._id}`;
    let expense;
    try {
      expense = await Expense.create({
        userId: req.user._id,
        merchant: req.body.merchant || receipt.extracted.merchant || "Receipt purchase",
        amount,
        category: req.body.category,
        expenseDate: req.body.expenseDate || receipt.extracted.expenseDate || new Date(),
        idempotencyKey,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      expense = await Expense.findOne({ userId: req.user._id, idempotencyKey }).select("+idempotencyKey");
      if (!expense) throw error;
    }
    receipt.expenseId = expense._id;
    await receipt.save();
    return successResponse(res, 201, "Expense created from receipt", expense);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReceipt,
  listReceipts,
  getReceipt,
  deleteReceipt,
  createExpenseFromReceipt,
};