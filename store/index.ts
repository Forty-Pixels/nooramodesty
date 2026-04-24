import { create } from "zustand";

interface CartItem {
  _id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const useCartStore = create<CartState>((set) => ({
  items: [],
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
}));

export default useCartStore;
