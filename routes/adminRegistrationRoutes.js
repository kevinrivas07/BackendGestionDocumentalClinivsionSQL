const express = require('express');
const router = express.Router();
const { adminRegistration } = require('../controllers/adminRegistrationController');

// Ruta para registrar un administrador
router.post('/', adminRegistration);

module.exports = router;
