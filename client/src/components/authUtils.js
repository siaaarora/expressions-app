export const getUserInfo = () => {
  // const userString = localStorage.getItem('user');
  // return userString ? JSON.parse(userString) : null;
  return localStorage.getItem('user');
};

export const signOut = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('name');
};