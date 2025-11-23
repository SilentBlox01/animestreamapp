import { User } from '../types';

const USERS_KEY = 'anistream_users_db';
const PENDING_VERIFICATIONS_KEY = 'anistream_pending_verifications';
const ENCRYPTION_KEY = 'ani_stream_super_secret_key_2024'; // Clave para el cifrado XOR

interface StoredUser extends User {
  passwordHash: string;
}

interface PendingVerification {
  email: string;
  username: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
}

// --- UTILIDADES DE CIFRADO ---

// Cifra datos convirtiéndolos a string, aplicando XOR con la clave y codificando en Base64
// Se usa encodeURIComponent para manejar caracteres Unicode (tildes, emojis) de forma segura antes de btoa
const encrypt = (data: any): string => {
  try {
    const json = JSON.stringify(data);
    const text = encodeURIComponent(json); // Escape unicode chars
    const result = text.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }).join('');
    return btoa(result);
  } catch (e) {
    console.error("Error al cifrar datos", e);
    return "";
  }
};

// Descifra datos decodificando Base64, aplicando XOR inverso y parseando JSON
const decrypt = <T>(ciphertext: string | null): T | null => {
  if (!ciphertext) return null;
  try {
    const raw = atob(ciphertext);
    const text = raw.split('').map((c, i) => {
      return String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
    }).join('');
    return JSON.parse(decodeURIComponent(text));
  } catch (e) {
    console.error("Error al descifrar datos (reiniciando almacenamiento)", e);
    // If decryption fails (e.g., corrupted data or old format), return null to reset
    return null;
  }
};

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- GESTIÓN DE DATOS ---

// Get all users from local storage (Decrypted)
const getUsers = (): StoredUser[] => {
  const users = decrypt<StoredUser[]>(localStorage.getItem(USERS_KEY));
  return users || [];
};

// Save users to local storage (Encrypted)
const saveUser = (user: StoredUser) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, encrypt(users));
};

// Get pending verifications (Decrypted)
const getPendingVerifications = (): Record<string, PendingVerification> => {
  return decrypt<Record<string, PendingVerification>>(localStorage.getItem(PENDING_VERIFICATIONS_KEY)) || {};
};

// Save pending verifications (Encrypted)
const savePendingVerifications = (data: Record<string, PendingVerification>) => {
  localStorage.setItem(PENDING_VERIFICATIONS_KEY, encrypt(data));
};

// --- SERVICIOS PÚBLICOS ---

// Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  await delay(500);
  const users = getUsers();
  return users.some(u => u.email === email);
};

// Step 1: Request Registration (Send Code)
export const requestRegistration = async (username: string, email: string, password: string): Promise<boolean> => {
  await delay(800);

  const users = getUsers();
  if (users.some(u => u.email === email)) {
    throw new Error('Este correo electrónico ya está registrado.');
  }
  if (users.some(u => u.name === username)) {
    throw new Error('Este nombre de usuario ya está en uso.');
  }

  // Generate 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store pending verification encrypted
  const pending: PendingVerification = {
    email,
    username,
    passwordHash: password, // In a real backend, hash this immediately with bcrypt/argon2
    code,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  };
  
  const pendingList = getPendingVerifications();
  pendingList[email] = pending;
  savePendingVerifications(pendingList);

  // SIMULATE SENDING EMAIL
  console.group('%c 📧 [Simulación de Correo] AniStream ', 'color: #ff3d71; background: #222; padding: 4px; border-radius: 4px; font-weight: bold; font-size: 14px;');
  console.log('%cDe: %canistreamservice@gmail.com', 'font-weight: bold; color: #aaa;', 'color: #fff; font-weight: bold;');
  console.log(`%cPara: %c${email}`, 'font-weight: bold; color: #aaa;', 'color: #fff;');
  console.log(`%cAsunto: %cTu código de verificación de AniStream`, 'font-weight: bold; color: #aaa;', 'color: #fff;');
  console.log('%c--------------------------------------------------', 'color: #444;');
  console.log(`Hola ${username}, tu código de verificación es:`);
  console.log(`%c ${code} `, 'background: #ff3d71; color: #fff; font-size: 24px; padding: 8px 16px; border-radius: 8px; margin: 10px 0; display: inline-block;');
  console.log('%c--------------------------------------------------', 'color: #444;');
  console.groupEnd();

  return true;
};

// Step 2: Verify Code and Create Account
export const verifyAndRegister = async (email: string, code: string): Promise<User> => {
  await delay(800);

  const pendingList = getPendingVerifications();
  const pending: PendingVerification | undefined = pendingList[email];

  if (!pending) {
    throw new Error('No hay una solicitud de registro pendiente para este correo.');
  }

  if (Date.now() > pending.expiresAt) {
    throw new Error('El código ha expirado. Por favor regístrate de nuevo.');
  }

  if (pending.code !== code) {
    throw new Error('Código incorrecto. Inténtalo de nuevo.');
  }

  // Success: Create User
  const newUser: StoredUser = {
    id: Date.now().toString(),
    name: pending.username,
    email: pending.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pending.username}&backgroundColor=b6e3f4`,
    passwordHash: pending.passwordHash
  };

  saveUser(newUser);

  // Clean up pending
  delete pendingList[email];
  savePendingVerifications(pendingList);

  // Return public user info
  const { passwordHash, ...userToReturn } = newUser;
  return userToReturn;
};

// Login
export const loginUser = async (email: string, password: string): Promise<User> => {
  await delay(1000);
  
  const users = getUsers();
  const user = users.find(u => u.email === email && u.passwordHash === password);

  if (!user) {
    throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
  }

  const { passwordHash, ...userToReturn } = user;
  return userToReturn;
};