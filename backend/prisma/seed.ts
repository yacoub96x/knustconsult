import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const Role = {
  LECTURER: 'LECTURER',
  STUDENT: 'STUDENT',
} as const;

export const SlotStatus = {
  OPEN: 'OPEN',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const;

export const BookingStatus = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;

async function main() {
  console.log('🌱 Starting KnustConsult Database Seeding...');

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Create Lecturers
  const lecturer1 = await prisma.user.create({
    data: {
      name: 'Dr. Kwabena Mensah',
      email: 'dr.mensah@knust.edu.gh',
      passwordHash,
      role: Role.LECTURER,
      department: 'Computer Science',
    },
  });

  const lecturer2 = await prisma.user.create({
    data: {
      name: 'Prof. Ama Serwaa',
      email: 'prof.serwaa@knust.edu.gh',
      passwordHash,
      role: Role.LECTURER,
      department: 'Electrical Engineering',
    },
  });

  const lecturer3 = await prisma.user.create({
    data: {
      name: 'Dr. Yaw Osei',
      email: 'dr.osei@knust.edu.gh',
      passwordHash,
      role: Role.LECTURER,
      department: 'Mathematics & Statistics',
    },
  });

  // 2. Create Students
  const student1 = await prisma.user.create({
    data: {
      name: 'Kwame Appiah',
      email: 'kwame.appiah@st.knust.edu.gh',
      passwordHash,
      role: Role.STUDENT,
      department: 'Computer Science',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Abena Owusu',
      email: 'abena.owusu@st.knust.edu.gh',
      passwordHash,
      role: Role.STUDENT,
      department: 'Electrical Engineering',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Kofi Boakye',
      email: 'kofi.boakye@st.knust.edu.gh',
      passwordHash,
      role: Role.STUDENT,
      department: 'Mathematics & Statistics',
    },
  });

  // Dates helper
  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const yesterdayDate = formatDate(-1);
  const todayDate = formatDate(0);
  const tomorrowDate = formatDate(1);
  const dayAfterTomorrow = formatDate(2);
  const nextWeekDate = formatDate(7);

  // 3. Create Slots & Bookings for Lecturer 1 (Dr. Mensah)
  await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer1.id,
      date: yesterdayDate,
      startTime: '10:00',
      endTime: '10:30',
      status: SlotStatus.CANCELLED,
      isRecurring: false,
    },
  });

  await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer1.id,
      date: todayDate,
      startTime: '14:00',
      endTime: '14:30',
      status: SlotStatus.OPEN,
      isRecurring: false,
    },
  });

  const slot2 = await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer1.id,
      date: tomorrowDate,
      startTime: '11:00',
      endTime: '11:30',
      status: SlotStatus.BOOKED,
      isRecurring: true,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slot2.id,
      studentId: student1.id,
      status: BookingStatus.CONFIRMED,
    },
  });

  await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer1.id,
      date: tomorrowDate,
      startTime: '11:30',
      endTime: '12:00',
      status: SlotStatus.OPEN,
      isRecurring: true,
    },
  });

  // 4. Create Slots for Lecturer 2 (Prof. Serwaa)
  const slot3 = await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer2.id,
      date: dayAfterTomorrow,
      startTime: '09:00',
      endTime: '09:45',
      status: SlotStatus.BOOKED,
      isRecurring: false,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slot3.id,
      studentId: student2.id,
      status: BookingStatus.CONFIRMED,
    },
  });

  await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer2.id,
      date: dayAfterTomorrow,
      startTime: '10:00',
      endTime: '10:45',
      status: SlotStatus.OPEN,
      isRecurring: false,
    },
  });

  // 5. Create Slots for Lecturer 3 (Dr. Yaw Osei)
  await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer3.id,
      date: nextWeekDate,
      startTime: '13:00',
      endTime: '13:30',
      status: SlotStatus.OPEN,
      isRecurring: true,
    },
  });

  const slot4 = await prisma.availabilitySlot.create({
    data: {
      lecturerId: lecturer3.id,
      date: nextWeekDate,
      startTime: '13:30',
      endTime: '14:00',
      status: SlotStatus.BOOKED,
      isRecurring: true,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slot4.id,
      studentId: student3.id,
      status: BookingStatus.CONFIRMED,
    },
  });

  console.log('\n=============================================================');
  console.log('🎉 KNUSTCONSULT SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=============================================================\n');
  console.log('🔑 DEMO USER CREDENTIALS (Default Password: "password123"):\n');
  console.log('--- LECTURERS ---');
  console.log(`1. Dr. Kwabena Mensah  (Computer Science)        : dr.mensah@knust.edu.gh`);
  console.log(`2. Prof. Ama Serwaa     (Electrical Engineering)  : prof.serwaa@knust.edu.gh`);
  console.log(`3. Dr. Yaw Osei        (Mathematics & Stats)     : dr.osei@knust.edu.gh\n`);
  console.log('--- STUDENTS ---');
  console.log(`1. Kwame Appiah        (Computer Science)        : kwame.appiah@st.knust.edu.gh`);
  console.log(`2. Abena Owusu         (Electrical Engineering)  : abena.owusu@st.knust.edu.gh`);
  console.log(`3. Kofi Boakye         (Mathematics & Stats)     : kofi.boakye@st.knust.edu.gh`);
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
