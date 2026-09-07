import { AppUser, RolePermission, UserRole, NavTab } from '../types';
import { initialUsers, ROLE_PERMISSIONS } from '../data/initialUsers';
import { safeStorage } from '../utils/safeStorage';
import { getRtLogo, RT_LOGOS, LOGO_RW_018 } from '../constants/logo';
import {
  saveDocumentOnline,
  deleteDocumentOnline,
  subscribeToCollection,
  subscribeToDocument
} from './firebase';

const AUTH_STORAGE_KEYS = {
  CURRENT_USER: 'rw018_auth_current_user_v2',
  USERS_LIST: 'rw018_auth_users_list_v2',
  ROLE_PERMISSIONS: 'rw018_auth_role_permissions_v3',
};

type AuthListener = (user: AppUser | null) => void;
const authListeners = new Set<AuthListener>();

function notifyAuthChange(user: AppUser | null) {
  authListeners.forEach((l) => l(user));
}

export function subscribeToAuth(listener: AuthListener) {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

let hasInitializedUsersFirestoreSync = false;

// Initialize online real-time sync for user accounts
export function initUsersFirestoreSync() {
  if (hasInitializedUsersFirestoreSync) return;
  hasInitializedUsersFirestoreSync = true;

  try {
    subscribeToCollection<AppUser>('users', (cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        saveUsersListLocally(cloudUsers);
        const current = getCurrentUser();
        if (current) {
          const fresh = cloudUsers.find((u) => u.id === current.id);
          if (fresh) {
            safeStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(fresh));
            notifyAuthChange(fresh);
          }
        }
      } else {
        // First boot: seed initial users to Firestore
        initialUsers.forEach((user) => {
          saveDocumentOnline('users', user.id, user);
        });
      }
    });

    // Subscribe to dynamic role permissions
    subscribeToDocument<{ permissions?: Record<string, RolePermission> }>('settings', 'role_permissions', (docData) => {
      if (docData && docData.permissions) {
        safeStorage.setItem(AUTH_STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(docData.permissions));
        notifyAuthChange(getCurrentUser());
      }
    });
  } catch (err) {
    console.warn('[Firestore] Could not sync users collection:', err);
  }
}

if (typeof window !== 'undefined') {
  initUsersFirestoreSync();
}

function saveUsersListLocally(users: AppUser[]): void {
  try {
    safeStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users list locally:', error);
  }
}

// Get all users from storage with robust default fallback recovery
export function getUsersList(): AppUser[] {
  try {
    const raw = safeStorage.getItem(AUTH_STORAGE_KEYS.USERS_LIST);
    if (!raw) {
      safeStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(initialUsers));
      return initialUsers;
    }
    
    let parsed: AppUser[] = [];
    try {
      parsed = JSON.parse(raw);
    } catch {
      safeStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(initialUsers));
      return initialUsers;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      safeStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(initialUsers));
      return initialUsers;
    }

    let hasChanges = false;

    // 1. Sanitize & ensure each existing user has their full registered default name, avatar, and credentials
    const sanitized = parsed.map((u) => {
      let updatedUser = { ...u };
      const defaultUser = initialUsers.find(
        (iu) => iu.username.toLowerCase() === (u.username || '').toLowerCase() || iu.id === u.id
      );

      // Restore default nama if missing, empty, or old placeholder names
      if (defaultUser) {
        if (
          !updatedUser.nama ||
          updatedUser.nama.trim() === '' ||
          updatedUser.nama === 'Eko Purwanto' ||
          updatedUser.nama === 'Eko Purwanto S. Kom' ||
          updatedUser.nama.includes('Yuwono') ||
          updatedUser.nama.includes('Bambang Supriyadi') ||
          updatedUser.nama.includes('Siti Rahmawati') ||
          updatedUser.nama.includes('Syamsuri')
        ) {
          if (updatedUser.nama !== defaultUser.nama) {
            hasChanges = true;
            updatedUser.nama = defaultUser.nama;
          }
        }
      }

      // Restore default avatar if missing, empty, or placeholder
      if (!updatedUser.avatarUrl || updatedUser.avatarUrl.trim() === '') {
        if (defaultUser?.avatarUrl) {
          hasChanges = true;
          updatedUser.avatarUrl = defaultUser.avatarUrl;
        } else {
          hasChanges = true;
          updatedUser.avatarUrl = getUserPhotoUrl(updatedUser, updatedUser.nama);
        }
      }

      // RT Logo synchronization for Ketua RT
      if (u.role === 'ketua_rt' || (u.rtAccess && u.rtAccess !== 'ALL')) {
        const rtLogo = getRtLogo(u.rtAccess);
        if (rtLogo && (!updatedUser.avatarUrl || updatedUser.avatarUrl.includes('unsplash.com') || updatedUser.avatarUrl.trim() === '')) {
          hasChanges = true;
          updatedUser.avatarUrl = rtLogo;
        }
      }

      // Sanitize any deprecated default passwords (admin123 or 123)
      if (u.password === 'admin123' || u.password === '123') {
        hasChanges = true;
        updatedUser.password = '@Ayahibu99';
      }

      // Initialize default biometric flags if undefined
      if (updatedUser.fingerprintEnabled === undefined) {
        hasChanges = true;
        updatedUser.fingerprintEnabled = true;
      }
      if (updatedUser.faceRecognitionEnabled === undefined) {
        hasChanges = true;
        updatedUser.faceRecognitionEnabled = true;
      }
      if (!updatedUser.biometricRegisteredAt) {
        hasChanges = true;
        updatedUser.biometricRegisteredAt = '2026-08-20T08:00:00.000Z';
      }

      return updatedUser;
    });

    // 2. Ensure all core initialUsers exist in the list (if any were accidentally deleted or lost in error)
    initialUsers.forEach((defUser) => {
      const exists = sanitized.some(
        (u) => u.username.toLowerCase() === defUser.username.toLowerCase() || u.id === defUser.id
      );
      if (!exists) {
        hasChanges = true;
        sanitized.push({ ...defUser });
      }
    });

    if (hasChanges) {
      safeStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (error) {
    console.error('Failed to get users list from storage, restoring default initialUsers:', error);
    safeStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(initialUsers));
    return initialUsers;
  }
}

// Get realistic photo URL for user with robust fallback to default registered photos
export function getUserPhotoUrl(user: AppUser | null, fallbackNama?: string): string {
  if (user?.avatarUrl && user.avatarUrl.trim() !== '') return user.avatarUrl;
  
  // 1. If user matches any registered username in initialUsers, return that official default avatar
  if (user?.username) {
    const foundByUsername = initialUsers.find(
      (u) => u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (foundByUsername?.avatarUrl) return foundByUsername.avatarUrl;
  }

  // 2. If user matches by id in initialUsers
  if (user?.id) {
    const foundById = initialUsers.find((u) => u.id === user.id);
    if (foundById?.avatarUrl) return foundById.avatarUrl;
  }

  // 3. If user is ketua_rt or has RT access, return official RT Logo
  if (user?.role === 'ketua_rt' || (user?.rtAccess && user.rtAccess !== 'ALL')) {
    const rtLogo = getRtLogo(user?.rtAccess);
    if (rtLogo) return rtLogo;
  }
  
  // 4. Role-based official default fallbacks
  if (user?.role === 'admin_rw') {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
  } else if (user?.role === 'sekretaris') {
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80';
  } else if (user?.role === 'bendahara') {
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
  } else if (user?.role === 'ketua_rt') {
    return getRtLogo(user?.rtAccess) || LOGO_RW_018;
  } else if (user?.role === 'keamanan') {
    return 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';
  } else if (user?.role === 'pengurus_rkm') {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  } else if (user?.role === 'warga') {
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
  }

  const name = user?.nama || fallbackNama || 'Pengurus RW';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=047857&color=ffffff&bold=true&size=256`;
}

// Save users list
export function saveUsersList(users: AppUser[]): void {
  saveUsersListLocally(users);
  // Also push all users to Firestore
  users.forEach((u) => {
    saveDocumentOnline('users', u.id, u);
  });
}

// Get currently logged-in user
export function getCurrentUser(): AppUser | null {
  try {
    const raw = safeStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    const user = JSON.parse(raw) as AppUser;
    // Verify user still exists in users list
    const allUsers = getUsersList();
    const existing = allUsers.find((u) => u.id === user.id);
    return existing || user;
  } catch (error) {
    console.error('Failed to get current user from storage:', error);
    return null;
  }
}

// Set current user session
export function setCurrentUser(user: AppUser | null): void {
  try {
    if (user) {
      safeStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      safeStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    }
    notifyAuthChange(user);
  } catch (error) {
    console.error('Failed to set current user in storage:', error);
  }
}

// Authenticate user with username and password
export function loginUser(username: string, password?: string): { success: boolean; user?: AppUser; message?: string } {
  const users = getUsersList();
  const trimmedUser = username.trim().toLowerCase();
  
  const foundUser = users.find(
    (u) => u.username.toLowerCase() === trimmedUser
  );

  if (!foundUser) {
    return { success: false, message: 'Username tidak ditemukan di database pengurus RW 018.' };
  }

  if (!foundUser.isActive) {
    return { success: false, message: 'Akun ini sedang dinonaktifkan oleh Administrator RW.' };
  }

  // If user role is 'warga', allow instant login without password requirement
  if (foundUser.role === 'warga') {
    // Warga does not require password verification
  } else {
    // Password check for admins and officers: ONLY verify against the exact registered password
    const inputPass = (password || '').trim();
    if (!inputPass) {
      return { success: false, message: 'Silakan masukkan kata sandi Anda.' };
    }

    // Strict validation: only the exact registered password (foundUser.password) is valid
    const isValid = foundUser.password === inputPass;

    if (!isValid) {
      return { success: false, message: 'Kata sandi salah. Hanya bisa masuk dengan kata sandi terdaftar yang benar.' };
    }
  }

  // Update last login
  const updatedUser: AppUser = {
    ...foundUser,
    lastLogin: new Date().toISOString(),
  };

  const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  saveUsersListLocally(updatedUsers);
  saveDocumentOnline('users', updatedUser.id, updatedUser);
  setCurrentUser(updatedUser);

  return { success: true, user: updatedUser };
}

// Authenticate user with Biometrics (Fingerprint / Sidik Jari or Face Recognition / Pengenalan Wajah)
export function loginWithBiometric(
  username: string,
  biometricType: 'fingerprint' | 'face' = 'fingerprint'
): { success: boolean; user?: AppUser; message?: string } {
  const users = getUsersList();
  const trimmedUser = username.trim().toLowerCase();
  
  const foundUser = users.find(
    (u) => u.username.toLowerCase() === trimmedUser
  );

  if (!foundUser) {
    return { success: false, message: 'User Tidak Terdaftar' };
  }

  if (!foundUser.isActive) {
    return { success: false, message: 'User Tidak Terdaftar' };
  }

  // Check if biometric option is enabled for this user
  if (biometricType === 'fingerprint' && foundUser.fingerprintEnabled === false) {
    return {
      success: false,
      message: 'User Tidak Terdaftar',
    };
  }

  if (biometricType === 'face' && foundUser.faceRecognitionEnabled === false) {
    return {
      success: false,
      message: 'User Tidak Terdaftar',
    };
  }

  // Update last login
  const updatedUser: AppUser = {
    ...foundUser,
    lastLogin: new Date().toISOString(),
  };

  const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  saveUsersListLocally(updatedUsers);
  saveDocumentOnline('users', updatedUser.id, updatedUser);
  setCurrentUser(updatedUser);

  return { success: true, user: updatedUser };
}

// Update specific user biometric settings
export function updateUserBiometrics(
  userId: string,
  settings: {
    fingerprintEnabled?: boolean;
    faceRecognitionEnabled?: boolean;
  }
): boolean {
  const users = getUsersList();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const target = users[index];
  const updated: AppUser = {
    ...target,
    fingerprintEnabled: settings.fingerprintEnabled !== undefined ? settings.fingerprintEnabled : target.fingerprintEnabled,
    faceRecognitionEnabled: settings.faceRecognitionEnabled !== undefined ? settings.faceRecognitionEnabled : target.faceRecognitionEnabled,
    biometricRegisteredAt: new Date().toISOString(),
  };

  users[index] = updated;
  saveUsersListLocally(users);
  saveDocumentOnline('users', updated.id, updated);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(updated);
  }
  return true;
}

// Check if user has Super Admin (SA) authority
export function isUserSuperAdmin(user?: AppUser | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const username = (user.username || '').toLowerCase();
  return (
    role === 'super_admin' ||
    role === 'admin_rw' ||
    username === 'superadmin' ||
    username === 'sa' ||
    username === 'admin'
  );
}

// Check if user has Ketua RW or Super Admin (SA) authority
export function isKetuaRWOrSuperAdmin(user?: AppUser | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const username = (user.username || '').toLowerCase();
  return (
    role === 'super_admin' ||
    role === 'ketua_rw' ||
    role === 'admin_rw' ||
    username === 'superadmin' ||
    username === 'sa' ||
    username === 'admin' ||
    username === 'ketuarw'
  );
}

// Logout
export function logoutUser(): void {
  setCurrentUser(null);
}

// Get all dynamic role permissions (with fallback to default)
export function getAllRolePermissions(): Record<string, RolePermission> {
  try {
    const raw = safeStorage.getItem(AUTH_STORAGE_KEYS.ROLE_PERMISSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with default ROLE_PERMISSIONS to ensure no missing roles or fields
      const merged: Record<string, RolePermission> = { ...ROLE_PERMISSIONS, ...parsed };
      if (!merged.pengurus_dkm && merged.pengurus_rkm) {
        merged.pengurus_dkm = {
          ...merged.pengurus_rkm,
          role: 'pengurus_dkm',
          roleLabel: 'Pengurus DKM (Masjid & Keagamaan)',
        };
      }
      return merged;
    }
  } catch (err) {
    console.error('Error reading role permissions from storage:', err);
  }
  return { ...ROLE_PERMISSIONS };
}

// Get role permission config
export function getRolePermission(role?: UserRole): RolePermission {
  const defaultRole: UserRole = 'warga';
  const all = getAllRolePermissions();
  if (!role) return all[defaultRole] || ROLE_PERMISSIONS[defaultRole];
  
  if (role === 'pengurus_dkm' && !all.pengurus_dkm) {
    return all.pengurus_rkm || ROLE_PERMISSIONS.pengurus_dkm || ROLE_PERMISSIONS.pengurus_rkm;
  }
  if (role === 'pengurus_rkm' && !all.pengurus_rkm) {
    return all.pengurus_dkm || ROLE_PERMISSIONS.pengurus_rkm;
  }
  
  return all[role] || ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[defaultRole];
}

// Save role permissions updated by Ketua RW (Super Admin)
export function saveRolePermissions(permissions: Record<string, RolePermission>): void {
  try {
    safeStorage.setItem(AUTH_STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(permissions));
    // Sync to Firestore
    saveDocumentOnline('settings', 'role_permissions', {
      permissions,
      updatedAt: new Date().toISOString(),
      updatedBy: getCurrentUser()?.username || 'admin_rw',
    });
    // Notify listeners so UI updates instantly
    notifyAuthChange(getCurrentUser());
  } catch (err) {
    console.error('Error saving role permissions:', err);
  }
}

// Reset role permissions to official defaults
export function resetRolePermissionsToDefault(): void {
  try {
    safeStorage.removeItem(AUTH_STORAGE_KEYS.ROLE_PERMISSIONS);
    saveDocumentOnline('settings', 'role_permissions', {
      permissions: ROLE_PERMISSIONS,
      updatedAt: new Date().toISOString(),
      updatedBy: 'reset_default',
    });
    notifyAuthChange(getCurrentUser());
  } catch (err) {
    console.error('Error resetting role permissions:', err);
  }
}

// Helper to test if data's RT matches the user's assigned RT
export function isMatchingRt(dataRt?: string, userRt?: string): boolean {
  if (!userRt || userRt === 'ALL' || userRt === 'all') return true;
  if (!dataRt) return false;
  const cleanData = dataRt.trim().replace(/^0+/, '');
  const cleanUser = userRt.trim().replace(/^0+/, '');
  return cleanData === cleanUser || dataRt.trim().toLowerCase() === userRt.trim().toLowerCase();
}

// Get RT restriction for user (returns e.g. '039' if user is a Ketua RT with specific RT assignment)
export function getUserRestrictedRt(user?: AppUser | null): string | null {
  if (!user) return null;
  // Ketua RW, Ketua RKM, Pos Ronda / Keamanan, Sekretaris, Bendahara, and Admin have access to ALL RTs
  if (user.role !== 'ketua_rt') return null;
  if (user.role === 'ketua_rt' && user.rtAccess && user.rtAccess !== 'ALL') {
    return user.rtAccess;
  }
  return null;
}

// Check if user can access a specific tab
export function canUserAccessTab(user: AppUser | null, tab: NavTab): boolean {
  if (!user) return false;
  // If user is admin_rw (Super Admin), dashboard and menu are always accessible
  if (user.role === 'admin_rw') {
    if (tab === 'dashboard' || tab === 'menu') return true;
    const perm = getRolePermission(user.role);
    return perm.allowedTabs ? perm.allowedTabs.includes(tab) : true;
  }
  const perm = getRolePermission(user.role);
  return perm.allowedTabs ? perm.allowedTabs.includes(tab) : false;
}

// Save or Update a User
export function saveUserAccount(user: AppUser): void {
  const list = getUsersList();
  const idx = list.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    list[idx] = user;
  } else {
    list.push(user);
  }
  saveUsersListLocally(list);
  saveDocumentOnline('users', user.id, user);
  
  const current = getCurrentUser();
  if (current && current.id === user.id) {
    setCurrentUser(user);
  }
}

// Delete user account
export function deleteUserAccount(userId: string): boolean {
  const list = getUsersList();
  const target = list.find((u) => u.id === userId);
  if (!target) return false;
  
  // Do not allow deleting super admin
  if (target.role === 'admin_rw' && target.username === 'ketuarw') {
    return false;
  }

  const updated = list.filter((u) => u.id !== userId);
  saveUsersListLocally(updated);
  deleteDocumentOnline('users', userId);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    logoutUser();
  }
  return true;
}

// Reset all users to default
export function resetUsersToDefault(): void {
  saveUsersList(initialUsers);
  const current = getCurrentUser();
  if (current) {
    const refreshed = initialUsers.find((u) => u.username === current.username);
    setCurrentUser(refreshed || initialUsers[0]);
  }
}
