import { PrismaClient, QueueAction, Role, SessionStatus, SessionType, TokenStatus } from '@prisma/client'

const prisma = new PrismaClient()

function startOfToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}

async function upsertUser(phone: string, name: string, role: Role) {
    return prisma.user.upsert({
        where: { phone },
        update: { name, role },
        create: { phone, name, role },
    })
}

async function main() {
    const today = startOfToday()

    await prisma.clinicSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            clinicName: 'Smart Clinic',
            address: 'Plot 42, Sector 18, Smart City',
            phone: '+91 9988776655',
            email: 'admin@smartclinic.com',
            tokenLockMinutes: 10,
            followUpValidityDays: 15,
            standardConsultFee: 500,
        },
    })

    const consultation = await prisma.appointmentType.upsert({
        where: { code: 'CONSULTATION' },
        update: { label: 'Consultation', fee: 500, isFollowUp: false, active: true },
        create: { code: 'CONSULTATION', label: 'Consultation', fee: 500 },
    })

    const followUp = await prisma.appointmentType.upsert({
        where: { code: 'FOLLOW_UP' },
        update: { label: 'Follow-up', fee: 0, isFollowUp: true, active: true },
        create: { code: 'FOLLOW_UP', label: 'Follow-up', fee: 0, isFollowUp: true },
    })

    const admin = await upsertUser('8888888888', 'Admin User', Role.ADMIN)
    const superAdmin = await upsertUser('9999999999', 'Super Admin', Role.SUPER_ADMIN)
    const doctorUser = await upsertUser('7777777777', 'Dr. Sharma', Role.DOCTOR)
    const dentistUser = await upsertUser('6666666666', 'Dr. Verma', Role.DOCTOR)
    const patient = await upsertUser('9876543210', 'Amarjeet Singh', Role.PATIENT)
    const patientTwo = await upsertUser('9876543211', 'Sita Devi', Role.PATIENT)

    await prisma.user.update({
        where: { id: patientTwo.id },
        data: { lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    })

    const drSharma = await prisma.doctor.upsert({
        where: { userId: doctorUser.id },
        update: {
            name: 'Dr. Sharma',
            qualification: 'MBBS, MD',
            specialization: 'General Physician',
            fee: 500,
            commission: 10,
            active: true,
        },
        create: {
            userId: doctorUser.id,
            name: 'Dr. Sharma',
            qualification: 'MBBS, MD',
            specialization: 'General Physician',
            fee: 500,
            commission: 10,
        },
    })

    const drVerma = await prisma.doctor.upsert({
        where: { userId: dentistUser.id },
        update: {
            name: 'Dr. Verma',
            qualification: 'BDS',
            specialization: 'Dentist',
            fee: 300,
            commission: 15,
            active: true,
        },
        create: {
            userId: dentistUser.id,
            name: 'Dr. Verma',
            qualification: 'BDS',
            specialization: 'Dentist',
            fee: 300,
            commission: 15,
        },
    })

    await prisma.doctorSchedule.deleteMany({
        where: { doctorId: { in: [drSharma.id, drVerma.id] } },
    })

    await prisma.doctorSchedule.createMany({
        data: [
            { doctorId: drSharma.id, dayOfWeek: 1, type: SessionType.MORNING, startTime: '09:00', endTime: '13:00', capacity: 20 },
            { doctorId: drSharma.id, dayOfWeek: 2, type: SessionType.MORNING, startTime: '09:00', endTime: '13:00', capacity: 20 },
            { doctorId: drSharma.id, dayOfWeek: 3, type: SessionType.MORNING, startTime: '09:00', endTime: '13:00', capacity: 20 },
            { doctorId: drSharma.id, dayOfWeek: 4, type: SessionType.MORNING, startTime: '09:00', endTime: '13:00', capacity: 20 },
            { doctorId: drSharma.id, dayOfWeek: 5, type: SessionType.MORNING, startTime: '09:00', endTime: '13:00', capacity: 20 },
            { doctorId: drSharma.id, dayOfWeek: 6, type: SessionType.MORNING, startTime: '09:00', endTime: '13:00', capacity: 20 },
            { doctorId: drVerma.id, dayOfWeek: 1, type: SessionType.EVENING, startTime: '17:00', endTime: '21:00', capacity: 20 },
            { doctorId: drVerma.id, dayOfWeek: 2, type: SessionType.EVENING, startTime: '17:00', endTime: '21:00', capacity: 20 },
            { doctorId: drVerma.id, dayOfWeek: 3, type: SessionType.EVENING, startTime: '17:00', endTime: '21:00', capacity: 20 },
            { doctorId: drVerma.id, dayOfWeek: 4, type: SessionType.EVENING, startTime: '17:00', endTime: '21:00', capacity: 20 },
            { doctorId: drVerma.id, dayOfWeek: 5, type: SessionType.EVENING, startTime: '17:00', endTime: '21:00', capacity: 20 },
        ],
        skipDuplicates: true,
    })

    const morning = await prisma.session.upsert({
        where: { doctorId_date_type: { doctorId: drSharma.id, date: today, type: SessionType.MORNING } },
        update: { status: SessionStatus.OPEN, capacity: 20, startTime: '09:00', endTime: '13:00' },
        create: {
            doctorId: drSharma.id,
            date: today,
            type: SessionType.MORNING,
            status: SessionStatus.OPEN,
            capacity: 20,
            startTime: '09:00',
            endTime: '13:00',
        },
    })

    const evening = await prisma.session.upsert({
        where: { doctorId_date_type: { doctorId: drVerma.id, date: today, type: SessionType.EVENING } },
        update: { status: SessionStatus.OPEN, capacity: 20, startTime: '17:00', endTime: '21:00' },
        create: {
            doctorId: drVerma.id,
            date: today,
            type: SessionType.EVENING,
            status: SessionStatus.OPEN,
            capacity: 20,
            startTime: '17:00',
            endTime: '21:00',
        },
    })

    const bookedToken = await prisma.token.upsert({
        where: { sessionId_number: { sessionId: morning.id, number: 1 } },
        update: { status: TokenStatus.BOOKED },
        create: {
            number: 1,
            status: TokenStatus.BOOKED,
            patientId: patient.id,
            doctorId: drSharma.id,
            sessionId: morning.id,
            appointmentTypeId: consultation.id,
        },
    })

    await prisma.payment.upsert({
        where: { tokenId: bookedToken.id },
        update: { amount: 500, mode: 'UPI', status: 'PAID', paidAt: new Date() },
        create: { tokenId: bookedToken.id, amount: 500, mode: 'UPI', status: 'PAID', paidAt: new Date() },
    })

    await prisma.token.upsert({
        where: { sessionId_number: { sessionId: morning.id, number: 2 } },
        update: { status: TokenStatus.BOOKED },
        create: {
            number: 2,
            status: TokenStatus.BOOKED,
            patientId: patientTwo.id,
            doctorId: drSharma.id,
            sessionId: morning.id,
            appointmentTypeId: followUp.id,
        },
    })

    await prisma.token.upsert({
        where: { sessionId_number: { sessionId: evening.id, number: 1 } },
        update: { status: TokenStatus.BOOKED },
        create: {
            number: 1,
            status: TokenStatus.BOOKED,
            patientId: patient.id,
            doctorId: drVerma.id,
            sessionId: evening.id,
            appointmentTypeId: consultation.id,
        },
    })

    await prisma.queueEvent.create({
        data: {
            action: QueueAction.TOKEN_BOOKED,
            tokenId: bookedToken.id,
            sessionId: morning.id,
            actorId: admin.id,
            note: 'Seed booking event',
        },
    })

    await prisma.queueEvent.create({
        data: {
            action: QueueAction.SESSION_OPENED,
            sessionId: morning.id,
            actorId: superAdmin.id,
            note: 'Seed session opened',
        },
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (error) => {
        console.error(error)
        await prisma.$disconnect()
        process.exit(1)
    })
