import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, orderBy, limit as fbLimit, serverTimestamp,
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

// ─── Prices ───────────────────────────────────────────────────

export const prices = {
  async list() {
    const snap = await getDocs(query(collection(db, 'prices'), orderBy('name', 'asc')));
    return snapsToData(snap);
  },

  async create(data, user) {
    const docRef = await addDoc(collection(db, 'prices'), {
      name: data.name,
      price: Number(data.price) || 0,
      category: data.category || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Added price item: ${data.name}`, 'price', docRef.id);
    return { id: docRef.id };
  },

  async update(id, data, user) {
    await updateDoc(doc(db, 'prices', id), {
      name: data.name,
      price: Number(data.price) || 0,
      category: data.category || '',
      updatedAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Updated price item: ${data.name}`, 'price', id);
  },

  async delete(id, user) {
    await deleteDoc(doc(db, 'prices', id));
    await logActivity(user.uid, user.displayName, 'Deleted a price item', 'price', id);
  },

  async bulkCreate(items, user) {
    const promises = items.map(item =>
      addDoc(collection(db, 'prices'), {
        name: item.name,
        price: Number(item.price) || 0,
        category: item.category || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await Promise.all(promises);
    await logActivity(user.uid, user.displayName, `Imported ${items.length} price items`, 'price', 'bulk');
  },
};

// ─── Orders ────────────────────────────────────────────────────

export const orders = {
  async list({ status, search } = {}) {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    let data = snapsToData(snap);

    if (status) data = data.filter(o => o.status === status);

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
      items: data.items || [],
      subtotal: Number(data.subtotal) || 0,
      discount: Number(data.discount) || 0,
      price: Number(data.price) || 0,
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
    // Fetch order before updating so we can auto-deposit on delivery
    let orderData = null;
    if (data.status === 'delivered') {
      const snap = await getDoc(doc(db, 'orders', id));
      if (snap.exists()) orderData = snap.data();
    }

    await updateDoc(doc(db, 'orders', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const label = data.status ? ` → ${data.status}` : '';
    await logActivity(user.uid, user.displayName, `Updated order${label}`, 'order', id);

    // Auto-deposit into ranch fund when order is delivered
    if (data.status === 'delivered' && orderData?.price) {
      await ranchFund.deposit(
        orderData.price,
        `Order delivered: ${orderData.customerName}`,
        user,
      );
    }
  },

  async toggleChecklistItem(orderId, itemIndex, user) {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) throw new Error('Order not found');
    const order = snap.data();

    const itemCount = (order.items || []).length;
    const checklist = order.checklist
      ? [...order.checklist]
      : Array.from({ length: itemCount }, () => ({ checked: false, checkedBy: null, checkedByName: null, checkedAt: null }));

    // Pad if items were added after checklist was created
    while (checklist.length < itemCount) {
      checklist.push({ checked: false, checkedBy: null, checkedByName: null, checkedAt: null });
    }

    const checking = !checklist[itemIndex]?.checked;
    checklist[itemIndex] = checking
      ? { checked: true, checkedBy: user.uid, checkedByName: user.displayName, checkedAt: serverTimestamp() }
      : { checked: false, checkedBy: null, checkedByName: null, checkedAt: null };

    await updateDoc(doc(db, 'orders', orderId), { checklist, updatedAt: serverTimestamp() });
    return { ...order, id: orderId, checklist };
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

    const completedToday = all.filter(o => {
      if (o.status !== 'delivered') return false;
      const updated = o.updatedAt?.toDate?.() || new Date(0);
      return updated >= today;
    }).length;

    const pendingDeliveries = all.filter(o => o.status === 'ready').length;

    return { totalOutstanding, completedToday, pendingDeliveries };
  },
};

// ─── Quotes ────────────────────────────────────────────────────

export const quotes = {
  async list({ status, search } = {}) {
    const snap = await getDocs(query(collection(db, 'quotes'), orderBy('createdAt', 'desc')));
    let data = snapsToData(snap);

    if (status) data = data.filter(q => q.status === status);

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
      items: data.items || [],
      subtotal: Number(data.subtotal) || 0,
      discount: Number(data.discount) || 0,
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
      items: q.items || [],
      subtotal: q.subtotal || 0,
      discount: q.discount || 0,
      price: q.estimatedPrice,
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
    const snap = await getDocs(query(collection(db, 'misc_logs'), orderBy('createdAt', 'desc')));
    let data = snapsToData(snap);

    if (category && category !== 'all') data = data.filter(l => l.category === category);
    if (max) data = data.slice(0, max);

    return data;
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

// ─── Map Pins ─────────────────────────────────────────────────

export const mapPins = {
  async list() {
    const snap = await getDocs(query(collection(db, 'map_pins'), orderBy('createdAt', 'desc')));
    return snapsToData(snap);
  },

  async create(data, user) {
    const docRef = await addDoc(collection(db, 'map_pins'), {
      x: Number(data.x),
      y: Number(data.y),
      title: data.title,
      description: data.description || '',
      category: data.category || 'other',
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Placed map pin: ${data.title}`, 'map_pin', docRef.id);
    return { id: docRef.id };
  },

  async delete(id, user) {
    await deleteDoc(doc(db, 'map_pins', id));
    await logActivity(user.uid, user.displayName, 'Deleted a map pin', 'map_pin', id);
  },
};

// ─── Ranch Fund ────────────────────────────────────────────

export const ranchFund = {
  async get() {
    const snap = await getDoc(doc(db, 'ranch_fund', 'balance'));
    if (!snap.exists()) return { balance: 0 };
    return snap.data();
  },

  async deposit(amount, description, user) {
    const current = await this.get();
    const newBalance = current.balance + Number(amount);
    await setDoc(doc(db, 'ranch_fund', 'balance'), {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'ranch_fund_log'), {
      type: 'deposit',
      amount: Number(amount),
      description,
      balanceAfter: newBalance,
      userId: user.uid,
      userName: user.displayName,
      createdAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Ranch fund deposit: ${description}`, 'ranch_fund', 'balance');
    return { balance: newBalance };
  },

  async withdraw(amount, description, user) {
    const current = await this.get();
    const newBalance = current.balance - Number(amount);
    await setDoc(doc(db, 'ranch_fund', 'balance'), {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'ranch_fund_log'), {
      type: 'withdrawal',
      amount: Number(amount),
      description,
      balanceAfter: newBalance,
      userId: user.uid,
      userName: user.displayName,
      createdAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Ranch fund withdrawal: ${description}`, 'ranch_fund', 'balance');
    return { balance: newBalance };
  },

  async adjust(newBalance, description, user) {
    const nb = Number(newBalance);
    await setDoc(doc(db, 'ranch_fund', 'balance'), {
      balance: nb,
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'ranch_fund_log'), {
      type: 'adjustment',
      amount: nb,
      description,
      balanceAfter: nb,
      userId: user.uid,
      userName: user.displayName,
      createdAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Ranch fund adjusted: ${description}`, 'ranch_fund', 'balance');
    return { balance: nb };
  },

  async getLog(max = 20) {
    const snap = await getDocs(
      query(collection(db, 'ranch_fund_log'), orderBy('createdAt', 'desc'), fbLimit(max))
    );
    return snapsToData(snap);
  },
};

// ─── Recipes ──────────────────────────────────────────────────

function createRecipeApi(collectionName, entityType, label) {
  return {
    async list({ search } = {}) {
      const snap = await getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc')));
      let data = snapsToData(snap);
      if (search) {
        const s = search.toLowerCase();
        data = data.filter(r =>
          r.name.toLowerCase().includes(s) ||
          (r.location || '').toLowerCase().includes(s) ||
          (r.ingredients || []).some(i => i.name.toLowerCase().includes(s))
        );
      }
      return data;
    },

    async create(data, user) {
      const docRef = await addDoc(collection(db, collectionName), {
        name: data.name,
        description: data.description || '',
        ingredients: data.ingredients || [],
        location: data.location || '',
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logActivity(user.uid, user.displayName, `Added ${label}: ${data.name}`, entityType, docRef.id);
      return { id: docRef.id };
    },

    async update(id, data, user) {
      await updateDoc(doc(db, collectionName, id), {
        name: data.name,
        description: data.description || '',
        ingredients: data.ingredients || [],
        location: data.location || '',
        updatedAt: serverTimestamp(),
      });
      await logActivity(user.uid, user.displayName, `Updated ${label}: ${data.name}`, entityType, id);
    },

    async delete(id, user) {
      await deleteDoc(doc(db, collectionName, id));
      await logActivity(user.uid, user.displayName, `Deleted a ${label}`, entityType, id);
    },
  };
}

export const recipes = createRecipeApi('recipes', 'recipe', 'recipe');
export const crafting = createRecipeApi('crafting', 'crafting', 'crafting recipe');

// ─── Cattle Timers ────────────────────────────────────────────

export const cattleTimers = {
  async list() {
    const snap = await getDocs(query(collection(db, 'cattle_timers'), orderBy('bredAt', 'desc')));
    return snapsToData(snap);
  },

  async create(data, user) {
    const docRef = await addDoc(collection(db, 'cattle_timers'), {
      quantity: Number(data.quantity) || 1,
      notes: data.notes || '',
      bredBy: user.uid,
      bredByName: user.displayName,
      bredAt: serverTimestamp(),
    });
    await logActivity(user.uid, user.displayName, `Bred ${data.quantity || 1} cattle`, 'cattle', docRef.id);
    return { id: docRef.id };
  },

  async delete(id, user) {
    await deleteDoc(doc(db, 'cattle_timers', id));
    await logActivity(user.uid, user.displayName, 'Cleared a cattle timer', 'cattle', id);
  },
};

// ─── Activity ──────────────────────────────────────────────────

export const activity = {
  async list({ max } = {}) {
    const q = max
      ? query(collection(db, 'activity'), orderBy('createdAt', 'desc'), fbLimit(max))
      : query(collection(db, 'activity'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
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
