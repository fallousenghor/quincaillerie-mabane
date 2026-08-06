-- ============================================================================
-- TABLE knowledge_base : FAQ et documents pour le RAG du chatbot
-- ============================================================================
create table if not exists public.knowledge_base (
  id uuid primary key default uuid_generate_v4(),
  category text not null, -- e.g., "produits", "clients", "fournisseurs", "ventes", "general"
  title text not null,
  content text not null, -- Le contenu complet du document/FAQ
  tags text[], -- Tags pour la recherche (e.g., ["ciment", "prix"])
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_kb_category on public.knowledge_base(category);
create index if not exists idx_kb_title on public.knowledge_base using gin(to_tsvector('french', title));
create index if not exists idx_kb_content on public.knowledge_base using gin(to_tsvector('french', content));

-- ============================================================================
-- DONNEES DE BASE : FAQ et documents quincaillerie
-- ============================================================================
insert into public.knowledge_base (category, title, content, tags) values
(
  'general',
  'À propos de Quincaillerie Mabane',
  'Quincaillerie Mabane est basée à Diouroup, Sénégal. Notre boutique propose une large gamme de produits de quincaillerie incluant du ciment, du fer, des fournitures électriques, de plomberie et bien d''autres. Nous sommes gérés par Mamadou Faye (Momo Faye) et nostres l''excellente relation client avec les prix justes.',
  ('{"quincaillerie", "mabane", "diouroup", "contact"}'::text[])
),
(
  'produits',
  'Catégories de produits disponibles',
  'Les catégories principales chez Mabane sont : Ciment (ciments gris, blancs), Fer (barres, profilés, tôles), Électricité (fils, câbles, appareillages), Plomberie (tuyaux, raccords, robinetterie) et Divers (outillage, quincaillerie générale). Tous nos produits sont de bonne qualité et aux meilleurs prix du marché.',
  ('{"produits", "categories", "assortiment"}'::text[])
),
(
  'produits',
  'Comment connaître le prix d''un produit ?',
  'Pour connaître le prix d''un produit, consultez la section "Produits" dans l''application. Vous pouvez rechercher par nom. Les prix affichés sont les prix de vente actuels. Pour une demande de devis massif ou un partenariat, contactez directement Momo Faye.',
  ('{"prix", "promotion", "devis"}'::text[])
),
(
  'stock',
  'Qu''est-ce qu''une alerte de rupture de stock ?',
  'Une alerte de rupture apparaît dans le tableau de bord quand un produit atteint son seuil d''alerte défini. Cela signifie que le stock du produit est bas et un réapprovisionnement est recommandé. Les gestionnaires peuvent consulter le tableau de bord pour voir l''état du stock en temps réel.',
  ('{"stock", "rupture", "alerte", "reapprovisionnement"}'::text[])
),
(
  'stock',
  'Comment gérer les entrées et sorties de stock ?',
  'Dans la section "Stock", vous pouvez enregistrer les entrées (achats chez les fournisseurs) et les sorties (ventes aux clients). Chaque mouvement enregistre automatiquement l''historique et met à jour la quantité disponible. Les gestionnaires voient un historique complet dans l''onglet "Mouvements".',
  ('{"stock", "entrees", "sorties", "historique"}'::text[])
),
(
  'ventes',
  'Comment créer et envoyer une facture ?',
  'Allez à la section "Ventes / Facturation", créez une nouvelle facture, ajoutez des produits au panier (quantité et prix unitaire), calculez les remises si applicable, et générez la facture. Vous pouvez télécharger le PDF avec le logo Mabane personnalisé. Ensuite, envoyez la facture par WhatsApp au client en un clique.',
  ('{"facturation", "facture", "vente", "pdf", "whatsapp"}'::text[])
),
(
  'ventes',
  'Quels statuts de paiement existent ?',
  'Les statuts possibles pour une facture sont : Payée (paiement complet reçu), Partielle (paiement partiel), Crédit (facture à crédit restera à payer), Annulée (facture annulée). Vous pouvez modifier le statut dans l''application après création.',
  ('{"paiement", "facture", "statut", "credit"}'::text[])
),
(
  'clients',
  'Comment ajouter un client ?',
  'Dans la section "Clients", cliquez sur "Nouveau client" et remplissez le formulaire (nom, téléphone, email, adresse). Les clients sont sauvegardés et vous pouvez consulter leur historique d''achats. Cela facilite la gestion des ventes et du suivi client.',
  ('{"client", "ajouter", "nouveau"}'::text[])
),
(
  'clients',
  'Comment consulter l''historique d''un client ?',
  'Sélectionnez un client dans la liste, vous verrez un résumé de ses achats (nombre de factures, montant total dépensé, dernière date d''achat). Cela aide à identifier les clients réguliers et les VIP à fidéliser.',
  ('{"client", "historique", "achats"}'::text[])
),
(
  'fournisseurs',
  'Comment gérer les fournisseurs ?',
  'Dans "Fournisseurs", vous pouvez ajouter, modifier ou supprimer des fournisseurs. Enregistrez leur nom, contact, email, et les produits qu''ils fournissent. Cette gestion centralisée aide au réapprovisionnement efficace.',
  ('{"fournisseur", "approvisionnement", "contact"}'::text[])
),
(
  'finances',
  'Comment voir les finances (recettes et dépenses) ?',
  'La section "Finances" affiche un résumé des recettes (total des ventes), affichée des dépenses (achats chez les fournisseurs), et le bénéfice net. Vous pouvez exporter les données en Excel pour analyse approfondie.',
  ('{"finances", "recettes", "depenses", "benefice", "excel"}'::text[])
),
(
  'utilisateurs',
  'Quels sont les rôles d''utilisateur disponibles ?',
  'Les rôles sont : Admin (accès complet, gestion des utilisateurs), Caissier (ventes et facturation), Employé (consultation seulement). Seul l''admin peut ajouter ou modifier les rôles d''autre utilisateurs.',
  ('{"utilisateur", "role", "admin", "caissier", "employe", "permission"}'::text[])
),
(
  'general',
  'Comment exporter les données en Excel ?',
  'De nombreuses pages (Ventes, Produits, Clients, Finances) offrent un bouton "Exporter en Excel". Cliquez dessus pour télécharger un fichier .xlsx que vous pouvez ouvrir dans Excel ou LibreOffice pour analyse et reporting.',
  ('{"export", "excel", "telecharger", "rapport"}'::text[])
),
(
  'general',
  'Comment changer de mode sombre / clair ?',
  'Cliquez sur l''icône lune/soleil dans la barre de navigation en haut. Le mode se bascule automatiquement et votre préférence est sauvegardée.',
  ('{"theme", "mode", "sombre", "clair", "interface"}'::text[])
);

-- RLS (Row Level Security) - Les utilisateurs authentifiés peuvent lire toute la KB
alter table public.knowledge_base enable row level security;

create policy "ALLOW READ KB FOR AUTHENTICATED"
  on public.knowledge_base for select
  to authenticated
  using (true);

create policy "ALLOW ADMIN MANAGE KB"
  on public.knowledge_base for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin');
