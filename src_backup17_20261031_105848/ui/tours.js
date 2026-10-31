const TOURS = {
  '/admin': {
    title: 'Tableau de bord',
    purpose: 'Votre boutique en un coup d’œil : chiffres clés, graphiques et alertes de stock.',
    steps: [
      ['.side nav', 'Le menu', 'Toutes les pages, rangées par thème : Ventes, Stock, Achats, Finance, Administration.', 'right'],
      ['.topbar .store-pick', 'Boutique active', 'Tous les chiffres concernent la boutique choisie ici. Vérifiez-la avant toute saisie.', 'bottom'],
      ['main .grid', 'Chiffres clés', 'Valeur du stock, chiffre d’affaires, dépenses et résultat net (vert s’il est positif, rouge sinon).', 'bottom'],
      ['.split-bar', 'Du CA au résultat', 'Part des dépenses et du résultat net dans le chiffre d’affaires.', 'bottom'],
      ['.charts-grid', 'Graphiques', 'Répartition du chiffre d’affaires, valeur du stock et produits en stock bas.', 'top'],
      ['main h2.row', 'Stock bas', 'Les produits passés sous leur seuil d’alerte : à réapprovisionner.', 'top'],
    ],
  },
  '/admin/sales': {
    title: 'Vente comptoir',
    purpose: 'Enregistrer une vente directe : cherchez, ajoutez au panier, validez.',
    steps: [
      ['.pos .search-box', 'Chercher un produit', 'Tapez un nom. Avec une douchette, Entrée ajoute directement un produit unique.', 'bottom'],
      ['.prod-grid', 'Les produits', 'Un clic sur « Ajouter » (ou sur une taille/couleur) met l’article dans le panier.', 'right'],
      ['.pos-cart .cart-head', 'Le panier', 'Ajustez les quantités avec − et +, retirez une ligne, ou videz tout.', 'left'],
      ['.pos-cart .seg', 'Moyen de paiement', 'Espèces ou Mobile money.', 'left'],
      ['.pos-cart .cart-total', 'Total', 'Somme du panier, mise à jour en direct.', 'left'],
      ['.pay-btn', 'Valider la vente', 'Crée la commande et affiche son numéro. Le bouton se bloque pendant l’envoi.', 'left'],
    ],
  },
  '/admin/orders': {
    title: 'Commandes',
    purpose: 'Suivre les commandes et traiter celles qui attendent une décision.',
    steps: [
      ['main .row', 'Filtres', 'Recherchez par numéro ou client, filtrez par statut, ou affichez seulement celles « À traiter ».', 'bottom'],
      ['main table', 'La liste', 'Statut de la commande, état du paiement et, pour un brouillon, la date d’expiration de la réservation.', 'top'],
      ['main table .link', 'Les actions', 'Détail (articles, historique), Confirmer ou Rejeter un brouillon, valider ou refuser un paiement.', 'left'],
    ],
  },
  '/admin/invoices': {
    title: 'Factures',
    purpose: 'Retrouver les factures, télécharger leur PDF et exporter la liste.',
    steps: [
      ['main .row', 'Filtres et export', 'Recherche, statut, et export Excel de la liste filtrée.', 'bottom'],
      ['main table', 'Les factures', 'Numéro, commande d’origine, client, montant et statut.', 'top'],
      ['main table .link', 'PDF', 'Télécharge la facture. Pour corriger une facture, on émet un avoir.', 'left'],
    ],
  },
  '/admin/credit-notes': {
    title: 'Avoirs',
    purpose: 'Annuler une facture en émettant un avoir.',
    steps: [
      ['form.card', 'Émettre un avoir', 'Choisissez la facture, le montant et le motif. Attention : la facture sera annulée.', 'bottom'],
      ['form.card input[type="checkbox"]', 'Remettre le stock', 'Si coché, les articles retournent en stock.', 'bottom'],
      ['main table', 'Historique', 'Tous les avoirs émis, avec leur facture et leur motif.', 'top'],
    ],
  },
  '/admin/products': {
    title: 'Produits',
    purpose: 'Gérer le catalogue : créer, modifier, supprimer.',
    steps: [
      ['.page-head button', 'Nouveau produit', 'Ouvre le formulaire de création. Vous pouvez y créer une catégorie au passage.', 'left'],
      ['.toolbar .search-box', 'Recherche', 'Filtre la liste pendant la saisie.', 'bottom'],
      ['.table-wrap', 'Le catalogue', 'Cliquez sur un titre pour trier. La marge est calculée, un stock à 0 apparaît en rouge.', 'top'],
      ['.row-actions', 'Modifier / Supprimer', 'Le crayon modifie, la corbeille supprime après confirmation.', 'left'],
    ],
  },
  '/admin/categories': {
    title: 'Catégories',
    purpose: 'Organiser les produits en familles.',
    steps: [
      ['.page-head button', 'Nouvelle catégorie', 'Un nom suffit.', 'left'],
      ['.table-wrap', 'La liste', 'Toutes les catégories existantes.', 'top'],
      ['.row-actions', 'Renommer / Supprimer', 'La suppression peut être refusée si des produits utilisent la catégorie.', 'left'],
    ],
  },
  '/admin/stock': {
    title: 'Mouvements de stock',
    purpose: 'Enregistrer les entrées et sorties de stock, et consulter l’historique.',
    steps: [
      ['form.card', 'Enregistrer un mouvement', 'Produit, type (entrée, perte, retour, ajustement), quantité, coût et motif.', 'bottom'],
      ['main table', 'Historique', 'Les 50 derniers mouvements de la boutique active.', 'top'],
      ['main table .link', 'Annuler', 'Inverse l’effet d’un mouvement.', 'left'],
    ],
  },
  '/admin/transfers': {
    title: 'Transferts',
    purpose: 'Déplacer du stock vers une autre boutique.',
    steps: [
      ['form.card', 'Créer un transfert', 'Le départ est la boutique active. Choisissez la destination, le produit et la quantité.', 'bottom'],
      ['main table', 'Les transferts', 'Trajet, articles et statut.', 'top'],
      ['main table .link', 'Valider / Annuler', 'Tant que le transfert est En attente : Valider déplace le stock, Annuler l’abandonne.', 'left'],
    ],
  },
  '/admin/inventory': {
    title: 'Inventaires',
    purpose: 'Comparer le stock compté au stock attendu et corriger les écarts.',
    steps: [
      ['main h1 ~ button', 'Nouvel inventaire', 'Crée un inventaire pour la boutique active et l’ouvre.', 'bottom'],
      ['main table', 'Les inventaires', 'Cliquez sur « Ouvrir » pour saisir le comptage.', 'top'],
    ],
  },
  '/admin/purchase-orders': {
    title: 'Bons de commande',
    purpose: 'Commander du stock à un fournisseur et le réceptionner.',
    steps: [
      ['form.card', 'Créer un bon', 'Fournisseur, produit, quantité et coût unitaire : un brouillon est créé.', 'bottom'],
      ['main table', 'La liste', 'Brouillon, Commandé, Reçu ou Annulé.', 'top'],
      ['main table .link', 'Les actions', 'Envoyer le brouillon, Tout recevoir (met le stock à jour) ou Annuler.', 'left'],
    ],
  },
  '/admin/suppliers': {
    title: 'Fournisseurs',
    purpose: 'Tenir l’annuaire des fournisseurs.',
    steps: [
      ['.page-head button', 'Nouveau fournisseur', 'Nom obligatoire, téléphone et email facultatifs.', 'left'],
      ['.table-wrap', 'L’annuaire', 'Tous vos fournisseurs.', 'top'],
      ['.row-actions', 'Modifier / Activer', 'Pas de suppression : on désactive un fournisseur.', 'left'],
    ],
  },
  '/admin/expenses': {
    title: 'Dépenses',
    purpose: 'Enregistrer les charges de la boutique : elles alimentent le résultat net.',
    steps: [
      ['.page-head button', 'Nouvelle dépense', 'Libellé, montant, date et catégorie.', 'left'],
      ['.table-wrap', 'Les dépenses', 'Liste paginée par 20.', 'top'],
      ['.row-actions', 'Modifier / Supprimer', 'La suppression demande confirmation.', 'left'],
    ],
  },
  '/admin/reports': {
    title: 'Rapports',
    purpose: 'Produire un rapport PDF sur une période.',
    steps: [
      ['main .card.row', 'Période', 'Choisissez les dates, puis téléchargez le PDF.', 'bottom'],
      ['main .card.row + .card.row', 'Envoi par email', 'Envoie le même rapport à l’adresse saisie.', 'top'],
    ],
  },
  '/admin/users': {
    title: 'Utilisateurs',
    purpose: 'Créer des comptes, changer les rôles, réinitialiser les mots de passe.',
    steps: [
      ['form.card', 'Créer un compte', 'Identité, email, mot de passe (10 caractères minimum), boutique et rôle en boutique.', 'bottom'],
      ['main table', 'Les utilisateurs', 'Liste paginée par 50.', 'top'],
      ['main table select', 'Changer le rôle', 'Demande confirmation. Vous ne pouvez pas modifier votre propre rôle.', 'left'],
    ],
  },
  '/admin/stores': {
    title: 'Boutiques',
    purpose: 'Créer et paramétrer vos points de vente.',
    steps: [
      ['.page-head button', 'Nouvelle boutique', 'Code, coordonnées, TVA, remise, devise et taux de change.', 'left'],
      ['.table-wrap', 'Les boutiques', 'La boutique principale porte un badge.', 'top'],
      ['.row-actions', 'Actions', 'Modifier, définir comme principale (étoile), activer ou désactiver.', 'left'],
    ],
  },
  '/admin/settings': {
    title: 'Paramètres',
    purpose: 'Régler la configuration générale de l’application.',
    steps: [
      ['main form .card', 'Groupes de paramètres', 'Entreprise, Mobile money, WhatsApp, livraison, acompte…', 'right'],
      ['main form > button', 'Enregistrer', 'N’envoie que les champs modifiés.', 'top'],
    ],
  },
  '/admin/audit': {
    title: 'Journal d’audit',
    purpose: 'Consulter qui a fait quoi, et quand. Consultation seule.',
    steps: [
      ['main input.search', 'Recherche', 'Par action, module ou identifiant.', 'bottom'],
      ['main table', 'Le journal', 'Triable, avec export CSV.', 'top'],
    ],
  },
}
export default TOURS