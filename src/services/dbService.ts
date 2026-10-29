export async function adminLogin(pinCode: string): Promise<boolean> {
  // For a simple, reliable church admin portal, you can check against an environment variable or hardcoded secure PIN
  const adminPin = import.meta.env.VITE_ADMIN_PIN || '1234';
  return pinCode === adminPin;
}