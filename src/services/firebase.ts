import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  writeBatch,
  Firestore,
  Unsubscribe,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Configure log level to silent to prevent non-critical connection retry / offline notice warnings from flooding the console
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore log level errors if already configured
}

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore with robust auto-detection and local multi-tab cache for seamless iframe & web operation
function createFirestoreInstance(): Firestore {
  const dbId = firebaseConfig.firestoreDatabaseId || undefined;
  
  // Try initializing with multi-tab persistent cache and auto-detected long polling
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      dbId
    );
  } catch (err) {
    // If already initialized, fetch existing instance
    try {
      if (dbId) {
        return getFirestore(app, dbId);
      }
      return getFirestore(app);
    } catch (fallbackErr) {
      // Fallback with memory local cache if persistent cache is unavailable in iframe
      try {
        return initializeFirestore(
          app,
          {
            experimentalAutoDetectLongPolling: true,
            localCache: memoryLocalCache(),
          },
          dbId
        );
      } catch (memErr) {
        return dbId ? getFirestore(app, dbId) : getFirestore(app);
      }
    }
  }
}

export const db: Firestore = createFirestoreInstance();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('[Firestore Error]', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test with robust offline resilience and non-blocking background check
export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
    console.info('[Firestore] Running in offline mode (device currently offline).');
    return false;
  }

  try {
    // Graceful timeout for server connectivity check
    const checkPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    await Promise.race([checkPromise, timeoutPromise]);
    console.log('[Firestore] Connection validated successfully with server.');
    return true;
  } catch (error: any) {
    // Handle offline and unavailable connection status without crashing or throwing
    if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('timeout')) {
      console.info('[Firestore] Cloud database connection pending/offline. Offline local cache active.');
    } else {
      console.info('[Firestore] Status:', error?.message || error);
    }
    return false;
  }
}

// Non-blocking deferred connection test after page load
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    setTimeout(testFirestoreConnection, 1500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(testFirestoreConnection, 1500);
    });
  }
}

/**
 * Save a document to Firestore with offline fallback
 */
export async function saveDocumentOnline(collectionName: string, id: string, data: any): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    // Remove undefined values to prevent Firestore error
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
    return false;
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteDocumentOnline(collectionName: string, id: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    return false;
  }
}

/**
 * Subscribe to a collection in real time
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as T);
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return () => {};
  }
}

/**
 * Subscribe to a single document in real time
 */
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  onData: (data: T | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data() as T);
        } else {
          onData(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    return () => {};
  }
}

export {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  writeBatch
};
export type { Unsubscribe };


