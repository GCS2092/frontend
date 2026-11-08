// Titres de colonnes (clé technique -> libellé)
export const COLS = {
  name: 'Nom', price: 'Prix', purchasePrice: 'Prix d’achat', stock: 'Stock', reservedStock: 'Réservé',
  availableStock: 'Disponible', lowStockAlert: 'Seuil d’alerte', status: 'Statut', label: 'Libellé',
  amount: 'Montant', category: 'Catégorie', date: 'Date', code: 'Code', phone: 'Téléphone', email: 'Email',
  address: 'Adresse', taxRate: 'TVA %', discountRate: 'Remise %', currency: 'Devise', exchangeRate: 'Taux de change',
  isActive: 'Actif', isMain: 'Principale', createdAt: 'Créé le', updatedAt: 'Modifié le',
  orderNumber: 'N° commande', invoiceNumber: 'N° facture', creditNoteNumber: 'N° avoir', number: 'Numéro',
  reference: 'Référence', sku: 'Référence', slug: 'Identifiant', paymentStatus: 'Paiement', paymentMethod: 'Mode de paiement',
  total: 'Total', totalAmount: 'Montant total', subtotal: 'Sous-total', quantity: 'Quantité', unitCost: 'Coût unitaire',
  unitPrice: 'Prix unitaire', type: 'Type', reason: 'Motif', note: 'Note', notes: 'Notes', description: 'Description',
  firstName: 'Prénom', lastName: 'Nom', fullName: 'Nom complet', role: 'Rôle', guestName: 'Client', guestPhone: 'Téléphone client',
  destination: 'Destination', action: 'Action', entity: 'Entité', entityId: 'ID entité', ipAddress: 'Adresse IP',
  supplier: 'Fournisseur', supplierName: 'Fournisseur', storeName: 'Boutique', fromStore: 'Boutique source', toStore: 'Boutique destination',
  dueDate: 'Échéance', issuedAt: 'Émise le', paidAt: 'Payée le', deliveredAt: 'Livrée le', sentAt: 'Envoyée le',
  receivedAt: 'Reçue le', validatedAt: 'Validée le', countedAt: 'Compté le', restoreStock: 'Stock restitué',
  discount: 'Remise', tax: 'TVA', shipping: 'Livraison', balance: 'Solde', margin: 'Marge', profit: 'Bénéfice',
  revenue: 'Chiffre d’affaires', expenses: 'Dépenses', count: 'Nombre', title: 'Titre', value: 'Valeur',
  lastLogin: 'Dernière connexion', twoFactorEnabled: 'Double authentification', emailVerified: 'Email vérifié',
}

// Valeurs techniques (ENUM) -> libellé
export const VALS = {
  PUBLISHED: 'Publié', DRAFT: 'Brouillon', ARCHIVED: 'Archivé', ACTIVE: 'Actif', INACTIVE: 'Inactif',
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation', SHIPPED: 'Expédiée', DELIVERED: 'Livrée',
  CANCELLED: 'Annulée', CANCELED: 'Annulée', REJECTED: 'Rejetée', REFUNDED: 'Remboursée', FAILED: 'Échouée',
  PAID: 'Payée', UNPAID: 'Non payée', PARTIALLY_PAID: 'Partiellement payée', PARTIAL: 'Partiel',
  ORDERED: 'Commandé', SENT: 'Envoyé', RECEIVED: 'Reçu', PARTIALLY_RECEIVED: 'Partiellement reçu',
  VALIDATED: 'Validé', COMPLETED: 'Terminé', IN_PROGRESS: 'En cours', OPEN: 'Ouvert', CLOSED: 'Clôturé',
  IN_TRANSIT: 'En transit', EXPIRED: 'Expiré', ISSUED: 'Émise', VOID: 'Annulée',
  ADMIN: 'Administrateur', SUPER_ADMIN: 'Super administrateur', MANAGER: 'Gérant', STAFF: 'Employé',
  SELLER: 'Vendeur', CASHIER: 'Caissier', CUSTOMER: 'Client', USER: 'Utilisateur',
  CASH_ON_DELIVERY: 'Espèces / livraison', MOBILE_MONEY: 'Mobile money', CASH: 'Espèces', CARD: 'Carte', TRANSFER: 'Virement',
  STOCK_PURCHASE: 'Achat de stock', SHIPPING: 'Livraison', MARKETING: 'Marketing', PACKAGING: 'Emballage',
  SALARY: 'Salaires', RENT: 'Loyer', UTILITIES: 'Charges', OTHER: 'Autre',
  IN: 'Entrée', OUT: 'Sortie', ENTRY: 'Entrée', EXIT: 'Sortie', ADJUSTMENT: 'Ajustement (+)', ADJUSTMENT_OUT: 'Ajustement (−)', SALE: 'Vente',
  OUT_SALE: 'Vente', OUT_LOSS: 'Perte / casse', OUT_RETURN: 'Retour fournisseur', RETURN_IN: 'Retour client',
  TRANSFER_OUT: 'Transfert sortant', TRANSFER_IN: 'Transfert entrant',
  PURCHASE: 'Achat', RETURN: 'Retour', LOSS: 'Perte', DAMAGE: 'Casse', DAMAGED: 'Endommagé', GAIN: 'Gain',
  GENERATED: 'Générée', ACCOUNTANT: 'Comptable', COMMERCIAL: 'Commercial', WAREHOUSE: 'Magasin', DELIVERY: 'Livraison',
  CREATE: 'Création', UPDATE: 'Modification', DELETE: 'Suppression', LOGIN: 'Connexion', LOGOUT: 'Déconnexion',
}

export const colLabel = (k) =>
  Object.prototype.hasOwnProperty.call(COLS, k)
    ? COLS[k]
    : k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())

// Traduit uniquement les valeurs de type ENUM connues (MAJUSCULES_AVEC_TIRETS)
export const tv = (v) =>
  typeof v === 'string' && /^[A-Z][A-Z0-9_]*$/.test(v) && Object.prototype.hasOwnProperty.call(VALS, v) ? VALS[v] : v