export const commonDDIs = [
    { code: '55', country: 'Brasil', flag: '🇧🇷' },
    { code: '351', country: 'Portugal', flag: '🇵🇹' },
    { code: '1', country: 'EUA/Canadá', flag: '🇺🇸' },
    { code: '34', country: 'Espanha', flag: '🇪🇸' },
    { code: '33', country: 'França', flag: '🇫🇷' },
    { code: '44', country: 'Reino Unido', flag: '🇬🇧' },
    { code: '39', country: 'Itália', flag: '🇮🇹' },
    { code: '49', country: 'Alemanha', flag: '🇩🇪' },
    { code: '41', country: 'Suíça', flag: '🇨🇭' },
    { code: '353', country: 'Irlanda', flag: '🇮🇪' },
];

export const extractPhoneAndDDI = (fullPhone: string) => {
    let tel = fullPhone || '';
    let matchedDDI = '55'; // Padrão Brasil
    
    // Ordenar por tamanho decrescente para não pegar '1' em vez de '1xxx' se houvesse sobreposição
    const sortedDDIs = [...commonDDIs].sort((a, b) => b.code.length - a.code.length);
    
    for (const ddi of sortedDDIs) {
      if (tel.startsWith(ddi.code) && tel.length > ddi.code.length) {
        matchedDDI = ddi.code;
        tel = tel.substring(ddi.code.length);
        break;
      }
    }
    
    return { ddi: matchedDDI, phone: tel };
};
