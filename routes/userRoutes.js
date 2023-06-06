const express = require('express');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

const {
  registerUser,
  logout,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUser,
  getSingleUser,
  updateUserRole,
  deleteUser,
  checkAuth,
} = require('../controllers/userController');
const router = express.Router();

router.route('/register').post(registerUser);

router.route('/login').post(loginUser);
router
  .route('/auth/checkauth')
  .get(isAuthenticatedUser, authorizeRoles('admin'), checkAuth);
router.route('/password/forgot').post(forgotPassword);

router.route('/password/reset/:token').put(resetPassword);

router.route('/logout').get(logout);

router.route('/me').get(isAuthenticatedUser, getUserDetails);

router.route('/password/update').put(isAuthenticatedUser, updatePassword);
router.route('/me/update').put(isAuthenticatedUser, updateProfile);

router
  .route('/admin/users')
  .get(isAuthenticatedUser, authorizeRoles('admin'), getAllUser);

router
  .route('/admin/users/:id')
  .get(isAuthenticatedUser, authorizeRoles('admin'), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles('admin'), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser);

module.exports = router;
