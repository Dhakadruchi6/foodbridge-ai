import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import dbConnect from '@/lib/db';
import User from '@/models/User';
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

  // 1. Check current status for better error messages
  const existingDonation = await Donation.findById(donationId);
  if (!existingDonation) {
    throw new AppError('Donation not found', 404);
  }

  if (existingDonation.status === 'accepted') {
    // Check if it's already accepted by THIS NGO
    const existingDelivery = await Delivery.findOne({ donationId, ngoId, status: { $in: ['accepted', 'pickup_in_progress', 'delivered', 'completed'] } });
    if (existingDelivery) {
      return { donation: existingDonation, delivery: existingDelivery };
    }
    throw new AppError('This donation has already been accepted by another NGO partner.', 400);
  }

  if (existingDonation.status !== 'pending_request' && existingDonation.status !== 'pending' && existingDonation.status !== 'request_sent') {
    throw new AppError(`Donation is currently in ${existingDonation.status} state and cannot be accepted.`, 400);
  }

  // 2. Atomic update to 'accepted'
  const donation = await Donation.findOneAndUpdate(
    { _id: donationId, status: { $in: ['pending_request', 'pending', 'request_sent'] } },
    {
      status: 'accepted',
      ngoId,
      acceptedAt: new Date()
    },
    { new: true }
  );

  if (!donation) {
    throw new AppError('Donation was just updated by another process. Please refresh.', 400);
  }

  // Find and update the existing 'pending' delivery record
  const delivery = await Delivery.findOneAndUpdate(
    { donationId: donation._id, ngoId, status: 'pending' },
    { status: 'accepted' },
    { new: true }
  );

  if (!delivery) {
    // If for some reason the delivery record is missing, create it
    const newDelivery = await Delivery.create({
      donationId: donation._id,
      ngoId,
      status: 'accepted',
    });

    // Cancel all other NGOs' pending requests for this donation
    await Delivery.updateMany(
      { donationId: donation._id, ngoId: { $ne: ngoId }, status: 'pending' },
      { status: 'rejected' }
    );

    return { donation, delivery: newDelivery };
  }

  // Cancel all other NGOs' pending requests for this donation (race condition cleanup)
  await Delivery.updateMany(
    { donationId: donation._id, ngoId: { $ne: ngoId }, status: 'pending' },
    { status: 'rejected' }
  );

  return { donation, delivery };
};

export const updateDeliveryLifecycle = async (deliveryId: string, nextStatus: string, ngoUserId: string) => {
  await dbConnect();

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new AppError('Delivery not found', 404);

  // Authorization check: Only the assigned NGO can update
  if (delivery.ngoId.toString() !== ngoUserId) {
    throw new AppError('Unauthorized: You are not assigned to this mission.', 403);
  }

  // Strict transition validation based on user request
  const validTransitions: Record<string, string[]> = {
    'accepted': ['on_the_way'],
    'on_the_way': ['arrived'],
    'arrived': ['collected'],
    'collected': ['delivered'],
    'delivered': ['completed'],
    'completed': [],
  };

  const allowed = validTransitions[delivery.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`Invalid transition from ${delivery.status} to ${nextStatus}`, 400);
  }

  // Apply updates
  const updateData: any = { status: nextStatus };
  const donationUpdate: any = { status: nextStatus };

  if (nextStatus === 'on_the_way') {
    updateData.pickupTime = new Date();
    donationUpdate.pickupTime = new Date();
  } else if (nextStatus === 'collected') {
    updateData.collectedAt = new Date();
    // No specific field in Donation for collectedAt yet, but we sync status
  } else if (nextStatus === 'delivered' || nextStatus === 'completed') {
    updateData.deliveryTime = new Date();
    donationUpdate.deliveredAt = new Date();
  }

  const updatedDelivery = await Delivery.findByIdAndUpdate(deliveryId, updateData, { new: true });

  // Sync Donation status and timestamps
  await Donation.findByIdAndUpdate(delivery.donationId, donationUpdate);

  return updatedDelivery;
};

export default {
  createDonation,
  getDonations,
  updateDonationStatus,
  acceptDonation,
  updateDeliveryLifecycle,
};
