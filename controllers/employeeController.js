const Employee = require('../models/employee');
const Billing = require('../models/billing');
const Teacher = require('../models/teacher');
const Student = require('../models/student');
const Attendance = require('../models/attendance');
const qrcode = require('qrcode');
const ExcelJS = require('exceljs');


const waziper = require('../utils/waziper');
const { StudentCodeUtils } = require('../utils/waziper');
const instanceId = '68533DDE7D372';



const dashboard = (req, res) => {
  


  // Dashboard data preparation
  // const prepareStudentData = async () => {
  //   try {
  //     // Find all students
  //     const students = await Student.find({});
      
  //     // Check for students with incorrectly formatted codes (G at the end instead of beginning)
  //     const studentsToUpdate = students.filter(student => 
  //       student.studentCode && 
  //       student.studentCode.endsWith('G') && 
  //       /^\d{4}G$/.test(student.studentCode)
  //     );
      
  //     // Update student codes to have G prefix instead of suffix
  //     for (const student of studentsToUpdate) {
  //       const oldCode = student.studentCode;
  //       const newCode = `G${oldCode.substring(0, 4)}`; // Remove G from end and add to beginning
        
  //       // Check if the new code already exists to avoid duplicates
  //       const existingStudent = await Student.findOne({ studentCode: newCode });
        
  //       if (!existingStudent) {
  //         await Student.findByIdAndUpdate(student._id, { 
  //           studentCode: newCode 
  //         });
  //         console.log(`Updated student code from ${oldCode} to ${newCode} for student ${student.studentName}`);
  //       } else {
  //         // Generate a new unique code with G prefix for duplicate cases
  //         let isUnique = false;
  //         let newUniqueCode;
          
  //         while (!isUnique) {
  //           // Generate a random 4-digit number
  //           const randomDigits = Math.floor(1000 + Math.random() * 9000);
  //           newUniqueCode = `G${randomDigits}`;
            
  //           // Check if this code already exists
  //           const duplicateCheck = await Student.findOne({ studentCode: newUniqueCode });
  //           if (!duplicateCheck) {
  //             isUnique = true;
  //           }
  //         }
          
  //         await Student.findByIdAndUpdate(student._id, { 
  //           studentCode: newUniqueCode 
  //         });
  //         console.log(`Generated new unique code ${newUniqueCode} for student ${student.studentName} (old code ${oldCode} conflicted with existing record)`);
  //       }
  //     }
      
  //     // Also check for students missing the G prefix entirely
  //     const studentsWithoutG = students.filter(student => 
  //       student.studentCode && 
  //       !student.studentCode.startsWith('G') && 
  //       !student.studentCode.endsWith('G') && 
  //       /^\d{4}$/.test(student.studentCode)
  //     );
      
  //     // Update these students too
  //     for (const student of studentsWithoutG) {
  //       const oldCode = student.studentCode;
  //       const newCode = `G${oldCode}`;
        
  //       const existingStudent = await Student.findOne({ studentCode: newCode });
        
  //       if (!existingStudent) {
  //         await Student.findByIdAndUpdate(student._id, { 
  //           studentCode: newCode 
  //         });
  //         console.log(`Updated student code from ${oldCode} to ${newCode} for student ${student.studentName}`);
  //       } else {
  //         // Generate a new unique code with G prefix for duplicate cases
  //         let isUnique = false;
  //         let newUniqueCode;
          
  //         while (!isUnique) {
  //           // Generate a random 4-digit number
  //           const randomDigits = Math.floor(1000 + Math.random() * 9000);
  //           newUniqueCode = `G${randomDigits}`;
            
  //           // Check if this code already exists
  //           const duplicateCheck = await Student.findOne({ studentCode: newUniqueCode });
  //           if (!duplicateCheck) {
  //             isUnique = true;
  //           }
  //         }
          
  //         await Student.findByIdAndUpdate(student._id, { 
  //           studentCode: newUniqueCode 
  //         });
  //         console.log(`Generated new unique code ${newUniqueCode} for student ${student.studentName} (old code ${oldCode} conflicted with existing record)`);
  //       }
  //     }
      
  //     return {
  //       totalStudents: students.length,
  //       updatedStudents: studentsToUpdate.length + studentsWithoutG.length
  //     };
  //   } catch (error) {
  //     console.error('Error updating student codes:', error);
  //     return {
  //       error: 'Failed to update student codes'
  //     };
  //   }
  // };
  
  // // Run the code update on dashboard load
  // prepareStudentData();
  
  res.render('employee/dashboard', {
    title: 'Dashboard',
    path: '/employee/dashboard',
    employeeData: req.employee,
  });
};


const teacherSechdule = async(req, res) => {
    try {
      // Get all teachers with their schedules
      const teachers = await Teacher.find({});
      
      // Extract unique rooms from all teacher schedules
      const rooms = new Set();
      
      teachers.forEach(teacher => {
        // Handle schedule as a Map object
        if (teacher.schedule && teacher.schedule instanceof Map) {
          for (const [day, sessions] of teacher.schedule.entries()) {
            if (Array.isArray(sessions)) {
              sessions.forEach(session => {
                if (session.roomID) {
                  rooms.add(session.roomID);
                }
              });
            }
          }
        } 
        // Handle schedule as a plain object
        else if (teacher.schedule && typeof teacher.schedule === 'object') {
          Object.entries(teacher.schedule).forEach(([day, sessions]) => {
            if (Array.isArray(sessions)) {
              sessions.forEach(session => {
                if (session.roomID) {
                  rooms.add(session.roomID);
                }
              });
            }
          });
        }
      });
      
      // Add room information to the response
      const response = {
        teachers,
        rooms: Array.from(rooms).map(roomID => ({
          id: roomID,
          title: `Room ${roomID}`
        }))
      };
      
      res.send(response);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res
        .status(500)
        .send({ error: 'An error occurred while fetching teachers' });
    }
}



// ======================================== Billing ======================================== //

const billing_Get = (req, res) => {
    res.render('employee/billing', {
        title: 'Billing',
        path: '/employee/billing',
    });
}

const addBill = (req, res) => {
    const { billName, billAmount, billNote, billPhoto } = req.body;

    if (billAmount < 0) {
        res.status(400).send({ message: 'لازم Amount يكون اكبر من 0' });
        return;
    }

    if (billName.length < 3) {
        res.status(400).send({ message: 'اسم الفاتوره لازم يكون اكتر من 3 احرف' });
        return
    }

    const bill = new Billing({
      billName,
      billAmount,
      billNote,
      billPhoto,
      employee: req.employeeId,
    });

    bill
        .save()
        .then((result) => {
            res.status(201).send(result);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: 'هناك مشكله فنيه' });
        });
}


const getAllBills = async (req, res) => {
  try {
    const allBills = await Billing.find({ employee: req.employeeId }).sort({
      createdAt: -1,
      });
    console.log(allBills);
    res.send(allBills);
  }catch (error) {
    console.error('Error fetching bills:', error);
    res
      .status(500)
      .send({ error: 'An error occurred while fetching bills' });
  }  
}

// ======================================== End Billing ======================================== //


// ======================================== Add Student ======================================== //

const getAddStudent = async (req, res) => {
  // First, get all teachers
  const allTeachers = await Teacher.find(
    {},
    { teacherName: 1, paymentType: 1, courses: 1 }
  );

  res.render('employee/addStudent', {
    title: 'Add Student',
    path: '/employee/add-student',
    allTeachers,
  });
}


const getAllStudents = async (req, res) => {
    const allStudents = await Student.find().populate({
      path: 'selectedTeachers.teacherId',

    }).sort({createdAt: -1});
    allStudents.forEach((student) => {
  
    });
    res.send(allStudents);
}

const getStudent = async (req, res) => {
    const student = await Student.findById(req.params.id).populate('selectedTeachers.teacherId');
    console.log(student);
    res.send(student);
}

async function sendQRCode(chatId, message, studentCode) {
  try {
    // Use a public QR code URL (align with working Elkably app)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(studentCode)}`;
    console.log('Generated QR Code URL:', qrCodeUrl);
    console.log('Sending to Chat ID:', chatId);

    const response = await waziper.sendMediaMessage(instanceId, chatId, message, qrCodeUrl, 'qrcode.png');

    console.log('QR code sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending QR code:', error);
  }
}

const addStudent = async (req, res) => {
    const {
        studentName,
        studentPhoneNumber,
        studentParentPhone,
        selectedTeachers,
        schoolName,
        paymentType,
        studentAmount,
    } = req.body;

    if (studentName.length < 3) {
        res.status(400).send({ message: 'اسم الطالب لازم يكون اكتر من 3 احرف' });
        return;
    }

    if (studentPhoneNumber.length !== 11) {
        res.status(400).send({ message: 'رقم الهاتف يجب ان يكون مكون من 11 رقم' });
        return;
    }

    if (studentParentPhone.length !== 11) {
        res.status(400).send({ message: 'رقم هاتف ولى الامر يجب ان يكون مكون من 11 رقم' });
        return;
    }

    if (!selectedTeachers || selectedTeachers.length === 0) {
        res.status(400).send({ message: 'يجب اختيار معلم' });
        return;
    }

    if (!schoolName) {
        res.status(400).send({ message: 'يجب ادخال اسم المدرسه' });
        return;
    }

    if (studentAmount < 0) {
        res.status(400).send({ message: 'لازم Amount يكون اكبر من 0' });
        return;
    }

    if (!paymentType) {
        res.status(400).send({ message: 'يجب اختيار نوع الدفع' });
        return;
    }

    try {
        // Generate a unique student code using the utility function
        const studentCode = await StudentCodeUtils.generateUniqueStudentCode(Student);

        // Process each selected teacher and their courses
        const processedTeachers = selectedTeachers.map(({ teacherId, courses }) => {
            const processedCourses = courses.map(({ courseName, amountPay, registerPrice }) => {
                const amountRemaining = 0;  // Subtract paid amount from full registration fee
                console.log('Amount Remaining:', amountRemaining);
                return {
                  courseName,
                  amountPay,
                  registerPrice:0,
                  amountRemaining: amountRemaining > 0 ? amountRemaining : 0, // Ensure it doesn't go negative
                };
            });

            return { teacherId, courses: processedCourses };
        });

        const student = new Student({
            studentName,
            studentPhoneNumber,
            studentParentPhone,
            schoolName,
            selectedTeachers: processedTeachers,
            amountRemaining: paymentType === 'perSession' ? 0 : studentAmount,
            studentCode: studentCode,
            paymentType,
        });

        student
            .save()
            .then(async (result) => {
                const populatedStudent = await result.populate('selectedTeachers.teacherId', 'teacherName');

                let message = `📌 *تفاصيل تسجيل الطالب*\n\n`;
                message += `👤 *اسم الطالب:* ${populatedStudent.studentName}\n`;
                message += `🏫 *المدرسة:* ${populatedStudent.schoolName}\n`;
                message += `📞 *رقم الهاتف:* ${populatedStudent.studentPhoneNumber}\n`;
                message += `📞 *رقم ولي الأمر:* ${populatedStudent.studentParentPhone}\n`;
                message += `🆔 *كود الطالب:* ${populatedStudent.studentCode}\n\n`;

                message += `📚 *تفاصيل الكورسات المسجلة:*\n`;

                populatedStudent.selectedTeachers.forEach(({ teacherId, courses }) => {
                    message += `\n👨‍🏫 *المعلم:* ${teacherId.teacherName}\n`;
                    courses.forEach(({ courseName}) => {
                        message += `   ➖ *الكورس:* ${courseName}\n`;
                  
                    });
                });

                // Send the message via WhatsApp or another service
                sendQRCode(`2${populatedStudent.studentPhoneNumber}@c.us`, `Scan the QR code to check in\n\n${message}`, populatedStudent.studentCode);

                res.status(201).send(populatedStudent);
            })
            .catch((err) => {
              if (err.code === 11000) {
                res.status(400).send({ message: ' خطأ: إدخال مكرر تم ادخال الطالب من قبل' });
              }else{

                res.status(400).send({ message: 'هناك مشكله فنيه' });
              }
            });
    } catch (error) {
        console.error('Error generating unique student code:', error);
        res.status(500).send({ message: 'خطأ في إنشاء كود الطالب، يرجى المحاولة مرة أخرى' });
    }
};

const uploadExcelStudents = async (req, res) => {
    try {
        console.log('Upload request received:', req.files);
        
        if (!req.files || !req.files.excelFile) {
            return res.status(400).json({ message: 'No Excel file uploaded' });
        }

        const excelFile = req.files.excelFile;
        console.log('Excel file info:', {
            name: excelFile.name,
            size: excelFile.size,
            mimetype: excelFile.mimetype,
            hasData: !!excelFile.data,
            hasTempPath: !!excelFile.tempFilePath
        });
        const { paymentType, selectedTeacherId, selectedCourseName, allStudentsAmount, columnNames } = req.body;
        
        // Parse column names
        const columns = columnNames ? JSON.parse(columnNames) : {
            studentName: 'User Name',
            studentCode: 'Student Co',
            studentPhoneNumber: 'Student Ph',
            studentParentPhone: 'Parent Pho',
            schoolName: 'School Nan'
        };

        // Validate required fields
        if (!paymentType || !selectedTeacherId || !selectedCourseName) {
            return res.status(400).json({ 
                message: 'Payment type, teacher, and course are required' 
            });
        }

        // Check if file is Excel
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream' // Some systems send this for Excel files
        ];
        
        if (!allowedTypes.includes(excelFile.mimetype)) {
            console.log('Invalid mimetype:', excelFile.mimetype);
            return res.status(400).json({ 
                message: `Please upload a valid Excel file (.xlsx or .xls). Received: ${excelFile.mimetype}` 
            });
        }
        
        // Check file size
        if (excelFile.size === 0) {
            return res.status(400).json({ 
                message: 'File appears to be empty' 
            });
        }

        const workbook = new ExcelJS.Workbook();
        
        try {
            // Handle file data properly
            if (excelFile.data) {
                await workbook.xlsx.load(excelFile.data);
            } else if (excelFile.tempFilePath) {
                await workbook.xlsx.readFile(excelFile.tempFilePath);
            } else {
                return res.status(400).json({ message: 'Invalid file data' });
            }
        } catch (loadError) {
            console.error('Error loading Excel file:', loadError);
            return res.status(400).json({ 
                message: 'Error reading Excel file. Please make sure it\'s a valid Excel file (.xlsx or .xls)',
                error: loadError.message 
            });
        }
        
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return res.status(400).json({ 
                message: 'No worksheet found in the Excel file' 
            });
        }

        const students = [];
        const errors = [];

        // Find column positions by header names
        const headerRow = worksheet.getRow(1);
        const columnPositions = {};
        
        headerRow.eachCell((cell, colNumber) => {
            const headerValue = cell.value ? cell.value.toString().trim() : '';
            if (headerValue === columns.studentName) columnPositions.studentName = colNumber;
            if (headerValue === columns.studentCode) columnPositions.studentCode = colNumber;
            if (headerValue === columns.studentPhoneNumber) columnPositions.studentPhoneNumber = colNumber;
            if (headerValue === columns.studentParentPhone) columnPositions.studentParentPhone = colNumber;
            if (headerValue === columns.schoolName) columnPositions.schoolName = colNumber;
        });

        // Validate that all required columns are found
        const requiredColumns = ['studentName', 'studentPhoneNumber', 'studentParentPhone', 'schoolName'];
        const missingColumns = requiredColumns.filter(col => !columnPositions[col]);
        
        if (missingColumns.length > 0) {
            return res.status(400).json({ 
                message: `Missing required columns: ${missingColumns.join(', ')}` 
            });
        }
        
        console.log('Column positions found:', columnPositions);

        // Start from row 2 (skip header)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const studentName = row.getCell(columnPositions.studentName).value;
            const studentCode = columnPositions.studentCode ? row.getCell(columnPositions.studentCode).value : null;
            const studentPhoneNumber = row.getCell(columnPositions.studentPhoneNumber).value;
            const studentParentPhone = row.getCell(columnPositions.studentParentPhone).value;
            const schoolName = row.getCell(columnPositions.schoolName).value;
            const amountPaid = 0; // Amount will be set from the global amount field

            // Validate required fields with specific details
            const missingFields = [];
            if (!studentName) missingFields.push('Student Name');
            if (!studentPhoneNumber) missingFields.push('Student Phone');
            if (!studentParentPhone) missingFields.push('Parent Phone');
            if (!schoolName) missingFields.push('School Name');
            
            if (missingFields.length > 0) {
                errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`);
                return;
            }

            // Validate phone numbers
            if (studentPhoneNumber.toString().length !== 11) {
                errors.push(`Row ${rowNumber}: Student phone number must be 11 digits`);
                return;
            }

            if (studentParentPhone.toString().length !== 11) {
                errors.push(`Row ${rowNumber}: Parent phone number must be 11 digits`);
                return;
            }

            // Use the global amount for all students
            const finalAmount = parseFloat(allStudentsAmount) || 0;
            
            students.push({
                studentName: studentName.toString().trim(),
                studentCode: studentCode ? studentCode.toString().trim() : null,
                studentPhoneNumber: studentPhoneNumber.toString(),
                studentParentPhone: studentParentPhone.toString(),
                schoolName: schoolName.toString().trim(),
                amountPaid: finalAmount,
                paymentType,
                selectedTeacherId,
                selectedCourseName
            });
        });

        if (errors.length > 0) {
            return res.status(400).json({ 
                message: 'Validation errors found', 
                errors 
            });
        }

        if (students.length === 0) {
            return res.status(400).json({ 
                message: 'No valid student data found in Excel file' 
            });
        }

        // Process students one by one for better progress tracking
        const results = {
            success: [],
            failed: []
        };

        for (let i = 0; i < students.length; i++) {
            const studentData = students[i];
            
            try {
                // Use student code from Excel, or generate one if not provided
                let studentCode = studentData.studentCode;
                if (!studentCode) {
                    studentCode = await StudentCodeUtils.generateUniqueStudentCode(Student);
                }

                // Prepare teacher and course data
                const selectedTeachers = [{
                    teacherId: studentData.selectedTeacherId,
                    courses: [{
                        courseName: studentData.selectedCourseName,
                        amountPay: studentData.amountPaid,
                        registerPrice: 0,
                        amountRemaining: 0
                    }]
                }];

                const student = new Student({
                    studentName: studentData.studentName,
                    studentPhoneNumber: studentData.studentPhoneNumber,
                    studentParentPhone: studentData.studentParentPhone,
                    schoolName: studentData.schoolName,
                    selectedTeachers,
                    amountRemaining: paymentType === 'perSession' ? 0 : studentData.amountPaid,
                    studentCode,
                    paymentType: studentData.paymentType
                });

                await student.save();
                results.success.push({
                    name: studentData.studentName,
                    code: studentCode
                });

            } catch (error) {
                console.error(`Error saving student ${studentData.studentName}:`, error);
                
                let errorMessage = error.message;
                
                // Handle specific error types
                if (error.code === 11000) {
                    if (error.keyPattern && error.keyPattern.studentPhoneNumber) {
                        errorMessage = `رقم الهاتف مكرر: ${studentData.studentPhoneNumber}`;
                    } else if (error.keyPattern && error.keyPattern.studentCode) {
                        errorMessage = `كود الطالب مكرر: ${studentData.studentCode}`;
                    } else {
                        errorMessage = 'بيانات مكررة في النظام';
                    }
                }
                
                results.failed.push({
                    name: studentData.studentName,
                    error: errorMessage
                });
            }
        }

        res.status(200).json({
            message: `Successfully processed ${results.success.length} students`,
            results
        });

    } catch (error) {
        console.error('Error processing Excel file:', error);
        res.status(500).json({ 
            message: 'Error processing Excel file',
            error: error.message 
        });
    }
};

const downloadExcelTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students Template');

        // Add headers
        worksheet.columns = [
            { header: 'User Name', key: 'studentName', width: 20 },
            { header: 'Student Co', key: 'studentCode', width: 15 },
            { header: 'Student Ph', key: 'studentPhoneNumber', width: 15 },
            { header: 'Parent Pho', key: 'studentParentPhone', width: 15 },
            { header: 'School Nan', key: 'schoolName', width: 20 }
        ];

        // Style the header row
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1F4E78' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Add sample data
        worksheet.addRow(['Ahmed Mohamed', 'G1234', '01123456789', '01123456788', 'Al-Nour School']);
        worksheet.addRow(['Fatima Ali', 'G5678', '01123456787', '01123456786', 'Al-Amal School']);

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students_template.xlsx');

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Excel template:', error);
        res.status(500).json({ message: 'Error generating Excel template' });
    }
};

const updateStudent = async (req, res) => {
  const {
    studentName,
    studentPhoneNumber,
    studentParentPhone,
    // studentTeacher,
    subject,
    studentAmount,
    amountRemaining,
    installmentAmount,
    selectedTeachers,
  } = req.body;

  if (studentName.length < 3) {
      res.status(400).send({ message: 'اسم الطالب لازم يكون اكتر من 3 احرف' });
      return;
  }

  if (studentPhoneNumber.length !== 11) {
      res.status(400).send({ message: 'رقم الهاتف يجب ان يكون مكون من 11 رقم' });
      return;
  }

  if (studentParentPhone.length !== 11) {
      res.status(400).send({ message: 'رقم هاتف ولى الامر يجب ان يكون مكون من 11 رقم' });
      return;
  }

  // if (!studentTeacher) {
  //     res.status(400).send({ message: 'يجب اختيار المعلم' });
  //     return
  // }
  

  const student = await Student.findByIdAndUpdate(req.params.id, {
    studentName,
    studentPhoneNumber,
    studentParentPhone,
    // studentTeacher,
    subject,
    studentAmount,
    amountRemaining,
    selectedTeachers,
  }).populate('studentTeacher', 'teacherName');
  
  if (student.paymentType === 'perCourse') {
    if ((student.amountRemaining - installmentAmount) <= 0) {
      return res.status(200).send(student);
    }
    student.amountRemaining -= installmentAmount;
    student.paidHistory.push({
      amount: installmentAmount,
      date: new Date(),
      employee: req.employee._id,
    });

    if (installmentAmount>0) {
      const parentMessage = `
عزيزي ولي أمر الطالب ${student.studentName},
-----------------------------
نود إعلامكم بأنه تم دفع مبلغ ${installmentAmount} جنيه من إجمالي المبلغ المستحق.
المبلغ المتبقي هو ${student.amountRemaining} جنيه.
الكورس: ${student.subject}
المعلم: ${student.studentTeacher.teacherName}
التاريخ: ${new Date().toLocaleDateString()}
شكرًا لتعاونكم.
    `;

          await waziper.sendTextMessage(instanceId, `2${student.studentParentPhone}@c.us`, parentMessage);
    }
    await student.save();
  }
 return res.send(student);
}

const searchStudent = async (req, res) => {
  try {

    const { search, teacher, course } = req.query; // Extract query parameters
    console.log('Search:', search, 'Teacher:', teacher, 'Course:', course);

    // Build the query dynamically
    const query = {};

    if (search) {
      const searchTerm = search.trim();
      
      // Check if search contains only numbers
      const isOnlyNumbers = /^\d+$/.test(searchTerm);
      
      if (isOnlyNumbers) {
        // If it's only numbers, search by phone number and create proper student code
        const studentCode = searchTerm;
        query.$or = [
          { studentPhoneNumber: searchTerm },
          { studentCode: studentCode }
        ];
      } else {
      
          query.studentCode = searchTerm;
     
      }
    }
    if (teacher) {
      query['selectedTeachers.teacherId'] = teacher; // Filter by teacher
    }
    if (course && course !== 'undefined') {
      query['selectedTeachers.courses.courseName'] = course; // Filter by course
    }
    console.log('Query:', query);
    // Fetch the student records & populate teachers and their courses
    const students = await Student.find(query).populate({
      path: 'selectedTeachers.teacherId',
      select: 'teacherName', // Get teacher name only
    });

    console.log('Students:', students);

    // Send response
    res
      .status(200)
      .send(students.length ? students : { message: 'No students found' });
  } catch (error) {
    console.error('Error fetching students:', error);
    res
      .status(500)
      .send({ error: 'An error occurred while searching for students' });
  }
};


const sendWa = async (req, res) => {
  const { teacher, message } = req.query;
  try {
  const students = await Student.find({ studentTeacher: teacher }).populate(
    'studentTeacher',
    'teacherName subjectName'
  );

  for (const student of students) {
    const waNumber = `2${student.studentParentPhone}@c.us`;

    const messageUpdate = `
عزيزي ولي امر الطالب ${student.studentName}
هذه الرساله من كورس ${student.studentTeacher.subjectName} بتاريخ ${new Date().toLocaleDateString()}
والذي يقوم بتدريسه المدرس ${student.studentTeacher.teacherName}
${message}
--------------------------
ويرجي العلم انهو تم سداد حتي الان ${student.studentAmount - student.amountRemaining} من اجمالي المبلغ
والباقي ${student.amountRemaining} جنيه
تحياتنا
`;

    await waziper
      .sendTextMessage(instanceId, waNumber, messageUpdate)
      .then((response) => {
        console.log('Message sent:', response.data);
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });

    // Random delay between 1 to 3 seconds between each message
    const delay = Math.floor(Math.random() * 3000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  res.status(200).send({ message: 'Messages sent successfully' });
} catch (error) {
  console.error('Error sending messages:', error);
  res.status(500).send({ error: 'An error occurred while sending messages' });
}

};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'An error occurred while deleting student' });
  }
};


const sendCodeAgain = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id).populate('selectedTeachers.teacherId', 'teacherName');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    let message = `📌 *تفاصيل تسجيل الطالب*\n\n`;
    message += `👤 *اسم الطالب:* ${student.studentName}\n`;
    message += `🏫 *المدرسة:* ${student.schoolName}\n`;
    message += `📞 *رقم الهاتف:* ${student.studentPhoneNumber}\n`;
    message += `📞 *رقم ولي الأمر:* ${student.studentParentPhone}\n`;
    message += `🆔 *كود الطالب:* ${student.studentCode}\n\n`;

    message += `📚 *تفاصيل الكورسات المسجلة:*\n`;

    student.selectedTeachers.forEach(({ teacherId, courses }) => {
      message += `\n👨‍🏫 *المعلم:* ${teacherId.teacherName}\n`;
      courses.forEach(({ courseName }) => {
        message += `   ➖ *الكورس:* ${courseName}\n`;
      });
    });

    // Send the message via WhatsApp or another service
    sendQRCode(`2${student.studentPhoneNumber}@c.us`, `Scan the QR code to check in\n\n${message}`, student.studentCode);

    res.status(200).json({ message: 'QR code sent successfully' });
  } catch (error) {
    console.error('Error sending QR code:', error);
    res.status(500).json({ message: 'An error occurred while sending QR code' });
  }
};
   
// ======================================== End Add Student ======================================== //


// ================================= Teacher ================================ //

const teacher_Get = (req, res) => {
  res.render('employee/teacher', { title: 'Add Teacher', path: '/employee/teacher' });
};

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.' });
  }
};

const addTeacher = async (req, res) => {
  try {
    const {
      teacherName,
      teacherPhoneNumber,
      subjectName,
      schedule,
      teacherFees,
      paymentType,
      courses
    } = req.body;

    console.log(req.body); // Debugging: Log the incoming request data
    
    // Validation for required fields
    if(!courses){
      return res.status(400).json({
        error: 'يجب اختيار الكورسات التي يدرسها المدرس',
      });
    }
    if (
      !teacherName ||
      !teacherFees ||
      !teacherPhoneNumber ||
      !subjectName ||
   
      typeof schedule !== 'object'
    ) {
      return res.status(400).json({
        error: 'All fields are required. Schedule must be an object.',
      });
    }

    // Validation for schedule structure
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    for (const [day, timeSlots] of Object.entries(schedule)) {
      if (!daysOfWeek.includes(day)) {
        return res.status(400).json({ error: `Invalid day: ${day}` });
      }
      if (!Array.isArray(timeSlots)) {
        return res.status(400).json({
          error: `Time slots for ${day} must be an array.`,
        });
      }
      for (const timeSlot of timeSlots) {
        if (!timeSlot.startTime || !timeSlot.endTime) {
          return res.status(400).json({
            error: `لازم كل الايام يكون ليها وقت بدايه ونهايه`,
          });
        }
      }
    }

    // Create and save a new teacher
    const newTeacher = new Teacher({
      teacherName: teacherName.trim(),
      teacherPhoneNumber: teacherPhoneNumber.trim(),
      subjectName: subjectName.trim(),
      teacherFees: teacherFees,
      paymentType,
      schedule,
      courses,
    });

    await newTeacher.save();

    // Send success response
    res.status(201).json({
      message: 'تم اضافه المدرس بنجاح',
      teacher: newTeacher,
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({
      error: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.',
      details: error.message,
    });
  }
};

const getTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.status(200).json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.' });
  }
};

const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const {
    teacherName,
    teacherPhoneNumber,
    subjectName,
    teacherFees,
    schedule,
    courses,
  } = req.body;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Update basic fields
    teacher.teacherName = teacherName;
    teacher.teacherPhoneNumber = teacherPhoneNumber;
    teacher.subjectName = subjectName;
    teacher.teacherFees = teacherFees;
    teacher.courses = courses;
    // Update schedule
    if (schedule && Array.isArray(schedule)) {
      const formattedSchedule = schedule.reduce((acc, slot) => {
        const { day, startTime, endTime, roomID } = slot;
        if (!acc[day]) acc[day] = [];
        acc[day].push({ startTime, endTime, roomID });
        return acc;
      }, {});

      teacher.schedule = formattedSchedule;
    }

    await teacher.save();
    res.status(200).json({ message: 'Teacher updated successfully', teacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.' });
  }
};



// ======================================== End Teacher ======================================== //

// ======================================== Attendance ======================================== //

const getAttendance = async(req, res) => {
  const employee = req.employee;
  console.log(employee.device);
  const allTeachers = await Teacher.find({});
    res.render('employee/attendance', {
        title: 'Attendance',
        path: '/employee/attendance',
        allTeachers :allTeachers,
        device : employee.device
    });
}

const getDeviceData = async (req, res) => {
  const employee = req.employee;
  res.send({ device: employee.device });
};

function getDateTime() {
    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Cairo', // Egypt's time zone
    }).format(new Date());
    return today;
}

const attendStudent = async (req, res) => {
  console.time('attendStudentExecutionTime');

  const { searchStudent, teacherId, courseName, mockCheck, fixedAmountCheck, fixedAmount } = req.body;
  const employeeId = req.employeeId;
  const mockAmount = 150;
  const mockFees = 50;
  
  // Debug the incoming values
  console.log('Request body:', { 
    searchStudent, 
    teacherId, 
    courseName, 
    mockCheck, 
    fixedAmountCheck, 
    fixedAmount,
    mockCheckType: typeof mockCheck,
    fixedAmountCheckType: typeof fixedAmountCheck,
    fixedAmountType: typeof fixedAmount
  });

  if (!teacherId || !courseName) {
    return res.status(400).json({ message: 'يجب اختيار الكورس ' });
  }

  try {
    // Find the student
    let studentQuery;
    const SearchStudent = searchStudent.trim();
    
    // Check if search contains only numbers
    const isOnlyNumbers = /^\d+$/.test(SearchStudent);

    if (isOnlyNumbers) {
      // If it's only numbers, search by barCode, studentCode, and phone number
      studentQuery = {
        $or: [
          { barCode: SearchStudent }, 
          { studentCode: SearchStudent },
        ]
      };
    } else {
      // If it contains text, validate if it's a proper student code format
      if (false) { // Removed G prefix check
        studentQuery = {
          $or: [
            { barCode: SearchStudent }, 
            { studentCode: SearchStudent }
          ]
        };
      } 
    }
    
    const student = await Student.findOne(studentQuery).populate('selectedTeachers.teacherId', 'teacherName subjectName teacherFees');

    if (!student) {
      return res.status(404).json({ message: 'هذا الطالب غير موجود' });
    }

    // Check if the student is enrolled with the specified teacher and course
    const selectedTeacherEntry = student.selectedTeachers.find(
      (t) => t.teacherId._id.toString() === teacherId
    );

    if (!selectedTeacherEntry) {
      return res.status(404).json({ message: 'الطالب غير مسجل مع هذا المدرس' });
    }

    const course = selectedTeacherEntry.courses.find((c) => c.courseName === courseName);

    if (!course) {
      return res.status(404).json({ message: 'الطالب غير مسجل في هذه المادة مع المدرس المحدد' });
    }

    // Fetch the teacher's details
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'المدرس غير موجود' });
    }

    // Find or create today's attendance record for this teacher and course
    const todayDate = getDateTime();
    let attendance = await Attendance.findOne({
      date: todayDate,
      teacher: teacherId,
      course: courseName,
    });

    if (!attendance) {
      attendance = new Attendance({
        date: todayDate,
        teacher: teacherId,
        course: courseName,
        studentsPresent: [],
        netProfitToTeacher: { amount: 0, feesAmount: 0 }, // Initialize net profit
      });
    }

    // Check if the student is already marked present
    const isStudentPresent = attendance.studentsPresent.some(
      (entry) => entry.student.toString() === student._id.toString()
    );

    if (isStudentPresent) {
      return res.status(400).json({ message: 'تم تسجيل حضور الطالب بالفعل لهذه المادة' });
    }

    // Calculate the number of times the student has attended the same course
    const attendanceCount = await Attendance.countDocuments({
      'studentsPresent.student': student._id,
      teacher: teacherId,
      course: courseName,
    });

    console.log('Attendance Count:', attendanceCount);

    // Calculate payment details
    const isPerSession = student.paymentType === 'perSession';
    let amountPaid;
    
    // Handle fixed amount with proper type checking
    if ((fixedAmountCheck === true || fixedAmountCheck === "true") && fixedAmount) {
      console.log('Using fixed amount:', fixedAmount);
      amountPaid = parseFloat(fixedAmount);
      if (isNaN(amountPaid)) {
        console.error('Invalid fixed amount value:', fixedAmount);
        amountPaid = isPerSession ? course.amountPay : 0;
      }
    } else {
      // Handle mock check or regular amount
      amountPaid = (mockCheck === true || mockCheck === "true") ? mockAmount : (isPerSession ? course.amountPay : 0);
    }
    const feesApplied = mockCheck === "true" ? mockFees : (isPerSession ? teacher.teacherFees : 0);
    const teacherProfit = isPerSession ? amountPaid - feesApplied : 0;

    // Add the student to the attendance record
    attendance.studentsPresent.push({
      student: student._id,
      addedBy: employeeId,
      amountPaid,
      feesApplied,
    });

    // Update totals
    if (isPerSession) {
      attendance.totalAmount += amountPaid;
      attendance.totalFees += feesApplied;

      // Update teacher's profit
      attendance.netProfitToTeacher.amount += teacherProfit;
      attendance.netProfitToTeacher.feesAmount += feesApplied;
    }

    // Save the attendance record
    await attendance.save();

    // Send message to parent in Arabic
    const parentMessage = `
عزيزي ولي أمر الطالب ${student.studentName},
-----------------------------
نود إعلامكم بأن الطالب قد تم تسجيل حضوره اليوم .
الكورس: ${course.courseName}
المعلم: ${teacher.teacherName}
التاريخ: ${new Date().toLocaleDateString()}
شكرًا لتعاونكم.
`;

    try {
      await waziper.sendTextMessage(instanceId, `2${student.studentParentPhone}@c.us`, parentMessage).then((response) => {
        console.log('Message sent:', response.data);
      }).catch((error) => {
        console.error('Error sending message:', error);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Continue with the process even if message sending fails
    }

    // Populate updated attendance data
    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'studentsPresent.student',
      })
      .populate('studentsPresent.addedBy', 'employeeName')
      .populate('invoices.addedBy', 'employeeName'); // Populate invoice details


    console.log(student);
    res.status(201).json({
      message: 'تم تسجيل الحضور',
      studentData: {
        studentName: student.studentName,
        studentCode: student.studentCode,
        amountRemaining: course.amountRemaining,
        studentTeacher: {
          teacherName: teacher.teacherName,
          subjectName: courseName,
        },
        amountPaid,
        feesApplied,
        attendanceCount: attendanceCount + 1,
      },
      students: updatedAttendance.studentsPresent,
    });

  } catch (error) {
    console.error('Error attending student:', error);
    res.status(500).json({ message: 'يبدو ان هناك مشكله ما حاول مره اخري' });
  }
};

const getAttendedStudents = async (req, res) => {
  try {
    const { teacherId, courseName } = req.query;
    if (!teacherId || !courseName) {
      console.log(teacherId, courseName);
      return res.status(400).json({ message: 'Teacher ID and course name are required' });
    }

    // Fetch attendance record for today
    const attendance = await Attendance.findOne({
      date: getDateTime(),
      teacher: teacherId,
      course: courseName,
    })
      .populate({
        path: 'studentsPresent.student',
        
      })
      .populate('studentsPresent.addedBy', 'employeeName')
      .populate('invoices.addedBy', 'employeeName') // Populate invoice details
      .populate('teacher', 'teacherName teacherFees');

    if (!attendance) {
      console.log('No attendance found');
      return res.status(404).json({ message: 'لا يوجد حضور اليوم' });
    }

    // Filter out null students (to prevent errors in calculations)
    const filteredStudents = attendance.studentsPresent.filter(sp => sp.student);

    // Calculate attendance count for each student
    const studentAttendanceCounts = await Promise.all(
      filteredStudents.map(async ({ student }) => {
      const attendanceCount = await Attendance.countDocuments({
        'studentsPresent.student': student._id,
        teacher: teacherId,
        course: courseName,
        createdAt: { $gte: new Date('2025-04-20T00:00:00.000Z') }
      });
      return { studentId: student._id, attendanceCount };
      })
    );

    // Add attendance count to each student
    const studentsWithAttendanceCount = filteredStudents.map((student) => {
      const attendanceCount = studentAttendanceCounts.find(
      (count) => count.studentId.toString() === student.student._id.toString()
      )?.attendanceCount || 0;
      return { ...student.toObject(), attendanceCount };
    });

    // **Recalculate all values dynamically**
    let totalAmount = 0;
    let totalFees = 0;
    let netProfitToTeacher = { amount: 0, feesAmount: 0 };

    filteredStudents.forEach(({ amountPaid, feesApplied }) => {
      totalAmount += amountPaid;
      totalFees += feesApplied;
      netProfitToTeacher.amount += (amountPaid - feesApplied);
      netProfitToTeacher.feesAmount += feesApplied;
    });

    // **Subtract invoice amounts from the teacher's net profit**
    const totalInvoiceAmount = attendance.invoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    netProfitToTeacher.amount -= totalInvoiceAmount;

    // **Update attendance record dynamically**
    attendance.totalAmount = totalAmount;
    attendance.totalFees = totalFees;
    attendance.netProfitToTeacher = netProfitToTeacher;

    await attendance.save();
    console.log(studentsWithAttendanceCount);
    res.status(200).json({
      students: studentsWithAttendanceCount,
      invoices: attendance.invoices, // Include invoices in response
      message: 'حضور المدرس والمادة المحددة',
      totalAmount,
      totalFees,
      netProfitToTeacher,
      totalInvoiceAmount,
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'يبدو ان هناك مشكله ما حاول مره اخري' });
  }
};


const editStudentAmountRemainingAndPaid = async (req, res) => {
  const { id } = req.params;
  const { amountRemaining,amountPaid, teacherId, courseName } = req.body;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find the specific course for the student
    const teacherEntry = student.selectedTeachers.find(
      (t) => t.teacherId.toString() === teacherId
    );
    if (!teacherEntry) {
      return res
        .status(404)
        .json({ message: 'Teacher not found for this student' });
    }

    const course = teacherEntry.courses.find(
      (c) => c.courseName === courseName
    );
    if (!course) {
      return res
        .status(404)
        .json({ message: 'Course not found for this student' });
    }

    // Calculate the difference
    const difference = course.amountRemaining - amountRemaining;
    course.amountRemaining = amountRemaining;

    // Update attendance record
    const attendance = await Attendance.findOne({
      date: getDateTime(),
      teacher: teacherId,
      course: courseName,
      'studentsPresent.student': id,
    });

    if (attendance) {
      const studentAttendance = attendance.studentsPresent.find(
        (entry) => entry.student.toString() === id
      );

      if (studentAttendance) {
        studentAttendance.amountPaid = amountPaid;
        studentAttendance.amountPaid += difference;
        studentAttendance.feesApplied = await Teacher.findById(teacherId).then(
          (t) => t.teacherFees
        );

        // Recalculate totals dynamically
        attendance.totalAmount = attendance.studentsPresent.reduce(
          (sum, s) => sum + s.amountPaid,
          0
        );
        attendance.totalFees = attendance.studentsPresent.reduce(
          (sum, s) => sum + s.feesApplied,
          0
        );
        attendance.netProfitToTeacher.amount =
          attendance.totalAmount - attendance.totalFees;
        attendance.netProfitToTeacher.feesAmount = attendance.totalFees;

        await attendance.save();
      }
    }

    await student.save();
    res.status(200).json({ message: 'Amount updated successfully', student });
  } catch (error) {
    console.error('Error updating amount:', error);
    res.status(500).json({ message: 'Error updating amount' });
  }
};

const deleteAttendStudent = async (req, res) => {
  const { id } = req.params;
  const { teacherId, courseName } = req.query;
  try {
    console.log('Deleting student:', id , 'Teacher:', teacherId, 'Course:', courseName);

    // Find the attendance record for today and the student being removed
    const attendance = await Attendance.findOne(
      { 
        date: getDateTime(),
        teacher: teacherId,
        course: courseName,
        'studentsPresent.student': id 
      },
      { 'studentsPresent.$': 1 } // Fetch only the matching student
    );
    console.log('Attendance:', attendance);
    if (!attendance || !attendance.studentsPresent.length) {
      return res
        .status(404)
        .json({ message: 'Student not found in attendance' });
    }


    // Remove student from attendance
    const updateResult = await Attendance.updateOne(
      { date: getDateTime(),
        teacher: teacherId,
        course: courseName
      },
      {
        $pull: { studentsPresent: { student: id } },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Failed to remove student' });
    }


    res.status(200).json({
      message: 'Student removed from attendance',
    });
  } catch (error) {
    console.error('Error deleting student from attendance:', error);
    res.status(500).json({
      message: 'An error occurred while deleting the student from attendance',
    });
  }
};

const downloadAttendanceExcel = async (req, res) => {
  try {
    const { teacherId, courseName } = req.query;
    if (!teacherId || !courseName) {
      return res
        .status(400)
        .json({ message: 'Teacher ID and course name are required' });
    }

    // Fetch today's attendance for the specific teacher and course
    const attendance = await Attendance.findOne({
      date: getDateTime(),
      teacher: teacherId,
      course: courseName,
    })
      .populate('studentsPresent.student')
      .populate('studentsPresent.addedBy', 'employeeName')
      .populate('invoices.addedBy', 'employeeName')
      .populate('teacher');

    if (!attendance) {
      return res
        .status(404)
        .json({ message: 'No attendance record found for this teacher' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Define styles
    const styles = {
      header: {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 16 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' },
        },
      },
      columnHeader: {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2E75B6' },
        },
      },
      cell: {
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      },
      summaryCell: {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      }
    };

    // Add report title
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = `Attendance Report - ${attendance.teacher.teacherName} - ${attendance.course}`;
    worksheet.getCell('A1').style = styles.header;

    let rowIndex = 2;
    let totalAmount = 0;
    let totalFees = 0;
    let netProfit = 0;
    let totalInvoiceAmount = 0;

    // Add column headers
    worksheet.getRow(rowIndex).values = [
      '#',
      'Student Name',
      'Amount Paid (EGP)',
      'Student Code'
    ];
    worksheet.getRow(rowIndex).eachCell((cell) => (cell.style = styles.columnHeader));
    rowIndex++;

    // Add student data
    attendance.studentsPresent.forEach(({ student, amountPaid, feesApplied }, index) => {
      if (!student) return;

      totalAmount += amountPaid;
      totalFees += feesApplied;
      netProfit += amountPaid - feesApplied;

      worksheet.getRow(rowIndex).values = [
        index + 1,
        student.studentName,
        amountPaid - feesApplied,
        student.studentCode
      ];
      worksheet.getRow(rowIndex).eachCell((cell) => (cell.style = styles.cell));
      rowIndex++;
    });




  rowIndex++; // Space before invoices
    if (attendance.invoices.length > 0) {
      // Add invoice section header
      worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
      worksheet.getCell(`A${rowIndex}`).value = 'Invoice Details';
      worksheet.getCell(`A${rowIndex}`).style = styles.header;
      rowIndex++;

      // Add invoice headers
      worksheet.getRow(rowIndex).values = [
      'Invoice Details',
      'Invoice Amount (EGP)',
      'Type',
      ];
      worksheet
      .getRow(rowIndex)
      .eachCell((cell) => (cell.style = styles.columnHeader));
      rowIndex++;

      attendance.invoices.forEach(
      ({ invoiceDetails, invoiceAmount, time, addedBy }) => {
      const isNegative = invoiceAmount < 0;
      const displayAmount = isNegative ? Math.abs(invoiceAmount) : invoiceAmount;
      totalInvoiceAmount += invoiceAmount;
      
      const invoiceType = isNegative ? 'اضافه' : 'خصم';

      worksheet.getRow(rowIndex).values = [
      invoiceDetails,
      displayAmount, // Using absolute value for display
      invoiceType,
      ];
      
      // Apply special styling based on type (green for اضافه, red for خصم)
      worksheet
      .getRow(rowIndex)
      .eachCell((cell) => {
      if (isNegative) {
      cell.style = {
      ...styles.cell,
      fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCFFCC' } // Light green background for اضافه
      },
      font: {
      color: { argb: '008000' }, // Green text for اضافه
      bold: true
      }
      };
      } else {
      cell.style = {
      ...styles.cell,
      fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCB' } // Light red background for خصم
      },
      font: {
      color: { argb: 'FF0000' }, // Red text for خصم
      bold: true
      }
      };
      }
      });
      rowIndex++;
      }
      );

      rowIndex++; // Space before totals
    }



    
    rowIndex++; // Add space

    // Add summary rows
    const summaryData = [
      { title: 'Total', value: netProfit, color: 'e2ed47' }, // New color for Total
      {
      title: 'Total Invoices (EGP)',
      value: totalInvoiceAmount,
      color: 'FFA500', // Orange for Invoices
      },
      {
      title: 'Total Net Profit (EGP)',
      value: netProfit - totalInvoiceAmount,
      color: '4CAF50', // Green for Net Profit
      },
    ];

    summaryData.forEach(({ title, value, color }) => {
      worksheet.getCell(`A${rowIndex}`).value = title;
      worksheet.getCell(`A${rowIndex}`).style = styles.summaryCell;
      
      worksheet.getCell(`B${rowIndex}`).value = value;
      worksheet.getCell(`B${rowIndex}`).style = {
        ...styles.summaryCell,
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color }
        }
      };
      rowIndex++;
    });

    // Set column widths
    worksheet.columns = [
      { width: 30 }, // Title/Student Name
      { width: 20 }, // Value/Amount
      { width: 20 }, // Amount Paid
      { width: 20 }  // Student Code
    ];

    // Send file via WhatsApp API
    const buffer = await workbook.xlsx.writeBuffer();
    const base64Excel = buffer.toString('base64');
    const fileName = `Attendance_Report_${attendance.teacher.teacherName}_${attendance.course}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    await waziper.sendMediaMessage(
      instanceId,
      `2${attendance.teacher.teacherPhoneNumber}@c.us`,
      `Attendance Report for ${attendance.teacher.teacherName} - ${attendance.course} - ${new Date().toDateString()}`,
      base64Excel,
      fileName
    )
    .then((response) => {
      console.log('Excel sent:', response.data);
    })
    .catch((error) => {
      console.error('Error sending Excel:', error);
    });

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating attendance Excel:', error);
    res.status(500).json({ message: 'Error generating attendance Excel' });
  }
};

const selectDevice = async (req, res) => {
  const {deviceId} = req.params;

  console.log('Device ID:', deviceId, req.employee._id);
  try{
    const employee = await Employee.findByIdAndUpdate(req.employee._id, {
    device :  deviceId
    }, {new: true});
    console.log('Employee:', employee);
    res.status(200).json({ message: 'Device selected successfully', employee });
  }catch (error) {
    console.error('Error selecting device:', error);
    res.status(500).json({ message: 'Error selecting device' });
  }
      
}

const addTeacherInvoice = async (req, res) => {
  const { teacherId, courseName, invoiceDetails,invoiceAmount } = req.body;
  const employeeId = req.employeeId;
  if( !teacherId || !courseName){
    return res.status(400).json({ message: 'يجب اختيار الكورس ' });
  }

  try {
    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'المدرس غير موجود' });
    }

    // Find or create today's attendance record for this teacher and course
    const todayDate = getDateTime();
    let attendance = await Attendance.findOne({
      date: todayDate,
      teacher: teacherId,
      course: courseName,
    });

    if (!attendance) {
      attendance = new Attendance({
        date: todayDate,
        teacher: teacherId,
        course: courseName,
        studentsPresent: [],
        netProfitToTeacher: { amount: 0, feesAmount: 0 }, // Initialize net profit
        invoices: [],
      });
    }

    // Add the invoice to the attendance record
    attendance.invoices.push({
      invoiceDetails,
      invoiceAmount,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      addedBy: employeeId,
    });

    // Save the attendance record
    await attendance.save();

    res.status(201).json({ message: 'تم اضافه الفاتوره بنجاح',});

  } catch (error) {
    console.error('Error adding teacher invoice:', error);
    res.status(500).json({ message: 'يبدو ان هناك مشكله ما حاول مره اخري' });
  }

};

const deleteInvoice = async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const attendance = await Attendance.findOne({
      'invoices._id': invoiceId,
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoiceIndex = attendance.invoices.findIndex(
      (inv) => inv._id.toString() === invoiceId
    );

    attendance.invoices.splice(invoiceIndex, 1);
    await attendance.save();

    res.status(200).json({ message: 'Invoice deleted successfully' });
  }
  catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Error deleting invoice' });
  }
};

const updateInvoice = async (req, res) => {
  const { invoiceId } = req.params;
  const { invoiceDetails, invoiceAmount } = req.body;

  try {
    const attendance = await Attendance.findOne({
      'invoices._id': invoiceId,
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = attendance.invoices.find(
      (inv) => inv._id.toString() === invoiceId
    );
    console.log('Invoice:', invoiceDetails, invoiceAmount);
    console.log('Invoice:', invoice);
    invoice.invoiceDetails = invoiceDetails;
    invoice.invoiceAmount = invoiceAmount;

    await attendance.save();

    res.status(200).json({ message: 'Invoice updated successfully' });
  }
  catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Error updating invoice' });
  } 

};


// ======================================== End Attendance ======================================== //



// ======================================== handel Attendace ======================================== //

const handelAttendance = async (req, res) => {
  const allTeachers = await Teacher.find({});
  res.render('employee/handelAttendance', {
    title: 'Handel Attendance',
    path: '/employee/handel-attendance',
    allTeachers: allTeachers,
  });
}

const getAttendanceByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'يرجى تقديم تاريخ بداية ونهاية صالحين.' });
    }

    const attendances = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('studentsPresent.student')
      .populate('studentsPresent.addedBy', 'employeeName')
      .populate('invoices.addedBy', 'employeeName')
      .populate('teacher', 'teacherName subjectName paymentType');

      
    if (!attendances.length) {
      return res
        .status(404)
        .json({ message: 'لا يوجد حضور في النطاق الزمني المحدد.' });
    }

    let totalAmount = 0,
      totalFees = 0,
      totalInvoiceAmount = 0;
    const teacherData = {},
      employeeData = {},
      invoicesByTeacher = {};

    attendances.forEach((attendance) => {
      const teacherId = attendance.teacher._id.toString();

      if (!teacherData[teacherId]) {
        teacherData[teacherId] = {
          teacherId: teacherId,
          teacherName: attendance.teacher.teacherName,
          subjectName: attendance.teacher.subjectName,
          paymentType: attendance.teacher.paymentType,
          totalAmount: 0,
          totalFees: 0,
          netProfit: 0,
          totalStudents: 0,
        };
      }

      attendance.studentsPresent.forEach(
        ({ student, addedBy, amountPaid, feesApplied }) => {
          if (!student) return;

          teacherData[teacherId].totalAmount += amountPaid;
          teacherData[teacherId].totalFees += feesApplied;
          teacherData[teacherId].totalStudents++;

          totalAmount += amountPaid;
          totalFees += feesApplied;

          const employeeId = addedBy._id.toString();
          if (!employeeData[employeeId]) {
            employeeData[employeeId] = {
              employeeId: employeeId,
              employeeName: addedBy.employeeName,
              count: 0,
              totalAmount: 0,
            };
          }
          employeeData[employeeId].count++;
          employeeData[employeeId].totalAmount += amountPaid;
        }
      );

      attendance.invoices.forEach(({ invoiceAmount }) => {
        totalInvoiceAmount += invoiceAmount;
        if (!invoicesByTeacher[teacherId]) {
          invoicesByTeacher[teacherId] = 0;
        }
        invoicesByTeacher[teacherId] += invoiceAmount;
      });
    });

    Object.values(teacherData).forEach((teacher) => {
      teacher.netProfit = teacher.totalAmount - teacher.totalFees;
    });

    res.status(200).json({
      message: 'بيانات الحضور للنطاق الزمني',
      totalAmount,
      totalFees,
      totalInvoiceAmount,
      finalNetProfit: totalAmount - totalFees - totalInvoiceAmount,
      teachersSummary: Object.values(teacherData),
      employeesSummary: Object.values(employeeData),
      invoicesByTeacher,
      attendanceRecords: attendances,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'يبدو ان هناك مشكله ما حاول مره اخري' });
  }
};


const downloadAttendanceExcelByDate = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Fetch attendance records within the date range
    const attendances = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('studentsPresent.student')
      .populate('studentsPresent.addedBy', 'employeeName')
      .populate('teacher', 'teacherName subjectName teacherPhoneNumber')
      .populate('invoices.addedBy', 'employeeName');
      

    if (!attendances.length) {
      return res.status(404).json({
        message: 'No attendance records found for the given date range',
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Styles
    const styles = {
      header: {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 16 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' },
        },
      },
      columnHeader: {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2E75B6' },
        },
      },
      cell: {
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      },
      totalRow: {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF5733' },
        },
      },
    };

    // Title
    worksheet.mergeCells('A1:H1');
    worksheet.getCell(
      'A1'
    ).value = `Attendance Report - ${startDate} to ${endDate}`;
    worksheet.getCell('A1').style = styles.header;

    let rowIndex = 2;
    const teacherData = {};
    const employeeData = {};
    const invoiceData = {};
    let totalAmount = 0,
      totalFees = 0,
      totalInvoices = 0;

    // Group Data
    attendances.forEach((attendance) => {
      const teacherId = attendance.teacher._id.toString();
      const teacherName = attendance.teacher.teacherName;
      const subjectName = attendance.teacher.subjectName;

      if (!teacherData[teacherId]) {
        teacherData[teacherId] = {
          teacherName,
          subjectName,
          totalAmount: 0,
          totalFees: 0,
          students: [],
          invoices: [],
        };
      }

      attendance.studentsPresent.forEach(
        ({ student, addedBy, amountPaid, feesApplied }) => {
          if (!student) return;

          teacherData[teacherId].totalAmount += amountPaid;
          teacherData[teacherId].totalFees += feesApplied;
          totalAmount += amountPaid;
          totalFees += feesApplied;

          const employeeId = addedBy._id.toString();
          if (!employeeData[employeeId]) {
            employeeData[employeeId] = {
              employeeName: addedBy.employeeName,
              totalAmount: 0,
              count: 0,
            };
          }
          employeeData[employeeId].totalAmount += amountPaid;
          employeeData[employeeId].count++;

          teacherData[teacherId].students.push({
            studentName: student.studentName,
            phoneNumber: student.studentPhoneNumber,
            amountPaid,
            feesApplied,
            netProfit: amountPaid - feesApplied,
            addedBy: addedBy.employeeName,
          });
        }
      );

      attendance.invoices.forEach(
        ({ invoiceDetails, invoiceAmount, time, addedBy }) => {
          totalInvoices += invoiceAmount;
          teacherData[teacherId].invoices.push({
            invoiceDetails,
            invoiceAmount,
            time,
            addedBy: addedBy.employeeName,
          });

          if (!invoiceData[teacherId]) {
            invoiceData[teacherId] = 0;
          }
          invoiceData[teacherId] += invoiceAmount;
        }
      );
    });

    // **Employee Summary**
    worksheet.getRow(rowIndex).values = ['Employee Summary'];
    worksheet.getRow(rowIndex).eachCell((cell) => (cell.style = styles.header));
    rowIndex++;

    worksheet.getRow(rowIndex).values = [
      'Employee Name',
      'Students Added',
      'Total Amount (EGP)',
      'Contribution (%)',
    ];
    worksheet
      .getRow(rowIndex)
      .eachCell((cell) => (cell.style = styles.columnHeader));
    rowIndex++;

    for (const employeeId in employeeData) {
      const employee = employeeData[employeeId];
      const contributionPercentage = (
        (employee.totalAmount / totalAmount) *
        100
      ).toFixed(2);

      worksheet.getRow(rowIndex).values = [
        employee.employeeName,
        employee.count,
        employee.totalAmount,
        `${contributionPercentage}%`,
      ];
      worksheet.getRow(rowIndex).eachCell((cell) => (cell.style = styles.cell));
      rowIndex++;
    }

    rowIndex++; // Space before teacher data

    // **Teacher Data**
    for (const teacherId in teacherData) {
      const teacher = teacherData[teacherId];
      const teacherNetProfit =
        teacher.totalAmount - teacher.totalFees - (invoiceData[teacherId] || 0);
      const teacherProfitContribution = (
        (teacherNetProfit / (totalAmount - totalFees - totalInvoices)) *
        100
      ).toFixed(2);
      rowIndex++;
      worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
      worksheet.getCell(
        `A${rowIndex}`
      ).value = `Teacher: ${teacher.teacherName} - Subject: ${teacher.subjectName}`;
      worksheet.getCell(`A${rowIndex}`).style = styles.header;
      rowIndex++;

      // **Student Data**
      worksheet.getRow(rowIndex).values = [
        'Student Name',
        'Phone Number',
        'Amount Paid',
        'Fees Applied',
        'Net Profit',
        'Added By',
      ];
      worksheet
        .getRow(rowIndex)
        .eachCell((cell) => (cell.style = styles.columnHeader));
      rowIndex++;

      teacher.students.forEach((student) => {
        worksheet.getRow(rowIndex).values = [
          student.studentName,
          student.phoneNumber,
          student.amountPaid,
          student.feesApplied,
          student.netProfit,
          student.addedBy,
        ];
        worksheet
          .getRow(rowIndex)
          .eachCell((cell) => (cell.style = styles.cell));
        rowIndex++;
      });

      // **Invoices Section**
      let invoiceTeacherTotal = 0;
      if (teacher.invoices.length > 0) {
        rowIndex++;
        worksheet.getRow(rowIndex).values = ['Invoices'];
        worksheet
          .getRow(rowIndex)
          .eachCell((cell) => (cell.style = styles.header));
        rowIndex++;

        worksheet.getRow(rowIndex).values = [
          'Invoice Details',
          'Amount (EGP)',
          'Time',
          'Added By',
        ];
        worksheet
          .getRow(rowIndex)
          .eachCell((cell) => (cell.style = styles.columnHeader));
        rowIndex++;

        teacher.invoices.forEach((invoice) => {
          invoiceTeacherTotal += invoice.invoiceAmount;
          worksheet.getRow(rowIndex).values = [
            invoice.invoiceDetails,
            invoice.invoiceAmount,
            invoice.time,
            invoice.addedBy,
          ];
          worksheet
            .getRow(rowIndex)
            .eachCell((cell) => (cell.style = styles.cell));
          rowIndex++;
        });
      }
      rowIndex++;
      // Add headers explaining each total
      worksheet.getRow(rowIndex ).values = [
        '',
        '',
        'Amount Paid (EGP)',
        'Center Fees (EGP)',
        'Invoices (EGP)',
        'Net Profit (EGP)',
      ];
      worksheet
        .getRow(rowIndex )
        .eachCell((cell) => (cell.style = styles.columnHeader));

      // **Teacher Totals**
      worksheet.getRow(rowIndex+1).values = [
        `Total for ${teacher.teacherName}`,
        '',
        teacher.totalAmount,
        teacher.totalFees,
        invoiceTeacherTotal,
        teacherNetProfit,
        `${teacherProfitContribution}%`,
      ];

      worksheet
        .getRow(rowIndex+1)
        .eachCell((cell, colNumber) => {
          if (colNumber === 6 || colNumber === 7) {
        cell.style = {
          ...styles.totalRow,
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4CAF50' }, // Green color
          },
        };
          } else {
        cell.style = styles.totalRow;
          }
        });
      rowIndex++;
    }

    rowIndex++; // Space before overall summary
    rowIndex++; // Space before overall summary

    // **Overall Summary Header**
    worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = 'Overall Summary';
    worksheet.getCell(`A${rowIndex}`).style = styles.header;
    rowIndex++;

    // Add headers explaining each total
    worksheet.getRow(rowIndex + 1).values = [
      '',
      '',
      'Total Amount Paid (EGP)',
      'Total Center Fees (EGP)',
      'Total Invoices (EGP)',
      'Net Profit (EGP)',
    ];
    worksheet
      .getRow(rowIndex + 1)
      .eachCell((cell) => (cell.style = styles.columnHeader));
    // **Overall Summary**
    worksheet.getRow(rowIndex + 2).values = [
      'Overall Totals',
      '',
      totalAmount,
      totalFees,
      totalInvoices,
      totalAmount - totalFees - totalInvoices,
    ];
    worksheet
      .getRow(rowIndex + 2)
      .eachCell((cell, colNumber) => {
      if (colNumber === 6) {
        cell.style = {
        ...styles.totalRow,
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4CAF50' }, // Green color
        },
        };
      } else {
        cell.style = styles.totalRow;
      }
      });

    worksheet.columns = [
      { width: 35 },
      { width: 25 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 25 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
    ];

    // Export Excel file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Attendance_Report_${new Date().toDateString()}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating attendance Excel:', error);
    res.status(500).json({ message: 'Error generating attendance Excel' });
  }
};



const downloadAndSendExcelForTeacherByDate = async (req, res) => {
  const { teacherId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Fetch attendance records within the given date range
    const attendance = await Attendance.findOne({
      date: { $gte: startDate, $lte: endDate },
      teacher: teacherId,
    })
      .populate({
        path: 'studentsPresent.student',
        populate: {
          path: 'selectedTeachers.teacherId',
          select:
            'teacherName subjectName teacherPhoneNumber teacherFees paymentType',
        },
      })
      .populate('studentsPresent.addedBy', 'employeeName')
      .populate('teacher', 'teacherName teacherPhoneNumber subjectName paymentType')
      .populate('invoices.addedBy', 'employeeName');

    if (!attendance || attendance.length === 0) {
      return res.status(404).json({
        message: 'No attendance records found for the given date range',
      });
    }

    // Filter teacher-related student entries safely using optional chaining
    const teacherRelatedStudents = attendance.studentsPresent;

    if (teacherRelatedStudents.length === 0) {
      return res
        .status(404)
        .json({ message: 'No students found for the given teacher' });
    }

    // Get teacher info (assuming all entries are for the same teacher)
    const teacher = attendance.teacher;
    
    console.log('Teacher:', teacher);
    const teacherName = teacher.teacherName.replace(/\s+/g, '_'); // Replace spaces with underscores
    const teacherPhoneNumber = teacher.teacherPhoneNumber;
    const isPerSession = teacher.paymentType === 'perSession';
    console.log( teacherName , teacherPhoneNumber , isPerSession);
    // Create workbook and worksheet using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Define reusable styles
    const styles = {
      header: {
        font: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' },
        },
      },
      columnHeader: {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2E75B6' },
        },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      },
      cell: {
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      },
      totalRow: {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF5733' },
        },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      },
      studentCountRow: {
        font: { bold: true, size: 14, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4CAF50' },
        },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      },
    };

    // Add report title
    worksheet.mergeCells('A1:H1');
    worksheet.getCell(
      'A1'
    ).value = `Attendance Report for ${teacherName} (${startDate} to ${endDate})`;
    worksheet.getCell('A1').style = styles.header;

    // Set column headers (including the attendance date)
    const headerRowValues = isPerSession
      ? [
          'Student Name',
          // 'Phone Number',
          'Amount Paid (EGP)',
          // 'Center Fees (EGP)',
          // 'Net Profit (EGP)',
          // 'Added By',
          'Student Code',
        ]
      : [
          'Student Name',
          // 'Phone Number',
          'Amount Paid (EGP)',
          // 'Amount Remaining (EGP)',
          // 'Added By',
          'Student Code',
        ];

    worksheet.getRow(2).values = headerRowValues;
    worksheet.getRow(2).eachCell((cell) => (cell.style = styles.columnHeader));

    // Populate student data rows
    let rowIndex = 3;
    teacherRelatedStudents.forEach((entry) => {
      const studentName = entry.student.studentName;
      const phoneNumber = entry.student.studentPhoneNumber;
      const amountPaid = entry.amountPaid;
      const feesApplied = entry.feesApplied || 0;
      const addedBy = entry.addedBy ? entry.addedBy.employeeName : 'Unknown';
      const studentCode = entry.student.studentCode;

      if (isPerSession) {
        const netProfit = amountPaid - feesApplied;
        worksheet.getRow(rowIndex).values = [
          studentName,
          // phoneNumber,
          amountPaid,
          // feesApplied,
          // netProfit,
          // addedBy,
          studentCode,
        ];
      } else {
        const amountRemaining = amountPaid - feesApplied;
        worksheet.getRow(rowIndex).values = [
          studentName,
          // phoneNumber,
          amountPaid,
          // amountRemaining,
          // addedBy,
          studentCode,
        ];
      }
      worksheet.getRow(rowIndex).eachCell((cell) => (cell.style = styles.cell));
      rowIndex++;
    });

    // Calculate totals
    const totalAmountPaid = teacherRelatedStudents.reduce(
      (sum, entry) => sum + entry.amountPaid,
      0
    );
    const totalFees = teacherRelatedStudents.reduce(
      (sum, entry) => sum + (entry.feesApplied || 0),
      0
    );
    const totalNetProfit = teacherRelatedStudents.reduce(
      (sum, entry) => sum + (entry.amountPaid - (entry.feesApplied || 0)),
      0
    );

    // Add totals row
    if (isPerSession) {
      worksheet.getRow(rowIndex).values = [
        'Total',
        '',
        totalAmountPaid,
        totalFees,
        totalNetProfit,
        '',
        '',
      ];
    } else {
      worksheet.getRow(rowIndex).values = [
        'Total',
        '',
        totalAmountPaid,
        totalAmountPaid - totalFees,
        '',
        '',
      ];
    }
    worksheet
      .getRow(rowIndex)
      .eachCell((cell) => (cell.style = styles.totalRow));
    rowIndex++;

    // Add a summary row for total student count
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
    worksheet.getCell(
      `A${rowIndex}`
    ).value = `Total Students for ${teacherName}: ${teacherRelatedStudents.length}`;
    worksheet.getCell(`A${rowIndex}`).style = styles.studentCountRow;

    rowIndex++; // Space before invoices

    // Add invoice section header
    worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = 'Invoice Details';
    worksheet.getCell(`A${rowIndex}`).style = styles.header;
    rowIndex++;

    // Add invoice headers
    worksheet.getRow(rowIndex).values = [
      'Invoice Details',
      'Invoice Amount (EGP)',
      'Time',
      'Added By',
    ];
    worksheet
      .getRow(rowIndex)
      .eachCell((cell) => (cell.style = styles.columnHeader));
    rowIndex++;

    let totalInvoiceAmount = 0;
    attendance.invoices.forEach(
      ({ invoiceDetails, invoiceAmount, time, addedBy }) => {
        totalInvoiceAmount += invoiceAmount;

        worksheet.getRow(rowIndex).values = [
          invoiceDetails,
          invoiceAmount,
          time,
          addedBy.employeeName,
        ];
        worksheet
          .getRow(rowIndex)
          .eachCell((cell) => (cell.style = styles.cell));
        rowIndex++;
      }
    );

    rowIndex++; // Space before totals

    // Add total invoices row
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = 'Total Invoices';
    worksheet.getCell(`A${rowIndex}`).style = styles.totalRow;
    worksheet.getCell(`C${rowIndex}`).value = totalInvoiceAmount;
    worksheet.getCell(`C${rowIndex}`).style = styles.totalRow;
    rowIndex++;

    rowIndex++; // Space before final summary

    // Add final summary header
    worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = 'Final Summary';
    worksheet.getCell(`A${rowIndex}`).style = styles.header;
    rowIndex++;

    // Add total row with new headers
    worksheet.getRow(rowIndex).values = [
      'Total Amount Paid (EGP)',
      'Center Fees (EGP)',
      // 'Total Invoices (EGP)',
      // 'Net Profit Before Invoice (EGP)',
      'Final Net Profit (EGP)',
    ];
    worksheet
      .getRow(rowIndex)
      .eachCell((cell) => (cell.style = styles.columnHeader));
    rowIndex++;

    worksheet.getRow(rowIndex).values = [
      totalAmountPaid,
      totalFees,
      // totalInvoiceAmount,
      // totalNetProfit,
      totalNetProfit - totalInvoiceAmount,
    ];
    worksheet
      .getRow(rowIndex)
      .eachCell((cell) => (cell.style = styles.totalRow));
    rowIndex++;

    // Adjust column widths
    worksheet.columns = [
      { width: 30 }, // Student Name
      { width: 20 }, // Phone Number
      { width: 20 }, // Amount Paid
      { width: 20 }, // Center Fees / Amount Remaining
      { width: 20 }, // Net Profit if perSession (column hidden if not)
      { width: 20 }, // Added By
      { width: 20 }, // Student Code
    ];

    // Export the workbook to a buffer and convert to Base64
    const buffer = await workbook.xlsx.writeBuffer();
    const base64Excel = buffer.toString('base64');

    // Define file name for both download and WhatsApp sending
    const fileName = `Attendance_Report_${teacherName}_${startDate}_to_${endDate}.xlsx`;

    // Send file via WhatsApp API
    await waziper
      .sendMediaMessage(
        instanceId,
        `2${teacherPhoneNumber}@c.us`,
        `Attendance Report for ${teacher.teacherName} (${startDate} to ${endDate})`,
        base64Excel,
        fileName
      )
      .then((response) => {
        console.log('WhatsApp response:', response.data);
      })
      .catch((error) => {
        console.error('Error sending Excel file via WhatsApp:', error);
      });

    console.log('Excel file sent via WhatsApp');

    // Set response headers and send the file as an attachment
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (error) {
    console.error('Error generating and sending attendance report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error processing the request' });
    }
  }
};


const downloadAndSendExcelForEmployeeByDate = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Fetch attendance records within the date range
    const attendances = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate({ path: 'studentsPresent.student', populate: { path: 'studentTeacher', select: 'teacherName subjectName teacherPhoneNumber teacherFees paymentType ' } })
      .populate('studentsPresent.addedBy', 'employeeName employeePhoneNumber');

    if (!attendances || attendances.length === 0) {
      return res.status(404).json({
        message: 'No attendance records found for the given date range',
      });
    }

    // Filter students added by the given employee

    const employeeRelatedStudents = attendances.flatMap((attendance) => attendance.studentsPresent.filter((entry) => entry.addedBy._id.toString() === id));

    if (employeeRelatedStudents.length === 0) {
      return res.status(404).json({ message: 'No students found for the given employee' });
    }

    const employee = employeeRelatedStudents[0].addedBy;
    const employeeName = employee.employeeName.replace(/\s+/g, '_'); // Replace spaces with underscores
    const employeePhoneNumber = employee.employeePhoneNumber;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Define reusable styles

    const styles = {
      header: {
        font: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
      },

      columnHeader: {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E75B6' } },
      },

      cell: {
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      },

      totalRow: {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5733' } },
      },

      studentCountRow: {
        font: { bold: true, size: 14, color: { argb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4CAF50' } }, // Green color for visibility
      },
    };


    // Add report title

    worksheet.mergeCells('A1:F1');

    worksheet.getCell('A1').value = `Attendance Report for ${employee.employeeName} (${startDate} to ${endDate})`;

    worksheet.getCell('A1').style = styles.header;

    // Add column headers

    worksheet.getRow(2).values = ['Student Name', 'Phone Number', 'Amount Paid (EGP)', 'Fees Applied (EGP)', 'Added By'];

    worksheet.getRow(2).eachCell((cell) => (cell.style = styles.columnHeader));

    let totalAmountPaid = 0;
    let totalFees = 0;
    let rowIndex = 3;
      
    // Add student data rows for related students

    employeeRelatedStudents.forEach(({ student, amountPaid, feesApplied }) => {

    const studentName = student.studentName;
    const studentPhoneNumber = student.studentPhoneNumber;

    worksheet.getRow(rowIndex).values = [studentName, studentPhoneNumber, amountPaid, feesApplied, employee.employeeName];
      
    worksheet.getRow(rowIndex).eachCell((cell) => (cell.style = styles.cell));

    totalAmountPaid += amountPaid;
    totalFees += feesApplied;

    rowIndex++;

    });

    // Add totals row

    worksheet.getRow(rowIndex).values = ['Total', '', totalAmountPaid, totalFees, ''];

    worksheet.getRow(rowIndex).eachCell((cell) => (cell.style = styles.totalRow));

    // Add total student count for the employee-related students

    rowIndex++; // Move to the next row after the totals

    worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`); // Merge all cells for the student count row

    worksheet.getCell(`A${rowIndex}`).value = `Total Students for ${employee.employeeName}: ${employeeRelatedStudents.length}`;

    worksheet.getCell(`A${rowIndex}`).style = styles.studentCountRow;

    // Adjust column widths

    worksheet.columns = [
      { width: 30 }, // Student Name
      { width: 20 }, // Phone Number
      { width: 20 }, // Amount Paid
      { width: 20 }, // Fees Applied
      { width: 20 }, // Added By
    ];

    // Export the Excel file to buffer

    const buffer = await workbook.xlsx.writeBuffer();

    const base64Excel = buffer.toString('base64');

    // File name for download and WhatsApp

    const fileName = `Attendance_Report_${employeeName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Send file via WhatsApp API

    await waziper
      .sendMediaMessage(
        instanceId,
        `2${employeePhoneNumber}@c.us`,
        `Attendance Report for ${employeeName} (${startDate} to ${endDate})`,
        base64Excel,
        fileName
      )
      .then((response) => {
        console.log('WhatsApp response:', response.data);
      })
      .catch((error) => {
        console.error('Error sending Excel file via WhatsApp:', error);
      });

    console.log('Excel file sent via WhatsApp');

    // Send the file as an attachment

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
        
    res.end();
        
  } catch (error) {

    console.error('Error generating and sending attendance report:', error);

    if (!res.headersSent) {
      
      res.status(500).json({ message: 'Error processing the request' });

    }

  }

};

// ======================================== End handel Attendace ======================================== //






// ======================================== LogOut ======================================== //


const logOut = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};

// ======================================== Student Logs ======================================== //

const getStudentLogs = async (req, res) => {
  try {
    const allTeachers = await Teacher.find({}, { teacherName: 1, courses: 1 });
    
    res.render('employee/studentLogs', {
      title: 'Student Logs',
      path: '/employee/student-logs',
      allTeachers
    });
  } catch (error) {
    console.error('Error loading student logs page:', error);
    res.status(500).send('An error occurred while loading the student logs page');
  }
};

const getStudentLogsData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { teacherId, courseName, startDate, endDate, showTimeline } = req.query;
    
    // Validate student ID
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Get student details
    const student = await Student.findById(studentId).populate('selectedTeachers.teacherId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Build query for attendance records
    const query = {
      'studentsPresent.student': studentId
    };

    // If showTimeline is true and teacherId is provided, we don't apply date filters
    if (showTimeline === 'true' && teacherId) {
      // Only filter by teacher, showing all timeline data
      console.log('Showing full timeline for teacher:', teacherId);
    } else {
      // Add date range filter if provided
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Add teacher filter if provided
    if (teacherId) {
      query.teacher = teacherId;
    }

    // Add course filter if provided
    if (courseName) {
      query.course = courseName;
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('teacher', 'teacherName')
      .populate('studentsPresent.addedBy', 'employeeName')
      .sort({ date: -1 });

    // Process attendance records to get student-specific data
    const studentAttendance = attendanceRecords.map(record => {
      const studentPresent = record.studentsPresent.find(
        sp => sp.student.toString() === studentId
      );

      if (studentPresent) {
        return {
          date: record.date,
          course: record.course,
          teacher: record.teacher,
          amountPaid: studentPresent.amountPaid,
          feesApplied: studentPresent.feesApplied,
          addedBy: studentPresent.addedBy,
          time: studentPresent.time || record.createdAt
        };
      }
      return null;
    }).filter(record => record !== null);

    // Get payment history
    const paymentHistory = student.paidHistory || [];

    // Calculate statistics
    const totalAttendance = studentAttendance.length;
    const totalAmountPaid = studentAttendance.reduce((sum, record) => sum + record.amountPaid, 0);
    
    // Get courses the student is enrolled in
    const enrolledCourses = student.selectedTeachers.flatMap(teacher => 
      teacher.courses.map(course => ({
        teacherId: teacher.teacherId._id,
        teacherName: teacher.teacherId.teacherName,
        courseName: course.courseName,
        amountPay: course.amountPay,
        amountRemaining: course.amountRemaining
      }))
    );

    res.status(200).json({
      student,
      attendanceRecords: studentAttendance,
      paymentHistory,
      statistics: {
        totalAttendance,
        totalAmountPaid
      },
      enrolledCourses
    });
  } catch (error) {
    console.error('Error fetching student logs data:', error);
    res.status(500).json({ message: 'An error occurred while fetching student logs data' });
  }
};

module.exports = {
  dashboard,
  teacherSechdule,
  // Billing
  billing_Get,
  addBill,
  getAllBills,

  // Add Student
  getAddStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  addStudent,
  uploadExcelStudents,
  downloadExcelTemplate,
  getDeviceData,
  searchStudent,
  sendWa,
  deleteStudent,
  sendCodeAgain,

  // Teacher
  teacher_Get,
  addTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,

  // Attendance
  getAttendance,
  attendStudent,
  getAttendedStudents,
  deleteAttendStudent,
  editStudentAmountRemainingAndPaid,
  downloadAttendanceExcel,
  selectDevice,
  addTeacherInvoice,
  deleteInvoice,
  updateInvoice,

  // handel Attendance
  handelAttendance,
  getAttendanceByDate,
  downloadAttendanceExcelByDate,
  downloadAndSendExcelForTeacherByDate,
  downloadAndSendExcelForEmployeeByDate,

  // Student Logs
  getStudentLogs,
  getStudentLogsData,

  logOut,
};


