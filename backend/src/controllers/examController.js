const admin = require('../config/firebase');

// GET all exams
const getAllExams = async (req, res) => {
  try {
    const db = admin.database();
    const examsRef = db.ref('Exams');
    const snapshot = await examsRef.once('value');

    if (!snapshot.exists()) {
      return res.status(200).json({ exams: [] });
    }

    const examsData = snapshot.val();
    const examsList = Object.keys(examsData).map(key => ({
      id: key,
      ...examsData[key]
    }));

    // Sort by date ascending
    examsList.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ exams: examsList });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST create a new exam
const createExam = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      description,
      date,
      time,
      duration,
      proctoring,
      capacity,
      status
    } = req.body;

    if (!courseCode || !courseName || !date || !time) {
      return res.status(400).json({ error: 'courseCode, courseName, date, and time are required.' });
    }

    const db = admin.database();
    const examsRef = db.ref('Exams');
    const newExamRef = examsRef.push();

    const examData = {
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      description: description || '',
      date,
      time,
      duration: parseFloat(duration) || 1,
      proctoring: proctoring || 'Online Proctored',
      capacity: parseInt(capacity) || 50,
      enrolled: 0,
      status: status || 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await newExamRef.set(examData);

    return res.status(201).json({
      message: 'Exam created successfully',
      exam: { id: newExamRef.key, ...examData }
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT update an exam
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Exam ID is required.' });
    }

    const db = admin.database();
    const examRef = db.ref(`Exams/${id}`);
    const snapshot = await examRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const allowedFields = [
      'courseCode', 'courseName', 'description', 'date',
      'time', 'duration', 'proctoring', 'capacity', 'enrolled', 'status'
    ];

    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    filteredUpdates.updatedAt = new Date().toISOString();

    await examRef.update(filteredUpdates);

    const updatedSnapshot = await examRef.once('value');
    return res.status(200).json({
      message: 'Exam updated successfully',
      exam: { id, ...updatedSnapshot.val() }
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE an exam
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Exam ID is required.' });
    }

    const db = admin.database();
    const examRef = db.ref(`Exams/${id}`);
    const snapshot = await examRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    await examRef.remove();

    return res.status(200).json({ message: 'Exam deleted successfully', id });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { getAllExams, createExam, updateExam, deleteExam };
