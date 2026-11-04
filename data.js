/* Ukázková data prototypu. Vše je smyšlené. */
window.ZOVE_DATA = {
  categories: [
    { id: 'umeni', label: 'Umění' },
    { id: 'kola', label: 'Kola' },
    { id: 'elektronika', label: 'Elektronika' },
    { id: 'sperky', label: 'Šperky' },
    { id: 'zvirata', label: 'Zvířata' },
    { id: 'ostatni', label: 'Ostatní' }
  ],

  records: [
    {
      id: '24-0118', status: 'stolen', cat: 'umeni', icon: 'art',
      title: 'Olejomalba – kytice v džbánu',
      desc: 'Zátiší s květinami, olej na kartonu, zlacený rám. Signatura vpravo dole, na zadní straně stará výstavní nálepka.',
      place: 'Praha 2', when: 'přibližně 2011', added: '2026-11-02', size: '56 × 52 cm', police: true
    },
    {
      id: '24-0121', status: 'stolen', cat: 'kola', icon: 'bike',
      title: 'Horské kolo, tmavě modrý rám',
      desc: 'Horské kolo s tmavě modrým rámem, černé blatníky, na řídítkách zvonek ve tvaru berušky.',
      place: 'Brno-střed', when: '3. 11. 2026', added: '2026-11-03', serial: 'WTU0458812', police: true
    },
    {
      id: '24-0120', status: 'lost', cat: 'sperky', icon: 'ring',
      title: 'Zlatý prsten s monogramem',
      desc: 'Zlatý prsten, uvnitř vyrytý monogram „J. K.“ a datum. Ztracen pravděpodobně v tramvaji.',
      place: 'Olomouc', when: '3. 11. 2026', added: '2026-11-03'
    },
    {
      id: '24-0117', status: 'stolen', cat: 'elektronika', icon: 'camera',
      title: 'Fotoaparát v koženém pouzdře',
      desc: 'Starší fotoaparát v hnědém koženém pouzdře, na řemínku zelená nášivka.',
      place: 'Praha 7', when: '1. 11. 2026', added: '2026-11-02', serial: 'CX19004471'
    },
    {
      id: '24-0116', status: 'lost', cat: 'zvirata', icon: 'paw',
      title: 'Bígl, reaguje na jméno Ben',
      desc: 'Pes, bígl, 4 roky, červený obojek se známkou. Je přátelský, ale bojí se aut.',
      place: 'Benešov', when: '2. 11. 2026', added: '2026-11-02'
    },
    {
      id: '24-0115', status: 'lost', cat: 'ostatni', icon: 'music',
      title: 'Housle v černém kufru',
      desc: 'Housle 4/4 v černém tvrdém kufru se samolepkou hudební školy.',
      place: 'Plzeň', when: '1. 11. 2026', added: '2026-11-01'
    },
    {
      id: '24-0112', status: 'stolen', cat: 'umeni', icon: 'art',
      title: 'Krajina s řekou, olej na kartonu',
      desc: 'Podzimní krajina s řekou a odrazy stromů, olej na kartonu, nečitelná signatura.',
      place: 'Středočeský kraj', when: 'přibližně 2011', added: '2026-10-31', size: '35 × 52 cm'
    },
    {
      id: '24-0110', status: 'stolen', cat: 'elektronika', icon: 'laptop',
      title: 'Notebook se samolepkou na víku',
      desc: 'Stříbrný notebook, na víku samolepka s horou. Odcizen z auta.',
      place: 'Liberec', when: '29. 10. 2026', added: '2026-10-30', serial: '5CD2381141', police: true
    },
    {
      id: '24-0109', status: 'found', cat: 'umeni', icon: 'art',
      title: 'Kytice ve váze, zlacený rám',
      desc: 'Nalezeno v nabídce bazaru. Olej, zlacený rám, signatura vpravo dole nečitelná.',
      place: 'Praha 5', when: '28. 10. 2026', added: '2026-10-29'
    },
    {
      id: '24-0105', status: 'lost', cat: 'elektronika', icon: 'phone',
      title: 'Telefon v zeleném obalu',
      desc: 'Mobilní telefon v zeleném silikonovém obalu, prasklý roh displeje.',
      place: 'Ostrava', when: '27. 10. 2026', added: '2026-10-27', serial: '351234567890123'
    },
    {
      id: '24-0101', status: 'stolen', cat: 'sperky', icon: 'watch',
      title: 'Náramkové hodinky s gravírováním',
      desc: 'Pánské hodinky, ocelový řemínek, na zadní straně gravírování „Tátovi“.',
      place: 'Hradec Králové', when: '24. 10. 2026', added: '2026-10-25'
    },
    {
      id: '24-0098', status: 'found', cat: 'kola', icon: 'bike',
      title: 'Dětské kolo, červené',
      desc: 'Nalezeno u zastávky. Dětské kolo, červený rám, chybí zvonek.',
      place: 'Praha 4', when: '22. 10. 2026', added: '2026-10-22'
    }
  ],

  messages: [
    {
      id: 'm1', recordId: '24-0118', from: 'Nálezce',
      text: 'Dobrý den, podobný obraz jsem viděl v inzerátu na bazarovém portálu, posílám odkaz.',
      when: 'dnes 9:41', unread: true
    }
  ],

  auction: [
    ['12', 'Krajina s řekou u mlýna', 'neurčeno', 'Bez shody'],
    ['13', 'Zimní ves', 'neurčeno', 'K prověření'],
    ['14', 'Kytice v džbánu', 'neurčeno', 'Shoda'],
    ['15', 'Portrét dámy v klobouku', 'neurčeno', 'Bez shody'],
    ['16', 'Přístav', 'neurčeno', 'Bez shody'],
    ['17', 'Zátiší s ovocem', 'neurčeno', 'K prověření'],
    ['18', 'Pražské nábřeží', 'neurčeno', 'Bez shody'],
    ['19', 'Lesní cesta', 'neurčeno', 'Bez shody']
  ],

  plans: [
    { who: 'Bazar, zastavárna', name: 'Start', price: '25 Kč', unit: 'za kontrolu', lines: ['Bez měsíčního poplatku', 'Výpis ke každé kontrole', 'Pro občasné výkupy'] },
    { who: 'Bazar, zastavárna', name: 'Provozovna', price: '990 Kč', unit: 'měsíčně', dark: true, lines: ['150 kontrol v ceně, další po 9 Kč', 'Historie a export pro kontrolu', 'Upozornění při shodě i zpětně'] },
    { who: 'Sítě a e-shopy', name: 'Síť', price: '4 990 Kč', unit: 'měsíčně', lines: ['1 500 kontrol, další po 5 Kč', 'Neomezeně poboček a uživatelů', 'API napojení na pokladnu'] },
    { who: 'Aukční síně, galerie', name: 'Katalog', price: '39 Kč', unit: 'za položku', lines: ['Minimum 9 900 Kč ročně', 'Hlídání položek až do dražby', 'Odborné prověření 990 Kč / položka'] }
  ]
};
