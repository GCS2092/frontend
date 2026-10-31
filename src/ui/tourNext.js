const NEXT = {
  '/admin': { to: '/admin/products', label: 'Créer vos produits' },
  '/admin/categories': { to: '/admin/products', label: 'Créer vos produits' },
  '/admin/products': { to: '/admin/stock', label: 'Saisir le stock initial' },
  '/admin/stock': { to: '/admin/sales', label: 'Faire une première vente' },
  '/admin/sales': { to: '/admin/orders', label: 'Suivre les commandes' },
  '/admin/orders': { to: '/admin/invoices', label: 'Voir les factures' },
  '/admin/invoices': { to: '/admin/reports', label: 'Produire un rapport' },
  '/admin/credit-notes': { to: '/admin/invoices', label: 'Retourner aux factures' },
  '/admin/suppliers': { to: '/admin/purchase-orders', label: 'Créer un bon de commande' },
  '/admin/purchase-orders': { to: '/admin/stock', label: 'Voir les mouvements de stock' },
  '/admin/transfers': { to: '/admin/stock', label: 'Voir les mouvements de stock' },
  '/admin/inventory': { to: '/admin/stock', label: 'Voir les mouvements de stock' },
  '/admin/expenses': { to: '/admin', label: 'Voir l’effet sur le résultat net' },
  '/admin/stores': { to: '/admin/users', label: 'Ajouter du personnel' },
  '/admin/users': { to: '/admin/settings', label: 'Régler les paramètres' },
  '/admin/reports': { to: '/admin', label: 'Retourner au tableau de bord' },
}
export default NEXT