
const addStudentForm = document.getElementById('addStudentForm');
const spinner = document.getElementById('spinner');
const spinner2 = document.getElementById('spinner2');
const successToast = document.getElementById('successToast');
const messageToast = document.getElementById('messageToast');
const errorMessage = document.getElementById('errorMessage');
const searchStudent = document.getElementById('searchStudent');
const filterTeacherSelection = document.getElementById('filterCourseSelection');
const searchButton = document.getElementById('searchButton');
const studentTableBody = document.querySelector('#studentTable tbody'); // Target tbody
const sendWaButton = document.getElementById('sendWaButton');
const waTeacherSelection = document.getElementById('waTeacherSelection');
const waMessage = document.getElementById('waMessage');
const addNewStudentBtn = document.getElementById('addNewStudentBtn');

let sequenceOfStudets = 0;

async function addNewStudent(event) {
  event.preventDefault();
  addNewStudentBtn.disabled = true;
  spinner.classList.remove('d-none');

  const studentName = document.getElementById('studentName').value;
  const studentPhoneNumber =
    document.getElementById('studentPhoneNumber').value;
  const studentParentPhone =
    document.getElementById('studentParentPhone').value;
  const schoolName = document.getElementById('schoolName').value;
  const paymentType = document.getElementById('paymentType').value;

  const selectedTeachers = [];
  document
    .querySelectorAll('input[name="teachers[]"]:checked')
    .forEach((teacherCheckbox) => {
      const teacherId = teacherCheckbox.value;
      const selectedCourses = [];

      document
        .querySelectorAll(
          `input[name="selectedCourses[${teacherId}][]"]:checked`
        )
        .forEach((courseCheckbox) => {
          const courseName = courseCheckbox.value;
          const amountPay = document.getElementById(
            `price_${courseName}_${teacherId}`
          ).value;
          const registerPrice = document.getElementById(
            `registerPrice_${courseName}_${teacherId}`
          ).value;

          if (courseName && amountPay && registerPrice) {
            selectedCourses.push({ courseName, amountPay, registerPrice });
          }
        });

      if (selectedCourses.length > 0) {
        selectedTeachers.push({ teacherId, courses: selectedCourses });
      }
    });

  const data = {
    studentName,
    studentPhoneNumber,
    studentParentPhone,
    schoolName,
    paymentType,
    selectedTeachers,
  };

  console.log(data);

  try {
    const response = await fetch('/employee/add-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (response.ok) {
      successToast.classList.add('show');
      messageToast.innerHTML = 'تم إضافة الطالب بنجاح';
      addStudentForm.reset();
      document
        .querySelectorAll('input[name="teachers[]"]')
        .forEach((checkbox) => {
          checkbox.checked = false;
        });
      document
        .querySelectorAll('input[name^="selectedCourses"]')
        .forEach((checkbox) => {
          checkbox.checked = false;
        });
      document
        .querySelectorAll('input[id^="price_"], input[id^="registerPrice_"]')
        .forEach((input) => {
          input.value = '';
          input.disabled = true;
          input.required = false;
        });
      document.querySelectorAll('.courses-container').forEach((container) => {
        container.style.display = 'none';
      });
      spinner.classList.add('d-none');
      addNewStudentBtn.disabled = false;
    } else {
      errorMessage.classList.add('show');
      errorMessage.innerHTML = responseData.message;
      spinner.classList.add('d-none');
      addNewStudentBtn.disabled = false;
    }
  } catch (error) {
    errorMessage.classList.add('show');
    errorMessage.innerHTML = 'حدث خطأ. يرجى المحاولة لاحقًا.';
    spinner.classList.add('d-none');
    addNewStudentBtn.disabled = false;
  }
}

addStudentForm.addEventListener('submit', addNewStudent);

// Addcourses to Student
function toggleCourses(teacherId) {
  const coursesContainer = document.getElementById(`courses_${teacherId}`);
  const teacherCheckbox = document.getElementById(`teacher_${teacherId}`);

  if (teacherCheckbox.checked) {
    coursesContainer.style.display = 'block';
  } else {
    coursesContainer.style.display = 'none';
    // Uncheck all courses if the teacher is deselected
    coursesContainer
      .querySelectorAll('input[type="checkbox"]')
      .forEach((course) => {
        course.checked = false;
      });
  }
}

function toggleCoursePrice(courseCheckbox, teacherId, courseName) {
  const priceInput = document.getElementById(
    `price_${courseName}_${teacherId}`
  );
  const registerPriceInput = document.getElementById(
    `registerPrice_${courseName}_${teacherId}`
  );

  if (courseCheckbox.checked) {
    priceInput.disabled = false;
    priceInput.required = true;
    registerPriceInput.disabled = false;
    registerPriceInput.required = true;
  } else {
    priceInput.disabled = true;
    priceInput.required = false;
    priceInput.value = '';

    registerPriceInput.disabled = true;
    registerPriceInput.required = false;
    registerPriceInput.value = '';
  }
}

// Get ALL Students

const studentTable = document.getElementById('studentTable');

// Function to add students to the tbody
const addStudentToTable = (student) => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="text-center">${++sequenceOfStudets}</td>
    <td class="text-center">${student.studentName}</td>
    <td class="text-center">${student.studentPhoneNumber}</td>
    <td class="text-center">${student.studentParentPhone}</td>
    <td class="text-center">${student.studentCode}</td>

    <td class="text-center">${
      student.paymentType == 'perSession' ? 'Per Session' : 'Per Course'
    }</td>
    <td class="text-center">
      ${
        student.createdAt
          ? new Date(student.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : 'N/A'
      }
    </td>
    <td class="align-middle text-center">
      <button class="edit-student-btn mt-2" data-id="${student._id}" 
      data-bs-toggle="modal" data-bs-target="#editStudentModal">Edit</button>
    </td>

    

    <td class="align-middle text-center">
      <button class="send-code-btn mt-2" data-id="${
        student._id
      }">Send Code</button>
    </td>
    <td class="align-middle text-center">
      <button class="delete-student-btn mt-2" data-id="${student._id}">Delete</button>
    </td>
    `;

  studentTableBody.appendChild(tr);

  // Attach the event listener for the edit button dynamically
  tr.querySelector('.edit-student-btn').addEventListener('click', () => {
    openEditModal(student._id);
  });

  // Attach event listener for the delete button
  tr.querySelector('.delete-student-btn').addEventListener('click', () => {
    deleteStudent(student._id);
  });

  // Attach event listener for the send code button
  tr.querySelector('.send-code-btn').addEventListener('click', () => {
    sendCodeAgain(student._id);
  });
};

// Function to clear tbody before adding new rows
const clearStudentTable = () => {
  studentTableBody.innerHTML = '';
};

const getStudents = async () => {
  try {
    const response = await fetch('/employee/all-students');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const students = await response.json();
    console.log(students);
    console.log(students);
    clearStudentTable(); // Clear the table before populating
    sequenceOfStudets = 0;
    students.forEach(addStudentToTable); // Add each student to the table
  } catch (error) {
    console.error(error);
  }
};

document.addEventListener('DOMContentLoaded', getStudents);

// Open Edit Modal
const openEditModal = async (id) => {
  try {
    const response = await fetch(`/employee/get-student/${id}`);
    if (!response.ok) throw new Error('Failed to fetch student details');

    const student = await response.json();
    console.log(student);

    // Populate basic student info
    document.getElementById('editStudentName').value = student.studentName;
    document.getElementById('editStudentPhone').value =
      student.studentPhoneNumber;
    document.getElementById('editStudentParentPhone').value =
      student.studentParentPhone;
    document.getElementById('editStudentId').value = student._id;

    // Reset all checkboxes and fields
    document
      .querySelectorAll('input[name="editTeachers[]"]')
      .forEach((input) => {
        input.checked = false;
      });
    document
      .querySelectorAll('input[name^="editSelectedCourses"]')
      .forEach((input) => {
        input.checked = false;
      });
    document
      .querySelectorAll(
        'input[id^="edit_price_"], input[id^="edit_registerPrice_"], input[id^="edit_amountRemaining_"]'
      )
      .forEach((input) => {
        input.value = '';
        input.disabled = true;
      });
    document
      .querySelectorAll('.edit-courses-container')
      .forEach((container) => {
        container.style.display = 'none';
      });

    // Mark selected teachers and courses
    student.selectedTeachers.forEach(({ teacherId, courses }) => {
      const teacherCheckbox = document.getElementById(
        `edit_teacher_${teacherId._id}`
      );

      if (teacherCheckbox) {
        teacherCheckbox.checked = true;
        toggleEditCourses(teacherId._id); // Show the teacher's courses

        courses.forEach(
          ({ courseName, amountPay, registerPrice, amountRemaining }) => {
            const courseCheckbox = document.getElementById(
              `edit_course_${courseName}_${teacherId._id}`
            );
            const priceInput = document.getElementById(
              `edit_price_${courseName}_${teacherId._id}`
            );
            const registerPriceInput = document.getElementById(
              `edit_registerPrice_${courseName}_${teacherId._id}`
            );
            const amountRemainingInput = document.getElementById(
              `edit_amountRemaining_${courseName}_${teacherId._id}`
            );

            if (courseCheckbox) {
              courseCheckbox.checked = true;
              toggleEditCoursePrice(courseCheckbox, teacherId._id, courseName); // Enable inputs
              priceInput.value = amountPay;
              registerPriceInput.value = registerPrice;
              amountRemainingInput.value = amountRemaining;
            }
          }
        );
      }
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    alert('حدثت مشكلة أثناء تحميل بيانات الطالب.');
  }
};

function toggleEditCourses(teacherId) {
  const coursesContainer = document.getElementById(`edit_courses_${teacherId}`);
  const teacherCheckbox = document.getElementById(`edit_teacher_${teacherId}`);

  coursesContainer.style.display = teacherCheckbox.checked ? 'block' : 'none';

  // Uncheck all courses if teacher is deselected
  if (!teacherCheckbox.checked) {
    coursesContainer
      .querySelectorAll('input[type="checkbox"]')
      .forEach((course) => {
        course.checked = false;
      });
  }
}

function toggleEditCoursePrice(courseCheckbox, teacherId, courseName) {
  const priceInput = document.getElementById(
    `edit_price_${courseName}_${teacherId}`
  );
  const registerPriceInput = document.getElementById(
    `edit_registerPrice_${courseName}_${teacherId}`
  );
  const amountRemainingInput = document.getElementById(
    `edit_amountRemaining_${courseName}_${teacherId}`
  );

  if (courseCheckbox.checked) {
    priceInput.disabled = false;
    registerPriceInput.disabled = false;
    amountRemainingInput.disabled = false;
  } else {
    priceInput.disabled = true;
    registerPriceInput.disabled = true;
    amountRemainingInput.disabled = true;
    priceInput.value = '';
    registerPriceInput.value = '';
    amountRemainingInput.value = '';
  }
}

// Save updated Data
const editStudentModal = document.getElementById('editStudentModal');
const clodeModalBtn = document.getElementById('clodeModalBtn');
const saveEditStudentBtn = document.getElementById('saveEditStudentBtn');

const saveEditStudent = async () => {
  const studentId = document.getElementById('editStudentId').value;
  const studentName = document.getElementById('editStudentName').value;
  const studentPhone = document.getElementById('editStudentPhone').value;
  const studentParentPhone = document.getElementById(
    'editStudentParentPhone'
  ).value;

  // Collect updated teachers and courses
  const selectedTeachers = [];
  document
    .querySelectorAll('input[name="editTeachers[]"]:checked')
    .forEach((teacherCheckbox) => {
      const teacherId = teacherCheckbox.value;
      const selectedCourses = [];

      document
        .querySelectorAll(
          `input[name="editSelectedCourses[${teacherId}][]"]:checked`
        )
        .forEach((courseCheckbox) => {
          const courseName = courseCheckbox.value;
          const amountPay = document.getElementById(
            `edit_price_${courseName}_${teacherId}`
          ).value;
          const registerPrice = document.getElementById(
            `edit_registerPrice_${courseName}_${teacherId}`
          ).value;
          const amountRemaining = document.getElementById(
            `edit_amountRemaining_${courseName}_${teacherId}`
          ).value;

          selectedCourses.push({
            courseName,
            amountPay: parseFloat(amountPay) || 0,
            registerPrice: parseFloat(registerPrice) || 0,
            amountRemaining: parseFloat(amountRemaining) || 0,
          });
        });

      if (selectedCourses.length > 0) {
        selectedTeachers.push({ teacherId, courses: selectedCourses });
      }
    });

  const data = {
    studentName,
    studentPhoneNumber: studentPhone,
    studentParentPhone,
    selectedTeachers,
  };

  try {
    const response = await fetch(`/employee/update-student/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok)
      throw new Error(responseData.message || 'Failed to update student');

    // Update the row in the table dynamically
    const row = document
      .querySelector(`button[data-id="${studentId}"]`)
      .closest('tr');
    row.cells[0].textContent = responseData.studentName;
    row.cells[1].textContent = responseData.studentPhoneNumber;
    row.cells[2].textContent = responseData.studentParentPhone;
    row.cells[3].textContent = responseData.studentCode;

    // Close modal & show success message
    document.getElementById('clodeModalBtn').click();
    successToast.classList.add('show');
    messageToast.innerHTML = 'تم تعديل الطالب بنجاح';
  } catch (error) {
    console.error('Error updating student:', error);
    errorMessage.classList.add('show');
    errorMessage.innerHTML = 'حدث خطأ أثناء تحديث الطالب.';
  }
};

// Attach event to save button
document
  .getElementById('saveEditStudentBtn')
  .addEventListener('click', saveEditStudent);

// Delete Student removed from employee UI

// Search Student

searchButton.addEventListener('click', async () => {
  const searchValue = searchStudent.value;
  const teacherValue = filterTeacherSelection.value;
  const [teacher, course] = teacherValue.split('_');
  studentTableBody.innerHTML = '';
  spinner2.classList.remove('d-none');
  try {
    const response = await fetch(
      `/employee/search-student?search=${searchValue}&teacher=${teacher}&course=${course}`
    );
    if (!response.ok) {
      throw new Error('Failed to search for student');
    }

    const students = await response.json();
    console.log(students);
    clearStudentTable(); // Clear the table before populating
    sequenceOfStudets = 0;
    students.forEach(addStudentToTable); // Add each student to the table
    spinner2.classList.add('d-none');
  } catch (error) {
    console.error('Error searching for student:', error);
    errorMessage.classList.add('show');
    errorMessage.innerHTML = 'No Students Found. Please try again later.';
    spinner2.classList.add('d-none');
  }
});

// Send WA

sendWaButton.addEventListener('click', async () => {
  const teacherValue = waTeacherSelection.value;
  const message = waMessage.value;

  if (!message) {
    errorMessage.classList.add('show');
    errorMessage.innerHTML = 'Please enter a message';
    return;
  }
  if (!teacherValue) {
    errorMessage.classList.add('show');
    errorMessage.innerHTML = 'Please select a teacher';
    return;
  }

  sendWaButton.innerHTML = 'Please wait the message is sending...';
  sendWaButton.disabled = true;
  try {
    const response = await fetch(
      `/employee/send-wa?teacher=${teacherValue}&message=${message}`
    );
    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const responseData = await response.json();
    console.log(responseData);
    if (response.ok) {
      successToast.classList.add('show');
      successToast.innerHTML = responseData.message;

      setTimeout(() => {
        window.location.reload();
        sendWaButton.innerHTML =
          'Messages Sent and the page will reload in 3 seconds';
      }, 3000);
    } else {
      errorMessage.classList.add('show');
      errorMessage.innerHTML = responseData.message;
      setTimeout(() => {
        window.location.reload();
        sendWaButton.innerHTML =
          'Messages was not sent and the page will reload in 6 seconds';
      }, 6000);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    errorMessage.classList.add('show');
    errorMessage.innerHTML = 'An error occurred. Please try again later.';
    setTimeout(() => {
      window.location.reload();
      sendWaButton.innerHTML =
        'Messages was not sent and the page will reload in 6 seconds';
    }, 6000);
  }
});

// Convert table to Excel
const exportToExcelBtn = document.getElementById('exportToExcelBtn');
exportToExcelBtn.addEventListener('click', () => {
  const tableData = [];
  const rows = studentTableBody.querySelectorAll('tr');

  rows.forEach((row, index) => {
    const sequenceNumber = index + 1;
    const studentName = row.cells[1].textContent;
    const studentPhoneNumber = row.cells[2].textContent;
    const studentParentPhone = row.cells[3].textContent;
    const studentCode = row.cells[4].textContent;

    tableData.push({
      '#': sequenceNumber,
      'Student Name': studentName,
      'Student Phone Number': studentPhoneNumber,
      'Parent Phone Number': studentParentPhone,
      'Student Code': studentCode,
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  // Apply styles
  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center' },
    fill: { fgColor: { rgb: 'FFFF00' } },
  };

  const cellStyle = {
    alignment: { horizontal: 'center' },
  };

  // Apply header style
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    worksheet[address].s = headerStyle;
  }

  // Apply cell style
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = cellStyle;
    }
  }

  XLSX.writeFile(workbook, 'students.xlsx');
});




// send code again 

const sendCodeAgain = async (studentId) => {
  if (!confirm('Are you sure you want to send the code again?')) return;

  try {
    const response = await fetch(`/employee/send-code-again/${studentId}`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to send code');

    const responseData = await response.json();
    successToast.classList.add('show');
    messageToast.innerHTML = responseData.message;
  } catch (error) {
    console.error('Error sending code:', error);
    errorMessage.classList.add('show');
    errorMessage.innerHTML = 'An error occurred. Please try again later.';
  }
}

// Excel Upload Functionality

// Toggle Excel upload section
document.getElementById('toggleExcelSection').addEventListener('click', function() {
  const section = document.getElementById('excelUploadSection');
  const button = this;
  
  if (section.style.display === 'none') {
    section.style.display = 'block';
    button.innerHTML = '<i class="material-symbols-rounded text-sm">visibility_off</i>&nbsp;&nbsp;إخفاء قسم رفع Excel';
  } else {
    section.style.display = 'none';
    button.innerHTML = '<i class="material-symbols-rounded text-sm">upload</i>&nbsp;&nbsp;عرض قسم رفع Excel';
  }
});

// Update course selection when teacher is selected for Excel upload
document.getElementById('excelTeacherSelection').addEventListener('change', function() {
  const teacherId = this.value;
  const courseSelection = document.getElementById('excelCourseSelection');
  
  // Clear current options
  courseSelection.innerHTML = '<option selected value="">اختر الكورس</option>';
  
  if (teacherId) {
    // Find the selected teacher and populate courses
    const teacherCheckbox = document.getElementById(`teacher_${teacherId}`);
    if (teacherCheckbox) {
      const coursesContainer = document.getElementById(`courses_${teacherId}`);
      if (coursesContainer) {
        const courseCheckboxes = coursesContainer.querySelectorAll('input[type="checkbox"]');
        
        courseCheckboxes.forEach(checkbox => {
          const courseName = checkbox.value;
          const option = document.createElement('option');
          option.value = courseName;
          option.textContent = courseName;
          courseSelection.appendChild(option);
        });
      }
    }
  }
});

// Handle Excel file upload
document.getElementById('excelUploadForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const uploadBtn = document.getElementById('uploadExcelBtn');
  const originalText = uploadBtn.innerHTML;
  uploadBtn.innerHTML = '<i class="spinner-border spinner-border-sm"></i> جاري الرفع...';
  uploadBtn.disabled = true;
  
  // Hide previous results and show progress
  document.getElementById('excelUploadResults').style.display = 'none';
  document.getElementById('excelUploadProgress').style.display = 'block';
  
  // Start progress animation
  const progressBar = document.getElementById('uploadProgressBar');
  const progressText = document.getElementById('uploadProgressText');
  let progress = 0;
  
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90; // Don't go to 100% until complete
    progressBar.style.width = progress + '%';
    progressText.textContent = `جاري إنشاء حسابات الطلاب... ${Math.round(progress)}%`;
  }, 500);
  
  const formData = new FormData(this);
  
  // Add the amount field to form data
  const allStudentsAmount = document.getElementById('allStudentsAmount').value;
  if (allStudentsAmount) {
    formData.append('allStudentsAmount', allStudentsAmount);
  }
  

  
  // Debug: Log form data
  console.log('Form data being sent:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }
  
  try {
    const response = await fetch('/employee/upload-excel-students', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    // Clear progress interval and complete progress
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressText.textContent = 'تم إنشاء جميع الحسابات بنجاح!';
    
    // Hide progress and show results
    document.getElementById('excelUploadProgress').style.display = 'none';
    const resultsDiv = document.getElementById('excelUploadResults');
    const successAlert = document.getElementById('excelSuccessAlert');
    const errorAlert = document.getElementById('excelErrorAlert');
    const successDetails = document.getElementById('excelSuccessDetails');
    const errorDetails = document.getElementById('excelErrorDetails');
    
    resultsDiv.style.display = 'block';
    
    if (response.ok) {
      // Show success results
      successAlert.style.display = 'block';
      errorAlert.style.display = 'none';
      
      let successHtml = `<p>${result.message}</p>`;
      if (result.results.success.length > 0) {
        successHtml += '<h6>الطلاب المضافون بنجاح:</h6><ul>';
        result.results.success.forEach(student => {
          successHtml += `<li>${student.name} - الكود: ${student.code}</li>`;
        });
        successHtml += '</ul>';
      }
      
      if (result.results.failed.length > 0) {
        successHtml += '<h6>الطلاب الذين فشل إضافتهم:</h6><ul>';
        result.results.failed.forEach(student => {
          successHtml += `<li>${student.name} - الخطأ: ${student.error}</li>`;
        });
        successHtml += '</ul>';
      }
      
      successDetails.innerHTML = successHtml;
      
      // Reset form
      this.reset();
      document.getElementById('excelCourseSelection').innerHTML = '<option selected value="">اختر الكورس</option>';
      
      // Refresh student table
      getStudents();
      
    } else {
      // Show error results
      successAlert.style.display = 'none';
      errorAlert.style.display = 'block';
      
      let errorHtml = `<p>${result.message}</p>`;
      if (result.errors && result.errors.length > 0) {
        errorHtml += '<ul>';
        result.errors.forEach(error => {
          errorHtml += `<li>${error}</li>`;
        });
        errorHtml += '</ul>';
      }
      
      errorDetails.innerHTML = errorHtml;
    }
    
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    
    // Clear progress interval and show error
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressBar.classList.remove('progress-bar-animated');
    progressBar.classList.add('bg-danger');
    progressText.textContent = 'حدث خطأ أثناء إنشاء الحسابات';
    
    // Hide progress and show error
    document.getElementById('excelUploadProgress').style.display = 'none';
    const resultsDiv = document.getElementById('excelUploadResults');
    const successAlert = document.getElementById('excelSuccessAlert');
    const errorAlert = document.getElementById('excelErrorAlert');
    const errorDetails = document.getElementById('excelErrorDetails');
    
    resultsDiv.style.display = 'block';
    successAlert.style.display = 'none';
    errorAlert.style.display = 'block';
    errorDetails.innerHTML = '<p>حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.</p>';
  } finally {
    uploadBtn.innerHTML = originalText;
    uploadBtn.disabled = false;
  }
});

// Delete student function
async function deleteStudent(studentId) {
  if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
    return;
  }
  
  try {
    const response = await fetch(`/employee/delete-student/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      // Remove the student from the table
      const studentRow = document.querySelector(`button[data-id="${studentId}"]`).closest('tr');
      if (studentRow) {
        studentRow.remove();
      }
      
      // Show success message
      messageToast.textContent = responseData.message || 'تم حذف الطالب بنجاح';
      const toast = new bootstrap.Toast(successToast);
      toast.show();
      
      // Refresh the student list
      getAllStudents();
    } else {
      // Show error message
      const errorToast = new bootstrap.Toast(errorMessage);
      errorToast.show();
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    const errorToast = new bootstrap.Toast(errorMessage);
    errorToast.show();
  }
}

// Close modal