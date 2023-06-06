const Category = require('../models/categoryModel');
const fs = require('fs');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorhandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const upload = require('../config/multerConfig');
const ApiFeatures = require('../utils/apifeatures');
//Create new category

exports.newCategory = [
  // Use multer middleware to handle the file upload
  upload.single('image'),

  catchAsyncErrors(async (req, res, next) => {
    const { name, description } = req.body;

    // Retrieve the uploaded image file
    const image = req.file;

    const category = await Category.create({
      name,
      description,
      image: image.filename, // Save the filename in the category document
      createdAt: Date.now(),
    });

    res.status(200).json({
      success: true,
      category,
    });
  }),
];

//get single category

exports.getSingleCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    next(new ErrorHandler('Category not found with id ', 404));
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

//get all categories -- admin

exports.getAllCategories = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 100;

  const categoriesCount = await Category.countDocuments();

  const apiFeature = new ApiFeatures(Category.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  const categories = await apiFeature.query;
  console.log('categories sent');
  // const startIndex = (req.query._start || 0) * 1;
  // const endIndex = (req.query._end || startIndex + 9) * 1;
  // const totalCount = products.length;
  // const slicedPosts = products.slice(startIndex, endIndex);
  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
  res.setHeader('X-Total-Count', `1-20/${categoriesCount}`);

  res.status(200).json({
    data: categories,
  });
});

//update Category -- admin
exports.updateCategory = [
  upload.single('image'),
  catchAsyncErrors(async (req, res, next) => {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler('Category Not Found', 404));
    }

    // Check if a new file is uploaded
    if (req.file) {
      // Retrieve the uploaded image file
      const image = req.file;

      // Delete the old file, if it exists
      if (category.image) {
        deleteFile(`uploads/${category.image}`);
      }

      // Update the category with the new file
      category = await Category.findByIdAndUpdate(
        req.params.id,
        { ...req.body, image: image.filename },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );
    } else {
      // Update the category without modifying the image field
      category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  }),
];

//delete category --admin

exports.deleteCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    next(new ErrorHandler('Category not found with id ', 404));
  }
  Product.updateMany(
    { category: category._id },
    { $pull: { category: category._id } },
    (err, result) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`${result.modifiedCount} products updated`);
      // Respond with success message
      deleteFile('uploads/' + category.image);
      category.remove();
      res.status(200).json({
        success: true,
      });
    }
  );
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
