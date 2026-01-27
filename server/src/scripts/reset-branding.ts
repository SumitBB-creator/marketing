import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting branding configuration...');
    // Delete all branding configs to fallback to defaults
    await prisma.brandingConfig.deleteMany({});

    // Optional: Create a default one
    await prisma.brandingConfig.create({
        data: {
            company_name: 'LeadTrack Pro',
            primary_color: '#3B82F6', // Blue-500
            secondary_color: '#10B981', // Emerald-500
            accent_color: '#F59E0B', // Amber-500
            font_family: 'Inter',
            updated_by: 'system', // specific user check might fail if foreign key, but let's try skipping updated_by or find an admin
        }
    });

    console.log('Branding reset to defaults.');
}

// Just delete is safer if the app logic handles missing config
async function simpleReset() {
    await prisma.brandingConfig.deleteMany({});
    console.log('Branding configuration deleted. App should use defaults.');
}

simpleReset()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
