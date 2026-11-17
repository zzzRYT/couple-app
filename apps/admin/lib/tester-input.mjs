export function validTesterChange(action, email) {
  return (action === 'add' || action === 'remove') && typeof email === 'string' && email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
