import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import dbConnect from '@/lib/db';
import { AppError } from '@/lib/errorHandler';

import { getUrgencyScore } from './mlService';

export const createDonation = async (donationData: any) => {
  await dbConnect();

  // Calculate initial urgency priority
  try {
    const expiryHours = Math.max(0, Math.floor((new Date(donationData.expiryTime).getTime() - Date.now()) / (1000 * 60 * 60)));

    // Default values if not provided
    const biodegradability = donationData.biodegradability || 0.5;
    const distance = 10; // Default distance for initial ranking

    // Map foodType to category index (0: cooked, 1: raw, 2: packaged)
    const foodType = String(donationData.foodType).toLowerCase();
    const foodCategory = foodType.includes('cooked') ? 0 : foodType.includes('raw') ? 1 : 2;

    const quantity = parseFloat(String(donationData.quantity)) || 10;

    const urgency = await getUrgencyScore(distance, quantity, expiryHours, foodCategory, biodegradability);
    donationData.prioritizationRank = urgency;
  } catch (err) {
    console.error("Failed to calculate initial urgency:", err);
    donationData.prioritizationRank = 0;
  }

  console.log(`[SERVICE-DONATION] Creating donation for donor: ${donationData.donorId}`);
  if (donationData.imageVerification) {
    console.log(`[SERVICE-DONATION] AI Confidence to save: ${donationData.imageVerification.aiConfidence}`);
  }

  const donation = new Donation(donationData);
  const savedDonation = await donation.save();
  console.log(`[SERVICE-DONATION] Saved donation ID: ${savedDonation._id}, Conf: ${savedDonation.imageVerification?.aiConfidence}`);
  return savedDonation;
};

export const getDonations = async (filter: any = {}) => {
  await dbConnect();
  // Sort by prioritizationRank first (highest urgency), then by creation date
  return await Donation.find(filter)
    .populate('donorId', 'name email phone')
    .sort({ prioritizationRank: -1, createdAt: -1 });
};

export const updateDonationStatus = async (id: string, status: string) => {
  await dbConnect();
  return await Donation.findByIdAndUpdate(id, { status }, { new: true });
};

export const acceptDonation = async (donationId: string, ngoId: string) => {
  await dbConnect();

  // Use a transaction or atomicity to prevent multiple NGOs from accepting
  const donation = await Donation.findOneAndUpdate(
    { _id: donationId, status: 'pending' },
    { status: 'accepted' },
    { new: true }
  );

  if (!donation) {
    throw new AppError('Donation not available or already accepted', 400);
  }

  // Create delivery record
  const delivery = await Delivery.create({
    donationId: donation._id,
    ngoId,
    status: 'assigned',
  });

  return { donation, delivery };
};

export default {
  createDonation,
  getDonations,
  updateDonationStatus,
  acceptDonation,
};
