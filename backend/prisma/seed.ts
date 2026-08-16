import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const existingShop = await prisma.shopProfile.findFirst();

  if (existingShop) {
    console.log('Shop profile found. Forcing update to admin credentials...');
    await prisma.shopProfile.update({
      where: { id: existingShop.id },
      data: {
        email: 'admin@truckshop.com',
        passwordHash,
      }
    });
    console.log('Existing admin forcefully updated to: admin@truckshop.com / admin123');
  } else {
    console.log('No shop profile found. Creating default admin account...');
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
