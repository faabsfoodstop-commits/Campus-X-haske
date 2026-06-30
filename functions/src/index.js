import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import axios from 'axios';
import cors from 'cors';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const corsHandler = cors({ origin: true });

// ============================================================================
// PAYMENT VERIFICATION - Paystack
// ============================================================================

export const verifyPaystackPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reference } = data;

    if (!reference) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment reference is required');
    }

    const paystackSecret = process.env.VITE_PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      throw new functions.https.HttpsError('internal', 'Paystack secret key not configured');
    }

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    if (response.data.data.status !== 'success') {
      throw new functions.https.HttpsError('failed-precondition', 'Payment verification failed');
    }

    const paymentData = response.data.data;
    const userId = context.auth.uid;

    // Create payment record
    await db.collection('payments').doc(reference).set({
      userId,
      reference,
      amount: paymentData.amount / 100, // Convert from kobo to naira
      status: 'completed',
      provider: 'paystack',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: paymentData,
    });

    return { success: true, data: paymentData };
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// BUY POINTS - Credit points after successful payment
// ============================================================================

export const creditPointsAfterPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reference, packageId, points } = data;
    const userId = context.auth.uid;

    if (!reference || !packageId || !points) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Verify payment exists and belongs to user
    const paymentDoc = await db.collection('payments').doc(reference).get();
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment not found');
    }

    const payment = paymentDoc.data();
    if (payment.userId !== userId || payment.status !== 'completed') {
      throw new functions.https.HttpsError('permission-denied', 'Invalid payment');
    }

    // Check if points already credited
    if (payment.pointsCredited) {
      return { success: true, message: 'Points already credited' };
    }

    // Credit points to user
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const currentPoints = userDoc.data().points || 0;

    await userRef.update({
      points: currentPoints + points,
    });

    // Create transaction record
    await db.collection('transactions').add({
      userId,
      type: 'purchase',
      description: `Bought ${points} points`,
      amount: points,
      reference,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mark payment as credited
    await paymentDoc.ref.update({
      pointsCredited: true,
      creditedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, points, message: `${points} points credited to your account!` };
  } catch (error) {
    console.error('Credit points error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// REDEMPTION - Process airtime/data requests via Flutterwave
// ============================================================================

export const processRedemption = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { rewardId, phoneNumber, amount, type, provider } = data;
    const userId = context.auth.uid;

    if (!phoneNumber || !amount || !type) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Get user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const userPoints = user.points || 0;

    // Get reward details from rewards collection
    const rewardDoc = await db.collection('rewards').doc(rewardId).get();
    if (!rewardDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Reward not found');
    }

    const reward = rewardDoc.data();
    const requiredPoints = reward.points;

    // Check if user has enough points
    if (userPoints < requiredPoints) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient points. Need ${requiredPoints}, have ${userPoints}`
      );
    }

    // Validate phone number (Nigerian format)
    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format');
    }

    // Create redemption request
    const redemptionRef = await db.collection('redemptions').add({
      userId,
      userEmail: user.email,
      rewardId,
      rewardName: reward.name,
      rewardType: type,
      pointsRedeemed: requiredPoints,
      phoneNumber,
      amount,
      provider,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: null,
      processedAt: null,
    });

    // Deduct points immediately (optimistic)
    await db.collection('users').doc(userId).update({
      points: userPoints - requiredPoints,
    });

    // Log transaction
    await db.collection('transactions').add({
      userId,
      type: 'redemption_request',
      description: `Requested ${reward.name} to ${phoneNumber}`,
      amount: -requiredPoints,
      redemptionId: redemptionRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      redemptionId: redemptionRef.id,
      message: 'Redemption request submitted! Processing...',
    };
  } catch (error) {
    console.error('Redemption error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// ADMIN: Process Redemptions (Flutterwave Integration)
// ============================================================================

export const adminProcessRedemption = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { redemptionId, approved } = data;

    const redemptionRef = db.collection('redemptions').doc(redemptionId);
    const redemptionDoc = await redemptionRef.get();

    if (!redemptionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Redemption not found');
    }

    const redemption = redemptionDoc.data();

    if (approved) {
      // Call Flutterwave API to process airtime/data
      const flutterwave = axios.create({
        baseURL: 'https://api.flutterwave.com/v3',
        headers: {
          'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      let ftResponse;
      try {
        if (redemption.rewardType === 'airtime') {
          ftResponse = await flutterwave.post('/bills/create', {
            country: 'NG',
            customer_phone: redemption.phoneNumber,
            amount: redemption.amount,
            type: `${redemption.provider.toLowerCase()}_topup`,
            reference: `HASKE_${redemptionId}_${Date.now()}`,
          });
        } else if (redemption.rewardType === 'data') {
          ftResponse = await flutterwave.post('/bills/create', {
            country: 'NG',
            customer_phone: redemption.phoneNumber,
            amount: redemption.amount,
            type: `${redemption.provider.toLowerCase()}_data`,
            reference: `HASKE_${redemptionId}_${Date.now()}`,
          });
        }

        // Update redemption status
        await redemptionRef.update({
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          flutterwaveResponse: ftResponse.data,
        });

        // Update user transaction
        await db.collection('transactions').add({
          userId: redemption.userId,
          type: 'redemption_completed',
          description: `${redemption.rewardName} sent to ${redemption.phoneNumber}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (ftError) {
        console.error('Flutterwave error:', ftError);
        throw new functions.https.HttpsError('internal', 'Failed to process with Flutterwave');
      }
    } else {
      // Reject and refund points
      const userRef = db.collection('users').doc(redemption.userId);
      const userDoc = await userRef.get();
      const currentPoints = userDoc.data().points || 0;

      await userRef.update({
        points: currentPoints + redemption.pointsRedeemed,
      });

      await redemptionRef.update({
        status: 'rejected',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log refund
      await db.collection('transactions').add({
        userId: redemption.userId,
        type: 'redemption_refunded',
        description: `Refunded ${redemption.pointsRedeemed} points`,
        amount: redemption.pointsRedeemed,
        redemptionId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, status: approved ? 'completed' : 'rejected' };
  } catch (error) {
    console.error('Admin process redemption error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// WITHDRAW FUNDS - Request withdrawal
// ============================================================================

export const requestWithdrawal = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, method, bankDetails } = data;
    const userId = context.auth.uid;

    if (!amount || !method) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Get user
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const userWallet = user.wallet || 0;

    if (userWallet < amount) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient funds. You have ₦${userWallet}`
      );
    }

    if (method === 'bank_transfer' && !bankDetails?.accountNumber) {
      throw new functions.https.HttpsError('invalid-argument', 'Bank details required');
    }

    // Create withdrawal request
    const withdrawalRef = await db.collection('withdrawals').add({
      userId,
      amount,
      method,
      bankDetails: method === 'bank_transfer' ? bankDetails : null,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: null,
    });

    // Create transaction record
    await db.collection('transactions').add({
      userId,
      type: 'withdrawal_requested',
      description: `Withdrawal request: ₦${amount}`,
      amount: -amount,
      withdrawalId: withdrawalRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      withdrawalId: withdrawalRef.id,
      message: 'Withdrawal request submitted. Processing within 2-3 business days.',
    };
  } catch (error) {
    console.error('Withdrawal error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// ADMIN: Process Withdrawals via Flutterwave
// ============================================================================

export const adminProcessWithdrawal = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Verify admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { withdrawalId, approved } = data;

    const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
    const withdrawalDoc = await withdrawalRef.get();

    if (!withdrawalDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Withdrawal not found');
    }

    const withdrawal = withdrawalDoc.data();

    if (approved) {
      try {
        // Flutterwave disbursement
        const flutterwave = axios.create({
          baseURL: 'https://api.flutterwave.com/v3',
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        });

        const ftResponse = await flutterwave.post('/transfers', {
          account_bank: withdrawal.bankDetails.bankCode,
          account_number: withdrawal.bankDetails.accountNumber,
          amount: withdrawal.amount,
          narration: `Campus X Haske Withdrawal`,
          currency: 'NGN',
          reference: `WITHDRAWAL_${withdrawalId}_${Date.now()}`,
        });

        await withdrawalRef.update({
          status: 'approved',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          flutterwaveTransferId: ftResponse.data.data.id,
        });

        // Update user wallet
        const userRef = db.collection('users').doc(withdrawal.userId);
        const userDocData = await userRef.get();
        const currentWallet = userDocData.data().wallet || 0;

        await userRef.update({
          wallet: currentWallet - withdrawal.amount,
        });

        // Log transaction
        await db.collection('transactions').add({
          userId: withdrawal.userId,
          type: 'withdrawal_completed',
          description: `Withdrawal processed: ₦${withdrawal.amount}`,
          amount: -withdrawal.amount,
          withdrawalId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (ftError) {
        console.error('Flutterwave error:', ftError);
        throw new functions.https.HttpsError('internal', 'Failed to process withdrawal');
      }
    } else {
      // Reject withdrawal
      await withdrawalRef.update({
        status: 'rejected',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, status: approved ? 'approved' : 'rejected' };
  } catch (error) {
    console.error('Admin process withdrawal error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// PREMIUM SUBSCRIPTION - Charge and activate
// ============================================================================

export const activatePremium = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reference } = data;
    const userId = context.auth.uid;
    const premiumPrice = 999; // ₦999/month

    if (!reference) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment reference required');
    }

    // Verify payment
    const paymentDoc = await db.collection('payments').doc(reference).get();
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment not verified');
    }

    const payment = paymentDoc.data();
    if (payment.userId !== userId || payment.status !== 'completed' || payment.amount !== premiumPrice) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid payment');
    }

    // Check if already premium
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    const premiumUntil = user.premiumUntil ? new Date(user.premiumUntil) : new Date();

    if (premiumUntil > new Date() && user.premiumActive) {
      throw new functions.https.HttpsError('failed-precondition', 'Already have active premium');
    }

    // Activate premium (30 days)
    const newPremiumUntil = new Date();
    newPremiumUntil.setDate(newPremiumUntil.getDate() + 30);

    await db.collection('users').doc(userId).update({
      premiumActive: true,
      premiumTier: true,
      premiumUntil: newPremiumUntil.toISOString(),
      totalSpent: (user.totalSpent || 0) + premiumPrice,
    });

    // Log transaction
    await db.collection('transactions').add({
      userId,
      type: 'premium_subscription',
      description: '30-day Premium subscription',
      amount: premiumPrice,
      reference,
      expiresAt: newPremiumUntil.toISOString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      expiresAt: newPremiumUntil.toISOString(),
      message: 'Premium activated for 30 days!',
    };
  } catch (error) {
    console.error('Premium activation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// TASK COMPLETION & REWARDS
// ============================================================================

export const completeTask = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { taskId, taskType, points } = data;
    const userId = context.auth.uid;

    if (!taskId || !taskType || !points) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Check if task already completed today
    const today = new Date().toDateString();
    const completionKey = `${taskType}_${today}`;

    const taskDoc = await db.collection('task_completions').doc(`${userId}_${completionKey}`).get();

    if (taskDoc.exists && taskDoc.data().completed) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Task already completed today'
      );
    }

    // Get user
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const user = userDoc.data();

    // Calculate points (apply 2x multiplier if premium)
    const isPremium = user.premiumActive && new Date(user.premiumUntil) > new Date();
    const finalPoints = isPremium ? points * 2 : points;

    // Award points
    await userRef.update({
      points: (user.points || 0) + finalPoints,
    });

    // Record task completion
    await db.collection('task_completions').doc(`${userId}_${completionKey}`).set({
      userId,
      taskId,
      taskType,
      points: finalPoints,
      completed: true,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log transaction
    await db.collection('transactions').add({
      userId,
      type: 'task_reward',
      description: `Completed ${taskType}`,
      amount: finalPoints,
      taskId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      points: finalPoints,
      message: isPremium
        ? `✓ +${finalPoints} points (2x premium bonus!)`
        : `✓ +${finalPoints} points`,
    };
  } catch (error) {
    console.error('Task completion error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// POINT TRANSFER between users
// ============================================================================

export const transferPoints = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { recipientId, points } = data;
    const senderId = context.auth.uid;

    if (!recipientId || !points || points <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid transfer data');
    }

    if (senderId === recipientId) {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot transfer to yourself');
    }

    // Get sender
    const senderRef = db.collection('users').doc(senderId);
    const senderDoc = await senderRef.get();
    if (!senderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Sender not found');
    }

    const sender = senderDoc.data();
    if ((sender.points || 0) < points) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient points');
    }

    // Get recipient
    const recipientRef = db.collection('users').doc(recipientId);
    const recipientDoc = await recipientRef.get();
    if (!recipientDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Recipient not found');
    }

    const recipient = recipientDoc.data();

    // Execute transfer
    await senderRef.update({
      points: (sender.points || 0) - points,
    });

    await recipientRef.update({
      points: (recipient.points || 0) + points,
    });

    // Create transfer record
    const transferRef = await db.collection('point_transfers').add({
      senderId,
      senderName: sender.fullName,
      recipientId,
      recipientName: recipient.fullName,
      points,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log transactions
    await db.collection('transactions').add({
      userId: senderId,
      type: 'points_sent',
      description: `Sent ${points} points to ${recipient.fullName}`,
      amount: -points,
      transferId: transferRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('transactions').add({
      userId: recipientId,
      type: 'points_received',
      description: `Received ${points} points from ${sender.fullName}`,
      amount: points,
      transferId: transferRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `${points} points transferred!` };
  } catch (error) {
    console.error('Point transfer error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// REFERRAL BONUS
// ============================================================================

export const handleReferralSignup = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    try {
      const user = snap.data();
      const { referralCode } = user;

      if (!referralCode) return;

      // Find referrer
      const referrerQuery = await db
        .collection('users')
        .where('generatedReferralCode', '==', referralCode)
        .limit(1)
        .get();

      if (referrerQuery.empty) return;

      const referrerDoc = referrerQuery.docs[0];
      const referrerId = referrerDoc.id;
      const referrer = referrerDoc.data();

      const referralBonus = 500; // ₦500 bonus per referral

      // Award bonus to referrer
      await referrerDoc.ref.update({
        points: (referrer.points || 0) + referralBonus,
        totalReferrals: (referrer.totalReferrals || 0) + 1,
      });

      // Log transaction
      await db.collection('transactions').add({
        userId: referrerId,
        type: 'referral_bonus',
        description: `Referral bonus - ${user.fullName} signed up`,
        amount: referralBonus,
        referredUserId: context.params.userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Referral signup error:', error);
    }
  });

// ============================================================================
// DAILY RESET - Clear daily mission completion flags
// ============================================================================

export const dailyReset = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  try {
    // Get all task completions from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    // Reset daily missions by creating new completion records for today
    // The app will check for today's date when determining if task is completed

    console.log('Daily reset completed');
    return null;
  } catch (error) {
    console.error('Daily reset error:', error);
  }
});

// ============================================================================
// WEEKLY RESET - Update leaderboards and award bonuses
// ============================================================================

export const weeklyReset = functions.pubsub.schedule('0 0 * * 1').onRun(async (context) => {
  try {
    // Get top 3 users from weekly_stats
    const topUsersSnapshot = await db
      .collection('weekly_stats')
      .orderBy('points', 'desc')
      .limit(3)
      .get();

    const bonuses = [1000, 750, 500]; // 1st, 2nd, 3rd place bonuses

    let place = 0;
    for (const userDoc of topUsersSnapshot.docs) {
      const userId = userDoc.id.split('_')[0]; // Extract userId from weekly_stats doc ID
      const bonus = bonuses[place];

      // Award bonus
      const userRef = db.collection('users').doc(userId);
      const userDocData = await userRef.get();
      const user = userDocData.data();

      await userRef.update({
        points: (user.points || 0) + bonus,
      });

      // Log bonus transaction
      await db.collection('transactions').add({
        userId,
        type: 'weekly_challenge_bonus',
        description: `Weekly challenge #${place + 1} bonus`,
        amount: bonus,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      place++;
    }

    // Archive old weekly stats
    const allWeeklyStats = await db.collection('weekly_stats').get();
    for (const doc of allWeeklyStats.docs) {
      await doc.ref.delete();
    }

    console.log('Weekly reset completed');
    return null;
  } catch (error) {
    console.error('Weekly reset error:', error);
  }
});

// ============================================================================
// POINT MARKET - Create Sell Orders
// ============================================================================

export const createPointSellOrder = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { points, askPrice } = data;
    const userId = context.auth.uid;

    if (!points || !askPrice || points <= 0 || askPrice <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid points or price');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const userPoints = user.points || 0;

    if (userPoints < points) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient points');
    }

    // Create transaction to deduct points and create sell order
    const batch = db.batch();

    // Deduct points from user
    batch.update(db.collection('users').doc(userId), {
      points: admin.firestore.FieldValue.increment(-points)
    });

    // Create sell order
    const orderRef = db.collection('point_sell_orders').doc();
    batch.set(orderRef, {
      userId,
      userName: context.auth.token.name || 'Anonymous',
      points,
      askPrice,
      totalValue: points * askPrice,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log transaction
    batch.add(db.collection('transactions'), {
      userId,
      type: 'point_sell_order',
      description: `Listed ${points} points for sale at ₦${askPrice}/pt`,
      amount: -points,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      orderId: orderRef.id,
      message: 'Sell order created successfully'
    };
  } catch (error) {
    console.error('Create sell order error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// POINT MARKET - Execute Trades
// ============================================================================

export const executePointTrade = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { orderId, orderType } = data;
    const buyerId = context.auth.uid;

    if (!orderId || !orderType) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID and type are required');
    }

    if (!['sell_order', 'buy_offer'].includes(orderType)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid order type');
    }

    // Get the order/offer
    const orderRef = orderType === 'sell_order'
      ? db.collection('point_sell_orders').doc(orderId)
      : db.collection('point_buy_offers').doc(orderId);

    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found or already completed');
    }

    const order = orderDoc.data();

    if (order.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'Order is no longer available');
    }

    // Get buyer data
    const buyerDoc = await db.collection('users').doc(buyerId).get();
    if (!buyerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Buyer not found');
    }

    const buyer = buyerDoc.data();

    // Get seller data
    const sellerDoc = await db.collection('users').doc(order.userId).get();
    if (!sellerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Seller not found');
    }

    const seller = sellerDoc.data();

    // Verify sufficient points are available (in case seller has already sold them)
    if ((seller.points || 0) < order.points) {
      throw new functions.https.HttpsError('failed-precondition', 'Seller no longer has sufficient points');
    }

    // Execute atomic transaction
    const batch = db.batch();

    // Transfer points from seller to buyer
    batch.update(db.collection('users').doc(order.userId), {
      points: admin.firestore.FieldValue.increment(order.points)
    });

    batch.update(db.collection('users').doc(buyerId), {
      points: admin.firestore.FieldValue.increment(order.points)
    });

    // Mark order as completed
    batch.update(orderRef, {
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      buyerId
    });

    // Log transactions
    batch.add(db.collection('transactions'), {
      userId: order.userId,
      type: 'point_sold',
      description: `Sold ${order.points} points at ₦${order.askPrice}/pt to ${buyer.displayName || 'user'}`,
      amount: order.points,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    batch.add(db.collection('transactions'), {
      userId: buyerId,
      type: 'point_purchased',
      description: `Bought ${order.points} points at ₦${order.askPrice}/pt from ${seller.displayName || 'user'}`,
      amount: order.points,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      pointsReceived: order.points,
      message: `Successfully traded ${order.points} points`
    };
  } catch (error) {
    console.error('Execute trade error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// DAILY MISSIONS - Award Mission Rewards with Bonuses
// ============================================================================

export const awardMissionReward = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { missionId, missionName, baseReward, comboBonus } = data;
    const userId = context.auth.uid;

    if (!missionId || !missionName || !baseReward) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required mission data');
    }

    // Verify mission not already completed today
    const today = new Date().toDateString();
    const missionQuery = await db
      .collection('daily_missions')
      .where('userId', '==', userId)
      .where('missionId', '==', missionId)
      .where('completedDate', '==', today)
      .get();

    if (missionQuery.size > 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Mission already completed today');
    }

    // Get user data to check premium status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const isPremium = user.premiumTier && user.premiumUntil &&
      new Date(user.premiumUntil) > new Date();

    // Calculate final reward: base + combo + premium 2x
    let finalReward = baseReward + (comboBonus || 0);
    if (isPremium) {
      finalReward = Math.floor(finalReward * 2);
    }

    // Execute atomic transaction
    const batch = db.batch();

    // Award points
    batch.update(db.collection('users').doc(userId), {
      points: admin.firestore.FieldValue.increment(finalReward)
    });

    // Record mission completion
    batch.add(db.collection('daily_missions'), {
      userId,
      missionId,
      missionName,
      pointsEarned: baseReward,
      comboBonus: comboBonus || 0,
      premiumMultiplier: isPremium ? 2 : 1,
      finalPoints: finalReward,
      completedDate: today,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log transaction
    batch.add(db.collection('transactions'), {
      userId,
      type: 'daily_mission',
      description: `Completed mission: ${missionName}`,
      amount: finalReward,
      breakdown: {
        base: baseReward,
        bonus: comboBonus || 0,
        multiplier: isPremium ? 2 : 1
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      pointsAwarded: finalReward,
      message: `Mission completed! Earned ${finalReward} points`
    };
  } catch (error) {
    console.error('Award mission reward error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// WEEKLY CHALLENGES - Claim Challenge Rewards
// ============================================================================

export const claimWeeklyChallenge = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { challengeId } = data;
    const userId = context.auth.uid;

    if (!challengeId) {
      throw new functions.https.HttpsError('invalid-argument', 'Challenge ID is required');
    }

    // Get user data to check if already claimed and premium status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();

    // Check if already claimed
    if (user[`claimed_${challengeId}`]) {
      throw new functions.https.HttpsError('failed-precondition', 'Challenge reward already claimed');
    }

    // Define challenge bonuses
    const challengeBonuses = {
      'earn_1000': 200,
      'sell_500': 150,
      'complete_5': 100,
      'refer_2': 250,
      'login_5': 50,
      'streak_7': 300
    };

    const baseBonus = challengeBonuses[challengeId];
    if (!baseBonus) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid challenge ID');
    }

    // Check premium status for 2x multiplier
    const isPremium = user.premiumTier && user.premiumUntil &&
      new Date(user.premiumUntil) > new Date();

    const bonusAwarded = isPremium ? Math.floor(baseBonus * 2) : baseBonus;

    // Execute atomic transaction
    const batch = db.batch();

    // Award points
    batch.update(db.collection('users').doc(userId), {
      points: admin.firestore.FieldValue.increment(bonusAwarded),
      [`claimed_${challengeId}`]: true
    });

    // Log transaction
    batch.add(db.collection('transactions'), {
      userId,
      type: 'weekly_challenge_bonus',
      description: `Weekly challenge bonus: ${challengeId}`,
      amount: bonusAwarded,
      breakdown: {
        base: baseBonus,
        multiplier: isPremium ? 2 : 1
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      bonusAwarded,
      message: `Claimed ${bonusAwarded} bonus points`
    };
  } catch (error) {
    console.error('Claim weekly challenge error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// COSMETICS - Buy Cosmetic Items
// ============================================================================

export const buyCosmeticItem = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { cosmeticId, cosmeticName, price } = data;
    const userId = context.auth.uid;

    if (!cosmeticId || !price) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing cosmetic data');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const userPoints = user.points || 0;

    if (userPoints < price) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient points');
    }

    // Check if already owns this cosmetic
    const owned = user.cosmeticsPurchased || [];
    if (owned.includes(cosmeticId)) {
      throw new functions.https.HttpsError('failed-precondition', 'Item already owned');
    }

    // Execute atomic transaction
    const batch = db.batch();

    const newPoints = userPoints - price;

    // Deduct points and add cosmetic
    batch.update(db.collection('users').doc(userId), {
      points: newPoints,
      cosmeticsPurchased: admin.firestore.FieldValue.arrayUnion(cosmeticId)
    });

    // Log transaction
    batch.add(db.collection('transactions'), {
      userId,
      type: 'cosmetic_purchase',
      description: `Purchased: ${cosmeticName}`,
      amount: -price,
      itemId: cosmeticId,
      itemName: cosmeticName,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      newPoints,
      message: `${cosmeticName} purchased successfully`
    };
  } catch (error) {
    console.error('Buy cosmetic item error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// INSTAGRAM - Verify Brand Follow
// ============================================================================

export const verifyInstagramFollow = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { brandId, brandHandle, brandName, reward } = data;
    const userId = context.auth.uid;

    if (!brandId || !reward) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing brand data');
    }

    // Check if already followed
    const followQuery = await db
      .collection('instagram_follows')
      .where('userId', '==', userId)
      .where('brandId', '==', brandId)
      .get();

    if (followQuery.size > 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Already followed this brand');
    }

    // Get user data to check premium status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const isPremium = user.premiumTier && user.premiumUntil &&
      new Date(user.premiumUntil) > new Date();

    // In production, verify with Instagram Graph API here
    // For now, simulated verification
    const isVerified = true;

    if (!isVerified) {
      throw new functions.https.HttpsError('failed-precondition', 'Could not verify follow');
    }

    // Calculate final reward
    const pointsAwarded = isPremium ? Math.floor(reward * 2) : reward;

    // Execute atomic transaction
    const batch = db.batch();

    // Award points
    batch.update(db.collection('users').doc(userId), {
      points: admin.firestore.FieldValue.increment(pointsAwarded),
      instagram_follows: admin.firestore.FieldValue.increment(1)
    });

    // Record the follow
    batch.add(db.collection('instagram_follows'), {
      userId,
      brandId,
      brandHandle,
      brandName,
      reward,
      pointsAwarded,
      verified: true,
      verificationMethod: 'simulated',
      premiumMultiplier: isPremium ? 2 : 1,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log transaction
    batch.add(db.collection('transactions'), {
      userId,
      type: 'instagram_follow',
      description: `Followed ${brandHandle} on Instagram`,
      amount: pointsAwarded,
      brandId,
      brandName,
      multiplier: isPremium ? 2 : 1,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      pointsAwarded,
      message: `Successfully followed ${brandHandle}!`
    };
  } catch (error) {
    console.error('Verify Instagram follow error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// SPONSORED MISSIONS - Claim Sponsored Mission Rewards
// ============================================================================

export const claimSponsoredMission = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { missionId, brand, baseReward } = data;
    const userId = context.auth.uid;

    if (!missionId || !baseReward) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing mission data');
    }

    // Check if mission already completed
    const completionQuery = await db
      .collection('sponsored_mission_completions')
      .where('userId', '==', userId)
      .where('missionId', '==', missionId)
      .get();

    if (completionQuery.size > 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Mission already completed');
    }

    // Get user data to check premium status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const isPremium = user.premiumTier && user.premiumUntil &&
      new Date(user.premiumUntil) > new Date();

    // Calculate final reward
    const pointsAwarded = isPremium ? Math.floor(baseReward * 2) : baseReward;

    // Execute atomic transaction
    const batch = db.batch();

    // Award points
    batch.update(db.collection('users').doc(userId), {
      points: admin.firestore.FieldValue.increment(pointsAwarded),
      totalEarnings: admin.firestore.FieldValue.increment(pointsAwarded)
    });

    // Log mission completion
    batch.add(db.collection('sponsored_mission_completions'), {
      userId,
      missionId,
      brand,
      pointsEarned: baseReward,
      pointsAwarded,
      premiumMultiplier: isPremium ? 2 : 1,
      completedDate: new Date().toDateString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log transaction
    batch.add(db.collection('transactions'), {
      userId,
      type: 'sponsored_mission',
      description: `Sponsored mission from ${brand}`,
      amount: pointsAwarded,
      missionId,
      brand,
      multiplier: isPremium ? 2 : 1,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      pointsAwarded,
      message: `Mission claimed! Earned ${pointsAwarded} points`
    };
  } catch (error) {
    console.error('Claim sponsored mission error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
