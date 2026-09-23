import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import fs from 'fs';
import { parse } from 'csv-parse';

export const uploadBankStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const results: any[] = [];
    
    fs.createReadStream(req.file.path)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let importedCount = 0;
          for (const row of results) {
            // Generic parsing for Date, Description, Amount
            const dateStr = row['Date'] || row['date'];
            const description = row['Description'] || row['description'] || 'Unknown';
            const amountStr = row['Amount'] || row['amount'] || '0';
            
            if (dateStr && amountStr) {
               const date = new Date(dateStr);
               const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g,"")); // handle $ signs if present
               
               if (!isNaN(date.getTime()) && !isNaN(amount)) {
                  await prisma.bankTransaction.create({
                    data: {
                      date,
                      description,
                      amount,
                      isMatched: false
                    }
                  });
                  importedCount++;
               }
            }
          }
          fs.unlinkSync(req.file!.path); // clean up file
          res.status(200).json({ message: `Successfully imported ${importedCount} transactions` });
        } catch (dbError) {
          console.error("DB Error on import:", dbError);
          res.status(500).json({ error: 'Failed to save transactions to database' });
        }
      });
  } catch (error) {
    console.error('Error uploading bank statement:', error);
    res.status(500).json({ error: 'Failed to process bank statement' });
  }
};

export const getUnmatchedTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.bankTransaction.findMany({
      where: { isMatched: false },
      orderBy: { date: 'desc' }
    });
    
    // Fetch payments that don't have a linked bankTransaction to suggest for matching
    const unmatchedPayments = await prisma.payment.findMany({
       where: {
         bankTransaction: null
       },
       include: {
         invoice: {
           include: { customer: true }
         }
       },
       orderBy: { date: 'desc' }
    });

    res.status(200).json({ transactions, unmatchedPayments });
  } catch (error) {
    console.error('Error fetching unmatched transactions:', error);
    res.status(500).json({ error: 'Failed to fetch unmatched transactions' });
  }
};

export const matchTransaction = async (req: Request, res: Response): Promise<void> => {
  const { transactionId, paymentId } = req.body;
  try {
     const transaction = await prisma.bankTransaction.update({
       where: { id: transactionId },
       data: {
         isMatched: true,
         paymentId: paymentId
       }
     });
     res.status(200).json(transaction);
  } catch (error) {
    console.error('Error matching transaction:', error);
    res.status(500).json({ error: 'Failed to match transaction' });
  }
};
