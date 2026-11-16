// Ligne « fonction · organisation » d'un deal, sans séparateur quand l'organisation est vide. M22 : module à part,
// pour que les écrans du premier affichage n'importent pas schema.js (contrôles des deals, chargé avec l'index).
const isText = (v) => typeof v === 'string' && v.trim().length > 0;

export const contactLine = (contact) => [contact.role, contact.org].filter(isText).join(' · ');
