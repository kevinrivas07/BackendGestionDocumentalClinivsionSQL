const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/asistencias', adminController.getAllAsistencias);
router.get("/admin/pdfs", adminController.getAllPdfs);

module.exports = router;
