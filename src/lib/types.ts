export type CartItem = {
  sku: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string | null;
  /** Ce qui distingue la ligne : le ou les goûts (« Cassis framboise », « 2 × Fruits rouges »). */
  detail?: string;
  /** Le goût de chaque pot de la ligne : un pour un pot, deux pour un pack. */
  flavours?: string[];
  quantity: number;
};

/** Un article prêt à entrer dans le panier. */
export type CartLine = Omit<CartItem, "quantity">;
