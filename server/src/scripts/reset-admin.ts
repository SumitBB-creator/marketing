import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';

    console.log(`Resetting admin user...`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password_hash,
            role: Role.super_admin,
            full_name: 'Super Admin',
            is_active: true
        },
        create: {
            email,
            password_hash,
            full_name: 'Super Admin',
            role: Role.super_admin,
            is_active: true
        }
    });

    console.log(`User ${user.email} updated successfully.`);
    console.log(`Role: ${user.role}`);
    console.log(`New Password: ${password}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
