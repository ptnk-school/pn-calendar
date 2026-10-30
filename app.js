/**
 * ระบบปฏิทินปฏิบัติงาน โรงเรียนพัฒนานิคม (School Activity Calendar)
 * รองรับการแบ่งสีตามกลุ่มงาน, ทำเครื่องหมายเฉพาะ "งานที่ต้องส่ง" (📌 ส่งงาน),
 * ระบบล็อกอินแยกสิทธิ์สารสนเทศแต่ละกลุ่มงาน, ค้นหา/กรองตามปีการศึกษา,
 * ส่งออก CSV/PDF, เชื่อมต่อ Google Sheets และติดตั้งเป็นแอปบนหน้าจอโฮม (PWA)
 */

// 1. ข้อมูลกลุ่มงานของโรงเรียนและโทนสีประจำกลุ่มงาน
const DEPARTMENTS = {
  academic: {
    id: 'academic',
    name: 'กลุ่มบริหารวิชาการ',
    shortName: 'วิชาการ',
    pin: '1111',
    dotClass: 'bg-blue-600',
    pillClass: 'bg-blue-50 text-blue-800 border border-blue-200',
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

// 3. State ของแอปพลิเคชัน
let state = {
  events: [],
  currentYear: new Date().getFullYear(), // ค.ศ.
  currentMonth: new Date().getMonth(),   // 0 - 11
  selectedDepartment: 'all',
  onlySubmission: false, // กรองเฉพาะงานที่ต้องส่ง
  selectedAcademicYear: 'all',
  searchQuery: '',
  viewMode: 'month', // 'month' | 'list'
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
    } catch (e) {
      state.currentUser = null;
    }
  }

  const savedEvents = localStorage.getItem('sc_events_data_fy2570');
  if (savedEvents) {
    try {
      state.events = JSON.parse(savedEvents);
    } catch (e) {
      state.events = [...DEFAULT_SAMPLE_EVENTS];
    }
  } else {
    state.events = [...DEFAULT_SAMPLE_EVENTS];
    saveEventsToLocal();
  }

  updateHeaderSchoolInfo();

  if (state.scriptUrl) {
    refreshFromGoogleSheets(true);
  }
}

function saveEventsToLocal() {
  localStorage.setItem('sc_events_data_fy2570', JSON.stringify(state.events));
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

function changeMonth(delta) {
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
  renderAll();
}

function switchViewMode(mode) {
  state.viewMode = mode;
  const tabMonth = document.getElementById('tabViewMonth');
  const tabList = document.getElementById('tabViewList');
  const secMonth = document.getElementById('monthViewSection');
  const secList = document.getElementById('listViewSection');

  if (mode === 'month') {
    tabMonth.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-sm transition';
    tabList.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
    secMonth.classList.remove('hidden');
    secList.classList.add('hidden');
  } else {
    tabList.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-sm transition';
    tabMonth.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition';
    secList.classList.remove('hidden');
    secMonth.classList.add('hidden');
  }
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
  document.getElementById('currentMonthYearTitle').textContent = `${monthName} ${thaiYear}`;

  // Update Print Header
  document.getElementById('printSubtitle').textContent = `ประจำเดือน ${monthName} พ.ศ. ${thaiYear}`;
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
  const submissionEventsCount = monthEvents.filter((e) => isSubmissionTask(e)).length;

  document.getElementById('eventCountBadge').textContent = `รวม ${monthEvents.length} รายการ`;
  document.getElementById('submissionCountBadge').textContent = `📌 งานที่ต้องส่ง ${submissionEventsCount} งาน`;

  renderMonthGrid(filtered);
  renderListView(monthEvents);

  if (window.lucide) {
    lucide.createIcons();
  }
}

function renderMonthGrid(filteredEvents) {
  const grid = document.getElementById('calendarGrid');
  const year = state.currentYear;
  const month = state.currentMonth;

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const todayStr = formatDateYMD(new Date());

  let cellsHtml = '';

  // Previous month padding days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    cellsHtml += `
      <div class="calendar-cell bg-slate-50/60 p-2 text-slate-300 select-none">
        <div class="text-xs font-medium">${dayNum}</div>
      </div>
    `;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    // เรียงให้งานที่ต้องส่ง (isSubmission) ขึ้นก่อนในวันเดียวกัน เพื่อให้เห็นเด่นชัด
    const dayEvents = filteredEvents
      .filter((evt) => evt.startDate <= dateStr && evt.endDate >= dateStr)
      .sort((a, b) => {
        const subA = isSubmissionTask(a) ? 0 : 1;
        const subB = isSubmissionTask(b) ? 0 : 1;
        if (subA !== subB) return subA - subB;
        return a.startDate.localeCompare(b.startDate);
      });

    const eventsHtml = dayEvents
      .map((evt) => {
        const dept = DEPARTMENTS[evt.department] || DEPARTMENTS.academic;
        const isMultiDay = evt.startDate !== evt.endDate;
        const isSub = isSubmissionTask(evt);

        // ทำเครื่องหมายเฉพาะงานที่ต้องส่ง (📌 ส่งงาน + ขอบซ้ายสีแดงเข้ม) ส่วนกิจกรรมปกติแสดงแถบสีกลุ่มงานตามปกติ
        const submissionPrefix = isSub
          ? `<span class="submission-tag">📌 ส่งงาน</span>`
          : `<span class="w-1.5 h-1.5 rounded-full ${dept.dotClass} shrink-0"></span>`;

        return `
          <button 
            type="button"
            onclick="event.stopPropagation(); openDetailModal('${evt.id}')" 
            class="event-pill ${dept.pillClass} ${isSub ? 'submission-pill' : ''}"
            title="${isSub ? '[งานที่ต้องส่ง] ' : ''}${escapeHtml(evt.title)} (${dept.shortName})"
          >
            ${submissionPrefix}
            <span class="truncate">${escapeHtml(evt.title)}${isMultiDay ? ' ↔' : ''}</span>
          </button>
        `;
      })
      .join('');

    cellsHtml += `
      <div 
        onclick="handleCalendarCellClick('${dateStr}')" 
        class="calendar-cell p-1.5 sm:p-2 flex flex-col gap-1 ${
          isToday ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50/80'
        } ${state.currentUser ? 'cursor-pointer' : ''}"
      >
        <div class="flex items-center justify-between mb-0.5">
          <span class="text-xs font-display font-semibold ${
            isToday
              ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs'
              : 'text-slate-700'
          }">
            ${day}
          </span>
          ${
            state.currentUser
              ? `<span class="opacity-0 hover:opacity-100 text-[10px] text-blue-600 font-medium no-print">+ เพิ่ม</span>`
              : ''
          }
        </div>
        <div class="space-y-1 flex-1">
          ${eventsHtml}
        </div>
      </div>
    `;
  }

  // Next month padding days
  const totalCellsSoFar = firstDayOfWeek + daysInMonth;
  const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    cellsHtml += `
      <div class="calendar-cell bg-slate-50/60 p-2 text-slate-300 select-none">
        <div class="text-xs font-medium">${i}</div>
      </div>
    `;
  }

  grid.innerHTML = cellsHtml;
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

// ================= AUTHENTICATION & PERMISSIONS =================
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

    bannerText.innerHTML = `เข้าสู่ระบบในนาม: <strong>${escapeHtml(state.currentUser.staffName)}</strong> — สิทธิ์อัปเดตงานของ <strong>${roleName}</strong>`;

    container.innerHTML = `
      <div class="flex items-center gap-2 bg-blue-50 border border-blue-200 pl-3 pr-2 py-1.5 rounded-xl">
        <div class="text-xs leading-tight">
          <div class="font-display font-semibold text-blue-950">${escapeHtml(state.currentUser.staffName)}</div>
          <div class="text-[10px] text-blue-700 hidden sm:block">${roleName}</div>
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
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('loginModal').classList.remove('flex');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const role = document.getElementById('loginDeptSelect').value;
  const staffName = document.getElementById('loginStaffName').value.trim();
  const pin = document.getElementById('loginPasscode').value.trim();
  const errEl = document.getElementById('loginErrorMsg');

  const expectedPin = role === 'admin' ? ADMIN_PIN : DEPARTMENTS[role]?.pin;

  if (pin !== expectedPin) {
    errEl.textContent = 'รหัสผ่านประจำกลุ่มงานไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    errEl.classList.remove('hidden');
    return;
  }

  state.currentUser = { role, staffName };
  localStorage.setItem('sc_current_user', JSON.stringify(state.currentUser));
  closeLoginModal();
  renderUserStatus();
  renderAll();
  showToast(`ยินดีต้อนรับ ${staffName}`, 'success');
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem('sc_current_user');
  renderUserStatus();
  renderAll();
  showToast('ออกจากระบบสารสนเทศเรียบร้อยแล้ว', 'info');
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
      state.selectedAcademicYear === 'all' ? '2569' : state.selectedAcademicYear;
    document.getElementById('eventTimeInput').value = '';
    document.getElementById('eventLocationInput').value = '';
    document.getElementById('eventDescInput').value = '';

    if (state.currentUser.role !== 'admin') {
      deptSelect.value = state.currentUser.role;
    } else {
      deptSelect.value = state.selectedDepartment !== 'all' ? state.selectedDepartment : 'academic';
    }
  }

  deptSelect.disabled = state.currentUser.role !== 'admin';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
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

  const payload = {
    id: existingId || `evt-${Date.now()}`,
    title: document.getElementById('eventTitleInput').value.trim(),
    department,
    academicYear: document.getElementById('eventAcademicYearInput').value,
    startDate,
    endDate,
    time: document.getElementById('eventTimeInput').value.trim(),
    location: document.getElementById('eventLocationInput').value.trim(),
    description: document.getElementById('eventDescInput').value.trim(),
    isSubmission,
    updatedBy: `${state.currentUser.staffName} (${DEPARTMENTS[department]?.shortName || 'ผู้ดูแล'})`
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
