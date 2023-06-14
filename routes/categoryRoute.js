const express = require('express');
const {
  newCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getSingleCategory,
} = require('../controllers/categoryController');

const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router
  .route('/admin/categories/new')
  .post(isAuthenticatedUser, authorizeRoles('admin'), newCategory);
router
  .route('/admin/categories/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'), updateCategory)
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);
router.route('/categories/:id').get(getSingleCategory);
router.route('/categories').get(getAllCategories);

module.exports = router;
