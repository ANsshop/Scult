import { permanentRedirect } from "next/navigation";
import { POCHONS } from "@/lib/content/pochons";

/** L'ancienne page d'annonce des pochons : elle renvoie à la fiche produit. */
export default function AnciennePagePochons() {
  permanentRedirect(POCHONS.path);
}
