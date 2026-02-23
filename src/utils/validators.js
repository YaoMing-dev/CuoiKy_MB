export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: '#E53935' };
  if (score <= 3) return { level: 2, label: 'Medium', color: '#FF9800' };
  if (score <= 4) return { level: 3, label: 'Strong', color: '#4CAF50' };
  return { level: 4, label: 'Very Strong', color: '#2E7D32' };
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};
