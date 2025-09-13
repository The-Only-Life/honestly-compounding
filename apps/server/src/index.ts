import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prisma } from '@honestly-insight-hub/db';

const app = new Hono();

app.use('*', cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'http://localhost:3000']
    : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'], // Vite dev server
  credentials: true,
}));

app.use('*', logger());

// Health check endpoint
app.get('/health', async (c) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return c.json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// API routes will be added here
app.get('/api/test', (c) => {
  return c.json({ message: 'Bun server is running!' });
});

// Auth routes (placeholder for now)
app.post('/api/auth/signup', (c) => {
  return c.json({ message: 'Signup endpoint - coming soon' }, 501);
});

app.post('/api/auth/signin', (c) => {
  return c.json({ message: 'Signin endpoint - coming soon' }, 501);
});

app.post('/api/auth/signout', (c) => {
  return c.json({ message: 'Signout endpoint - coming soon' }, 501);
});

// Database test endpoint
app.get('/api/db-test', async (c) => {
  try {
    // Create a test user first
    const testUser = await prisma.user.create({
      data: {
        email: `test-api-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        emailVerified: true,
        profile: {
          create: {
            fullName: 'API Test User',
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

    // Test creating a theme with valid user
    const testTheme = await prisma.theme.create({
      data: {
        name: `Test Theme ${Date.now()}`,
        description: 'This is a test theme created to verify database connectivity',
        createdBy: testUser.profile!.userId,
      },
    });

    // Clean up test data
    await prisma.theme.delete({ where: { id: testTheme.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    return c.json({ 
      success: true,
      message: 'Database test successful - created and cleaned up test user and theme',
      testData: {
        user: testUser.email,
        theme: testTheme.name
      }
    });
  } catch (error) {
    return c.json({ 
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Data endpoints with real database integration
app.get('/api/themes', async (c) => {
  try {
    const themes = await prisma.theme.findMany({
      include: {
        _count: {
          select: { stocks: true }
        }
      }
    });
    return c.json({ themes });
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch themes'
    }, 500);
  }
});

app.get('/api/stocks', async (c) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: {
        theme: true,
        riskBucket: true
      }
    });
    return c.json({ stocks });
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch stocks'
    }, 500);
  }
});

app.get('/api/risk-buckets', async (c) => {
  try {
    const riskBuckets = await prisma.riskBucket.findMany({
      include: {
        _count: {
          select: { stocks: true }
        }
      }
    });
    return c.json({ riskBuckets });
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch risk buckets'
    }, 500);
  }
});

// Use INTERNAL_PORT for the Bun server (internal communication with Nginx)
// Railway's PORT is used by Nginx for external traffic
const port = process.env.INTERNAL_PORT || 3001;

console.log(`🔥 Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};