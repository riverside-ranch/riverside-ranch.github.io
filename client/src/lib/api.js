import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fbLimit, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// ─── Helpers ───────────────────────────────────────────────────

function snapToData(snap) {
  return { id: snap.id, ...snap.data() };
}

function snapsToData(querySnap) {
  return querySnap.docs.map(snapToData);
}

async function logActivity(userId, userName, action, entityType, entityId) {
  await addDoc(collection(db, 'activity'), {
    userId, userName, action, entityType, entityId,
    createdAt: serverTimestamp(),
  });
}

// ─── Orders ────────────────────────────────────────────────────

export const orders = {
  async list({ status, search } = {}) {
    const constraints = [orderBy('createdAt', 'desc')];
    if (status) constraints.unshift(where('status', '==', status));

    const snap = await getDocs(query(collection(db, 'orders'), ...constraints));
    let data = snapsToData(snap);

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(o =>
        o.customerName.toLowerCase().includes(s) ||
        o.description.toLowerCase().includes(s)
      );
    }

    return data;
  },

  async get(id) {
    const snap = await getDoc(doc(db, 'orders', id));
    if (!snap.exists()) throw new Error('Order not found');
    return snapToData(snap);
  },

  async create(data, user) {
    const docRef = await addDoc(collection(db, 'orders'), {
      customerName: data.customerName,
      contactInfo: data.contactInfo,
      description: data.description,
      price: Number(data.price) || 0,
      depositPaid: Number(data.depositPaid) || 0,
      notes: data.notes || '',
      status: 'outstanding',
      assignedTo: data.assignedTo || null,
      assignedToName: data.assignedToName || null,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Created order for ${data.customerName}`, 'order', docRef.id);
    return { id: docRef.id };
  },

  async update(id, data, user) {
    await updateDoc(doc(db, 'orders', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const label = data.status ? ` → ${data.status}` : '';
    await logActivity(user.uid, user.displayName, `Updated order${label}`, 'order', id);
  },

  async delete(id, user) {
    await deleteDoc(doc(db, 'orders', id));
    await logActivity(user.uid, user.displayName, 'Deleted an order', 'order', id);
  },

  async stats() {
    const snap = await getDocs(collection(db, 'orders'));
    const all = snapsToData(snap);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOutstanding = all
      .filter(o => o.status === 'outstanding')
      .reduce((sum, o) => sum + Number(o.price || 0), 0);

    const totalDeposits = all
      .filter(o => o.status !== 'delivered')
      .reduce((sum, o) => sum + Number(o.depositPaid || 0), 0);

    const completedToday = all.filter(o => {
      if (o.status !== 'delivered') return false;
      const updated = o.updatedAt?.toDate?.() || new Date(0);
      return updated >= today;
    }).length;

    const pendingDeliveries = all.filter(o => o.status === 'ready').length;

    return { totalOutstanding, totalDeposits, completedToday, pendingDeliveries };
  },
};

// ─── Quotes ────────────────────────────────────────────────────

export const quotes = {
  async list({ status, search } = {}) {
    const constraints = [orderBy('createdAt', 'desc')];
    if (status) constraints.unshift(where('status', '==', status));

    const snap = await getDocs(query(collection(db, 'quotes'), ...constraints));
    let data = snapsToData(snap);

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(q =>
        q.customerName.toLowerCase().includes(s) ||
        q.requestedItems.toLowerCase().includes(s)
      );
    }

    return data;
  },

  async create(data, user) {
    const docRef = await addDoc(collection(db, 'quotes'), {
      customerName: data.customerName,
      contactInfo: data.contactInfo,
      requestedItems: data.requestedItems,
      estimatedPrice: Number(data.estimatedPrice) || 0,
      notes: data.notes || '',
      status: 'pending',
      convertedOrderId: null,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Created quote for ${data.customerName}`, 'quote', docRef.id);
    return { id: docRef.id };
  },

  async update(id, data) {
    await updateDoc(doc(db, 'quotes', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id, user) {
    await deleteDoc(doc(db, 'quotes', id));
    await logActivity(user.uid, user.displayName, 'Deleted a quote', 'quote', id);
  },

  async convert(id, user) {
    const quoteSnap = await getDoc(doc(db, 'quotes', id));
    if (!quoteSnap.exists()) throw new Error('Quote not found');
    const q = quoteSnap.data();

    // Create order from quote
    const orderRef = await addDoc(collection(db, 'orders'), {
      customerName: q.customerName,
      contactInfo: q.contactInfo,
      description: q.requestedItems,
      price: q.estimatedPrice,
      depositPaid: 0,
      notes: q.notes || '',
      status: 'outstanding',
      assignedTo: null,
      assignedToName: null,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Mark quote as accepted
    await updateDoc(doc(db, 'quotes', id), {
      status: 'accepted',
      convertedOrderId: orderRef.id,
      updatedAt: serverTimestamp(),
    });

    await logActivity(user.uid, user.displayName, `Converted quote for ${q.customerName} to order`, 'quote', id);
    return { id: orderRef.id };
  },
};

// ─── Misc Logs ─────────────────────────────────────────────────

export const logs = {
  async list({ category, max } = {}) {
    const constraints = [orderBy('createdAt', 'desc')];
    if (category && category !== 'all') constraints.unshift(where('category', '==', category));
    if (max) constraints.push(fbLimit(max));

    const snap = await getDocs(query(collection(db, 'misc_logs'), ...constraints));
    return snapsToData(snap);
  },

  async create(data, user) {
    const docRef = await addDoc(collection(db, 'misc_logs'), {
      userId: user.uid,
      userName: user.displayName,
      description: data.description,
      amount: data.amount ? Number(data.amount) : null,
      category: data.category || 'misc',
      createdAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Logged: ${data.description}`, 'log', docRef.id);
    return { id: docRef.id };
  },

  async delete(id, user) {
    await deleteDoc(doc(db, 'misc_logs', id));
    await logActivity(user.uid, user.displayName, 'Deleted a log entry', 'log', id);
  },
};

// ─── Todos ─────────────────────────────────────────────────────

export const todos = {
  async list() {
    const snap = await getDocs(query(collection(db, 'todos'), orderBy('sortOrder', 'asc')));
    return snapsToData(snap);
  },

  async create(data, user) {
    const docRef = await addDoc(collection(db, 'todos'), {
      title: data.title,
      description: data.description || '',
      assignedRole: data.assignedRole || null,
      isCompleted: false,
      completedBy: null,
      completedByName: null,
      completedAt: null,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      sortOrder: Number(data.sortOrder) || 0,
    });
    await logActivity(user.uid, user.displayName, `Added task: ${data.title}`, 'todo', docRef.id);
    return { id: docRef.id };
  },

  async update(id, data) {
    await updateDoc(doc(db, 'todos', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async toggle(id, user) {
    const snap = await getDoc(doc(db, 'todos', id));
    if (!snap.exists()) throw new Error('Todo not found');
    const todo = snap.data();
    const completing = !todo.isCompleted;

    const updates = {
      isCompleted: completing,
      completedBy: completing ? user.uid : null,
      completedByName: completing ? user.displayName : null,
      completedAt: completing ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'todos', id), updates);
    await logActivity(user.uid, user.displayName, `${completing ? 'Completed' : 'Unchecked'} task: ${todo.title}`, 'todo', id);
    return { id, ...todo, ...updates, completedAt: completing ? new Date() : null };
  },

  async delete(id, user) {
    await deleteDoc(doc(db, 'todos', id));
    await logActivity(user.uid, user.displayName, 'Deleted a task', 'todo', id);
  },
};

// ─── Posters ───────────────────────────────────────────────────

export const posters = {
  async list() {
    const snap = await getDocs(query(collection(db, 'posters'), orderBy('createdAt', 'desc')));
    return snapsToData(snap);
  },

  async upload(file, title, user) {
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const storageRef = ref(storage, `posters/${fileName}`);

    await uploadBytes(storageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(storageRef);

    const docRef = await addDoc(collection(db, 'posters'), {
      title,
      imageUrl,
      storagePath: `posters/${fileName}`,
      uploadedBy: user.uid,
      createdAt: serverTimestamp(),
    });

    await logActivity(user.uid, user.displayName, `Uploaded poster: ${title}`, 'poster', docRef.id);
    return { id: docRef.id, imageUrl };
  },

  async delete(id, user) {
    const snap = await getDoc(doc(db, 'posters', id));
    if (!snap.exists()) throw new Error('Poster not found');

    const poster = snap.data();
    try {
      await deleteObject(ref(storage, poster.storagePath));
    } catch {
      // Storage file may already be gone
    }

    await deleteDoc(doc(db, 'posters', id));
    await logActivity(user.uid, user.displayName, `Deleted poster: ${poster.title}`, 'poster', id);
  },
};

// ─── Activity ──────────────────────────────────────────────────

export const activity = {
  async list({ max = 20 } = {}) {
    const snap = await getDocs(
      query(collection(db, 'activity'), orderBy('createdAt', 'desc'), fbLimit(max))
    );
    return snapsToData(snap);
  },
};

// ─── Users ─────────────────────────────────────────────────────

export const users = {
  async get(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snapToData(snap);
  },

  async list() {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('displayName')));
    return snapsToData(snap);
  },
};
