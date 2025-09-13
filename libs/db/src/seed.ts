import { prisma } from './index.js';
import { AppRole } from './generated/index.js';

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'admin@honestly-insight-hub.com',
      passwordHash: '$2b$12$dummy.hash.for.testing', // Replace with proper hash in production
      emailVerified: true,
      profile: {
        create: {
          fullName: 'Admin User',
          mobileNumber: '+1234567890',
          emailVerified: true,
          isEnabled: true,
          userRoles: {
            create: {
              role: AppRole.admin,
            },
          },
        },
      },
    },
    include: {
      profile: true,
    },
  });

  console.log('✅ Created admin user:', user);

  // Create sample themes
  const themes = await prisma.theme.createMany({
    data: [
      {
        name: 'Technology',
        description: 'Technology and innovation focused investments',
        createdBy: user.profile!.userId,
      },
      {
        name: 'Healthcare',
        description: 'Healthcare and biotechnology investments',
        createdBy: user.profile!.userId,
      },
      {
        name: 'Clean Energy',
        description: 'Renewable energy and sustainability',
        createdBy: user.profile!.userId,
      },
    ],
  });

  console.log('✅ Created sample themes');

  // Create sample risk buckets
  const riskBuckets = await prisma.riskBucket.createMany({
    data: [
      {
        name: 'Low Risk',
        description: 'Conservative investments with lower volatility',
        createdBy: user.profile!.userId,
      },
      {
        name: 'Medium Risk',
        description: 'Balanced risk-reward investments',
        createdBy: user.profile!.userId,
      },
      {
        name: 'High Risk',
        description: 'Aggressive growth investments',
        createdBy: user.profile!.userId,
      },
    ],
  });

  console.log('✅ Created sample risk buckets');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });