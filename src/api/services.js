// src/api/services.js
// All API calls in one place — organized by domain.
// Every function returns response.data.data (the actual payload).
// Error handling is done by the axios interceptor + individual catch blocks.

import api from './axios';

// ── Helper ────────────────────────────────────────────────────────────────────
const getData = (res) => res.data.data;

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════
export const authAPI = {
  login:   (code)  => api.post('/auth/login', { code }).then(getData),
  refresh: ()      => api.post('/auth/refresh').then(getData),
  logout:  ()      => api.post('/auth/logout'),
  me:      ()      => api.get('/auth/me').then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENTS (teacher)
// ══════════════════════════════════════════════════════════════════════════════
export const studentsAPI = {
  getAll:       (params)      => api.get('/students', { params }).then(getData),
  getByYear:    ()            => api.get('/students/by-year').then(getData),
  getOne:       (id)          => api.get(`/students/${id}`).then(getData),
  getReport:    (id)          => api.get(`/students/${id}/report`).then(getData),
  create:       (data)        => api.post('/students', data).then(getData),
  update:       (id, data)    => api.put(`/students/${id}`, data).then(getData),
  remove:       (id)          => api.delete(`/students/${id}`).then(getData),
  toggleStatus: (id)          => api.patch(`/students/${id}/toggle-status`).then(getData),
  resetCode:    (id)          => api.post(`/students/${id}/reset-code`).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// GROUPS (teacher)
// ══════════════════════════════════════════════════════════════════════════════
export const groupsAPI = {
  getAll:      (params)   => api.get('/groups', { params }).then(getData),
  getOne:      (id)       => api.get(`/groups/${id}`).then(getData),
  getStudents: (id)       => api.get(`/groups/${id}/students`).then(getData),
  create:      (data)     => api.post('/groups', data).then(getData),
  update:      (id, data) => api.put(`/groups/${id}`, data).then(getData),
  remove:      (id)       => api.delete(`/groups/${id}`).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ══════════════════════════════════════════════════════════════════════════════
export const attendanceAPI = {
  getSheet:       (groupId, date) => api.get('/attendance', { params: { group: groupId, date } }).then(getData),
  getDates:       (groupId)       => api.get('/attendance/dates', { params: { group: groupId } }).then(getData),
  getStudentHistory: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }).then(getData),
  getGroupStats:  (groupId, params) => api.get(`/attendance/stats/${groupId}`, { params }).then(getData),
  bulkSubmit:     (data)          => api.post('/attendance/bulk', data).then(getData),
  updateRecord:   (id, data)      => api.patch(`/attendance/${id}`, data).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// MONTHS (الحضور والفلوس — الشهور)
// ══════════════════════════════════════════════════════════════════════════════
export const monthsAPI = {
  getAll:  (groupId)        => api.get('/months', { params: { group: groupId } }).then(getData),
  create:  (data)           => api.post('/months', data).then(getData),
  update:  (id, data)       => api.patch(`/months/${id}`, data).then(getData),
  remove:  (id)             => api.delete(`/months/${id}`).then(getData),
  getUnpaid: (groupId)      => api.get('/months/unpaid', { params: { group: groupId } }).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// SESSIONS (الحضور والفلوس — الحصص)
// ══════════════════════════════════════════════════════════════════════════════
export const sessionsAPI = {
  getAll:          (monthId)      => api.get('/sessions', { params: { month: monthId } }).then(getData),
  create:          (data)         => api.post('/sessions', data).then(getData),
  update:          (id, data)     => api.patch(`/sessions/${id}`, data).then(getData),
  remove:          (id)           => api.delete(`/sessions/${id}`).then(getData),
  getSheet:        (id)           => api.get(`/sessions/${id}/sheet`).then(getData),
  submitAttendance:(id, records)  => api.post(`/sessions/${id}/attendance`, { records }).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════
export const paymentsAPI = {
  getGroup:         (params)             => api.get('/payments', { params }).then(getData),
  getStudent:       (studentId)          => api.get(`/payments/student/${studentId}`).then(getData),
  getSummary:       (year)               => api.get('/payments/summary', { params: { year } }).then(getData),
  create:           (data)               => api.post('/payments', data).then(getData),
  update:           (paymentId, data)    => api.patch(`/payments/${paymentId}`, data).then(getData),
  addInstallment:   (paymentId, data)    => api.post(`/payments/${paymentId}/installments`, data).then(getData),
  updateInstallment:(paymentId, instId, data) => api.patch(`/payments/${paymentId}/installments/${instId}`, data).then(getData),
  deleteInstallment:(paymentId, instId)  => api.delete(`/payments/${paymentId}/installments/${instId}`).then(getData),
  updatePeriod: (id, month) => api.patch(`/payments/${id}/period`, { month }).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// EXAMS
// ══════════════════════════════════════════════════════════════════════════════
export const examsAPI = {
  getAll:            (params)      => api.get('/exams', { params }).then(getData),
  getOne:            (id)          => api.get(`/exams/${id}`).then(getData),
  create:            (data)        => api.post('/exams', data).then(getData),
  update:            (id, data)    => api.put(`/exams/${id}`, data).then(getData),
  remove:            (id)          => api.delete(`/exams/${id}`).then(getData),
  changeStatus:      (id, status)  => api.patch(`/exams/${id}/status`, { status }).then(getData),
  submit:            (id, data)    => api.post(`/exams/${id}/submit`, data).then(getData),
  myResult:          (id)          => api.get(`/exams/${id}/my-result`).then(getData),
  results:           (id)          => api.get(`/exams/${id}/results`).then(getData),
  uploadAnswerSheet: (id, fd)      => api.post(`/exams/${id}/answer-sheet`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(getData),
  deleteAnswerSheet: (id)          => api.delete(`/exams/${id}/answer-sheet`).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// GRADES
// ══════════════════════════════════════════════════════════════════════════════
export const gradesAPI = {
  getExamSheet:   (examId)        => api.get('/grades', { params: { exam: examId } }).then(getData),
  getStudent:     (studentId)     => api.get(`/grades/student/${studentId}`).then(getData),
  getRankings:    (year, type)    => api.get('/grades/rankings', { params: { year, type } }).then(getData),
  enter:          (data)          => api.post('/grades', data).then(getData),
  bulkEnter:      (data)          => api.post('/grades/bulk', data).then(getData),
  update:         (id, data)      => api.put(`/grades/${id}`, data).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// POINTS
// ══════════════════════════════════════════════════════════════════════════════
export const pointsAPI = {
  getLeaderboard: (params)    => api.get('/points', { params }).then(getData),
  getStudent:     (studentId, params) => api.get(`/points/student/${studentId}`, { params }).then(getData),
  add:            (data)      => api.post('/points', data).then(getData),
  remove:         (id)        => api.delete(`/points/${id}`).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// NOTES
// ══════════════════════════════════════════════════════════════════════════════
export const notesAPI = {
  getAll:        (params)    => api.get('/notes', { params }).then(getData),
  getForStudent: (studentId) => api.get(`/notes/student/${studentId}`).then(getData),
  create:        (data)      => api.post('/notes', data).then(getData),
  remove:        (id)        => api.delete(`/notes/${id}`).then(getData),
  // الثلاث سطور الجداد اللي ضافهم Claude:
  markRead:      (id)        => api.patch(`/notes/${id}/read`).then(getData),
  markAllRead:   ()          => api.patch('/notes/mark-all-read').then(getData),
  unreadCount:   ()          => api.get('/notes/unread-count').then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// LESSONS (online)
// ══════════════════════════════════════════════════════════════════════════════
export const lessonsAPI = {
  getAll:        (params)      => api.get('/lessons', { params }).then(getData),
  getOne:        (id)          => api.get(`/lessons/${id}`).then(getData),
  getViewers:    (id)          => api.get(`/lessons/${id}/viewers`).then(getData),
  getStreamInfo: (id)          => api.get(`/lessons/${id}/stream`).then(getData),
  create:        (data)        => api.post('/lessons', data).then(getData),
  update:        (id, data)    => api.put(`/lessons/${id}`, data).then(getData),
  remove:        (id)          => {
    if (!id) return Promise.reject(new Error('Lesson id is required to delete'));
    return api.delete(`/lessons/${id}`).then(getData);
  },
  togglePublish: (id)          => api.patch(`/lessons/${id}/publish`).then(getData),
  reorder:       (lessons)     => api.patch('/lessons/reorder', { lessons }).then(getData),
  heartbeat:     (id, data)    => api.post(`/lessons/${id}/heartbeat`, data).then(getData),
  markWatched:   (id, data)    => api.post(`/lessons/${id}/watch`, data).then(getData),
  // Content items
  addItem:       (id, data)    => api.post(`/lessons/${id}/items`, data).then(getData),
  uploadFile:    (id, fd)      => api.post(`/lessons/${id}/items/upload`, fd, { headers:{'Content-Type':'multipart/form-data'} }).then(getData),
  updateItem:    (id, iid, d)  => api.patch(`/lessons/${id}/items/${iid}`, d).then(getData),
  deleteItem:    (id, iid)     => api.delete(`/lessons/${id}/items/${iid}`).then(getData),
  reorderItems:  (id, order)   => api.patch(`/lessons/${id}/items/reorder`, { order }).then(getData),
};


// ══════════════════════════════════════════════════════════════════════════════
// ACCOUNT
// ══════════════════════════════════════════════════════════════════════════════
export const accountAPI = {
  getMe:       ()         => api.get('/account/me').then(getData),
  uploadAvatar:(formData) => api.post('/account/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(getData),
  removeAvatar:()         => api.delete('/account/avatar').then(getData),
  changeCode:  (data)     => api.patch('/account/change-code', data).then(getData),
  updateInfo:  (data)     => api.patch('/account/update-info', data).then(getData),
};



// ══════════════════════════════════════════════════════════════════════════════
// HEROES
// ══════════════════════════════════════════════════════════════════════════════
export const heroesAPI = {
  // Albums
  getAll:       ()              => api.get('/heroes').then(getData),
  getOne:       (id)            => api.get(`/heroes/${id}`).then(getData),
  create:       (data)          => api.post('/heroes', data).then(getData),
  update:       (id, data)      => api.put(`/heroes/${id}`, data).then(getData),
  remove:       (id)            => api.delete(`/heroes/${id}`).then(getData),
  // Photos
  addPhotos:    (id, fd)        => api.post(`/heroes/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(getData),
  updatePhoto:  (aid, pid, d)   => api.patch(`/heroes/${aid}/photos/${pid}`, d).then(getData),
  deletePhoto:  (aid, pid)      => api.delete(`/heroes/${aid}/photos/${pid}`).then(getData),
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT SELF (student-facing)
// ══════════════════════════════════════════════════════════════════════════════
export const studentAPI = {
  me:           ()        => api.get('/student/me').then(getData),
  attendance:   (params)  => api.get('/student/attendance', { params }).then(getData),
  payments:     ()        => api.get('/student/payments').then(getData),
  grades:       ()        => api.get('/student/grades').then(getData),
  points:       (params)  => api.get('/student/points', { params }).then(getData),
  rank:         ()        => api.get('/student/rank').then(getData),
  notes:        ()        => api.get('/student/notes').then(getData),
  lessons:      (params)  => api.get('/student/lessons', { params }).then(getData),
  report:       ()        => api.get('/student/report').then(getData),
};