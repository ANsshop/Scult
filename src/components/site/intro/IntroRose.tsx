import { IntroShell } from "./IntroShell";
import { introBodyScript } from "./script";
import "./intro.css";

/**
 * L'intro de l'accueil : une couche décorative posée par-dessus le vrai site.
 * Ici il n'y a que la coquille vide et le script qui la remplit — le faux
 * site rose n'est écrit dans la page que pour un visiteur qui ne l'a jamais
 * vu (voir script.ts). À placer en premier dans la page d'accueil.
 */
export function IntroRose() {
  return (
    <>
      <IntroShell />
      <script dangerouslySetInnerHTML={{ __html: introBodyScript() }} />
    </>
  );
}
