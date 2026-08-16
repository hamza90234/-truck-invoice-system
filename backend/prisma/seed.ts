import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const shopCount = await prisma.shopProfile.count();
  
  if (shopCount === 0) {
    console.log('No shop profile found. Creating default admin account...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await prisma.shopProfile.create({
      data: {
        email: 'admin@truckshop.com',
        passwordHash,
        shopName: 'My Truck Shop',
        address: '123 Main St, Anytown, USA',
        phone: '555-0100',
        defaultTaxRate: 8.25,
        defaultPaymentTerms: 'Net 30',
        creditCardFeePct: 3.00,
      }
    });
    console.log('Default admin created: admin@truckshop.com / admin123');
  } else {
    console.log('Shop profile already exists. Skipping admin creation.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
