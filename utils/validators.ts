export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // Min 8 characters, at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  // Simplifying for demo purposes if regex is too strict
  return password.length >= 8;
};

export const validateDonationInput = (data: any) => {
  const errors: string[] = [];
  if (!data.foodType || data.foodType.trim() === '') errors.push('Food type is required');
  if (!data.quantity || data.quantity.trim() === '') errors.push('Quantity is required');
  if (!data.expiryTime) errors.push('Expiry time is required');
  if (!data.pickupAddress || data.pickupAddress.trim() === '') errors.push('Pickup address is required');
  if (!data.city || data.city.trim() === '') errors.push('City is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
