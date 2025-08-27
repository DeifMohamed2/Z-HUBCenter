const tableBody = document.querySelector('#adminStudentsTable tbody');
const spinner = document.getElementById('spinner');
const searchInput = document.getElementById('searchInput');
const paymentTypeFilter = document.getElementById('paymentTypeFilter');
const teacherFilter = document.getElementById('teacherFilter');
const courseFilter = document.getElementById('courseFilter');
const startDateFilter = document.getElementById('startDateFilter');
const endDateFilter = document.getElementById('endDateFilter');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const exportBtn = document.getElementById('exportBtn');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const pagination = document.getElementById('pagination');
const tableInfo = document.getElementById('tableInfo');

let allStudents = [];
let filtered = [];
let currentPage = 1;
let pageSize = 20;

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try { return new Date(dateStr).toLocaleDateString('en-GB'); } catch { return 'N/A'; }
}

function paginateRows(rows) {
  const start = (currentPage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

function renderPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  pagination.innerHTML = '';
  const add = (label, page, disabled=false, active=false) => {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
    li.innerHTML = `<button class="page-link">${label}</button>`;
    if (!disabled) li.addEventListener('click', () => { currentPage = page; renderTable(filtered); });
    pagination.appendChild(li);
  };
  add('«', Math.max(1, currentPage - 1), currentPage === 1);
  for (let p = 1; p <= totalPages; p++) add(p, p, false, p === currentPage);
  add('»', Math.min(totalPages, currentPage + 1), currentPage === totalPages);
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  tableInfo.textContent = `Showing ${total ? start : 0}-${end} of ${total}`;
}

function renderTable(rows) {
  const pageRows = paginateRows(rows);
  tableBody.innerHTML = '';
  pageRows.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center">${(currentPage - 1) * pageSize + idx + 1}</td>
      <td class="text-center">${s.studentName || ''}</td>
      <td class="text-center">${s.studentPhoneNumber || ''}</td>
      <td class="text-center">${s.studentParentPhone || ''}</td>
      <td class="text-center">${s.studentCode || ''}</td>
      <td class="text-center">${s.paymentType === 'perCourse' ? 'Per Course' : 'Per Session'}</td>
      <td class="text-center">${formatDate(s.createdAt)}</td>
      <td class="text-center">
        <button class="btn btn-danger btn-sm" data-id="${s._id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // bind delete
  tableBody.querySelectorAll('button.btn-danger').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm('Are you sure you want to delete this student?')) return;
      try {
        const res = await fetch(`/admin/delete-student/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        allStudents = allStudents.filter(s => s._id !== id);
        renderTable(allStudents);
      } catch (err) {
        alert('Failed to delete student');
      }
    });
  });
  renderPagination(rows.length);
}

async function loadStudents() {
  spinner.classList.remove('d-none');
  try {
    const res = await fetch('/admin/all-students');
    if (!res.ok) throw new Error('Fetch failed');
    allStudents = await res.json();
    await loadTeachers();
    applyFilters();
  } catch (e) {
    console.error(e);
  } finally {
    spinner.classList.add('d-none');
  }
}

async function loadTeachers() {
  try {
    const res = await fetch('/admin/teachers');
    if (!res.ok) return;
    const teachers = await res.json();
    teachers.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t._id;
      opt.textContent = t.teacherName;
      teacherFilter.appendChild(opt);
    });
  } catch {}
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const pay = paymentTypeFilter.value;
  const teacherId = teacherFilter.value;
  const course = courseFilter.value.trim().toLowerCase();
  const start = startDateFilter.value ? new Date(startDateFilter.value) : null;
  const end = endDateFilter.value ? new Date(endDateFilter.value) : null;
  if (end) end.setHours(23,59,59,999);

  filtered = allStudents.filter(s => {
    if (q && !((s.studentName||'').toLowerCase().includes(q) || (s.studentCode||'').toLowerCase().includes(q) || (s.studentPhoneNumber||'').toLowerCase().includes(q))) return false;
    if (pay && s.paymentType !== pay) return false;
    if (teacherId) {
      const hasTeacher = Array.isArray(s.selectedTeachers) && s.selectedTeachers.some(t => (t.teacherId && (t.teacherId._id||t.teacherId) === teacherId));
      if (!hasTeacher) return false;
    }
    if (course) {
      const hasCourse = Array.isArray(s.selectedTeachers) && s.selectedTeachers.some(t => Array.isArray(t.courses) && t.courses.some(c => (c.courseName||'').toLowerCase().includes(course)));
      if (!hasCourse) return false;
    }
    if (start || end) {
      const created = new Date(s.createdAt);
      if (start && created < start) return false;
      if (end && created > end) return false;
    }
    return true;
  });
  currentPage = 1;
  renderTable(filtered);
}

applyFiltersBtn.addEventListener('click', applyFilters);
resetFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  paymentTypeFilter.value = '';
  teacherFilter.value = '';
  courseFilter.value = '';
  startDateFilter.value = '';
  endDateFilter.value = '';
  applyFilters();
});

pageSizeSelect.addEventListener('change', () => {
  pageSize = parseInt(pageSizeSelect.value, 10) || 20;
  currentPage = 1;
  renderTable(filtered);
});

searchInput.addEventListener('input', applyFilters);

exportBtn.addEventListener('click', () => {
  const rows = filtered.length ? filtered : allStudents;
  const headers = ['#','Name','Phone','Parent Phone','Code','Payment','Added'];
  const data = rows.map((s, i) => [i+1, s.studentName, s.studentPhoneNumber, s.studentParentPhone, s.studentCode, (s.paymentType==='perCourse'?'Per Course':'Per Session'), formatDate(s.createdAt)]);
  const csv = [headers.join(','), ...data.map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students.csv';
  a.click();
  URL.revokeObjectURL(url);
});

document.addEventListener('DOMContentLoaded', loadStudents);


