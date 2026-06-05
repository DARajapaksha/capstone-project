const admin = require('../config/firebase');

// GET all exams
const getAllExams = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('Exams').get();

    if (snapshot.empty) {
      return res.status(200).json({ exams: [] });
    }

    const examsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

    const db = admin.firestore();
    const newExamRef = db.collection('Exams').doc();

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
      exam: { id: newExamRef.id, ...examData }
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

    const db = admin.firestore();
    const examRef = db.collection('Exams').doc(id);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
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

    const updatedDoc = await examRef.get();
    return res.status(200).json({
      message: 'Exam updated successfully',
      exam: { id, ...updatedDoc.data() }
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

    const db = admin.firestore();
    const examRef = db.collection('Exams').doc(id);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // ── Cascade delete student enrollments ───────────────────────────────────
    // Find all students who have this exam in Student_Exams and Enrollments
    const studentExamsQuery = await db.collectionGroup('exams').where('examId', '==', id).get();

    if (!studentExamsQuery.empty) {
      const batch = db.batch();
      studentExamsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`[deleteExam] Removed ${studentExamsQuery.size} student enrollment(s) for exam ${id}`);
    }

    // ── Delete the exam itself ───────────────────────────────────────────────
    await examRef.delete();

    return res.status(200).json({ message: 'Exam deleted successfully', id });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = { getAllExams, createExam, updateExam, deleteExam };
