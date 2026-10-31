import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'

const SECTIONS = [
  {
    id: 'reperes', group: 'Prise en main', title: 'Repères généraux',
    purpose: 'Comprendre la structure de l’écran et les comportements communs à toutes les pages.',
    blocks: [
      { h: 'Structure de l’écran', rows: [
        ['Barre latérale (gauche)', 'Menu groupé en sections : Ventes, Stock, Achats, Finance, Administration. Le bouton en haut la replie en icônes. Sur mobile, elle devient un tiroir ouvert par le bouton ☰.'],
        ['Barre du haut', 'Fil d’Ariane (section / page), sélecteur de boutique, bascule clair/sombre, identité de l’utilisateur et déconnexion.'],
        ['Zone centrale', 'Le contenu de la page : titre, boutons d’action, tableaux, graphiques.'],
      ] },
      { h: 'La boutique active', rows: [
        ['Sélecteur de boutique', 'Détermine la boutique dont on voit les données (stock, dépenses, ventes, tableau de bord). À vérifier avant toute saisie : une vente ou un mouvement est rattaché à la boutique sélectionnée.'],
      ] },
      { h: 'Comportements communs', rows: [
        ['Ctrl + K', 'Ouvre la recherche rapide : taper le nom d’une page pour y aller. Échap pour fermer.'],
        ['Notifications', 'Un message vert ou rouge en haut à droite confirme une action ou signale une erreur.'],
        ['Confirmations', 'Toute action sensible (suppression, vider le panier, changer de boutique principale) demande une confirmation.'],
        ['Fenêtres (modales)', 'Création et modification s’ouvrent dans une fenêtre. Échap ou « Annuler » la ferme sans rien enregistrer.'],
        ['Mode sombre', 'Bouton lune/soleil dans la barre du haut, choix mémorisé.'],
      ] },
      { h: 'Les tableaux', rows: [
        ['Recherche', 'Apparaît à partir de 9 lignes. Filtre sur toutes les colonnes visibles.'],
        ['Tri', 'Clic sur un titre de colonne : ordre croissant, puis décroissant.'],
        ['Densité', 'Bouton à lignes : bascule entre affichage confortable et compact (mémorisé).'],
        ['CSV', 'Exporte les lignes affichées (après recherche et tri), lisible dans Excel avec les accents.'],
        ['Répartition', 'Si le tableau a une colonne de statut, affiche un graphique circulaire du nombre de lignes par statut.'],
        ['Pagination', 'Sous le tableau quand il y a plusieurs pages : Précédent / Suivant.'],
      ] },
    ],
  },
  {
    id: 'connexion', group: 'Prise en main', title: 'Connexion', to: '/login',
    purpose: 'Accéder à l’application de façon sécurisée, avec une double authentification (2FA).',
    blocks: [
      { h: 'Étapes', rows: [
        ['Identifiants', 'Saisir l’email et le mot de passe, puis « Se connecter ».'],
        ['Activation du 2FA (première connexion)', 'Scanner le QR code avec Google Authenticator ou Authy (ou saisir la clé manuelle), puis entrer le code à 6 chiffres.'],
        ['Codes de secours', 'À noter immédiatement : ils ne sont plus affichés ensuite. Chacun remplace un code d’application en cas de perte du téléphone.'],
        ['Vérification (connexions suivantes)', 'Saisir le code à 6 chiffres, ou cliquer « Utiliser un code de secours ».'],
      ] },
    ],
  },
  {
    id: 'dashboard', group: 'Prise en main', title: 'Tableau de bord', to: '/admin',
    purpose: 'Avoir en un coup d’œil la santé financière et le niveau de stock de la boutique active.',
    blocks: [
      { h: 'Indicateurs', rows: [
        ['Valeur du stock (achat)', 'Ce que le stock actuel a coûté à l’achat.'],
        ['Valeur du stock (vente)', 'Ce que le stock rapporterait s’il était vendu au prix public.'],
        ['Marge potentielle (%)', 'Écart entre la valeur de vente et la valeur d’achat du stock.'],
        ['Chiffre d’affaires', 'Total des ventes calculé par le serveur.'],
        ['Dépenses', 'Total des dépenses enregistrées.'],
        ['Résultat net', 'Chiffre d’affaires moins dépenses. Vert s’il est positif, rouge s’il est négatif.'],
      ] },
      { h: 'Graphiques et listes', rows: [
        ['Du chiffre d’affaires au résultat', 'Barre montrant la part des dépenses et du résultat net dans le chiffre d’affaires (affichée si le CA est supérieur à 0).'],
        ['Graphique « Chiffre d’affaires »', 'Donut : dépenses et résultat net, avec le CA au centre.'],
        ['Graphique « Valeur du stock »', 'Donut : coût d’achat et marge potentielle, avec la valeur de vente au centre.'],
        ['Graphique « Stock bas »', 'Barres comparant le stock disponible au seuil d’alerte, pour les 8 premiers produits concernés.'],
        ['Produits en stock bas', 'Liste complète des produits dont le stock disponible est passé sous le seuil.'],
      ] },
    ],
    tip: 'Changer de boutique met les chiffres à jour. Un produit en stock bas appelle une entrée de stock, un transfert ou un bon de commande.',
  },
  {
    id: 'sales', group: 'Ventes', title: 'Vente comptoir', to: '/admin/sales',
    purpose: 'Enregistrer une vente directe au comptoir.',
    blocks: [
      { h: 'Sections', rows: [
        ['Recherche produit', 'Filtre les produits de la boutique. Avec une douchette ou au clavier, Entrée ajoute directement le produit s’il n’y a qu’un résultat sans variante.'],
        ['Grille de produits', 'Une carte par produit : nom, prix, bouton « Ajouter ». Si le produit a des variantes, un bouton par taille/couleur.'],
        ['Panier', 'Lignes ajoutées, boutons − et + pour la quantité, corbeille pour retirer, « Vider » pour tout supprimer (avec confirmation).'],
        ['Moyen de paiement', 'Espèces / à la livraison, ou Mobile money.'],
        ['Client, Téléphone, Destination', 'Tous optionnels. Laisser la destination vide pour une vente locale. Le téléphone est contrôlé (6 caractères minimum : chiffres, espaces, + . -).'],
        ['Total', 'Somme des sous-totaux du panier.'],
        ['Valider la vente', 'Crée la commande et affiche son numéro. Le bouton est bloqué pendant l’envoi pour éviter les doublons.'],
      ] },
    ],
  },
  {
    id: 'orders', group: 'Ventes', title: 'Commandes', to: '/admin/orders', partial: true,
    purpose: 'Suivre les commandes et traiter celles qui attendent une décision.',
    blocks: [
      { h: 'Actions', rows: [
        ['Confirmer', 'Transforme une commande brouillon en commande effective.'],
        ['Rejeter', 'Refuse une commande brouillon, avec un motif. Le stock réservé est libéré.'],
        ['Valider le paiement', 'Passe le paiement à « Payée ».'],
        ['Rejeter le paiement', 'Refuse le paiement, avec une note.'],
      ] },
    ],
  },
  {
    id: 'invoices', group: 'Ventes', title: 'Factures', to: '/admin/invoices', partial: true,
    purpose: 'Consulter les factures émises à partir des commandes.',
    blocks: [
      { h: 'Ce que permet le serveur', rows: [
        ['Liste et recherche', 'Toutes les factures, ou celle d’une commande donnée.'],
        ['PDF', 'Télécharge le PDF d’une facture.'],
        ['Export Excel', 'Exporte la liste des factures.'],
        ['Modification / suppression', 'Non prévues : une facture émise est un document comptable. Pour corriger, on émet un avoir.'],
      ] },
    ],
  },
  {
    id: 'credit', group: 'Ventes', title: 'Avoirs', to: '/admin/credit-notes', partial: true,
    purpose: 'Annuler tout ou partie d’une facture (retour client, erreur).',
    blocks: [
      { h: 'Champs', rows: [
        ['Facture concernée', 'La facture à corriger.'],
        ['Montant', 'Valeur de l’avoir.'],
        ['Motif', 'Raison, conservée pour l’audit.'],
        ['Restituer le stock', 'Si coché, les articles retournent en stock.'],
      ] },
    ],
  },
  {
    id: 'products', group: 'Stock', title: 'Produits', to: '/admin/products',
    purpose: 'Gérer le catalogue : créer, modifier, supprimer.',
    blocks: [
      { h: 'Actions', rows: [
        ['Nouveau produit', 'Ouvre la fenêtre de création : nom, prix de vente, prix d’achat (optionnel), catégorie.'],
        ['Nouvelle catégorie (dans la fenêtre)', 'Crée une catégorie sans quitter le formulaire ; elle est sélectionnée automatiquement.'],
        ['Recherche', 'Filtre la liste après une courte pause de saisie.'],
        ['Crayon', 'Modifie le produit (nom, prix, achat, catégorie).'],
        ['Corbeille', 'Supprime après confirmation. Le serveur peut refuser si le produit est déjà lié à des commandes.'],
      ] },
      { h: 'Colonnes', rows: [
        ['Nom, Prix, Achat', 'Désignation, prix de vente et prix d’achat.'],
        ['Marge', 'En %, calculée à partir des deux prix.'],
        ['Stock', 'Quantité totale. Rouge à 0.'],
        ['Réservé', 'Quantité promise à des commandes non finalisées.'],
        ['Statut', 'Publié, Brouillon ou Archivé.'],
      ] },
    ],
    tip: 'Le stock initial ne se saisit pas ici, mais dans Mouvements (une entrée), pour être rattaché à une boutique.',
  },
  {
    id: 'categories', group: 'Stock', title: 'Catégories', to: '/admin/categories',
    purpose: 'Organiser les produits en familles.',
    blocks: [
      { h: 'Actions', rows: [
        ['Nouvelle catégorie', 'Un nom suffit.'],
        ['Crayon', 'Renomme la catégorie.'],
        ['Corbeille', 'Supprime après confirmation. Le serveur peut refuser si des produits l’utilisent encore.'],
      ] },
    ],
  },
  {
    id: 'stock', group: 'Stock', title: 'Mouvements', to: '/admin/stock', partial: true,
    purpose: 'Historique de toutes les entrées, sorties et ajustements de stock de la boutique.',
    blocks: [
      { h: 'Actions', rows: [
        ['Créer un mouvement', 'Par exemple une entrée pour le stock initial ou une réception hors bon de commande.'],
        ['Annuler un mouvement', 'Inverse son effet sur le stock.'],
      ] },
    ],
  },
  {
    id: 'transfers', group: 'Stock', title: 'Transferts', to: '/admin/transfers', partial: true,
    purpose: 'Déplacer du stock d’une boutique à une autre.',
    blocks: [
      { h: 'Actions', rows: [
        ['Créer', 'Boutique source (la boutique active), boutique destination, produit, quantité.'],
        ['Valider', 'Le stock bouge réellement.'],
        ['Annuler', 'Abandonne le transfert.'],
      ] },
    ],
  },
  {
    id: 'inventory', group: 'Stock', title: 'Inventaires', to: '/admin/inventory', partial: true,
    purpose: 'Comparer le stock réel (compté) au stock théorique.',
    blocks: [
      { h: 'Déroulement', rows: [
        ['1. Créer', 'Ouvre un inventaire pour la boutique active.'],
        ['2. Compter', 'Saisir les quantités comptées et enregistrer le comptage (modifiable tant que non validé).'],
        ['3. Valider', 'Applique les écarts. Affiche le nombre d’ajustements, les gains (+) et les pertes (−).'],
        ['Annuler', 'Abandonne l’inventaire sans rien ajuster.'],
      ] },
    ],
  },
  {
    id: 'po', group: 'Achats', title: 'Bons de commande', to: '/admin/purchase-orders', partial: true,
    purpose: 'Commander du stock à un fournisseur et le réceptionner.',
    blocks: [
      { h: 'Statuts et actions', rows: [
        ['Brouillon', 'Envoyer au fournisseur, ou annuler.'],
        ['Commandé', 'Réceptionner (totalement ou partiellement), ou annuler.'],
        ['Reçu / Annulé', 'Consultation seulement.'],
      ] },
      { h: 'Création', rows: [
        ['Champs', 'Fournisseur, produit, quantité, coût unitaire. La réception met à jour le stock.'],
      ] },
    ],
  },
  {
    id: 'suppliers', group: 'Achats', title: 'Fournisseurs', to: '/admin/suppliers',
    purpose: 'Tenir l’annuaire des fournisseurs.',
    blocks: [
      { h: 'Actions', rows: [
        ['Nouveau fournisseur', 'Nom obligatoire, téléphone et email facultatifs.'],
        ['Crayon', 'Modifie le fournisseur.'],
        ['Bouton d’alimentation', 'Active ou désactive. Il n’existe pas de suppression : on désactive.'],
      ] },
    ],
  },
  {
    id: 'expenses', group: 'Finance', title: 'Dépenses', to: '/admin/expenses',
    purpose: 'Enregistrer les charges de la boutique, qui alimentent le résultat net du tableau de bord.',
    blocks: [
      { h: 'Champs et actions', rows: [
        ['Libellé, Montant, Date', 'Description, valeur et date de la dépense.'],
        ['Catégorie', 'Achat de stock, Livraison, Marketing, Emballage, Salaires, Loyer, Charges, Autre.'],
        ['Crayon et corbeille', 'Modifier, ou supprimer après confirmation.'],
        ['Pagination', 'La liste est paginée par 20.'],
      ] },
    ],
  },
  {
    id: 'reports', group: 'Finance', title: 'Rapports', to: '/admin/reports', partial: true,
    purpose: 'Produire un rapport sur une période (champs « du » et « au »).',
    blocks: [
      { h: 'Actions', rows: [
        ['Télécharger', 'Génère le rapport en fichier.'],
        ['Envoyer par email', 'Envoie le rapport à l’adresse saisie.'],
      ] },
    ],
  },
  {
    id: 'users', group: 'Administration', title: 'Utilisateurs', to: '/admin/users', partial: true,
    purpose: 'Gérer les comptes du personnel.',
    blocks: [
      { h: 'Actions', rows: [
        ['Créer un membre du personnel', 'Ajoute un compte avec un rôle.'],
        ['Changer le rôle', 'Avec confirmation.'],
        ['Réinitialiser le mot de passe', 'Définit un nouveau mot de passe pour la personne.'],
        ['Limites', 'Pas de modification du profil ni de suppression de compte côté serveur.'],
      ] },
      { h: 'Rôles', rows: [
        ['Administrateur, Gérant, Employé, Vendeur, Caissier', 'Les droits exacts dépendent de la configuration du serveur.'],
      ] },
    ],
  },
  {
    id: 'stores', group: 'Administration', title: 'Boutiques', to: '/admin/stores',
    purpose: 'Créer et paramétrer les points de vente.',
    blocks: [
      { h: 'Champs', rows: [
        ['Code', 'Identifiant court (6 caractères max, ex. DKR). Non modifiable après création.'],
        ['Nom, Adresse, Téléphone', 'Coordonnées de la boutique.'],
        ['TVA % et Remise %', 'Taux appliqués par défaut dans cette boutique.'],
        ['Devise et Taux de change', 'Monnaie de la boutique (ex. XOF) et son taux.'],
        ['Principale', 'La boutique de référence. Une seule à la fois.'],
      ] },
      { h: 'Actions par ligne', rows: [
        ['Crayon', 'Modifier.'],
        ['Étoile', 'Définir comme principale, avec confirmation.'],
        ['Bouton d’alimentation', 'Activer ou désactiver. Pas de suppression.'],
      ] },
    ],
  },
  {
    id: 'settings', group: 'Administration', title: 'Paramètres', to: '/admin/settings', partial: true,
    purpose: 'Régler la configuration générale de l’application.',
    blocks: [
      { h: 'Fonctionnement', rows: [
        ['Enregistrer', 'Les champs modifiés sont enregistrés ensemble. Réservé aux administrateurs.'],
      ] },
    ],
  },
  {
    id: 'audit', group: 'Administration', title: 'Audit', to: '/admin/audit', partial: true,
    purpose: 'Consulter le journal des actions sensibles.',
    blocks: [
      { h: 'Contenu', rows: [
        ['Journal', 'Qui a fait quoi, quand, et depuis quelle adresse IP. Consultation seule : le journal ne se modifie pas.'],
      ] },
    ],
  },
  {
    id: 'lexique', group: 'Référence', title: 'Lexique des statuts',
    purpose: 'Comprendre le sens des statuts affichés dans l’application.',
    blocks: [
      { h: 'Statuts', rows: [
        ['Brouillon', 'Créé mais pas encore engagé.'],
        ['En attente', 'Attend une décision ou un paiement.'],
        ['Confirmée / Validé', 'Acceptée, l’opération est effective.'],
        ['Commandé', 'Bon envoyé au fournisseur.'],
        ['Reçu', 'Marchandise réceptionnée.'],
        ['Payée / Non payée', 'État du règlement.'],
        ['Rejetée / Annulée', 'Refusée ou abandonnée (le stock réservé est libéré).'],
        ['Actif / Inactif', 'Disponible ou désactivé.'],
        ['Publié / Archivé', 'Produit visible ou retiré du catalogue.'],
      ] },
    ],
  },
  {
    id: 'faq', group: 'Référence', title: 'Questions fréquentes',
    purpose: 'Réponses rapides aux blocages les plus courants.',
    blocks: [
      { h: 'Dépannage', rows: [
        ['Je ne peux pas créer de produit.', 'Il faut au moins une catégorie : crée-la depuis la fenêtre « Nouveau produit » ou la page Catégories.'],
        ['Mon produit est à 0 en stock.', 'Fais une entrée dans Mouvements, dans la bonne boutique.'],
        ['Je n’arrive pas à supprimer un produit ou une catégorie.', 'Le serveur refuse si l’élément est encore utilisé ailleurs. Archive le produit à la place.'],
        ['Je vois d’autres chiffres qu’hier.', 'Vérifie la boutique sélectionnée en haut à droite.'],
        ['J’ai perdu mon téléphone du 2FA.', 'Utilise un code de secours, puis demande à un administrateur de réinitialiser ton accès.'],
      ] },
    ],
  },
]

export const GUIDE_SECTIONS = SECTIONS
const GROUPS = [...new Set(SECTIONS.map((s) => s.group))]
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const haystack = (s) => norm([s.title, s.purpose, s.tip || '', ...s.blocks.flatMap((b) => [b.h, ...b.rows.flat()])].join(' '))

export default function Help() {
  const [q, setQ] = useState('')
  const needle = norm(q.trim())
  const shown = useMemo(() => (needle ? SECTIONS.filter((s) => haystack(s).includes(needle)) : SECTIONS), [needle])

  const go = (id) => document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div>
      <div className="page-head"><h1>Aide et guide d’utilisation</h1></div>
      <div className="help">
        <nav className="help-toc card" aria-label="Sommaire">
          <div className="search-box" style={{ maxWidth: 'none', marginBottom: 10 }}>
            <Search size={15} />
            <input className="search" placeholder="Rechercher dans l’aide…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {GROUPS.map((g) => {
            const items = shown.filter((s) => s.group === g)
            if (!items.length) return null
            return (
              <div key={g}>
                <div className="nav-title" style={{ padding: '10px 4px 4px' }}>{g}</div>
                {items.map((s) => <button key={s.id} type="button" className="toc-link" onClick={() => go(s.id)}>{s.title}</button>)}
              </div>
            )
          })}
          {!shown.length && <div className="small muted">Aucun résultat.</div>}
        </nav>

        <div className="help-body">
          <p className="muted" style={{ marginTop: 0 }}>
            Les écrans marqués <span className="badge warning">Aperçu</span> sont décrits d’après leurs fonctions principales ; leur agencement exact peut différer légèrement.
          </p>
          {shown.map((s) => (
            <section key={s.id} id={`help-${s.id}`} className="card help-section">
              <div className="help-head">
                <h2>{s.title} {s.partial && <span className="badge warning">Aperçu</span>}</h2>
                {s.to && s.to !== '/login' && <Link to={s.to} className="help-open">Ouvrir la page <ArrowRight size={14} /></Link>}
              </div>
              <p className="help-purpose"><strong>À quoi sert l’écran :</strong> {s.purpose}</p>
              {s.blocks.map((b) => (
                <div key={b.h}>
                  <h3 className="help-h3">{b.h}</h3>
                  <dl className="help-dl">
                    {b.rows.map(([t, d]) => (<div key={t}><dt>{t}</dt><dd>{d}</dd></div>))}
                  </dl>
                </div>
              ))}
              {s.tip && <div className="help-tip"><strong>À retenir :</strong> {s.tip}</div>}
            </section>
          ))}
          {!shown.length && <div className="empty">Aucune rubrique ne correspond à « {q} ».</div>}
        </div>
      </div>
    </div>
  )
}