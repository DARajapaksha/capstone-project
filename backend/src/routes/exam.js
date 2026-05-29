const express = require('express');
const router = express.Router();
const { getAllExams, createExam, updateExam, deleteExam } = require('../controllers/examController');

// Get all exams
router.get('/', getAllExams);

// Create a new exam
router.post('/', createExam);

// Update an exam by ID
router.put('/:id', updateExam);

// Delete an exam by ID
router.delete('/:id', deleteExam);

module.exports = router;
