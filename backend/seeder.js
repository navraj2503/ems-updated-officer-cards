const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Department = require('./models/Department');
const Notice = require('./models/Notice');
const Workflow = require('./models/Workflow');
const Application = require('./models/Application');

dotenv.config();

const importData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. Clearing old data...');

    await User.deleteMany();
    await Department.deleteMany();
    await Notice.deleteMany();
    await Workflow.deleteMany();
    await Application.deleteMany();

    console.log('Creating Departments...');
    const depts = await Department.create([
      { name: 'Department of Finance' }, // Logic mapping: d1
      { name: 'Department of Education' }, // Logic mapping: d2
      { name: 'Department of Health' }, // Logic mapping: d3
    ]);

    const d1 = depts[0]._id;
    const d2 = depts[1]._id;
    const d3 = depts[2]._id;

    console.log('Creating Users with secure hashing...');
    // Note: The User model pre-save hook will automatically hash these passwords
    const users = await User.create([
      { firstName: 'Tashi', lastName: 'Wangchuk', email: 'superadmin@sikkim.gov.in', password: '123', role: 'super_admin', deptId: null }, // u0
      { firstName: 'Karma', lastName: 'Lepcha', email: 'admin@finance.gov.in', password: '123', role: 'dept_admin', deptId: d1 }, // u1
      { firstName: 'Pema', lastName: 'Bhutia', email: 'admin@education.gov.in', password: '123', role: 'dept_admin', deptId: d2 }, // u2
      { firstName: 'Sonam', lastName: 'Gyatso', email: 'hod@finance.gov.in', password: '123', role: 'officer', officerRole: 'HOD', deptId: d1, profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop' }, // u3
      { firstName: 'Dawa', lastName: 'Tamang', email: 'hoo@finance.gov.in', password: '123', role: 'officer', officerRole: 'HOO', deptId: d1, profileImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop' }, // u4
      { firstName: 'Nima', lastName: 'Sherpa', email: 'so@finance.gov.in', password: '123', role: 'officer', officerRole: 'Section Officer', deptId: d1, profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop' }, // u5
      { firstName: 'Rinzin', lastName: 'Dorji', email: 'sec@education.gov.in', password: '123', role: 'officer', officerRole: 'Secretary', deptId: d2, profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' }, // u6
      { firstName: 'Passang', lastName: 'Rai', email: 'e@e.com', password: '123', role: 'employee', deptId: d1 }, // u7
      { firstName: 'Tenzing', lastName: 'Gurung', email: 'employee2@finance.gov.in', password: '123', role: 'employee', deptId: d1 }, // u8
      { firstName: 'Yangchen', lastName: 'Lama', email: 'employee3@education.gov.in', password: '123', role: 'employee', deptId: d2 }, // u9
    ]);

    const u0 = users[0]._id;
    const u1 = users[1]._id;
    const u3 = users[3]._id;
    const u4 = users[4]._id;
    const u5 = users[5]._id;
    const u6 = users[6]._id;
    const u7 = users[7]._id;
    const u8 = users[8]._id;

    console.log('Creating Workflows...');
    await Workflow.create([
      { deptId: d1, officers: [u3, u4, u5] },
      { deptId: d2, officers: [u6] },
      { deptId: d3, officers: [] },
    ]);

    console.log('Creating Notices...');
    await Notice.create([
      { title: 'Public Holiday - Losar Festival', content: 'All Government offices will remain closed on the occasion of Losar (Tibetan New Year). Offices will resume normal operations the following working day.', date: '2025-04-01', priority: 'high', author: u0 },
      { title: 'Annual Budget Submission Deadline', content: 'All departments are reminded to submit their annual budget proposals for FY 2025-26 to the Department of Finance by the 30th of this month. Late submissions will not be entertained.', date: '2025-04-05', priority: 'high', author: u0 },
      { title: 'e-Office Training Programme', content: 'A training programme on the use of the new e-Office Management System has been scheduled. All officers and staff are requested to attend. Venue: State Training Institute, Gangtok.', date: '2025-04-10', priority: 'normal', author: u1 },
      { title: 'Recruitment Notice - Group C Posts', content: 'Applications are invited from eligible candidates for various Group C posts across state departments. Interested candidates may apply through the official portal. Last date: 15th May 2025.', date: '2025-04-12', priority: 'normal', author: u0 },
    ]);

    console.log('Creating Applications...');
    await Application.create([
      {
        employeeId: u7,
        deptId: d1,
        title: 'Remote Work Request',
        description: 'Requesting approval to work remotely for 2 weeks due to family obligations.',
        submittedAt: '2025-04-10',
        status: 'in_progress',
        currentStep: 1,
        steps: [
          { officerId: u3, status: 'approved', note: 'Looks good.', actionAt: '2025-04-11' },
          { officerId: u4, status: 'pending', note: '', actionAt: null },
          { officerId: u5, status: 'pending', note: '', actionAt: null },
        ],
      },
      {
        employeeId: u8,
        deptId: d1,
        title: 'Annual Leave Application',
        description: 'Requesting 5 days leave for a family event starting April 20.',
        submittedAt: '2025-04-12',
        status: 'pending',
        currentStep: 0,
        steps: [
          { officerId: u3, status: 'pending', note: '', actionAt: null },
          { officerId: u4, status: 'pending', note: '', actionAt: null },
          { officerId: u5, status: 'pending', note: '', actionAt: null },
        ],
      },
    ]);

    console.log('Data Successfully Seeded to Atlas with secure passwords!');
    process.exit();
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  importData();
}

module.exports = importData;
