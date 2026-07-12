# 🧾 Quincaillerie Mabane – Gestion

Application de gestion complète pour la **Quincaillerie Mabane** (Diouroup, Sénégal), gérée par Mamadou Faye (Momo Faye).

Stack : **React (Vite) + Tailwind CSS + React Query + Supabase (PostgreSQL/Auth/Storage)**.

## ✨ Fonctionnalités incluses

- 🔐 Authentification Supabase (connexion, inscription admin, rôles admin/caissier/employé)
- 🌞🌙 Mode clair / sombre avec sauvegarde de préférence
- 📦 Gestion des produits (CRUD, image, catégorie, prix, stock, seuil d'alerte)
- 🗂️ Gestion des catégories
- 📊 Gestion du stock (entrées/sorties, historique, alertes de rupture)
- 👥 Gestion des clients (avec historique d'achats)
- 🚚 Gestion des fournisseurs
- 🧾 Facturation (panier, calcul automatique, remise) avec génération PDF au design personnalisé Mabane
- 📲 Envoi de facture par **WhatsApp** en un clic (lien `wa.me` pré-rempli — voir note ci-dessous pour l'envoi 100% automatique côté serveur)
- 💸 Finances (recettes, dépenses, bénéfice)
- 📊 Tableau de bord (ventes du jour, revenus du mois, ruptures de stock, top produits)
- 🔔 Notifications de stock faible dans la barre supérieure
- 📁 Export PDF (factures) et Excel (ventes, stock, dépenses)
- 🔎 Recherche globale (produits, clients)
- 📱 Interface 100% responsive (mobile, tablette, desktop)
- 🔐 Sécurité via Row Level Security (RLS) Supabase

## 🚀 Installation

### 1. Prérequis
- Node.js 18+
- Un compte [Supabase](https://supabase.com) (gratuit)

### 2. Créer le projet Supabase
1. Créez un nouveau projet sur [supabase.com](https://supabase.com).
2. Allez dans **SQL Editor** et exécutez tout le contenu du fichier [`supabase/schema.sql`](./supabase/schema.sql). Cela crée :
   - toutes les tables (users, products, categories, clients, suppliers, sales, sale_items, stock_movements, expenses)
   - les fonctions (numérotation de facture, création de vente atomique, entrée de stock)
   - les policies RLS
   - le bucket de stockage `product-images` pour les photos produits
   - les catégories par défaut (Ciment, Fer, Électricité, Plomberie, Divers)

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env
```
Remplissez `.env` avec l'URL et la clé anonyme de votre projet (**Project Settings → API** dans Supabase) :
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Installer et lancer
```bash
npm install
npm run dev
```
L'application est disponible sur `http://localhost:5173`.

### 5. Créer le premier compte administrateur
1. Ouvrez l'application → cliquez sur **"Créer le compte administrateur"** depuis la page de connexion.
2. Renseignez vos informations. Le compte est automatiquement créé avec le rôle `admin`.
3. Pour créer d'autres comptes (caissier, employé), l'administrateur doit aller dans **Supabase → Authentication → Users → Add user**, puis assigner le rôle voulu depuis la page **Utilisateurs** de l'application.

## 📲 Envoi de factures via WhatsApp

Par défaut, l'application utilise un lien `wa.me` : en cliquant sur "Envoyer WhatsApp", WhatsApp s'ouvre (Web ou application) avec le message de facture déjà rédigé — il suffit d'appuyer sur "Envoyer". C'est la méthode **la plus fiable et gratuite**, sans clé API ni backend à maintenir.

Pour un envoi **totalement automatique côté serveur** (sans aucun clic), un modèle de fonction Supabase Edge est fourni dans [`supabase/functions/send-whatsapp`](./supabase/functions/send-whatsapp/index.ts), basé sur l'API **Meta WhatsApp Cloud**. Cela nécessite :
1. Un compte [Meta for Developers](https://developers.facebook.com/) avec un numéro WhatsApp Business configuré.
2. Déployer la fonction : `supabase functions deploy send-whatsapp`
3. Définir les secrets : `supabase secrets set WHATSAPP_TOKEN=xxx WHATSAPP_PHONE_ID=xxx`
4. Appeler `supabase.functions.invoke('send-whatsapp', { body: { phone, message } })` depuis le frontend à la place de `sendInvoiceViaWhatsApp`.

## 🗃️ Structure du projet

```
src/
  components/     → Layout, Sidebar, Topbar, Modal, ConfirmDialog, StatCard, ThemeToggle...
  context/        → AuthContext (session/rôle), ThemeContext (clair/sombre)
  hooks/          → hooks React Query par entité (produits, ventes, stock, dashboard...)
  lib/            → client Supabase, constantes (infos boutique, rôles)
  pages/          → une page par module (auth, dashboard, products, sales, stock...)
  utils/          → génération PDF factures, envoi WhatsApp, export Excel
supabase/
  schema.sql              → schéma complet + RLS + fonctions + bucket storage
  functions/send-whatsapp → fonction Edge optionnelle (API Meta WhatsApp Cloud)
```

## 🏗️ Build de production

```bash
npm run build
```
Le dossier `dist/` peut être déployé sur Vercel, Netlify, ou tout hébergeur statique.

## 🧠 Évolutions futures suggérées
- Application mobile avec React Native (réutilisation des hooks Supabase)
- Scanner de code-barres (librairie `html5-qrcode`, à brancher sur la recherche produit)
- Prédiction de rupture de stock par IA (analyse des `stock_movements`)
- SMS automatique (Twilio) en complément du WhatsApp

## 📞 Contact Quincaillerie Mabane
Mamadou Faye (Momo Faye) — Diouroup, Sénégal
+221 77 845 28 72 · +221 78 213 33 12 · +221 77 979 20 90
