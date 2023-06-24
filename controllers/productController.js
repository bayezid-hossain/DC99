const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorhandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ApiFeatures = require('../utils/apifeatures');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const upload = require('../config/multerConfig');

//Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  const uploadPromise = new Promise((resolve, reject) => {
    upload.array('images')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A multer error occurred
        reject(
          new Error(
            'File upload failed: ' +
              err.message +
              ' ' +
              (err.field ? err.field : '')
          )
        );
      } else if (err) {
        // An unknown error occurred
        reject(err);
      } else {
        // No error occurred, resolve the Promise with the uploaded files
        resolve(req.files);
      }
    });
  });
  try {
    const files = await uploadPromise;
    const images = files.map((file) => file.filename);
    req.body.user = req.user.id;
    const bodyEntries = Object.entries(req.body);
    const obj = bodyEntries.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

    let productInfo = Object.assign({}, obj, { images: images });
    productInfo.category = Array.from(
      new Set(JSON.parse(productInfo.category).ids)
    );

    let product = await Product.create(productInfo);
    product = await product.populate('category');
    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
});

// Get all Products
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 100;

  const productCount = await Product.countDocuments();

  const apiFeature = new ApiFeatures(
    // Product.find().populate({
    //   path: 'category',
    //   model: 'Category',
    //   options: { strictPopulate: false },
    // }),
    // req.query
    Product.find(),
    req.query
  )
    .search()
    .filter()
    .pagination(resultPerPage);

  const products = await apiFeature.query;
  console.log('products sent');

  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.setHeader('Content-Range', `1-20/20`);

  res.status(200).json({ data: Array.from(products), total: productCount });
});

//Update product -- Admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  const uploadPromise = new Promise((resolve, reject) => {
    upload.array('newImages')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A multer error occurred
        reject(
          new Error(
            'File upload failed: ' +
              err.message +
              ' ' +
              (err.field ? err.field : '')
          )
        );
      } else if (err) {
        // An unknown error occurred
        reject(err);
      } else {
        // No error occurred, resolve the Promise with the uploaded files
        resolve(req.files);
      }
    });
  });
  try {
    let product = await Product.findById(req.params.id);
    const files = await uploadPromise;
    const newImages = files.map((file) => file.filename);
    req.body.user = req.user.id;
    const bodyEntries = Object.entries(req.body);
    const obj = bodyEntries.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
    let productInfo = Object.assign({}, obj, {
      images: newImages,
    });
    productInfo.category = Array.from(
      new Set(JSON.parse(productInfo.category).ids)
    );

    console.log(productInfo);
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...productInfo, images: [...product.images, ...productInfo.images] },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    console.log(product);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
});

// Get Product Details

exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('category');

  if (!product) {
    return next(new ErrorHandler('Product Not Found', 404));
  }

  res.status(200).json({
    success: true,
    product: product,
  });
});

//Delete Product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product Not Found', 404));
  }
  product.images.forEach((value) => deleteFile('uploads/' + value));
  await product.remove();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});
exports.deleteImage = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product Not Found', 404));
  }

  const objectId = new ObjectId.createFromHexString(req.params.id);

  const newProduct = await Product.updateOne(
    { _id: objectId },
    { $pull: { ['images']: req.params.imageid } }
  );
  deleteFile('uploads/' + req.params.imageid);
  console.log(req.params.id);
  console.log(req.params.imageid);
  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
  });
});

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log(`File ${filePath} has been deleted`);
  });
}

//Add Single Image of a Product -- Admin
exports.uploadMultipleImages = catchAsyncErrors(async (req, res, next) => {
  const uploadPromise = new Promise((resolve, reject) => {
    upload.array('images')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A multer error occurred
        reject(
          new Error(
            'File upload failed: ' +
              err.message +
              ' ' +
              (err.field ? err.field : '')
          )
        );
      } else if (err) {
        // An unknown error occurred
        reject(err);
      } else {
        // No error occurred, resolve the Promise with the uploaded files
        resolve(req.files);
      }
    });
  });
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler('Product Not Found', 404));
    }

    const files = await uploadPromise;

    const images = files.map((file) => file.filename);

    const objectId = new ObjectId.createFromHexString(req.params.id);

    await Product.updateOne(
      { _id: objectId },
      { $push: { images: { $each: images } } }
    );
    res.status(201).json({
      success: true,
      message: 'Added Successfully',
    });
  } catch (err) {
    next(err);
  }
});

exports.loadimage = catchAsyncErrors(async (req, res, next) => {
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(path.resolve('uploads/' + req.params.id));
});
