import React from 'react';

// Mensajes de la cinta. Edítalos aquí.
const MESSAGES = [
    '🌿 DE LA SELVA A TU CASA',
    '💬 COMPRA FÁCIL POR WHATSAPP',
    '🔥 PROMOS TODA LA SEMANA',
    '✨ NUEVOS INGRESOS'
];

const AnnouncementBar: React.FC = () => (
    <div className="announce" aria-label="Avisos">
        <div className="announce-track">
            {[0, 1].map(copy => (
                <div className="announce-group" key={copy} aria-hidden={copy === 1}>
                    {MESSAGES.map(m => <span key={m} className="announce-item">{m}</span>)}
                </div>
            ))}
        </div>
    </div>
);

export default AnnouncementBar;
