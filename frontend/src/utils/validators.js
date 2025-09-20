import { VALIDATION } from './constants';

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!VALIDATION.EMAIL.test(email)) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
    return `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters long`;
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateISBN = (isbn) => {
  if (!isbn) return 'ISBN is required';
  
  // Remove any hyphens or spaces
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  
  if (cleanIsbn.length !== VALIDATION.ISBN.LENGTH_10 && 
      cleanIsbn.length !== VALIDATION.ISBN.LENGTH_13) {
    return 'ISBN must be 10 or 13 digits long';
  }
  
  if (!/^\d+$/.test(cleanIsbn)) {
    return 'ISBN must contain only numbers';
  }
  
  return null;
};

export const validatePhoneNumber = (phone) => {
  if (!phone) return null; // Phone is optional
  
  const cleaned = phone.replace(/[-\s()]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
    return 'Please enter a valid phone number';
  }
  return null;
};

export const validateDate = (date) => {
  if (!date) return 'Date is required';
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return 'Please enter a valid date';
  }
  
  if (parsedDate > new Date()) {
    return 'Date cannot be in the future';
  }
  
  return null;
};

export const validateFutureDate = (date) => {
  if (!date) return 'Date is required';
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return 'Please enter a valid date';
  }
  
  if (parsedDate <= new Date()) {
    return 'Date must be in the future';
  }
  
  return null;
};

export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (min !== null && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== null && num > max) {
    return `${fieldName} cannot exceed ${max}`;
  }
  
  return null;
};

export const validatePositiveNumber = (value, fieldName) => {
  return validateNumber(value, fieldName, 0);
};

export const validateUrl = (url) => {
  if (!url) return null; // URL is optional
  
  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
};

export const validateFile = (file, maxSizeMB = 5, allowedTypes = []) => {
  if (!file) return null; // File is optional
  
  if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be less than ${maxSizeMB}MB`;
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }
  
  return null;
};