# Firestore Database Structure

Firebase is NoSQL — no SQL tables. Here's the collection/document structure.

## Collections

### `users` (document ID = Firebase Auth UID)
```
{
  email: "user@example.com",
  displayName: "Jake",
  role: "admin" | "member",
  createdAt: Timestamp
}
```

### `orders`
```
{
  customerName: "Dutch van der Linde",
  contactInfo: "Discord: Dutch#1899",
  description: "50 units of cotton",
  price: 250.00,
  depositPaid: 50.00,
  notes: "Deliver to Valentine",
  status: "outstanding" | "preparing" | "ready" | "delivered",
  assignedTo: "userId" | null,
  assignedToName: "Jake" | null,
  createdBy: "userId",
  createdByName: "Sarah",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `quotes`
```
{
  customerName: "Hosea Matthews",
  contactInfo: "Discord: Hosea#1899",
  requestedItems: "200 units of grain",
  estimatedPrice: 1500.00,
  notes: "Bulk order",
  status: "pending" | "accepted" | "rejected",
  convertedOrderId: "orderId" | null,
  createdBy: "userId",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `misc_logs`
```
{
  userId: "userId",
  userName: "Jake",
  description: "Sold 20 cattle at auction",
  amount: 400.00 | null,
  category: "livestock" | "crops" | "finance" | "delivery" | "misc",
  createdAt: Timestamp
}
```

### `todos`
```
{
  title: "Feed the livestock",
  description: "All cattle and horses before noon",
  assignedRole: "admin" | "member" | null,
  isCompleted: false,
  completedBy: "userId" | null,
  completedByName: "Jake" | null,
  completedAt: Timestamp | null,
  createdBy: "userId",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  sortOrder: 1
}
```

### `posters`
```
{
  title: "Ranch Grand Opening",
  imageUrl: "https://firebasestorage.googleapis.com/...",
  storagePath: "posters/abc123.jpg",
  uploadedBy: "userId",
  createdAt: Timestamp
}
```

### `activity`
```
{
  userId: "userId",
  userName: "Jake",
  action: "Created order for Dutch van der Linde",
  entityType: "order" | "quote" | "log" | "todo" | "poster",
  entityId: "documentId",
  createdAt: Timestamp
}
```

## Recommended Firestore Indexes

Create these composite indexes in Firebase Console → Firestore → Indexes:

1. `orders` — `status` ASC, `createdAt` DESC
2. `misc_logs` — `category` ASC, `createdAt` DESC
3. `activity` — `createdAt` DESC
4. `todos` — `sortOrder` ASC
5. `quotes` — `status` ASC, `createdAt` DESC
