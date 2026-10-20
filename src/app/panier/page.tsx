import { redirect } from "next/navigation";
/** Le panier est un tiroir ; l'URL existe pour les liens externes et renvoie à la commande. */
export default function PanierPage() { redirect("/checkout"); }
