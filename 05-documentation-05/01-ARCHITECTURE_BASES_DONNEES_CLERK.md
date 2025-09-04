# Architecture des Bases de Données avec Clerk

## Table des Matières

1. [Principe fondamental - Séparation des préoccupations](#principe-fondamental---séparation-des-préoccupations)
2. [Ce que Clerk fournit et ne fournit pas](#ce-que-clerk-fournit-et-ne-fournit-pas)
3. [Architecture à deux bases](#architecture-à-deux-bases)
4. [Liaison par clé commune - user_id](#liaison-par-clé-commune---user_id)
5. [Exemples concrets par secteur](#exemples-concrets-par-secteur)
6. [Schémas de bases de données](#schémas-de-bases-de-données)
7. [Synchronisation et webhooks](#synchronisation-et-webhooks)
8. [Cas d'usage avancés](#cas-dusage-avancés)
9. [Bonnes pratiques](#bonnes-pratiques)

---

## Principe fondamental - Séparation des préoccupations

### Concept de base

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE SÉPARÉE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                    ┌─────────────────┐     │
│  │                 │                    │                 │     │
│  │   CLERK (SaaS)  │◀──── user_id ────▶│  VOTRE BASE     │     │
│  │                 │                    │                 │     │
│  │ • Users         │                    │ • Products      │     │
│  │ • Sessions      │                    │ • Orders        │     │
│  │ • Auth          │                    │ • Cart          │     │
│  │ • Profiles      │                    │ • Analytics     │     │
│  │ • Organizations │                    │ • Content       │     │
│  │                 │                    │                 │     │
│  └─────────────────┘                    └─────────────────┘     │
│                                                                 │
│  Responsabilité:                        Responsabilité:        │
│  - Authentification                     - Logique métier       │
│  - Gestion utilisateurs                 - Données business     │
│  - Sécurité                            - Fonctionnalités      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Pourquoi cette séparation ?

**Avantages :**
- **Spécialisation** : Chaque système fait ce qu'il fait de mieux
- **Sécurité** : Clerk se concentre sur l'auth, vous sur le métier
- **Maintenance** : Moins de code auth à maintenir
- **Scalabilité** : Chaque base peut évoluer indépendamment
- **Conformité** : Clerk gère GDPR, SOC2, vous gérez vos données métier

**Inconvénients :**
- **Complexité** : Deux systèmes à synchroniser
- **Latence** : Appels API supplémentaires
- **Coût** : Clerk devient payant après 10k utilisateurs

---

## Ce que Clerk fournit et ne fournit pas

### ✅ Ce que Clerk FOURNIT

#### Base utilisateurs complète
```json
{
  "id": "user_2abcd1234efgh5678",
  "firstName": "John",
  "lastName": "Doe",
  "emailAddresses": [
    {
      "id": "idn_123",
      "emailAddress": "john@example.com",
      "verification": {
        "status": "verified"
      }
    }
  ],
  "phoneNumbers": [],
  "imageUrl": "https://img.clerk.com/preview.png",
  "publicMetadata": {
    "role": "customer",
    "plan": "premium"
  },
  "privateMetadata": {
    "internalNotes": "VIP customer"
  },
  "createdAt": 1640995200000,
  "lastSignInAt": 1641081600000
}
```

#### Fonctionnalités d'authentification
- **OAuth providers** (Google, GitHub, Apple, etc.)
- **Email/SMS verification**
- **Multi-factor authentication (MFA)**
- **Password policies**
- **Session management**
- **JWT tokens**
- **Organizations & teams**
- **Role-based access control (RBAC)**

#### Interface utilisateur
- **Sign-in/Sign-up components**
- **User profile management**
- **Password reset flows**
- **MFA setup**
- **Organization management**

### ❌ Ce que Clerk NE FOURNIT PAS

#### Données métier
```
❌ Produits et catalogues
❌ Paniers d'achat
❌ Commandes et factures
❌ Inventaire et stock
❌ Analytics business
❌ Contenu (articles, posts)
❌ Fichiers et médias
❌ Données géographiques
❌ Configurations d'application
❌ Logs métier
```

#### Fonctionnalités métier
- **E-commerce logic**
- **Payment processing**
- **Inventory management**
- **Business analytics**
- **Content management**
- **File storage**
- **Custom workflows**

---

## Architecture à deux bases

### Schéma général

```
┌─────────────────────────────────────────────────────────────────┐
│                      VOTRE APPLICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (Next.js)                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • useUser() ──────────────────────┐                     │   │
│  │ • SignedIn/SignedOut              │                     │   │
│  │ • UserButton                      │                     │   │
│  │ • Custom business components      │                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    │                  │                        │
│                    │                  │                        │
│  Backend API       │                  │                        │
│  ┌─────────────────▼──────────────────▼────────────────────┐   │
│  │                                                         │   │
│  │  Route: /api/cart                                       │   │
│  │  1. const user = await currentUser() // Clerk          │   │
│  │  2. const cart = await getCart(user.id) // Your DB     │   │
│  │                                                         │   │
│  └─────────────────┬──────────────────┬────────────────────┘   │
│                    │                  │                        │
│                    │                  │                        │
│  ┌─────────────────▼──────────────────▼────────────────────┐   │
│  │                                                         │   │
│  │              BASES DE DONNÉES                           │   │
│  │                                                         │   │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐ │   │
│  │  │                 │    │                             │ │   │
│  │  │  CLERK CLOUD    │    │      VOTRE BASE             │ │   │
│  │  │                 │    │                             │ │   │
│  │  │ Users           │    │ Products                    │ │   │
│  │  │ Sessions        │    │ ┌─────────────────────────┐ │ │   │
│  │  │ Organizations   │    │ │ user_id (FK vers Clerk) │ │ │   │
│  │  │ Auth Logs       │    │ │ product_id              │ │ │   │
│  │  │                 │    │ │ quantity                │ │ │   │
│  │  │                 │    │ └─────────────────────────┘ │ │   │
│  │  └─────────────────┘    │ Orders, Analytics, etc.    │ │   │
│  │                         │                             │ │   │
│  │                         └─────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de données typique

#### 1. Utilisateur se connecte
```
User Browser → Clerk UI → Clerk API → JWT Token → Your App
```

#### 2. Accès aux données métier
```
Your App → currentUser() → Clerk API → user_id → Your Database
```

#### 3. Opération business
```
Frontend → API Route → Verify JWT → Get user_id → Query your DB → Response
```

---

## Liaison par clé commune - user_id

### Principe de la clé étrangère

Le `user_id` de Clerk devient la **clé étrangère** dans toutes vos tables métier.

```sql
-- ✅ CORRECT - Liaison via user_id
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,           -- Clé de Clerk
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ❌ INCORRECT - Pas de liaison
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1
    -- Comment savoir à qui appartient ce panier ?
);
```

### Types d'identifiants Clerk

```typescript
// Identifiant utilisateur Clerk
const userId = "user_2abcd1234efgh5678"  // Toujours préfixé "user_"

// Identifiant organisation
const orgId = "org_2xyz9876abcd1234"     // Toujours préfixé "org_"

// Identifiant session
const sessionId = "sess_2def5678ijkl9012" // Toujours préfixé "sess_"
```

### Récupération du user_id

#### Côté serveur (Server Components)
```tsx
import { currentUser } from '@clerk/nextjs/server'

export default async function CartPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // user.id = "user_2abcd1234efgh5678"
  const cart = await getCartByUserId(user.id)
  
  return <CartDisplay cart={cart} />
}
```

#### Côté client (Client Components)
```tsx
'use client'
import { useUser } from '@clerk/nextjs'

export function CartButton() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  // user.id = "user_2abcd1234efgh5678"
  const handleAddToCart = async () => {
    await fetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,  // Envoyé à votre API
        productId: 123
      })
    })
  }
  
  return <button onClick={handleAddToCart}>Add to Cart</button>
}
```

#### Dans les API Routes
```tsx
// app/api/cart/route.ts
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // userId = "user_2abcd1234efgh5678"
  const cart = await db.cart.findMany({
    where: { user_id: userId }  // Liaison avec votre DB
  })
  
  return Response.json({ cart })
}
```

---

## Exemples concrets par secteur

### E-commerce - Boutique en ligne

#### Architecture des données
```
CLERK (Users)                    VOTRE BASE (Business)
┌─────────────────┐             ┌─────────────────────────┐
│ user_id         │──────────── │ products                │
│ email           │             │ ├─ product_id (PK)      │
│ name            │             │ ├─ name                 │
│ profile_image   │             │ ├─ price                │
│                 │             │ └─ stock                │
│                 │             │                         │
│                 │             │ cart                    │
│                 │             │ ├─ cart_id (PK)         │
│                 │             │ ├─ user_id (FK) ────────┤
│                 │             │ ├─ product_id (FK)      │
│                 │             │ └─ quantity             │
│                 │             │                         │
│                 │             │ orders                  │
│                 │             │ ├─ order_id (PK)        │
│                 │             │ ├─ user_id (FK) ────────┤
│                 │             │ ├─ total_amount         │
│                 │             │ ├─ status               │
│                 │             │ └─ created_at           │
└─────────────────┘             └─────────────────────────┘
```

#### Code d'implémentation
```typescript
// lib/database.ts
export async function getCartByUserId(userId: string) {
  return await db.cart.findMany({
    where: { user_id: userId },
    include: {
      product: true  // Join avec la table products
    }
  })
}

export async function addToCart(userId: string, productId: number, quantity: number) {
  const existingItem = await db.cart.findFirst({
    where: { 
      user_id: userId, 
      product_id: productId 
    }
  })

  if (existingItem) {
    // Mettre à jour la quantité
    return await db.cart.update({
      where: { cart_id: existingItem.cart_id },
      data: { quantity: existingItem.quantity + quantity }
    })
  } else {
    // Créer un nouvel item
    return await db.cart.create({
      data: {
        user_id: userId,
        product_id: productId,
        quantity
      }
    })
  }
}
```

### SaaS B2B - Plateforme de gestion

#### Architecture avec organisations
```
CLERK (Users + Orgs)             VOTRE BASE (Business)
┌─────────────────┐             ┌─────────────────────────┐
│ user_id         │──────────── │ projects                │
│ org_id          │─┐           │ ├─ project_id (PK)      │
│ role            │ │           │ ├─ user_id (FK) ────────┤
│ permissions     │ │           │ ├─ org_id (FK) ─────────┤
│                 │ │           │ ├─ name                 │
│                 │ │           │ └─ status               │
│                 │ │           │                         │
│                 │ └─────────── │ teams                   │
│                 │             │ ├─ team_id (PK)         │
│                 │             │ ├─ org_id (FK) ─────────┤
│                 │             │ ├─ name                 │
│                 │             │ └─ created_by (FK)      │
└─────────────────┘             └─────────────────────────┘
```

### Blog/CMS - Gestion de contenu

#### Architecture éditoriale
```
CLERK (Users)                    VOTRE BASE (Content)
┌─────────────────┐             ┌─────────────────────────┐
│ user_id         │──────────── │ articles                │
│ role (editor)   │             │ ├─ article_id (PK)      │
│ permissions     │             │ ├─ author_id (FK) ──────┤
│                 │             │ ├─ title                │
│                 │             │ ├─ content              │
│                 │             │ ├─ status (draft/pub)   │
│                 │             │ └─ published_at         │
│                 │             │                         │
│                 │             │ comments                │
│                 │             │ ├─ comment_id (PK)      │
│                 │             │ ├─ article_id (FK)      │
│                 │             │ ├─ user_id (FK) ────────┤
│                 │             │ ├─ content              │
│                 │             │ └─ created_at           │
└─────────────────┘             └─────────────────────────┘
```

---

## Schémas de bases de données

### Schema PostgreSQL complet - E-commerce

```sql
-- ============================================
-- SCHEMA POUR E-COMMERCE AVEC CLERK
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des catégories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des produits
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2), -- Prix barré
    cost_price DECIMAL(10,2),    -- Prix de revient
    sku VARCHAR(100) UNIQUE,
    stock_quantity INT DEFAULT 0,
    category_id INT REFERENCES categories(category_id),
    images JSONB,                -- Array d'URLs d'images
    attributes JSONB,            -- Couleur, taille, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table du panier (liée aux utilisateurs Clerk)
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,  -- ID de Clerk (user_xxx)
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    selected_attributes JSONB,     -- Variantes choisies
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Contrainte d'unicité : un user ne peut avoir qu'un item par produit/variante
    UNIQUE(user_id, product_id, selected_attributes)
);

-- Table des commandes
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- ORD-2024-001
    user_id VARCHAR(255) NOT NULL,            -- ID de Clerk
    
    -- Informations de facturation (snapshot au moment de la commande)
    billing_name VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255) NOT NULL,
    billing_address JSONB NOT NULL,           -- Adresse complète
    
    -- Informations de livraison
    shipping_address JSONB,
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    
    -- Montants
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Status et dates
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_method VARCHAR(100),
    payment_transaction_id VARCHAR(255),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des items de commande
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    
    -- Snapshot des données produit au moment de la commande
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    selected_attributes JSONB,
    
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des avis produits (liée aux utilisateurs Clerk)
CREATE TABLE product_reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    user_id VARCHAR(255) NOT NULL,  -- ID de Clerk
    order_id INT REFERENCES orders(order_id), -- Vérification d'achat
    
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Un utilisateur ne peut laisser qu'un avis par produit
    UNIQUE(product_id, user_id)
);

-- Table des favoris/wishlist
CREATE TABLE wishlist (
    wishlist_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,  -- ID de Clerk
    product_id INT NOT NULL REFERENCES products(product_id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- Table des coupons de réduction
CREATE TABLE coupons (
    coupon_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount DECIMAL(10,2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table d'usage des coupons (tracking par utilisateur)
CREATE TABLE coupon_usage (
    usage_id SERIAL PRIMARY KEY,
    coupon_id INT NOT NULL REFERENCES coupons(coupon_id),
    user_id VARCHAR(255) NOT NULL,  -- ID de Clerk
    order_id INT NOT NULL REFERENCES orders(order_id),
    discount_applied DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(coupon_id, user_id) -- Un coupon par utilisateur (modifiable selon besoin)
);

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

-- Index sur les clés étrangères Clerk
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);

-- Index sur les produits
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);

-- Index sur les commandes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer un numéro de commande unique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.order_id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_order_number_trigger 
    AFTER INSERT ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_order_number();
```

### Schema Prisma équivalent

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id          Int       @id @default(autoincrement()) @map("category_id")
  name        String    @db.VarChar(255)
  slug        String    @unique @db.VarChar(255)
  description String?   @db.Text
  imageUrl    String?   @map("image_url") @db.VarChar(500)
  createdAt   DateTime  @default(now()) @map("created_at")
  
  products    Product[]
  
  @@map("categories")
}

model Product {
  id              Int       @id @default(autoincrement()) @map("product_id")
  name            String    @db.VarChar(255)
  slug            String    @unique @db.VarChar(255)
  description     String?   @db.Text
  price           Decimal   @db.Decimal(10, 2)
  comparePrice    Decimal?  @map("compare_price") @db.Decimal(10, 2)
  costPrice       Decimal?  @map("cost_price") @db.Decimal(10, 2)
  sku             String?   @unique @db.VarChar(100)
  stockQuantity   Int       @default(0) @map("stock_quantity")
  categoryId      Int?      @map("category_id")
  images          Json?
  attributes      Json?
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  category        Category? @relation(fields: [categoryId], references: [id])
  cartItems       CartItem[]
  orderItems      OrderItem[]
  reviews         ProductReview[]
  wishlistItems   WishlistItem[]
  
  @@map("products")
}

model CartItem {
  id                  Int      @id @default(autoincrement()) @map("cart_id")
  userId              String   @map("user_id") @db.VarChar(255) // Clerk user ID
  productId           Int      @map("product_id")
  quantity            Int      @default(1)
  selectedAttributes  Json?    @map("selected_attributes")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  product             Product  @relation(fields: [productId], references: [id])
  
  @@unique([userId, productId, selectedAttributes])
  @@map("cart")
}

model Order {
  id                    Int         @id @default(autoincrement()) @map("order_id")
  orderNumber           String      @unique @map("order_number") @db.VarChar(50)
  userId                String      @map("user_id") @db.VarChar(255) // Clerk user ID
  billingName           String      @map("billing_name") @db.VarChar(255)
  billingEmail          String      @map("billing_email") @db.VarChar(255)
  billingAddress        Json        @map("billing_address")
  shippingAddress       Json?       @map("shipping_address")
  shippingMethod        String?     @map("shipping_method") @db.VarChar(100)
  shippingCost          Decimal     @default(0) @map("shipping_cost") @db.Decimal(10, 2)
  subtotal              Decimal     @db.Decimal(10, 2)
  taxAmount             Decimal     @default(0) @map("tax_amount") @db.Decimal(10, 2)
  discountAmount        Decimal     @default(0) @map("discount_amount") @db.Decimal(10, 2)
  totalAmount           Decimal     @map("total_amount") @db.Decimal(10, 2)
  status                String      @default("pending") @db.VarChar(50)
  paymentStatus         String      @default("pending") @map("payment_status") @db.VarChar(50)
  paymentMethod         String?     @map("payment_method") @db.VarChar(100)
  paymentTransactionId  String?     @map("payment_transaction_id") @db.VarChar(255)
  notes                 String?     @db.Text
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")
  
  items                 OrderItem[]
  couponUsages          CouponUsage[]
  
  @@map("orders")
}

model OrderItem {
  id                  Int     @id @default(autoincrement()) @map("order_item_id")
  orderId             Int     @map("order_id")
  productId           Int     @map("product_id")
  productName         String  @map("product_name") @db.VarChar(255)
  productSku          String? @map("product_sku") @db.VarChar(100)
  selectedAttributes  Json?   @map("selected_attributes")
  quantity            Int
  unitPrice           Decimal @map("unit_price") @db.Decimal(10, 2)
  totalPrice          Decimal @map("total_price") @db.Decimal(10, 2)
  createdAt           DateTime @default(now()) @map("created_at")
  
  order               Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product             Product @relation(fields: [productId], references: [id])
  
  @@map("order_items")
}

model ProductReview {
  id                  Int      @id @default(autoincrement()) @map("review_id")
  productId           Int      @map("product_id")
  userId              String   @map("user_id") @db.VarChar(255) // Clerk user ID
  orderId             Int?     @map("order_id")
  rating              Int
  title               String?  @db.VarChar(255)
  comment             String?  @db.Text
  isVerifiedPurchase  Boolean  @default(false) @map("is_verified_purchase")
  isApproved          Boolean  @default(false) @map("is_approved")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  product             Product  @relation(fields: [productId], references: [id])
  
  @@unique([productId, userId])
  @@map("product_reviews")
}

model WishlistItem {
  id        Int      @id @default(autoincrement()) @map("wishlist_id")
  userId    String   @map("user_id") @db.VarChar(255) // Clerk user ID
  productId Int      @map("product_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  product   Product  @relation(fields: [productId], references: [id])
  
  @@unique([userId, productId])
  @@map("wishlist")
}

model Coupon {
  id              Int       @id @default(autoincrement()) @map("coupon_id")
  code            String    @unique @db.VarChar(50)
  description     String?   @db.VarChar(255)
  discountType    String    @map("discount_type") @db.VarChar(20)
  discountValue   Decimal   @map("discount_value") @db.Decimal(10, 2)
  minimumAmount   Decimal   @default(0) @map("minimum_amount") @db.Decimal(10, 2)
  maximumDiscount Decimal?  @map("maximum_discount") @db.Decimal(10, 2)
  usageLimit      Int?      @map("usage_limit")
  usedCount       Int       @default(0) @map("used_count")
  isActive        Boolean   @default(true) @map("is_active")
  startsAt        DateTime? @map("starts_at")
  expiresAt       DateTime? @map("expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  
  usages          CouponUsage[]
  
  @@map("coupons")
}

model CouponUsage {
  id              Int      @id @default(autoincrement()) @map("usage_id")
  couponId        Int      @map("coupon_id")
  userId          String   @map("user_id") @db.VarChar(255) // Clerk user ID
  orderId         Int      @map("order_id")
  discountApplied Decimal  @map("discount_applied") @db.Decimal(10, 2)
  usedAt          DateTime @default(now()) @map("used_at")
  
  coupon          Coupon   @relation(fields: [couponId], references: [id])
  order           Order    @relation(fields: [orderId], references: [id])
  
  @@unique([couponId, userId])
  @@map("coupon_usage")
}
```

---

## Synchronisation et webhooks

### Webhooks Clerk pour synchronisation

Clerk peut notifier votre application lors d'événements utilisateur via des webhooks.

#### Configuration des webhooks

```typescript
// app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/database'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', { status: 400 })
  }

  // Handle the webhook
  const eventType = evt.type

  switch (eventType) {
    case 'user.created':
      await handleUserCreated(evt.data)
      break
    case 'user.updated':
      await handleUserUpdated(evt.data)
      break
    case 'user.deleted':
      await handleUserDeleted(evt.data)
      break
    case 'organization.created':
      await handleOrganizationCreated(evt.data)
      break
  }

  return new Response('', { status: 200 })
}

async function handleUserCreated(userData: any) {
  console.log('New user created:', userData.id)
  
  // Créer un panier vide pour le nouvel utilisateur
  await db.cartItem.create({
    data: {
      userId: userData.id,
      // Autres initialisations si nécessaire
    }
  })

  // Sync vers votre CRM/Marketing
  await syncToMarketing('user_created', userData)
}

async function handleUserUpdated(userData: any) {
  console.log('User updated:', userData.id)
  
  // Mettre à jour les informations dans vos tables si nécessaire
  // Par exemple, mettre à jour les commandes avec le nouveau nom
  await db.order.updateMany({
    where: { userId: userData.id },
    data: {
      billingName: `${userData.first_name} ${userData.last_name}`,
      billingEmail: userData.email_addresses[0]?.email_address
    }
  })
}

async function handleUserDeleted(userData: any) {
  console.log('User deleted:', userData.id)
  
  // GDPR Compliance - Supprimer ou anonymiser les données
  await db.$transaction([
    // Option 1: Supprimer complètement
    db.cartItem.deleteMany({ where: { userId: userData.id } }),
    db.wishlistItem.deleteMany({ where: { userId: userData.id } }),
    
    // Option 2: Anonymiser les commandes (garder pour les stats)
    db.order.updateMany({
      where: { userId: userData.id },
      data: {
        userId: 'deleted_user',
        billingName: 'Deleted User',
        billingEmail: 'deleted@example.com'
      }
    })
  ])
}

async function syncToMarketing(event: string, userData: any) {
  // Sync vers Mailchimp, HubSpot, etc.
  try {
    await fetch('https://api.mailchimp.com/3.0/lists/your-list-id/members', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: userData.email_addresses[0]?.email_address,
        status: 'subscribed',
        merge_fields: {
          FNAME: userData.first_name,
          LNAME: userData.last_name
        },
        tags: [event, 'clerk-user']
      })
    })
  } catch (error) {
    console.error('Marketing sync failed:', error)
  }
}
```

### Synchronisation bidirectionnelle

```typescript
// lib/user-sync.ts
import { clerkClient } from '@clerk/nextjs/server'
import { db } from './database'

export class UserSyncService {
  // Mettre à jour les métadonnées Clerk depuis votre DB
  static async updateClerkMetadata(userId: string) {
    const orderStats = await db.order.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _count: { id: true }
    })

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        totalOrders: orderStats._count.id,
        totalSpent: orderStats._sum.totalAmount?.toNumber() || 0,
        customerTier: this.calculateTier(orderStats._sum.totalAmount?.toNumber() || 0)
      }
    })
  }

  // Calculer le niveau client
  static calculateTier(totalSpent: number): string {
    if (totalSpent >= 1000) return 'VIP'
    if (totalSpent >= 500) return 'Gold'
    if (totalSpent >= 100) return 'Silver'
    return 'Bronze'
  }

  // Synchroniser les préférences utilisateur
  static async syncUserPreferences(userId: string, preferences: any) {
    // Sauvegarder dans votre DB
    await db.userPreferences.upsert({
      where: { userId },
      update: { preferences },
      create: { userId, preferences }
    })

    // Mettre à jour Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { preferences }
    })
  }
}
```

---

## Cas d'usage avancés

### Multi-tenant avec organisations

```typescript
// Gestion des données par organisation
export async function getOrganizationProducts(orgId: string) {
  return await db.product.findMany({
    where: { organizationId: orgId },
    include: { category: true }
  })
}

export async function createOrganizationOrder(userId: string, orgId: string, orderData: any) {
  // Vérifier que l'utilisateur appartient à l'organisation
  const orgMembership = await clerkClient.organizations.getOrganizationMembership({
    organizationId: orgId,
    userId: userId
  })

  if (!orgMembership) {
    throw new Error('User not member of organization')
  }

  return await db.order.create({
    data: {
      ...orderData,
      userId,
      organizationId: orgId
    }
  })
}
```

### Gestion des rôles et permissions

```typescript
// Middleware pour vérifier les permissions
export async function checkPermission(userId: string, resource: string, action: string) {
  const user = await clerkClient.users.getUser(userId)
  const role = user.publicMetadata.role as string
  
  const permissions = {
    admin: ['*'],
    manager: ['products:read', 'products:write', 'orders:read'],
    employee: ['products:read', 'orders:read'],
    customer: ['orders:read:own', 'cart:write:own']
  }
  
  const userPermissions = permissions[role] || []
  
  return userPermissions.includes('*') || 
         userPermissions.includes(`${resource}:${action}`) ||
         userPermissions.includes(`${resource}:${action}:own`)
}

// Usage dans une API route
export async function GET(req: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hasPermission = await checkPermission(userId, 'products', 'read')
  
  if (!hasPermission) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const products = await db.product.findMany()
  return Response.json({ products })
}
```

### Cache et performance

```typescript
// Cache Redis pour les données utilisateur fréquemment accédées
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export class UserDataCache {
  static async getCart(userId: string) {
    const cacheKey = `cart:${userId}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    const cart = await db.cartItem.findMany({
      where: { userId },
      include: { product: true }
    })
    
    // Cache pour 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(cart))
    
    return cart
  }

  static async invalidateCart(userId: string) {
    await redis.del(`cart:${userId}`)
  }

  static async getUserStats(userId: string) {
    const cacheKey = `stats:${userId}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    const stats = await db.order.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _count: { id: true }
    })
    
    // Cache pour 1 heure
    await redis.setex(cacheKey, 3600, JSON.stringify(stats))
    
    return stats
  }
}
```

---

## Bonnes pratiques

### Sécurité des données

#### 1. Validation des user_id
```typescript
// Toujours valider que le user_id vient bien de Clerk
function isValidClerkUserId(userId: string): boolean {
  return /^user_[a-zA-Z0-9]+$/.test(userId)
}

// Dans vos API routes
export async function POST(req: Request) {
  const { userId } = auth()
  
  if (!userId || !isValidClerkUserId(userId)) {
    return Response.json({ error: 'Invalid user ID' }, { status: 401 })
  }
  
  // Suite du traitement...
}
```

#### 2. Isolation des données par utilisateur
```typescript
// Toujours filtrer par userId pour éviter les fuites de données
export async function getUserOrders(userId: string) {
  return await db.order.findMany({
    where: { 
      userId: userId  // TOUJOURS inclure cette condition
    },
    include: { items: true }
  })
}

// ❌ DANGEREUX - Peut retourner les commandes d'autres utilisateurs
export async function getOrderById(orderId: number) {
  return await db.order.findUnique({
    where: { id: orderId }
  })
}

// ✅ SÉCURISÉ - Vérifie la propriété
export async function getOrderById(orderId: number, userId: string) {
  return await db.order.findFirst({
    where: { 
      id: orderId,
      userId: userId  // Vérification de propriété
    }
  })
}
```

#### 3. Audit trail
```typescript
// Table d'audit pour tracer les actions
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

// Fonction d'audit
export async function logAudit(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  oldData?: any,
  newData?: any,
  req?: Request
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      oldData,
      newData,
      ipAddress: req?.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req?.headers.get('user-agent') || 'unknown'
    }
  })
}
```

### Performance et scalabilité

#### 1. Index de base de données
```sql
-- Index critiques pour performance
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_orders_user_id_created ON orders(user_id, created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
```

#### 2. Requêtes optimisées
```typescript
// ✅ Bon - Utilise les relations Prisma
export async function getCartWithProducts(userId: string) {
  return await db.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          stockQuantity: true
        }
      }
    }
  })
}

// ❌ Éviter - N+1 queries
export async function getCartBad(userId: string) {
  const cartItems = await db.cartItem.findMany({ where: { userId } })
  
  for (const item of cartItems) {
    item.product = await db.product.findUnique({ where: { id: item.productId } })
  }
  
  return cartItems
}
```

#### 3. Pagination pour grandes listes
```typescript
export async function getUserOrders(
  userId: string, 
  page: number = 1, 
  limit: number = 10
) {
  const skip = (page - 1) * limit
  
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { items: true }
    }),
    db.order.count({ where: { userId } })
  ])
  
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}
```

### Gestion des erreurs

```typescript
// Classe d'erreur custom
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public userId?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Wrapper pour les opérations DB
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  userId?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    // Log l'erreur avec contexte
    console.error('Database operation failed:', {
      error: error.message,
      userId,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    // Rethrow avec plus de contexte
    if (error.code === 'P2002') {
      throw new DatabaseError('Duplicate entry', 'DUPLICATE_ENTRY', userId)
    }
    
    throw new DatabaseError('Database operation failed', 'DB_ERROR', userId)
  }
}

// Usage
export async function addToCart(userId: string, productId: number, quantity: number) {
  return await safeDbOperation(async () => {
    return await db.cartItem.upsert({
      where: { 
        userId_productId: { userId, productId }
      },
      update: { 
        quantity: { increment: quantity }
      },
      create: {
        userId,
        productId,
        quantity
      }
    })
  }, userId)
}
```

Cette documentation complète montre comment architecturer correctement une application avec Clerk et votre propre base de données métier, en maintenant la séparation des préoccupations tout en assurant une liaison efficace via les identifiants utilisateur.
