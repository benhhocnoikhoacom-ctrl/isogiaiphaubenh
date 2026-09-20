const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

function getDb() {
  const env = fs.readFileSync('.env', 'utf-8');
  const line = env.split('\n').find(l => l.startsWith('GOOGLE_CREDENTIALS_BASE64='));
  const b64 = line.split('=')[1].trim();
  const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));

  const app = !getApps().length ? initializeApp({ credential: cert(creds) }) : getApps()[0];
  return getFirestore(app);
}

const USERS = [
  {
    id: "U001",
    fullName: "Đào Thị Nguyệt",
    role: "ADMIN",
    title: "Trưởng khoa",
    email: "nguyethmu@gmail.com",
    phone: "0382337010",
    active: true
  },
  {
    id: "U000",
    fullName: "Lương Đình Trung",
    role: "ADMIN",
    title: "Bác sĩ / Quản trị hệ thống",
    email: "bsluongdinhtrung@gmail.com",
    phone: "0900000000",
    active: true
  },
  {
    id: "U002",
    fullName: "Lê Tuấn Anh",
    role: "USER",
    title: "Bác sĩ",
    email: "drtuananh189@gmail.com",
    phone: "0987372288",
    active: true
  },
  {
    id: "U003",
    fullName: "Nguyễn Thị Ngân",
    role: "USER",
    title: "Bác sĩ",
    email: "nguyenthingan.bsdk@gmail.com",
    phone: "0369239809",
    active: true
  },
  {
    id: "U004",
    fullName: "Lương Thị Thùy Dung",
    role: "USER",
    title: "KTV",
    email: "thuydung71@gmail.com",
    phone: "0916787186",
    active: true
  },
  {
    id: "U005",
    fullName: "Nguyễn Thị Thu Hương",
    role: "USER",
    title: "KTV",
    email: "funny.monkeyhn345@gmail.com",
    phone: "0936099158",
    active: true
  },
  {
    id: "U006",
    fullName: "Trần Thị Vân",
    role: "USER",
    title: "KTV",
    email: "tranvanbvdg@gmail.com",
    phone: "0399572155",
    active: true
  },
  {
    id: "U007",
    fullName: "Dương Văn Quang",
    role: "USER",
    title: "KTV",
    email: "quangvictor@yahoo.com",
    phone: "0835028886",
    active: true
  },
  {
    id: "U008",
    fullName: "Lại Hải Hà",
    role: "USER",
    title: "KTV",
    email: "laihaiha92@gmail.com",
    phone: "0988468514",
    active: true
  }
];

const WORK_ITEMS = [
  {
    itemId: "W001",
    itemCode: "XN.QL.01",
    itemName: "Quản lý trang thiết bị",
    assigneeName: "Dương Văn Quang",
    assigneeEmail: "quangvictor@yahoo.com",
    frequency: "Periodic",
    dueRule: "Chốt rà soát trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Theo dõi tình trạng hồ sơ thiết bị/bảo trì/hiệu chuẩn ở cấp tổng hợp, không nhập từng máy.",
    externalLink: "https://quanlithietbi.bstrung.vn",
    active: true
  },
  {
    itemId: "W002",
    itemCode: "XN.QL.02",
    itemName: "Kiểm soát sự không phù hợp",
    assigneeName: "Nguyễn Thị Thu Hương",
    assigneeEmail: "funny.monkeyhn345@gmail.com",
    frequency: "Event",
    dueRule: "Tạo đầu việc ngay trong ngày phát sinh; cập nhật xử lý trong 24 giờ đầu",
    reminderDays: 0,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Trưởng khoa cần nhìn được sự cố đang mở/chưa đóng.",
    active: true
  },
  {
    itemId: "W003",
    itemCode: "XN.QL.03",
    itemName: "Hành động khắc phục (CAPA)",
    assigneeName: "Nguyễn Thị Thu Hương",
    assigneeEmail: "funny.monkeyhn345@gmail.com",
    frequency: "Event",
    dueRule: "Hạn do người tạo/Trưởng khoa đặt; mặc định 14 ngày sau khi mở CAPA",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Cho phép gia hạn có lý do; lưu lịch sử thay đổi hạn.",
    active: true
  },
  {
    itemId: "W004",
    itemCode: "XN.QL.04",
    itemName: "Xem xét của lãnh đạo",
    assigneeName: "Đào Thị Nguyệt",
    assigneeEmail: "nguyethmu@gmail.com",
    frequency: "Annual",
    dueRule: "Hoàn thành trước 30/11 hằng năm",
    reminderDays: 14,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Nên cấu hình được ngày cố định theo kế hoạch năm của bệnh viện.",
    active: true
  },
  {
    itemId: "W005",
    itemCode: "XN.QL.05",
    itemName: "Đào tạo nhân viên",
    assigneeName: "Lương Thị Thùy Dung",
    assigneeEmail: "thuydung71@gmail.com",
    frequency: "Periodic",
    dueRule: "Chốt cập nhật kế hoạch/minh chứng trước ngày 05 của tháng đầu quý sau",
    reminderDays: 5,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Sự kiện đào tạo phát sinh vẫn có thể ghi bổ sung.",
    active: true
  },
  {
    itemId: "W006",
    itemCode: "XN.QL.06",
    itemName: "Đánh giá tay nghề / năng lực",
    assigneeName: "Lương Thị Thùy Dung",
    assigneeEmail: "thuydung71@gmail.com",
    frequency: "Annual",
    dueRule: "Hoàn thành trước 15/12 hằng năm",
    reminderDays: 14,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Nếu khoa đánh giá theo ngày vào làm thì IT cần hỗ trợ hạn riêng theo nhân viên; MVP có thể dùng 1 hạn chung.",
    active: true
  },
  {
    itemId: "W007",
    itemCode: "XN.QL.07",
    itemName: "Xem xét, thỏa thuận dịch vụ",
    assigneeName: "Lại Hải Hà",
    assigneeEmail: "laihaiha92@gmail.com",
    frequency: "Mixed",
    dueRule: "Rà soát định kỳ trước 30/11; phát sinh hợp đồng mới thì theo sự việc",
    reminderDays: 7,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "MVP chỉ theo dõi đã rà soát/chưa rà soát.",
    active: true
  },
  {
    itemId: "W008",
    itemCode: "XN.QL.08",
    itemName: "Lựa chọn và đánh giá nhà cung cấp",
    assigneeName: "Dương Văn Quang",
    assigneeEmail: "quangvictor@yahoo.com",
    frequency: "Annual",
    dueRule: "Hoàn thành trước 30/11 hằng năm",
    reminderDays: 14,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Có thể mở đầu việc phát sinh khi có nhà cung cấp mới.",
    active: true
  },
  {
    itemId: "W009",
    itemCode: "XN.QL.09",
    itemName: "Giải quyết khiếu nại khách hàng",
    assigneeName: "Trần Thị Vân",
    assigneeEmail: "tranvanbvdg@gmail.com",
    frequency: "Event",
    dueRule: "Tiếp nhận trong ngày; Trưởng khoa đặt hạn xử lý cho từng vụ việc",
    reminderDays: 0,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Không nên cố định 1 hạn cho mọi khiếu nại.",
    active: true
  },
  {
    itemId: "W010",
    itemCode: "XN.QL.10",
    itemName: "Kiểm soát môi trường xét nghiệm",
    assigneeName: "Trần Thị Vân",
    assigneeEmail: "tranvanbvdg@gmail.com",
    frequency: "Daily",
    dueRule: "Xác nhận đầu mục hoàn thành trước 09:00 mỗi ngày làm việc",
    reminderDays: 0,
    evidenceRequired: false,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Chỉ xác nhận 'đã kiểm tra môi trường'; không quản lý từng nhiệt ẩm kế trong MVP.",
    active: true
  },
  {
    itemId: "W011",
    itemCode: "XN.QL.12",
    itemName: "Quản lý thông tin phòng xét nghiệm",
    assigneeName: "Nguyễn Thị Thu Hương",
    assigneeEmail: "funny.monkeyhn345@gmail.com",
    frequency: "Periodic",
    dueRule: "Rà soát/chốt trước ngày 05 của tháng đầu quý sau",
    reminderDays: 5,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Theo dõi ở mức hồ sơ/chính sách, không thay thế LIS/HIS.",
    active: true
  },
  {
    itemId: "W012",
    itemCode: "XN.QL.18",
    itemName: "Ngoại kiểm",
    assigneeName: "Lê Tuấn Anh",
    assigneeEmail: "drtuananh189@gmail.com",
    frequency: "Event",
    dueRule: "Hạn theo chương trình ngoại kiểm; nhập Due_Date cho từng đợt",
    reminderDays: 5,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "IT cho phép tạo task theo từng đợt, không hard-code lịch.",
    active: true
  },
  {
    itemId: "W013",
    itemCode: "XN.QL.19",
    itemName: "Quản lý sinh phẩm, vật tư, hóa chất",
    assigneeName: "Dương Văn Quang",
    assigneeEmail: "quangvictor@yahoo.com",
    frequency: "Periodic",
    dueRule: "Chốt rà soát trước ngày 03 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Tập trung trạng thái hồ sơ, hạn dùng/tồn kho chi tiết vẫn ở sổ/phần mềm hiện hành.",
    active: true
  },
  {
    itemId: "W014",
    itemCode: "XN.QL.20",
    itemName: "Đảm bảo tính khách quan",
    assigneeName: "Lê Tuấn Anh",
    assigneeEmail: "drtuananh189@gmail.com",
    frequency: "Mixed",
    dueRule: "Rà soát trước 30/11; cập nhật ngay khi có xung đột lợi ích",
    reminderDays: 14,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Trung bình",
    operationNote: "Sự việc xung đột lợi ích cần được đẩy lên Trưởng khoa.",
    active: true
  },
  {
    itemId: "W015",
    itemCode: "XN.QL.22",
    itemName: "Bảo mật thông tin",
    assigneeName: "Lê Tuấn Anh",
    assigneeEmail: "drtuananh189@gmail.com",
    frequency: "Mixed",
    dueRule: "Rà soát trước 30/11; sự cố bảo mật tạo task ngay trong ngày",
    reminderDays: 14,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Sự cố bảo mật nên được ưu tiên đỏ.",
    active: true
  },
  {
    itemId: "W016",
    itemCode: "XN.QL.24",
    itemName: "Quản lý rủi ro",
    assigneeName: "Trần Thị Vân",
    assigneeEmail: "tranvanbvdg@gmail.com",
    frequency: "Periodic",
    dueRule: "Chốt rà soát rủi ro trước ngày 05 của tháng đầu quý sau",
    reminderDays: 7,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Cho phép ghi chú rủi ro mới và hành động xử lý.",
    active: true
  },
  {
    itemId: "W017",
    itemCode: "XN.QL.25",
    itemName: "Cải tiến liên tục",
    assigneeName: "Lại Hải Hà",
    assigneeEmail: "laihaiha92@gmail.com",
    frequency: "Periodic",
    dueRule: "Chốt tiến độ cải tiến trước ngày 10 của tháng đầu quý sau",
    reminderDays: 7,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Trung bình",
    operationNote: "Nên có ghi chú kết quả/hiệu quả cải tiến.",
    active: true
  },
  {
    itemId: "W018",
    itemCode: "XN.QL.26",
    itemName: "Khảo sát sự hài lòng khách hàng",
    assigneeName: "Lê Tuấn Anh",
    assigneeEmail: "drtuananh189@gmail.com",
    frequency: "Periodic",
    dueRule: "Tổng hợp trước ngày 10 của tháng đầu quý sau",
    reminderDays: 7,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Nếu bệnh viện quy định 6 tháng/năm thì đổi Frequency trong Admin.",
    active: true
  },
  {
    itemId: "W019",
    itemCode: "XN.QL.27",
    itemName: "Quản lý hồ sơ",
    assigneeName: "Lại Hải Hà",
    assigneeEmail: "laihaiha92@gmail.com",
    frequency: "Periodic",
    dueRule: "Rà soát tình trạng hồ sơ trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: false,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Chỉ theo dõi tình trạng đầy đủ/thiếu, không số hóa toàn bộ hồ sơ.",
    active: true
  },
  {
    itemId: "W020",
    itemCode: "XN.QL.28",
    itemName: "Đánh giá nội bộ",
    assigneeName: "Nguyễn Thị Ngân",
    assigneeEmail: "nguyenthingan.bsdk@gmail.com",
    frequency: "Annual",
    dueRule: "Hoàn thành trước 31/10 hằng năm",
    reminderDays: 14,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Ngày cụ thể nên thay đổi được theo kế hoạch đánh giá năm.",
    active: true
  },
  {
    itemId: "W021",
    itemCode: "XN.QL.29",
    itemName: "Theo dõi và đánh giá bộ chỉ số chất lượng",
    assigneeName: "Lại Hải Hà",
    assigneeEmail: "laihaiha92@gmail.com",
    frequency: "Periodic",
    dueRule: "Chốt số liệu trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Đây nên là đầu việc xuất hiện nổi bật trên Dashboard hàng tháng.",
    active: true
  },
  {
    itemId: "W022",
    itemCode: "XN.QL.30",
    itemName: "Quản lý nhân sự",
    assigneeName: "Lương Thị Thùy Dung",
    assigneeEmail: "thuydung71@gmail.com",
    frequency: "Mixed",
    dueRule: "Rà soát cập nhật trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Nhân sự mới/nghỉ/đổi vị trí cập nhật ngay khi phát sinh.",
    active: true
  },
  {
    itemId: "W023",
    itemCode: "XN.QL.31",
    itemName: "Lựa chọn và chuyển gửi mẫu ngoại viện",
    assigneeName: "Đào Thị Nguyệt",
    assigneeEmail: "nguyethmu@gmail.com",
    frequency: "Mixed",
    dueRule: "Sự việc theo hạn từng ca; rà soát tổng hợp trước ngày 05 của tháng đầu quý sau",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Trung bình",
    operationNote: "Người phụ trách đã chốt: Đào Thị Nguyệt.",
    active: true
  },
  {
    itemId: "W024",
    itemCode: "HT.QL.01",
    itemName: "Kiểm soát tài liệu hệ thống QLCL",
    assigneeName: "Lại Hải Hà",
    assigneeEmail: "laihaiha92@gmail.com",
    frequency: "Mixed",
    dueRule: "Rà soát danh mục hiệu lực trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Tài liệu mới/sửa đổi cập nhật ngay khi ban hành.",
    active: true
  },
  {
    itemId: "W025",
    itemCode: "GB.QL.02",
    itemName: "Tiếp nhận mẫu Giải phẫu bệnh",
    assigneeName: "Lương Thị Thùy Dung",
    assigneeEmail: "thuydung71@gmail.com",
    frequency: "Daily",
    dueRule: "Xác nhận kiểm soát đầu mục trước 16:30 ngày làm việc",
    reminderDays: 0,
    evidenceRequired: false,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "MVP chỉ ghi nhận kiểm soát đầu mục, không nhập từng mẫu.",
    active: true
  },
  {
    itemId: "W026",
    itemCode: "GB.QL.04",
    itemName: "Báo cáo kết quả Giải phẫu bệnh",
    assigneeName: "Lương Thị Thùy Dung",
    assigneeEmail: "thuydung71@gmail.com",
    frequency: "Periodic",
    dueRule: "Rà soát tình trạng/TAT trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Không thay thế phần mềm trả kết quả.",
    active: true
  },
  {
    itemId: "W027",
    itemCode: "GB.QL.05",
    itemName: "Lưu mẫu và xử lý mẫu hết thời gian lưu",
    assigneeName: "Lương Thị Thùy Dung",
    assigneeEmail: "thuydung71@gmail.com",
    frequency: "Periodic",
    dueRule: "Rà soát trước ngày 10 của tháng kế tiếp",
    reminderDays: 5,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Có thể dùng link tới biên bản/hồ sơ xử lý.",
    active: true
  },
  {
    itemId: "W028",
    itemCode: "GB.QL.06-07",
    itemName: "Lưu lam/block và mượn trả",
    assigneeName: "Lương Thị Thùy Dung",
    assigneeEmail: "thuydung71@gmail.com",
    frequency: "Periodic",
    dueRule: "Rà soát trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: false,
    approvalRequired: false,
    priority: "Trung bình",
    operationNote: "Không quản lý từng lam/block trong MVP.",
    active: true
  },
  {
    itemId: "W029",
    itemCode: "GB.QL.08",
    itemName: "Nội kiểm",
    assigneeName: "Lê Tuấn Anh",
    assigneeEmail: "drtuananh189@gmail.com",
    frequency: "Periodic",
    dueRule: "Chốt tổng hợp nội kiểm trước ngày 05 của tháng kế tiếp",
    reminderDays: 3,
    evidenceRequired: true,
    approvalRequired: false,
    priority: "Cao",
    operationNote: "Kết quả chi tiết vẫn lưu theo hồ sơ nội kiểm hiện hành.",
    externalLink: "https://iso-gpb-duc-giang.vercel.app/",
    active: true
  },
  {
    itemId: "W030",
    itemCode: "GB.QL.09",
    itemName: "Xác nhận giá trị sử dụng / phê duyệt phương pháp",
    assigneeName: "Nguyễn Thị Ngân",
    assigneeEmail: "nguyenthingan.bsdk@gmail.com",
    frequency: "Event",
    dueRule: "Hạn do Trưởng khoa đặt theo kế hoạch triển khai phương pháp",
    reminderDays: 7,
    evidenceRequired: true,
    approvalRequired: true,
    priority: "Cao",
    operationNote: "Không tạo task định kỳ nếu không có phương pháp mới/thay đổi lớn.",
    externalLink: "https://iso-gpb-duc-giang.vercel.app/",
    active: true
  }
];

async function seed() {
  const db = getDb();
  console.log("Seeding USERS...");
  const batch = db.batch();

  // Map user email to user ID
  const emailToId = {};
  for (const u of USERS) {
    emailToId[u.email.toLowerCase()] = u.id;
    const ref = db.collection("iso_users").doc(u.email.toLowerCase());
    batch.set(ref, {
      ...u,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  console.log("Seeding WORK_ITEMS...");
  for (const item of WORK_ITEMS) {
    const assigneeEmail = item.assigneeEmail.toLowerCase();
    const assigneeId = emailToId[assigneeEmail] || item.assigneeName;
    const reviewerEmail = "nguyethmu@gmail.com";
    const reviewerId = "U001";
    const reviewerName = "Đào Thị Nguyệt";

    const ref = db.collection("iso_work_items").doc(item.itemId);
    batch.set(ref, {
      ...item,
      assigneeId,
      reviewerId,
      reviewerName,
      reviewerEmail,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  await batch.commit();
  console.log("Successfully seeded 9 users and 30 work items into Firestore!");
}

seed().catch(console.error);
