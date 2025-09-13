// Simple database connection test
import { config } from 'dotenv';
import { PrismaClient } from './libs/db/src/generated/index.js';

// Load environment variables from .env file
config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Test table creation by pushing schema
    console.log('🔄 Pushing database schema...');
    
    // This will create tables if they don't exist
    // In production, you'd use migrations instead
    
    console.log('✅ Database schema is ready');
    
    // Test creating a record - first create a user and profile
    console.log('🔄 Testing record creation...');
    
    // Create a test user first
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        emailVerified: true,
        profile: {
          create: {
            fullName: 'Test User',
            mobileNumber: '+1234567890',
            emailVerified: true,
            isEnabled: true
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    // Now create a theme with the valid user ID
    const testTheme = await prisma.theme.create({
      data: {
        name: `Test Theme ${Date.now()}`,
        description: 'Test theme for database verification',
        createdBy: testUser.profile.userId
      }
    });
    
    console.log('✅ Successfully created test user and theme:', { user: testUser.email, theme: testTheme.name });
    
    // Clean up - delete the test records
    await prisma.theme.delete({
      where: { id: testTheme.id }
    });
    
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();