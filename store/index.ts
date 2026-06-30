import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  _id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  colorName?: string;
  colorHex?: string;
  colorPreviewImage?: string;
  size?: string;
  clickomVariationId?: number;
  sku?: string;
  customSize?: boolean;
  preOrder?: boolean;
  customLength?: string;
  customBust?: string;
  customHip?: string;
  customSleeve?: string;
  customNote?: string;
  slug: string;
  originalPrice?: number;
}

interface WishlistItem {
  _id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
}

interface AppState {
  items: CartItem[];
  wishlistItems: WishlistItem[];
  buyNowItem: CartItem | null;
  addItem: (product: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: WishlistItem) => void;
  setBuyNowItem: (item: CartItem | null) => void;
  updateBuyNowQuantity: (quantity: number) => void;
}

const useCartStore = create<AppState>()(
  persist(
    (set) => ({
      items: [],
      wishlistItems: [],
      buyNowItem: null,
      setBuyNowItem: (item) => set({ buyNowItem: item }),
      updateBuyNowQuantity: (quantity) =>
        set((state) => ({
          buyNowItem: state.buyNowItem
            ? { ...state.buyNowItem, quantity: Math.max(1, quantity) }
            : null,
        })),
      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item._id === product._id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item._id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item._id !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item._id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      toggleWishlist: (product) =>
        set((state) => {
          const isWishlisted = state.wishlistItems.find((item) => item._id === product._id);
          if (isWishlisted) {
            return {
              wishlistItems: state.wishlistItems.filter((item) => item._id !== product._id),
            };
          }
          return { wishlistItems: [...state.wishlistItems, product] };
        }),
    }),
    {
      name: "noora-cart-storage",
    }
  )
);

export default useCartStore;
