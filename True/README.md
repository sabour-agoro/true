# TRUE

Boutique de la marque TRUE — un univers de mode interstellaire, minimal et haut de gamme.

## Lancer le site

```bash
pnpm install
pnpm dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

Build de production :

```bash
pnpm build
pnpm start
```

## Essayage virtuel

Sans clé, `/api/tryon` reste en mode démo : la pièce est posée sur la photo, et l’interface l’indique. La photo n’est jamais écrite sur le disque.

Pour le rendu réel (FASHN) :

```bash
copy .env.example .env.local
```

```env
TRYON_API_KEY=ta_cle
TRYON_API_URL=https://api.fashn.ai/v1
TRYON_MODEL=tryon-max
```

`tryon-max` envoie `product_image`. `tryon-v1.6` envoie `garment_image` et `category: tops`.

## Prix, stock, Stripe

Les prix sont à `0` dans `data/products.ts`. Le stock est un objet par taille (`XS` à `XXL`). Une taille à `0` est désactivée. Si toutes les tailles sont à `0`, la pièce passe en rupture.

La chemise noire manches courtes est en rupture pour montrer l’état. Remets des quantités pour la rendre achetable.

Le panier (Zustand, persisté dans le navigateur) est prêt pour Stripe. Le bouton de paiement reste inactif tant que le checkout n’est pas branché.

## Médias

- Vidéo d’accueil : `public/hero/trou-noir.mp4` et `.webm` (sans piste audio), poster `trou-noir.jpg`.
- Pièces : `public/products/*.png`.
- Logos : `public/logos/`.

La chemise « TRUE poitrine » peut être remplacée par ta photo au même nom de fichier. Les vues de face manquantes se branchent en ajoutant un champ `front` dans `data/products.ts`.

Pour régénérer la vidéo ou les détourages : `python scripts/generate_hero.py` et `python scripts/prepare_assets.py` (Pillow, NumPy).
