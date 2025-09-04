# Exemples d'Intégration Pratique - Clerk + Base Métier

## Table des Matières

1. [Projet E-commerce complet](#projet-e-commerce-complet)
2. [SaaS B2B avec organisations](#saas-b2b-avec-organisations)
3. [Plateforme de contenu](#plateforme-de-contenu)
4. [Application mobile avec API](#application-mobile-avec-api)
5. [Migration de données existantes](#migration-de-données-existantes)
6. [Patterns d'intégration avancés](#patterns-dintégration-avancés)
7. [Monitoring et observabilité](#monitoring-et-observabilité)

---

## Projet E-commerce complet

### Architecture du projet

```
ecommerce-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (shop)/
│   │   │   ├── products/[slug]/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   └── checkout/page.tsx
│   │   ├── (account)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── api/
│   │       ├── cart/route.ts
│   │       ├── orders/route.ts
│   │       └── webhooks/clerk/route.ts
│   ├── lib/
│   │   ├── database.ts
│   │   ├── cart.ts
│   │   └── orders.ts
│   └── components/
│       ├── cart/
│       ├── products/
│       └── ui/
├── prisma/
│   └── schema.prisma
└── .env.local
```

### Configuration initiale

#### 1. Variables d'environnement

```bash
# .env.local
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce"

# Stripe (pour les paiements)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# Redis (cache)
REDIS_URL="redis://localhost:6379"
```

#### 2. Service de base de données

```typescript
// lib/database.ts
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}

// Types pour TypeScript
export type CartItemWithProduct = {
  id: number
  userId: string
  productId: number
  quantity: number
  selectedAttributes: any
  product: {
    id: number
    name: string
    price: number
    images: any
    stockQuantity: number
  }
}

export type OrderWithItems = {
  id: number
  orderNumber: string
  userId: string
  status: string
  totalAmount: number
  createdAt: Date
  items: {
    id: number
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}
```

### Gestion du panier

#### 1. Service panier

```typescript
// lib/cart.ts
import { db } from './database'
import { auth } from '@clerk/nextjs/server'

export class CartService {
  // Récupérer le panier d'un utilisateur
  static async getCart(userId: string) {
    return await db.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            stockQuantity: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Ajouter un produit au panier
  static async addToCart(
    userId: string, 
    productId: number, 
    quantity: number = 1,
    selectedAttributes?: any
  ) {
    // Vérifier que le produit existe et est disponible
    const product = await db.product.findFirst({
      where: { 
        id: productId, 
        isActive: true,
        stockQuantity: { gte: quantity }
      }
    })

    if (!product) {
      throw new Error('Product not available')
    }

    // Chercher si l'item existe déjà
    const existingItem = await db.cartItem.findFirst({
      where: {
        userId,
        productId,
        selectedAttributes: selectedAttributes || {}
      }
    })

    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + quantity
      
      if (newQuantity > product.stockQuantity) {
        throw new Error('Not enough stock available')
      }

      return await db.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          updatedAt: new Date()
        }
      })
    } else {
      // Créer un nouvel item
      return await db.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          selectedAttributes: selectedAttributes || {}
        }
      })
    }
  }

  // Mettre à jour la quantité
  static async updateQuantity(userId: string, cartItemId: number, quantity: number) {
    // Vérifier que l'item appartient à l'utilisateur
    const cartItem = await db.cartItem.findFirst({
      where: { id: cartItemId, userId },
      include: { product: true }
    })

    if (!cartItem) {
      throw new Error('Cart item not found')
    }

    if (quantity <= 0) {
      return await this.removeFromCart(userId, cartItemId)
    }

    if (quantity > cartItem.product.stockQuantity) {
      throw new Error('Not enough stock available')
    }

    return await db.cartItem.update({
      where: { id: cartItemId },
      data: { quantity, updatedAt: new Date() }
    })
  }

  // Supprimer un item du panier
  static async removeFromCart(userId: string, cartItemId: number) {
    const cartItem = await db.cartItem.findFirst({
      where: { id: cartItemId, userId }
    })

    if (!cartItem) {
      throw new Error('Cart item not found')
    }

    return await db.cartItem.delete({
      where: { id: cartItemId }
    })
  }

  // Vider le panier
  static async clearCart(userId: string) {
    return await db.cartItem.deleteMany({
      where: { userId }
    })
  }

  // Calculer le total du panier
  static async getCartTotal(userId: string) {
    const cartItems = await this.getCart(userId)
    
    return cartItems.reduce((total, item) => {
      return total + (item.product.price.toNumber() * item.quantity)
    }, 0)
  }

  // Valider le panier avant commande
  static async validateCart(userId: string) {
    const cartItems = await this.getCart(userId)
    const errors: string[] = []

    for (const item of cartItems) {
      if (!item.product.isActive) {
        errors.push(`Product ${item.product.name} is no longer available`)
      }
      
      if (item.quantity > item.product.stockQuantity) {
        errors.push(`Only ${item.product.stockQuantity} units of ${item.product.name} available`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      items: cartItems
    }
  }
}
```

#### 2. API Routes pour le panier

```typescript
// app/api/cart/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CartService } from '@/lib/cart'

// GET /api/cart - Récupérer le panier
export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cart = await CartService.getCart(userId)
    const total = await CartService.getCartTotal(userId)

    return Response.json({ 
      cart, 
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cart - Ajouter au panier
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity, selectedAttributes } = await req.json()

    if (!productId || !quantity || quantity <= 0) {
      return Response.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const cartItem = await CartService.addToCart(
      userId, 
      productId, 
      quantity, 
      selectedAttributes
    )

    return Response.json({ cartItem }, { status: 201 })
  } catch (error) {
    console.error('Add to cart error:', error)
    
    if (error.message.includes('not available') || error.message.includes('stock')) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

```typescript
// app/api/cart/[itemId]/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CartService } from '@/lib/cart'

// PUT /api/cart/[itemId] - Mettre à jour la quantité
export async function PUT(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quantity } = await req.json()
    const itemId = parseInt(params.itemId)

    if (!quantity || quantity < 0 || !itemId) {
      return Response.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const cartItem = await CartService.updateQuantity(userId, itemId, quantity)

    return Response.json({ cartItem })
  } catch (error) {
    console.error('Update cart error:', error)
    
    if (error.message.includes('not found') || error.message.includes('stock')) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/cart/[itemId] - Supprimer du panier
export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemId = parseInt(params.itemId)

    if (!itemId) {
      return Response.json({ error: 'Invalid item ID' }, { status: 400 })
    }

    await CartService.removeFromCart(userId, itemId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Remove from cart error:', error)
    
    if (error.message.includes('not found')) {
      return Response.json({ error: error.message }, { status: 404 })
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### 3. Composants React pour le panier

```tsx
// components/cart/CartButton.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CartButtonProps {
  productId: number
  productName: string
  price: number
  maxQuantity: number
}

export function CartButton({ productId, productName, price, maxQuantity }: CartButtonProps) {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = async () => {
    if (!isLoaded || !user) {
      toast.error('Please sign in to add items to cart')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }

      toast.success(`${productName} added to cart!`)
      setQuantity(1)
      
      // Trigger cart refresh (you might want to use a global state)
      window.dispatchEvent(new CustomEvent('cart-updated'))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return <Button disabled>Loading...</Button>
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="px-4 py-2 min-w-12 text-center">{quantity}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
          disabled={quantity >= maxQuantity}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={loading || !user}
        className="flex-1"
      >
        {loading ? (
          'Adding...'
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart - ${(price * quantity).toFixed(2)}
          </>
        )}
      </Button>
    </div>
  )
}
```

```tsx
// components/cart/CartDrawer.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CartItem {
  id: number
  productId: number
  quantity: number
  product: {
    id: number
    name: string
    price: number
    images: any
    stockQuantity: number
  }
}

export function CartDrawer() {
  const { user, isLoaded } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchCart = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data.cart)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchCart()
    }
  }, [isLoaded, user])

  useEffect(() => {
    const handleCartUpdate = () => fetchCart()
    window.addEventListener('cart-updated', handleCartUpdate)
    return () => window.removeEventListener('cart-updated', handleCartUpdate)
  }, [])

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (response.ok) {
        await fetchCart()
      } else {
        const error = await response.json()
        toast.error(error.error)
      }
    } catch (error) {
      toast.error('Failed to update cart')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (itemId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCart()
        toast.success('Item removed from cart')
      } else {
        const error = await response.json()
        toast.error(error.error)
      }
    } catch (error) {
      toast.error('Failed to remove item')
    } finally {
      setLoading(false)
    }
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({itemCount})</SheetTitle>
          <SheetDescription>
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        ${item.product.price.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={loading || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading || item.quantity >= item.product.stockQuantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">
                        ${(item.product.price.toNumber() * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-semibold">${total.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/checkout" onClick={() => setIsOpen(false)}>
                      Proceed to Checkout
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/cart" onClick={() => setIsOpen(false)}>
                      View Full Cart
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Gestion des commandes

#### 1. Service commandes

```typescript
// lib/orders.ts
import { db } from './database'
import { CartService } from './cart'
import { clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export class OrderService {
  // Créer une commande depuis le panier
  static async createOrderFromCart(
    userId: string,
    shippingAddress: any,
    paymentMethodId?: string
  ) {
    // Valider le panier
    const cartValidation = await CartService.validateCart(userId)
    
    if (!cartValidation.isValid) {
      throw new Error(`Cart validation failed: ${cartValidation.errors.join(', ')}`)
    }

    const cartItems = cartValidation.items

    // Récupérer les informations utilisateur depuis Clerk
    const user = await clerkClient.users.getUser(userId)
    
    if (!user) {
      throw new Error('User not found')
    }

    // Calculer les montants
    const subtotal = cartItems.reduce((total, item) => {
      return total + (item.product.price.toNumber() * item.quantity)
    }, 0)

    const taxRate = 0.08 // 8% tax
    const taxAmount = subtotal * taxRate
    const shippingCost = subtotal > 50 ? 0 : 9.99 // Free shipping over $50
    const totalAmount = subtotal + taxAmount + shippingCost

    // Créer la commande dans une transaction
    const order = await db.$transaction(async (tx) => {
      // Créer la commande
      const newOrder = await tx.order.create({
        data: {
          userId,
          billingName: `${user.firstName} ${user.lastName}`,
          billingEmail: user.emailAddresses[0].emailAddress,
          billingAddress: shippingAddress, // Simplification
          shippingAddress,
          subtotal,
          taxAmount,
          shippingCost,
          totalAmount,
          status: 'pending',
          paymentStatus: 'pending'
        }
      })

      // Créer les items de commande
      for (const cartItem of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: cartItem.productId,
            productName: cartItem.product.name,
            productSku: cartItem.product.sku || '',
            selectedAttributes: cartItem.selectedAttributes,
            quantity: cartItem.quantity,
            unitPrice: cartItem.product.price,
            totalPrice: cartItem.product.price.toNumber() * cartItem.quantity
          }
        })

        // Réduire le stock
        await tx.product.update({
          where: { id: cartItem.productId },
          data: {
            stockQuantity: {
              decrement: cartItem.quantity
            }
          }
        })
      }

      return newOrder
    })

    // Traitement du paiement si un moyen de paiement est fourni
    if (paymentMethodId) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // Stripe utilise les centimes
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            orderId: order.id.toString(),
            userId
          }
        })

        // Mettre à jour le statut de paiement
        await db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'failed',
            paymentTransactionId: paymentIntent.id,
            paymentMethod: 'stripe',
            status: paymentIntent.status === 'succeeded' ? 'confirmed' : 'pending'
          }
        })

        if (paymentIntent.status === 'succeeded') {
          // Vider le panier après paiement réussi
          await CartService.clearCart(userId)
          
          // Envoyer email de confirmation (à implémenter)
          await this.sendOrderConfirmationEmail(order.id)
        }
      } catch (error) {
        console.error('Payment failed:', error)
        
        // Marquer la commande comme échec de paiement
        await db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'failed',
            status: 'cancelled'
          }
        })

        throw new Error('Payment processing failed')
      }
    }

    return order
  }

  // Récupérer les commandes d'un utilisateur
  static async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
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

  // Récupérer une commande spécifique
  static async getOrderById(orderId: number, userId: string) {
    return await db.order.findFirst({
      where: { 
        id: orderId,
        userId // Sécurité : vérifier que la commande appartient à l'utilisateur
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true
              }
            }
          }
        }
      }
    })
  }

  // Mettre à jour le statut d'une commande
  static async updateOrderStatus(orderId: number, status: string) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status')
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date()
      }
    })

    // Envoyer notification à l'utilisateur (à implémenter)
    await this.sendOrderStatusUpdate(orderId, status)

    return order
  }

  // Annuler une commande
  static async cancelOrder(orderId: number, userId: string, reason?: string) {
    const order = await db.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true }
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error('Order cannot be cancelled')
    }

    // Transaction pour annuler et restaurer le stock
    await db.$transaction(async (tx) => {
      // Mettre à jour la commande
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer'
        }
      })

      // Restaurer le stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            }
          }
        })
      }
    })

    // Traiter le remboursement si la commande était payée
    if (order.paymentStatus === 'paid' && order.paymentTransactionId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.paymentTransactionId,
          reason: 'requested_by_customer'
        })

        await db.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'refunded' }
        })
      } catch (error) {
        console.error('Refund failed:', error)
        // Log l'erreur mais ne pas faire échouer l'annulation
      }
    }

    return order
  }

  // Méthodes utilitaires (à implémenter)
  private static async sendOrderConfirmationEmail(orderId: number) {
    // Implémentation avec Resend, SendGrid, etc.
    console.log(`Sending confirmation email for order ${orderId}`)
  }

  private static async sendOrderStatusUpdate(orderId: number, status: string) {
    // Notification de changement de statut
    console.log(`Order ${orderId} status updated to ${status}`)
  }
}
```

#### 2. API Routes pour les commandes

```typescript
// app/api/orders/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OrderService } from '@/lib/orders'

// GET /api/orders - Récupérer les commandes de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await OrderService.getUserOrders(userId, page, limit)

    return Response.json(result)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/orders - Créer une nouvelle commande
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shippingAddress, paymentMethodId } = await req.json()

    if (!shippingAddress) {
      return Response.json({ error: 'Shipping address required' }, { status: 400 })
    }

    const order = await OrderService.createOrderFromCart(
      userId,
      shippingAddress,
      paymentMethodId
    )

    return Response.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    
    if (error.message.includes('validation') || error.message.includes('Payment')) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

```typescript
// app/api/orders/[orderId]/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OrderService } from '@/lib/orders'

// GET /api/orders/[orderId] - Récupérer une commande spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = parseInt(params.orderId)

    if (!orderId) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const order = await OrderService.getOrderById(orderId, userId)

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    return Response.json({ order })
  } catch (error) {
    console.error('Order fetch error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/orders/[orderId] - Annuler une commande
export async function DELETE(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = parseInt(params.orderId)
    const { reason } = await req.json()

    if (!orderId) {
      return Response.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const order = await OrderService.cancelOrder(orderId, userId, reason)

    return Response.json({ order })
  } catch (error) {
    console.error('Order cancellation error:', error)
    
    if (error.message.includes('not found') || error.message.includes('cannot be cancelled')) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## SaaS B2B avec organisations

### Architecture multi-tenant

```typescript
// lib/organizations.ts
import { db } from './database'
import { clerkClient } from '@clerk/nextjs/server'

export class OrganizationService {
  // Créer un workspace pour une nouvelle organisation
  static async createOrganizationWorkspace(orgId: string, creatorId: string) {
    const org = await clerkClient.organizations.getOrganization({ organizationId: orgId })
    
    return await db.workspace.create({
      data: {
        organizationId: orgId,
        name: org.name,
        slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
        createdBy: creatorId,
        settings: {
          allowPublicProjects: false,
          defaultProjectVisibility: 'private'
        }
      }
    })
  }

  // Récupérer les projets d'une organisation
  static async getOrganizationProjects(orgId: string, userId: string) {
    // Vérifier que l'utilisateur appartient à l'organisation
    const membership = await clerkClient.organizations.getOrganizationMembership({
      organizationId: orgId,
      userId
    })

    if (!membership) {
      throw new Error('Access denied')
    }

    const workspace = await db.workspace.findFirst({
      where: { organizationId: orgId }
    })

    if (!workspace) {
      throw new Error('Workspace not found')
    }

    return await db.project.findMany({
      where: { workspaceId: workspace.id },
      include: {
        owner: false, // Pas besoin des données utilisateur complètes
        members: {
          select: {
            userId: true,
            role: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  // Créer un projet dans une organisation
  static async createProject(
    orgId: string,
    userId: string,
    projectData: {
      name: string
      description?: string
      visibility: 'private' | 'internal' | 'public'
    }
  ) {
    // Vérifier les permissions
    const membership = await clerkClient.organizations.getOrganizationMembership({
      organizationId: orgId,
      userId
    })

    if (!membership || !['admin', 'basic_member'].includes(membership.role)) {
      throw new Error('Insufficient permissions')
    }

    const workspace = await db.workspace.findFirst({
      where: { organizationId: orgId }
    })

    if (!workspace) {
      throw new Error('Workspace not found')
    }

    return await db.project.create({
      data: {
        ...projectData,
        workspaceId: workspace.id,
        ownerId: userId,
        slug: projectData.name.toLowerCase().replace(/\s+/g, '-'),
        members: {
          create: {
            userId,
            role: 'owner'
          }
        }
      }
    })
  }

  // Inviter un utilisateur à un projet
  static async inviteToProject(
    projectId: number,
    inviterId: string,
    inviteeEmail: string,
    role: 'viewer' | 'editor' | 'admin'
  ) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { workspace: true }
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Vérifier que l'inviteur a les permissions
    const inviterMembership = await clerkClient.organizations.getOrganizationMembership({
      organizationId: project.workspace.organizationId,
      userId: inviterId
    })

    if (!inviterMembership || inviterMembership.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    // Créer l'invitation
    const invitation = await db.projectInvitation.create({
      data: {
        projectId,
        inviterId,
        inviteeEmail,
        role,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      }
    })

    // Envoyer l'email d'invitation (à implémenter)
    await this.sendProjectInvitation(invitation.id)

    return invitation
  }

  private static async sendProjectInvitation(invitationId: number) {
    // Implémentation email
    console.log(`Sending invitation ${invitationId}`)
  }
}
```

### Schema Prisma pour SaaS B2B

```prisma
model Workspace {
  id             Int       @id @default(autoincrement())
  organizationId String    @unique @map("organization_id") @db.VarChar(255)
  name           String    @db.VarChar(255)
  slug           String    @unique @db.VarChar(255)
  createdBy      String    @map("created_by") @db.VarChar(255)
  settings       Json?
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  
  projects       Project[]
  
  @@map("workspaces")
}

model Project {
  id          Int       @id @default(autoincrement())
  workspaceId Int       @map("workspace_id")
  name        String    @db.VarChar(255)
  slug        String    @db.VarChar(255)
  description String?   @db.Text
  visibility  String    @default("private") @db.VarChar(20)
  ownerId     String    @map("owner_id") @db.VarChar(255)
  settings    Json?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  members     ProjectMember[]
  invitations ProjectInvitation[]
  tasks       Task[]
  
  @@unique([workspaceId, slug])
  @@map("projects")
}

model ProjectMember {
  id        Int      @id @default(autoincrement())
  projectId Int      @map("project_id")
  userId    String   @map("user_id") @db.VarChar(255)
  role      String   @db.VarChar(50)
  joinedAt  DateTime @default(now()) @map("joined_at")
  
  project   Project  @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, userId])
  @@map("project_members")
}

model ProjectInvitation {
  id           Int       @id @default(autoincrement())
  projectId    Int       @map("project_id")
  inviterId    String    @map("inviter_id") @db.VarChar(255)
  inviteeEmail String    @map("invitee_email") @db.VarChar(255)
  role         String    @db.VarChar(50)
  token        String    @unique @db.VarChar(255)
  status       String    @default("pending") @db.VarChar(20)
  expiresAt    DateTime  @map("expires_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  
  project      Project   @relation(fields: [projectId], references: [id])
  
  @@map("project_invitations")
}

model Task {
  id          Int       @id @default(autoincrement())
  projectId   Int       @map("project_id")
  title       String    @db.VarChar(255)
  description String?   @db.Text
  status      String    @default("todo") @db.VarChar(50)
  priority    String    @default("medium") @db.VarChar(20)
  assigneeId  String?   @map("assignee_id") @db.VarChar(255)
  createdBy   String    @map("created_by") @db.VarChar(255)
  dueDate     DateTime? @map("due_date")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  project     Project   @relation(fields: [projectId], references: [id])
  
  @@map("tasks")
}
```

---

## Plateforme de contenu

### Gestion des articles et commentaires

```typescript
// lib/content.ts
import { db } from './database'
import { clerkClient } from '@clerk/nextjs/server'

export class ContentService {
  // Créer un article
  static async createArticle(
    authorId: string,
    articleData: {
      title: string
      content: string
      excerpt?: string
      tags?: string[]
      status: 'draft' | 'published'
      featuredImage?: string
    }
  ) {
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    return await db.article.create({
      data: {
        ...articleData,
        authorId,
        slug: await this.generateUniqueSlug(slug),
        publishedAt: articleData.status === 'published' ? new Date() : null
      }
    })
  }

  // Récupérer les articles publiés avec pagination
  static async getPublishedArticles(page: number = 1, limit: number = 10, tag?: string) {
    const skip = (page - 1) * limit
    
    const where = {
      status: 'published',
      ...(tag && {
        tags: {
          has: tag
        }
      })
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: {
          _count: {
            select: { comments: true }
          }
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit
      }),
      db.article.count({ where })
    ])

    // Enrichir avec les données utilisateur de Clerk
    const enrichedArticles = await Promise.all(
      articles.map(async (article) => {
        const author = await clerkClient.users.getUser(article.authorId)
        return {
          ...article,
          author: {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            imageUrl: author.imageUrl
          }
        }
      })
    )

    return {
      articles: enrichedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // Récupérer un article par slug
  static async getArticleBySlug(slug: string) {
    const article = await db.article.findFirst({
      where: { 
        slug,
        status: 'published'
      },
      include: {
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 50 // Limiter les commentaires
        },
        _count: {
          select: { comments: true }
        }
      }
    })

    if (!article) {
      return null
    }

    // Enrichir avec les données auteur
    const author = await clerkClient.users.getUser(article.authorId)
    
    // Enrichir les commentaires avec les données utilisateur
    const enrichedComments = await Promise.all(
      article.comments.map(async (comment) => {
        const commenter = await clerkClient.users.getUser(comment.userId)
        return {
          ...comment,
          user: {
            id: commenter.id,
            firstName: commenter.firstName,
            lastName: commenter.lastName,
            imageUrl: commenter.imageUrl
          }
        }
      })
    )

    return {
      ...article,
      author: {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        imageUrl: author.imageUrl
      },
      comments: enrichedComments
    }
  }

  // Ajouter un commentaire
  static async addComment(
    articleId: number,
    userId: string,
    content: string,
    parentId?: number
  ) {
    // Vérifier que l'article existe
    const article = await db.article.findFirst({
      where: { id: articleId, status: 'published' }
    })

    if (!article) {
      throw new Error('Article not found')
    }

    // Vérifier le commentaire parent si spécifié
    if (parentId) {
      const parentComment = await db.comment.findFirst({
        where: { id: parentId, articleId }
      })

      if (!parentComment) {
        throw new Error('Parent comment not found')
      }
    }

    return await db.comment.create({
      data: {
        articleId,
        userId,
        content,
        parentId,
        isApproved: false // Modération requise
      }
    })
  }

  // Liker un article
  static async toggleArticleLike(articleId: number, userId: string) {
    const existingLike = await db.articleLike.findFirst({
      where: { articleId, userId }
    })

    if (existingLike) {
      // Retirer le like
      await db.articleLike.delete({
        where: { id: existingLike.id }
      })
      return { liked: false }
    } else {
      // Ajouter le like
      await db.articleLike.create({
        data: { articleId, userId }
      })
      return { liked: true }
    }
  }

  // Rechercher des articles
  static async searchArticles(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const articles = await db.article.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit
    })

    return articles
  }

  // Méthodes utilitaires
  private static async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (await db.article.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }
}
```

### Schema pour plateforme de contenu

```prisma
model Article {
  id            Int       @id @default(autoincrement())
  title         String    @db.VarChar(255)
  slug          String    @unique @db.VarChar(255)
  excerpt       String?   @db.Text
  content       String    @db.Text
  featuredImage String?   @map("featured_image") @db.VarChar(500)
  authorId      String    @map("author_id") @db.VarChar(255)
  status        String    @default("draft") @db.VarChar(20)
  tags          String[]  @default([])
  publishedAt   DateTime? @map("published_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  comments      Comment[]
  likes         ArticleLike[]
  
  @@map("articles")
}

model Comment {
  id          Int       @id @default(autoincrement())
  articleId   Int       @map("article_id")
  userId      String    @map("user_id") @db.VarChar(255)
  content     String    @db.Text
  parentId    Int?      @map("parent_id")
  isApproved  Boolean   @default(false) @map("is_approved")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  article     Article   @relation(fields: [articleId], references: [id])
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  
  @@map("comments")
}

model ArticleLike {
  id        Int      @id @default(autoincrement())
  articleId Int      @map("article_id")
  userId    String   @map("user_id") @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  
  article   Article  @relation(fields: [articleId], references: [id])
  
  @@unique([articleId, userId])
  @@map("article_likes")
}
```

---

## Application mobile avec API

### API complète pour mobile

```typescript
// app/api/mobile/auth/route.ts
import { NextRequest } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import jwt from 'jsonwebtoken'

// POST /api/mobile/auth/verify-token
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 400 })
    }

    // Vérifier le token Clerk
    const session = await clerkClient.sessions.verifySession(token, {
      jwtKey: process.env.CLERK_JWT_KEY
    })

    if (!session) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Récupérer les données utilisateur
    const user = await clerkClient.users.getUser(session.userId)

    // Générer un token personnalisé pour l'app mobile (optionnel)
    const mobileToken = jwt.sign(
      { 
        userId: user.id,
        sessionId: session.id 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return Response.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl
      },
      mobileToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
  } catch (error) {
    console.error('Mobile auth error:', error)
    return Response.json({ error: 'Authentication failed' }, { status: 401 })
  }
}
```

```typescript
// app/api/mobile/user/profile/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/database'

// GET /api/mobile/user/profile
export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les statistiques utilisateur depuis votre DB
    const [orderStats, cartCount, wishlistCount] = await Promise.all([
      db.order.aggregate({
        where: { userId },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      db.cartItem.count({ where: { userId } }),
      db.wishlistItem.count({ where: { userId } })
    ])

    // Récupérer les données Clerk
    const user = await clerkClient.users.getUser(userId)

    return Response.json({
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
        phoneNumber: user.phoneNumbers[0]?.phoneNumber
      },
      stats: {
        totalOrders: orderStats._count.id,
        totalSpent: orderStats._sum.totalAmount?.toNumber() || 0,
        cartItems: cartCount,
        wishlistItems: wishlistCount
      },
      preferences: user.publicMetadata
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/mobile/user/profile
export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, phoneNumber, preferences } = await req.json()

    // Mettre à jour les données Clerk
    const updateData: any = {}
    
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phoneNumber !== undefined) updateData.phoneNumbers = [{ phoneNumber }]
    if (preferences !== undefined) updateData.publicMetadata = preferences

    const user = await clerkClient.users.updateUser(userId, updateData)

    return Response.json({
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
        phoneNumber: user.phoneNumbers[0]?.phoneNumber
      },
      preferences: user.publicMetadata
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Middleware pour API mobile

```typescript
// middleware/mobile-auth.ts
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { clerkClient } from '@clerk/nextjs/server'

export async function verifyMobileAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authorization header required')
  }

  const token = authHeader.substring(7)

  try {
    // Option 1: Vérifier le token Clerk directement
    const session = await clerkClient.sessions.verifySession(token)
    return { userId: session.userId, sessionId: session.id }
  } catch (clerkError) {
    try {
      // Option 2: Vérifier le token mobile custom
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      return { userId: decoded.userId, sessionId: decoded.sessionId }
    } catch (jwtError) {
      throw new Error('Invalid token')
    }
  }
}

// Utilisation dans les routes API
export function withMobileAuth(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const auth = await verifyMobileAuth(req)
      // Ajouter les données d'auth à la requête
      ;(req as any).auth = auth
      return await handler(req, ...args)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 401 })
    }
  }
}
```

---

## Migration de données existantes

### Script de migration depuis un système existant

```typescript
// scripts/migrate-users.ts
import { clerkClient } from '@clerk/nextjs/server'
import { db } from '../src/lib/database'

interface LegacyUser {
  id: number
  email: string
  first_name: string
  last_name: string
  password_hash: string
  created_at: string
  profile_image?: string
}

export async function migrateUsersToClerk() {
  console.log('Starting user migration to Clerk...')

  // 1. Récupérer les utilisateurs existants
  const legacyUsers = await db.$queryRaw<LegacyUser[]>`
    SELECT id, email, first_name, last_name, password_hash, created_at, profile_image
    FROM legacy_users
    WHERE migrated_to_clerk = false
    LIMIT 100
  `

  console.log(`Found ${legacyUsers.length} users to migrate`)

  for (const legacyUser of legacyUsers) {
    try {
      // 2. Créer l'utilisateur dans Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [legacyUser.email],
        firstName: legacyUser.first_name,
        lastName: legacyUser.last_name,
        skipPasswordChecks: true, // Ils devront réinitialiser leur mot de passe
        publicMetadata: {
          legacyId: legacyUser.id,
          migratedAt: new Date().toISOString()
        },
        ...(legacyUser.profile_image && {
          profileImageUrl: legacyUser.profile_image
        })
      })

      // 3. Mettre à jour vos tables existantes avec le nouvel ID Clerk
      await db.$transaction(async (tx) => {
        // Mettre à jour les commandes
        await tx.$executeRaw`
          UPDATE orders 
          SET clerk_user_id = ${clerkUser.id}
          WHERE legacy_user_id = ${legacyUser.id}
        `

        // Mettre à jour les paniers
        await tx.$executeRaw`
          UPDATE cart 
          SET clerk_user_id = ${clerkUser.id}
          WHERE legacy_user_id = ${legacyUser.id}
        `

        // Marquer comme migré
        await tx.$executeRaw`
          UPDATE legacy_users 
          SET migrated_to_clerk = true, clerk_user_id = ${clerkUser.id}
          WHERE id = ${legacyUser.id}
        `
      })

      console.log(`✅ Migrated user: ${legacyUser.email} -> ${clerkUser.id}`)

      // 4. Envoyer un email de bienvenue/réinitialisation
      await clerkClient.users.createPasswordReset({
        userId: clerkUser.id,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      })

    } catch (error) {
      console.error(`❌ Failed to migrate user ${legacyUser.email}:`, error)
      
      // Log l'erreur pour investigation
      await db.migrationLog.create({
        data: {
          type: 'USER_MIGRATION',
          legacyId: legacyUser.id,
          error: error.message,
          data: legacyUser
        }
      })
    }
  }

  console.log('Migration batch completed')
}

// Script pour migrer les données métier
export async function updateDatabaseSchema() {
  console.log('Updating database schema for Clerk integration...')

  // 1. Ajouter les colonnes Clerk aux tables existantes
  await db.$executeRaw`
    ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS migration_completed BOOLEAN DEFAULT false
  `

  await db.$executeRaw`
    ALTER TABLE cart 
    ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255)
  `

  // 2. Créer des index pour performance
  await db.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_orders_clerk_user_id ON orders(clerk_user_id)
  `

  await db.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_cart_clerk_user_id ON cart(clerk_user_id)
  `

  // 3. Mettre à jour les contraintes une fois la migration terminée
  // (À faire après que tous les utilisateurs soient migrés)
  
  console.log('Schema update completed')
}

// Fonction pour nettoyer après migration
export async function cleanupAfterMigration() {
  console.log('Cleaning up after migration...')

  // Vérifier que toutes les données ont été migrées
  const unmigrated = await db.$queryRaw`
    SELECT COUNT(*) as count FROM legacy_users WHERE migrated_to_clerk = false
  `

  if (unmigrated[0].count > 0) {
    throw new Error(`${unmigrated[0].count} users still need to be migrated`)
  }

  // Supprimer les colonnes legacy (optionnel)
  // await db.$executeRaw`ALTER TABLE orders DROP COLUMN IF EXISTS legacy_user_id`
  
  // Rendre les colonnes Clerk obligatoires
  await db.$executeRaw`
    ALTER TABLE orders 
    ALTER COLUMN clerk_user_id SET NOT NULL,
    ADD CONSTRAINT fk_orders_clerk_user CHECK (clerk_user_id LIKE 'user_%')
  `

  console.log('Cleanup completed')
}

// Exécution du script
if (require.main === module) {
  migrateUsersToClerk()
    .then(() => console.log('Migration completed'))
    .catch((error) => console.error('Migration failed:', error))
}
```

---

## Patterns d'intégration avancés

### Cache distribué avec Redis

```typescript
// lib/cache.ts
import Redis from 'ioredis'
import { clerkClient } from '@clerk/nextjs/server'

const redis = new Redis(process.env.REDIS_URL!)

export class CacheService {
  // Cache des données utilisateur enrichies
  static async getCachedUserProfile(userId: string) {
    const cacheKey = `user:profile:${userId}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    // Récupérer depuis Clerk + votre DB
    const [clerkUser, dbStats] = await Promise.all([
      clerkClient.users.getUser(userId),
      db.order.aggregate({
        where: { userId },
        _sum: { totalAmount: true },
        _count: { id: true }
      })
    ])

    const profile = {
      ...clerkUser,
      stats: {
        totalOrders: dbStats._count.id,
        totalSpent: dbStats._sum.totalAmount?.toNumber() || 0
      }
    }

    // Cache pour 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(profile))

    return profile
  }

  // Cache des paniers utilisateur
  static async getCachedCart(userId: string) {
    const cacheKey = `cart:${userId}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const cart = await db.cartItem.findMany({
      where: { userId },
      include: { product: true }
    })

    // Cache pour 2 minutes
    await redis.setex(cacheKey, 120, JSON.stringify(cart))

    return cart
  }

  // Invalidation du cache
  static async invalidateUserCache(userId: string) {
    const pattern = `*:${userId}`
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  // Cache des données fréquemment accédées
  static async getCachedProducts(category?: string) {
    const cacheKey = `products:${category || 'all'}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const products = await db.product.findMany({
      where: category ? { category: { slug: category } } : undefined,
      include: { category: true }
    })

    // Cache pour 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(products))

    return products
  }
}
```

### Event-driven architecture

```typescript
// lib/events.ts
import EventEmitter from 'events'
import { db } from './database'

class AppEventEmitter extends EventEmitter {}
export const eventBus = new AppEventEmitter()

// Événements utilisateur
export const UserEvents = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DELETED: 'user.deleted'
} as const

// Événements commande
export const OrderEvents = {
  CREATED: 'order.created',
  PAID: 'order.paid',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CANCELLED: 'order.cancelled'
} as const

// Handlers d'événements
eventBus.on(UserEvents.CREATED, async (data) => {
  console.log('New user created:', data.userId)
  
  // Initialiser les données utilisateur
  await db.userPreferences.create({
    data: {
      userId: data.userId,
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        currency: 'USD'
      }
    }
  })

  // Sync vers marketing
  await syncToMarketingPlatform('user_created', data)
})

eventBus.on(OrderEvents.CREATED, async (data) => {
  console.log('New order created:', data.orderId)
  
  // Envoyer confirmation email
  await sendOrderConfirmation(data.orderId)
  
  // Notifier l'équipe
  await notifyOrderTeam(data)
  
  // Mettre à jour les stats utilisateur
  await updateUserStats(data.userId)
})

eventBus.on(OrderEvents.PAID, async (data) => {
  console.log('Order paid:', data.orderId)
  
  // Déclencher fulfillment
  await triggerFulfillment(data.orderId)
  
  // Mettre à jour inventory
  await updateInventory(data.items)
})

// Fonctions utilitaires
async function syncToMarketingPlatform(event: string, data: any) {
  // Sync vers Mailchimp, HubSpot, etc.
}

async function sendOrderConfirmation(orderId: number) {
  // Envoyer email de confirmation
}

async function updateUserStats(userId: string) {
  // Mettre à jour les métadonnées Clerk
  const stats = await db.order.aggregate({
    where: { userId },
    _sum: { totalAmount: true },
    _count: { id: true }
  })

  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      totalOrders: stats._count.id,
      totalSpent: stats._sum.totalAmount?.toNumber() || 0
    }
  })
}
```

---

## Monitoring et observabilité

### Logging structuré

```typescript
// lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Logger avec contexte utilisateur
export function createUserLogger(userId: string) {
  return logger.child({ userId })
}

// Middleware de logging pour les API routes
export function logApiRequest(req: Request, res: Response, next: Function) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || 'unknown'
    })
  })
  
  next()
}

export { logger }
```

### Métriques et analytics

```typescript
// lib/analytics.ts
import { db } from './database'

export class AnalyticsService {
  // Métriques business
  static async getDashboardMetrics(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const [
      orderStats,
      userStats,
      productStats,
      revenueByDay
    ] = await Promise.all([
      // Stats commandes
      db.order.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true }
      }),
      
      // Stats utilisateurs
      db.$queryRaw`
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(DISTINCT CASE WHEN created_at >= ${startDate} THEN user_id END) as new_users
        FROM orders 
        WHERE created_at >= ${startDate}
      `,
      
      // Produits populaires
      db.orderItem.groupBy({
        by: ['productId'],
        where: { 
          order: { createdAt: { gte: startDate } }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
      }),
      
      // Revenus par jour
      db.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(total_amount) as revenue,
          COUNT(*) as orders
        FROM orders 
        WHERE created_at >= ${startDate}
          AND status IN ('confirmed', 'shipped', 'delivered')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    ])

    return {
      orders: {
        total: orderStats._count.id,
        revenue: orderStats._sum.totalAmount?.toNumber() || 0,
        averageValue: orderStats._avg.totalAmount?.toNumber() || 0
      },
      users: userStats[0],
      topProducts: productStats,
      revenueChart: revenueByDay
    }
  }

  // Tracking des événements utilisateur
  static async trackUserEvent(
    userId: string,
    event: string,
    properties?: Record<string, any>
  ) {
    await db.userEvent.create({
      data: {
        userId,
        event,
        properties: properties || {},
        createdAt: new Date()
      }
    })

    // Envoyer vers des services d'analytics externes
    await Promise.all([
      this.sendToMixpanel(userId, event, properties),
      this.sendToAmplitude(userId, event, properties)
    ])
  }

  private static async sendToMixpanel(userId: string, event: string, properties?: any) {
    // Implémentation Mixpanel
  }

  private static async sendToAmplitude(userId: string, event: string, properties?: any) {
    // Implémentation Amplitude
  }
}
```

Cette documentation complète fournit des exemples pratiques et du code production-ready pour intégrer Clerk avec différents types d'applications, en couvrant tous les aspects de l'architecture des données et des bonnes pratiques.
