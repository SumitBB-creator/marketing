"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    console.log(`Resetting admin user...`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    const salt = await bcrypt_1.default.genSalt(10);
    const password_hash = await bcrypt_1.default.hash(password, salt);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password_hash,
            role: client_1.Role.super_admin,
            full_name: 'Super Admin',
            is_active: true
        },
        create: {
            email,
            password_hash,
            full_name: 'Super Admin',
            role: client_1.Role.super_admin,
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
