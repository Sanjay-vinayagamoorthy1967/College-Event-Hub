export const validatePhoneNumber = (phone) => {
  if (!phone) return "Phone number is required";
  
  // Reject non-numeric characters (alphabets, spaces, special characters)
  if (!/^\d+$/.test(phone)) {
    return "Phone number must contain only numbers";
  }
  
  // Must be exactly 10 digits and start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return "Please enter a valid 10-digit Indian mobile number";
  }
  
  return true; // Valid
};
