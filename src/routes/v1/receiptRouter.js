const multer = require("multer");
const rateLimit = require("express-rate-limit");
const Joi = require("joi");
const receiptController = require("../../controllers/receiptController");
const protect = require("../../middlewares/auth/authMiddleware");
const requirePremium = require("../../middlewares/auth/requirePremium");
const { requireOwnership } = require("../../middlewares/ownershipMiddleware");
const Receipt = require("../../models/receiptModel");
const validate = require("../../middlewares/validate");
const createError = require("../../utils/createError");
const auditRequest = require("../../middlewares/auditRequest");

const receiptRouter = require("express").Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    callback(allowed.includes(file.mimetype) ? null : createError(400, "Only JPEG, PNG, and WebP images are accepted"), allowed.includes(file.mimetype));
  },
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const handleUpload = (req, res, next) => {
  upload.single("receipt")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return next(createError(error.code === "LIMIT_FILE_SIZE" ? 413 : 400, "Receipt upload rejected"));
    }
    return next(error);
  });
};

const expenseFromReceiptSchema = Joi.object({
  merchant: Joi.string().trim().min(1).max(120),
  amount: Joi.number().positive().precision(2),
  category: Joi.string().trim().max(80).allow("", null),
  expenseDate: Joi.date().max("now"),
}).min(1);

receiptRouter.get("/", protect, receiptController.listReceipts);
receiptRouter.post("/", protect, requirePremium, uploadLimiter, auditRequest, handleUpload, receiptController.createReceipt);
receiptRouter.get("/:id", protect, requireOwnership({ Model: Receipt }), receiptController.getReceipt);
receiptRouter.delete("/:id", protect, requireOwnership({ Model: Receipt }), auditRequest, receiptController.deleteReceipt);
receiptRouter.post(
  "/:id/expense",
  protect,
  requireOwnership({ Model: Receipt }),
  auditRequest,
  validate(expenseFromReceiptSchema),
  receiptController.createExpenseFromReceipt,
);

module.exports = receiptRouter;