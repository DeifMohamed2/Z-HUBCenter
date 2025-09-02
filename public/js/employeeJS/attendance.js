
const attendStudentForm = document.getElementById('attendStudentForm');
const searchStudent = document.getElementById('searchStudent');
const spinner = document.getElementById('spinner');
const studentTable = document.getElementById('studentTable');
const courseSelction = document.getElementById('courseSelction');
const reloadButton = document.getElementById('reloadButton');
const tBody = document.querySelector('#studentTable tbody');
const message = document.getElementById('message');
const totalAmount = document.getElementById('totalAmount');
const totalFees = document.getElementById('totalFees');
const totalStudents = document.getElementById('totalStudents');
const totalInvoices = document.getElementById('totalInvoices');
const netProfitToTeacher = document.getElementById('netProfit');
const invoiceForm = document.getElementById('invoiceForm');
const invoiceTBody = document.querySelector('#invoiceTable tbody');
const downloadExcelBtn = document.getElementById('downloadExcelBtn');
const viewDeletedStudentsBtn = document.getElementById('viewDeletedStudentsBtn');
const mockCheck = document.getElementById('mockCheck');

const deviceSelect = document.getElementById('deviceSelect');
let temp3Student = 0;
async function attendStudent(event) {
    event.preventDefault();
    
    // Show spinner and hide messages
    spinner.classList.remove('d-none');
    
    const formData = new FormData(attendStudentForm);
    
    const data = Object.fromEntries(formData);
    
    const courseSelection = courseSelction.value.split('_');
    data.teacherId = courseSelection[0];
    data.courseName = courseSelection[1];
    data.mockCheck = mockCheck.checked ? true : false;
    
    // Add fixed amount data if checkbox is checked
    const fixedAmountCheck = document.getElementById('fixedAmountCheck');
    const fixedAmount = document.getElementById('fixedAmount');
    
    if (fixedAmountCheck.checked && fixedAmount.value) {
      data.fixedAmountCheck = true;
      data.fixedAmount = parseFloat(fixedAmount.value);
      console.log('Fixed amount enabled:', {
        fixedAmountCheck: data.fixedAmountCheck,
        fixedAmount: data.fixedAmount,
        fixedAmountType: typeof data.fixedAmount
      });
    }

    try {
        // First, get student information to show in modal
        const response = await fetch('/employee/get-student-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        const studentInfo = await response.json();
        
        if (response.ok) {
            // Show modal with student information
            showAttendanceModal(studentInfo, data);
            spinner.classList.add('d-none');
        } else {
            spinner.classList.add('d-none');
            attendStudentForm.reset();
            message.textContent = studentInfo.message;
            searchStudent.focus();
        }
    } catch (error) {
        attendStudentForm.reset();
        searchStudent.focus();
        spinner.classList.add('d-none');
        console.error('Error getting student info:', error);
        message.textContent = 'حدث خطأ أثناء جلب معلومات الطالب';
    }
}

// Function to show attendance modal
function showAttendanceModal(studentInfo, formData) {
    const student = studentInfo.student;
    const course = studentInfo.course;
    const teacher = studentInfo.teacher;
    
    // Populate student information
    document.getElementById('modalStudentName').textContent = student.studentName;
    document.getElementById('modalStudentCode').textContent = student.studentCode;
    document.getElementById('modalStudentPhone').textContent = student.studentPhoneNumber;
    document.getElementById('modalParentPhone').textContent = student.studentParentPhone;
    document.getElementById('modalSchoolName').textContent = student.schoolName;
    
    // Populate session information
    document.getElementById('modalTeacherName').textContent = teacher.teacherName;
    document.getElementById('modalCourseName').textContent = course.courseName;
    document.getElementById('modalPaymentType').textContent = student.paymentType === 'perSession' ? 'دفع لكل جلسة' : 'دفع للكورس';
    document.getElementById('modalAttendanceCount').textContent = studentInfo.attendanceCount + 1;
    document.getElementById('modalDate').textContent = new Date().toLocaleDateString('ar-EG');
    
    // Set initial financial values based on system settings
    const initialAmountRemaining = course.amountRemaining || 0;
    const initialAmountToPay = formData.fixedAmountCheck ? formData.fixedAmount : 
                              (student.paymentType === 'perSession' ? course.amountPay : 0);
    const initialCenterFees = formData.mockCheck ? 50 : 
                             (student.paymentType === 'perSession' ? teacher.teacherFees : 0);
    
    document.getElementById('modalAmountRemaining').value = initialAmountRemaining;
    document.getElementById('modalAmountToPay').value = initialAmountToPay;
    document.getElementById('modalCenterFees').value = initialCenterFees;
    
    // Set checkboxes based on system settings (always enabled by default)
    // Note: Print receipt and WhatsApp are always enabled by default
    
    // Calculate and display initial totals
    updateModalCalculations();
    
    // Store data for confirmation
    window.modalData = {
        studentInfo,
        formData,
        originalAmountRemaining: initialAmountRemaining,
        originalAmountToPay: initialAmountToPay
    };
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('studentAttendanceModal'));
    modal.show();
}

// Function to update modal calculations
function updateModalCalculations() {
    const amountRemaining = parseFloat(document.getElementById('modalAmountRemaining').value) || 0;
    const amountToPay = parseFloat(document.getElementById('modalAmountToPay').value) || 0;
    const centerFees = parseFloat(document.getElementById('modalCenterFees').value) || 0;
    
    // Calculate net profit
    const netProfit = amountToPay - centerFees;
    document.getElementById('modalNetProfit').value = netProfit;
    
    // Update summary
    document.getElementById('modalTotalAmount').textContent = amountToPay + ' EGP';
    document.getElementById('modalTotalFees').textContent = centerFees + ' EGP';
    document.getElementById('modalTotalProfit').textContent = netProfit + ' EGP';
    
    // Add visual feedback for negative values
    const netProfitElement = document.getElementById('modalNetProfit');
    const totalProfitElement = document.getElementById('modalTotalProfit');
    
    if (netProfit < 0) {
        netProfitElement.style.color = '#dc3545';
        totalProfitElement.style.color = '#dc3545';
    } else {
        netProfitElement.style.color = '#28a745';
        totalProfitElement.style.color = '#28a745';
    }
}

// Function to validate modal data
function validateModalData() {
    const amountRemaining = parseFloat(document.getElementById('modalAmountRemaining').value) || 0;
    const amountToPay = parseFloat(document.getElementById('modalAmountToPay').value) || 0;
    const centerFees = parseFloat(document.getElementById('modalCenterFees').value) || 0;
    
    if (amountToPay < 0) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ في المبلغ',
            text: 'المبلغ المطلوب لا يمكن أن يكون سالباً'
        });
        return false;
    }
    
    if (centerFees < 0) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ في الرسوم',
            text: 'رسوم السنتر لا يمكن أن تكون سالبة'
        });
        return false;
    }
    
    if (amountRemaining < 0) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ في المبلغ المتبقي',
            text: 'المبلغ المتبقي لا يمكن أن يكون سالباً'
        });
        return false;
    }
    
    return true;
}

// Add event listeners for modal input changes
document.addEventListener('DOMContentLoaded', function() {
    // Listen for changes in modal inputs
    document.getElementById('modalAmountRemaining').addEventListener('input', updateModalCalculations);
    document.getElementById('modalAmountToPay').addEventListener('input', updateModalCalculations);
    document.getElementById('modalCenterFees').addEventListener('input', updateModalCalculations);
    
    // Handle amount remaining changes
    document.getElementById('modalAmountRemaining').addEventListener('change', function() {
        const newAmountRemaining = parseFloat(this.value) || 0;
        const originalAmountRemaining = window.modalData?.originalAmountRemaining || 0;
        const originalAmountToPay = window.modalData?.originalAmountToPay || 0;
        
        // If amount remaining is reduced, add the difference to amount to pay
        if (newAmountRemaining < originalAmountRemaining) {
            const difference = originalAmountRemaining - newAmountRemaining;
            const newAmountToPay = originalAmountToPay + difference;
            document.getElementById('modalAmountToPay').value = newAmountToPay;
        }
        
        updateModalCalculations();
    });
    
        // Handle amount to pay changes
    document.getElementById('modalAmountToPay').addEventListener('change', function() {
        const newAmountToPay = parseFloat(this.value) || 0;
        const originalAmountToPay = window.modalData?.originalAmountToPay || 0;
        const originalAmountRemaining = window.modalData?.originalAmountRemaining || 0;
        
        // If amount to pay is increased, reduce amount remaining
        if (newAmountToPay > originalAmountToPay) {
            const difference = newAmountToPay - originalAmountToPay;
            const newAmountRemaining = Math.max(0, originalAmountRemaining - difference);
            document.getElementById('modalAmountRemaining').value = newAmountRemaining;
        }
        
        updateModalCalculations();
    });
    
    // Handle confirm attendance button
    document.getElementById('confirmAttendanceBtn').addEventListener('click', confirmAttendance);
});

// Function to confirm attendance
async function confirmAttendance() {
    if (!window.modalData) {
        console.error('No modal data available');
        return;
    }
    
    // Validate modal data first
    if (!validateModalData()) {
        return;
    }
    
    const { studentInfo, formData } = window.modalData;
    const modalData = {
        ...formData,
        amountRemaining: parseFloat(document.getElementById('modalAmountRemaining').value) || 0,
        amountToPay: parseFloat(document.getElementById('modalAmountToPay').value) || 0,
        centerFees: parseFloat(document.getElementById('modalCenterFees').value) || 0,
        printReceipt: true, // Always enabled
        sendWhatsApp: true  // Always enabled
    };
    
    try {
        spinner.classList.remove('d-none');
        
        const response = await fetch('/employee/attend-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(modalData),
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('studentAttendanceModal'));
            modal.hide();
            
            // Update table
            addStudentsToTable(responseData.students, formData.teacherId, formData.courseName);
            
            // Reset form
            attendStudentForm.reset();
            searchStudent.focus();
            
            // Show success message
            message.textContent = responseData.message;
            
            // Print receipt if requested
            if (modalData.printReceipt) {
                printReceipt(responseData.studentData);
            }
            
            // Show warning if amount remaining
            if (responseData.studentData.amountRemaining > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'مبلغ متبقي',
                    html: `يوجد مبلغ متبقي علي الطالب <b>${responseData.studentData.studentName}</b> بقيمة <b>${responseData.studentData.amountRemaining}</b> جنيه`,
                });
            }
            
            // Refresh data
            temp3Student++;
            if (temp3Student == 5) {
                getStudents();
                temp3Student = 0;
            }
            
        } else {
            message.textContent = responseData.message;
        }
        
        spinner.classList.add('d-none');
        
    } catch (error) {
        console.error('Error confirming attendance:', error);
        message.textContent = 'حدث خطأ أثناء تأكيد الحضور';
        spinner.classList.add('d-none');
    }
}

attendStudentForm.addEventListener('submit', attendStudent);

// Manage QZ Tray connection globally
let isQzConnected = false;

// Disconnect QZ Tray on page unload
window.addEventListener('beforeunload', () => {
    if (isQzConnected) {
        qz.websocket.disconnect()
            .then(() => console.log('QZ Tray disconnected on page unload.'))
            .catch((error) => console.error('Error disconnecting from QZ Tray:', error));
    }
});

function printReceipt(data = {}) {
  const {
    attendanceCount = 0,
    studentName = 'N/A',
    studentTeacher = {},
    amountPaid = 0,
    studentCode = 'N/A',
    date = new Date().toLocaleDateString() +
      ' ' +
      new Date().toLocaleTimeString(),
  } = data;

  // English labels for the receipt
  const englishLabels = {
    title: 'ZHUB CENTER',
    phone: '01200077827', // Example phone number
    date: 'Date',
    teacherName: 'Teacher Name',
    courseName: 'Course Name',
    studentName: 'Student Name',
    studentCode: 'Student Code',
    amountPaid: 'Amount Paid',
    thankYou: 'Thank you for choosing our ZHUB Center!',
  };

  // ESC/POS Printer Commands
  const ESC_ALIGN_CENTER = '\x1B\x61\x01'; // Center align
  const ESC_BOLD = '\x1B\x45\x01'; // Bold text
  const ESC_DOUBLE_SIZE = '\x1B\x21\x30'; // Double font size
  const ESC_NORMAL_SIZE = '\x1B\x21\x00'; // Normal font size
  const ESC_CUT = '\x1D\x56\x42\x00'; // Full paper cut
  const ESC_FEED_LINE = '\x0A'; // Line feed
  const ESC_RESET = '\x1B\x40'; // Reset printer

  const lineSeparator = '-'.repeat(49); // Table line separator
  const headerSeparator = '='.repeat(49); // Bold section separator

  function formatTableRow(field, value) {
    const totalWidth = 48;
    const left = field.padEnd(22, ' ');
    const right = value.toString().padStart(22, ' ');
    return `| ${left}|${right} |`;
  }

  // Build receipt content
  const receiptContent =
    ESC_RESET +
    ESC_ALIGN_CENTER +
    ESC_BOLD +
    ESC_DOUBLE_SIZE +
    englishLabels.title +
    ESC_FEED_LINE +
    ESC_NORMAL_SIZE +
    ESC_FEED_LINE +
    ESC_ALIGN_CENTER +
    englishLabels.phone +
    ESC_FEED_LINE +
    ESC_FEED_LINE +
    headerSeparator +
    ESC_FEED_LINE +
    formatTableRow(englishLabels.date, date) +
    ESC_FEED_LINE +
    lineSeparator +
    ESC_FEED_LINE +
    formatTableRow(
      englishLabels.teacherName,
      studentTeacher?.teacherName || 'N/A'
    ) +
    ESC_FEED_LINE +
    lineSeparator +
    ESC_FEED_LINE +
    formatTableRow(
      englishLabels.courseName,
      studentTeacher?.subjectName || 'N/A'
    ) +
    ESC_FEED_LINE +
    headerSeparator +
    ESC_FEED_LINE +
    formatTableRow(englishLabels.studentName, studentName) +
    ESC_FEED_LINE +
    lineSeparator +
    ESC_FEED_LINE +
    formatTableRow(englishLabels.studentCode, studentCode) +
    ESC_FEED_LINE +
    lineSeparator +
    ESC_FEED_LINE +
    formatTableRow(englishLabels.amountPaid, `${amountPaid} EGP`) +
    ESC_FEED_LINE +
    lineSeparator +
    ESC_FEED_LINE +
    formatTableRow('Sessions Count', attendanceCount) +
    ESC_FEED_LINE +
    lineSeparator +
    ESC_FEED_LINE +
    ESC_ALIGN_CENTER +
    ESC_BOLD +
    ESC_NORMAL_SIZE +
    englishLabels.thankYou +
    ESC_FEED_LINE +
    ESC_FEED_LINE;

  console.log('Printing receipt:', receiptContent);

  // Print receipt
  if (!isQzConnected) {
    message.textContent =
      'QZ Tray is not connected. Please connect and try again.';
    return;
  }

  const config = qz.configs.create('XP-80C'); // Replace with your printer name
  const printData = [
    { type: 'raw', format: 'command', data: receiptContent },
    { type: 'raw', format: 'command', data: ESC_CUT }, // Cut paper
  ];

  qz.print(config, printData)
    .then(() => console.log('Receipt printed successfully.'))
    .catch((error) => console.error('Print error:', error));
}



const getStudents = async () => {
    try {
    tBody.innerHTML = '';
    totalAmount.textContent = '0 EGP';
    totalFees.textContent = '0 EGP';
    totalStudents.textContent = '0';
    spinner.classList.remove('d-none');
    const courseSelection = courseSelction.value.split('_');
    teacherId = courseSelection[0];
    courseName = courseSelection[1];
    const response = await fetch(`/employee/get-attended-students?teacherId=${teacherId}&courseName=${courseName}`);
    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // const responseData = await response.json();

    // Populate table
    addStudentsToTable(responseData.students , teacherId , courseName);
    addInvoicesToTable(responseData.invoices);
    spinner.classList.add('d-none');
    searchStudent.focus();
    message.textContent = responseData.message;
    totalAmount.textContent = responseData.totalAmount +' EGP';
    totalFees.textContent = responseData.totalFees+' EGP';
    totalStudents.textContent = responseData.students.length;
    totalInvoices.textContent = responseData.totalInvoiceAmount;
    netProfitToTeacher.textContent = responseData.netProfitToTeacher.amount+ ' EGP';

    setTimeout(() => {
        message.textContent = '';
    },3000)
    } catch (error) {
    console.error('Error fetching students:', error);
    spinner.classList.add('d-none');
    searchStudent.focus();
    message.textContent = 'لم يتم تسجيل اي طلاب اليوم';
    }


    qz.websocket
      .connect()
      .then(() => {
        console.log('QZ Tray connected on page load.');
        isQzConnected = true;
      })
      .catch((error) => console.error('Error connecting to QZ Tray:', error));
}

// Reload button
reloadButton.addEventListener('click', getStudents);
courseSelction.addEventListener('change', getStudents);


// Function to add students to the tbody

const addStudentsToTable = (students, teacherId, courseName) => {
    tBody.innerHTML = '';
     students.forEach((student) => {
       // Find the specific course data
       const courseData = student.student.selectedTeachers
         .find((t) => t.teacherId.toString() === teacherId)
         ?.courses.find((c) => c.courseName === courseName);

       const tr = document.createElement('tr');
      tr.innerHTML = `
            <td class="text-center">${student.student.studentName}</td>
            <td class="text-center">${student.student.studentCode}</td>
            <td class="text-center">${student.student.studentPhoneNumber}</td>
            <td class="text-center">${student.student.studentParentPhone}</td>
            <td class="text-center">
              <input type="text" class="amountPaid" 
                   value="${student.amountPaid}"
                   data-student-id="${student.student._id}"
                   data-teacher-id="${teacherId}"
                   data-course-name="${courseName}">
            </td>
            <td class="text-center">
              <input type="text" class="amountRemaining" 
                   value="${courseData?.amountRemaining || 0}"
                   data-student-id="${student.student._id}"
                   data-teacher-id="${teacherId}"
                   data-course-name="${courseName}">
            </td>
            <td class="text-center">${
              student.attendanceCount || 'Waiting for refresh'
            }</td>
            <td class="text-center">
              <button class="btn btn-primary btn-sm edit-amount">Edit</button>
            </td>
            <td class="text-center">
              <button class="btn btn-danger btn-sm delete">Delete</button>
            </td>
            <td class="text-center">${student.addedBy.employeeName}</td>
          `;

       // Event listeners
       tr.querySelector('.edit-amount').addEventListener('click', (event) => {
         // Get tr reference from event target
         const row = event.target.closest('tr');
         const input = row.querySelector('.amountRemaining');
          const amountPaidInput = row.querySelector('.amountPaid');
         const studentId = input.dataset.studentId;
         const teacherId = input.dataset.teacherId;
         const courseName = input.dataset.courseName;
         const amount = input.value;
          const amountPaid = amountPaidInput.value;

         editStudentAmountRemainingAndAmountPaid(studentId, amount,amountPaid, teacherId, courseName);
       });

       tr.querySelector('.delete').addEventListener('click', (event) => {
         const row = event.target.closest('tr');
         const studentId =
           row.querySelector('.amountRemaining').dataset.studentId;
         const studentName = row.querySelector('td:first-child').textContent;
         showDeleteReasonDialog(studentId, teacherId, courseName, studentName);
       });

       // Event listeners remain the same
       tBody.appendChild(tr);
     });
};

// Function to show delete reason dialog
function showDeleteReasonDialog(studentId, teacherId, courseName, studentName) {
  Swal.fire({
    title: 'حذف الطالب من الحضور',
    html: `
      <p>هل أنت متأكد من حذف الطالب <strong>${studentName}</strong> من الحضور؟</p>
      <div class="form-group">
        <label for="deleteReason" class="form-label">سبب الحذف:</label>
        <textarea id="deleteReason" class="form-control" rows="3" placeholder="أدخل سبب الحذف..." required></textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'حذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    focusConfirm: false,
    preConfirm: () => {
      const reason = document.getElementById('deleteReason').value.trim();
      if (!reason) {
        Swal.showValidationMessage('يجب إدخال سبب الحذف');
        return false;
      }
      return reason;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      deleteStudent(studentId, teacherId, courseName, result.value);
    }
  });
}

// Function to delete student
async function deleteStudent(studentId, teacherId, courseName, reason) {
    try {
        spinner.classList.remove('d-none');
        const response = await fetch(`/employee/delete-attend-student/${studentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacherId,
            courseName,
            reason
          }),
        });
        const responseData = await response.json();
        if (response.ok) {
        console.log(responseData.students);
        getStudents();
        searchStudent.focus();
        spinner.classList.add('d-none');
        message.textContent = responseData.message;
        
        // Show success toast
        Swal.fire({
          icon: 'success',
          title: 'تم الحذف بنجاح',
          text: responseData.message,
          timer: 3000,
          showConfirmButton: false
        });
        } else {
        searchStudent.focus();
        spinner.classList.add('d-none');
        message.textContent = responseData.message;
        
        // Show error toast
        Swal.fire({
          icon: 'error',
          title: 'خطأ في الحذف',
          text: responseData.message
        });
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        searchStudent.focus();
        spinner.classList.add('d-none');
        message.textContent = 'An error occurred. Please try again later.';
        
        // Show error toast
        Swal.fire({
          icon: 'error',
          title: 'خطأ في الحذف',
          text: 'An error occurred. Please try again later.'
        });
    }
}

async function editStudentAmountRemainingAndAmountPaid(studentId, amount,amountPaid, teacherId, courseName) {
    try {
        const response = await fetch(`/employee/edit-student-amount-remaining-and-paid/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amountRemaining: amount,
                amountPaid,
                teacherId,
                courseName
            }),
        });
        const responseData = await response.json();
        if (response.ok) {
        console.log(responseData.students);
        // addStudentsToTable(responseData.students);
        getStudents();
        searchStudent.focus();
        spinner.classList.add('d-none');
        message.textContent = responseData.message;
        } else {
        alert(responseData.message);
        searchStudent.focus();
        spinner.classList.add('d-none');
        message.textContent = responseData.message;
        }
    } catch (error) {
        console.error('Error editing amount:', error);
        searchStudent.focus();
        spinner.classList.add('d-none');
        message.textContent = 'An error occurred. Please try again later.';
    }
}

// View Deleted Students
viewDeletedStudentsBtn.addEventListener('click', async () => {
  try {
    const courseSelection = courseSelction.value.split('_');
    const teacherId = courseSelection[0];
    const courseName = courseSelection[1];
    
    const response = await fetch(`/employee/get-deleted-students?teacherId=${teacherId}&courseName=${courseName}`);
    const responseData = await response.json();
    
    if (response.ok) {
      if (responseData.deletedStudents && responseData.deletedStudents.length > 0) {
        showDeletedStudentsModal(responseData.deletedStudents);
      } else {
        Swal.fire({
          icon: 'info',
          title: 'لا يوجد طلاب محذوفين',
          text: 'لم يتم حذف أي طلاب من الحضور اليوم'
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: responseData.message
      });
    }
  } catch (error) {
    console.error('Error fetching deleted students:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'حدث خطأ أثناء جلب الطلاب المحذوفين'
    });
  }
});

// Function to show deleted students modal
function showDeletedStudentsModal(deletedStudents) {
  let tableRows = '';
  deletedStudents.forEach((deletedStudent, index) => {
    const student = deletedStudent.student;
    const addedBy = deletedStudent.addedBy;
    const deletedBy = deletedStudent.deletedBy;
    const deletedAt = new Date(deletedStudent.deletedAt).toLocaleString('ar-EG');
    
    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td>${student.studentName}</td>
        <td>${student.studentCode}</td>
        <td>${deletedStudent.amountPaid}</td>
        <td>${deletedStudent.feesApplied || 0}</td>
        <td>${addedBy.employeeName}</td>
        <td>${deletedBy.employeeName}</td>
        <td>${deletedAt}</td>
        <td>${deletedStudent.reason}</td>
      </tr>
    `;
  });

  Swal.fire({
    title: 'الطلاب المحذوفين من الحضور',
    html: `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالب</th>
              <th>كود الطالب</th>
              <th>المبلغ المدفوع</th>
              <th>الرسوم</th>
              <th>أضيف بواسطة</th>
              <th>حذف بواسطة</th>
              <th>تاريخ الحذف</th>
              <th>سبب الحذف</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `,
    width: '80%',
    confirmButtonText: 'إغلاق',
    confirmButtonColor: '#3085d6'
  });
}

// download Excel File

downloadExcelBtn.addEventListener('click', async () => {
    try {
        downloadExcelBtn.innerHTML = 'جاري التحميل...';
        const courseSelection = courseSelction.value.split('_');
        const teacherId = courseSelection[0];
        const courseName = courseSelection[1];
        const response = await fetch(`/employee/download-attendance-excel?teacherId=${teacherId}&courseName=${courseName}`);
        if (!response.ok) {
   
        throw new Error('Failed to download excel file');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toLocaleDateString().replace(/\//g, '-');
        a.download = `كشف حضور الطلاب - ${date}.xlsx`;
        a.click();
        downloadExcelBtn.innerHTML = '<i class="material-symbols-rounded text-sm">download</i>&nbsp;&nbsp;Download Excel And Send Copy';
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading excel file:', error);
    }
});

// Device Select

deviceSelect.addEventListener('change', async (event) => {
  const selectedDevice = event.target.value;
  try {
    const response = await fetch(`/employee/select-device/${selectedDevice}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error('Failed to select device');
    }
  
    window.location.reload();

  } catch (error) {
    console.error('Error selecting device:', error);
  }
});


// Add Invoice

invoiceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  spinner.classList.remove('d-none');
  const formData = new FormData(invoiceForm);
  const data = Object.fromEntries(formData);
  const courseSelection = courseSelction.value.split('_');
  data.teacherId = courseSelection[0];
  data.courseName = courseSelection[1];
  try {
    const response = await fetch('/employee/add-teacher-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    if (response.ok) {
      spinner.classList.add('d-none');
      invoiceForm.reset();
      message.textContent = responseData.message;
      searchStudent.focus();
      getStudents();
    } else {
      spinner.classList.add('d-none');
      invoiceForm.reset();
      message.textContent = responseData.message;
      searchStudent.focus();
      getStudents();
    }
  } catch (error) {
    invoiceForm.reset();
    searchStudent.focus();
    spinner.classList.add('d-none');
    console.error('Error adding invoice:', error);
  }
});


// Function to add invoices to the table


const addInvoicesToTable = (invoices) => {
  invoiceTBody.innerHTML = '';
  invoices.forEach((invoice) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center invoice-details">${invoice.invoiceDetails}</td>
      <td class="text-center invoice-amount">${invoice.invoiceAmount}</td>
      <td class="text-center">${invoice.time}</td>
      <td class="text-center">${invoice.addedBy.employeeName}</td>
      <td class="text-center">
        <button class="btn btn-primary btn-sm edit-invoice">Edit</button>
        <button class="btn btn-danger btn-sm delete-invoice">Delete</button>
      </td>
    `;

    const deleteButton = tr.querySelector('.delete-invoice');
    deleteButton.addEventListener('click', async () => {
      deleteButton.textContent = '...Deleting';
      await deleteInvoice(invoice._id);
      deleteButton.textContent = 'Delete';
    });

    const editButton = tr.querySelector('.edit-invoice');
    editButton.addEventListener('click', () => handleEdit(invoice, tr));

    invoiceTBody.appendChild(tr);
  });
};

const handleEdit = (invoice, tr) => {
  const detailsCell = tr.querySelector('.invoice-details');
  const amountCell = tr.querySelector('.invoice-amount');
  const editButton = tr.querySelector('.edit-invoice');

  // Replace text with input fields
  detailsCell.innerHTML = `<input type="text" class="form-control text-center" style="border:1px solid #000;" value="${invoice.invoiceDetails}" />`;
  amountCell.innerHTML = `<input type="number" class="form-control text-center w-25" style="border:1px solid #000;" value="${invoice.invoiceAmount}" />`;

  editButton.textContent = 'Update';
  editButton.classList.remove('edit-invoice');
  editButton.classList.add('update-invoice');

  // Remove previous event listeners to prevent multiple bindings
  editButton.replaceWith(editButton.cloneNode(true));
  const newUpdateButton = tr.querySelector('.update-invoice');

  newUpdateButton.addEventListener('click', async () => {
    const updatedDetails = detailsCell.querySelector('input').value;
    const updatedAmount = amountCell.querySelector('input').value;

    await updateInvoice(invoice._id, updatedDetails, updatedAmount);

    detailsCell.textContent = updatedDetails;
    amountCell.textContent = updatedAmount;

    newUpdateButton.textContent = 'Edit';
    newUpdateButton.classList.remove('update-invoice');
    newUpdateButton.classList.add('edit-invoice');

    // Reattach edit event listener
    newUpdateButton.addEventListener('click', () => handleEdit(invoice, tr));
  });
};

async function updateInvoice(invoiceId, invoiceDetails, invoiceAmount) {
  try {
    console.log(invoiceId, invoiceDetails, invoiceAmount);
    spinner.classList.remove('d-none');
    const response = await fetch(`/employee/update-invoice/${invoiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceDetails, invoiceAmount }),
    });
    const responseData = await response.json();
    if (response.ok) {
      spinner.classList.add('d-none');
      message.textContent = responseData.message;
      getStudents();
    } else {
      alert(responseData.message);
      spinner.classList.add('d-none');
      message.textContent = responseData.message;
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    spinner.classList.add('d-none');
    message.textContent = 'An error occurred. Please try again later.';
  }
}


async function deleteInvoice(invoiceId) {
  try {
    spinner.classList.remove('d-none');
    const response = await fetch(`/employee/delete-invoice/${invoiceId}`, {
      method: 'DELETE',
    });
    const responseData = await response.json();
    if (response.ok) {
      spinner.classList.add('d-none');
      message.textContent = responseData.message;
      getStudents();
    } else {
      alert(responseData.message);
      spinner.classList.add('d-none');
      message.textContent = responseData.message;
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    spinner.classList.add('d-none');
    message.textContent = 'An error occurred. Please try again later.';
  }
}


// Function to convert table to Excel sheet
function tableToExcel() {
  const table = document.getElementById('studentTable');
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const headers = ['#', 'Student Name', 'Parent Phone', 'Student Code'];

  const data = rows.map((row, index) => {
    const cells = row.querySelectorAll('td');
    return [
      index + 1,
      cells[0].textContent,
      cells[3].textContent,
      cells[1].textContent,
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  // Style headers
  const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
    cell.s = {
      fill: {
        fgColor: { rgb: 'FFFF00' },
      },
      font: {
        bold: true,
      },
    };
  }

  XLSX.writeFile(workbook, 'Student_Attendance.xlsx');
}

// Add event listener to download Excel button
document.getElementById('AssistantExcelBtn').addEventListener('click', tableToExcel);

// Send to Absences functionality
document.getElementById('sendToAbsencesBtn').addEventListener('click', async () => {
    try {
        const courseSelection = courseSelction.value;
        if (!courseSelection) {
            Swal.fire({
                icon: 'warning',
                title: 'تحذير',
                text: 'يرجى اختيار الكورس أولاً'
            });
            return;
        }

        const [teacherId, courseName] = courseSelection.split('_');
        
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'إرسال رسالة للغياب',
            text: `هل تريد إرسال رسالة للطلاب الغائبين في كورس ${courseName}؟`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم، إرسال',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
            spinner.classList.remove('d-none');
            
            // Show progress dialog
            const progressDialog = Swal.fire({
                title: 'جاري إرسال الرسائل...',
                html: `
                    <div class="progress mb-3" style="background-color: #f8f9fa; border: 2px solid #dee2e6; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" 
                             style="width: 0%; background: linear-gradient(45deg, #007bff, #0056b3); color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
                             id="messageProgress">0%</div>
                    </div>
                    <p id="messageCounter" style="color: #495057; font-weight: 500;">جاري الإرسال...</p>
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Simulate progress updates
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                
                const progressBar = document.getElementById('messageProgress');
                const counter = document.getElementById('messageCounter');
                
                if (progressBar && counter) {
                    progressBar.style.width = progress + '%';
                    progressBar.textContent = Math.round(progress) + '%';
                    counter.textContent = `جاري الإرسال... ${Math.round(progress)}%`;
                }
            }, 500);
            
            const response = await fetch('/employee/send-to-absences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teacherId,
                    courseName
                }),
            });

            // Clear the progress interval
            clearInterval(progressInterval);
            
            // Complete the progress bar
            const progressBar = document.getElementById('messageProgress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.textContent = '100%';
            }

            const responseData = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'تم الإرسال بنجاح',
                    html: `
                        <p>تم إرسال الرسالة إلى <strong>${responseData.sentCount}</strong> طالب غائب</p>
                        <p>عدد الطلاب المسجلين في الكورس: <strong>${responseData.totalStudents}</strong></p>
                        <p>عدد الطلاب الحاضرين: <strong>${responseData.attendedStudents}</strong></p>
                        ${responseData.failedMessages ? `<p class="text-warning">فشل في إرسال ${responseData.failedMessages.length} رسالة</p>` : ''}
                    `,
                    confirmButtonText: 'حسناً'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ في الإرسال',
                    text: responseData.message,
                    confirmButtonText: 'حسناً'
                });
            }
            
            spinner.classList.add('d-none');
        }
    } catch (error) {
        console.error('Error sending to absences:', error);
        spinner.classList.add('d-none');
        Swal.fire({
            icon: 'error',
            title: 'خطأ في الإرسال',
            text: 'حدث خطأ أثناء إرسال الرسائل',
            confirmButtonText: 'حسناً'
        });
    }
});