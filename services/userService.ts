import User from '@/models/User';
import dbConnect from '@/lib/db';

export const createUser = async (userData: any) => {
  await dbConnect();
  const user = new User(userData);
  return await user.save();
};

export const getUserByEmail = async (email: string) => {
  await dbConnect();
  return await User.findOne({ email });
};

export const getUserById = async (id: string) => {
  await dbConnect();
  return await User.findById(id);
};

export default {
  createUser,
  getUserByEmail,
  getUserById,
};
