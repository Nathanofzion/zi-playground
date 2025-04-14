import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { default as Axios } from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const axios = Axios.create({
  baseURL: supabaseUrl,
})

export const handleRegister = async () => {
  try {
    const { data: options } = await axios.get('/generate-registration-options');
    const regResponse = await startRegistration(options);
    const { data: result } = await axios.post('/verify-registration', regResponse);
    return result;
  } catch (error) {
    console.error('Error during registration:', error);
  }
};

export const handleLogin = async () => {
  try {
    const { data: options } = await axios.get('/generate-authentication-options');
    const authResponse = await startAuthentication(options);
    const { data: result } = await axios.post('/verify-authentication', authResponse);
    return result;
  } catch (error) {
    console.error('Error during authentication:', error);
  }
};
