document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. CONFIGURAZIONE ORARI DEL MINIMARKET (Modificabile Qui)
    // =================================================================
    
    // Gli orari sono definiti in formato 'HH:MM' (24 ore).
    // NOTA: Gli orari devono riflettere quelli presenti nella tabella HTML.
    
    const orariSettimanali = {
        // Lunedì - Venerdì
        1: [{apertura: '08:00', chiusura: '12:00'}, {apertura: '15:00', chiusura: '20:00'}],
        2: [{apertura: '08:00', chiusura: '12:00'}, {apertura: '15:00', chiusura: '20:00'}],
        3: [{apertura: '08:00', chiusura: '12:00'}, {apertura: '15:00', chiusura: '20:00'}],
        4: [{apertura: '08:00', chiusura: '12:00'}, {apertura: '15:00', chiusura: '20:00'}],
        5: [{apertura: '08:00', chiusura: '12:00'}, {apertura: '15:00', chiusura: '20:00'}],
        
        // Sabato: 8:00 - 13:00 (Pomeriggio Chiuso)
        6: [{apertura: '08:00', chiusura: '12:00'}, {apertura: '15:00' , chiusura: '20:00'}],
        
        // Domenica: Chiuso
        0: [] // 0 = Domenica
    };

    // =================================================================
    // 2. FUNZIONI DI GESTIONE
    // =================================================================

    const statoNegozioElement = document.getElementById('stato-negozio');
    const orarioCorrenteElement = document.getElementById('orario-corrente');
    
    // Funzione per formattare il tempo in HH:MM:SS
    function formatTime(date) {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    // Funzione per convertire HH:MM in minuti da mezzanotte
    function timeToMinutes(timeString) {
        if (!timeString) return -1;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Funzione principale che aggiorna l'orario e lo stato
    function aggiornaStatoNegozio() {
        // Ottiene l'ora attuale in Italia (Europa/Rome)
        const now = new Date();
        const oraItalia = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
        
        const giornoSettimana = oraItalia.getDay(); // 0 (Dom) a 6 (Sab)
        const minutiCorrenti = oraItalia.getHours() * 60 + oraItalia.getMinutes();
        
        const orariOggi = orariSettimanali[giornoSettimana];
        
        let stato = 'CHIUSO';
        let messaggio = '';
        let prossimoOrario = null;
        
        // 1. Visualizza l'orario attuale in HH:MM:SS
        orarioCorrenteElement.textContent = `Orario: ${formatTime(oraItalia)}`;

        // 2. Determina lo stato e il prossimo orario
        if (orariOggi && orariOggi.length > 0) {
            
            // Cerca se è aperto ora
            for (const fascia of orariOggi) {
                const aperturaMin = timeToMinutes(fascia.apertura);
                const chiusuraMin = timeToMinutes(fascia.chiusura);
                
                if (minutiCorrenti >= aperturaMin && minutiCorrenti < chiusuraMin) {
                    stato = 'APERTO';
                    
                    // Calcola il tempo rimanente alla chiusura
                    const tempoRimanenteMinuti = chiusuraMin - minutiCorrenti;
                    const h = Math.floor(tempoRimanenteMinuti / 60);
                    const m = tempoRimanenteMinuti % 60;
                    
                    messaggio = `Chiudiamo tra ${h} ore e ${m} minuti (${fascia.chiusura}).`;
                    break; // Trovato lo stato APERTO, esce dal loop
                }
            }
            
            // Se è chiuso (o non è stata trovata una fascia aperta), cerca la prossima apertura
            if (stato === 'CHIUSO') {
                // Cerca la prossima apertura OGGI
                for (const fascia of orariOggi) {
                    const aperturaMin = timeToMinutes(fascia.apertura);
                    if (minutiCorrenti < aperturaMin) {
                        const tempoRimanenteMinuti = aperturaMin - minutiCorrenti;
                        const h = Math.floor(tempoRimanenteMinuti / 60);
                        const m = tempoRimanenteMinuti % 60;
                        messaggio = `Apriamo tra ${h} ore e ${m} minuti (${fascia.apertura}).`;
                        break;
                    }
                }
                
                // Se non ci sono altre aperture OGGI, cerca DOMANI o nel giorno di riapertura
                if (messaggio === '') {
                    // Cerca il prossimo giorno di apertura
                    for (let i = 1; i <= 7; i++) {
                        const nextDay = (giornoSettimana + i) % 7;
                        if (orariSettimanali[nextDay] && orariSettimanali[nextDay].length > 0) {
                            const aperturaDomani = orariSettimanali[nextDay][0].apertura;
                            const nomeGiorno = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][nextDay];
                            messaggio = `Apriremo ${nomeGiorno} alle ${aperturaDomani}.`;
                            break;
                        }
                    }
                }
            }

        } else {
            // Se orariOggi è vuoto (Domenica per esempio)
            stato = 'CHIUSO';
            messaggio = 'Siamo chiusi tutto il giorno.';
        }
        
        // 3. Aggiorna l'HTML con lo stato e il messaggio
        statoNegozioElement.innerHTML = `<span style="color: ${stato === 'APERTO' ? 'var(--colore-primario)' : '#d32f2f'};">${stato}:</span> ${messaggio}`;
    }

    // Funzione per formattare la fascia oraria (es. 08:00 - 13:00 / 16:00 - 20:00)
function formattaFasceOrarie(fasce) {
    if (!fasce || fasce.length === 0) {
        return 'Chiuso';
    }
    // Mappa ogni fascia nel formato "Apertura - Chiusura" e le unisce con " / "
    return fasce.map(f => `${f.apertura} - ${f.chiusura}`).join(' / ');
}


//Sincronizza gli orari dalla configurazione JS alla tabella HTML
function sincronizzaOrariHTML() {
    
    // 1. Orari Lunedì - Venerdì (prendiamo il Lunedì come riferimento)
    const orariLunVen = formattaFasceOrarie(orariSettimanali[1]); 
    const cellaLunVen = document.querySelector('#orari-lun-ven td:last-child');
    if (cellaLunVen) {
        cellaLunVen.textContent = orariLunVen;
    }

    // 2. Orari Sabato
    const orariSabato = formattaFasceOrarie(orariSettimanali[6]);
    const cellaSabato = document.querySelector('#orari-sabato td:last-child');
    if (cellaSabato) {
        cellaSabato.textContent = orariSabato;
    }

    // 3. Orari Domenica
    const orariDomenica = formattaFasceOrarie(orariSettimanali[0]);
    const cellaDomenica = document.querySelector('#orari-domenica td:last-child');
    if (cellaDomenica) {
        // La logica formatta la fascia (se vuota, restituisce "Chiuso")
        cellaDomenica.textContent = orariDomenica;
    }
}

    // Esegue la funzione immediatamente al caricamento e poi ogni secondo
    aggiornaStatoNegozio();
    sincronizzaOrariHTML();
    setInterval(aggiornaStatoNegozio, 1000); // 1000ms = 1 secondo


});



