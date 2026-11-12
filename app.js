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
    key: 'central',
    name: 'ส่วนกลาง',
    shortName: 'ส่วนกลาง',
    pin: '1111',
    dotClass: 'bg-teal-600',
    pillClass: 'bg-teal-50 text-teal-800 border border-teal-200',
    spanBarClass: 'bg-teal-600 text-white border border-teal-700',
    activeFilterClass: 'bg-teal-600 text-white border-teal-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-teal-50'
  },
  director: {
    id: 'director',
    key: 'director',
    name: 'ฝ่ายอำนวยการ',
    shortName: 'อำนวยการ',
    pin: '1111',
    dotClass: 'bg-indigo-600',
    pillClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    spanBarClass: 'bg-indigo-600 text-white border border-indigo-700',
    activeFilterClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50'
  },
  academic: {
    id: 'academic',
    key: 'academic',
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
    key: 'student',
    name: 'กลุ่มบริหารกิจการนักเรียน',
    shortName: 'กิจการนักเรียน',
    pin: '1111',
    dotClass: 'bg-emerald-600',
    pillClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    spanBarClass: 'bg-emerald-600 text-white border border-emerald-700',
    activeFilterClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
  },
  general: {
    id: 'general',
    key: 'general',
    name: 'กลุ่มบริหารทั่วไป',
    shortName: 'บริหารทั่วไป',
    pin: '1111',
    dotClass: 'bg-amber-500',
    pillClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    spanBarClass: 'bg-amber-500 text-white border border-amber-600',
    activeFilterClass: 'bg-amber-500 text-white border-amber-500 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
  },
  budget: {
    id: 'budget',
    key: 'budget',
    name: 'กลุ่มบริหารงบประมาณและแผน',
    shortName: 'งบประมาณ/แผน',
    pin: '1111',
    dotClass: 'bg-rose-600',
    pillClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    spanBarClass: 'bg-rose-600 text-white border border-rose-700',
    activeFilterClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
  },
  personnel: {
    id: 'personnel',
    key: 'personnel',
    name: 'กลุ่มบริหารงานบุคคล',
    shortName: 'งานบุคคล',
    pin: '1111',
    dotClass: 'bg-purple-600',
    pillClass: 'bg-purple-50 text-purple-800 border border-purple-200',
    spanBarClass: 'bg-purple-600 text-white border border-purple-700',
    activeFilterClass: 'bg-purple-600 text-white border-purple-600 shadow-xs',
    inactiveFilterClass: 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50'
  }
};

// รหัสผ่านกลาง (รองรับทั้ง 1111 และรหัสเดิมเพื่อให้ใช้งานได้สะดวกทันที)
const SHARED_PINS = ['1111', '9999', '1234', '2222', '3333', '4444', '5555', '6666'];

function resolveDeptId(token) {
  if (!token) return null;
  const t = String(token).trim();
  if (DEPARTMENTS[t]) return t;
  const found = Object.values(DEPARTMENTS).find((d) => d.name === t || d.shortName === t);
  return found ? found.id : null;
}

// ดึงรายการรหัสฝ่ายงานทั้งหมดของกิจกรรม (รองรับการเลือกหลายฝ่ายงาน เช่น "academic,student" หรือ ['academic', 'student'])
function getEventDepartments(evt) {
  if (!evt) return ['academic'];
  if (Array.isArray(evt.departments) && evt.departments.length > 0) {
    const valid = evt.departments.map(resolveDeptId).filter(Boolean);
    if (valid.length > 0) return Array.from(new Set(valid));
  }
  if (evt.department) {
    const parts = String(evt.department)
      .split(',')
      .map(resolveDeptId)
      .filter(Boolean);
    if (parts.length > 0) return Array.from(new Set(parts));
  }
  if (evt.updatedBy) {
    const fromUpdatedBy = String(evt.updatedBy)
      .split(',')
      .map(resolveDeptId)
      .filter(Boolean);
    if (fromUpdatedBy.length > 0) return Array.from(new Set(fromUpdatedBy));
  }
  return ['academic'];
}

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

// ================= ระบบคำนวณวันหยุดราชการและวันสำคัญอัตโนมัติสำหรับทุกปี พ.ศ. =================
// 1) วันหยุดราชการประจำปีที่ตรงกับวันที่เดิมทุกปี (Fixed Annual Public Holidays)
const FIXED_ANNUAL_THAI_HOLIDAYS = [
  { mmdd: '01-01', name: 'หยุดวันขึ้นปีใหม่', subName: 'หยุดชดเชยวันขึ้นปีใหม่' },
  { mmdd: '04-06', name: 'วันจักรี', subName: 'หยุดชดเชยวันจักรี' },
  { mmdd: '04-13', name: 'วันสงกรานต์', subName: 'หยุดชดเชยวันสงกรานต์' },
  { mmdd: '04-14', name: 'วันสงกรานต์', subName: 'หยุดชดเชยวันสงกรานต์' },
  { mmdd: '04-15', name: 'วันสงกรานต์', subName: 'หยุดชดเชยวันสงกรานต์' },
  { mmdd: '05-04', name: 'วันฉัตรมงคล', subName: 'หยุดชดเชยวันฉัตรมงคล' },
  { mmdd: '06-03', name: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี', subName: 'หยุดชดเชยวันเฉลิมฯ พระบรมราชินี' },
  { mmdd: '07-28', name: 'วันเฉลิมพระชนมพรรษา รัชกาลที่ 10', subName: 'หยุดชดเชยวันเฉลิมฯ รัชกาลที่ 10' },
  { mmdd: '08-12', name: 'วันเฉลิมพระชนมพรรษา พระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ', subName: 'หยุดชดเชยวันแม่แห่งชาติ' },
  { mmdd: '10-13', name: 'วันนวมินทรมหาราช', subName: 'หยุดชดเชยวันนวมินทรมหาราช' },
  { mmdd: '10-23', name: 'วันปิยมหาราช', subName: 'หยุดชดเชยวันปิยมหาราช' },
  { mmdd: '12-05', name: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ', subName: 'หยุดชดเชยวันพ่อแห่งชาติ' },
  { mmdd: '12-10', name: 'วันรัฐธรรมนูญ', subName: 'หยุดชดเชยวันรัฐธรรมนูญ' },
  { mmdd: '12-31', name: 'หยุดวันสิ้นปี', subName: 'หยุดชดเชยวันสิ้นปี' }
];

// 2) วันสำคัญทางพุทธศาสนา (มาฆบูชา, วิสาขบูชา, อาสาฬหบูชา, เข้าพรรษา) ตามปฏิทินจันทรคติ (ค.ศ. 2024 - 2036 / พ.ศ. 2567 - 2579)
const LUNAR_THAI_HOLIDAYS_BY_YEAR = {
  2024: [
    { mmdd: '02-24', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-22', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-20', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-21', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2025: [
    { mmdd: '02-12', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-11', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-10', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-11', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2026: [
    { mmdd: '03-03', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-31', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-29', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-30', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2027: [
    { mmdd: '02-21', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-20', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-18', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-19', name: 'วันเข้าพรรษา / หยุดชดเชย', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2028: [
    { mmdd: '02-10', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-08', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-06', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-07', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2029: [
    { mmdd: '02-28', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-27', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-25', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-26', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2030: [
    { mmdd: '02-17', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-15', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-14', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-15', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2031: [
    { mmdd: '03-07', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '06-04', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '08-01', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '08-02', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2032: [
    { mmdd: '02-25', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-23', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-21', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-22', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2033: [
    { mmdd: '02-13', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-13', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-11', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-12', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2034: [
    { mmdd: '03-04', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '06-01', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-30', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-31', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2035: [
    { mmdd: '02-22', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-21', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-19', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-20', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ],
  2036: [
    { mmdd: '02-11', name: 'วันมาฆบูชา', subName: 'หยุดชดเชยวันมาฆบูชา' },
    { mmdd: '05-09', name: 'วันวิสาขบูชา', subName: 'หยุดชดเชยวันวิสาขบูชา' },
    { mmdd: '07-07', name: 'วันอาสาฬหบูชา', subName: 'หยุดชดเชยวันอาสาฬหบูชา' },
    { mmdd: '07-08', name: 'วันเข้าพรรษา', subName: 'หยุดชดเชยวันเข้าพรรษา' }
  ]
};

const generatedHolidaysCache = {};

// คำนวณวันหยุดราชการและวันหยุดชดเชยอัตโนมัติสำหรับปี ค.ศ. ใดๆ
function getAutoHolidaysForGregorianYear(year) {
  if (generatedHolidaysCache[year]) return generatedHolidaysCache[year];

  const map = {};
  const allEntries = [...FIXED_ANNUAL_THAI_HOLIDAYS, ...(LUNAR_THAI_HOLIDAYS_BY_YEAR[year] || [])];

  // 1. ใส่วันหยุดหลักทั้งหมดก่อน
  allEntries.forEach((h) => {
    const dateStr = `${year}-${h.mmdd}`;
    map[dateStr] = h.name;
  });

  // 2. คำนวณวันหยุดชดเชยอัตโนมัติเมื่อวันหยุดหลักตรงกับวันเสาร์ (6) หรือวันอาทิตย์ (0)
  // ยกเว้นปี 2027 ที่ 18 ก.ค. (อาสาฬหบูชา) กับ 19 ก.ค. (เข้าพรรษา) รวมเป็น "วันเข้าพรรษา / หยุดชดเชย" ตามต้นฉบับโรงเรียน
  allEntries.forEach((h) => {
    if (year === 2027 && h.mmdd === '07-18') return;
    if (h.mmdd === '12-31') return; // วันสิ้นปีชดเชยข้ามไปต้นเดือนมกราคมปีถัดไป

    const [mm, dd] = h.mmdd.split('-').map((n) => parseInt(n, 10));
    const dObj = new Date(year, mm - 1, dd);
    const dow = dObj.getDay();
    if (dow === 0 || dow === 6) {
      // เลื่อนไปหาวันทำการถัดไป (จันทร์-ศุกร์) ที่ยังไม่มีวันหยุดราชการ
      const nextDate = new Date(year, mm - 1, dd + 1);
      while (nextDate.getDay() === 0 || nextDate.getDay() === 6 || map[formatDateYMD(nextDate)]) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      const subDateStr = formatDateYMD(nextDate);
      if (nextDate.getFullYear() === year) {
        map[subDateStr] = h.subName || `หยุดชดเชย${h.name}`;
      }
    }
  });

  generatedHolidaysCache[year] = map;
  return map;
}

// ดึงชื่อวันหยุดของวันที่ YYYY-MM-DD (รวมวันหยุดอัตโนมัติ + วันหยุดที่ผู้ใช้เพิ่ม/แก้ไขเอง)
function getThaiHoliday(dateStr) {
  if (!dateStr) return null;
  if (state.customHolidays && Object.prototype.hasOwnProperty.call(state.customHolidays, dateStr)) {
    // หากค่าเป็น '' แปลว่าผู้ใช้ลบวันหยุดนั้นออก
    return state.customHolidays[dateStr] || null;
  }
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (!year) return null;
  const yearMap = getAutoHolidaysForGregorianYear(year);
  return yearMap[dateStr] || null;
}

// สร้างลำดับ 12 เดือนของปีงบประมาณ พ.ศ. ที่ระบุ (ต.ค. ปีก่อนหน้า – ก.ย. ปีที่เลือก)
function getFiscalYearMonths(fiscalYearBE = state.selectedFiscalYear) {
  const fy = parseInt(fiscalYearBE, 10) || 2570;
  const startGregorianYear = fy - 543 - 1; // เช่น ปีงบฯ 2570 เริ่ม ต.ค. 2569 (ค.ศ. 2026)
  const endGregorianYear = fy - 543;       // สิ้นสุด ก.ย. 2570 (ค.ศ. 2027)
  return [
    { year: startGregorianYear, month: 9 },  // ต.ค.
    { year: startGregorianYear, month: 10 }, // พ.ย.
    { year: startGregorianYear, month: 11 }, // ธ.ค.
    { year: endGregorianYear, month: 0 },    // ม.ค.
    { year: endGregorianYear, month: 1 },    // ก.พ.
    { year: endGregorianYear, month: 2 },    // มี.ค.
    { year: endGregorianYear, month: 3 },    // เม.ย.
    { year: endGregorianYear, month: 4 },    // พ.ค.
    { year: endGregorianYear, month: 5 },    // มิ.ย.
    { year: endGregorianYear, month: 6 },    // ก.ค.
    { year: endGregorianYear, month: 7 },    // ส.ค.
    { year: endGregorianYear, month: 8 }     // ก.ย.
  ];
}

// 3. State ของแอปพลิเคชัน
let state = {
  events: [],
  currentYear: new Date().getFullYear(), // ค.ศ.
  currentMonth: new Date().getMonth(),   // 0 - 11
  selectedFiscalYear: 2570,              // ปีงบประมาณ พ.ศ. ที่กำลังเปิดดู (เช่น 2570 = ต.ค. 69 - ก.ย. 70)
  fiscalYears: [2568, 2569, 2570, 2571, 2572], // รายการปีที่เปิดให้เลือก (กด + เพิ่มปีไปได้เรื่อยๆ ไม่จำกัด)
  customHolidays: {},                    // วันหยุดพิเศษที่เพิ่มหรือแก้ไขเอง { 'YYYY-MM-DD': 'ชื่อวันหยุด' }
  selectedDepartment: 'all',
  onlySubmission: false, // กรองเฉพาะงานที่ต้องส่ง
  selectedAcademicYear: 'all',
  searchQuery: '',
  viewMode: 'split', // 'split' (ตารางปฏิทินคู่ภารกิจ) | 'month' | 'list'
  tableMonthScope: 'all', // 'all' (แสดงทุกเดือนในรอบปี) | 'single' (ดูทีละเดือน)
  currentUser: null, // { role: 'admin' }
  schoolName: 'โรงเรียนพัฒนานิคม สพม.ลพบุรี',
  scriptUrl: ''
};

let deferredInstallPrompt = null;

// ================= INITIALIZATION & PWA SETUP =================
document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  loadSettingsAndData();
  renderYearSelectors();
  renderDepartmentFilters();
  renderDepartmentLegend();
  renderUserStatus();
  renderAll();
  if (window.lucide) {
    lucide.createIcons();
  }
});

function initPWA() {
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== 'school-calendar-v10') {
          caches.delete(key);
        }
      });
    });
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker
      .register('./sw.js?v=10', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update();
      })
      .catch((err) => {
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
      const parsedUser = JSON.parse(savedUser);
      state.currentUser = parsedUser ? { role: 'admin' } : null;
    } catch (e) {
      state.currentUser = null;
    }
  }

  const savedFiscalYears = localStorage.getItem('sc_fiscal_years');
  if (savedFiscalYears) {
    try {
      const parsedFY = JSON.parse(savedFiscalYears);
      if (Array.isArray(parsedFY) && parsedFY.length > 0) {
        state.fiscalYears = Array.from(new Set([2568, 2569, 2570, 2571, 2572, ...parsedFY])).sort((a, b) => a - b);
      }
    } catch (e) {}
  }

  const savedSelectedFY = localStorage.getItem('sc_selected_fiscal_year');
  if (savedSelectedFY && !isNaN(parseInt(savedSelectedFY, 10))) {
    state.selectedFiscalYear = parseInt(savedSelectedFY, 10);
    if (!state.fiscalYears.includes(state.selectedFiscalYear)) {
      state.fiscalYears.push(state.selectedFiscalYear);
      state.fiscalYears.sort((a, b) => a - b);
    }
  }

  const savedCustomHolidays = localStorage.getItem('sc_custom_holidays');
  if (savedCustomHolidays) {
    try {
      state.customHolidays = JSON.parse(savedCustomHolidays) || {};
    } catch (e) {
      state.customHolidays = {};
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

  const fy = state.selectedFiscalYear || 2570;
  const shortStartY = String(fy - 1).slice(-2);
  const shortEndY = String(fy).slice(-2);
  btnAll.textContent = `แสดงทุกเดือน (ต.ค. ${shortStartY} - ก.ย. ${shortEndY})`;

  if (state.tableMonthScope === 'all') {
    btnAll.className = 'px-3 py-1.5 rounded-lg bg-white text-blue-700 font-semibold shadow-sm transition';
    btnSingle.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
  } else {
    btnSingle.className = 'px-3 py-1.5 rounded-lg bg-white text-blue-700 font-semibold shadow-sm transition';
    btnAll.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
  }
}

// ================= YEAR MANAGEMENT & CUSTOM HOLIDAYS =================
function ensureYearInList(fyBE) {
  const y = parseInt(fyBE, 10);
  if (!y || isNaN(y)) return;
  if (!state.fiscalYears.includes(y)) {
    state.fiscalYears.push(y);
    state.fiscalYears.sort((a, b) => a - b);
    localStorage.setItem('sc_fiscal_years', JSON.stringify(state.fiscalYears));
  }
}

function renderYearSelectors() {
  // รวบรวมปีที่มีในรายการกิจกรรมด้วยเสมอ
  state.events.forEach((evt) => {
    if (evt.academicYear) ensureYearInList(parseInt(evt.academicYear, 10));
    if (evt.startDate) {
      const gy = parseInt(evt.startDate.slice(0, 4), 10);
      const gm = parseInt(evt.startDate.slice(5, 7), 10);
      if (gy && gm) {
        const fy = gm >= 10 ? gy + 543 + 1 : gy + 543;
        ensureYearInList(fy);
      }
    }
  });

  const fySelect = document.getElementById('fiscalYearSelect');
  if (fySelect) {
    fySelect.innerHTML = state.fiscalYears
      .map((fy) => {
        const sY = String(fy - 1).slice(-2);
        const eY = String(fy).slice(-2);
        return `<option value="${fy}" ${fy === state.selectedFiscalYear ? 'selected' : ''}>ปีงบฯ ${fy} (ต.ค. ${sY} – ก.ย. ${eY})</option>`;
      })
      .join('');
  }

  const acadFilterSelect = document.getElementById('academicYearSelect');
  if (acadFilterSelect) {
    const currentVal = state.selectedAcademicYear || 'all';
    acadFilterSelect.innerHTML =
      `<option value="all" ${currentVal === 'all' ? 'selected' : ''}>ทุกปีการศึกษา</option>` +
      state.fiscalYears
        .map(
          (y) =>
            `<option value="${y}" ${String(currentVal) === String(y) ? 'selected' : ''}>ปีการศึกษา ${y}</option>`
        )
        .join('');
  }

  const eventAcadSelect = document.getElementById('eventAcademicYearInput');
  if (eventAcadSelect) {
    const currentVal = eventAcadSelect.value || String(state.selectedFiscalYear - 1);
    eventAcadSelect.innerHTML = state.fiscalYears
      .map(
        (y) => `<option value="${y}" ${String(currentVal) === String(y) ? 'selected' : ''}>${y}</option>`
      )
      .join('');
  }

  updateScopeButtonsUI();
}

function handleFiscalYearChange(newFyVal) {
  const fy = parseInt(newFyVal, 10);
  if (!fy) return;
  ensureYearInList(fy);
  state.selectedFiscalYear = fy;
  localStorage.setItem('sc_selected_fiscal_year', String(fy));

  // เลื่อนเดือนปัจจุบันไปที่ ต.ค. ของปีงบประมาณที่เลือก
  const months = getFiscalYearMonths(fy);
  state.currentYear = months[0].year;
  state.currentMonth = months[0].month;

  renderYearSelectors();
  renderAll();
}

function changeFiscalYear(delta) {
  const nextFy = (parseInt(state.selectedFiscalYear, 10) || 2570) + delta;
  ensureYearInList(nextFy);
  handleFiscalYearChange(nextFy);
  showToast(`เปลี่ยนเป็นปีงบประมาณ พ.ศ. ${nextFy} เรียบร้อยแล้ว`, 'info');
}

function addNextFiscalYear() {
  const maxYear = state.fiscalYears.length > 0 ? Math.max(...state.fiscalYears) : 2570;
  const newYear = maxYear + 1;
  ensureYearInList(newYear);
  handleFiscalYearChange(newYear);
  showToast(`เพิ่มปีงบประมาณ พ.ศ. ${newYear} พร้อมวันหยุดราชการอัตโนมัติเรียบร้อยแล้ว`, 'success');
}

function openHolidaysModal() {
  renderHolidaysModalContent();
  const modal = document.getElementById('holidaysModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeHolidaysModal() {
  const modal = document.getElementById('holidaysModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function renderHolidaysModalContent() {
  const fy = state.selectedFiscalYear || 2570;
  const titleEl = document.getElementById('holidaysModalTitle');
  const listEl = document.getElementById('holidaysModalList');
  const dateInput = document.getElementById('customHolidayDateInput');
  if (!listEl) return;

  if (titleEl) {
    titleEl.textContent = `วันหยุดประจำปีงบประมาณ ${fy} (ต.ค. ${fy - 1} – ก.ย. ${fy})`;
  }

  const fyMonths = getFiscalYearMonths(fy);
  if (dateInput && !dateInput.value) {
    dateInput.value = `${fyMonths[0].year}-10-01`;
  }

  // รวบรวมวันหยุดทั้งหมดใน 12 เดือนของปีงบประมาณที่เลือก
  const holidaysInFY = [];
  fyMonths.forEach(({ year, month }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const name = getThaiHoliday(dateStr);
      if (name) {
        const isCustom =
          state.customHolidays && Object.prototype.hasOwnProperty.call(state.customHolidays, dateStr);
        holidaysInFY.push({ dateStr, name, isCustom });
      }
    }
  });

  if (holidaysInFY.length === 0) {
    listEl.innerHTML = `<div class="py-8 text-center text-xs text-slate-400">ไม่มีรายการวันหยุดในปีนี้</div>`;
    return;
  }

  listEl.innerHTML = holidaysInFY
    .map(
      (h) => `
      <div class="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="px-2.5 py-0.5 rounded-lg bg-red-600 text-white font-display font-semibold text-xs shrink-0">
            ${formatFullThaiDate(h.dateStr)}
          </span>
          <span class="font-semibold text-slate-800 truncate">${escapeHtml(h.name)}</span>
          ${
            h.isCustom
              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 shrink-0">เพิ่ม/แก้ไขเอง</span>`
              : `<span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 shrink-0">อัตโนมัติ</span>`
          }
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onclick="prefillHolidayForm('${h.dateStr}', '${escapeHtml(h.name)}')"
            class="px-2 py-1 rounded-lg text-[11px] text-blue-600 hover:bg-blue-50 font-medium"
          >
            แก้ไข
          </button>
          <button
            type="button"
            onclick="removeHolidayOnDate('${h.dateStr}')"
            class="px-2 py-1 rounded-lg text-[11px] text-rose-600 hover:bg-rose-50 font-medium"
          >
            ลบ
          </button>
        </div>
      </div>
    `
    )
    .join('');
}

function prefillHolidayForm(dateStr, name) {
  const dateInput = document.getElementById('customHolidayDateInput');
  const nameInput = document.getElementById('customHolidayNameInput');
  if (dateInput) dateInput.value = dateStr;
  if (nameInput) {
    nameInput.value = name;
    nameInput.focus();
  }
}

function handleAddCustomHoliday(e) {
  e.preventDefault();
  const dateInput = document.getElementById('customHolidayDateInput');
  const nameInput = document.getElementById('customHolidayNameInput');
  const dateStr = dateInput?.value;
  const name = nameInput?.value.trim();
  if (!dateStr || !name) return;

  state.customHolidays[dateStr] = name;
  localStorage.setItem('sc_custom_holidays', JSON.stringify(state.customHolidays));

  // หากวันที่อยู่ในปีงบประมาณอื่น ให้เพิ่มปีนั้นเข้าตัวเลือกด้วยอัตโนมัติ
  const gy = parseInt(dateStr.slice(0, 4), 10);
  const gm = parseInt(dateStr.slice(5, 7), 10);
  const fyOfHoliday = gm >= 10 ? gy + 543 + 1 : gy + 543;
  ensureYearInList(fyOfHoliday);

  if (nameInput) nameInput.value = '';
  renderYearSelectors();
  renderHolidaysModalContent();
  renderAll();
  showToast(`บันทึกวันหยุด "${name}" (${formatFullThaiDate(dateStr)}) เรียบร้อยแล้ว`, 'success');
}

function removeHolidayOnDate(dateStr) {
  state.customHolidays[dateStr] = ''; // ค่าว่างใช้แทนการซ่อน/ลบวันหยุดในวันนั้น
  localStorage.setItem('sc_custom_holidays', JSON.stringify(state.customHolidays));
  renderHolidaysModalContent();
  renderAll();
  showToast(`ลบวันหยุดวันที่ ${formatFullThaiDate(dateStr)} แล้ว`, 'info');
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
    if (state.selectedDepartment !== 'all') {
      const evtDepts = getEventDepartments(evt);
      if (!evtDepts.includes(state.selectedDepartment)) {
        return false;
      }
    }
    if (state.onlySubmission && !isSubmissionTask(evt)) {
      return false;
    }
    if (state.selectedAcademicYear !== 'all' && String(evt.academicYear) !== String(state.selectedAcademicYear)) {
      return false;
    }
    if (state.searchQuery) {
      const deptNames = getEventDepartments(evt)
        .map((d) => DEPARTMENTS[d]?.name || '')
        .join(' ');
      const hay = `${evt.title} ${evt.location || ''} ${evt.description || ''} ${deptNames}`.toLowerCase();
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
  const fy = state.selectedFiscalYear || 2570;
  const fyMonths = getFiscalYearMonths(fy);

  const titleEl = document.getElementById('currentMonthYearTitle');
  if (isAllMonthsSplit) {
    titleEl.textContent = `ปีงบประมาณ ${fy} (ต.ค. ${fy - 1} – ก.ย. ${fy})`;
  } else {
    titleEl.textContent = `เดือน ${monthName} ${thaiYear}`;
  }

  // Update Print Header
  document.getElementById('printSubtitle').textContent = isAllMonthsSplit
    ? `ประจำปีงบประมาณ พ.ศ. ${fy} (ตุลาคม ${fy - 1} – กันยายน ${fy})`
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
  const fyEvents = filtered.filter((e) => fyMonths.some(({ year, month }) => isEventInMonth(e, year, month)));

  const activeEventsForCounter = isAllMonthsSplit ? fyEvents : monthEvents;
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

// แถบปุ่มลัดเลือกเดือนตามปีงบประมาณที่เลือก
function renderQuickMonthJumpBar(filteredEvents) {
  const bar = document.getElementById('monthQuickJumpBar');
  if (!bar) return;

  const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const fyMonths = getFiscalYearMonths(state.selectedFiscalYear);

  const buttonsHtml = fyMonths.map(({ year, month }) => {
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
      ? getFiscalYearMonths(state.selectedFiscalYear)
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

  // รวบรวมวันหยุดราชการประจำเดือนนี้ (คำนวณอัตโนมัติทุกปี + วันหยุดที่เพิ่มเอง)
  const monthHolidays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hName = getThaiHoliday(dateStr);
    if (hName) {
      monthHolidays.push({
        day: d,
        dateStr,
        dateLabel: `${d} ${shortMonthName} ${shortThaiYear}`,
        name: hName
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
    const holidayName = getThaiHoliday(dateStr);
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
        const firstDeptId = getEventDepartments(multiDayEventOnDay)[0];
        const deptColor = DEPARTMENTS[firstDeptId]?.dotClass || 'bg-blue-600';
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
            const deptIds = getEventDepartments(evt);
            const primaryDept = DEPARTMENTS[deptIds[0]] || DEPARTMENTS.academic;
            const isSub = isSubmissionTask(evt);
            const dateBadgeText = formatCompactThaiDateRange(evt.startDate, evt.endDate, year, month);

            const deptPillsHtml = deptIds
              .map((dId) => {
                const dObj = DEPARTMENTS[dId];
                if (!dObj) return '';
                return `
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-display font-medium ${dObj.pillClass}">
                    ${dObj.shortName}
                  </span>
                `;
              })
              .join('');

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
                    <span class="w-2 h-2 rounded-full ${isSub ? 'bg-rose-600' : primaryDept.dotClass} shrink-0"></span>
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

                <!-- ป้ายฝ่ายงานด้านขวา (รองรับหลายฝ่ายงาน) -->
                <div class="flex flex-wrap items-center justify-end gap-1.5 shrink-0 self-start sm:self-center pl-3.5 sm:pl-0">
                  ${deptPillsHtml}
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
  const holiday = getThaiHoliday(dateStr);
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
          const holidayName = getThaiHoliday(cell.dateStr);

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
              const evtDepts = getEventDepartments(evt);
              const dept = DEPARTMENTS[evtDepts[0]] || DEPARTMENTS.academic;
              const allDeptNames = evtDepts.map((k) => DEPARTMENTS[k]?.shortName || k).join(', ');
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
                : evtDepts
                    .map(
                      (k) =>
                        `<span class="w-1.5 h-1.5 rounded-full ${DEPARTMENTS[k]?.dotClass || dept.dotClass} shrink-0"></span>`
                    )
                    .join('');

              const dateRangeShort = isMultiDay
                ? ` (${formatDayNumber(evt.startDate)}–${formatDayNumber(evt.endDate)} ${formatShortThaiMonth(evt.endDate)})`
                : '';

              const multiDeptBadge =
                evtDepts.length > 1
                  ? `<span class="text-[9px] opacity-90 shrink-0 font-semibold">(${allDeptNames})</span>`
                  : '';

              return `
                <div style="grid-column: ${startCol + 1} / span ${spanCols};" class="px-1">
                  <button
                    type="button"
                    onclick="event.stopPropagation(); openDetailModal('${evt.id}')"
                    class="event-pill ${pillStyleClass} ${edgeClass}"
                    title="${isSub ? '[งานที่ต้องส่ง] ' : ''}${escapeHtml(evt.title)}${dateRangeShort} — ${allDeptNames}"
                  >
                    ${submissionPrefix}
                    <span class="truncate">${escapeHtml(evt.title)}${dateRangeShort}</span>
                    ${multiDeptBadge}
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
      const evtDepts = getEventDepartments(evt);
      const deptBadgesHtml = evtDepts
        .map((deptKey) => {
          const d = DEPARTMENTS[deptKey] || DEPARTMENTS.academic;
          return `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${d.pillClass}">
              <span class="w-1.5 h-1.5 rounded-full ${d.dotClass}"></span>
              ${d.name}
            </span>
          `;
        })
        .join('');
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
              <div class="flex flex-wrap items-center gap-1.5 mb-1">
                ${deptBadgesHtml}
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

// ================= AUTHENTICATION (รหัสผ่านเดียวจัดการได้ทุกฝ่ายงาน) =================
function canUserManageEvent() {
  return Boolean(state.currentUser);
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
        <span>เข้าสู่ระบบแก้ไข</span>
      </button>
    `;
  } else {
    btnAdd.classList.remove('hidden');
    btnAdd.classList.add('flex');
    banner.classList.remove('hidden');

    bannerText.innerHTML = `สถานะ: <strong>โหมดแก้ไขข้อมูลปฏิทิน</strong> — สามารถเพิ่ม/แก้ไขกิจกรรมและเลือกฝ่ายงานได้ทุกฝ่าย`;

    container.innerHTML = `
      <div class="flex items-center gap-1.5 bg-blue-50 border border-blue-200 pl-3 pr-1.5 py-1.5 rounded-xl">
        <div class="text-left text-xs leading-tight">
          <div class="font-display font-semibold text-blue-950 flex items-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>โหมดแก้ไขข้อมูล</span>
          </div>
          <div class="text-[10px] text-blue-700 hidden sm:block">จัดการได้ทุกฝ่ายงาน</div>
        </div>
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
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('loginModal').classList.add('flex');
  setTimeout(() => {
    document.getElementById('loginPasscode')?.focus();
  }, 50);
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('loginModal').classList.remove('flex');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const pin = document.getElementById('loginPasscode').value.trim();
  const errEl = document.getElementById('loginErrorMsg');

  if (!SHARED_PINS.includes(pin)) {
    errEl.textContent = 'รหัสผ่านไม่ถูกต้อง (ใช้รหัส 1111)';
    errEl.classList.remove('hidden');
    return;
  }

  state.currentUser = { role: 'admin' };
  localStorage.setItem('sc_current_user', JSON.stringify(state.currentUser));
  closeLoginModal();
  renderUserStatus();
  renderAll();
  showToast('เข้าสู่ระบบแก้ไขข้อมูลเรียบร้อยแล้ว', 'success');
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem('sc_current_user');
  renderUserStatus();
  renderAll();
  showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
}

// ================= MULTI-DEPARTMENT CHECKBOXES =================
function renderEventDepartmentCheckboxes(selectedDepts = ['central']) {
  const container = document.getElementById('eventDeptCheckboxesContainer');
  if (!container) return;

  const selectedSet = new Set(Array.isArray(selectedDepts) && selectedDepts.length ? selectedDepts : ['central']);

  container.innerHTML = Object.entries(DEPARTMENTS)
    .map(([deptKey, dept]) => {
      const realId = dept.id || deptKey;
      const checked = selectedSet.has(realId);
      return `
        <label class="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition select-none ${
          checked
            ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold shadow-2xs'
            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
        }">
          <input
            type="checkbox"
            name="eventDeptCheckbox"
            value="${realId}"
            data-dept-id="${realId}"
            ${checked ? 'checked' : ''}
            onchange="updateDeptCheckboxLabelStyles()"
            class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="w-2 h-2 rounded-full ${dept.dotClass} shrink-0"></span>
          <span class="text-xs font-display truncate">${dept.name}</span>
        </label>
      `;
    })
    .join('');
}

function updateDeptCheckboxLabelStyles() {
  const container = document.getElementById('eventDeptCheckboxesContainer');
  if (!container) return;
  const inputs = container.querySelectorAll('input[name="eventDeptCheckbox"]');
  inputs.forEach((input) => {
    const label = input.closest('label');
    if (!label) return;
    if (input.checked) {
      label.className =
        'flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition select-none bg-blue-50 border-blue-400 text-blue-950 font-semibold shadow-2xs';
    } else {
      label.className =
        'flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition select-none bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100';
    }
  });
}

function selectAllEventDepartments() {
  const container = document.getElementById('eventDeptCheckboxesContainer');
  if (!container) return;
  const inputs = Array.from(container.querySelectorAll('input[name="eventDeptCheckbox"]'));
  const allChecked = inputs.every((i) => i.checked);
  inputs.forEach((i, idx) => {
    // หากเลือกครบทุกฝ่ายอยู่แล้ว กดซ้ำให้เหลือเฉพาะส่วนกลาง
    i.checked = allChecked ? idx === 0 : true;
  });
  updateDeptCheckboxLabelStyles();
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

  renderYearSelectors();

  const modal = document.getElementById('eventFormModal');
  const titleEl = document.getElementById('eventModalTitle');
  const isSubmissionCheckbox = document.getElementById('eventIsSubmissionInput');

  if (editEventId) {
    const evt = state.events.find((x) => x.id === editEventId);
    if (!evt) return;

    titleEl.textContent = 'แก้ไขข้อมูลรายการในปฏิทิน';
    document.getElementById('eventIdInput').value = evt.id;
    document.getElementById('eventTitleInput').value = evt.title;
    renderEventDepartmentCheckboxes(getEventDepartments(evt));
    document.getElementById('eventAcademicYearInput').value = evt.academicYear || String(state.selectedFiscalYear);
    document.getElementById('eventStartDateInput').value = evt.startDate;
    document.getElementById('eventEndDateInput').value = evt.endDate;
    document.getElementById('eventTimeInput').value = evt.time || '';
    parseEventTimeIntoInputs(evt.time || '');
    document.getElementById('eventLocationInput').value = evt.location || '';
    document.getElementById('eventDescInput').value = evt.description || '';
    isSubmissionCheckbox.checked = isSubmissionTask(evt);
  } else {
    titleEl.textContent = 'เพิ่มงาน / กิจกรรมโรงเรียนพัฒนานิคม';
    document.getElementById('eventIdInput').value = '';
    document.getElementById('eventTitleInput').value = '';
    isSubmissionCheckbox.checked = false;

    const todayDefault = defaultDate || formatDateYMD(new Date(state.currentYear, state.currentMonth, 1));
    document.getElementById('eventStartDateInput').value = todayDefault;
    document.getElementById('eventEndDateInput').value = todayDefault;
    document.getElementById('eventAcademicYearInput').value =
      state.selectedAcademicYear === 'all' ? String(state.selectedFiscalYear) : state.selectedAcademicYear;
    document.getElementById('eventTimeInput').value = '';
    parseEventTimeIntoInputs('ตลอดทั้งวัน');
    document.getElementById('eventLocationInput').value = '';
    document.getElementById('eventDescInput').value = '';

    const defaultDept = state.selectedDepartment !== 'all' ? state.selectedDepartment : 'central';
    renderEventDepartmentCheckboxes([defaultDept]);
  }

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

  const checkedInputs = Array.from(
    document.querySelectorAll('#eventDeptCheckboxesContainer input[name="eventDeptCheckbox"]:checked')
  );
  const selectedDepts = checkedInputs
    .map((i) => {
      const rawVal = i.getAttribute('data-dept-id') || i.value;
      if (rawVal && DEPARTMENTS[rawVal]) return rawVal;
      const labelText = i.closest('label')?.textContent?.trim() || '';
      return resolveDeptId(labelText);
    })
    .filter(Boolean);

  if (selectedDepts.length === 0) {
    showToast('กรุณาเลือกฝ่ายงานที่รับผิดชอบอย่างน้อย 1 ฝ่าย', 'error');
    return;
  }

  const isSubmission = document.getElementById('eventIsSubmissionInput').checked;
  const formattedTime = buildEventTimeFromInputs(isSubmission);
  const deptShortNames = selectedDepts.map((k) => DEPARTMENTS[k]?.shortName || k).join(', ');

  const payload = {
    id: existingId || `evt-${Date.now()}`,
    title: document.getElementById('eventTitleInput').value.trim(),
    department: selectedDepts.join(','),
    departments: selectedDepts,
    academicYear: document.getElementById('eventAcademicYearInput').value,
    startDate,
    endDate,
    time: formattedTime,
    location: document.getElementById('eventLocationInput').value.trim(),
    description: document.getElementById('eventDescInput').value.trim(),
    isSubmission,
    updatedBy: deptShortNames
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

  const evtDepts = getEventDepartments(evt);
  const badgeContainer = document.getElementById('detailDeptBadge');
  badgeContainer.className = 'flex flex-wrap items-center gap-1.5';
  badgeContainer.innerHTML = evtDepts
    .map((deptKey) => {
      const dept = DEPARTMENTS[deptKey] || DEPARTMENTS.academic;
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${dept.pillClass}">
        <span class="w-2 h-2 rounded-full ${dept.dotClass}"></span> ${dept.name}
      </span>`;
    })
    .join('');

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
  document.getElementById('detailUpdatedBy').textContent = '';

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
    hint.textContent = 'คุณสามารถแก้ไข/ลบรายการนี้ได้';
  } else {
    btnEdit.classList.add('hidden');
    btnEdit.classList.remove('inline-flex');
    btnDelete.classList.add('hidden');
    btnDelete.classList.remove('inline-flex');
    hint.textContent = 'เข้าสู่ระบบด้วยรหัสผ่านเพื่อแก้ไข';
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
    'ฝ่ายงานที่รับผิดชอบ',
    'ปีการศึกษา',
    'วันที่เริ่มต้น/กำหนดส่ง',
    'วันที่สิ้นสุด',
    'เวลา',
    'สถานที่/ช่องทางส่ง',
    'รายละเอียด'
  ];

  const rows = filtered.map((e) => [
    e.id,
    isSubmissionTask(e) ? 'งานที่ต้องส่ง' : 'กิจกรรม',
    e.title,
    getEventDepartments(e)
      .map((k) => DEPARTMENTS[k]?.name || k)
      .join(', '),
    e.academicYear,
    e.startDate,
    e.endDate,
    e.time || '',
    e.location || '',
    (e.description || '').replace(/\n/g, ' ')
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
