/**
 * Registro unico delle fonti normative del motore di calcolo.
 *
 * Ogni parametro in constants-2026.ts referenzia una fonte da qui tramite id.
 * La UI, il README e il PDF metodologico leggono tutti da questo file: una fonte
 * si aggiorna in un posto solo.
 *
 * Regola vincolante del progetto: solo domini istituzionali. Vedi DOMINI_ISTITUZIONALI
 * e il test in __tests__/fonti.test.ts che la fa rispettare.
 */

export type TipoFonte = 'norma' | 'prassi' | 'atto-locale'

export type Fonte = {
  id: string
  norma: string
  descrizione: string
  url: string
  tipo: TipoFonte
}

export const DOMINI_ISTITUZIONALI = [
  'normattiva.it',
  'gazzettaufficiale.it',
  'agenziaentrate.gov.it',
  'finanze.gov.it',
  'finanze.it',
  'inps.it',
  'mef.gov.it',
] as const

export const FONTI: Record<string, Fonte> = {
  ldb2025: {
    id: 'ldb2025',
    norma: 'L. 30/12/2024 n. 207, art. 1',
    descrizione:
      'Legge di bilancio 2025: rimodulazione scaglioni IRPEF a regime, innalzamento della detrazione lavoro dipendente a 1.955 €, correttivo di 75 € per il trattamento integrativo, somma integrativa e ulteriore detrazione da cuneo fiscale.',
    url: 'https://www.normattiva.it/eli/stato/LEGGE/2024/12/30/207/CONSOLIDATED',
    tipo: 'norma',
  },
  ldb2026: {
    id: 'ldb2026',
    norma: 'L. 30/12/2025 n. 199, art. 1 c.3',
    descrizione:
      'Legge di bilancio 2026: riduzione dell\'aliquota del secondo scaglione IRPEF dal 35% al 33% (modifica art. 11 c.1 lett. b TUIR).',
    url: 'https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED',
    tipo: 'norma',
  },
  tuirArt11: {
    id: 'tuirArt11',
    norma: 'art. 11 TUIR (d.P.R. 917/1986)',
    descrizione: 'Scaglioni e aliquote per il calcolo dell\'imposta lorda IRPEF.',
    url: 'https://www.agenziaentrate.gov.it/portale/imposta-sul-reddito-delle-persone-fisiche-irpef-/aliquote-e-calcolo-dell-irpef',
    tipo: 'norma',
  },
  tuirArt13: {
    id: 'tuirArt13',
    norma: 'art. 13 c.1, c.1.1, c.6 e c.6-bis TUIR',
    descrizione:
      'Detrazione per redditi di lavoro dipendente, decrescente e azzerata a 50.000 €; il reddito di riferimento è il reddito complessivo al netto dell\'abitazione principale. Il c.1.1 aggiunge 65 € per redditi tra 25.000 e 35.000; il c.6 prescrive che il rapporto delle formule si assuma nelle prime quattro cifre decimali (troncamento); il minimo di 690 € (1.380 € per il tempo determinato) vale nel solo primo scaglione. Link al testo vigente su Normattiva: il PDF statico dell\'Agenzia delle Entrate citato in precedenza riportava la versione 2008 dell\'articolo.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art13!vig=',
    tipo: 'norma',
  },
  tuirArt51: {
    id: 'tuirArt51',
    norma: 'art. 51 c.2 lett. a) TUIR',
    descrizione:
      'I contributi previdenziali e assistenziali obbligatori versati dal datore di lavoro e dal lavoratore non concorrono a formare il reddito di lavoro dipendente.',
    url: 'https://www.agenziaentrate.gov.it/portale/schede/comunicazioni/dati-relativi-ai-contributi-previdenziali-dal-2015-/normativa-daticontributiprevidenzialidal2015',
    tipo: 'norma',
  },
  cuneoFiscale: {
    id: 'cuneoFiscale',
    norma: 'L. 207/2024 art. 1 c.4-6',
    descrizione:
      'Somma integrativa (redditi fino a 20.000 €, 7,1/5,3/4,8% del reddito di lavoro dipendente) e ulteriore detrazione (redditi 20.000-40.000 €, fino a 1.000 €), confermate per il 2026.',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91',
    tipo: 'prassi',
  },
  trattamentoIntegrativo: {
    id: 'trattamentoIntegrativo',
    norma: 'D.L. 3/2020 conv. L. 21/2020, art. 1 c.1, come modificato da L. 207/2024 art. 1 c.3',
    descrizione:
      'Trattamento integrativo di 1.200 € per redditi complessivi fino a 15.000 €, condizionato alla capienza tra imposta lorda sui redditi di lavoro dipendente e detrazione art. 13 ridotta di 75 €.',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91',
    tipo: 'prassi',
  },
  circolareAde4e2022: {
    id: 'circolareAde4e2022',
    norma: 'Circolare Agenzia delle Entrate n. 4/E del 18/02/2022',
    descrizione:
      'Istruzioni sulla riforma IRPEF della legge di bilancio 2022, che ha introdotto la struttura attuale dell\'art. 13 e la maggiorazione di 65 € (c.1.1). Chiarisce che i 65 € vanno corrisposti «per intero … senza effettuare alcun ragguaglio al periodo di lavoro nell\'anno»: è la ragione per cui nel motore la maggiorazione si somma dopo il riproporzionamento.',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/4169770/Circolare+n.+4+del+18+febbraio+2022.pdf/a83fd984-2bc3-39a9-1e09-79e9a870d401',
    tipo: 'prassi',
  },
  circolareAde4e2025: {
    id: 'circolareAde4e2025',
    norma: 'Circolare Agenzia delle Entrate n. 4/E del 16/05/2025',
    descrizione:
      'Istruzioni operative su IRPEF e tassazione dei redditi di lavoro dipendente dopo la legge di bilancio 2025: tabelle di scaglioni e detrazioni, esempi di calcolo della somma integrativa.',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91',
    tipo: 'prassi',
  },
  addizionaleRegionaleLombardia: {
    id: 'addizionaleRegionaleLombardia',
    norma: 'art. 72 c.1 L.R. Lombardia 14/07/2003 n. 10',
    descrizione:
      'Addizionale regionale IRPEF della Lombardia, a scaglioni progressivi (1,23% - 1,73%), aliquote pubblicate dal Dipartimento delle Finanze il 28/01/2026.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10',
    tipo: 'atto-locale',
  },
  addizionaliRegionali2026: {
    id: 'addizionaliRegionali2026',
    norma: 'Leggi regionali 2025/2026 di ciascuna regione, art. 6 D.Lgs. 68/2011, art. 50 D.Lgs. 446/1997',
    descrizione:
      'Addizionale regionale IRPEF di tutte le regioni e province autonome italiane (escl. Lombardia, Lazio e Friuli-VG, con fonte propria), aliquote pubblicate dal Dipartimento delle Finanze per l\'anno d\'imposta 2026. Tutte le 21 entità sono state riverificate una per una sui prospetti DF durante l\'audit del 7-9 agosto 2026: le regioni che differenziano l\'aliquota per scaglione seguono il meccanismo marginale dell\'IRPEF nazionale (art. 6 D.Lgs. 68/2011), con le eccezioni di meccanica documentate nelle fonti dedicate.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/sceltaregione.htm',
    tipo: 'atto-locale',
  },
  addizionaleRegionaleLazio: {
    id: 'addizionaleRegionaleLazio',
    norma: 'L.R. Lazio 31/12/2025 n. 20, art. 2 c.2-3',
    descrizione:
      'Addizionale regionale IRPEF del Lazio per il 2026: per imponibili fino a 28.000 € si applica l\'1,73% sull\'intero imponibile (non gli scaglioni marginali); sopra, scaglioni 1,73%/3,33% con detrazione di 60 € nella fascia 28.000-30.000. Meccanica verificata sul prospetto del Dipartimento delle Finanze, anno d\'imposta 2026.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=08&anno=2026',
    tipo: 'atto-locale',
  },
  addizionaleRegionaleFriuli: {
    id: 'addizionaleRegionaleFriuli',
    norma: 'L.R. Friuli-Venezia Giulia 25/07/2012 n. 14, art. 1 c.5',
    descrizione:
      'Addizionale regionale IRPEF del Friuli-Venezia Giulia: aliquota unica 1,23% sull\'intero imponibile, ridotta di 0,53 punti (quindi 0,70%, sempre sull\'intero imponibile) per redditi fino a 15.000 €. Non è una progressione a scaglioni marginali: la meccanica ad aliquota di fascia è dichiarata testualmente dal prospetto del Dipartimento delle Finanze, anno d\'imposta 2026.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=07&anno=2026',
    tipo: 'atto-locale',
  },
  addizionaliComunali2026: {
    id: 'addizionaliComunali2026',
    norma: 'Delibere comunali 2025/2026, art. 1 c.142-143 L. 296/2006',
    descrizione:
      'Addizionale comunale IRPEF di 11 capoluoghi (Milano, Roma, Napoli, Torino, Genova, Bologna, Firenze, Palermo, Bari, Venezia, Cagliari), ciascuno verificato singolarmente sul tool di ricerca del Dipartimento delle Finanze con il codice catastale del comune. Copertura parziale e dichiarata: l\'Italia ha oltre 8.000 comuni, nessun dataset bulk scaricabile è stato trovato sul sito del Dip. Finanze; per i comuni non elencati il calcolatore offre l\'inserimento manuale di aliquota e soglia.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/sceltaregione.htm',
    tipo: 'atto-locale',
  },
  addizionaleComunaleMilano: {
    id: 'addizionaleComunaleMilano',
    norma: 'Delibera Comune di Milano n. 46 del 28/09/2020',
    descrizione:
      'Addizionale comunale IRPEF di Milano: aliquota unica 0,80%, con esenzione totale (soglia, non franchigia) per reddito imponibile fino a 23.000 €.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&pr=MI&cc=F205&r=1',
    tipo: 'atto-locale',
  },
  inpsCirc6_2026: {
    id: 'inpsCirc6_2026',
    norma: 'Circolare INPS n. 6 del 30/01/2026',
    descrizione:
      'Minimali e massimali contributivi 2026: prima fascia di retribuzione pensionabile a 56.224 €, oltre la quale si applica l\'aliquota aggiuntiva IVS dell\'1%; massimale annuo 122.295 € per gli iscritti dal 1996.',
    url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html',
    tipo: 'prassi',
  },
  tuirArt12: {
    id: 'tuirArt12',
    norma: 'art. 12 TUIR (d.P.R. 917/1986)',
    descrizione:
      'Detrazioni per carichi di famiglia: coniuge a carico (c.1 lett. a-b), figli a carico 21-30 anni (c.1 lett. c; per gli under 21 sostituita dall\'assegno unico universale, D.Lgs. 230/2021), ascendenti conviventi (c.1 lett. d, come ristretta dalla L. 207/2024). Il c.4 prescrive il troncamento dei rapporti alle prime quattro cifre decimali, come l\'art. 13 c.6. Link al testo vigente su Normattiva.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art12!vig=',
    tipo: 'norma',
  },
  welfare: {
    id: 'welfare',
    norma: 'art. 51 c.3 TUIR; L. 207/2024; circ. Agenzia Entrate n. 35/E del 04/11/2022',
    descrizione:
      'Fringe benefit fino a 1.000 € (2.000 € con figli a carico) non concorrono al reddito di lavoro dipendente. Se il valore complessivo supera la soglia, l\'intero importo diventa imponibile, non solo l\'eccedenza (soglia, non franchigia; principio confermato dalla circolare 35/E anche per le soglie di annualità precedenti).',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/4785312/circolare_welfare_aziendale_+n.+35+del+4+novembre+2022+.pdf/657de91b-6e75-2330-ce10-450e5f7a561b',
    tipo: 'prassi',
  },
  apprendistato: {
    id: 'apprendistato',
    norma: 'art. 21 c.6 L. 41/1986; msg. INPS n. 3618 del 17/10/2023',
    descrizione:
      'Aliquota contributiva a carico del lavoratore apprendista: 5,84% flat, indipendente dall\'anno di apprendistato e dalla dimensione dell\'azienda (a differenza degli sgravi a carico del datore, quelli sì variabili per azienda). Il valore è confermato dal messaggio INPS 3618/2023, che ne indica la base normativa nell\'art. 21 della L. 41/1986. La rilettura della fonte primaria in fase di audit ha corretto l\'attribuzione iniziale all\'art. 1 c.773 L. 296/2006: quel comma disciplina solo la contribuzione a carico del datore (10%), non la quota dell\'apprendista.',
    url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2023.10.messaggio-numero-3618-del-17-10-2023_14297.html',
    tipo: 'prassi',
  },
  tfr: {
    id: 'tfr',
    norma: 'art. 2120 c.c.',
    descrizione:
      'Il trattamento di fine rapporto si accantona nella misura della retribuzione annua divisa per 13,5 (al netto della rivalutazione).',
    // URN con numero d'allegato (:2): il codice civile è un allegato del R.D.
    // 262/1942, senza ":2" il deep-link ~art2120 cade sugli artt. 1-2 del decreto.
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262:2~art2120!vig=',
    tipo: 'norma',
  },
}
