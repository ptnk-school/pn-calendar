/**
 * ระบบปฏิทินปฏิบัติงาน โรงเรียนพัฒนานิคม (School Activity Calendar)
 * รองรับการแบ่งสีตามกลุ่มงาน, ทำเครื่องหมายเฉพาะ "งานที่ต้องส่ง" (📌 ส่งงาน),
 * ระบบล็อกอินแยกสิทธิ์สารสนเทศแต่ละกลุ่มงาน, ค้นหา/กรองตามปีการศึกษา,
 * ส่งออก CSV/PDF, เชื่อมต่อ Google Sheets และติดตั้งเป็นแอปบนหน้าจอโฮม (PWA)
 */

// 1. ข้อมูลกลุ่มงานของโรงเรียนและโทนสีประจำกลุ่มงาน
const DEPARTMENTS = {
  central: {
    id: 'central',
    name: 'ส่วนกลาง',
    shortName: 'ส่วนกลาง',
    pin: '6666',
    dotClass: 'bg-teal-600',
    pillClass: 'bg-teal-50 text-teal-800 border border-teal-200',
    spanBarClass: 'bg-teal-600 text-white border border-teal-700',
    activeFilterClass: 'bg-teal-600 text-white border-teal-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-teal-50'
  },
  academic: {
    id: 'academic',
    name: 'กลุ่มบริหารวิชาการ',
    shortName: 'วิชาการ',
    pin: '1111',
    dotClass: 'bg-blue-600',
    pillClass: 'bg-blue-50 text-blue-800 border border-blue-200',
    spanBarClass: 'bg-blue-600 text-white border border-blue-700',
    activeFilterClass: 'bg-blue-600 text-white border-blue-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'
  },
  student: {
    id: 'student',
    name: 'กลุ่มบริหารกิจการนักเรียน',
    shortName: 'กิจการนักเรียน',
    pin: '2222',
    dotClass: 'bg-emerald-600',
    pillClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    spanBarClass: 'bg-emerald-600 text-white border border-emerald-700',
    activeFilterClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
  },
  general: {
    id: 'general',
    name: 'กลุ่มบริหารทั่วไป',
    shortName: 'บริหารทั่วไป',
    pin: '3333',
    dotClass: 'bg-amber-500',
    pillClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    spanBarClass: 'bg-amber-500 text-white border border-amber-600',
    activeFilterClass: 'bg-amber-500 text-white border-amber-500 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
  },
  budget: {
    id: 'budget',
    name: 'กลุ่มบริหารงบประมาณและแผน',
    shortName: 'งบประมาณ/แผน',
    pin: '4444',
    dotClass: 'bg-rose-600',
    pillClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    spanBarClass: 'bg-rose-600 text-white border border-rose-700',
    activeFilterClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
  },
  personnel: {
    id: 'personnel',
    name: 'กลุ่มบริหารงานบุคคล',
    shortName: 'งานบุคคล',
    pin: '5555',
    dotClass: 'bg-purple-600',
    pillClass: 'bg-purple-50 text-purple-800 border border-purple-200',
    spanBarClass: 'bg-purple-600 text-white border border-purple-700',
    activeFilterClass: 'bg-purple-600 text-white border-purple-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'
  }
};

const ADMIN_PIN = '9999';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// 2. ข้อมูลปฏิทินการปฏิบัติงาน โรงเรียนพัฒนานิคม สพม.ลพบุรี ประจำปีงบประมาณ 2570 (ต.ค. 2569 - ก.ย. 2570)
const DEFAULT_SAMPLE_EVENTS = [
  // ================= ตุลาคม 2569 =================
  {
    id: 'pn-6910-01',
    title: 'ประชุมเชิงปฏิบัติการเขียนแผนปฏิบัติราชการ 2570',
    department: 'budget',
    academicYear: '2569',
    startDate: '2026-10-08',
    endDate: '2026-10-09',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'ประชุมเชิงปฏิบัติการจัดทำและส่งแผนปฏิบัติราชการ ประจำปีงบประมาณ 2570',
    isSubmission: true,
    updatedBy: 'กลุ่มบริหารงบประมาณและแผน'
  },
  {
    id: 'pn-6910-02',
    title: 'คณะครูเปิดเตรียมการก่อนเปิดภาคเรียน',
    department: 'personnel',
    academicYear: '2569',
    startDate: '2026-10-26',
    endDate: '2026-10-26',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'คณะครูเตรียมความพร้อมก่อนเปิดภาคเรียนที่ 2 ปีการศึกษา 2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล'
  },
  {
    id: 'pn-6910-03',
    title: 'เปิดภาคเรียนที่ 2 ปีการศึกษา 2569',
    department: 'academic',
    academicYear: '2569',
    startDate: '2026-10-28',
    endDate: '2026-10-28',
    time: '07:45 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'วันเปิดภาคเรียนที่ 2 ปีการศึกษา 2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },

  // ================= พฤศจิกายน 2569 =================
  {
    id: 'pn-6911-01',
    title: 'กิจกรรมเดินทางไกลและอยู่ค่ายพักแรม ม.3',
    department: 'student',
    academicYear: '2569',
    startDate: '2026-11-05',
    endDate: '2026-11-07',
    time: 'ตลอดวัน (ค่ายพักแรม)',
    location: 'ค่ายลูกเสือ',
    description: 'กิจกรรมพัฒนาผู้เรียน เดินทางไกลและอยู่ค่ายพักแรมลูกเสือ-เนตรนารี ชั้น ม.3',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ / กิจกรรมพัฒนาผู้เรียน'
  },
  {
    id: 'pn-6911-02',
    title: 'กิจกรรมเดินทางไกลและอยู่ค่ายพักแรม ม.1-2',
    department: 'student',
    academicYear: '2569',
    startDate: '2026-11-06',
    endDate: '2026-11-07',
    time: 'ตลอดวัน (ค่ายพักแรม)',
    location: 'ค่ายลูกเสือ',
    description: 'กิจกรรมพัฒนาผู้เรียน เดินทางไกลและอยู่ค่ายพักแรมลูกเสือ-เนตรนารี ชั้น ม.1-2',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ / กิจกรรมพัฒนาผู้เรียน'
  },
  {
    id: 'pn-6911-03',
    title: 'ทัศนศึกษา ม.1-3',
    department: 'academic',
    academicYear: '2569',
    startDate: '2026-11-07',
    endDate: '2026-11-07',
    time: 'ตลอดวัน',
    location: 'แหล่งเรียนรู้นอกสถานที่',
    description: 'กิจกรรมทัศนศึกษาแหล่งเรียนรู้นอกสถานที่ ระดับชั้นมัธยมศึกษาปีที่ 1-3',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-6911-04',
    title: 'กิจกรรม To Be Number One (กิจการนักเรียน)',
    department: 'student',
    academicYear: '2569',
    startDate: '2026-11-21',
    endDate: '2026-11-22',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมชมรม TO BE NUMBER ONE โรงเรียนพัฒนานิคม',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน'
  },
  {
    id: 'pn-6911-05',
    title: 'ประชุมผู้ปกครอง / เครือข่ายผู้ปกครอง 2/69 (กิจการนักเรียน)',
    department: 'student',
    academicYear: '2569',
    startDate: '2026-11-22',
    endDate: '2026-11-22',
    time: '08:30 - 16:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'ประชุมผู้ปกครองและเครือข่ายผู้ปกครองนักเรียน ภาคเรียนที่ 2/2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน'
  },
  {
    id: 'pn-6911-06',
    title: 'กิจกรรมลอยกระทง',
    department: 'general',
    academicYear: '2569',
    startDate: '2026-11-24',
    endDate: '2026-11-24',
    time: '08:30 - 16:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมสืบสานประเพณีลอยกระทง',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป'
  },
  {
    id: 'pn-6911-07',
    title: 'วันมหาธีรราชเจ้า',
    department: 'student',
    academicYear: '2569',
    startDate: '2026-11-26',
    endDate: '2026-11-26',
    time: '08:00 - 12:00 น.',
    location: 'ลานอเนกประสงค์ โรงเรียนพัฒนานิคม',
    description: 'พิธีวางพวงมาลาและถวายราชสดุดี เนื่องในวันมหาธีรราชเจ้า',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน'
  },

  // ================= ธันวาคม 2569 =================
  {
    id: 'pn-6912-01',
    title: 'สอบธรรมสนามหลวง',
    department: 'academic',
    academicYear: '2569',
    startDate: '2026-12-01',
    endDate: '2026-12-01',
    time: '08:30 - 16:00 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การสอบธรรมสนามหลวง ประจำปีการศึกษา 2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-6912-02',
    title: 'ค่าย STEM บรรพชีวิต (ค่าย 3 วัน 2 คืน ม.ปลาย) จ.ระยอง',
    department: 'academic',
    academicYear: '2569',
    startDate: '2026-12-02',
    endDate: '2026-12-04',
    time: 'ค่าย 3 วัน 2 คืน',
    location: 'จังหวัดระยอง',
    description: 'กิจกรรมค่าย STEM บรรพชีวิต สำหรับนักเรียนระดับชั้น ม.ปลาย ณ จ.ระยอง',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-6912-03',
    title: 'การคัดเลือก “เพชรพัฒนาประชาสัมพันธ์” รุ่นที่ 6',
    department: 'general',
    academicYear: '2569',
    startDate: '2026-12-04',
    endDate: '2026-12-04',
    time: '08:30 - 16:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมการคัดเลือกนักเรียนแกนนำ เพชรพัฒนาประชาสัมพันธ์ รุ่นที่ 6',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป / งานประชาสัมพันธ์'
  },
  {
    id: 'pn-6912-04',
    title: 'กิจกรรมวันพ่อแห่งชาติ',
    department: 'general',
    academicYear: '2569',
    startDate: '2026-12-04',
    endDate: '2026-12-04',
    time: '08:00 - 12:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมเนื่องในวันคล้ายวันพระบรมราชสมภพ รัชกาลที่ 9 และวันพ่อแห่งชาติ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป'
  },
  {
    id: 'pn-6912-05',
    title: 'การอบรม Robot Genius Camp',
    department: 'academic',
    academicYear: '2569',
    startDate: '2026-12-12',
    endDate: '2026-12-12',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'โครงการอบรมเชิงปฏิบัติการหุ่นยนต์ Robot Genius Camp',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-6912-06',
    title: 'ค่ายวิทยาศาสตร์',
    department: 'academic',
    academicYear: '2569',
    startDate: '2026-12-14',
    endDate: '2026-12-15',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมค่ายพัฒนาทักษะทางวิทยาศาสตร์',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-6912-07',
    title: 'ทำบุญตักบาตร / กิจกรรมวันคริสต์มาส / ปีใหม่นักเรียน',
    department: 'student',
    academicYear: '2569',
    startDate: '2026-12-25',
    endDate: '2026-12-25',
    time: '07:30 - 16:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมทำบุญตักบาตรส่งท้ายปีเก่า ต้อนรับปีใหม่ และกิจกรรมวันคริสต์มาส',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน / วิชาการ'
  },
  {
    id: 'pn-6912-08',
    title: 'กำหนดสอบกลางภาคเรียนที่ 2/2569',
    department: 'academic',
    academicYear: '2569',
    startDate: '2026-12-28',
    endDate: '2026-12-30',
    time: '08:30 - 16:00 น.',
    location: 'อาคารเรียน โรงเรียนพัฒนานิคม',
    description: 'การสอบวัดผลกลางภาคเรียนที่ 2 ปีการศึกษา 2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-6912-09',
    title: 'วันสิ้นปี (วันหยุดราชการ)',
    department: 'general',
    academicYear: '2569',
    startDate: '2026-12-31',
    endDate: '2026-12-31',
    time: 'ตลอดวัน',
    location: '-',
    description: 'วันหยุดเทศกาลส่งท้ายปีเก่า',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป'
  },

  // ================= มกราคม 2570 =================
  {
    id: 'pn-7001-01',
    title: 'ค่ายอนุรักษ์ธรรมชาติ (ค่าย 3 วัน 2 คืน ม.ต้น) จ.นครราชสีมา',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-01-08',
    endDate: '2027-01-10',
    time: 'ค่าย 3 วัน 2 คืน',
    location: 'จังหวัดนครราชสีมา',
    description: 'กิจกรรมค่ายอนุรักษ์ธรรมชาติ สำหรับนักเรียนระดับชั้น ม.ต้น ณ จ.นครราชสีมา',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7001-02',
    title: 'นักเรียน ม.6 สอบ O-NET ที่โรงเรียนพัฒนานิคม',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-01-11',
    endDate: '2027-01-13',
    time: '08:30 - 16:30 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET) ชั้นมัธยมศึกษาปีที่ 6',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7001-03',
    title: 'ค่ายภาวะผู้นำ ห้องเรียนนิติศาสตร์-รัฐศาสตร์ ม.4/10',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-01-11',
    endDate: '2027-01-11',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมค่ายพัฒนาภาวะผู้นำ นักเรียนแผนการเรียนนิติศาสตร์-รัฐศาสตร์ ชั้น ม.4/10',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7001-04',
    title: 'กิจกรรมวันครู / ยิงจุดโทษระดมทุน',
    department: 'personnel',
    academicYear: '2569',
    startDate: '2027-01-16',
    endDate: '2027-01-16',
    time: 'ตลอดวัน',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมงานวันครู และกิจกรรมกีฬายิงจุดโทษระดมทุนการศึกษา',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล / บริหารทั่วไป'
  },
  {
    id: 'pn-7001-05',
    title: 'การแข่งขันศิลปหัตถกรรมนักเรียน',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-01-18',
    endDate: '2027-01-19',
    time: '08:00 - 16:30 น.',
    location: 'สนามแข่งขัน',
    description: 'การแข่งขันงานศิลปหัตถกรรมนักเรียน',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7001-06',
    title: 'งานคืนสู่เหย้าศิษย์เก่า โรงเรียนพัฒนานิคม',
    department: 'general',
    academicYear: '2569',
    startDate: '2027-01-22',
    endDate: '2027-01-22',
    time: '17:00 - 22:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมงานคืนสู่เหย้าศิษย์เก่าโรงเรียนพัฒนานิคม',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป'
  },
  {
    id: 'pn-7001-07',
    title: 'กิจกรรม Chinese Experience',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-01-22',
    endDate: '2027-01-22',
    time: '08:30 - 16:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมส่งเสริมทักษะและประสบการณ์ภาษาจีน (Chinese Experience)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7001-08',
    title: 'PN สัญจร ประชาสัมพันธ์การรับสมัครนักเรียนในเขตพื้นที่บริการ',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-01-27',
    endDate: '2027-01-29',
    time: '08:30 - 16:00 น.',
    location: 'โรงเรียนในเขตพื้นที่ให้บริการ',
    description: 'ออกแนะแนวและประชาสัมพันธ์การรับสมัครนักเรียนใหม่ให้กับโรงเรียนในเขตพื้นที่บริการ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ / งานแนะแนว'
  },
  {
    id: 'pn-7001-09',
    title: 'สอบวัดความรู้ภาษาจีน (HSK) สนามสอบโรงเรียนพัฒนานิคม',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-01-29',
    endDate: '2027-01-29',
    time: '08:30 - 16:00 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การสอบวัดระดับความรู้ภาษาจีนมาตรฐานสากล (HSK)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },

  // ================= กุมภาพันธ์ 2570 =================
  {
    id: 'pn-7002-00',
    title: 'การจัดกิจกรรมโครงงานคุณธรรมระดับชั้นเรียน',
    department: 'student',
    academicYear: '2569',
    startDate: '2027-02-01',
    endDate: '2027-02-28',
    time: 'ตลอดเดือนกุมภาพันธ์',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'การจัดกิจกรรมโครงงานคุณธรรมระดับชั้นเรียน (1 – 28 ก.พ. 2570)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน / วิชาการ'
  },
  {
    id: 'pn-7002-01',
    title: 'นักเรียน ม.3 สอบ O-NET ที่โรงเรียนพัฒนานิคม',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-02-01',
    endDate: '2027-02-03',
    time: '08:30 - 16:30 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET) ชั้นมัธยมศึกษาปีที่ 3',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7002-02',
    title: 'กิจกรรมวันตรุษจีน / เลือกตั้งประธานนักเรียน',
    department: 'student',
    academicYear: '2569',
    startDate: '2027-02-05',
    endDate: '2027-02-05',
    time: '08:30 - 16:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมเทศกาลตรุษจีน และกิจกรรมส่งเสริมประชาธิปไตยเลือกตั้งประธานนักเรียน',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน / วิชาการ'
  },
  {
    id: 'pn-7002-03',
    title: 'รับสมัครนักเรียนห้องเรียนพิเศษ ม.1 และ ม.4',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-02-08',
    endDate: '2027-02-12',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'เปิดรับสมัครนักเรียนเข้าศึกษาต่อชั้น ม.1 และ ม.4 ประเภทห้องเรียนพิเศษ ปีการศึกษา 2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7002-04',
    title: 'งานเปิดบ้านวิชาการ (Open House)',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-02-12',
    endDate: '2027-02-12',
    time: '08:30 - 16:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมแสดงผลงานทางวิชาการและเปิดบ้านวิชาการโรงเรียนพัฒนานิคม',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7002-05',
    title: 'ศึกษาดูงานโรงเรียนต้นแบบด้านการบริหารจัดการหลักสูตรและแผนการเรียน',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-02-15',
    endDate: '2027-02-15',
    time: 'ตลอดวัน',
    location: 'โรงเรียนต้นแบบ',
    description: 'กิจกรรมศึกษาดูงานโรงเรียนต้นแบบด้านการบริหารจัดการหลักสูตรและแผนการเรียน',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7002-05b',
    title: 'กิจกรรมวันมาฆบูชา',
    department: 'general',
    academicYear: '2569',
    startDate: '2027-02-19',
    endDate: '2027-02-19',
    time: '08:00 - 12:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมส่งเสริมพระพุทธศาสนา เนื่องในวันมาฆบูชา',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป / วิชาการ'
  },
  {
    id: 'pn-7002-06',
    title: 'สอบคัดเลือกนักเรียนชั้น ม.1 ประเภทห้องเรียนพิเศษ',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-02-20',
    endDate: '2027-02-20',
    time: '08:30 - 16:00 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การสอบคัดเลือกนักเรียนเข้าศึกษาต่อระดับชั้น ม.1 ประเภทห้องเรียนพิเศษ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7002-07',
    title: 'สอบคัดเลือกนักเรียนชั้น ม.4 ประเภทห้องเรียนพิเศษ',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-02-21',
    endDate: '2027-02-21',
    time: '08:30 - 16:00 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การสอบคัดเลือกนักเรียนเข้าศึกษาต่อระดับชั้น ม.4 ประเภทห้องเรียนพิเศษ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7002-08',
    title: 'กำหนดสอบปลายภาคเรียนที่ 2/2569',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-02-23',
    endDate: '2027-02-25',
    time: '08:30 - 16:00 น.',
    location: 'อาคารเรียน โรงเรียนพัฒนานิคม',
    description: 'การสอบวัดผลปลายภาคเรียนที่ 2 ปีการศึกษา 2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7002-09',
    title: 'วันปัจฉิมนิเทศ อำลาสถาบัน',
    department: 'student',
    academicYear: '2569',
    startDate: '2027-02-26',
    endDate: '2027-02-26',
    time: '08:00 - 16:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมปัจฉิมนิเทศและอำลาสถาบันสำหรับนักเรียนชั้น ม.3 และ ม.6',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน / งานแนะแนว'
  },
  {
    id: 'pn-7002-10',
    title: 'ปิดภาคเรียนนักเรียน (สิ้นสุดภาคเรียนที่ 2/2569)',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-02-27',
    endDate: '2027-02-27',
    time: '-',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'วันปิดภาคเรียนสำหรับนักเรียน ประจำภาคเรียนที่ 2/2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },

  // ================= มีนาคม 2570 =================
  {
    id: 'pn-7003-01',
    title: 'แก้ไขปรับปรุงพฤติกรรมนักเรียน 2/2569',
    department: 'student',
    academicYear: '2569',
    startDate: '2027-03-02',
    endDate: '2027-03-02',
    time: '08:30 - 16:00 น.',
    location: 'กลุ่มบริหารกิจการนักเรียน',
    description: 'การบำเพ็ญประโยชน์และแก้ไขปรับปรุงคะแนนพฤติกรรมนักเรียน ภาคเรียนที่ 2/2569',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน'
  },
  {
    id: 'pn-7003-02',
    title: 'มอบตัวและประชุมผู้ปกครองนักเรียน ม.1 และ ม.4 ห้องเรียนพิเศษ',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-03-06',
    endDate: '2027-03-06',
    time: '08:30 - 16:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'รายงานตัว มอบตัว และประชุมผู้ปกครองนักเรียนชั้น ม.1 และ ม.4 ประเภทห้องเรียนพิเศษ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7003-03',
    title: 'ส่งเกรด และส่ง ปพ.5 (ปริ้นจากระบบ SGS)',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-03-08',
    endDate: '2027-03-08',
    time: 'ภายใน 16:30 น.',
    location: 'ห้องทะเบียน-วัดผล / ระบบ SGS',
    description: 'ครูผู้สอนทุกคนบันทึกเกรดและส่งเล่ม ปพ.5 ที่สั่งพิมพ์จากระบบ SGS ให้เรียบร้อย',
    isSubmission: true,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7003-04',
    title: 'รับสมัครนักเรียนชั้น ม.1 และ ม.4 ประเภทห้องเรียนทั่วไป',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-03-09',
    endDate: '2027-03-15',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'เปิดรับสมัครนักเรียนเข้าศึกษาต่อชั้น ม.1 และ ม.4 ประเภทห้องเรียนทั่วไป ปีการศึกษา 2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7003-05',
    title: 'ประกาศผลการเรียนของนักเรียนผ่านระบบ SGS',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-03-12',
    endDate: '2027-03-12',
    time: '08:30 น. เป็นต้นไป',
    location: 'ระบบ SGS ออนไลน์',
    description: 'ประกาศผลการเรียนปลายภาคเรียนที่ 2/2569 ผ่านระบบ SGS',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7003-06',
    title: 'ประชุมจัดทำแผนพัฒนาคุณภาพการศึกษา 2571–2575 และส่งรายงานประเมินตนเอง (SAR)',
    department: 'budget',
    academicYear: '2569',
    startDate: '2027-03-16',
    endDate: '2027-03-17',
    time: '08:30 - 16:30 น.',
    location: 'ห้องประชุมโรงเรียนพัฒนานิคม',
    description: 'ประชุมเชิงปฏิบัติการจัดทำแผนพัฒนาคุณภาพการศึกษา 2571–2575 และจัดทำ/ส่งรายงานการประเมินตนเองของสถานศึกษา (SAR)',
    isSubmission: true,
    updatedBy: 'กลุ่มบริหารงบประมาณและแผน / งานประกันคุณภาพ'
  },
  {
    id: 'pn-7003-07',
    title: 'สอบคัดเลือกนักเรียนชั้น ม.1 ประเภทห้องเรียนทั่วไป',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-03-20',
    endDate: '2027-03-20',
    time: '08:30 - 16:00 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การสอบคัดเลือกนักเรียนเข้าศึกษาต่อระดับชั้น ม.1 ประเภทห้องเรียนทั่วไป',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7003-08',
    title: 'สอบคัดเลือกนักเรียนชั้น ม.4 ประเภทห้องเรียนทั่วไป',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-03-21',
    endDate: '2027-03-21',
    time: '08:30 - 16:00 น.',
    location: 'สนามสอบโรงเรียนพัฒนานิคม',
    description: 'การสอบคัดเลือกนักเรียนเข้าศึกษาต่อระดับชั้น ม.4 ประเภทห้องเรียนทั่วไป',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7003-09',
    title: 'ศึกษาดูงานประจำปี 2570',
    department: 'personnel',
    academicYear: '2569',
    startDate: '2027-03-25',
    endDate: '2027-03-26',
    time: 'ตลอดวัน',
    location: 'นอกสถานที่',
    description: 'โครงการพัฒนาบุคลากรและศึกษาดูงานประจำปี 2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล'
  },
  {
    id: 'pn-7003-10',
    title: 'กีฬาครูมิตรสัมพันธ์',
    department: 'personnel',
    academicYear: '2569',
    startDate: '2027-03-29',
    endDate: '2027-03-29',
    time: '08:30 - 17:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมการแข่งขันกีฬาครูมิตรสัมพันธ์',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล / บริหารทั่วไป'
  },
  {
    id: 'pn-7003-11',
    title: 'นักเรียนชั้น ม.3 และ ม.6 รับใบประกาศนียบัตร (ปพ.1/ปพ.2)',
    department: 'academic',
    academicYear: '2569',
    startDate: '2027-03-31',
    endDate: '2027-03-31',
    time: '08:30 - 16:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'พิธีมอบใบประกาศนียบัตรและเอกสารสำคัญทางการศึกษาสำหรับนักเรียนผู้สำเร็จการศึกษา ชั้น ม.3 และ ม.6',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },

  // ================= เมษายน 2570 =================
  {
    id: 'pn-7004-01',
    title: 'อบรมพัฒนาทักษะด้านภาษาอังกฤษ',
    department: 'personnel',
    academicYear: '2569',
    startDate: '2027-04-01',
    endDate: '2027-04-01',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'การอบรมพัฒนาศักยภาพครูและบุคลากรด้านทักษะภาษาอังกฤษ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล / วิชาการ'
  },
  {
    id: 'pn-7004-02',
    title: 'กิจกรรมรดน้ำดำหัวผู้ใหญ่',
    department: 'general',
    academicYear: '2569',
    startDate: '2027-04-02',
    endDate: '2027-04-02',
    time: '09:00 - 12:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมสืบสานประเพณีสงกรานต์และรดน้ำดำหัวขอพรผู้ใหญ่',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป / งานบุคคล'
  },
  {
    id: 'pn-7004-03',
    title: 'มอบตัวนักเรียนชั้น ม.1 และ ม.4 ประเภทห้องเรียนทั่วไป',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-04-03',
    endDate: '2027-04-03',
    time: '08:30 - 16:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'รายงานตัวและมอบตัวนักเรียนใหม่ ชั้น ม.1 และ ม.4 ประเภทห้องเรียนทั่วไป',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7004-04',
    title: 'ปิดเทอมครู (สิ้นสุดการปฏิบัติงานภาคเรียนที่ 2/2569)',
    department: 'personnel',
    academicYear: '2569',
    startDate: '2027-04-04',
    endDate: '2027-04-04',
    time: '-',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'วันปิดภาคเรียนสำหรับคณะครูและบุคลากร',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล'
  },

  // ================= พฤษภาคม 2570 =================
  {
    id: 'pn-7005-01',
    title: 'จัดทำสัญญากับผู้ประกอบการจำหน่ายอาหารในโรงเรียนโดยการประเมิน',
    department: 'general',
    academicYear: '2570',
    startDate: '2027-05-01',
    endDate: '2027-05-31',
    time: 'ในเวลาราชการ',
    location: 'กลุ่มบริหารทั่วไป โรงเรียนพัฒนานิคม',
    description: 'ดำเนินการประเมินและจัดทำสัญญาผู้ประกอบการร้านค้าจำหน่ายอาหารในโรงอาหารโรงเรียน (1-31 พ.ค. 70)',
    isSubmission: true,
    updatedBy: 'กลุ่มบริหารทั่วไป'
  },
  {
    id: 'pn-7005-02',
    title: 'เปิดเทอมครู (เตรียมความพร้อมภาคเรียนที่ 1/2570)',
    department: 'personnel',
    academicYear: '2570',
    startDate: '2027-05-10',
    endDate: '2027-05-10',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'คณะครูเริ่มปฏิบัติงานเตรียมความพร้อมก่อนเปิดภาคเรียนที่ 1 ปีการศึกษา 2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล'
  },
  {
    id: 'pn-7005-03',
    title: 'รับมอบตัวนักเรียนชั้น ม.1 และ ม.4 (รอบเพิ่มเติม)',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-05-11',
    endDate: '2027-05-11',
    time: '08:30 - 16:00 น.',
    location: 'ห้องวิชาการ โรงเรียนพัฒนานิคม',
    description: 'การรับรายงานตัวและมอบตัวนักเรียนชั้น ม.1 และ ม.4 รอบเพิ่มเติม',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7005-04',
    title: 'กิจกรรมปรับพื้นฐานนักเรียนใหม่ 1/2570',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-05-12',
    endDate: '2027-05-13',
    time: '08:30 - 16:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมเรียนปรับพื้นฐานและปฐมนิเทศนักเรียนใหม่ ภาคเรียนที่ 1/2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7005-05',
    title: 'ค่ายคุณธรรมจริยธรรมนักเรียน',
    department: 'student',
    academicYear: '2570',
    startDate: '2027-05-14',
    endDate: '2027-05-14',
    time: '08:30 - 16:30 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมอบรมปลูกฝังคุณธรรมจริยธรรมนักเรียน ก่อนเปิดภาคเรียนที่ 1/2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน'
  },
  {
    id: 'pn-7005-06',
    title: 'เปิดภาคเรียนที่ 1 ปีการศึกษา 2570',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-05-17',
    endDate: '2027-05-17',
    time: '07:45 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'วันเปิดทำการเรียนการสอนวันแรก ภาคเรียนที่ 1 ปีการศึกษา 2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7005-07',
    title: 'อบรมพัฒนาศักยภาพด้านเทคโนโลยี',
    department: 'personnel',
    academicYear: '2570',
    startDate: '2027-05-29',
    endDate: '2027-05-29',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'การอบรมพัฒนาศักยภาพครูและบุคลากรด้านการใช้เทคโนโลยีดิจิทัลเพื่อการศึกษา',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารงานบุคคล / ศูนย์สารสนเทศ'
  },

  // ================= มิถุนายน 2570 =================
  {
    id: 'pn-7006-01',
    title: 'พิธีถวายพระพร สมเด็จพระนางเจ้าสุทิดาฯ พระบรมราชินี',
    department: 'general',
    academicYear: '2570',
    startDate: '2027-06-02',
    endDate: '2027-06-02',
    time: '08:00 - 10:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมเฉลิมพระเกียรติและพิธีถวายพระพรชัยมงคล เนื่องในวันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป'
  },
  {
    id: 'pn-7006-02',
    title: 'กิจกรรมค่าย STEM',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-06-13',
    endDate: '2027-06-14',
    time: '08:30 - 16:30 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมค่ายบูรณาการความรู้วิทยาศาสตร์ คณิตศาสตร์ และเทคโนโลยี (STEM Education)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },

  // ================= กรกฎาคม 2570 =================
  {
    id: 'pn-7007-01',
    title: 'พิธีทบทวนคำปฏิญาณและสวนสนาม วันคล้ายวันสถาปนาคณะลูกเสือแห่งชาติ',
    department: 'student',
    academicYear: '2570',
    startDate: '2027-07-01',
    endDate: '2027-07-01',
    time: '08:00 - 12:00 น.',
    location: 'สนามกีฬาโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมวันคล้ายวันสถาปนาคณะลูกเสือแห่งชาติ (1 กรกฎาคม)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน / กิจกรรมพัฒนาผู้เรียน'
  },
  {
    id: 'pn-7007-02',
    title: 'นักเรียน ม.4-6 ทัศนศึกษาแหล่งเรียนรู้นอกสถานที่ รูปแบบแผนการเรียน (1-20 ก.ค. 70)',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-07-01',
    endDate: '2027-07-20',
    time: 'ตามกำหนดการแต่ละแผนการเรียน',
    location: 'แหล่งเรียนรู้นอกสถานที่',
    description: 'กิจกรรมเดินทางไปทัศนศึกษาแหล่งเรียนรู้นอกสถานที่ของนักเรียนระดับชั้น ม.4-6 แยกตามรูปแบบแผนการเรียน (ระหว่างวันที่ 1-20 ก.ค. 2570)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7007-03',
    title: 'ค่ายพัฒนาทักษะอาชีพ และกิจกรรมการแข่งขันทักษะคณิตศาสตร์ (ตลอดเดือน ก.ค.)',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-07-01',
    endDate: '2027-07-30',
    time: 'ตามตารางกิจกรรมกลุ่มสาระฯ',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมค่ายพัฒนาทักษะอาชีพ (1-30 ก.ค. 70) และกิจกรรมการแข่งขันทักษะคณิตศาสตร์ (กำหนดการอาจมีการเปลี่ยนแปลง)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7007-04',
    title: 'สอบคัดเลือกนักเรียนแข่งขันตอบปัญหากฎหมายวันรพี',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-07-23',
    endDate: '2027-07-23',
    time: '08:30 - 12:00 น.',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'การสอบคัดเลือกตัวแทนนักเรียนเข้าแข่งขันตอบปัญหากฎหมายเนื่องในวันรพี',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ / กลุ่มสาระฯ สังคมศึกษา'
  },
  {
    id: 'pn-7007-05',
    title: 'กิจกรรมสืบสานวันภาษาไทยแห่งชาติ',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-07-23',
    endDate: '2027-07-23',
    time: '08:30 - 16:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมส่งเสริมทักษะภาษาไทย เนื่องในวันภาษาไทยแห่งชาติ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ / กลุ่มสาระฯ ภาษาไทย'
  },
  {
    id: 'pn-7007-06',
    title: 'สอบกลางภาคเรียนที่ 1/2570 (ช่วงที่ 1: 26-27 ก.ค.)',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-07-26',
    endDate: '2027-07-27',
    time: '08:30 - 16:00 น.',
    location: 'อาคารเรียน โรงเรียนพัฒนานิคม',
    description: 'การสอบวัดผลกลางภาคเรียนที่ 1 ปีการศึกษา 2570 (วันที่ 26-27 และ 29-30 ก.ค. 2570)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7007-07',
    title: 'สอบกลางภาคเรียนที่ 1/2570 (ช่วงที่ 2: 29-30 ก.ค.)',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-07-29',
    endDate: '2027-07-30',
    time: '08:30 - 16:00 น.',
    location: 'อาคารเรียน โรงเรียนพัฒนานิคม',
    description: 'การสอบวัดผลกลางภาคเรียนที่ 1 ปีการศึกษา 2570 (วันที่ 26-27 และ 29-30 ก.ค. 2570)',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },

  // ================= สิงหาคม 2570 =================
  {
    id: 'pn-7008-01',
    title: 'ค่ายลูกเสือจิตอาสาพระราชทาน และการนิเทศติดตามกิจกรรมลูกเสือ (1-30 ส.ค. 70)',
    department: 'student',
    academicYear: '2570',
    startDate: '2027-08-01',
    endDate: '2027-08-30',
    time: 'ตลอดเดือนสิงหาคม',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'การจัดค่ายลูกเสือจิตอาสาพระราชทาน และการนิเทศ ติดตามการจัดกิจกรรมลูกเสือในสถานศึกษา',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน / กิจกรรมพัฒนาผู้เรียน'
  },
  {
    id: 'pn-7008-02',
    title: 'กิจกรรมสัปดาห์วิทยาศาสตร์แห่งชาติ (1-31 ส.ค. 70)',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-08-01',
    endDate: '2027-08-31',
    time: 'ตลอดเดือนสิงหาคม',
    location: 'โรงเรียนพัฒนานิคม',
    description: 'กิจกรรมการแข่งขันและนิทรรศการสัปดาห์วิทยาศาสตร์แห่งชาติ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ / กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี'
  },
  {
    id: 'pn-7008-03',
    title: 'พิธีถวายพระพรและมอบทุนการศึกษาเนื่องในวันแม่แห่งชาติ',
    department: 'general',
    academicYear: '2570',
    startDate: '2027-08-11',
    endDate: '2027-08-11',
    time: '08:00 - 12:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมวันแม่แห่งชาติ และพิธีมอบทุนการศึกษาแก่นักเรียน',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารทั่วไป / กิจการนักเรียน'
  },

  // ================= กันยายน 2570 =================
  {
    id: 'pn-7009-01',
    title: 'การแข่งขันกีฬาคณะสีภายใน (ต้นไทรเกมส์)',
    department: 'student',
    academicYear: '2570',
    startDate: '2027-09-01',
    endDate: '2027-09-03',
    time: '08:00 - 17:00 น.',
    location: 'สนามกีฬาโรงเรียนพัฒนานิคม',
    description: 'มหกรรมการแข่งขันกีฬาคณะสีภายในโรงเรียนพัฒนานิคม “ต้นไทรเกมส์”',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน / กลุ่มสาระฯ สุขศึกษาและพลศึกษา'
  },
  {
    id: 'pn-7009-02',
    title: 'ส่งรายงานการควบคุมภายใน ประจำปีงบประมาณ 2570',
    department: 'budget',
    academicYear: '2570',
    startDate: '2027-09-10',
    endDate: '2027-09-10',
    time: 'ภายใน 16:30 น.',
    location: 'กลุ่มบริหารงบประมาณและแผน',
    description: 'ส่งรายงานการประเมินผลการควบคุมภายในของแต่ละกลุ่มงาน',
    isSubmission: true,
    updatedBy: 'กลุ่มบริหารงบประมาณและแผน'
  },
  {
    id: 'pn-7009-03',
    title: 'พิธีปิดประชุมกองลูกเสือ-เนตรนารี ประจำภาคเรียนที่ 1/2570',
    department: 'student',
    academicYear: '2570',
    startDate: '2027-09-16',
    endDate: '2027-09-16',
    time: '14:30 - 16:10 น.',
    location: 'ลานอเนกประสงค์ โรงเรียนพัฒนานิคม',
    description: 'พิธีปิดประชุมกองกิจกรรมพัฒนาผู้เรียน (ลูกเสือ-เนตรนารี) ประจำภาคเรียนที่ 1/2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ / กิจกรรมพัฒนาผู้เรียน'
  },
  {
    id: 'pn-7009-04',
    title: 'กิจกรรมมุทิตาจิตของนักเรียน',
    department: 'student',
    academicYear: '2570',
    startDate: '2027-09-17',
    endDate: '2027-09-17',
    time: '08:30 - 16:00 น.',
    location: 'หอประชุมโรงเรียนพัฒนานิคม',
    description: 'กิจกรรมแสดงมุทิตาจิตของนักเรียนแด่คุณครูผู้เกษียณอายุราชการ',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารกิจการนักเรียน'
  },
  {
    id: 'pn-7009-05',
    title: 'กำหนดสอบปลายภาคเรียนที่ 1/2570 (27 ก.ย. - 1 ต.ค. 70)',
    department: 'academic',
    academicYear: '2570',
    startDate: '2027-09-27',
    endDate: '2027-10-01',
    time: '08:30 - 16:00 น.',
    location: 'อาคารเรียน โรงเรียนพัฒนานิคม',
    description: 'การสอบวัดผลปลายภาคเรียนที่ 1 ปีการศึกษา 2570',
    isSubmission: false,
    updatedBy: 'กลุ่มบริหารวิชาการ'
  },
  {
    id: 'pn-7009-06',
    title: 'ส่งสรุปผลการดำเนินงานโครงการ ประจำปีงบประมาณ 2570 / งานเกษียณอายุราชการ',
    department: 'budget',
    academicYear: '2570',
    startDate: '2027-09-30',
    endDate: '2027-09-30',
    time: 'ภายใน 16:30 น.',
    location: 'กลุ่มบริหารงบประมาณและแผน / หอประชุมโรงเรียน',
    description: 'ติดตามการดำเนินงานและส่งเล่มสรุปผลการดำเนินงานของโครงการตามแผนปฏิบัติการ และร่วมกิจกรรมงานเกษียณอายุราชการ',
    isSubmission: true,
    updatedBy: 'กลุ่มบริหารงบประมาณและแผน / งานบุคคล'
  }
];

// วันหยุดราชการและวันสำคัญ (สำหรับไฮไลต์ช่องสีแดงในปฏิทินย่อ และแสดงหมายเหตุใต้ตารางปฏิทินเหมือนต้นฉบับ)
const THAI_HOLIDAYS = {
  '2026-10-13': 'วันนวมินทรมหาราช',
  '2026-10-23': 'วันปิยมหาราช',
  '2026-12-05': 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ',
  '2026-12-07': 'หยุดชดเชยวันพ่อแห่งชาติ',
  '2026-12-10': 'วันรัฐธรรมนูญ',
  '2026-12-31': 'หยุดวันสิ้นปี',
  '2027-01-01': 'หยุดวันขึ้นปีใหม่',
  '2027-02-21': 'วันมาฆบูชา',
  '2027-02-22': 'หยุดชดเชยวันมาฆบูชา',
  '2027-04-06': 'วันจักรี',
  '2027-04-13': 'วันสงกรานต์',
  '2027-04-14': 'วันสงกรานต์',
  '2027-04-15': 'วันสงกรานต์',
  '2027-05-04': 'วันฉัตรมงคล',
  '2027-05-20': 'วันวิสาขบูชา',
  '2027-06-03': 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี',
  '2027-07-18': 'วันอาสาฬหบูชา',
  '2027-07-19': 'วันเข้าพรรษา / หยุดชดเชย',
  '2027-07-28': 'วันเฉลิมพระชนมพรรษา รัชกาลที่ 10',
  '2027-08-12': 'วันเฉลิมพระชนมพรรษา พระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ'
};

// ลำดับเดือนในปีงบประมาณ 2570 (ต.ค. 2569 – ก.ย. 2570)
const FISCAL_YEAR_2570_MONTHS = [
  { year: 2026, month: 9 },  // ต.ค. 69
  { year: 2026, month: 10 }, // พ.ย. 69
  { year: 2026, month: 11 }, // ธ.ค. 69
  { year: 2027, month: 0 },  // ม.ค. 70
  { year: 2027, month: 1 },  // ก.พ. 70
  { year: 2027, month: 2 },  // มี.ค. 70
  { year: 2027, month: 3 },  // เม.ย. 70
  { year: 2027, month: 4 },  // พ.ค. 70
  { year: 2027, month: 5 },  // มิ.ย. 70
  { year: 2027, month: 6 },  // ก.ค. 70
  { year: 2027, month: 7 },  // ส.ค. 70
  { year: 2027, month: 8 }   // ก.ย. 70
];

// 3. State ของแอปพลิเคชัน
let state = {
  events: [],
  currentYear: new Date().getFullYear(), // ค.ศ.
  currentMonth: new Date().getMonth(),   // 0 - 11
  selectedDepartment: 'all',
  onlySubmission: false, // กรองเฉพาะงานที่ต้องส่ง
  selectedAcademicYear: 'all',
  searchQuery: '',
  viewMode: 'split', // 'split' (ตารางปฏิทินคู่ภารกิจ) | 'month' | 'list'
  tableMonthScope: 'all', // 'all' (แสดงทุกเดือน ต.ค. 69 - ก.ย. 70) | 'single' (ดูทีละเดือน)
  currentUser: null, // { role: 'academic'|...|'admin', staffName: '...' }
  schoolName: 'โรงเรียนพัฒนานิคม สพม.ลพบุรี',
  scriptUrl: ''
};

let deferredInstallPrompt = null;

// ================= INITIALIZATION & PWA SETUP =================
document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  loadSettingsAndData();
  renderDepartmentFilters();
  renderDepartmentLegend();
  renderUserStatus();
  renderAll();
  if (window.lucide) {
    lucide.createIcons();
  }
});

function initPWA() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('ServiceWorker registration skipped:', err);
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    const btnInstall = document.getElementById('btnInstallApp');
    if (btnInstall) btnInstall.classList.add('hidden');
  }
}

async function handleInstallButtonClick() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('กำลังเพิ่มแอปปฏิทินโรงเรียนพัฒนานิคมไปยังหน้าจอโฮม', 'success');
    }
    deferredInstallPrompt = null;
  } else {
    openInstallGuideModal();
  }
}

function openInstallGuideModal() {
  const modal = document.getElementById('installGuideModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeInstallGuideModal() {
  const modal = document.getElementById('installGuideModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function loadSettingsAndData() {
  const savedSchoolName = localStorage.getItem('sc_school_name');
  if (
    savedSchoolName &&
    savedSchoolName !== 'โรงเรียนสาธิตวิทยาคาร' &&
    savedSchoolName !== 'โรงเรียนพัฒนานิคม'
  ) {
    state.schoolName = savedSchoolName;
  } else {
    state.schoolName = 'โรงเรียนพัฒนานิคม สพม.ลพบุรี';
    localStorage.setItem('sc_school_name', state.schoolName);
  }

  const savedScriptUrl = localStorage.getItem('sc_script_url');
  if (savedScriptUrl) state.scriptUrl = savedScriptUrl;

  const savedUser = localStorage.getItem('sc_current_user');
  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
      if (state.currentUser && state.currentUser.staffName) {
        state.currentUser.staffName = normalizeStaffName(state.currentUser.staffName);
        localStorage.setItem('sc_current_user', JSON.stringify(state.currentUser));
      }
    } catch (e) {
      state.currentUser = null;
    }
  }

  const savedEvents = localStorage.getItem('sc_events_data_fy2570_v2');
  if (savedEvents) {
    try {
      state.events = JSON.parse(savedEvents);
    } catch (e) {
      state.events = [...DEFAULT_SAMPLE_EVENTS];
    }
  } else {
    // Merge any custom user-created events from v1 if present
    let customUserEvents = [];
    const oldEventsRaw = localStorage.getItem('sc_events_data_fy2570');
    if (oldEventsRaw) {
      try {
        const parsedOld = JSON.parse(oldEventsRaw);
        if (Array.isArray(parsedOld)) {
          customUserEvents = parsedOld.filter((x) => x.id && !String(x.id).startsWith('pn-'));
        }
      } catch (e) {}
    }
    state.events = [...DEFAULT_SAMPLE_EVENTS, ...customUserEvents];
    saveEventsToLocal();
  }

  updateHeaderSchoolInfo();

  if (state.scriptUrl) {
    refreshFromGoogleSheets(true);
  }
}

function saveEventsToLocal() {
  localStorage.setItem('sc_events_data_fy2570_v2', JSON.stringify(state.events));
}

function updateHeaderSchoolInfo() {
  document.getElementById('schoolTitleDisplay').textContent = `ปฏิทินปฏิบัติงาน${state.schoolName}`;
  const printTitle = document.getElementById('printMainTitle');
  if (printTitle) {
    printTitle.textContent = `ปฏิทินปฏิบัติงาน ${state.schoolName}`;
  }

  const dot = document.getElementById('syncStatusDot');
  const txt = document.getElementById('syncStatusText');

  if (state.scriptUrl) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0';
    txt.textContent = 'เชื่อมต่อ Google Sheets แล้ว';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0';
    txt.textContent = 'โหมดฐานข้อมูลในเครื่อง (เชื่อม Google Sheets ได้ที่ไอคอนขวาบน)';
  }
}

// ================= FILTER & NAVIGATION =================
function renderDepartmentFilters() {
  const container = document.getElementById('departmentFilterPills');
  const allActive = state.selectedDepartment === 'all';

  let html = `
    <button onclick="setDepartmentFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-display font-medium border transition ${
      allActive
        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
    }">
      ทุกกลุ่มงาน
    </button>
  `;

  Object.values(DEPARTMENTS).forEach((dept) => {
    const isActive = state.selectedDepartment === dept.id;
    html += `
      <button onclick="setDepartmentFilter('${dept.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-medium border transition ${
        isActive ? dept.activeFilterClass : dept.inactiveFilterClass
      }">
        <span class="w-2 h-2 rounded-full ${isActive ? 'bg-white' : dept.dotClass}"></span>
        <span>${dept.shortName}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

function toggleSubmissionFilter() {
  state.onlySubmission = !state.onlySubmission;
  const btn = document.getElementById('btnFilterSubmission');
  if (state.onlySubmission) {
    btn.className =
      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-semibold border transition bg-rose-600 text-white border-rose-600 shadow-xs';
  } else {
    btn.className =
      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-semibold border transition bg-white text-rose-700 border-rose-200 hover:bg-rose-50';
  }
  renderAll();
}

function renderDepartmentLegend() {
  const container = document.getElementById('departmentLegend');
  container.innerHTML = Object.values(DEPARTMENTS)
    .map(
      (dept) => `
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full ${dept.dotClass}"></span>
        <span class="font-medium text-slate-700">${dept.name}</span>
      </div>
    `
    )
    .join('');
}

function setDepartmentFilter(deptId) {
  state.selectedDepartment = deptId;
  renderDepartmentFilters();
  renderAll();
}

function handleSearchOrFilter() {
  state.searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
  state.selectedAcademicYear = document.getElementById('academicYearSelect').value;
  renderAll();
}

function setTableMonthScope(scope) {
  state.tableMonthScope = scope;
  updateScopeButtonsUI();
  renderAll();
}

function updateScopeButtonsUI() {
  const btnAll = document.getElementById('btnScopeAllMonths');
  const btnSingle = document.getElementById('btnScopeSingleMonth');
  if (!btnAll || !btnSingle) return;

  if (state.tableMonthScope === 'all') {
    btnAll.className = 'px-3 py-1.5 rounded-lg bg-white text-blue-700 font-semibold shadow-sm transition';
    btnSingle.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
  } else {
    btnSingle.className = 'px-3 py-1.5 rounded-lg bg-white text-blue-700 font-semibold shadow-sm transition';
    btnAll.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
  }
}

function selectSpecificMonthFromBar(year, month) {
  state.currentYear = year;
  state.currentMonth = month;

  if (state.viewMode === 'split' && state.tableMonthScope === 'all') {
    renderQuickMonthJumpBar(getFilteredEvents());
    const targetRow = document.getElementById(`split-month-${year}-${month}`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetRow.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => targetRow.classList.remove('ring-2', 'ring-blue-500'), 1800);
    }
  } else {
    renderAll();
  }
}

function changeMonth(delta) {
  if (state.viewMode === 'split' && state.tableMonthScope === 'all') {
    state.tableMonthScope = 'single';
    updateScopeButtonsUI();
  }
  state.currentMonth += delta;
  if (state.currentMonth > 11) {
    state.currentMonth = 0;
    state.currentYear += 1;
  } else if (state.currentMonth < 0) {
    state.currentMonth = 11;
    state.currentYear -= 1;
  }
  renderAll();
}

function goToToday() {
  const now = new Date();
  state.currentYear = now.getFullYear();
  state.currentMonth = now.getMonth();
  if (state.viewMode === 'split' && state.tableMonthScope === 'all') {
    const targetRow = document.getElementById(`split-month-${state.currentYear}-${state.currentMonth}`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  renderAll();
}

function switchViewMode(mode) {
  state.viewMode = mode;
  const tabSplit = document.getElementById('tabViewSplit');
  const tabMonth = document.getElementById('tabViewMonth');
  const tabList = document.getElementById('tabViewList');

  const secSplit = document.getElementById('splitTableViewSection');
  const secMonth = document.getElementById('monthViewSection');
  const secList = document.getElementById('listViewSection');
  const scopeToggle = document.getElementById('tableScopeToggle');

  const activeTabClass = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-sm transition';
  const inactiveTabClass = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';

  if (tabSplit) tabSplit.className = mode === 'split' ? activeTabClass : inactiveTabClass;
  if (tabMonth) tabMonth.className = mode === 'month' ? activeTabClass : inactiveTabClass;
  if (tabList) tabList.className = mode === 'list' ? activeTabClass : inactiveTabClass;

  if (secSplit) secSplit.classList.toggle('hidden', mode !== 'split');
  if (secMonth) secMonth.classList.toggle('hidden', mode !== 'month');
  if (secList) secList.classList.toggle('hidden', mode !== 'list');
  if (scopeToggle) scopeToggle.classList.toggle('hidden', mode !== 'split');

  renderAll();
}

// ================= CORE RENDERING =================
function isSubmissionTask(evt) {
  return evt.isSubmission === true || String(evt.isSubmission).toLowerCase() === 'true';
}

function getFilteredEvents() {
  return state.events.filter((evt) => {
    if (state.selectedDepartment !== 'all' && evt.department !== state.selectedDepartment) {
      return false;
    }
    if (state.onlySubmission && !isSubmissionTask(evt)) {
      return false;
    }
    if (state.selectedAcademicYear !== 'all' && String(evt.academicYear) !== String(state.selectedAcademicYear)) {
      return false;
    }
    if (state.searchQuery) {
      const hay = `${evt.title} ${evt.location || ''} ${evt.description || ''} ${evt.updatedBy || ''}`.toLowerCase();
      if (!hay.includes(state.searchQuery)) return false;
    }
    return true;
  });
}

function isEventInMonth(evt, year, monthIndex) {
  const monthStart = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const monthEnd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return evt.startDate <= monthEnd && evt.endDate >= monthStart;
}

function renderAll() {
  const thaiYear = state.currentYear + 543;
  const monthName = THAI_MONTHS[state.currentMonth];
  const isAllMonthsSplit = state.viewMode === 'split' && state.tableMonthScope === 'all';

  const titleEl = document.getElementById('currentMonthYearTitle');
  if (isAllMonthsSplit) {
    titleEl.textContent = 'ปีงบประมาณ 2570 (ต.ค. 2569 – ก.ย. 2570)';
  } else {
    titleEl.textContent = `เดือน ${monthName} ${thaiYear}`;
  }

  // Update Print Header
  document.getElementById('printSubtitle').textContent = isAllMonthsSplit
    ? 'ประจำปีงบประมาณ พ.ศ. 2570 (ตุลาคม 2569 – กันยายน 2570)'
    : `ประจำเดือน ${monthName} พ.ศ. ${thaiYear}`;

  const deptFilterLabel =
    state.selectedDepartment === 'all'
      ? 'ทุกกลุ่มงาน'
      : `เฉพาะ: ${DEPARTMENTS[state.selectedDepartment]?.name || ''}`;
  document.getElementById('printFilterInfo').textContent = state.onlySubmission
    ? `${deptFilterLabel} (เฉพาะงานที่ต้องส่ง)`
    : deptFilterLabel;
  document.getElementById('printDateInfo').textContent = `พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })}`;

  const filtered = getFilteredEvents();
  const monthEvents = filtered.filter((e) => isEventInMonth(e, state.currentYear, state.currentMonth));

  const activeEventsForCounter = isAllMonthsSplit ? filtered : monthEvents;
  const submissionEventsCount = activeEventsForCounter.filter((e) => isSubmissionTask(e)).length;

  document.getElementById('eventCountBadge').textContent = isAllMonthsSplit
    ? `รวมทั้งปี ${activeEventsForCounter.length} รายการ`
    : `เดือนนี้ ${activeEventsForCounter.length} รายการ`;
  document.getElementById('submissionCountBadge').textContent = `📌 งานที่ต้องส่ง ${submissionEventsCount} งาน`;

  renderQuickMonthJumpBar(filtered);
  renderSplitTableView(filtered);
  renderMonthGrid(filtered);
  renderListView(monthEvents);

  if (window.lucide) {
    lucide.createIcons();
  }
}

// แถบปุ่มลัดเลือกเดือน (ต.ค. 69 - ก.ย. 70)
function renderQuickMonthJumpBar(filteredEvents) {
  const bar = document.getElementById('monthQuickJumpBar');
  if (!bar) return;

  const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const buttonsHtml = FISCAL_YEAR_2570_MONTHS.map(({ year, month }) => {
    const shortY = String(year + 543).slice(-2);
    const label = `${shortMonths[month]} ${shortY}`;
    const count = filteredEvents.filter((e) => isEventInMonth(e, year, month)).length;
    const isSelected = state.currentYear === year && state.currentMonth === month;

    const btnStyle =
      isSelected && (state.viewMode !== 'split' || state.tableMonthScope === 'single')
        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/60';

    return `
      <button
        type="button"
        onclick="selectSpecificMonthFromBar(${year}, ${month})"
        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-display transition ${btnStyle}"
      >
        <span>${label}</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] ${
          isSelected && (state.viewMode !== 'split' || state.tableMonthScope === 'single')
            ? 'bg-blue-800 text-white'
            : 'bg-slate-100 text-slate-600'
        }">${count}</span>
      </button>
    `;
  }).join('');

  bar.innerHTML = `
    <span class="text-xs font-display font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
      <i data-lucide="calendar" class="w-3.5 h-3.5"></i> เดือน:
    </span>
    ${buttonsHtml}
  `;
}

// ================= VIEW 0: SPLIT CALENDAR & ACTIVITY TABLE (เหมือนต้นฉบับ แต่อ่านง่ายขึ้นมาก) =================
function renderSplitTableView(filteredEvents) {
  const container = document.getElementById('splitTableBody');
  if (!container) return;

  const monthsToRender =
    state.tableMonthScope === 'all'
      ? FISCAL_YEAR_2570_MONTHS
      : [{ year: state.currentYear, month: state.currentMonth }];

  const rowsHtml = monthsToRender
    .map(({ year, month }) => renderSingleSplitMonthRow(year, month, filteredEvents))
    .join('');

  container.innerHTML = rowsHtml;
}

function renderSingleSplitMonthRow(year, month, filteredEvents) {
  const thaiYear = year + 543;
  const shortThaiYear = String(thaiYear).slice(-2);
  const monthName = THAI_MONTHS[month];
  const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const shortMonthName = shortMonths[month];

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (อา) - 6 (ส)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ดึงรายการภารกิจของเดือนนี้และเรียงลำดับตามวันที่เริ่มต้น
  const monthEvents = filteredEvents
    .filter((e) => isEventInMonth(e, year, month))
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return a.endDate.localeCompare(b.endDate);
    });

  // รวบรวมวันหยุดราชการประจำเดือนนี้
  const monthHolidays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (THAI_HOLIDAYS[dateStr]) {
      monthHolidays.push({
        day: d,
        dateStr,
        dateLabel: `${d} ${shortMonthName} ${shortThaiYear}`,
        name: THAI_HOLIDAYS[dateStr]
      });
    }
  }

  // สร้างตารางปฏิทินย่อ 7 คอลัมน์ (อา จ อ พ พฤ ศ ส)
  let trList = [];
  let currentCells = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    currentCells.push(`<td class="bg-slate-50/50"></td>`);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holidayName = THAI_HOLIDAYS[dateStr];
    const eventsOnDay = monthEvents.filter((evt) => evt.startDate <= dateStr && evt.endDate >= dateStr);
    const hasSubmissionOnDay = eventsOnDay.some((evt) => isSubmissionTask(evt));
    const multiDayEventOnDay = eventsOnDay.find((evt) => evt.startDate !== evt.endDate);

    let tdClass = 'cursor-pointer hover:ring-2 hover:ring-blue-400';
    let titleAttr = '';
    let dotIndicator = '';

    if (holidayName) {
      // ช่องสีแดงสำหรับวันหยุดราชการ (เหมือนในภาพตัวอย่าง)
      tdClass += ' mini-cal-holiday';
      titleAttr = `${day} ${shortMonthName} ${shortThaiYear}: ${holidayName}`;
    } else if (hasSubmissionOnDay) {
      tdClass += ' mini-cal-has-submission';
      titleAttr = `มีงานที่ต้องส่ง ${eventsOnDay.length} รายการ`;
      dotIndicator = `<span class="w-1.5 h-1.5 rounded-full bg-rose-600 mx-auto block mt-0.5"></span>`;
    } else if (eventsOnDay.length > 0) {
      tdClass += ' mini-cal-has-event';
      titleAttr = `มีกิจกรรม ${eventsOnDay.length} รายการ`;
      if (multiDayEventOnDay) {
        const isStart = multiDayEventOnDay.startDate === dateStr;
        const isEnd = multiDayEventOnDay.endDate === dateStr;
        const deptColor = DEPARTMENTS[multiDayEventOnDay.department]?.dotClass || 'bg-blue-600';
        const barRadius = `${isStart ? 'rounded-l-full ml-1' : '-ml-px'} ${isEnd ? 'rounded-r-full mr-1' : '-mr-px'}`;
        dotIndicator = `<span class="block h-1 ${deptColor} ${barRadius} mt-1 opacity-90"></span>`;
      } else {
        dotIndicator = `<span class="w-1.5 h-1.5 rounded-full bg-blue-600 mx-auto block mt-0.5"></span>`;
      }
    }

    currentCells.push(`
      <td
        class="${tdClass}"
        title="${escapeHtml(titleAttr)}"
        onmouseenter="highlightActivitiesByDate('${dateStr}', true)"
        onmouseleave="highlightActivitiesByDate('${dateStr}', false)"
        onclick="handleMiniCalDateClick('${dateStr}')"
      >
        <div class="leading-none">${day}</div>
        ${dotIndicator}
      </td>
    `);

    if (currentCells.length === 7) {
      trList.push(`<tr>${currentCells.join('')}</tr>`);
      currentCells = [];
    }
  }

  if (currentCells.length > 0) {
    while (currentCells.length < 7) {
      currentCells.push(`<td class="bg-slate-50/50"></td>`);
    }
    trList.push(`<tr>${currentCells.join('')}</tr>`);
  }

  // รายการวันหยุดราชการใต้ปฏิทินย่อ (เหมือนในภาพตัวอย่าง เช่น 1 ม.ค. 70 หยุดวันขึ้นปีใหม่)
  const holidaysListHtml =
    monthHolidays.length > 0
      ? `
        <div class="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5">
          ${monthHolidays
            .map(
              (h) => `
              <div class="flex items-start gap-2 text-xs sm:text-[13px] leading-snug">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-red-600 text-white font-display font-semibold text-[11px] shrink-0 shadow-2xs">
                  ${h.dateLabel}
                </span>
                <span class="font-semibold text-red-800">${escapeHtml(h.name)}</span>
              </div>
            `
            )
            .join('')}
        </div>
      `
      : '';

  // สร้างรายการภารกิจ/กิจกรรมทางด้านขวาให้อ่านง่าย สบายตา แยกคอลัมน์วันที่และชื่องานชัดเจน
  let rightColumnHtml = '';
  if (monthEvents.length === 0) {
    rightColumnHtml = `
      <div class="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <i data-lucide="calendar-check-2" class="w-7 h-7 mb-1.5 stroke-[1.5]"></i>
        <p class="text-sm font-display font-medium text-slate-500">ไม่มีรายการภารกิจ/กิจกรรมตามตัวกรองในเดือน${monthName}</p>
        ${
          state.currentUser
            ? `<button onclick="openEventModal(null, '${year}-${String(month + 1).padStart(2, '0')}-01')" class="mt-2 text-xs text-blue-600 hover:underline font-medium no-print">+ คลิกเพื่อเพิ่มงานในเดือนนี้</button>`
            : ''
        }
      </div>
    `;
  } else {
    rightColumnHtml = `
      <div class="divide-y divide-slate-200/80">
        ${monthEvents
          .map((evt) => {
            const dept = DEPARTMENTS[evt.department] || DEPARTMENTS.academic;
            const isSub = isSubmissionTask(evt);
            const dateBadgeText = formatCompactThaiDateRange(evt.startDate, evt.endDate, year, month);

            return `
              <div
                data-start="${evt.startDate}"
                data-end="${evt.endDate}"
                onclick="openDetailModal('${evt.id}')"
                class="split-activity-row px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-blue-50/50 cursor-pointer flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-4 ${
                  isSub ? 'bg-rose-50/35 border-l-4 border-l-rose-600' : ''
                }"
              >
                <div class="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3.5 min-w-0 flex-1">
                  <!-- คอลัมน์วันที่ (จัดแนวตรงกันทุกบรรทัด อ่านง่าย ไม่ปนกับชื่อกิจกรรม) -->
                  <div class="sm:w-36 shrink-0 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full ${isSub ? 'bg-rose-600' : dept.dotClass} shrink-0"></span>
                    <span class="font-display font-bold text-xs sm:text-[13.5px] ${
                      isSub ? 'text-rose-700' : 'text-slate-800'
                    } tracking-tight">
                      ${dateBadgeText}
                    </span>
                  </div>

                  <!-- ชื่อภารกิจ/กิจกรรม และรายละเอียดสถานที่ -->
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      ${
                        isSub
                          ? `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-display font-bold bg-rose-600 text-white shadow-2xs">📌 ส่งงาน</span>`
                          : ''
                      }
                      <span class="font-sans font-semibold text-sm sm:text-[15.5px] text-slate-900 leading-relaxed">
                        ${escapeHtml(evt.title)}
                      </span>
                    </div>
                    ${
                      evt.location && evt.location !== '-' && evt.location !== 'โรงเรียนพัฒนานิคม'
                        ? `<div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                             <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i>
                             <span>${escapeHtml(evt.location)}</span>
                           </div>`
                        : ''
                    }
                  </div>
                </div>

                <!-- ป้ายกลุ่มงานด้านขวา -->
                <div class="flex items-center gap-2 shrink-0 self-start sm:self-center pl-3.5 sm:pl-0">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-display font-medium ${dept.pillClass}">
                    ${dept.shortName}
                  </span>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  return `
    <div id="split-month-${year}-${month}" class="split-month-row grid grid-cols-1 md:grid-cols-12 bg-white transition">
      <!-- คอลัมน์ซ้าย: วัน เดือน ปี + ตารางปฏิทินย่อ + วันหยุดราชการ -->
      <div class="md:col-span-4 lg:col-span-4 p-4 sm:p-5 bg-slate-50/70 md:border-r-2 border-b md:border-b-0 border-slate-300 flex flex-col justify-between">
        <div>
          <!-- หัวเดือน -->
          <div class="flex items-center justify-between mb-2.5">
            <h3 class="font-display font-bold text-base sm:text-lg text-slate-900">
              เดือน ${monthName} ${thaiYear}
            </h3>
            <span class="text-xs font-display font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              ${monthEvents.length} กิจกรรม
            </span>
          </div>

          <!-- ตารางปฏิทินย่อ -->
          <table class="mini-cal-table shadow-2xs">
            <thead>
              <tr>
                <th class="text-red-600!">อา</th>
                <th>จ</th>
                <th>อ</th>
                <th>พ</th>
                <th>พฤ</th>
                <th>ศ</th>
                <th class="text-indigo-700!">ส</th>
              </tr>
            </thead>
            <tbody>
              ${trList.join('')}
            </tbody>
          </table>

          <!-- รายการวันหยุดประจำเดือนใต้ตาราง -->
          ${holidaysListHtml}
        </div>

        ${
          state.currentUser
            ? `<div class="mt-3 pt-2 text-[11px] text-blue-600 font-medium flex items-center justify-between no-print">
                 <span>คลิกวันที่เพื่อเพิ่มกิจกรรม</span>
                 <button onclick="openEventModal(null, '${year}-${String(month + 1).padStart(2, '0')}-01')" class="underline hover:text-blue-800">+ เพิ่มงานเดือนนี้</button>
               </div>`
            : ''
        }
      </div>

      <!-- คอลัมน์ขวา: ภารกิจ / กิจกรรม -->
      <div class="md:col-span-8 lg:col-span-8 bg-white">
        <!-- Mobile Subheader -->
        <div class="md:hidden bg-slate-100 px-4 py-2 text-xs font-display font-bold text-slate-700 border-b border-slate-200">
          ภารกิจ / กิจกรรมประจำเดือน${monthName} ${thaiYear}
        </div>
        ${rightColumnHtml}
      </div>
    </div>
  `;
}

// ไฮไลต์แถวภารกิจด้านขวาเมื่อชี้เมาส์ที่วันที่ในปฏิทินย่อด้านซ้าย
function highlightActivitiesByDate(dateStr, highlight) {
  const rows = document.querySelectorAll('.split-activity-row');
  rows.forEach((row) => {
    const start = row.getAttribute('data-start');
    const end = row.getAttribute('data-end');
    if (start <= dateStr && end >= dateStr) {
      row.classList.toggle('highlight-date-match', highlight);
    }
  });
}

function handleMiniCalDateClick(dateStr) {
  if (state.currentUser) {
    openEventModal(null, dateStr);
    return;
  }
  const matching = getFilteredEvents().filter((e) => e.startDate <= dateStr && e.endDate >= dateStr);
  const holiday = THAI_HOLIDAYS[dateStr];
  if (matching.length === 1) {
    openDetailModal(matching[0].id);
  } else if (matching.length > 1) {
    highlightActivitiesByDate(dateStr, true);
    setTimeout(() => highlightActivitiesByDate(dateStr, false), 2200);
    showToast(`วันที่ ${formatFullThaiDate(dateStr)} มี ${matching.length} กิจกรรม`, 'info');
  } else if (holiday) {
    showToast(`${formatFullThaiDate(dateStr)}: ${holiday}`, 'info');
  }
}

// จัดรูปแบบวันที่แบบกระชับอ่านง่ายเหมือนในตาราง เช่น "8 – 10 ม.ค. 70" หรือ "16 ม.ค. 70"
function formatCompactThaiDateRange(startYmd, endYmd, contextYear, contextMonthIndex) {
  const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  if (!startYmd) return '-';
  const [sy, sm, sd] = startYmd.split('-').map((n) => parseInt(n, 10));
  const shortSy = String(sy + 543).slice(-2);

  if (!endYmd || startYmd === endYmd) {
    return `${sd} ${shortMonths[sm - 1]} ${shortSy}`;
  }

  const [ey, em, ed] = endYmd.split('-').map((n) => parseInt(n, 10));
  const shortEy = String(ey + 543).slice(-2);

  if (sy === ey && sm === em) {
    return `${sd} – ${ed} ${shortMonths[sm - 1]} ${shortSy}`;
  }
  return `${sd} ${shortMonths[sm - 1]} – ${ed} ${shortMonths[em - 1]} ${shortEy}`;
}

function renderMonthGrid(filteredEvents) {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  const year = state.currentYear;
  const month = state.currentMonth;

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = formatDateYMD(new Date());

  // สร้างอาร์เรย์ของวันทั้งหมดในหน้าตารางเดือน (รวมวันก่อนหน้าและถัดไปให้ครบสัปดาห์ละ 7 วัน)
  const allDays = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dObj = new Date(year, month, -i);
    allDays.push({
      dateStr: formatDateYMD(dObj),
      dayNum: dObj.getDate(),
      isCurrentMonth: false
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dObj = new Date(year, month, day);
    allDays.push({
      dateStr: formatDateYMD(dObj),
      dayNum: day,
      isCurrentMonth: true
    });
  }

  const remainingCells = (7 - (allDays.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const dObj = new Date(year, month + 1, i);
    allDays.push({
      dateStr: formatDateYMD(dObj),
      dayNum: dObj.getDate(),
      isCurrentMonth: false
    });
  }

  // แบ่งเป็นรายสัปดาห์ (สัปดาห์ละ 7 วัน) เพื่อวาดแถบยาวคร่อมวัน (Spanning Bars) สำหรับกิจกรรมต่อเนื่องหลายวัน
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const weeksHtml = weeks
    .map((week) => {
      const weekStart = week[0].dateStr;
      const weekEnd = week[6].dateStr;

      // 1. หัวช่องวันที่ทั้ง 7 วันในสัปดาห์นี้
      const dayHeadersHtml = week
        .map((cell) => {
          const isToday = cell.dateStr === todayStr;
          const holidayName = THAI_HOLIDAYS[cell.dateStr];

          if (!cell.isCurrentMonth) {
            return `
              <div
                onclick="handleCalendarCellClick('${cell.dateStr}')"
                class="p-1.5 sm:p-2 bg-slate-50/70 text-slate-300 select-none ${
                  state.currentUser ? 'cursor-pointer hover:bg-slate-100/70' : ''
                }"
              >
                <div class="text-xs font-medium">${cell.dayNum}</div>
              </div>
            `;
          }

          return `
            <div
              onclick="handleCalendarCellClick('${cell.dateStr}')"
              class="group p-1.5 sm:p-2 ${
                holidayName
                  ? 'bg-red-50/40'
                  : isToday
                  ? 'bg-blue-50/40'
                  : 'bg-white hover:bg-slate-50/70'
              } ${state.currentUser ? 'cursor-pointer' : ''}"
            >
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-xs font-display font-semibold shrink-0 ${
                    holidayName
                      ? 'w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center shadow-2xs'
                      : isToday
                      ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xs'
                      : 'text-slate-700'
                  }">
                    ${cell.dayNum}
                  </span>
                  ${
                    holidayName
                      ? `<span class="text-[10px] font-semibold text-red-600 truncate" title="${escapeHtml(holidayName)}">${escapeHtml(holidayName)}</span>`
                      : ''
                  }
                </div>
                ${
                  state.currentUser
                    ? `<span class="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 font-medium shrink-0 no-print">+ เพิ่ม</span>`
                    : ''
                }
              </div>
            </div>
          `;
        })
        .join('');

      // 2. คัดกรองกิจกรรมที่อยู่ในสัปดาห์นี้ และคำนวณคอลัมน์เริ่มต้น-สิ้นสุด (1-7) เพื่อคาดแถบยาวคร่อมวัน
      const weekEvents = filteredEvents
        .filter((evt) => evt.startDate <= weekEnd && evt.endDate >= weekStart)
        .map((evt) => {
          let startCol = 0;
          let endCol = 6;
          for (let c = 0; c < 7; c++) {
            if (week[c].dateStr === evt.startDate) startCol = c;
            if (week[c].dateStr === evt.endDate) endCol = c;
          }
          if (evt.startDate < weekStart) startCol = 0;
          if (evt.endDate > weekEnd) endCol = 6;

          const spanCols = endCol - startCol + 1;
          const isMultiDay = evt.startDate !== evt.endDate;
          const continuesLeft = evt.startDate < weekStart;
          const continuesRight = evt.endDate > weekEnd;

          return {
            evt,
            startCol,
            endCol,
            spanCols,
            isMultiDay,
            continuesLeft,
            continuesRight
          };
        })
        .sort((a, b) => {
          // ให้กิจกรรมหลายวัน (แถบยาว) ขึ้นแถวบนก่อน ตามด้วยคอลัมน์เริ่มต้น และงานส่ง
          if (a.isMultiDay !== b.isMultiDay) return a.isMultiDay ? -1 : 1;
          if (a.startCol !== b.startCol) return a.startCol - b.startCol;
          if (b.spanCols !== a.spanCols) return b.spanCols - a.spanCols;
          const subA = isSubmissionTask(a.evt) ? 0 : 1;
          const subB = isSubmissionTask(b.evt) ? 0 : 1;
          return subA - subB;
        });

      // จัดเรียงลงร่อง (Lanes) ไม่ให้แถบทับกัน
      const lanes = [];
      weekEvents.forEach((item) => {
        let placed = false;
        for (const lane of lanes) {
          const hasOverlap = lane.some(
            (existing) => !(item.endCol < existing.startCol || item.startCol > existing.endCol)
          );
          if (!hasOverlap) {
            lane.push(item);
            placed = true;
            break;
          }
        }
        if (!placed) {
          lanes.push([item]);
        }
      });

      const lanesHtml = lanes
        .map((lane) => {
          const itemsHtml = lane
            .map((item) => {
              const { evt, startCol, spanCols, isMultiDay, continuesLeft, continuesRight } = item;
              const dept = DEPARTMENTS[evt.department] || DEPARTMENTS.academic;
              const isSub = isSubmissionTask(evt);

              // หากเป็นกิจกรรมหลายวัน ใช้แถบสีเข้มคาดยาวคร่อมวันให้เห็นชัดเจน
              const pillStyleClass = isMultiDay
                ? `${dept.spanBarClass || dept.pillClass} event-span-bar`
                : `${dept.pillClass} ${isSub ? 'submission-pill' : ''}`;

              const edgeClass = `${continuesLeft ? 'event-continues-left' : ''} ${
                continuesRight ? 'event-continues-right' : ''
              }`;

              const submissionPrefix = isSub
                ? `<span class="submission-tag">📌 ส่งงาน</span>`
                : isMultiDay
                ? `<span class="text-[10px] opacity-90 shrink-0">${continuesLeft ? '◀' : '🗓️'}</span>`
                : `<span class="w-1.5 h-1.5 rounded-full ${dept.dotClass} shrink-0"></span>`;

              const dateRangeShort = isMultiDay
                ? ` (${formatDayNumber(evt.startDate)}–${formatDayNumber(evt.endDate)} ${formatShortThaiMonth(evt.endDate)})`
                : '';

              return `
                <div style="grid-column: ${startCol + 1} / span ${spanCols};" class="px-1">
                  <button
                    type="button"
                    onclick="event.stopPropagation(); openDetailModal('${evt.id}')"
                    class="event-pill ${pillStyleClass} ${edgeClass}"
                    title="${isSub ? '[งานที่ต้องส่ง] ' : ''}${escapeHtml(evt.title)}${dateRangeShort} — ${dept.name}"
                  >
                    ${submissionPrefix}
                    <span class="truncate">${escapeHtml(evt.title)}${dateRangeShort}</span>
                    ${continuesRight ? `<span class="ml-auto text-[10px] opacity-90 shrink-0">▶</span>` : ''}
                  </button>
                </div>
              `;
            })
            .join('');

          return `<div class="grid grid-cols-7 items-center">${itemsHtml}</div>`;
        })
        .join('');

      return `
        <div class="month-week-row relative flex flex-col justify-between bg-white">
          <!-- เส้นแบ่งคอลัมน์ทั้ง 7 วันด้านหลัง -->
          <div class="absolute inset-0 grid grid-cols-7 divide-x divide-slate-200 pointer-events-none">
            ${week
              .map(
                (cell) => `
                <div class="${!cell.isCurrentMonth ? 'bg-slate-50/60' : ''}"></div>
              `
              )
              .join('')}
          </div>

          <!-- แถวหัวเลขวันที่ของสัปดาห์ -->
          <div class="relative z-10 grid grid-cols-7 divide-x divide-slate-200">
            ${dayHeadersHtml}
          </div>

          <!-- แถบกิจกรรม (คาดยาวคร่อมวันได้ตามจำนวนวันจริง) -->
          <div class="relative z-10 space-y-1 pb-2.5 pt-0.5 flex-1">
            ${lanesHtml}
          </div>
        </div>
      `;
    })
    .join('');

  grid.innerHTML = weeksHtml;
}

function renderListView(monthEvents) {
  const container = document.getElementById('listViewSection');

  if (monthEvents.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="calendar-x" class="w-6 h-6"></i>
        </div>
        <h3 class="font-display font-semibold text-slate-800">ไม่มีรายการในเดือนนี้</h3>
        <p class="text-xs text-slate-500 mt-1">ลองเปลี่ยนเดือน หรือเปลี่ยนตัวกรองกลุ่มงานด้านบน</p>
      </div>
    `;
    return;
  }

  const sorted = [...monthEvents].sort((a, b) => a.startDate.localeCompare(b.startDate));

  container.innerHTML = sorted
    .map((evt) => {
      const dept = DEPARTMENTS[evt.department] || DEPARTMENTS.academic;
      const canEdit = canUserManageEvent(evt);
      const isSub = isSubmissionTask(evt);

      return `
        <div 
          onclick="openDetailModal('${evt.id}')"
          class="bg-white rounded-2xl border ${
            isSub ? 'border-rose-300 border-l-4 border-l-rose-600' : 'border-slate-200'
          } p-4 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="flex items-start gap-3.5">
            <div class="w-14 shrink-0 text-center ${
              isSub ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-900'
            } border rounded-xl py-2 px-1">
              <div class="text-xs opacity-75 font-medium">${formatShortThaiMonth(evt.startDate)}</div>
              <div class="font-display font-bold text-lg leading-tight">${formatDayNumber(evt.startDate)}</div>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${dept.pillClass}">
                  <span class="w-1.5 h-1.5 rounded-full ${dept.dotClass}"></span>
                  ${dept.name}
                </span>
                ${
                  isSub
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold bg-rose-600 text-white shadow-xs">📌 งานที่ต้องส่ง</span>`
                    : ''
                }
                <span class="text-xs text-slate-400">ปีการศึกษา ${evt.academicYear}</span>
              </div>
              <h4 class="font-display font-bold text-base text-slate-900">${escapeHtml(evt.title)}</h4>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                <span class="flex items-center gap-1">
                  <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
                  ${isSub ? 'กำหนดส่ง: ' : ''}${formatFullThaiDateRange(evt.startDate, evt.endDate)}
                </span>
                ${
                  evt.time
                    ? `<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i> ${escapeHtml(evt.time)}</span>`
                    : ''
                }
                ${
                  evt.location
                    ? `<span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i> ${escapeHtml(evt.location)}</span>`
                    : ''
                }
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 shrink-0 no-print">
            ${
              canEdit
                ? `<span class="text-[11px] font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">แก้ไขได้</span>`
                : `<span class="text-[11px] text-slate-400">ดูรายละเอียด &rarr;</span>`
            }
          </div>
        </div>
      `;
    })
    .join('');
}

// ================= STAFF NAME NORMALIZATION & AUTHENTICATION =================
// ฟังก์ชันตัดคำนำหน้าชื่อออกอัตโนมัติ เพื่อให้ชื่อผู้บันทึกเป็นรูปแบบเดียวกันเสมอ (เฉพาะ ชื่อจริง นามสกุล)
function stripThaiPrefix(str) {
  if (!str) return '';
  let s = String(str).trim();
  const prefixPattern =
    /^(คุณครู|ครู|อาจารย์|อ\.|นางสาว|น\.ส\.|นาง|นาย|ด\.ช\.|ด\.ญ\.|ผอ\.|ผู้อำนวยการ|รองผอ\.|รองฯ|ดร\.|ผศ\.ดร\.|รศ\.ดร\.|ผศ\.|รศ\.|ศ\.|ว่าที่\s*ร\.ต\.หญิง|ว่าที่\s*ร\.ต\.|ว่าที่ร้อยตรีหญิง|ว่าที่ร้อยตรี|จ\.ส\.อ\.|ส\.อ\.|ร\.ต\.อ\.|ร\.ต\.ท\.|ร\.ต\.ต\.|คุณ)\s*/i;
  // ตัดซ้ำกรณีมีหลายคำนำหน้า เช่น "ครู นายสมชาย"
  while (prefixPattern.test(s)) {
    s = s.replace(prefixPattern, '').trim();
  }
  return s.replace(/\s+/g, ' ').trim();
}

function normalizeStaffName(firstNameRaw, lastNameRaw = '') {
  const cleanFirst = stripThaiPrefix(firstNameRaw);
  const cleanLast = stripThaiPrefix(lastNameRaw);
  return [cleanFirst, cleanLast].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function getRecentStaffNames() {
  try {
    const raw = localStorage.getItem('sc_recent_staff_names');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveRecentStaffName(normalizedName) {
  if (!normalizedName) return;
  const list = getRecentStaffNames().filter((n) => n !== normalizedName);
  list.unshift(normalizedName);
  localStorage.setItem('sc_recent_staff_names', JSON.stringify(list.slice(0, 8)));
}

function renderRecentStaffChips() {
  const container = document.getElementById('recentStaffChipsContainer');
  if (!container) return;
  const names = getRecentStaffNames();
  if (names.length === 0) {
    container.classList.add('hidden');
    container.classList.remove('flex');
    return;
  }
  container.classList.remove('hidden');
  container.classList.add('flex');
  container.innerHTML =
    `<span class="text-[11px] text-slate-400 mr-0.5">เลือกชื่อเดิม:</span>` +
    names
      .map(
        (name) => `
        <button
          type="button"
          onclick="selectRecentStaffName('${escapeHtml(name)}')"
          class="px-2.5 py-0.5 rounded-full text-[11px] font-display font-medium bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition"
        >
          ${escapeHtml(name)}
        </button>
      `
      )
      .join('');
}

function selectRecentStaffName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  const firstInput = document.getElementById('loginFirstName');
  const lastInput = document.getElementById('loginLastName');
  if (firstInput) firstInput.value = parts[0] || '';
  if (lastInput) lastInput.value = parts.slice(1).join(' ') || '';
  updateLoginNamePreview();
}

function updateLoginNamePreview() {
  const firstInput = document.getElementById('loginFirstName');
  const lastInput = document.getElementById('loginLastName');
  const previewEl = document.getElementById('loginNormalizedPreview');
  if (!previewEl) return;
  const normalized = normalizeStaffName(firstInput?.value || '', lastInput?.value || '');
  previewEl.textContent = normalized ? `บันทึกเป็น: "${normalized}"` : '';
}

function previewEventStaffName() {
  const input = document.getElementById('eventStaffNameInput');
  if (!input) return;
  // ไม่บังคับตัดขณะพิมพ์ทันทีจนพิมพ์ยาก แต่ตัดคำนำหน้าเมื่อบันทึก
}

function canUserManageEvent(evt) {
  if (!state.currentUser) return false;
  if (state.currentUser.role === 'admin') return true;
  return state.currentUser.role === evt.department;
}

function renderUserStatus() {
  const container = document.getElementById('userStatusContainer');
  const btnAdd = document.getElementById('btnOpenAddModal');
  const banner = document.getElementById('roleInfoBanner');
  const bannerText = document.getElementById('roleInfoText');

  if (!state.currentUser) {
    btnAdd.classList.add('hidden');
    btnAdd.classList.remove('flex');
    banner.classList.add('hidden');

    container.innerHTML = `
      <button onclick="openLoginModal()" class="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-display font-medium text-xs sm:text-sm px-3 sm:px-3.5 py-2 rounded-xl transition">
        <i data-lucide="log-in" class="w-4 h-4 text-blue-600"></i>
        <span>เข้าสู่ระบบสารสนเทศ</span>
      </button>
    `;
  } else {
    btnAdd.classList.remove('hidden');
    btnAdd.classList.add('flex');
    banner.classList.remove('hidden');

    const roleName =
      state.currentUser.role === 'admin'
        ? 'ผู้ดูแลระบบกลาง (จัดการได้ทุกกลุ่มงาน)'
        : DEPARTMENTS[state.currentUser.role]?.name || '';

    bannerText.innerHTML = `ผู้บันทึก: <strong>${escapeHtml(state.currentUser.staffName)}</strong> — สิทธิ์อัปเดตงานของ <strong>${roleName}</strong> <button onclick="openLoginModal()" class="ml-2 underline text-blue-700 hover:text-blue-900 text-xs">(เปลี่ยนชื่อ/สลับฝ่าย)</button>`;

    container.innerHTML = `
      <div class="flex items-center gap-1.5 bg-blue-50 border border-blue-200 pl-3 pr-1.5 py-1.5 rounded-xl">
        <button onclick="openLoginModal()" title="คลิกเพื่อแก้ไขชื่อผู้บันทึกหรือเปลี่ยนกลุ่มงาน" class="text-left text-xs leading-tight hover:opacity-80 transition">
          <div class="font-display font-semibold text-blue-950 flex items-center gap-1">
            <span>${escapeHtml(state.currentUser.staffName)}</span>
            <i data-lucide="pencil" class="w-3 h-3 text-blue-600"></i>
          </div>
          <div class="text-[10px] text-blue-700 hidden sm:block">${roleName}</div>
        </button>
        <button onclick="handleLogout()" title="ออกจากระบบ" class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function openLoginModal() {
  document.getElementById('loginErrorMsg').classList.add('hidden');
  document.getElementById('loginPasscode').value = '';

  if (state.currentUser) {
    document.getElementById('loginDeptSelect').value = state.currentUser.role;
    selectRecentStaffName(state.currentUser.staffName);
  } else {
    updateLoginNamePreview();
  }

  renderRecentStaffChips();

  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('loginModal').classList.add('flex');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('loginModal').classList.remove('flex');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const role = document.getElementById('loginDeptSelect').value;
  const firstRaw = document.getElementById('loginFirstName')?.value || '';
  const lastRaw = document.getElementById('loginLastName')?.value || '';
  const staffName = normalizeStaffName(firstRaw, lastRaw);
  const pin = document.getElementById('loginPasscode').value.trim();
  const errEl = document.getElementById('loginErrorMsg');

  if (!staffName) {
    errEl.textContent = 'กรุณาระบุชื่อผู้บันทึก (ไม่ต้องใส่คำนำหน้า)';
    errEl.classList.remove('hidden');
    return;
  }

  const expectedPin = role === 'admin' ? ADMIN_PIN : DEPARTMENTS[role]?.pin;

  if (pin !== expectedPin) {
    errEl.textContent = 'รหัสผ่านประจำกลุ่มงานไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    errEl.classList.remove('hidden');
    return;
  }

  state.currentUser = { role, staffName };
  localStorage.setItem('sc_current_user', JSON.stringify(state.currentUser));
  saveRecentStaffName(staffName);
  closeLoginModal();
  renderUserStatus();
  renderAll();
  showToast(`เข้าสู่ระบบในชื่อ "${staffName}" เรียบร้อยแล้ว`, 'success');
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem('sc_current_user');
  renderUserStatus();
  renderAll();
  showToast('ออกจากระบบสารสนเทศเรียบร้อยแล้ว', 'info');
}

// ================= TIME INPUT HELPERS (ตลอดทั้งวัน / เวลาเริ่ม - เวลาสิ้นสุด) =================
function toggleAllDayTimeInputs() {
  const isAllDay = document.getElementById('eventAllDayInput')?.checked;
  const wrapper = document.getElementById('timeRangeInputsWrapper');
  const startInput = document.getElementById('eventStartTimeInput');
  const endInput = document.getElementById('eventEndTimeInput');
  if (!wrapper || !startInput || !endInput) return;

  if (isAllDay) {
    wrapper.classList.add('opacity-40', 'pointer-events-none');
    startInput.disabled = true;
    endInput.disabled = true;
  } else {
    wrapper.classList.remove('opacity-40', 'pointer-events-none');
    startInput.disabled = false;
    endInput.disabled = false;
  }
}

function applyQuickTimePreset(startStr, endStr) {
  const allDayCheckbox = document.getElementById('eventAllDayInput');
  const startInput = document.getElementById('eventStartTimeInput');
  const endInput = document.getElementById('eventEndTimeInput');
  if (allDayCheckbox) allDayCheckbox.checked = false;
  toggleAllDayTimeInputs();
  if (startInput) startInput.value = startStr || '';
  if (endInput) endInput.value = endStr || '';
}

function parseEventTimeIntoInputs(timeStr) {
  const allDayCheckbox = document.getElementById('eventAllDayInput');
  const startInput = document.getElementById('eventStartTimeInput');
  const endInput = document.getElementById('eventEndTimeInput');
  if (!allDayCheckbox || !startInput || !endInput) return;

  const raw = String(timeStr || '').trim();
  if (!raw || raw === '-' || raw.includes('ตลอดวัน') || raw.includes('ตลอดทั้งวัน')) {
    allDayCheckbox.checked = true;
    startInput.value = '';
    endInput.value = '';
    toggleAllDayTimeInputs();
    return;
  }

  // ค้นหารูปแบบเวลา HH:MM ในข้อความ เช่น "08:30 - 16:30 น." หรือ "ภายใน 16:30 น."
  const matches = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g);
  if (matches && matches.length >= 2) {
    allDayCheckbox.checked = false;
    startInput.value = matches[0].padStart(5, '0');
    endInput.value = matches[1].padStart(5, '0');
  } else if (matches && matches.length === 1) {
    allDayCheckbox.checked = false;
    startInput.value = matches[0].padStart(5, '0');
    endInput.value = '';
  } else {
    allDayCheckbox.checked = true;
    startInput.value = '';
    endInput.value = '';
  }
  toggleAllDayTimeInputs();
}

function buildEventTimeFromInputs(isSubmission) {
  const isAllDay = document.getElementById('eventAllDayInput')?.checked;
  if (isAllDay) return 'ตลอดทั้งวัน';

  const startVal = document.getElementById('eventStartTimeInput')?.value || '';
  const endVal = document.getElementById('eventEndTimeInput')?.value || '';

  if (startVal && endVal) {
    return `${startVal} - ${endVal} น.`;
  }
  if (startVal && !endVal) {
    return isSubmission ? `ภายใน ${startVal} น.` : `${startVal} น. เป็นต้นไป`;
  }
  if (!startVal && endVal) {
    return `ภายใน ${endVal} น.`;
  }
  return 'ตลอดทั้งวัน';
}

// ================= ADD / EDIT / DELETE EVENT =================
function handleCalendarCellClick(dateStr) {
  if (!state.currentUser) return;
  openEventModal(null, dateStr);
}

function openEventModal(editEventId = null, defaultDate = null) {
  if (!state.currentUser) {
    openLoginModal();
    return;
  }

  const modal = document.getElementById('eventFormModal');
  const titleEl = document.getElementById('eventModalTitle');
  const deptSelect = document.getElementById('eventDeptInput');
  const isSubmissionCheckbox = document.getElementById('eventIsSubmissionInput');
  const staffNameInput = document.getElementById('eventStaffNameInput');

  if (editEventId) {
    const evt = state.events.find((x) => x.id === editEventId);
    if (!evt) return;

    titleEl.textContent = 'แก้ไขข้อมูลรายการในปฏิทิน';
    document.getElementById('eventIdInput').value = evt.id;
    document.getElementById('eventTitleInput').value = evt.title;
    deptSelect.value = evt.department;
    document.getElementById('eventAcademicYearInput').value = evt.academicYear || '2569';
    document.getElementById('eventStartDateInput').value = evt.startDate;
    document.getElementById('eventEndDateInput').value = evt.endDate;
    document.getElementById('eventTimeInput').value = evt.time || '';
    parseEventTimeIntoInputs(evt.time || '');
    document.getElementById('eventLocationInput').value = evt.location || '';
    document.getElementById('eventDescInput').value = evt.description || '';
    isSubmissionCheckbox.checked = isSubmissionTask(evt);

    // ดึงชื่อผู้บันทึกเดิม (ตัดวงเล็บกลุ่มงานออกเพื่อให้แก้ไขเฉพาะชื่อจริง-นามสกุลได้ง่าย)
    const rawRecorder = String(evt.updatedBy || '').replace(/\s*\(.*?\)\s*$/, '').trim();
    if (staffNameInput) {
      staffNameInput.value = normalizeStaffName(rawRecorder) || state.currentUser.staffName;
    }
  } else {
    titleEl.textContent = 'เพิ่มงาน / กิจกรรมโรงเรียนพัฒนานิคม';
    document.getElementById('eventIdInput').value = '';
    document.getElementById('eventTitleInput').value = '';
    isSubmissionCheckbox.checked = false;

    const todayDefault = defaultDate || formatDateYMD(new Date(state.currentYear, state.currentMonth, 1));
    document.getElementById('eventStartDateInput').value = todayDefault;
    document.getElementById('eventEndDateInput').value = todayDefault;
    document.getElementById('eventAcademicYearInput').value =
      state.selectedAcademicYear === 'all' ? '2569' : state.selectedAcademicYear;
    document.getElementById('eventTimeInput').value = '';
    parseEventTimeIntoInputs('ตลอดทั้งวัน');
    document.getElementById('eventLocationInput').value = '';
    document.getElementById('eventDescInput').value = '';

    if (staffNameInput) {
      staffNameInput.value = state.currentUser.staffName || '';
    }

    if (state.currentUser.role !== 'admin') {
      deptSelect.value = state.currentUser.role;
    } else {
      deptSelect.value = state.selectedDepartment !== 'all' ? state.selectedDepartment : 'central';
    }
  }

  deptSelect.disabled = state.currentUser.role !== 'admin';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeEventModal() {
  const modal = document.getElementById('eventFormModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function syncEndDate() {
  const start = document.getElementById('eventStartDateInput').value;
  const endInput = document.getElementById('eventEndDateInput');
  if (!endInput.value || endInput.value < start) {
    endInput.value = start;
  }
}

async function handleEventFormSubmit(e) {
  e.preventDefault();
  if (!state.currentUser) return;

  const existingId = document.getElementById('eventIdInput').value;
  const startDate = document.getElementById('eventStartDateInput').value;
  const endDate = document.getElementById('eventEndDateInput').value;

  if (endDate < startDate) {
    showToast('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น', 'error');
    return;
  }

  const department =
    state.currentUser.role === 'admin'
      ? document.getElementById('eventDeptInput').value
      : state.currentUser.role;

  const isSubmission = document.getElementById('eventIsSubmissionInput').checked;
  const formattedTime = buildEventTimeFromInputs(isSubmission);

  // จัดรูปแบบชื่อผู้บันทึกให้เป็นมาตรฐานเดียวกันเสมอ (ตัดคำนำหน้าอัตโนมัติ)
  const rawStaffInput = document.getElementById('eventStaffNameInput')?.value || state.currentUser.staffName;
  const cleanStaffName = normalizeStaffName(rawStaffInput) || state.currentUser.staffName;
  if (cleanStaffName && cleanStaffName !== state.currentUser.staffName) {
    state.currentUser.staffName = cleanStaffName;
    localStorage.setItem('sc_current_user', JSON.stringify(state.currentUser));
    saveRecentStaffName(cleanStaffName);
    renderUserStatus();
  }

  const payload = {
    id: existingId || `evt-${Date.now()}`,
    title: document.getElementById('eventTitleInput').value.trim(),
    department,
    academicYear: document.getElementById('eventAcademicYearInput').value,
    startDate,
    endDate,
    time: formattedTime,
    location: document.getElementById('eventLocationInput').value.trim(),
    description: document.getElementById('eventDescInput').value.trim(),
    isSubmission,
    updatedBy: `${cleanStaffName} (${DEPARTMENTS[department]?.shortName || 'ผู้ดูแล'})`
  };

  if (existingId) {
    const idx = state.events.findIndex((x) => x.id === existingId);
    if (idx !== -1) state.events[idx] = payload;
  } else {
    state.events.push(payload);
  }

  saveEventsToLocal();
  closeEventModal();
  renderAll();

  if (state.scriptUrl) {
    await syncEventToGoogleSheets(existingId ? 'update' : 'create', payload);
  } else {
    showToast(existingId ? 'แก้ไขข้อมูลเรียบร้อยแล้ว' : 'บันทึกรายการลงปฏิทินเรียบร้อยแล้ว', 'success');
  }
}

function openDetailModal(eventId) {
  const evt = state.events.find((x) => x.id === eventId);
  if (!evt) return;

  const dept = DEPARTMENTS[evt.department] || DEPARTMENTS.academic;
  const badge = document.getElementById('detailDeptBadge');
  badge.className = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${dept.pillClass}`;
  badge.innerHTML = `<span class="w-2 h-2 rounded-full ${dept.dotClass}"></span> ${dept.name}`;

  const subBadge = document.getElementById('detailSubmissionBadge');
  const isSub = isSubmissionTask(evt);
  if (isSub) {
    subBadge.classList.remove('hidden');
    subBadge.classList.add('inline-flex');
    document.getElementById('detailDateLabel').textContent = 'กำหนดส่ง: ';
    document.getElementById('detailLocationLabel').textContent = 'สถานที่ / ช่องทางส่ง: ';
  } else {
    subBadge.classList.add('hidden');
    subBadge.classList.remove('inline-flex');
    document.getElementById('detailDateLabel').textContent = 'วันที่: ';
    document.getElementById('detailLocationLabel').textContent = 'สถานที่: ';
  }

  document.getElementById('detailTitle').textContent = evt.title;
  document.getElementById('detailDateText').textContent = formatFullThaiDateRange(evt.startDate, evt.endDate);
  document.getElementById('detailTimeText').textContent = evt.time || 'ไม่ระบุเวลา (ตลอดวัน)';
  document.getElementById('detailLocationText').textContent = evt.location || 'ไม่ระบุสถานที่';
  document.getElementById('detailYearText').textContent = `ปีการศึกษา ${evt.academicYear || '-'}`;
  document.getElementById('detailDescText').textContent = evt.description || 'ไม่มีรายละเอียดเพิ่มเติม';
  document.getElementById('detailUpdatedBy').textContent = `อัปเดตโดย: ${evt.updatedBy || 'เจ้าหน้าที่สารสนเทศ'}`;

  const btnEdit = document.getElementById('btnEditCurrentEvent');
  const btnDelete = document.getElementById('btnDeleteCurrentEvent');
  const hint = document.getElementById('detailPermissionHint');

  if (canUserManageEvent(evt)) {
    btnEdit.classList.remove('hidden');
    btnEdit.classList.add('inline-flex');
    btnEdit.onclick = () => {
      closeDetailModal();
      openEventModal(evt.id);
    };

    btnDelete.classList.remove('hidden');
    btnDelete.classList.add('inline-flex');
    btnDelete.onclick = () => handleDeleteEvent(evt.id);
    hint.textContent = 'คุณมีสิทธิ์แก้ไข/ลบรายการนี้';
  } else {
    btnEdit.classList.add('hidden');
    btnEdit.classList.remove('inline-flex');
    btnDelete.classList.add('hidden');
    btnDelete.classList.remove('inline-flex');
    hint.textContent = state.currentUser
      ? `เฉพาะสารสนเทศ${dept.shortName}เท่านั้นที่แก้ไขได้`
      : 'เข้าสู่ระบบสารสนเทศเพื่อแก้ไข';
  }

  const modal = document.getElementById('eventDetailModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeDetailModal() {
  const modal = document.getElementById('eventDetailModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function handleDeleteEvent(eventId) {
  const evt = state.events.find((x) => x.id === eventId);
  if (!evt || !canUserManageEvent(evt)) return;

  state.events = state.events.filter((x) => x.id !== eventId);
  saveEventsToLocal();
  closeDetailModal();
  renderAll();

  if (state.scriptUrl) {
    await syncEventToGoogleSheets('delete', { id: eventId });
  } else {
    showToast('ลบรายการออกจากปฏิทินแล้ว', 'info');
  }
}

// ================= GOOGLE SHEETS INTEGRATION =================
function openSheetsConfigModal() {
  document.getElementById('configSchoolNameInput').value = state.schoolName;
  document.getElementById('configScriptUrlInput').value = state.scriptUrl;
  const modal = document.getElementById('sheetsConfigModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeSheetsConfigModal() {
  const modal = document.getElementById('sheetsConfigModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function saveSheetsConfig() {
  state.schoolName = document.getElementById('configSchoolNameInput').value.trim() || 'โรงเรียนพัฒนานิคม';
  state.scriptUrl = document.getElementById('configScriptUrlInput').value.trim();

  localStorage.setItem('sc_school_name', state.schoolName);
  localStorage.setItem('sc_script_url', state.scriptUrl);

  updateHeaderSchoolInfo();
  closeSheetsConfigModal();
  renderAll();
  showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว', 'success');

  if (state.scriptUrl) {
    refreshFromGoogleSheets();
  }
}

function resetDemoData() {
  state.events = [...DEFAULT_SAMPLE_EVENTS];
  saveEventsToLocal();
  closeSheetsConfigModal();
  renderAll();
  showToast('รีเซ็ตข้อมูลตัวอย่างเริ่มต้นเรียบร้อยแล้ว', 'info');
}

async function refreshFromGoogleSheets(silent = false) {
  if (!state.scriptUrl) {
    if (!silent) {
      openSheetsConfigModal();
      showToast('กรุณาใส่ Google Apps Script URL เพื่อซิงค์กับ Google Sheets', 'info');
    }
    return;
  }

  try {
    if (!silent) showToast('กำลังดึงข้อมูลล่าสุดจาก Google Sheets...', 'info');
    const res = await fetch(`${state.scriptUrl}?action=list`);
    const data = await res.json();
    if (Array.isArray(data.events)) {
      state.events = data.events;
      saveEventsToLocal();
      renderAll();
      if (!silent) showToast('อัปเดตข้อมูลจาก Google Sheets สำเร็จ', 'success');
    }
  } catch (err) {
    console.error('Google Sheets Sync Error:', err);
    if (!silent) showToast('ไม่สามารถเชื่อมต่อ Google Sheets ได้ กำลังใช้ข้อมูลในเครื่องแทน', 'error');
  }
}

async function syncEventToGoogleSheets(action, eventData) {
  if (!state.scriptUrl) return;
  try {
    showToast('กำลังบันทึกข้อมูลไปยัง Google Sheets...', 'info');
    await fetch(state.scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, event: eventData })
    });
    showToast('บันทึกข้อมูลลง Google Sheets เรียบร้อยแล้ว', 'success');
  } catch (err) {
    console.error('Failed to post to Google Sheets:', err);
    showToast('บันทึกในเครื่องแล้ว แต่ส่งไป Google Sheets ไม่สำเร็จ', 'error');
  }
}

// ================= EXPORT CSV & PRINT PDF =================
function exportToCSV() {
  const filtered = getFilteredEvents().sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (filtered.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับส่งออก', 'error');
    return;
  }

  const headers = [
    'รหัส',
    'ประเภท',
    'ชื่อกิจกรรม/งานที่ต้องส่ง',
    'กลุ่มงานที่รับผิดชอบ',
    'ปีการศึกษา',
    'วันที่เริ่มต้น/กำหนดส่ง',
    'วันที่สิ้นสุด',
    'เวลา',
    'สถานที่/ช่องทางส่ง',
    'รายละเอียด',
    'ผู้บันทึกข้อมูล'
  ];

  const rows = filtered.map((e) => [
    e.id,
    isSubmissionTask(e) ? 'งานที่ต้องส่ง' : 'กิจกรรม',
    e.title,
    DEPARTMENTS[e.department]?.name || e.department,
    e.academicYear,
    e.startDate,
    e.endDate,
    e.time || '',
    e.location || '',
    (e.description || '').replace(/\n/g, ' '),
    e.updatedBy || ''
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ปฏิทินปฏิบัติงาน_${state.schoolName}_${state.selectedAcademicYear}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('ดาวน์โหลดไฟล์ Excel (CSV) เรียบร้อยแล้ว', 'success');
}

function printCalendar() {
  window.print();
}

// ================= HELPERS =================
function formatDateYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDayNumber(ymd) {
  if (!ymd) return '-';
  const parts = ymd.split('-');
  return parseInt(parts[2], 10);
}

function formatShortThaiMonth(ymd) {
  if (!ymd) return '';
  const parts = ymd.split('-');
  const mIdx = parseInt(parts[1], 10) - 1;
  const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return shortMonths[mIdx] || '';
}

function formatFullThaiDate(ymd) {
  if (!ymd) return '-';
  const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

function formatFullThaiDateRange(startYmd, endYmd) {
  if (!startYmd) return '-';
  if (!endYmd || startYmd === endYmd) {
    return formatFullThaiDate(startYmd);
  }
  return `${formatFullThaiDate(startYmd)} ถึง ${formatFullThaiDate(endYmd)}`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  const colorMap = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white'
  };

  toast.className = `${
    colorMap[type] || colorMap.info
  } px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm font-display font-medium flex items-center gap-2 animate-fade-in`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}
