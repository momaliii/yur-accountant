import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plan from '../server/models/Plan.js';

dotenv.config();

async function initPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yur-finance');
    console.log('Connected to MongoDB');

    // Check if plans already exist
    const existingPlans = await Plan.find();
    if (existingPlans.length > 0) {
      console.log('Plans already exist. Skipping initialization.');
      await mongoose.disconnect();
      return;
    }

    // Create Free Plan
    const freePlan = new Plan({
      name: 'Free',
      slug: 'free',
      description: 'Perfect for getting started. Basic features with limited usage.',
      price: {
        monthly: 0,
        yearly: 0,
      },
      currency: 'USD',
      features: [
        { name: 'Basic Dashboard', included: true },
        { name: 'Client Management', included: true, limit: 5 },
        { name: 'Income Tracking', included: true, limit: 50 },
        { name: 'Expense Tracking', included: true, limit: 50 },
        { name: 'Basic Reports', included: true },
      ],
      limits: {
        clients: 5,
        incomeEntries: 50,
        expenseEntries: 50,
        invoices: 10,
        storage: 100, // 100 MB
        apiCalls: 1000, // per month
      },
      isActive: true,
      isDefault: true,
      trialDays: 0,
      sortOrder: 1,
    });

    // Create Basic Plan ($5/month)
    const basicPlan = new Plan({
      name: 'Basic',
      slug: 'basic',
      description: 'For growing businesses. More features and higher limits.',
      price: {
        monthly: 5,
        yearly: 50, // $50/year (2 months free)
      },
      currency: 'USD',
      features: [
        { name: 'Full Dashboard', included: true },
        { name: 'Unlimited Clients', included: true },
        { name: 'Unlimited Income Tracking', included: true },
        { name: 'Unlimited Expense Tracking', included: true },
        { name: 'Advanced Reports', included: true },
        { name: 'Invoice Management', included: true },
        { name: 'Goal Tracking', included: true },
        { name: 'Savings Management', included: true },
        { name: 'Priority Support', included: true },
      ],
      limits: {
        clients: null, // Unlimited
        incomeEntries: null, // Unlimited
        expenseEntries: null, // Unlimited
        invoices: null, // Unlimited
        storage: 1000, // 1 GB
        apiCalls: 10000, // per month
      },
      isActive: true,
      isDefault: false,
      trialDays: 14, // 14 days free trial
      sortOrder: 2,
    });

    // Save plans
    await freePlan.save();
    console.log('✓ Free plan created');

    await basicPlan.save();
    console.log('✓ Basic plan ($5/month) created');

    console.log('\n✅ Plans initialized successfully!');
    console.log(`   - Free Plan (Default)`);
    console.log(`   - Basic Plan ($5/month)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing plans:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initPlans();
